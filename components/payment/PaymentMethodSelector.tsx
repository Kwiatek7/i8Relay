'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, Banknote } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  testMode?: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod?: string;
  onMethodChange: (method: string) => void;
  className?: string;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  className = ''
}: PaymentMethodSelectorProps) {
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableMethods();
  }, []);

  const fetchAvailableMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/methods');
      if (!response.ok) {
        throw new Error('获取支付方式失败');
      }

      const data = await response.json();

      // 转换API数据为组件需要的格式
      const methods: PaymentMethod[] = data.data.methods.map((method: any) => ({
        id: method.provider,
        name: getMethodDisplayName(method.provider),
        description: getMethodDescription(method.provider),
        icon: getMethodIcon(method.provider),
        enabled: method.enabled,
        testMode: method.testMode
      }));

      setAvailableMethods(methods);

      // 如果没有选中的方法且有可用方法，选择默认方法
      if (!selectedMethod && data.data.defaultProvider) {
        onMethodChange(data.data.defaultProvider);
      }

    } catch (err) {
      console.error('获取支付方式失败:', err);
      setError(err instanceof Error ? err.message : '获取支付方式失败');
    } finally {
      setLoading(false);
    }
  };

  const getMethodDisplayName = (provider: string): string => {
    const names: Record<string, string> = {
      stripe: 'Stripe',
      epay: '易支付',
      alipay: '支付宝',
      wechat_pay: '微信支付'
    };
    return names[provider] || provider;
  };

  const getMethodDescription = (provider: string): string => {
    const descriptions: Record<string, string> = {
      stripe: '支持 Visa、Mastercard 等国际银行卡',
      epay: '支持支付宝、微信支付等多种方式',
      alipay: '使用支付宝扫码或登录支付',
      wechat_pay: '使用微信扫码或登录支付'
    };
    return descriptions[provider] || '安全便捷的支付方式';
  };

  const getMethodIcon = (provider: string): React.ReactNode => {
    const iconClass = "h-6 w-6";

    switch (provider) {
      case 'stripe':
        return <CreditCard className={iconClass} />;
      case 'epay':
        return <Wallet className={iconClass} />;
      case 'alipay':
        return <Smartphone className={iconClass} />;
      case 'wechat_pay':
        return <Banknote className={iconClass} />;
      default:
        return <CreditCard className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900">选择支付方式</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900">选择支付方式</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">加载失败</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={fetchAvailableMethods}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (availableMethods.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900">选择支付方式</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">暂无可用支付方式</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>系统管理员尚未配置支付方式，请稍后再试或联系客服。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">选择支付方式</h3>
      <div className="space-y-2">
        {availableMethods.map((method) => (
          <div
            key={method.id}
            className={`relative rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => method.enabled && onMethodChange(method.id)}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${
                selectedMethod === method.id ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {method.icon}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    selectedMethod === method.id ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {method.name}
                    {method.testMode && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        测试模式
                      </span>
                    )}
                  </h4>
                  <div className={`flex-shrink-0 ${
                    selectedMethod === method.id ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {selectedMethod === method.id ? (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className={`text-sm ${
                  selectedMethod === method.id ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {method.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}