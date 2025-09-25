import { NextRequest, NextResponse } from 'next/server';
import { userModel, sessionModel } from '../../../../lib/database/models';
import { jwtManager } from '../../../../lib/auth/jwt';
import { createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { triggerLoginSecurityNotification } from '../../../../lib/notifications/triggers';
import type { LoginRequest } from '../../../../lib/types';

// 获取客户端信息
function getClientInfo(request: NextRequest): {
  ip_address?: string;
  user_agent?: string;
} {
  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                request.headers.get('x-real-ip') ||
                'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // 验证请求数据
    if (!body.email || !body.password) {
      throw new AuthError('邮箱和密码不能为空', 'missing_credentials', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw new AuthError('邮箱格式不正确', 'invalid_email', 400);
    }

    // 验证用户凭据
    const user = await userModel.verifyPassword(body.email, body.password);
    if (!user) {
      throw new AuthError('邮箱或密码错误', 'invalid_credentials', 401);
    }

    // 检查用户状态
    if (user.user_status === 'banned') {
      throw new AuthError('账户已被封禁', 'account_banned', 403);
    }

    if (user.user_status === 'inactive') {
      throw new AuthError('账户已被停用', 'account_inactive', 403);
    }

    if (user.user_status === 'pending') {
      throw new AuthError('账户待激活，请检查邮箱验证', 'account_pending', 403);
    }

    // 生成会话ID和token
    const sessionId = jwtManager.generateSessionId();
    const tokenPair = await jwtManager.generateTokenPair(
      user.id,
      user.email,
      user.user_role || 'user',
      sessionId
    );

    // 获取客户端信息
    const clientInfo = getClientInfo(request);

    // 创建会话记录
    await sessionModel.create({
      user_id: user.id,
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      expires_in: tokenPair.expiresIn,
      device_info: request.headers.get('x-device-info') || undefined,
      ...clientInfo
    });

    // 更新用户最后登录时间
    await userModel.updateLastLogin(user.id);

    // 异步触发登录安全检查（不影响登录流程）
    setImmediate(() => {
      triggerLoginSecurityNotification(
        user.id,
        new Date(),
        clientInfo.ip_address?.split('.').slice(0, 2).join('.') + '.*.*' || '未知位置', // 简单的IP脱敏
        clientInfo.ip_address || 'unknown'
      ).catch(error => {
        console.warn('登录安全通知触发失败:', error);
      });
    });

    // 创建响应
    const response = createAuthResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        user_role: user.user_role, // 角色字段
        user_status: user.user_status, // 状态字段
        plan: user.plan,
        balance: user.balance,
        apiKey: user.apiKey,
        avatar: user.avatar,
        phone: user.phone,
        company: user.company,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      expires_in: tokenPair.expiresIn
    }, '登录成功');

    // 设置httpOnly cookie
    response.cookies.set('access_token', tokenPair.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenPair.expiresIn
    });

    response.cookies.set('refresh_token', tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30天
    });

    return response;

  } catch (error) {
    console.error('登录错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('登录失败，请稍后重试'), 500);
  }
}