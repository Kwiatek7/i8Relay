'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

interface StripeContextType {
  stripe: Stripe | null;
  isLoading: boolean;
  error: string | null;
  config: StripePublicConfig | null;
}

interface StripePublicConfig {
  enabled: boolean;
  publishableKey: string;
  currency: string;
  country: string;
  testMode: boolean;
}

const StripeContext = createContext<StripeContextType>({
  stripe: null,
  isLoading: true,
  error: null,
  config: null
});

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

interface StripeProviderProps {
  children: React.ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<StripePublicConfig | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeStripe() {
      try {
        setIsLoading(true);
        setError(null);

        // 获取 Stripe 公开配置
        const response = await fetch('/api/config/stripe-public');
        if (!response.ok) {
          throw new Error('获取 Stripe 配置失败');
        }

        const stripeConfig: StripePublicConfig = await response.json();

        if (!mounted) return;

        if (!stripeConfig.enabled) {
          setError('支付服务未启用');
          return;
        }

        if (!stripeConfig.publishableKey) {
          setError('Stripe 配置不完整');
          return;
        }

        setConfig(stripeConfig);

        // 初始化 Stripe
        const stripeInstance = await loadStripe(stripeConfig.publishableKey);

        if (!mounted) return;

        if (!stripeInstance) {
          throw new Error('Stripe 初始化失败');
        }

        setStripe(stripeInstance);

      } catch (err) {
        if (!mounted) return;
        console.error('Stripe 初始化错误:', err);
        setError(err instanceof Error ? err.message : '支付服务初始化失败');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeStripe();

    return () => {
      mounted = false;
    };
  }, []);

  const contextValue: StripeContextType = {
    stripe,
    isLoading,
    error,
    config
  };

  return (
    <StripeContext.Provider value={contextValue}>
      {children}
    </StripeContext.Provider>
  );
}

interface StripeElementsWrapperProps {
  children: React.ReactNode;
  clientSecret?: string;
}

export function StripeElementsWrapper({ children, clientSecret }: StripeElementsWrapperProps) {
  const { stripe, config, isLoading, error } = useStripe();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化支付服务...</p>
        </div>
      </div>
    );
  }

  if (error || !stripe || !config) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              支付服务不可用
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || '支付服务配置错误'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px'
      }
    },
    locale: 'zh' as const
  };

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  );
}