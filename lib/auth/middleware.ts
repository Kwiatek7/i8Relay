import { NextRequest, NextResponse } from 'next/server';
import { jwtManager } from './jwt';
import { userModel, sessionModel } from '../database/models';
import type { User } from '../types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  sessionId?: string;
}

export interface AuthContext {
  user: User;
  sessionId: string;
}

// 认证错误类
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string = 'unauthorized',
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// 从请求中提取token
function extractTokenFromRequest(request: NextRequest): string | null {
  // 优先从Authorization头获取
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return jwtManager.extractTokenFromHeader(authHeader);
  }

  // 从cookie中获取（适用于浏览器端）
  const cookieToken = request.cookies.get('access_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

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

// 认证中间件
export async function authenticateRequest(request: NextRequest): Promise<AuthContext> {
  const token = extractTokenFromRequest(request);

  if (!token) {
    throw new AuthError('未提供认证token', 'missing_token', 401);
  }

  try {
    // 验证JWT token
    const payload = await jwtManager.verifyAccessToken(token);
    if (!payload) {
      throw new AuthError('Token无效', 'invalid_token', 401);
    }

    // 验证会话是否存在且有效
    const session = await sessionModel.findByToken(token);
    if (!session) {
      throw new AuthError('会话已失效', 'session_expired', 401);
    }

    // 获取用户信息
    const user = await userModel.findUserById(payload.userId);
    if (!user) {
      throw new AuthError('用户不存在', 'user_not_found', 401);
    }

    // 检查用户状态
    if (user.user_status !== 'active') {
      throw new AuthError('用户账户已被禁用', 'account_disabled', 403);
    }

    return {
      user,
      sessionId: session.id
    };

  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    // JWT验证错误
    if (error instanceof Error) {
      if (error.message.includes('过期')) {
        throw new AuthError('Token已过期', 'token_expired', 401);
      } else if (error.message.includes('无效')) {
        throw new AuthError('Token无效', 'invalid_token', 401);
      }
    }

    throw new AuthError('认证失败', 'auth_failed', 401);
  }
}

// 可选认证中间件（不抛出错误，返回null表示未认证）
export async function optionalAuthenticate(request: NextRequest): Promise<AuthContext | null> {
  try {
    return await authenticateRequest(request);
  } catch {
    return null;
  }
}

// 权限检查中间件
export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (request: NextRequest): Promise<AuthContext> => {
    const auth = await authenticateRequest(request);

    if (!roles.includes(auth.user.user_role || 'user')) {
      throw new AuthError('权限不足', 'insufficient_permissions', 403);
    }

    return auth;
  };
}

// 管理员权限检查
export const requireAdmin = requireRole(['admin', 'super_admin']);

// 超级管理员权限检查
export const requireSuperAdmin = requireRole('super_admin');

// 检查用户是否有API访问权限
export async function checkApiAccess(user: User): Promise<void> {
  // 检查套餐是否过期
  if (user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
    throw new AuthError('套餐已过期，请续费', 'plan_expired', 402);
  }

  // 检查余额是否充足（如果是按量计费）
  if (user.balance !== undefined && user.balance < 0) {
    throw new AuthError('账户余额不足', 'insufficient_balance', 402);
  }
}

// 刷新token中间件
export async function refreshTokenMiddleware(request: NextRequest): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}> {
  const refreshToken = request.cookies.get('refresh_token')?.value ||
                      request.headers.get('x-refresh-token');

  if (!refreshToken) {
    throw new AuthError('未提供刷新token', 'missing_refresh_token', 401);
  }

  try {
    // 验证刷新token
    const payload = await jwtManager.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AuthError('刷新token无效', 'invalid_refresh_token', 401);
    }

    // 验证会话
    const session = await sessionModel.findByRefreshToken(refreshToken);
    if (!session) {
      throw new AuthError('会话已失效', 'session_expired', 401);
    }

    // 获取用户信息
    const user = await userModel.findUserById(payload.userId);
    if (!user) {
      throw new AuthError('用户不存在', 'user_not_found', 401);
    }

    // 检查用户状态
    if (user.user_status !== 'active') {
      throw new AuthError('用户账户已被禁用', 'account_disabled', 403);
    }

    // 生成新的token对
    const newSessionId = jwtManager.generateSessionId();
    const tokenPair = await jwtManager.generateTokenPair(
      user.id,
      user.email,
      user.user_role || 'user',
      newSessionId
    );

    // 更新会话
    await sessionModel.updateTokens(
      session.id,
      tokenPair.accessToken,
      tokenPair.refreshToken,
      tokenPair.expiresIn
    );

    // 更新用户最后登录时间
    await userModel.updateLastLogin(user.id);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user
    };

  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('过期')) {
        throw new AuthError('刷新token已过期，请重新登录', 'refresh_token_expired', 401);
      }
    }

    throw new AuthError('token刷新失败', 'refresh_failed', 401);
  }
}

// 创建认证响应工具
export function createAuthResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    metadata: {
      timestamp: new Date().toISOString(),
      request_id: Math.random().toString(36).substring(2)
    }
  });
}

// 创建错误响应工具
export function createErrorResponse(
  error: AuthError | Error,
  status?: number
): NextResponse {
  const errorCode = error instanceof AuthError ? error.code : 'internal_error';
  const statusCode = error instanceof AuthError ? error.status : (status || 500);

  return NextResponse.json({
    success: false,
    error: {
      code: errorCode,
      message: error.message
    },
    metadata: {
      timestamp: new Date().toISOString(),
      request_id: Math.random().toString(36).substring(2)
    }
  }, { status: statusCode });
}

// 登出工具
export async function logout(request: NextRequest): Promise<void> {
  const token = extractTokenFromRequest(request);

  if (token) {
    try {
      // 查找并删除会话
      const session = await sessionModel.findByToken(token);
      if (session) {
        await sessionModel.delete(session.id);
      }
    } catch {
      // 忽略错误，因为登出应该总是成功
    }
  }
}

// 登出所有设备
export async function logoutAllDevices(userId: string, currentSessionId?: string): Promise<number> {
  if (currentSessionId) {
    return await sessionModel.deleteOtherUserSessions(userId, currentSessionId);
  } else {
    return await sessionModel.deleteAllUserSessions(userId);
  }
}