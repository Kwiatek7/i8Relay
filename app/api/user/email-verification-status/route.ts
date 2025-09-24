import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '@/lib/auth/middleware';
import { emailVerificationService } from '@/lib/email-verification';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 检查邮箱验证状态
    const status = await emailVerificationService.checkUserEmailVerificationStatus(auth.user.id);

    return createAuthResponse({
      isVerified: status.isVerified,
      verifiedAt: status.verifiedAt,
      email: status.email || auth.user.email
    }, '邮箱验证状态获取成功');

  } catch (error) {
    console.error('检查邮箱验证状态API错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取邮箱验证状态失败'), 500);
  }
}