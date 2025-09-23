import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 标记所有未读通知为已读
    const result = await markAllNotificationsAsRead(auth.user.id);

    return createAuthResponse(result, '所有通知已标记为已读');

  } catch (error) {
    console.error('批量标记已读错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('批量标记已读失败'), 500);
  }
}

async function markAllNotificationsAsRead(userId: string) {
  const db = await getDb();

  // 获取当前未读通知数量
  const unreadCount = await db.get(
    'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  // 标记所有未读通知为已读
  await db.run(
    'UPDATE user_notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  return {
    success: true,
    updatedCount: unreadCount.count
  };
}