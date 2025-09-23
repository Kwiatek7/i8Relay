import { NextRequest } from 'next/server';
import { refreshTokenMiddleware, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    // 刷新token
    const result = await refreshTokenMiddleware(request);

    // 创建响应
    const response = createAuthResponse({
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        plan: result.user.plan,
        balance: result.user.balance,
        apiKey: result.user.apiKey,
        avatar: result.user.avatar,
        created_at: result.user.created_at,
        updated_at: result.user.updated_at
      },
      token: result.accessToken,
      refresh_token: result.refreshToken,
      expires_in: result.expiresIn
    }, 'Token刷新成功');

    // 更新cookie
    response.cookies.set('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.expiresIn
    });

    response.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30天
    });

    return response;

  } catch (error) {
    console.error('Token刷新错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('Token刷新失败'), 500);
  }
}