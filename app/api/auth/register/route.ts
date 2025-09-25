import { NextRequest, NextResponse } from 'next/server';
import { userModel, sessionModel, configModel } from '../../../../lib/database/models';
import { getDb } from '../../../../lib/database/connection';
import { jwtManager } from '../../../../lib/auth/jwt';
import { createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { emailVerificationService } from '../../../../lib/email-verification';
import type { RegisterRequest } from '../../../../lib/types';

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
    // 检查是否允许注册
    const registrationEnabled = await configModel.isRegistrationEnabled();
    if (!registrationEnabled) {
      throw new AuthError('当前不允许注册', 'registration_disabled', 403);
    }

    const body: RegisterRequest = await request.json();

    // 验证必填字段
    if (!body.username || !body.email || !body.password || !body.confirmPassword) {
      throw new AuthError('请填写所有必填字段', 'missing_fields', 400);
    }

    // 验证用户名
    if (body.username.length < 2 || body.username.length > 50) {
      throw new AuthError('用户名长度应为2-50个字符', 'invalid_username', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw new AuthError('邮箱格式不正确', 'invalid_email', 400);
    }

    // 验证密码
    if (body.password.length < 8) {
      throw new AuthError('密码长度至少8位', 'password_too_short', 400);
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(body.password)) {
      throw new AuthError('密码必须包含字母和数字', 'weak_password', 400);
    }

    // 验证密码确认
    if (body.password !== body.confirmPassword) {
      throw new AuthError('两次输入的密码不一致', 'password_mismatch', 400);
    }

    // 检查邮箱是否已被注册
    const existingUser = await userModel.findByEmail(body.email);
    if (existingUser) {
      throw new AuthError('该邮箱已被注册', 'email_exists', 400);
    }

    // 检查邮箱验证配置
    const emailVerificationConfig = await configModel.getEmailVerificationConfig();
    const requireEmailVerification = emailVerificationConfig.enable_email_verification && 
                                    emailVerificationConfig.require_verification_for_registration;

    // 先创建用户（使用默认状态）
    const user = await userModel.create({
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      phone: body.phone?.trim() || undefined,
      company: body.company?.trim() || undefined,
    });

    // 获取数据库连接用于直接SQL操作
    const db = await getDb();

    // 根据是否需要邮箱验证，设置用户状态和验证状态
    if (requireEmailVerification) {
      await userModel.update(user.id, {
        user_status: 'pending'
      });
      // 设置邮箱为未验证
      await db.run(
        'UPDATE users SET email_verified = false WHERE id = ?',
        [user.id]
      );
    } else {
      // 不需要验证则直接标记为已验证
      await userModel.update(user.id, {
        user_status: 'active'
      });
      // 设置邮箱为已验证
      await db.run(
        'UPDATE users SET email_verified = true, email_verified_at = ? WHERE id = ?',
        [new Date().toISOString(), user.id]
      );
    }

    // 如果需要邮箱验证，发送验证邮件
    if (requireEmailVerification) {
      const clientInfo = getClientInfo(request);
      const emailResult = await emailVerificationService.sendVerificationEmail(
        user.id,
        user.email,
        user.username,
        'email_verification',
        clientInfo.ip_address,
        clientInfo.user_agent
      );

      if (!emailResult.success) {
        console.warn('发送验证邮件失败:', emailResult.error);
        // 不阻止注册流程，只记录警告
      }
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

    // 创建响应
    let message = '注册成功';
    if (requireEmailVerification) {
      message = '注册成功，请查收邮箱进行验证';
    }

    const response = createAuthResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        balance: user.balance,
        apiKey: user.apiKey,
        avatar: user.avatar,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      expires_in: tokenPair.expiresIn,
      email_verification_required: requireEmailVerification
    }, message);

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
    console.error('注册错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    // 处理数据库约束错误
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      if (error.message.includes('email')) {
        return createErrorResponse(new AuthError('该邮箱已被注册', 'email_exists', 400));
      }
    }

    return createErrorResponse(new Error('注册失败，请稍后重试'), 500);
  }
}