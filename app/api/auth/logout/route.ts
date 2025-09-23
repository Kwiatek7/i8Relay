import { NextRequest } from 'next/server';
import { authenticateRequest, logout, createAuthResponse, createErrorResponse, AuthError, optionalAuthenticate } from '../../../../lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    // 可选认证（即使token无效也要能登出）
    const auth = await optionalAuthenticate(request);

    // 执行登出
    await logout(request);

    // 创建响应
    const response = createAuthResponse(null, '登出成功');

    // 清除cookie
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('登出错误:', error);

    // 即使出错也要返回成功（登出应该总是成功）
    const response = createAuthResponse(null, '登出成功');

    // 清除cookie
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;
  }
}