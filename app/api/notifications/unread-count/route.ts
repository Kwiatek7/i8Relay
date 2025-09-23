import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取未读通知数量
    const result = await getUnreadNotificationCount(auth.user.id);

    return createAuthResponse(result, '未读通知数量获取成功');

  } catch (error) {
    console.error('获取未读通知数量错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取未读通知数量失败'), 500);
  }
}

async function getUnreadNotificationCount(userId: string) {
  const db = await getDb();

  // 获取未读通知数量
  const result = await db.get(
    'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  return {
    count: result.count
  };
}