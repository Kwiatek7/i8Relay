'use client';

import React, { useState, useEffect } from 'react';
import { StripeProvider, StripeElementsWrapper } from '../../lib/stripe/stripe-provider';
import PaymentMethodSelector from './PaymentMethodSelector';
import PaymentForm from './PaymentForm';
import EpayForm from './EpayForm';

interface UnifiedPaymentPageProps {
  planId?: string;
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onCancel?: () => void;
}

interface PaymentIntent {
  id: string;
  clientSecret?: string;
  paymentUrl?: string;
  qrCode?: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt?: string;
}

export default function UnifiedPaymentPage({
  planId,
  amount,
  currency = 'USD',
  description,
  onSuccess,
  onCancel
}: UnifiedPaymentPageProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [step, setStep] = useState<'select' | 'pay'>('select');

  // 当用户选择支付方式时，创建支付意图
  useEffect(() => {
    if (selectedProvider && step === 'pay') {
      createPaymentIntent();
    }
  }, [selectedProvider, step]);

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
          provider: selectedProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '创建支付意图失败');
      }

      const data = await response.json();
      setPaymentIntent(data.data);

    } catch (err) {
      console.error('创建支付意图失败:', err);
      setError(err instanceof Error ? err.message : '初始化支付失败');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handleMethodSelect = (provider: string) => {
    setSelectedProvider(provider);
    setStep('pay');
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentSuccess(true);
    onSuccess?.(paymentIntentId);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleBackToSelection = () => {
    setStep('select');
    setPaymentIntent(null);
    setError(null);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // 渲染支付成功页面
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

  // 渲染支付方式选择页面
  if (step === 'select') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* 头部 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              选择支付方式
            </h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">
                {description}
              </p>
            )}
            <p className="text-sm text-gray-900 mt-2 font-medium">
              支付金额：{formatAmount(amount, currency)}
            </p>
          </div>

          {/* 内容 */}
          <div className="px-6 py-6">
            <PaymentMethodSelector
              selectedMethod={selectedProvider}
              onMethodChange={handleMethodSelect}
            />
          </div>

          {/* 底部 */}
          {onCancel && (
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
      </div>
    );
  }

  // 渲染具体支付页面
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={handleBackToSelection}
              className="mr-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                确认支付
              </h2>
              {description && (
                <p className="text-sm text-gray-600 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
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
                <button
                  onClick={handleBackToSelection}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  返回
                </button>
              </div>
            </div>
          ) : paymentIntent ? (
            renderPaymentForm()
          ) : null}
        </div>
      </div>
    </div>
  );

  // 根据支付提供商渲染相应的支付表单
  function renderPaymentForm() {
    if (!paymentIntent) return null;

    switch (selectedProvider) {
      case 'stripe':
        if (!paymentIntent.clientSecret) {
          return <div className="text-red-600">Stripe支付配置错误</div>;
        }
        return (
          <StripeProvider>
            <StripeElementsWrapper clientSecret={paymentIntent.clientSecret}>
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                amount={amount}
                currency={currency}
              />
            </StripeElementsWrapper>
          </StripeProvider>
        );

      case 'epay':
        return (
          <EpayForm
            paymentUrl={paymentIntent.paymentUrl}
            qrCode={paymentIntent.qrCode}
            amount={amount}
            currency={currency}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleBackToSelection}
          />
        );

      case 'alipay':
        return (
          <EpayForm
            paymentUrl={paymentIntent.paymentUrl}
            qrCode={paymentIntent.qrCode}
            amount={amount}
            currency={currency}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleBackToSelection}
          />
        );

      case 'wechat_pay':
        return (
          <EpayForm
            paymentUrl={paymentIntent.paymentUrl}
            qrCode={paymentIntent.qrCode}
            amount={amount}
            currency={currency}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleBackToSelection}
          />
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">不支持的支付方式：{selectedProvider}</p>
            <button
              onClick={handleBackToSelection}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              选择其他支付方式
            </button>
          </div>
        );
    }
  }
}