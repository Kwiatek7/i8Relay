'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
  Settings,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface PaymentConfig {
  // 通用配置
  defaultProvider: string;

  // Stripe 配置
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeTestMode: boolean;
  stripeCurrency: string;
  stripeCountry: string;

  // 易支付配置
  epayEnabled: boolean;
  epayMerchantId: string;
  epayMerchantKey: string;
  epayApiUrl: string;
  epayNotifyUrl: string;
  epayReturnUrl: string;
  epayTestMode: boolean;
  epaySignType: string;
  epaySupportedChannels: string[];

  // 支付宝直连配置
  alipayEnabled: boolean;
  alipayAppId: string;
  alipayPrivateKey: string;
  alipayPublicKey: string;
  alipayTestMode: boolean;

  // 微信支付直连配置
  wechatPayEnabled: boolean;
  wechatPayMchId: string;
  wechatPayPrivateKey: string;
  wechatPayCertificateSerial: string;
  wechatPayApiV3Key: string;
  wechatPayTestMode: boolean;
}

const PaymentProviders = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: CreditCard,
    description: '国际支付解决方案，支持全球银行卡支付',
    color: 'bg-purple-500'
  },
  {
    id: 'epay',
    name: '易支付',
    icon: Wallet,
    description: '第三方支付聚合平台，支持多种支付方式',
    color: 'bg-blue-500'
  },
  {
    id: 'alipay',
    name: '支付宝',
    icon: Smartphone,
    description: '支付宝官方支付接口，直连接入',
    color: 'bg-blue-600'
  },
  {
    id: 'wechat_pay',
    name: '微信支付',
    icon: Banknote,
    description: '微信支付官方接口，直连接入',
    color: 'bg-green-500'
  }
];

