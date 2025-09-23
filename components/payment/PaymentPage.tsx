'use client';

import React, { useState, useEffect } from 'react';
import { StripeProvider, StripeElementsWrapper } from '../../lib/stripe/stripe-provider';
import PaymentForm from './PaymentForm';

interface PaymentPageProps {
  planId?: string;
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onCancel?: () => void;
}

export default function PaymentPage({
  planId,
  amount,
  currency = 'USD',
  description,
  onSuccess,
  onCancel
}: PaymentPageProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    createPaymentIntent();
  }, [amount, currency, planId]);

  const createPaymentIntent = async () => {
    try {
      setIsCreatingIntent(true);
      setError(null);

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description: description || '套餐购买',
          planId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '创建支付意图失败');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);

    } catch (err) {
      console.error('创建支付意图失败:', err);
      setError(err instanceof Error ? err.message : '初始化支付失败');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentSuccess(true);
    onSuccess?.(paymentIntentId);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
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
            您的支付已成功处理，感谢您的购买。
          </p>
          <p className="text-sm text-gray-600">
            订单金额：{formatAmount(amount, currency)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <StripeProvider>
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* 头部 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              确认支付
            </h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>

          {/* 内容 */}
          <div className="px-6 py-6">
            {isCreatingIntent ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">正在初始化支付...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        支付初始化失败
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={createPaymentIntent}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    重试
                  </button>
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      取消
                    </button>
                  )}
                </div>
              </div>
            ) : clientSecret ? (
              <StripeElementsWrapper clientSecret={clientSecret}>
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  amount={amount}
                  currency={currency}
                />
              </StripeElementsWrapper>
            ) : null}
          </div>

          {/* 底部 */}
          {onCancel && !error && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="w-full text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消支付
              </button>
            </div>
          )}
        </div>

        {/* 支付说明 */}
        <div className="mt-6 text-xs text-gray-500 text-center space-y-1">
          <p>• 支持 Visa、Mastercard、American Express 等主流银行卡</p>
          <p>• 支付过程采用 SSL 加密，确保您的信息安全</p>
          <p>• 如遇支付问题，请联系客服</p>
        </div>
      </div>
    </StripeProvider>
  );
}