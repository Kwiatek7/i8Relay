import { NextRequest } from 'next/server';
import { createAuthResponse, createErrorResponse } from '../../../../lib/auth/middleware';
import { paymentManager } from '../../../../lib/payment/manager';
import { initializePaymentSystem } from '../../../../lib/payment/init';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 确保支付系统已初始化
    if (!paymentManager.hasAvailableProviders()) {
      await initializePaymentSystem();
    }

    // 获取可用的支付方式
    const availableMethods = paymentManager.getAvailablePaymentMethods();
    const defaultProvider = paymentManager.getDefaultProvider();

    return createAuthResponse({
      methods: availableMethods,
      defaultProvider: defaultProvider?.getProviderName() || null,
      hasAvailableProviders: paymentManager.hasAvailableProviders()
    }, '获取支付方式成功');

  } catch (error) {
    console.error('获取支付方式失败:', error);
    return createErrorResponse(new Error('获取支付方式失败'), 500);
  }
}