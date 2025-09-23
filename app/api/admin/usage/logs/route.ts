import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { getDb } from '../../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const userId = url.searchParams.get('user_id');
    const model = url.searchParams.get('model');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // 获取使用日志
    const result = await getSystemUsageLogs({
      page,
      limit,
      userId,
      model,
      status,
      startDate,
      endDate
    });

    return createAuthResponse(result, '系统使用日志获取成功');

  } catch (error) {
    console.error('获取系统使用日志错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取系统使用日志失败'), 500);
  }
}

async function getSystemUsageLogs(filter: {
  page: number;
  limit: number;
  userId?: string | null;
  model?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const db = await getDb();
  const offset = (filter.page - 1) * filter.limit;

  try {
    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.userId) {
      conditions.push('ul.user_id = ?');
      params.push(filter.userId);
    }

    if (filter.model) {
      conditions.push('ul.model = ?');
      params.push(filter.model);
    }

    if (filter.status) {
      conditions.push('ul.status_code = ?');
      params.push(filter.status);
    }

    if (filter.startDate) {
      conditions.push('ul.created_at >= ?');
      params.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push('ul.created_at <= ?');
      params.push(filter.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const totalResult = await db.get(
      `SELECT COUNT(*) as count FROM usage_logs ul ${whereClause}`,
      params
    ) as { count: number };

    // 获取日志记录
    const logs = await db.all(
      `SELECT
        ul.id,
        ul.user_id,
        u.username,
        u.email,
        ul.model,
        ul.method,
        ul.endpoint,
        ul.input_tokens,
        ul.output_tokens,
        ul.total_tokens,
        ul.cost,
        ul.status_code,
        ul.response_time_ms,
        ul.error_code,
        ul.error_message,
        ul.ip_address,
        ul.user_agent,
        ul.created_at
       FROM usage_logs ul
       LEFT JOIN users u ON ul.user_id = u.id
       ${whereClause}
       ORDER BY ul.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, filter.limit, offset]
    );

    // 处理日志数据
    const processedLogs = logs.map(log => ({
      id: log.id,
      user_id: log.user_id,
      username: log.username || 'Unknown',
      email: log.email || '',
      model: log.model,
      method: log.method || 'POST',
      url: log.endpoint || '/v1/chat/completions',
      input_tokens: log.input_tokens || 0,
      output_tokens: log.output_tokens || 0,
      total_tokens: log.total_tokens || ((log.input_tokens || 0) + (log.output_tokens || 0)),
      cost: log.cost || 0,
      cost_formatted: `¥${(log.cost || 0).toFixed(4)}`,
      status: log.status_code || 200,
      duration: log.response_time_ms || 0,
      error_message: log.error_message || null,
      ip_address: log.ip_address || '',
      user_agent: log.user_agent || 'Unknown',
      created_at: log.created_at,
      created_at_formatted: new Date(log.created_at).toLocaleString('zh-CN')
    }));

    return {
      data: processedLogs,
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total: totalResult.count,
        totalPages: Math.ceil(totalResult.count / filter.limit)
      }
    };

  } catch (error) {
    console.error('Database query error:', error);
    return {
      data: [],
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total: 0,
        totalPages: 0
      }
    };
  }
}