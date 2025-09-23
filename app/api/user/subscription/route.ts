import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取用户当前订阅信息
    const subscriptionInfo = await getUserSubscriptionInfo(auth.user.id);

    return createAuthResponse(subscriptionInfo, '订阅信息获取成功');

  } catch (error) {
    console.error('获取订阅信息错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取订阅信息失败'), 500);
  }
}

async function getUserSubscriptionInfo(userId: string) {
  const db = await getDb();

  try {
    // 获取用户当前活跃订阅
    const currentSubscription = await db.get(`
      SELECT
        us.id as subscription_id,
        us.status,
        us.starts_at,
        us.expires_at,
        us.price,
        us.currency,
        p.id as plan_id,
        p.name as plan_name,
        p.display_name,
        p.description,
        p.requests_limit,
        p.tokens_limit,
        p.models,
        p.features,
        p.priority_support
      FROM user_subscriptions us
      LEFT JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? AND us.status = 'active'
      ORDER BY us.expires_at DESC
      LIMIT 1
    `, [userId]);

    // 获取用户当前计划（从users表）
    const user = await db.get(`
      SELECT current_plan_id, balance
      FROM users
      WHERE id = ?
    `, [userId]);

    // 如果没有活跃订阅，但用户有当前计划，获取计划信息
    let planInfo = null;
    if (!currentSubscription && user?.current_plan_id) {
      planInfo = await db.get(`
        SELECT
          id as plan_id,
          name as plan_name,
          display_name,
          description,
          price,
          requests_limit,
          tokens_limit,
          models,
          features,
          priority_support
        FROM plans
        WHERE id = ?
      `, [user.current_plan_id]);
    }

    const now = new Date();
    let subscriptionData = null;

    if (currentSubscription) {
      const expiresAt = new Date(currentSubscription.expires_at);
      const startsAt = new Date(currentSubscription.starts_at);
      const remainingDays = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const totalDays = Math.ceil((expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));

      subscriptionData = {
        subscription_id: currentSubscription.subscription_id,
        status: currentSubscription.status,
        plan: {
          id: currentSubscription.plan_id,
          name: currentSubscription.plan_name,
          display_name: currentSubscription.display_name,
          description: currentSubscription.description,
          requests_limit: currentSubscription.requests_limit,
          tokens_limit: currentSubscription.tokens_limit,
          models: JSON.parse(currentSubscription.models || '[]'),
          features: JSON.parse(currentSubscription.features || '[]'),
          priority_support: !!currentSubscription.priority_support
        },
        pricing: {
          amount: currentSubscription.price,
          currency: currentSubscription.currency
        },
        period: {
          starts_at: currentSubscription.starts_at,
          expires_at: currentSubscription.expires_at,
          remaining_days: remainingDays,
          total_days: totalDays,
          is_expired: remainingDays <= 0
        }
      };
    } else if (planInfo) {
      // 如果只有计划信息（可能是免费计划或无订阅期限）
      subscriptionData = {
        subscription_id: null,
        status: 'active',
        plan: {
          id: planInfo.plan_id,
          name: planInfo.plan_name,
          display_name: planInfo.display_name,
          description: planInfo.description,
          requests_limit: planInfo.requests_limit,
          tokens_limit: planInfo.tokens_limit,
          models: JSON.parse(planInfo.models || '[]'),
          features: JSON.parse(planInfo.features || '[]'),
          priority_support: !!planInfo.priority_support
        },
        pricing: {
          amount: planInfo.price,
          currency: 'CNY'
        },
        period: {
          starts_at: null,
          expires_at: null,
          remaining_days: null,
          total_days: null,
          is_expired: false
        }
      };
    }

    // 获取用户使用配额信息
    const quotaInfo = await getUserQuotaInfo(userId);

    return {
      subscription: subscriptionData,
      quota: quotaInfo,
      balance: user?.balance || 0
    };

  } catch (error) {
    console.error('Database query error:', error);
    return {
      subscription: null,
      quota: {
        daily_limit: 200.00,
        daily_used: 0.00,
        daily_remaining: 200.00,
        temporary_quota: 0.00,
        temp_increase_count: 5
      },
      balance: 0
    };
  }
}

async function getUserQuotaInfo(userId: string) {
  const db = await getDb();

  try {
    // 获取今日使用费用
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = await db.get(`
      SELECT COALESCE(SUM(cost), 0) as daily_cost
      FROM usage_logs
      WHERE user_id = ? AND DATE(created_at) = ?
    `, [userId, today]);

    // 这里可以根据用户的套餐设置不同的日限额
    // 目前使用默认值，后续可以从用户订阅信息中获取
    const dailyLimit = 200.00;
    const dailyUsed = todayUsage?.daily_cost || 0;
    const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

    return {
      daily_limit: dailyLimit,
      daily_used: dailyUsed,
      daily_remaining: dailyRemaining,
      temporary_quota: 0.00, // 临时额度，后续可从额外配置表获取
      temp_increase_count: 5 // 剩余提额次数，后续可从用户配置获取
    };

  } catch (error) {
    console.error('获取配额信息失败:', error);
    return {
      daily_limit: 200.00,
      daily_used: 0.00,
      daily_remaining: 200.00,
      temporary_quota: 0.00,
      temp_increase_count: 5
    };
  }
}