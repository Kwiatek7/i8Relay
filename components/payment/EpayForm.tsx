'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Wallet, QrCode } from 'lucide-react';

interface EpayFormProps {
  paymentUrl?: string;
  qrCode?: string;
  amount: number;
  currency: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface PaymentChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export default function EpayForm({
  paymentUrl,
  qrCode,
  amount,
  currency,
  onSuccess,
  onError,
  onCancel
}: EpayFormProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>('alipay');
  const [showQRCode, setShowQRCode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15分钟倒计时

  // 可用的支付渠道
  const paymentChannels: PaymentChannel[] = [
    {
      id: 'alipay',
      name: '支付宝',
      icon: <Smartphone className="h-5 w-5" />,
      description: '使用支付宝扫码支付'
    },
    {
      id: 'wxpay',
      name: '微信支付',
      icon: <Wallet className="h-5 w-5" />,
      description: '使用微信扫码支付'
    }
  ];

  // 倒计时
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onError?.('支付已超时，请重新发起支付');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onError]);

  // 格式化倒计时
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 格式化金额
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // 处理支付
  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      if (paymentUrl) {
        // 如果有支付链接，直接跳转
        window.open(paymentUrl, '_blank');
      } else {
        // 显示二维码
        setShowQRCode(true);
      }

      // 开始轮询支付状态
      startPaymentPolling();

    } catch (err) {
      console.error('发起支付失败:', err);
      onError?.('发起支付失败，请重试');
      setIsProcessing(false);
    }
  };

  // 轮询支付状态
  const startPaymentPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        // 这里应该调用检查支付状态的API
        // const response = await fetch(`/api/payments/status/${paymentId}`);
        // const data = await response.json();

        // 模拟支付状态检查
        // if (data.status === 'completed') {
        //   clearInterval(pollInterval);
        //   onSuccess?.(data.paymentId);
        // } else if (data.status === 'failed') {
        //   clearInterval(pollInterval);
        //   onError?.(data.error || '支付失败');
        // }
      } catch (err) {
        console.error('检查支付状态失败:', err);
      }
    }, 3000); // 每3秒检查一次

    // 15分钟后停止轮询
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 15 * 60 * 1000);
  };

  return (
    <div className="space-y-6">
      {/* 支付金额显示 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">支付金额：</span>
          <span className="text-xl font-semibold text-gray-900">
            {formatAmount(amount, currency)}
          </span>
        </div>
        {timeLeft > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">剩余时间：</span>
            <span className={`text-sm font-medium ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {!showQRCode ? (
        <>
          {/* 支付渠道选择 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">选择支付渠道</h4>
            <div className="space-y-2">
              {paymentChannels.map((channel) => (
                <div
                  key={channel.id}
                  className={`relative rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                    selectedChannel === channel.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedChannel(channel.id)}
                >
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${
                      selectedChannel === channel.id ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {channel.icon}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className={`text-sm font-medium ${
                          selectedChannel === channel.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {channel.name}
                        </h5>
                        <div className={`flex-shrink-0 ${
                          selectedChannel === channel.id ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {selectedChannel === channel.id ? (
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs ${
                        selectedChannel === channel.id ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {channel.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 支付按钮 */}
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={isProcessing || timeLeft <= 0}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                isProcessing || timeLeft <= 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  正在跳转支付...
                </div>
              ) : timeLeft <= 0 ? (
                '支付已超时'
              ) : (
                `确认支付 ${formatAmount(amount, currency)}`
              )}
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                className="w-full py-2 px-4 rounded-lg text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消支付
              </button>
            )}
          </div>
        </>
      ) : (
        /* 二维码支付界面 */
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <QrCode className="h-8 w-8 text-gray-400" />
          </div>

          {qrCode ? (
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="支付二维码"
                className="w-48 h-48 border border-gray-200 rounded-lg"
              />
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">二维码加载中...</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-lg font-medium text-gray-900">
              请使用{paymentChannels.find(c => c.id === selectedChannel)?.name}扫码支付
            </h4>
            <p className="text-sm text-gray-600">
              扫描上方二维码完成支付，支付完成后页面将自动跳转
            </p>
            <p className="text-sm text-gray-500">
              支付金额：{formatAmount(amount, currency)}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowQRCode(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              返回
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 bg-red-100 text-red-800 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"
              >
                取消支付
              </button>
            )}
          </div>
        </div>
      )}

      {/* 支付说明 */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>• 支付时间限制为15分钟，超时后需重新发起支付</p>
        <p>• 支付过程中请勿关闭页面或刷新浏览器</p>
        <p>• 如遇支付问题，请联系客服获取帮助</p>
      </div>
    </div>
  );
}