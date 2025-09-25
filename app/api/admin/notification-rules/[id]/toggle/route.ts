import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../../lib/auth/middleware';
import { getDb } from '../../../../../../lib/database/connection';

// 切换通知规则状态
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const { id } = await params;
    const result = await toggleNotificationRule(id);
    if (!result) {
      return createErrorResponse(new Error('通知规则不存在'), 404);
    }

    return createAuthResponse(result, '通知规则状态切换成功');

  } catch (error) {
    console.error('切换通知规则状态错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('切换通知规则状态失败'), 500);
  }
}

// 切换通知规则启用状态
async function toggleNotificationRule(id: string) {
  const db = await getDb();

  // 获取当前状态
  const current = await db.get('SELECT id, is_enabled FROM notification_rules WHERE id = ?', [id]);
  if (!current) return null;

  const newStatus = current.is_enabled === 1 ? 0 : 1;

  await db.run(`
    UPDATE notification_rules SET
      is_enabled = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [newStatus, id]);

  return {
    id,
    isEnabled: newStatus === 1,
    updatedAt: new Date().toISOString()
  };
}