import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { createErrorResponse } from '../../../../lib/auth/middleware';
import { paymentManager } from '../../../../lib/payment/manager';
import { PaymentProvider } from '../../../../lib/payment/types';

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Webhook 签名缺失');
      return createErrorResponse(new Error('缺少 Stripe 签名'), 400);
    }

    console.log('处理 Stripe Webhook 事件...');

    // 使用支付管理器处理 Webhook
    const result = await paymentManager.handleWebhook(
      PaymentProvider.STRIPE,
      body,
      signature
    );

    if (!result.success) {
      console.error('Webhook 处理失败:', result.message);
      return createErrorResponse(new Error(result.message || 'Webhook 处理失败'), 400);
    }

    console.log('Webhook 处理成功');
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook 处理错误:', error);
    return createErrorResponse(new Error('Webhook 处理失败'), 500);
  }
}

