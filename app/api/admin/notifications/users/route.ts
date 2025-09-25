import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { getDb } from '../../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取所有用户列表
    const result = await getAllUsers();

    return createAuthResponse(result, '用户列表获取成功');

  } catch (error) {
    console.error('获取用户列表错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取用户列表失败'), 500);
  }
}

async function getAllUsers() {
  const db = await getDb();

  const users = await db.all(`
    SELECT
      id,
      username,
      email,
      status,
      created_at as createdAt
    FROM users
    WHERE status IN ('active', 'inactive')
    ORDER BY username ASC
  `);

  return users;
}