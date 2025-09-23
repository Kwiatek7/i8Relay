import { NextRequest } from 'next/server';
import { createErrorResponse } from '../../../../lib/auth/middleware';
import { getPublicStripeConfig } from '../../../../lib/stripe/config';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const config = await getPublicStripeConfig();

    if (!config) {
      return createErrorResponse(new Error('Stripe 服务未配置或未启用'), 503);
    }

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 缓存 5 分钟
      },
    });

  } catch (error) {
    console.error('获取 Stripe 公开配置失败:', error);
    return createErrorResponse(new Error('获取支付配置失败'), 500);
  }
}