'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { SiteName } from '@/app/components/ui/site-name';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';

interface FormData {
  email: string;
  captchaCode: string;
}

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    captchaCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // 生成验证码图片
  const generateCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const response = await fetch('/api/captcha');
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setCaptchaImage(imageUrl);
      }
    } catch (error) {
      console.error('生成验证码失败:', error);
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 页面加载时生成验证码
  useEffect(() => {
    generateCaptcha();
  }, []);

  // 处理表单输入
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.captchaCode) {
      newErrors.captchaCode = '请输入验证码';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 发送重置邮件
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        // 开始倒计时
        let countdown = 60;
        setResendCountdown(countdown);
        const timer = setInterval(() => {
          countdown--;
          setResendCountdown(countdown);
          if (countdown <= 0) {
            clearInterval(timer);
          }
        }, 1000);
      } else {
        if (data.error === 'INVALID_CAPTCHA') {
          setErrors({ captchaCode: '验证码错误' });
          generateCaptcha(); // 重新生成验证码
        } else if (data.error === 'USER_NOT_FOUND') {
          setErrors({ email: '该邮箱未注册' });
        } else {
          alert(data.message || '发送失败，请稍后重试');
        }
      }
    } catch (error) {
      console.error('发送重置邮件失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 重新发送邮件
  const handleResend = async () => {
    if (resendCountdown > 0) return;
    await handleSubmit({} as React.FormEvent);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                邮件已发送
              </h2>

              <p className="text-gray-600 mb-6">
                我们已向 <span className="font-medium text-gray-900">{formData.email}</span> 发送了密码重置链接，请查收邮件并按照指示重置密码。
              </p>

              <div className="space-y-4">
                <Button
                  onClick={handleResend}
                  variant="outline"
                  disabled={resendCountdown > 0}
                  className="w-full"
                >
                  {resendCountdown > 0 ? `重新发送 (${resendCountdown}s)` : '重新发送邮件'}
                </Button>

                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回登录
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                没有收到邮件？请检查垃圾邮件文件夹，或联系客服获取帮助。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* 左侧图片 */}
      <div className="hidden lg:block lg:w-2/5 relative">
        <Image
          src="/images/login.jpg"
          alt="Forgot Password"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-20" />
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full">
          <Card className="shadow-xl lg:p-2">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <SiteName />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                忘记密码
              </h1>
              <p className="text-gray-600 mt-2">
                输入您的邮箱地址，我们将发送重置密码链接
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 邮箱地址 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="请输入您的邮箱地址"
                      maxLength={50}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* 验证码 */}
                <div>
                  <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                    验证码 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        id="captcha"
                        type="text"
                        value={formData.captchaCode}
                        onChange={(e) => handleInputChange('captchaCode', e.target.value.toUpperCase())}
                        className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.captchaCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="请输入验证码"
                        maxLength={4}
                      />
                    </div>
                    <div
                      className="w-32 h-12 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center cursor-pointer relative overflow-hidden"
                      onClick={generateCaptcha}
                    >
                      {captchaLoading ? (
                        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : captchaImage ? (
                        <img src={captchaImage} alt="验证码" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-sm text-gray-500">点击获取</span>
                      )}
                    </div>
                  </div>
                  {errors.captchaCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.captchaCode}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">点击图片刷新验证码</p>
                </div>

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-medium"
                >
                  {loading ? '发送中...' : '发送重置邮件'}
                </Button>
              </form>

              {/* 返回登录 */}
              <div className="mt-6 text-center text-sm text-gray-600">
                想起密码了？
                <Link
                  href="/login"
                  className="ml-1 font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  返回登录
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}