export default function PaymentConfigPage() {
  const [config, setConfig] = useState<PaymentConfig>({
    defaultProvider: 'stripe',
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripeTestMode: true,
    stripeCurrency: 'usd',
    stripeCountry: 'US',
    epayEnabled: false,
    epayMerchantId: '',
    epayMerchantKey: '',
    epayApiUrl: '',
    epayNotifyUrl: '',
    epayReturnUrl: '',
    epayTestMode: true,
    epaySignType: 'MD5',
    epaySupportedChannels: ['alipay', 'wxpay'],
    alipayEnabled: false,
    alipayAppId: '',
    alipayPrivateKey: '',
    alipayPublicKey: '',
    alipayTestMode: true,
    wechatPayEnabled: false,
    wechatPayMchId: '',
    wechatPayPrivateKey: '',
    wechatPayCertificateSerial: '',
    wechatPayApiV3Key: '',
    wechatPayTestMode: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('stripe');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/config');

      if (!response.ok) {
        throw new Error('获取配置失败');
      }

      const data = await response.json();
      setConfig(data.data);
    } catch (error) {
      console.error('获取支付配置失败:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '获取配置失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/payments/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('保存配置失败');
      }

      setMessage({
        type: 'success',
        text: '支付配置保存成功'
      });

      // 3秒后清除消息
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('保存支付配置失败:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '保存配置失败'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const updateConfig = (key: keyof PaymentConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getProviderStatus = (providerId: string) => {
    switch (providerId) {
      case 'stripe':
        return config.stripeEnabled && config.stripePublishableKey && config.stripeSecretKey;
      case 'epay':
        return config.epayEnabled && config.epayMerchantId && config.epayMerchantKey;
      case 'alipay':
        return config.alipayEnabled && config.alipayAppId && config.alipayPrivateKey;
      case 'wechat_pay':
        return config.wechatPayEnabled && config.wechatPayMchId && config.wechatPayPrivateKey;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          支付配置管理
        </h1>
        <p className="text-gray-600 mt-2">
          配置和管理系统支持的支付方式，包括 Stripe、易支付、支付宝、微信支付等
        </p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <XCircle className="h-5 w-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* 支付提供商概览 */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PaymentProviders.map(provider => {
          const isConfigured = getProviderStatus(provider.id);
          const Icon = provider.icon;

          return (
            <div key={provider.id} className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${provider.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {isConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{provider.name}</h3>
              <p className="text-sm text-gray-600 mb-3 flex-grow">{provider.description}</p>
              <button
                onClick={() => setActiveTab(provider.id)}
                className={`w-full text-sm px-3 py-2 rounded-md transition-colors mt-auto ${
                  activeTab === provider.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {isConfigured ? '查看配置' : '立即配置'}
              </button>
            </div>
          );
        })}
      </div>

      {/* 配置表单 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* 通用配置 */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">通用配置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                默认支付提供商
              </label>
              <select
                value={config.defaultProvider}
                onChange={(e) => updateConfig('defaultProvider', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="stripe">Stripe</option>
                <option value="epay">易支付</option>
                <option value="alipay">支付宝</option>
                <option value="wechat_pay">微信支付</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stripe 配置 */}
        {activeTab === 'stripe' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Stripe 配置</h2>

            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stripeEnabled"
                  checked={config.stripeEnabled}
                  onChange={(e) => updateConfig('stripeEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="stripeEnabled" className="ml-2 text-sm font-medium text-gray-700">
                  启用 Stripe 支付
                </label>
              </div>

              {config.stripeEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      可发布密钥 (Publishable Key)
                    </label>
                    <input
                      type="text"
                      value={config.stripePublishableKey}
                      onChange={(e) => updateConfig('stripePublishableKey', e.target.value)}
                      placeholder="pk_test_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密钥 (Secret Key)
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets.stripeSecret ? 'text' : 'password'}
                        value={config.stripeSecretKey}
                        onChange={(e) => updateConfig('stripeSecretKey', e.target.value)}
                        placeholder="sk_test_..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('stripeSecret')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets.stripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook 密钥
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets.stripeWebhook ? 'text' : 'password'}
                        value={config.stripeWebhookSecret}
                        onChange={(e) => updateConfig('stripeWebhookSecret', e.target.value)}
                        placeholder="whsec_..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('stripeWebhook')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets.stripeWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      货币
                    </label>
                    <select
                      value={config.stripeCurrency}
                      onChange={(e) => updateConfig('stripeCurrency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="usd">USD - 美元</option>
                      <option value="eur">EUR - 欧元</option>
                      <option value="gbp">GBP - 英镑</option>
                      <option value="cny">CNY - 人民币</option>
                      <option value="jpy">JPY - 日元</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      国家/地区
                    </label>
                    <select
                      value={config.stripeCountry}
                      onChange={(e) => updateConfig('stripeCountry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="US">美国</option>
                      <option value="GB">英国</option>
                      <option value="DE">德国</option>
                      <option value="FR">法国</option>
                      <option value="SG">新加坡</option>
                      <option value="HK">中国香港</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="stripeTestMode"
                      checked={config.stripeTestMode}
                      onChange={(e) => updateConfig('stripeTestMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="stripeTestMode" className="ml-2 text-sm font-medium text-gray-700">
                      测试模式
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 易支付配置 */}
        {activeTab === 'epay' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">易支付配置</h2>

            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="epayEnabled"
                  checked={config.epayEnabled}
                  onChange={(e) => updateConfig('epayEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="epayEnabled" className="ml-2 text-sm font-medium text-gray-700">
                  启用易支付
                </label>
              </div>

              {config.epayEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商户ID (PID)
                    </label>
                    <input
                      type="text"
                      value={config.epayMerchantId}
                      onChange={(e) => updateConfig('epayMerchantId', e.target.value)}
                      placeholder="输入易支付商户ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商户密钥 (KEY)
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets.epayKey ? 'text' : 'password'}
                        value={config.epayMerchantKey}
                        onChange={(e) => updateConfig('epayMerchantKey', e.target.value)}
                        placeholder="输入易支付商户密钥"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('epayKey')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets.epayKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API接口地址
                    </label>
                    <input
                      type="url"
                      value={config.epayApiUrl}
                      onChange={(e) => updateConfig('epayApiUrl', e.target.value)}
                      placeholder="https://pay.example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      签名方式
                    </label>
                    <select
                      value={config.epaySignType}
                      onChange={(e) => updateConfig('epaySignType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MD5">MD5</option>
                      <option value="RSA">RSA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      异步通知地址
                    </label>
                    <input
                      type="url"
                      value={config.epayNotifyUrl}
                      onChange={(e) => updateConfig('epayNotifyUrl', e.target.value)}
                      placeholder="/api/webhooks/epay"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      同步返回地址
                    </label>
                    <input
                      type="url"
                      value={config.epayReturnUrl}
                      onChange={(e) => updateConfig('epayReturnUrl', e.target.value)}
                      placeholder="/payment/success"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="epayTestMode"
                      checked={config.epayTestMode}
                      onChange={(e) => updateConfig('epayTestMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="epayTestMode" className="ml-2 text-sm font-medium text-gray-700">
                      测试模式
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 支付宝配置 */}
        {activeTab === 'alipay' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">支付宝直连配置</h2>

            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="alipayEnabled"
                  checked={config.alipayEnabled}
                  onChange={(e) => updateConfig('alipayEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="alipayEnabled" className="ml-2 text-sm font-medium text-gray-700">
                  启用支付宝直连
                </label>
              </div>

              {config.alipayEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      应用ID (AppId)
                    </label>
                    <input
                      type="text"
                      value={config.alipayAppId}
                      onChange={(e) => updateConfig('alipayAppId', e.target.value)}
                      placeholder="输入支付宝应用ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      应用私钥 (Private Key)
                    </label>
                    <div className="relative">
                      <textarea
                        value={config.alipayPrivateKey}
                        onChange={(e) => updateConfig('alipayPrivateKey', e.target.value)}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">请输入完整的RSA私钥，包含BEGIN和END标记</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      支付宝公钥 (Public Key)
                    </label>
                    <div className="relative">
                      <textarea
                        value={config.alipayPublicKey}
                        onChange={(e) => updateConfig('alipayPublicKey', e.target.value)}
                        placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">请输入支付宝提供的公钥，用于验证回调签名</p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="alipayTestMode"
                      checked={config.alipayTestMode}
                      onChange={(e) => updateConfig('alipayTestMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="alipayTestMode" className="ml-2 text-sm font-medium text-gray-700">
                      沙箱模式
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 微信支付配置 */}
        {activeTab === 'wechat_pay' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">微信支付直连配置</h2>

            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="wechatPayEnabled"
                  checked={config.wechatPayEnabled}
                  onChange={(e) => updateConfig('wechatPayEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="wechatPayEnabled" className="ml-2 text-sm font-medium text-gray-700">
                  启用微信支付直连
                </label>
              </div>

              {config.wechatPayEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商户号 (MchId)
                    </label>
                    <input
                      type="text"
                      value={config.wechatPayMchId}
                      onChange={(e) => updateConfig('wechatPayMchId', e.target.value)}
                      placeholder="输入微信支付商户号"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商户证书序列号
                    </label>
                    <input
                      type="text"
                      value={config.wechatPayCertificateSerial}
                      onChange={(e) => updateConfig('wechatPayCertificateSerial', e.target.value)}
                      placeholder="输入商户证书序列号"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商户私钥 (Private Key)
                    </label>
                    <div className="relative">
                      <textarea
                        value={config.wechatPayPrivateKey}
                        onChange={(e) => updateConfig('wechatPayPrivateKey', e.target.value)}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">请输入商户私钥，用于API请求签名</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API v3 密钥
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets.wechatApiV3Key ? 'text' : 'password'}
                        value={config.wechatPayApiV3Key}
                        onChange={(e) => updateConfig('wechatPayApiV3Key', e.target.value)}
                        placeholder="输入API v3密钥"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('wechatApiV3Key')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets.wechatApiV3Key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">用于回调通知验证和敏感信息加解密</p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="wechatPayTestMode"
                      checked={config.wechatPayTestMode}
                      onChange={(e) => updateConfig('wechatPayTestMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="wechatPayTestMode" className="ml-2 text-sm font-medium text-gray-700">
                      测试模式
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 保存按钮 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}