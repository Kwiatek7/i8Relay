import { NextRequest } from 'next/server';
import {
  authenticateRequest,
  createAuthResponse,
  createErrorResponse,
  AuthError
} from '../../../../lib/auth/middleware';
import { createPaymentIntent } from '../../../../lib/stripe/client';
import { getStripeConfig } from '../../../../lib/stripe/config';
import { getDb } from '../../../../lib/database/connection';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);
    const userId = auth.user.id;

    // 检查 Stripe 是否已配置
    const stripeConfig = await getStripeConfig();
    if (!stripeConfig || !stripeConfig.enabled) {
      return createErrorResponse(new Error('支付服务暂不可用'), 503);
    }

    // 解析请求数据
    const { amount, currency, description, planId, subscriptionId } = await request.json();

    // 验证参数
    if (!amount || amount <= 0) {
      return createErrorResponse(new Error('无效的金额'), 400);
    }

    // 获取用户信息
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return createErrorResponse(new Error('用户不存在'), 404);
    }

    // 准备支付意图参数
    const paymentParams = {
      amount: amount,
      currency: currency || stripeConfig.currency,
      description: description || '套餐购买',
      metadata: {
        userId: userId,
        userEmail: user.email,
        planId: planId || '',
        subscriptionId: subscriptionId || '',
        timestamp: new Date().toISOString()
      }
    };

    // 创建支付意图
    const paymentIntent = await createPaymentIntent(paymentParams);

    if (!paymentIntent) {
      return createErrorResponse(new Error('创建支付意图失败'), 500);
    }

    // 记录支付记录到数据库
    await db.run(`
      INSERT INTO billing_records (
        id, user_id, type, amount, currency, description, status,
        payment_method, payment_id, subscription_id, metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentIntent.id,
      userId,
      'subscription',
      amount,
      currency || stripeConfig.currency,
      description || '套餐购买',
      'pending',
      'stripe',
      paymentIntent.id,
      subscriptionId || null,
      JSON.stringify({
        planId: planId || '',
        stripePaymentIntentId: paymentIntent.id
      }),
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    // 返回客户端所需的信息
    return createAuthResponse({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    }, '支付意图创建成功');

  } catch (error) {
    console.error('创建支付意图错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('创建支付意图失败'), 500);
  }
}