import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const { user } = await authenticateRequest(request);

    // 返回用户信息（不包含敏感信息）
    return createAuthResponse({
      id: user.id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      balance: user.balance,
      apiKey: user.apiKey,
      avatar: user.avatar,
      role: user.user_role,
      status: user.user_status,
      phone: user.phone,
      company: user.company,
      total_requests: user.total_requests,
      total_tokens: user.total_tokens,
      total_cost: user.total_cost,
      plan_expires_at: user.plan_expires_at,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取用户信息失败'), 500);
  }
}