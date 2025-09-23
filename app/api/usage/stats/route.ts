import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取查询参数
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month';

    // 获取使用统计数据
    const stats = await getUserUsageStats(auth.user.id, period);

    return createAuthResponse(stats, '使用统计获取成功');

  } catch (error) {
    console.error('获取使用统计错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取使用统计失败'), 500);
  }
}

async function getUserUsageStats(userId: string, period: string) {
  const db = await getDb();
  const now = new Date();

  let startDate: Date;
  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  try {
    // 总请求数
    const totalRequestsResult = await db.get(
      'SELECT COUNT(*) as count FROM usage_logs WHERE user_id = ? AND created_at >= ?',
      [userId, startDate.toISOString()]
    ) as { count: number };

    // 总Token数
    const totalTokensResult = await db.get(
      'SELECT COALESCE(SUM(input_tokens + output_tokens), 0) as total FROM usage_logs WHERE user_id = ? AND created_at >= ?',
      [userId, startDate.toISOString()]
    ) as { total: number };

    // 总成本
    const totalCostResult = await db.get(
      'SELECT COALESCE(SUM(cost), 0) as total FROM usage_logs WHERE user_id = ? AND created_at >= ?',
      [userId, startDate.toISOString()]
    ) as { total: number };

    // 模型使用统计
    const modelUsage = await db.all(
      `SELECT
        model,
        COUNT(*) as requests,
        COALESCE(SUM(input_tokens + output_tokens), 0) as tokens,
        COALESCE(SUM(cost), 0) as cost
       FROM usage_logs
       WHERE user_id = ? AND created_at >= ?
       GROUP BY model
       ORDER BY requests DESC`,
      [userId, startDate.toISOString()]
    );

    // 每日统计（最近7天）
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const dayStats = await db.get(
        `SELECT
          COUNT(*) as requests,
          COALESCE(SUM(input_tokens), 0) as inputTokens,
          COALESCE(SUM(output_tokens), 0) as outputTokens,
          COALESCE(SUM(cache_creation_tokens), 0) as cacheCreated,
          COALESCE(SUM(cache_read_tokens), 0) as cacheRead,
          COALESCE(SUM(input_tokens + output_tokens), 0) as tokens,
          COALESCE(SUM(cost), 0) as cost
         FROM usage_logs
         WHERE user_id = ? AND created_at >= ? AND created_at < ?`,
        [userId, date.toISOString(), nextDate.toISOString()]
      ) as { requests: number; inputTokens: number; outputTokens: number; cacheCreated: number; cacheRead: number; tokens: number; cost: number };

      // 使用真实的缓存数据
      const cacheCreated = dayStats.cacheCreated;
      const cacheRead = dayStats.cacheRead;

      dailyStats.push({
        date: dateStr,
        requests: dayStats.requests,
        tokens: dayStats.tokens,
        inputTokens: dayStats.inputTokens,
        outputTokens: dayStats.outputTokens,
        cacheCreated,
        cacheRead,
        totalTokens: dayStats.tokens + cacheCreated + cacheRead,
        cost: dayStats.cost
      });
    }

    return {
      total_requests: totalRequestsResult.count,
      total_tokens: totalTokensResult.total,
      total_cost: totalCostResult.total,
      daily_requests: dailyStats,
      model_usage: modelUsage
    };

  } catch (error) {
    console.error('Database query error:', error);
    // 返回默认值
    return {
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0,
      daily_requests: []
    };
  }
}