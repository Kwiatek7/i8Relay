"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, Eye, EyeOff, Phone, Building } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { Header } from '../components/layout/header';
import { useConfig } from '../../lib/providers/config-provider';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
    agreement: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { register, loading, error, clearError } = useAuth();
  const { config } = useConfig();
  const router = useRouter();

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

    // 验证必填字段
    if (!formData.username.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setLocalError('请填写所有必填字段');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLocalError('请输入有效的邮箱地址');
      return;
    }

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      setLocalError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('密码长度至少8位');
      return;
    }

    // 验证密码强度
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      setLocalError('密码必须包含字母和数字');
      return;
    }

    if (!formData.agreement) {
      setLocalError('请同意用户协议和隐私政策');
      return;
    }

    try {
      const result = await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (result.success) {
        // 检查是否需要邮箱验证
        const responseData = result.data as any; // API返回的数据包含额外字段
        if (responseData?.email_verification_required) {
          // 显示邮箱验证提示并跳转到验证页面
          setLocalError(''); // 清除错误
          router.push('/dashboard?show_email_verification=true');
        } else {
          // 直接跳转到管理中心
          router.push('/dashboard');
        }
      }
      // 错误处理由auth context处理
    } catch (err) {
      console.error('注册失败:', err);
      setLocalError('注册失败，请稍后重试');
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
          <div className="h-full w-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
            <div className="text-center text-white p-12">
              <h2 className="text-4xl font-bold mb-4">加入 {config.site_name}</h2>
              <p className="text-xl opacity-90">开启您的AI开发之旅</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center text-left">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">企业级服务</h3>
                    <p className="text-sm opacity-75">专业技术支持</p>
                  </div>
                </div>
                <div className="flex items-center text-left">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">数据安全</h3>
                    <p className="text-sm opacity-75">银行级加密保护</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧注册表单区域 */}
        <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl lg:p-10 dark:bg-gray-800 dark:shadow-2xl">

            {/* 移动端顶部背景 */}
            <div className="block lg:hidden mb-8">
              <div className="h-32 w-full bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center -mx-8 -mt-8 mb-8">
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold">注册 {config.site_name}</h2>
                  <p className="text-sm opacity-90">开启您的AI开发之旅</p>
                </div>
              </div>
            </div>

            <h1 className="mb-8 text-center text-2xl font-bold text-gray-800 dark:text-gray-100 hidden lg:block">
              注册 {config.site_name}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 错误提示 */}
              {(error || localError) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error || localError}
                </div>
              )}

              {/* 姓名输入框 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  用户名 *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="请输入您的姓名"
                  />
                </div>
              </div>

              {/* 邮箱输入框 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邮箱 *
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

              {/* 手机号输入框 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  手机号
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="请输入手机号（可选）"
                  />
                </div>
              </div>

              {/* 公司输入框 */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  公司/组织
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="请输入公司或组织名称（可选）"
                  />
                </div>
              </div>

              {/* 密码输入框 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  密码 *
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
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="请输入密码（至少8位）"
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

              {/* 确认密码输入框 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  确认密码 *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="请再次输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* 注册按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '注册中...' : '立即注册'}
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

            {/* 登录链接 */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              已有账号？
              <Link
                href="/login"
                className="ml-1 font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                立即登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}