import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

// 临时提额金额 (美元)
const TEMPORARY_QUOTA_AMOUNT = 50.00;

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取用户当前信息
    const result = await increaseTemporaryQuota(auth.user.id);

    return createAuthResponse(result, '临时提额成功！');

  } catch (error) {
    console.error('临时提额错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    if (error instanceof BusinessError) {
      return createErrorResponse(new Error(error.message), error.statusCode);
    }

    return createErrorResponse(new Error(error instanceof Error ? error.message : '临时提额失败'), 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取用户临时额度信息
    const result = await getUserTemporaryQuotaInfo(auth.user.id);

    return createAuthResponse(result, '获取临时额度信息成功');

  } catch (error) {
    console.error('获取临时额度信息错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取临时额度信息失败'), 500);
  }
}

// 定义业务错误类
class BusinessError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
  }
}

async function increaseTemporaryQuota(userId: string) {
  const db = await getDb();
  
  try {
    // 获取今日日期
    const today = new Date().toISOString().split('T')[0];
    
    // 检查用户今日是否已经使用过临时提额
    const existingQuota = await db.get(`
      SELECT * FROM user_temporary_quotas 
      WHERE user_id = ? AND DATE(created_at) = ?
    `, [userId, today]);

    if (existingQuota) {
      throw new BusinessError('今日已经使用过临时提额，每天只能使用一次', 400);
    }

    // 获取用户当前信息
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new BusinessError('用户不存在', 404);
    }

    // 创建临时额度记录
    const quotaId = 'quota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await db.run(`
      INSERT INTO user_temporary_quotas (
        id, user_id, amount, currency, expires_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quotaId,
      userId,
      TEMPORARY_QUOTA_AMOUNT,
      'USD',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后过期
      'active',
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    // 记录账单
    const billingId = 'bill_temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await db.run(`
      INSERT INTO billing_records (
        id, user_id, record_type, amount, currency, description, status, payment_method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      billingId,
      userId,
      'topup',
      TEMPORARY_QUOTA_AMOUNT,
      'USD',
      `临时提额 $${TEMPORARY_QUOTA_AMOUNT} - 当天有效`,
      'completed',
      'system',
      new Date().toISOString()
    ]);

    // 获取用户当前临时额度总额
    const currentTempQuota = await getCurrentTemporaryQuota(userId);

    return {
      success: true,
      quota_id: quotaId,
      amount: TEMPORARY_QUOTA_AMOUNT,
      currency: 'USD',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      total_temporary_quota: currentTempQuota,
      message: `成功增加临时额度 $${TEMPORARY_QUOTA_AMOUNT}，当天有效`
    };

  } catch (error) {
    console.error('Database operation error:', error);
    throw error;
  }
}

async function getCurrentTemporaryQuota(userId: string) {
  const db = await getDb();
  
  try {
    // 获取今日有效的临时额度总额
    const today = new Date().toISOString().split('T')[0];
    const result = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total_temp_quota
      FROM user_temporary_quotas
      WHERE user_id = ? AND DATE(created_at) = ? AND status = 'active' AND expires_at > datetime('now')
    `, [userId, today]);

    return result?.total_temp_quota || 0;
  } catch (error) {
    console.error('获取临时额度总额失败:', error);
    return 0;
  }
}

async function getUserTemporaryQuotaInfo(userId: string) {
  const db = await getDb();
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 获取今日临时额度记录
    const tempQuotas = await db.all(`
      SELECT * FROM user_temporary_quotas
      WHERE user_id = ? AND DATE(created_at) = ? AND status = 'active'
      ORDER BY created_at DESC
    `, [userId, today]);

    // 计算今日临时额度总额
    const totalTempQuota = await getCurrentTemporaryQuota(userId);
    
    // 检查今日是否还可以使用临时提额（每天最多1次）
    const canUseToday = tempQuotas.length === 0;

    return {
      today_temp_quota: totalTempQuota,
      temp_quota_records: tempQuotas,
      can_use_today: canUseToday,
      daily_limit_per_increase: TEMPORARY_QUOTA_AMOUNT,
      max_increases_per_day: 1
    };
    
  } catch (error) {
    console.error('获取用户临时额度信息失败:', error);
    return {
      today_temp_quota: 0,
      temp_quota_records: [],
      can_use_today: true,
      daily_limit_per_increase: TEMPORARY_QUOTA_AMOUNT,
      max_increases_per_day: 1
    };
  }
}