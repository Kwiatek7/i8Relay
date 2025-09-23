import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

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
    const pageSize = parseInt(url.searchParams.get('pageSize') || url.searchParams.get('page_size') || '20');
    const userId = url.searchParams.get('user_id');
    const type = url.searchParams.get('type');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');

    // 获取所有通知
    const result = await getAllNotifications({
      page,
      pageSize,
      userId: userId || undefined,
      type: type || undefined,
      priority: priority || undefined,
      search: search || undefined
    });

    return createAuthResponse(result, '通知列表获取成功');

  } catch (error) {
    console.error('获取通知列表错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取通知列表失败'), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 解析请求体
    const body = await request.json();
    const { title, message, type, priority, actionUrl, targetUsers, sendToAll } = body;

    // 验证必填字段
    if (!title || !message) {
      return createErrorResponse(new Error('标题和消息不能为空'), 400);
    }

    // 创建通知
    const result = await createBulkNotifications({
      title,
      message,
      type: type || 'info',
      priority: priority || 'medium',
      actionUrl: actionUrl || null,
      targetUsers: sendToAll ? null : targetUsers,
      sendToAll: sendToAll || false,
      createdBy: auth.user.id
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

async function getAllNotifications(filter: {
  page: number;
  pageSize: number;
  userId?: string;
  type?: string;
  priority?: string;
  search?: string;
}) {
  const db = await getDb();

  // 构建查询条件
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (filter.userId) {
    whereClause += ' AND n.user_id = ?';
    params.push(filter.userId);
  }

  if (filter.type) {
    whereClause += ' AND n.type = ?';
    params.push(filter.type);
  }

  if (filter.priority) {
    whereClause += ' AND n.priority = ?';
    params.push(filter.priority);
  }

  if (filter.search) {
    whereClause += ' AND (n.title LIKE ? OR n.message LIKE ?)';
    const searchTerm = `%${filter.search}%`;
    params.push(searchTerm, searchTerm);
  }

  // 获取总数
  const countQuery = `
    SELECT COUNT(*) as total
    FROM user_notifications n
    LEFT JOIN users u ON n.user_id = u.id
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
      n.id,
      n.title,
      n.message,
      n.type,
      n.priority,
      n.is_read as isRead,
      n.action_url as actionUrl,
      n.created_at as createdAt,
      n.updated_at as updatedAt,
      n.user_id as userId,
      u.username,
      u.email
    FROM user_notifications n
    LEFT JOIN users u ON n.user_id = u.id
    ${whereClause}
    ORDER BY n.created_at DESC
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
    userId: notification.userId,
    user: {
      username: notification.username,
      email: notification.email
    }
  }));

  return {
    data: formattedNotifications,
    total,
    page: filter.page,
    pageSize: filter.pageSize,
    totalPages
  };
}

async function createBulkNotifications(data: {
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl: string | null;
  targetUsers: string[] | null;
  sendToAll: boolean;
  createdBy: string;
}) {
  const db = await getDb();

  let targetUserIds: string[] = [];

  if (data.sendToAll) {
    // 获取所有用户ID
    const users = await db.all('SELECT id FROM users WHERE status = ?', ['active']);
    targetUserIds = users.map((user: any) => user.id);
  } else if (data.targetUsers && data.targetUsers.length > 0) {
    targetUserIds = data.targetUsers;
  } else {
    throw new Error('必须指定目标用户或选择发送给所有用户');
  }

  const createdNotifications = [];

  // 为每个目标用户创建通知
  for (const userId of targetUserIds) {
    const id = 'notif_' + Math.random().toString(36).substr(2, 9);

    try {
      await db.run(`
        INSERT INTO user_notifications (id, user_id, title, message, type, priority, action_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, userId, data.title, data.message, data.type, data.priority, data.actionUrl]);

      createdNotifications.push({
        id,
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        actionUrl: data.actionUrl
      });
    } catch (error) {
      console.error(`为用户 ${userId} 创建通知失败:`, error);
    }
  }

  return {
    success: true,
    createdCount: createdNotifications.length,
    targetCount: targetUserIds.length,
    notifications: createdNotifications
  };
}