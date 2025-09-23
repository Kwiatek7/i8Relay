import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 解析请求体
    const body = await request.json();
    const { isRead } = body;

    // 验证参数
    if (typeof isRead !== 'boolean') {
      return createErrorResponse(new Error('isRead 必须是布尔值'), 400);
    }

    // 更新通知状态
    const { id } = await params;
    const result = await updateNotificationStatus(id, auth.user.id, isRead);

    if (!result) {
      return createErrorResponse(new Error('通知不存在或无权限访问'), 404);
    }

    return createAuthResponse(result, '通知状态更新成功');

  } catch (error) {
    console.error('更新通知状态错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('更新通知状态失败'), 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 删除通知
    const { id } = await params;
    const result = await deleteNotification(id, auth.user.id);

    if (!result) {
      return createErrorResponse(new Error('通知不存在或无权限访问'), 404);
    }

    return createAuthResponse({ success: true }, '通知删除成功');

  } catch (error) {
    console.error('删除通知错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('删除通知失败'), 500);
  }
}

async function updateNotificationStatus(notificationId: string, userId: string, isRead: boolean) {
  const db = await getDb();

  // 检查通知是否存在且属于当前用户
  const notification = await db.get(
    'SELECT id FROM user_notifications WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );

  if (!notification) {
    return null;
  }

  // 更新状态
  await db.run(
    'UPDATE user_notifications SET is_read = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [isRead ? 1 : 0, notificationId, userId]
  );

  // 返回更新后的通知
  const updatedNotification = await db.get(`
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
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId]);

  return {
    id: updatedNotification.id,
    title: updatedNotification.title,
    message: updatedNotification.message,
    type: updatedNotification.type,
    priority: updatedNotification.priority,
    isRead: updatedNotification.isRead === 1,
    actionUrl: updatedNotification.actionUrl,
    createdAt: updatedNotification.createdAt,
    updatedAt: updatedNotification.updatedAt,
    userId: userId
  };
}

async function deleteNotification(notificationId: string, userId: string) {
  const db = await getDb();

  // 检查通知是否存在且属于当前用户
  const notification = await db.get(
    'SELECT id FROM user_notifications WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );

  if (!notification) {
    return null;
  }

  // 删除通知
  await db.run(
    'DELETE FROM user_notifications WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );

  return true;
}