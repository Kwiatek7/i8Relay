import { NextRequest } from 'next/server';
import {
  authenticateRequest,
  createAuthResponse,
  createErrorResponse,
  AuthError
} from '../../../../lib/auth/middleware';
import { paymentManager } from '../../../../lib/payment/manager';
import { PaymentProvider } from '../../../../lib/payment/types';
import { getDb } from '../../../../lib/database/connection';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);
    const userId = auth.user.id;

    // 检查是否有可用的支付提供商
    if (!paymentManager.hasAvailableProviders()) {
      return createErrorResponse(new Error('支付服务暂不可用'), 503);
    }

    // 解析请求数据
    const { amount, currency, description, planId, subscriptionId, provider } = await request.json();

    // 验证参数
    if (!amount || amount <= 0) {
      return createErrorResponse(new Error('无效的金额'), 400);
    }

    // 获取用户信息
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return createErrorResponse(new Error('用户不存在'), 404);
    }

    // 准备支付参数
    const paymentParams = {
      amount: amount,
      currency: currency || 'USD',
      description: description || '套餐购买',
      userId: userId,
      userEmail: user.email,
      planId: planId || '',
      subscriptionId: subscriptionId || '',
      metadata: {
        timestamp: new Date().toISOString()
      },
      provider: provider as PaymentProvider
    };

    // 使用支付管理器创建支付
    const paymentIntent = await paymentManager.createPayment(paymentParams);

    // 返回客户端所需的信息
    return createAuthResponse({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      paymentUrl: paymentIntent.paymentUrl,
      qrCode: paymentIntent.qrCode,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      expiresAt: paymentIntent.expiresAt
    }, '支付意图创建成功');

  } catch (error) {
    console.error('创建支付意图错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error(`创建支付意图失败: ${error instanceof Error ? error.message : '未知错误'}`), 500);
  }
}