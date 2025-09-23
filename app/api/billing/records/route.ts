import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // 获取账单记录
    const records = await getUserBillingRecords(auth.user.id, page, limit);

    return createAuthResponse(records, '账单记录获取成功');

  } catch (error) {
    console.error('获取账单记录错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取账单记录失败'), 500);
  }
}

async function getUserBillingRecords(userId: string, page: number, limit: number) {
  const db = await getDb();
  const offset = (page - 1) * limit;

  try {
    // 获取总数
    const totalResult = await db.get(
      'SELECT COUNT(*) as count FROM billing_records WHERE user_id = ?',
      [userId]
    ) as { count: number };

    // 获取记录
    const records = await db.all(
      `SELECT
        id,
        type,
        amount,
        currency,
        description,
        status,
        plan_id,
        transaction_id,
        payment_method,
        created_at,
        updated_at
       FROM billing_records
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // 关联套餐信息
    const recordsWithPlan = await Promise.all(
      records.map(async (record) => {
        if (record.plan_id) {
          try {
            const plan = await db.get(
              'SELECT name, display_name FROM plans WHERE id = ?',
              [record.plan_id]
            );
            return {
              ...record,
              plan_name: plan?.display_name || plan?.name || record.plan_id
            };
          } catch (error) {
            return record;
          }
        }
        return record;
      })
    );

    // 转换字段名为前端期望的camelCase格式
    const formattedRecords = recordsWithPlan.map((record: any) => ({
      id: record.id,
      type: record.type,
      amount: record.amount,
      currency: record.currency || 'CNY',
      description: record.description || '',
      status: record.status,
      planId: record.plan_id,
      planName: record.plan_name,
      transactionId: record.transaction_id,
      paymentMethod: record.payment_method || '',
      created_at: record.created_at,
      updated_at: record.updated_at
    }));

    return formattedRecords;

  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}