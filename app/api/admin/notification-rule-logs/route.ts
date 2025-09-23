import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

// 获取通知规则执行日志
export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '20');
    const ruleId = url.searchParams.get('rule_id');
    const success = url.searchParams.get('success');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    const result = await getNotificationRuleLogs({
      page,
      pageSize,
      ruleId,
      success,
      startDate,
      endDate
    });

    return createAuthResponse(result, '通知规则日志获取成功');

  } catch (error) {
    console.error('获取通知规则日志错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取通知规则日志失败'), 500);
  }
}

// 获取通知规则执行日志列表
async function getNotificationRuleLogs(filter: {
  page: number;
  pageSize: number;
  ruleId?: string | null;
  success?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const db = await getDb();

  // 构建查询条件
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (filter.ruleId) {
    whereClause += ' AND l.rule_id = ?';
    params.push(filter.ruleId);
  }

  if (filter.success !== null) {
    whereClause += ' AND l.success = ?';
    params.push(filter.success === 'true' ? 1 : 0);
  }

  if (filter.startDate) {
    whereClause += ' AND l.executed_at >= ?';
    params.push(filter.startDate);
  }

  if (filter.endDate) {
    whereClause += ' AND l.executed_at <= ?';
    params.push(filter.endDate);
  }

  // 获取总数
  const countQuery = `
    SELECT COUNT(*) as total
    FROM notification_rule_logs l
    LEFT JOIN notification_rules r ON l.rule_id = r.id
    ${whereClause}
  `;
  const countResult = await db.get(countQuery, params);
  const total = countResult.total;

  // 计算分页
  const offset = (filter.page - 1) * filter.pageSize;
  const totalPages = Math.ceil(total / filter.pageSize);

  // 获取数据
  const dataQuery = `
    SELECT
      l.id,
      l.rule_id as ruleId,
      l.trigger_data as triggerData,
      l.executed_at as executedAt,
      l.notifications_sent as notificationsSent,
      l.target_users as targetUsers,
      l.success,
      l.error_message as errorMessage,
      r.name as ruleName,
      r.type as ruleType
    FROM notification_rule_logs l
    LEFT JOIN notification_rules r ON l.rule_id = r.id
    ${whereClause}
    ORDER BY l.executed_at DESC
    LIMIT ? OFFSET ?
  `;

  const logs = await db.all(dataQuery, [...params, filter.pageSize, offset]);

  // 转换数据格式
  const formattedLogs = logs.map((log: any) => ({
    id: log.id,
    ruleId: log.ruleId,
    ruleName: log.ruleName,
    ruleType: log.ruleType,
    triggerData: log.triggerData ? JSON.parse(log.triggerData) : {},
    executedAt: log.executedAt,
    notificationsSent: log.notificationsSent,
    targetUsers: log.targetUsers ? JSON.parse(log.targetUsers) : [],
    success: log.success === 1,
    errorMessage: log.errorMessage
  }));

  return {
    data: formattedLogs,
    total,
    page: filter.page,
    pageSize: filter.pageSize,
    totalPages
  };
}