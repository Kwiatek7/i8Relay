'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

interface PaymentFormProps {
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  submitText?: string;
  amount?: number;
  currency?: string;
}

export default function PaymentForm({
  onSuccess,
  onError,
  submitText = '确认支付',
  amount,
  currency = 'USD'
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('支付服务未初始化');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 确认支付
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/result`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // 支付失败
        const message = getErrorMessage(error);
        setErrorMessage(message);
        onError?.(message);
      } else if (paymentIntent) {
        // 支付成功
        if (paymentIntent.status === 'succeeded') {
          onSuccess?.(paymentIntent.id);
        } else if (paymentIntent.status === 'requires_action') {
          setErrorMessage('支付需要进一步验证');
        } else {
          setErrorMessage('支付状态异常，请联系客服');
        }
      }

    } catch (err) {
      console.error('支付处理错误:', err);
      const message = err instanceof Error ? err.message : '支付处理失败';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 支付金额显示 */}
      {amount && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">支付金额：</span>
            <span className="text-xl font-semibold text-gray-900">
              {formatAmount(amount, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Stripe Payment Element */}
      <div className="border border-gray-200 rounded-lg p-4">
        <PaymentElement
          options={{
            layout: 'accordion',
          }}
        />
      </div>

      {/* 错误信息 */}
      {errorMessage && (
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
                支付失败
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
          !stripe || !elements || isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            处理中...
          </div>
        ) : (
          submitText
        )}
      </button>

      {/* 安全信息 */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          🔒 您的支付信息经过加密保护，我们不会存储您的卡片信息
        </p>
        <p className="mt-1">
          支付服务由 Stripe 提供技术支持
        </p>
      </div>
    </form>
  );
}

/**
 * 获取用户友好的错误信息
 */
function getErrorMessage(error: any): string {
  switch (error.code) {
    case 'card_declined':
      return '您的银行卡被拒绝，请尝试其他支付方式';
    case 'expired_card':
      return '银行卡已过期，请使用有效的银行卡';
    case 'incorrect_cvc':
      return 'CVC 安全码不正确';
    case 'incomplete_cvc':
      return '请输入完整的 CVC 安全码';
    case 'incomplete_number':
      return '请输入完整的银行卡号';
    case 'incomplete_expiry':
      return '请输入完整的过期日期';
    case 'invalid_number':
      return '银行卡号无效';
    case 'invalid_expiry_month':
      return '过期月份无效';
    case 'invalid_expiry_year':
      return '过期年份无效';
    case 'invalid_cvc':
      return 'CVC 安全码无效';
    case 'processing_error':
      return '支付处理出错，请稍后重试';
    case 'rate_limit':
      return '请求过于频繁，请稍后重试';
    default:
      return error.message || '支付失败，请重试';
  }
}