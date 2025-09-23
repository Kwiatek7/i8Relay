import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../lib/auth/middleware';
import { getDb } from '../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '20');
    const isRead = url.searchParams.get('is_read');
    const type = url.searchParams.get('type');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');

    // 获取通知列表
    const result = await getUserNotifications(auth.user.id, {
      page,
      pageSize,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type || undefined,
      priority: priority || undefined,
      search: search || undefined
    });

    return createAuthResponse(result, '通知获取成功');

  } catch (error) {
    console.error('获取通知错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取通知失败'), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 解析请求体
    const body = await request.json();
    const { title, message, type, priority, actionUrl, targetUserId } = body;

    // 验证必填字段
    if (!title || !message) {
      return createErrorResponse(new Error('标题和消息不能为空'), 400);
    }

    // 检查权限：只有管理员或目标用户本人可以创建通知
    const userId = targetUserId || auth.user.id;
    if (targetUserId && auth.user.id !== targetUserId && auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 创建通知
    const result = await createNotification({
      userId,
      title,
      message,
      type: type || 'info',
      priority: priority || 'medium',
      actionUrl: actionUrl || null
    });

    return createAuthResponse(result, '通知创建成功');

  } catch (error) {
    console.error('创建通知错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('创建通知失败'), 500);
  }
}

async function getUserNotifications(userId: string, filter: {
  page: number;
  pageSize: number;
  isRead?: boolean;
  type?: string;
  priority?: string;
  search?: string;
}) {
  const db = await getDb();

  // 构建查询条件
  let whereClause = 'WHERE user_id = ?';
  const params: any[] = [userId];

  if (filter.isRead !== undefined) {
    whereClause += ' AND is_read = ?';
    params.push(filter.isRead ? 1 : 0);
  }

  if (filter.type) {
    whereClause += ' AND type = ?';
    params.push(filter.type);
  }

  if (filter.priority) {
    whereClause += ' AND priority = ?';
    params.push(filter.priority);
  }

  if (filter.search) {
    whereClause += ' AND (title LIKE ? OR message LIKE ?)';
    const searchTerm = `%${filter.search}%`;
    params.push(searchTerm, searchTerm);
  }

  // 获取总数
  const countQuery = `SELECT COUNT(*) as total FROM user_notifications ${whereClause}`;
  const countResult = await db.get(countQuery, params);
  const total = countResult.total;

  // 计算分页
  const offset = (filter.page - 1) * filter.pageSize;
  const totalPages = Math.ceil(total / filter.pageSize);

  // 获取数据
  const dataQuery = `
    SELECT
      id,
      title,
      message,
      type,
      priority,
      is_read as isRead,
      action_url as actionUrl,
      created_at as createdAt,
      updated_at as updatedAt
    FROM user_notifications
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const notifications = await db.all(dataQuery, [...params, filter.pageSize, offset]);

  // 转换数据格式
  const formattedNotifications = notifications.map((notification: any) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    isRead: notification.isRead === 1,
    actionUrl: notification.actionUrl,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
    userId: userId
  }));

  return {
    data: formattedNotifications,
    total,
    page: filter.page,
    pageSize: filter.pageSize,
    totalPages
  };
}

async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl: string | null;
}) {
  const db = await getDb();

  const id = 'notif_' + Math.random().toString(36).substr(2, 9);

  await db.run(`
    INSERT INTO user_notifications (id, user_id, title, message, type, priority, action_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id, data.userId, data.title, data.message, data.type, data.priority, data.actionUrl]);

  // 返回创建的通知
  const notification = await db.get(`
    SELECT
      id,
      title,
      message,
      type,
      priority,
      is_read as isRead,
      action_url as actionUrl,
      created_at as createdAt,
      updated_at as updatedAt
    FROM user_notifications
    WHERE id = ?
  `, [id]);

  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    isRead: notification.isRead === 1,
    actionUrl: notification.actionUrl,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
    userId: data.userId
  };
}