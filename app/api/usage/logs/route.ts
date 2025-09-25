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
    const pageSize = parseInt(url.searchParams.get('page_size') || '20');
    const model = url.searchParams.get('model');
    const status = url.searchParams.get('status');
    const startTime = url.searchParams.get('start_time');
    const endTime = url.searchParams.get('end_time');

    // 获取使用记录
    const result = await getUserUsageLogs(auth.user.id, {
      page,
      pageSize,
      model,
      status,
      startTime,
      endTime
    });

    return createAuthResponse(result, '使用记录获取成功');

  } catch (error) {
    console.error('获取使用记录错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取使用记录失败'), 500);
  }
}

async function getUserUsageLogs(userId: string, filter: {
  page: number;
  pageSize: number;
  model?: string | null;
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}) {
  const db = await getDb();
  const offset = (filter.page - 1) * filter.pageSize;

  try {
    // 构建WHERE条件
    let whereConditions = ['user_id = ?'];
    let params: any[] = [userId];

    if (filter.model) {
      whereConditions.push('model = ?');
      params.push(filter.model);
    }

    if (filter.status) {
      whereConditions.push('status_code = ?');
      params.push(filter.status);
    }

    if (filter.startTime) {
      whereConditions.push('created_at >= ?');
      params.push(filter.startTime);
    }

    if (filter.endTime) {
      whereConditions.push('created_at <= ?');
      params.push(filter.endTime);
    }

    const whereClause = whereConditions.join(' AND ');

    // 获取总数
    const totalResult = await db.get(
      `SELECT COUNT(*) as count FROM usage_logs WHERE ${whereClause}`,
      params
    ) as { count: number };

    // 获取记录
    const records = await db.all(
      `SELECT
        id,
        model,
        method,
        endpoint,
        input_tokens,
        output_tokens,
        total_tokens,
        cost,
        status_code,
        response_time_ms,
        user_agent,
        created_at
       FROM usage_logs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, filter.pageSize, offset]
    );

    // 转换字段名为前端期望的格式
    const formattedRecords = records.map((record: any) => ({
      id: record.id,
      model: record.model,
      method: record.method || 'POST',
      url: record.endpoint || '/v1/chat/completions',
      status: record.status_code,
      inputTokens: record.input_tokens || 0,
      outputTokens: record.output_tokens || 0,
      totalTokens: record.total_tokens || 0,
      cost: record.cost || 0,
      duration: record.response_time_ms || 0,
      userAgent: record.user_agent || 'Unknown',
      timestamp: record.created_at
    }));

    return {
      data: formattedRecords,
      total: totalResult.count,
      totalPages: Math.ceil(totalResult.count / filter.pageSize),
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