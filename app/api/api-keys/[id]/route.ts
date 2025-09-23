import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取参数
    const { id } = await params;

    // 删除API密钥
    const success = await deleteApiKey(auth.user.id, id);

    if (!success) {
      return createErrorResponse(new Error('API密钥不存在或无权限删除'), 404);
    }

    return createAuthResponse(null, 'API密钥删除成功');

  } catch (error) {
    console.error('删除API密钥错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('删除API密钥失败'), 500);
  }
}

async function deleteApiKey(userId: string, keyId: string): Promise<boolean> {
  const db = await getDb();

  try {
    const result = await db.run(
      'DELETE FROM api_keys WHERE id = ? AND user_id = ?',
      [keyId, userId]
    );

    return (result.changes ?? 0) > 0;

  } catch (error) {
    console.error('Database delete error:', error);
    return false;
  }
}