import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取统计数据
    const stats = await getDashboardStats();

    return createAuthResponse(stats, '统计数据获取成功');

  } catch (error) {
    console.error('获取统计数据错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取统计数据失败'), 500);
  }
}

async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const db = await getDb();

    // 总用户数
    const totalUsersResult = await db.get('SELECT COUNT(*) as count FROM users') as { count: number };

    // 活跃用户数（最近30天有登录记录）
    const activeUsersResult = await db.get(
      'SELECT COUNT(DISTINCT user_id) as count FROM user_sessions WHERE created_at >= ?',
      [thirtyDaysAgo.toISOString()]
    ) as { count: number };

    // 总API调用次数
    const totalUsageResult = await db.get(
      'SELECT COALESCE(SUM(input_tokens + output_tokens), 0) as total FROM usage_logs'
    ) as { total: number };

    // 总收入（从billing_records表计算）
    const totalRevenueResult = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM billing_records WHERE status = "completed"'
    ) as { total: number };

    // 用户增长（本月 vs 上月）
    const currentMonthUsersResult = await db.get(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at < ?',
      [currentMonth.toISOString(), now.toISOString()]
    ) as { count: number };

    const lastMonthUsersResult = await db.get(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at < ?',
      [lastMonth.toISOString(), currentMonth.toISOString()]
    ) as { count: number };

    // 使用量增长（本月 vs 上月）
    const currentMonthUsageResult = await db.get(
      'SELECT COALESCE(SUM(input_tokens + output_tokens), 0) as total FROM usage_logs WHERE created_at >= ? AND created_at < ?',
      [currentMonth.toISOString(), now.toISOString()]
    ) as { total: number };

    const lastMonthUsageResult = await db.get(
      'SELECT COALESCE(SUM(input_tokens + output_tokens), 0) as total FROM usage_logs WHERE created_at >= ? AND created_at < ?',
      [lastMonth.toISOString(), currentMonth.toISOString()]
    ) as { total: number };

    // 收入增长（本月 vs 上月）
    const currentMonthRevenueResult = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM billing_records WHERE status = "completed" AND created_at >= ? AND created_at < ?',
      [currentMonth.toISOString(), now.toISOString()]
    ) as { total: number };

    const lastMonthRevenueResult = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM billing_records WHERE status = "completed" AND created_at >= ? AND created_at < ?',
      [lastMonth.toISOString(), currentMonth.toISOString()]
    ) as { total: number };

    // 计算增长率
    const userGrowth = lastMonthUsersResult.count > 0
      ? Math.round(((currentMonthUsersResult.count - lastMonthUsersResult.count) / lastMonthUsersResult.count) * 100)
      : 0;

    const usageGrowth = lastMonthUsageResult.total > 0
      ? Math.round(((currentMonthUsageResult.total - lastMonthUsageResult.total) / lastMonthUsageResult.total) * 100)
      : 0;

    const revenueGrowth = lastMonthRevenueResult.total > 0
      ? Math.round(((currentMonthRevenueResult.total - lastMonthRevenueResult.total) / lastMonthRevenueResult.total) * 100)
      : 0;

    return {
      totalUsers: totalUsersResult.count,
      activeUsers: activeUsersResult.count,
      totalUsage: totalUsageResult.total,
      totalRevenue: totalRevenueResult.total,
      userGrowth,
      usageGrowth,
      revenueGrowth
    };

  } catch (error) {
    console.error('Database query error:', error);
    // 返回默认值而不是抛出错误
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalUsage: 0,
      totalRevenue: 0,
      userGrowth: 0,
      usageGrowth: 0,
      revenueGrowth: 0
    };
  }
}