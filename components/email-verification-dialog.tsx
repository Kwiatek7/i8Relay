"use client";

import React, { useState, useEffect } from 'react';
import { authService } from '@/lib/auth/service';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  X,
  Shield
} from 'lucide-react';

interface EmailVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onVerificationSent?: () => void;
  onVerificationComplete?: () => void;
}

export function EmailVerificationDialog({
  isOpen,
  onClose,
  userEmail,
  onVerificationSent,
  onVerificationComplete
}: EmailVerificationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'sent' | 'resend'>('initial');
  const [countdown, setCountdown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    verifiedAt?: string;
  }>({ isVerified: false });

  // 获取邮箱验证状态
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const result = await authService.getEmailVerificationStatus();
        if (result.success && result.data) {
          setVerificationStatus({
            isVerified: result.data.isVerified,
            verifiedAt: result.data.verifiedAt
          });
        }
      } catch (error) {
        console.error('检查验证状态失败:', error);
      }
    };

    if (isOpen) {
      checkVerificationStatus();
    }
  }, [isOpen]);

  // 倒计时逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (step === 'sent') {
      setStep('resend');
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  const handleSendVerification = async () => {
    setLoading(true);
    try {
      const result = await authService.sendEmailVerification(userEmail);
      
      if (result.success) {
        toast({
          type: 'success',
          title: '发送成功',
          description: '验证邮件已发送，请查收邮箱'
        });
        
        setStep('sent');
        setCountdown(300); // 5分钟倒计时
        onVerificationSent?.();
      } else {
        toast({
          type: 'error',
          title: '发送失败',
          description: result.error?.message || '发送验证邮件失败，请稍后重试'
        });
      }
    } catch (error: any) {
      console.error('发送验证邮件错误:', error);
      toast({
        type: 'error',
        title: '发送失败',
        description: error.message || '网络错误，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderInitialStep = () => (
    <div className="space-y-6">
      {/* 警告图标和消息 */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            邮箱未验证
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            为了保障您的账户安全，请验证您的邮箱地址
          </p>
        </div>
      </div>

      {/* 邮箱地址显示 */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              邮箱地址
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {userEmail}
            </p>
          </div>
        </div>
      </div>

      {/* 验证说明 */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          验证后您将获得：
        </h4>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            增强账户安全性
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            接收重要通知
          </li>
          <li className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-green-500" />
            找回密码功能
          </li>
        </ul>
      </div>
    </div>
  );

  const renderSentStep = () => (
    <div className="space-y-6">
      {/* 成功图标 */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            验证邮件已发送
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            我们已向您的邮箱发送了验证链接
          </p>
        </div>
      </div>

      {/* 邮箱地址 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {userEmail}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              请检查您的收件箱（包括垃圾邮件文件夹）
            </p>
          </div>
        </div>
      </div>

      {/* 倒计时 */}
      {countdown > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                重新发送倒计时
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formatCountdown(countdown)} 后可重新发送
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          接下来：
        </h4>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            检查您的邮箱收件箱
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            点击邮件中的验证链接
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            完成验证后返回此页面
          </li>
        </ol>
      </div>
    </div>
  );

  // 如果已验证，显示成功状态
  if (verificationStatus.isVerified) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                邮箱已验证
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                您的邮箱 {userEmail} 已通过验证
              </p>
              {verificationStatus.verifiedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  验证时间：{new Date(verificationStatus.verifiedAt).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
            
            <Button onClick={onClose} className="mt-4">
              知道了
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            邮箱验证
          </DialogTitle>
          <DialogDescription>
            验证您的邮箱地址以获得完整的账户功能
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'initial' && renderInitialStep()}
          {(step === 'sent' || step === 'resend') && renderSentStep()}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          {step === 'initial' && (
            <>
              <Button variant="outline" onClick={onClose} className="order-2 sm:order-1">
                稍后验证
              </Button>
              <Button 
                onClick={handleSendVerification} 
                disabled={loading}
                className="order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    发送验证邮件
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'sent' && countdown > 0 && (
            <>
              <Button variant="outline" onClick={onClose}>
                稍后处理
              </Button>
              <Button disabled>
                <Clock className="w-4 h-4 mr-2" />
                {formatCountdown(countdown)}
              </Button>
            </>
          )}

          {step === 'resend' && (
            <>
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
              <Button onClick={handleSendVerification} disabled={loading}>
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    重新发送
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}