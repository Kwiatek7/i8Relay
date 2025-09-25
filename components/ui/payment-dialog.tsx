"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield
} from 'lucide-react';

interface Plan {
  id: string;
  plan_name: string;
  price: number;
  description: string;
  features: string[];
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  userBalance: number;
  onPayment: (planId: string, paymentMethod: 'balance' | 'stripe' | 'alipay') => Promise<{ success: boolean; paymentUrl?: string; message?: string }>;
}

type PaymentStep = 'select-method' | 'processing' | 'success' | 'error';

export function PaymentDialog({ open, onClose, plan, userBalance, onPayment }: PaymentDialogProps) {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('select-method');
  const [selectedMethod, setSelectedMethod] = useState<'balance' | 'stripe' | 'alipay' | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!plan) return null;

  const canUseBalance = userBalance >= plan.price;

  const handleMethodSelect = (method: 'balance' | 'stripe' | 'alipay') => {
    setSelectedMethod(method);
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod || !plan) return;

    setIsProcessing(true);
    setCurrentStep('processing');
    setError('');

    try {
      const result = await onPayment(plan.id, selectedMethod);

      if (result.success) {
        if (result.paymentUrl) {
          // 第三方支付：跳转到支付页面
          window.location.href = result.paymentUrl;
          return;
        } else {
          // 余额支付：直接成功
          setCurrentStep('success');
        }
      } else {
        throw new Error(result.message || '支付失败');
      }
    } catch (err: any) {
      setError(err.message || '支付失败，请稍后重试');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('select-method');
    setSelectedMethod(null);
    setError('');
    setIsProcessing(false);
    onClose();
  };

  const handleRetry = () => {
    setCurrentStep('select-method');
    setError('');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-method':
        return (
          <>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold">选择支付方式</DialogTitle>
              <DialogDescription>
                购买 {plan.plan_name} - ¥{plan.price}
              </DialogDescription>
            </DialogHeader>

            {/* 套餐信息卡片 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  特惠价格
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{plan.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">¥{plan.price}</span>
                <span className="text-sm text-gray-500">30天有效期</span>
              </div>
            </div>

            {/* 支付方式选择 */}
            <div className="space-y-3 mb-6">
              {/* 余额支付 */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === 'balance'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                } ${!canUseBalance ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => canUseBalance && handleMethodSelect('balance')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium">账户余额支付</div>
                      <div className="text-sm text-gray-500">
                        当前余额: ¥{parseFloat(String(userBalance || 0)).toFixed(2)}
                        {!canUseBalance && <span className="text-red-500 ml-2">(余额不足)</span>}
                      </div>
                    </div>
                  </div>
                  {selectedMethod === 'balance' && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Stripe支付 */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === 'stripe'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => handleMethodSelect('stripe')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium">Stripe 支付</div>
                      <div className="text-sm text-gray-500">支持信用卡、借记卡等</div>
                    </div>
                  </div>
                  {selectedMethod === 'stripe' && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>

              {/* 支付宝支付 */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === 'alipay'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => handleMethodSelect('alipay')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium">支付宝</div>
                      <div className="text-sm text-gray-500">安全快捷的移动支付</div>
                    </div>
                  </div>
                  {selectedMethod === 'alipay' && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                取消
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={!selectedMethod}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                确认支付 ¥{plan.price}
              </Button>
            </div>
          </>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">正在处理支付...</h3>
            <p className="text-gray-600 dark:text-gray-400">
              请稍候，正在为您处理支付请求
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">支付成功！</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              恭喜您，{plan.plan_name} 已成功开通
            </p>
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              完成
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">支付失败</h3>
            <Alert className="mb-6 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                关闭
              </Button>
              <Button onClick={handleRetry} className="flex-1 bg-blue-600 hover:bg-blue-700">
                重试支付
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}