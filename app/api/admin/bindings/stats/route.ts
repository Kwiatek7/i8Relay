import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { userAccountBindingModel } from '../../../../../lib/database/models/user-account-binding';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取绑定统计信息
    const stats = await userAccountBindingModel.getBindingStats();

    return createAuthResponse(stats, '用户绑定统计获取成功');

  } catch (error) {
    console.error('获取用户绑定统计错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取用户绑定统计失败'), 500);
  }
}