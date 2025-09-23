import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { userModel } from '../../../../lib/database/models/user';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取请求数据
    const { current_password, new_password } = await request.json();

    // 验证请求数据
    if (!current_password || !new_password) {
      return createErrorResponse(new Error('当前密码和新密码都是必需的'), 400);
    }

    // 验证密码强度
    if (new_password.length < 8) {
      return createErrorResponse(new Error('新密码长度至少为8位'), 400);
    }

    // 使用userModel的changePassword方法（它会处理验证、加密等逻辑）
    const success = await userModel.changePassword(auth.user.id, current_password, new_password);

    if (!success) {
      return createErrorResponse(new Error('密码更改失败，请检查当前密码是否正确'), 400);
    }

    return createAuthResponse(null, '密码修改成功');

  } catch (error) {
    console.error('密码修改错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('密码修改失败'), 500);
  }
}