"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth/service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';

function VerifyEmailWithSearchParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在验证您的邮箱...');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('无效的验证链接');
        return;
      }

      try {
        const result = await authService.verifyEmail(token);
        
        if (result.success) {
          setStatus('success');
          setMessage('邮箱验证成功！');
          setEmail(result.data?.email || '');
          
          // 3秒后跳转到登录页面或仪表板
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.error?.message || '验证失败');
        }
      } catch (error: any) {
        console.error('邮箱验证错误:', error);
        setStatus('error');
        setMessage(error.message || '验证失败，请稍后重试');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            {/* 图标区域 */}
            <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center">
              {status === 'loading' && (
                <div className="bg-blue-100 dark:bg-blue-900 w-full h-full rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="bg-green-100 dark:bg-green-900 w-full h-full rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-100 dark:bg-red-900 w-full h-full rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>

            {/* 标题 */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'loading' && '邮箱验证中'}
              {status === 'success' && '验证成功！'}
              {status === 'error' && '验证失败'}
            </h1>

            {/* 消息 */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            {/* 邮箱地址显示 */}
            {status === 'success' && email && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">{email}</span>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-3">
              {status === 'loading' && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  请稍候，正在处理您的请求...
                </div>
              )}

              {status === 'success' && (
                <>
                  <Button onClick={handleGoToDashboard} className="w-full">
                    前往仪表板
                  </Button>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    3秒后将自动跳转...
                  </div>
                </>
              )}

              {status === 'error' && (
                <>
                  <Button onClick={handleBackToLogin} variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回登录
                  </Button>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    如果问题持续存在，请联系客服
                  </div>
                </>
              )}
            </div>

            {/* 帮助信息 */}
            {status === 'error' && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>可能的原因：</strong>
                </p>
                <ul className="mt-2 text-xs text-yellow-700 dark:text-yellow-500 text-left space-y-1">
                  <li>• 验证链接已过期（24小时有效期）</li>
                  <li>• 验证链接已被使用</li>
                  <li>• 验证尝试次数过多</li>
                  <li>• 链接格式不正确</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center">
                <div className="bg-blue-100 dark:bg-blue-900 w-full h-full rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                正在加载...
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                请稍候
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailWithSearchParams />
    </Suspense>
  );
}