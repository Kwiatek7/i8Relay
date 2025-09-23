import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 清空所有通知
    const result = await clearAllNotifications(auth.user.id);

    return createAuthResponse(result, '所有通知已清空');

  } catch (error) {
    console.error('清空通知错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('清空通知失败'), 500);
  }
}

async function clearAllNotifications(userId: string) {
  const db = await getDb();

  // 获取当前通知总数
  const totalCount = await db.get(
    'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ?',
    [userId]
  );

  // 删除所有通知
  await db.run(
    'DELETE FROM user_notifications WHERE user_id = ?',
    [userId]
  );

  return {
    success: true,
    deletedCount: totalCount.count
  };
}