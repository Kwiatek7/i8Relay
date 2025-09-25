import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { aiAccountModel } from '../../../../../lib/database/models/ai-account';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取按服务商统计的数据
    const providerStats = await aiAccountModel.getProviderStats();

    // 获取按等级统计的数据
    const tierStats = await aiAccountModel.getTierStats();

    // 计算总体统计
    const totalAccounts = providerStats.reduce((sum, provider) => sum + provider.total_accounts, 0);
    const activeAccounts = providerStats.reduce((sum, provider) => sum + provider.active_accounts, 0);
    const sharedAccounts = providerStats.reduce((sum, provider) => sum + provider.shared_accounts, 0);
    const dedicatedAccounts = providerStats.reduce((sum, provider) => sum + provider.dedicated_accounts, 0);
    const avgHealthScore = providerStats.length > 0 
      ? providerStats.reduce((sum, provider) => sum + provider.avg_health_score, 0) / providerStats.length
      : 0;

    return createAuthResponse({
      summary: {
        total_accounts: totalAccounts,
        active_accounts: activeAccounts,
        shared_accounts: sharedAccounts,
        dedicated_accounts: dedicatedAccounts,
        avg_health_score: Math.round(avgHealthScore * 100) / 100
      },
      by_provider: providerStats,
      by_tier: tierStats
    }, 'AI账号统计获取成功');

  } catch (error) {
    console.error('获取AI账号统计错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取AI账号统计失败'), 500);
  }
}