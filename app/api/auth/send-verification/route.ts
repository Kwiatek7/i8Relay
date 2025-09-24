import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '@/lib/auth/middleware';
import { emailVerificationService } from '@/lib/email-verification';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取请求数据
    const body = await request.json();
    const { email } = body;

    // 验证邮箱地址
    if (!email || !email.includes('@')) {
      return createErrorResponse(new Error('请提供有效的邮箱地址'), 400);
    }

    // 获取IP地址和User Agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 确定验证类型
    const verificationType = email === auth.user.email ? 'email_verification' : 'email_change';

    // 发送验证邮件
    const result = await emailVerificationService.sendVerificationEmail(
      auth.user.id,
      email,
      auth.user.username,
      verificationType,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return createErrorResponse(new Error(result.error || '发送邮件失败'), 400);
    }

    return createAuthResponse({
      message: '验证邮件已发送，请查收邮箱'
    }, '验证邮件发送成功');

  } catch (error) {
    console.error('发送验证邮件API错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('发送验证邮件失败'), 500);
  }
}