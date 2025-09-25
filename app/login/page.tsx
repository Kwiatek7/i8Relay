"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { Header } from '../components/layout/header';
import { useConfig } from '../../lib/providers/config-provider';
import { getDefaultRedirectPath } from '../../lib/auth/permissions';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agreement: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { login, loading, error, clearError, user, isAuthenticated } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 处理查询参数中的消息
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'password_reset_success') {
      setSuccessMessage('密码重置成功！请使用新密码登录。');
      // 5秒后清除消息
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [searchParams]);

  // 监听用户状态变化，登录成功后根据角色重定向
  useEffect(() => {
    if (isAuthenticated && user && loginSuccess) {
      console.log('用户登录状态：', {
        isAuthenticated,
        userRole: user.user_role,
        userId: user.id,
        username: user.username
      });

      // 给一个短暂延迟确保状态完全更新
      setTimeout(() => {
        const redirectPath = getDefaultRedirectPath(user);
        console.log(`用户角色: ${user.user_role}, 跳转到: ${redirectPath}`);
        router.push(redirectPath);
        setLoginSuccess(false); // 重置状态
      }, 100);
    }
  }, [isAuthenticated, user, loginSuccess, router]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!formData.agreement) {
      setLocalError('请同意用户协议和隐私政策');
      return;
    }

    // 基本验证
    if (!formData.email.trim()) {
      setLocalError('请输入邮箱');
      return;
    }

    if (!formData.password.trim()) {
      setLocalError('请输入密码');
      return;
    }

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (result.success) {
        // 设置登录成功状态，让 useEffect 处理重定向
        setLoginSuccess(true);
      }
      // 错误处理由auth context处理
    } catch (err) {
      console.error('登录失败:', err);
      setLocalError('登录失败，请稍后重试');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex h-full min-h-screen w-full pt-20">
        {/* 左侧背景图片区域 - 大屏显示 */}
        <div className="relative hidden h-auto w-2/5 lg:block">
          <div className="h-full w-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
            <div className="text-center text-white p-12">
              <h2 className="text-4xl font-bold mb-4">欢迎来到 {config.site_name}</h2>
              <p className="text-xl opacity-90">与AI一起带来无限的创新</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center text-left">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">安全可靠</h3>
                    <p className="text-sm opacity-75">企业级安全保障</p>
                  </div>
                </div>
                <div className="flex items-center text-left">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">稳定高效</h3>
                    <p className="text-sm opacity-75">99.9% 服务可用性</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录表单区域 */}
        <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl lg:p-10 dark:bg-gray-800 dark:shadow-2xl">

            {/* 移动端顶部背景 */}
            <div className="block lg:hidden mb-8">
              <div className="h-32 w-full bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg flex items-center justify-center -mx-8 -mt-8 mb-8">
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold">登录 {config.site_name}</h2>
                  <p className="text-sm opacity-90">与AI一起带来无限的创新</p>
                </div>
              </div>
            </div>

            <h1 className="mb-8 text-center text-2xl font-bold text-gray-800 dark:text-gray-100 hidden lg:block">
              登录 {config.site_name}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 成功提示 */}
              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {successMessage}
                </div>
              )}

              {/* 错误提示 */}
              {(error || localError) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error || localError}
                </div>
              )}

              {/* 邮箱输入框 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邮箱
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="请输入邮箱"
                  />
                </div>
              </div>

              {/* 密码输入框 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="请输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* 忘记密码链接 */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  忘记密码？
                </Link>
              </div>

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '登录中...' : '登录'}
              </button>

              {/* 用户协议 */}
              <div className="flex items-center justify-center">
                <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    name="agreement"
                    checked={formData.agreement}
                    onChange={handleInputChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  阅读并接受
                  <Link href="/terms" className="mx-1 text-blue-600 hover:text-blue-800 dark:text-blue-400">
                    用户协议
                  </Link>
                  和
                  <Link href="/privacy" className="mx-1 text-blue-600 hover:text-blue-800 dark:text-blue-400">
                    隐私政策
                  </Link>
                </label>
              </div>
            </form>

            {/* 注册链接 */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              还没有账号？
              <Link
                href="/register"
                className="ml-1 font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                立即注册
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 加载中占位符
function LoadingPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <LoginForm />
    </Suspense>
  );
}