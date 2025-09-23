"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface FormData {
  name: string;
  position: string;
  email: string;
  description: string;
  captchaCode: string;
}

interface CaptchaData {
  imageUrl: string;
}

interface FormErrors {
  name?: string;
  position?: string;
  email?: string;
  description?: string;
  captchaCode?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    position: '',
    email: '',
    description: '',
    captchaCode: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  // 获取验证码
  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const response = await fetch('/api/captcha');
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setCaptcha({ imageUrl });
        // 清空验证码输入
        setFormData(prev => ({ ...prev, captchaCode: '' }));
      } else {
        console.error('获取验证码失败');
      }
    } catch (error) {
      console.error('获取验证码出错:', error);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  // 组件挂载时获取验证码
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入您的姓名';
    }

    if (!formData.position.trim()) {
      newErrors.position = '请输入您的职位名称';
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入联系邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请描述您的需求';
    } else if (formData.description.length > 2000) {
      newErrors.description = '需求描述不能超过2000个字符';
    }

    if (!formData.captchaCode.trim()) {
      newErrors.captchaCode = '请输入验证码';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 检查验证码是否存在
      if (!captcha?.imageUrl) {
        alert('请先获取验证码');
        return;
      }

      // 调用联系表单API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '提交失败，请稍后重试');
      }

      setSubmitted(true);
      setFormData({
        name: '',
        position: '',
        email: '',
        description: '',
        captchaCode: ''
      });
      // 刷新验证码
      fetchCaptcha();
    } catch (error) {
      console.error('提交失败:', error);
      // 显示错误信息
      alert(error instanceof Error ? error.message : '提交失败，请稍后重试');
      // 失败时也刷新验证码
      fetchCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-12 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full mb-6">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-green-600 dark:text-green-400 text-2xl font-bold mb-3">
          提交成功！
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
          我们已经收到您的联系信息，将在1-3个工作日内与您取得联系。
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* 表单标题 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-8 py-6 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">联系我们</h3>
          <p className="text-gray-600 dark:text-gray-400">请填写以下信息，我们会尽快与您联系</p>
        </div>

        <div className="p-8">
          {/* 基本信息 */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-2 h-6 bg-blue-600 rounded-full mr-3"></div>
              基本信息
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 姓名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  您的姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${
                    errors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="请输入您的姓名"
                  maxLength={255}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 职位名称 */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  职位名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${
                    errors.position ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="请输入您的职位名称"
                  maxLength={255}
                />
                {errors.position && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.position}
                  </p>
                )}
              </div>
            </div>

            {/* 联系邮箱 */}
            <div className="mt-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                联系邮箱 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${
                  errors.email ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="请输入联系邮箱"
                maxLength={255}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* 需求描述 */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-2 h-6 bg-green-600 rounded-full mr-3"></div>
              需求描述
            </h4>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                详细描述您的需求 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 resize-none ${
                  errors.description ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="请详细描述您的需求，包括期望的服务内容、技术要求、预算范围等信息"
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-3">
                <div>
                  {errors.description && (
                    <p className="text-sm text-red-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.description}
                    </p>
                  )}
                </div>
                <p className={`text-sm transition-colors ${
                  formData.description.length > 1800
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formData.description.length} / 2000
                </p>
              </div>
            </div>
          </div>

          {/* 验证码 */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-2 h-6 bg-purple-600 rounded-full mr-3"></div>
              安全验证
            </h4>
            <div>
              <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                验证码 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <div className="flex-1 max-w-xs">
                  <input
                    type="text"
                    id="captcha"
                    value={formData.captchaCode}
                    onChange={(e) => handleInputChange('captchaCode', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${
                      errors.captchaCode ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="请输入验证码"
                    maxLength={4}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-700 dark:text-gray-300">验证码：</span>
                    {loadingCaptcha ? (
                      <div className="flex items-center justify-center w-32 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg border">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : captcha?.imageUrl ? (
                      <div className="w-32 h-10 bg-white rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                        <img
                          src={captcha.imageUrl}
                          alt="验证码"
                          className="w-full h-full object-cover"
                          onClick={fetchCaptcha}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg border flex items-center justify-center">
                        <span className="text-gray-400 text-sm">加载中...</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={fetchCaptcha}
                    disabled={loadingCaptcha}
                  >
                    {loadingCaptcha ? '刷新中...' : '刷新'}
                  </button>
                </div>
              </div>
              {errors.captchaCode && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.captchaCode}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                请输入验证码图片中的字符，点击图片或刷新按钮可更换验证码
              </p>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 text-lg font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  提交中...
                </span>
              ) : (
                '联系我们'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}