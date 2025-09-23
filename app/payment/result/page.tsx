'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const paymentIntent = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'succeeded') {
      setStatus('success');
      setMessage('支付成功！感谢您的购买。');
      setPaymentIntentId(paymentIntent);
    } else if (redirectStatus === 'failed') {
      setStatus('error');
      setMessage('支付失败，请重试或联系客服。');
    } else {
      // 检查支付状态
      checkPaymentStatus(clientSecret, paymentIntent);
    }
  }, [searchParams]);

  const checkPaymentStatus = async (clientSecret: string | null, paymentIntentId: string | null) => {
    if (!clientSecret && !paymentIntentId) {
      setStatus('error');
      setMessage('无效的支付链接');
      return;
    }

    try {
      // 这里可以调用 API 检查支付状态
      // 暂时根据 URL 参数判断
      setStatus('success');
      setMessage('支付处理中，请稍候...');
      setPaymentIntentId(paymentIntentId);
    } catch (error) {
      setStatus('error');
      setMessage('检查支付状态失败');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              正在确认支付状态...
            </h2>
            <p className="text-gray-600">
              请稍候，我们正在验证您的支付。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          {status === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                支付成功！
              </h2>
              <p className="text-green-600 mb-4">
                {message}
              </p>
              {paymentIntentId && (
                <p className="text-xs text-gray-500 mb-6">
                  支付ID: {paymentIntentId}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                支付失败
              </h2>
              <p className="text-red-600 mb-6">
                {message}
              </p>
            </>
          )}

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              返回控制台
            </Link>

            {status === 'error' && (
              <Link
                href="/pricing"
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors inline-block"
              >
                重新选择套餐
              </Link>
            )}
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>如有疑问，请联系客服</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              正在加载支付结果...
            </h2>
          </div>
        </div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}