import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { getDb } from '../../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取查询参数
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month'; // day, week, month

    // 获取系统使用统计
    const stats = await getSystemUsageStats(period);

    return createAuthResponse(stats, '系统使用统计获取成功');

  } catch (error) {
    console.error('获取系统使用统计错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取系统使用统计失败'), 500);
  }
}

async function getSystemUsageStats(period: string) {
  const db = await getDb();

  try {
    // 设置时间范围
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

    // 获取总体统计
    const totalStats = await db.get(`
      SELECT
        COUNT(*) as total_requests,
        COUNT(DISTINCT user_id) as active_users,
        COALESCE(SUM(input_tokens), 0) as total_input_tokens,
        COALESCE(SUM(output_tokens), 0) as total_output_tokens,
        COALESCE(SUM(cost), 0) as total_cost,
        COUNT(DISTINCT model) as unique_models,
        COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests
      FROM usage_logs
      WHERE created_at >= ?
    `, [startDate.toISOString()]);

    // 获取前一个周期的统计用于计算增长率
    const prevStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const prevStats = await db.get(`
      SELECT
        COUNT(*) as total_requests,
        COUNT(DISTINCT user_id) as active_users,
        COALESCE(SUM(cost), 0) as total_cost
      FROM usage_logs
      WHERE created_at >= ? AND created_at < ?
    `, [prevStartDate.toISOString(), startDate.toISOString()]);

    // 计算增长率
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100);
    };

    // 获取模型使用统计
    const modelStats = await db.all(`
      SELECT
        model,
        COUNT(*) as request_count,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(SUM(cost), 0) as cost
      FROM usage_logs
      WHERE created_at >= ?
      GROUP BY model
      ORDER BY request_count DESC
      LIMIT 10
    `, [startDate.toISOString()]);

    // 获取每日趋势数据
    const dailyTrend = await db.all(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        COUNT(DISTINCT user_id) as users,
        COALESCE(SUM(cost), 0) as cost
      FROM usage_logs
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate.toISOString()]);

    // 获取用户排行榜
    const topUsers = await db.all(`
      SELECT
        u.id,
        u.username,
        u.email,
        COUNT(ul.id) as request_count,
        COALESCE(SUM(ul.input_tokens), 0) as input_tokens,
        COALESCE(SUM(ul.output_tokens), 0) as output_tokens,
        COALESCE(SUM(ul.cost), 0) as cost
      FROM usage_logs ul
      JOIN users u ON ul.user_id = u.id
      WHERE ul.created_at >= ?
      GROUP BY u.id, u.username, u.email
      ORDER BY request_count DESC
      LIMIT 20
    `, [startDate.toISOString()]);

    return {
      period,
      overview: {
        total_requests: totalStats.total_requests || 0,
        active_users: totalStats.active_users || 0,
        total_tokens: (totalStats.total_input_tokens || 0) + (totalStats.total_output_tokens || 0),
        total_cost: totalStats.total_cost || 0,
        success_rate: totalStats.total_requests > 0
          ? (totalStats.successful_requests / totalStats.total_requests * 100).toFixed(2)
          : '0.00',
        unique_models: totalStats.unique_models || 0,

        // 增长率
        request_growth: calculateGrowth(totalStats.total_requests || 0, prevStats.total_requests || 0),
        user_growth: calculateGrowth(totalStats.active_users || 0, prevStats.active_users || 0),
        cost_growth: calculateGrowth(totalStats.total_cost || 0, prevStats.total_cost || 0)
      },
      model_stats: modelStats,
      daily_trend: dailyTrend,
      top_users: topUsers
    };

  } catch (error) {
    console.error('Database query error:', error);
    return {
      period,
      overview: {
        total_requests: 0,
        active_users: 0,
        total_tokens: 0,
        total_cost: 0,
        success_rate: '0.00',
        unique_models: 0,
        request_growth: 0,
        user_growth: 0,
        cost_growth: 0
      },
      model_stats: [],
      daily_trend: [],
      top_users: []
    };
  }
}