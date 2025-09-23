import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { planModel } from '../../../../lib/database/models/plan';
import { userModel } from '../../../../lib/database/models/user';
import { getDb } from '../../../../lib/database/connection';
import { triggerPaymentFailedNotification, checkBalanceNotification } from '../../../../lib/notifications/triggers';

export async function POST(request: NextRequest) {
  let auth: any = null;
  let plan: any = null;
  
  try {
    // 验证用户身份
    auth = await authenticateRequest(request);

    // 获取请求数据
    const { plan_id, payment_method } = await request.json();

    // 验证请求数据
    if (!plan_id) {
      return createErrorResponse(new Error('套餐ID是必需的'), 400);
    }

    if (!payment_method) {
      return createErrorResponse(new Error('支付方式是必需的'), 400);
    }

    // 验证套餐存在且激活
    plan = await planModel.findPlanById(plan_id);
    if (!plan) {
      return createErrorResponse(new Error('套餐不存在'), 404);
    }

    if (!plan.is_active) {
      return createErrorResponse(new Error('套餐已停用'), 400);
    }

    // 获取用户当前信息
    const user = await userModel.findUserById(auth.user.id);
    if (!user) {
      return createErrorResponse(new Error('用户不存在'), 404);
    }

    // 检查用户是否已经是此套餐
    if (user.plan === plan.name) {
      return createErrorResponse(new Error('您已经订阅了此套餐'), 400);
    }

    // 验证支付方式和余额
    if (payment_method === 'balance') {
      if (user.balance < plan.price) {
        // 异步触发余额不足通知
        setImmediate(() => {
          triggerPaymentFailedNotification(
            auth.user.id,
            plan.price,
            `余额不足，当前余额：${user.balance}元，需要：${plan.price}元`
          ).catch(error => {
            console.warn('余额不足通知触发失败:', error);
          });
        });
        return createErrorResponse(new Error('账户余额不足'), 400);
      }
    } else {
      return createErrorResponse(new Error('暂不支持此支付方式'), 400);
    }

    const db = await getDb();

    // 手动处理事务逻辑（sqlite3不支持同步事务）
    try {
      // 扣除用户余额并更新用户套餐
      const newBalance = user.balance - plan.price;
      const updatedUserResult = await db.run(`
        UPDATE users SET
          plan = ?,
          balance = ?,
          updated_at = ?
        WHERE id = ?
      `, [plan.name, newBalance, new Date().toISOString(), auth.user.id]);

      if ((updatedUserResult.changes ?? 0) === 0) {
        throw new Error('用户信息更新失败');
      }

      // 记录账单
      const billingId = 'bill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await db.run(`
        INSERT INTO billing_records (
          id, user_id, plan_id, amount, status, payment_method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        billingId,
        auth.user.id,
        plan_id,
        plan.price,
        'completed',
        payment_method,
        new Date().toISOString()
      ]);

      // 获取更新后的用户信息
      const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [auth.user.id]);

      if (!updatedUser) {
        throw new Error('获取更新后的用户信息失败');
      }

      // 异步检查新余额是否需要触发余额不足警告
      setImmediate(() => {
        checkBalanceNotification(auth.user.id, updatedUser.balance).catch(error => {
          console.warn('余额检查通知触发失败:', error);
        });
      });

    // 返回成功响应
    return createAuthResponse({
      message: '套餐购买成功',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        plan: updatedUser.plan,
        balance: updatedUser.balance,
        updated_at: updatedUser.updated_at
      },
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        billing_period: plan.billing_period
      }
    }, '套餐购买成功');

    } catch (innerError) {
      console.error('事务执行错误:', innerError);
      throw innerError;
    }

  } catch (error) {
    console.error('套餐购买错误:', error);

    // 异步触发支付失败通知（如果是认证后的错误）
    if (auth?.user?.id) {
      setImmediate(() => {
        triggerPaymentFailedNotification(
          auth.user.id,
          plan?.price || 0,
          error instanceof Error ? error.message : '支付处理失败'
        ).catch(notifyError => {
          console.warn('支付失败通知触发失败:', notifyError);
        });
      });
    }

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('套餐购买失败'), 500);
  }
}