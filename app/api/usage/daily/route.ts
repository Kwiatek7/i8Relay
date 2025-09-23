import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取查询参数
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '30');

    // 获取日汇总数据
    const result = await getUserDailySummaries(auth.user.id, {
      startDate,
      endDate,
      page,
      pageSize
    });

    return createAuthResponse(result, '日汇总数据获取成功');

  } catch (error) {
    console.error('获取日汇总数据错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取日汇总数据失败'), 500);
  }
}

async function getUserDailySummaries(userId: string, filter: {
  startDate?: string | null;
  endDate?: string | null;
  page: number;
  pageSize: number;
}) {
  const db = await getDb();
  const offset = (filter.page - 1) * filter.pageSize;

  try {
    // 设置默认日期范围（最近30天）
    const now = new Date();
    const defaultStartDate = filter.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultEndDate = filter.endDate || now.toISOString().split('T')[0];

    // 生成日期范围内的所有日期
    const startDate = new Date(defaultStartDate);
    const endDate = new Date(defaultEndDate);
    const dateRange = [];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      dateRange.push(date.toISOString().split('T')[0]);
    }

    // 获取每日统计数据
    const dailySummaries = await Promise.all(
      dateRange.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const stats = await db.get(
          `SELECT
            COUNT(*) as total_requests,
            COALESCE(SUM(input_tokens), 0) as input_tokens,
            COALESCE(SUM(output_tokens), 0) as output_tokens,
            COALESCE(SUM(cost), 0) as total_cost,
            COALESCE(AVG(response_time_ms), 0) as avg_duration,
            COUNT(DISTINCT model) as unique_models
           FROM usage_logs
           WHERE user_id = ? AND DATE(created_at) = ?`,
          [userId, date]
        ) as {
          total_requests: number;
          input_tokens: number;
          output_tokens: number;
          total_cost: number;
          avg_duration: number;
          unique_models: number;
        };

        return {
          date,
          totalRequests: stats.total_requests,
          inputTokens: stats.input_tokens,
          outputTokens: stats.output_tokens,
          totalTokens: stats.input_tokens + stats.output_tokens,
          totalCost: stats.total_cost,
          avgDuration: Math.round(stats.avg_duration),
          uniqueModels: stats.unique_models
        };
      })
    );

    // 分页处理
    const total = dailySummaries.length;
    const paginatedData = dailySummaries
      .reverse() // 最新日期在前
      .slice(offset, offset + filter.pageSize);

    return {
      data: paginatedData,
      total,
      totalPages: Math.ceil(total / filter.pageSize),
      page: filter.page,
      pageSize: filter.pageSize
    };

  } catch (error) {
    console.error('Database query error:', error);
    return {
      data: [],
      total: 0,
      totalPages: 0,
      page: filter.page,
      pageSize: filter.pageSize
    };
  }
}