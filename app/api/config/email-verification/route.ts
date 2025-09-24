import { NextRequest } from 'next/server';
import { createAuthResponse, createErrorResponse } from '../../../../lib/auth/middleware';
import { configModel } from '../../../../lib/database/models/config';

// 获取邮箱验证配置（公开接口，不需要认证）
export async function GET(request: NextRequest) {
  try {
    const emailConfig = await configModel.getEmailVerificationConfig();

    // 只返回公开的配置信息
    return createAuthResponse({
      enable_email_verification: emailConfig.enable_email_verification,
      require_verification_for_registration: emailConfig.require_verification_for_registration,
      block_unverified_users: emailConfig.block_unverified_users
    }, '邮箱验证配置获取成功');

  } catch (error) {
    console.error('获取邮箱验证配置错误:', error);
    return createErrorResponse(new Error('获取配置失败'), 500);
  }
}