import { NextRequest } from 'next/server';
import { createErrorResponse } from '../../../../lib/auth/middleware';
import { paymentManager } from '../../../../lib/payment/manager';
import { PaymentProvider } from '../../../../lib/payment/types';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
    const body = await request.text();

    // 易支付通常通过 form 参数传递签名，可能在 URL 参数或 body 中
    const url = new URL(request.url);
    const signature = url.searchParams.get('sign') || '';

    if (!signature) {
      // 尝试从 body 中解析签名
      const params = new URLSearchParams(body);
      const bodySignature = params.get('sign');

      if (!bodySignature) {
        console.error('易支付 Webhook 签名缺失');
        return createErrorResponse(new Error('缺少易支付签名'), 400);
      }
    }

    console.log('处理易支付 Webhook 事件...');

    // 使用支付管理器处理 Webhook
    const result = await paymentManager.handleWebhook(
      PaymentProvider.EPAY,
      body,
      signature
    );

    if (!result.success) {
      console.error('易支付 Webhook 处理失败:', result.message);
      return createErrorResponse(new Error(result.message || 'Webhook 处理失败'), 400);
    }

    console.log('易支付 Webhook 处理成功');

    // 易支付通常期望返回 "success" 字符串
    return new Response('success', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    console.error('易支付 Webhook 处理错误:', error);
    return createErrorResponse(new Error('Webhook 处理失败'), 500);
  }
}

// 支持 GET 请求（某些易支付实现可能使用 GET）
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const signature = url.searchParams.get('sign') || '';

    if (!signature) {
      console.error('易支付 Webhook 签名缺失');
      return createErrorResponse(new Error('缺少易支付签名'), 400);
    }

    console.log('处理易支付 GET Webhook 事件...');

    // 将 URL 参数转换为 body 格式
    const params = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (key !== 'sign') {
        params.append(key, value);
      }
    }
    const body = params.toString();

    // 使用支付管理器处理 Webhook
    const result = await paymentManager.handleWebhook(
      PaymentProvider.EPAY,
      body,
      signature
    );

    if (!result.success) {
      console.error('易支付 GET Webhook 处理失败:', result.message);
      return createErrorResponse(new Error(result.message || 'Webhook 处理失败'), 400);
    }

    console.log('易支付 GET Webhook 处理成功');

    // 易支付通常期望返回 "success" 字符串
    return new Response('success', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    console.error('易支付 GET Webhook 处理错误:', error);
    return createErrorResponse(new Error('Webhook 处理失败'), 500);
  }
}