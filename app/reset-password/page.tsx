'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { SiteName } from '@/app/components/ui/site-name';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  password: string;
  confirmPassword: string;
}

interface TokenValidation {
  valid: boolean;
  expired: boolean;
  userEmail?: string;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [tokenValidation, setTokenValidation] = useState<TokenValidation | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  // 验证重置令牌
  useEffect(() => {
    if (!token) {
      setTokenValidation({ valid: false, expired: false });
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, action: 'validate' }),
        });

        const data = await response.json();

        if (response.ok) {
          setTokenValidation({
            valid: true,
            expired: false,
            userEmail: data.userEmail,
          });
        } else {
          setTokenValidation({
            valid: false,
            expired: data.error === 'TOKEN_EXPIRED',
          });
        }
      } catch (error) {
        console.error('令牌验证失败:', error);
        setTokenValidation({ valid: false, expired: false });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // 处理表单输入
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 验证密码强度
  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return false;
    }
    return true;
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.password) {
      newErrors.password = '请输入新密码';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码必须至少8位，包含大小写字母和数字';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认新密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交重置密码
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          action: 'reset',
          newPassword: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        // 3秒后跳转到登录页
        setTimeout(() => {
          router.push('/login?message=password_reset_success');
        }, 3000);
      } else {
        if (data.error === 'TOKEN_EXPIRED') {
          setTokenValidation({ valid: false, expired: true });
        } else if (data.error === 'TOKEN_INVALID') {
          setTokenValidation({ valid: false, expired: false });
        } else {
          alert(data.message || '重置失败，请稍后重试');
        }
      }
    } catch (error) {
      console.error('密码重置失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 密码强度指示器
  const getPasswordStrength = (password: string): { level: number; text: string; color: string } => {
    if (!password) return { level: 0, text: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const levels = [
      { level: 0, text: '', color: '' },
      { level: 1, text: '弱', color: 'text-red-500' },
      { level: 2, text: '弱', color: 'text-red-500' },
      { level: 3, text: '中等', color: 'text-yellow-500' },
      { level: 4, text: '强', color: 'text-green-500' },
      { level: 5, text: '很强', color: 'text-green-600' },
    ];

    return levels[strength];
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // 加载中
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">验证重置链接...</p>
        </div>
      </div>
    );
  }

  // 令牌无效或过期
  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {tokenValidation?.expired ? '链接已过期' : '链接无效'}
              </h2>

              <p className="text-gray-600 mb-6">
                {tokenValidation?.expired
                  ? '密码重置链接已过期，请重新申请密码重置。'
                  : '密码重置链接无效，请检查链接是否正确或重新申请。'
                }
              </p>

              <div className="space-y-4">
                <Link href="/forgot-password">
                  <Button className="w-full">
                    重新申请密码重置
                  </Button>
                </Link>

                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    返回登录
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 重置成功
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                密码重置成功
              </h2>

              <p className="text-gray-600 mb-6">
                您的密码已成功重置，现在可以使用新密码登录了。
              </p>

              <p className="text-sm text-gray-500 mb-6">
                页面将在 3 秒后自动跳转到登录页面...
              </p>

              <Link href="/login">
                <Button className="w-full">
                  立即登录
                </Button>
              </Link>
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
          alt="Reset Password"
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
                重置密码
              </h1>
              <p className="text-gray-600 mt-2">
                {tokenValidation?.userEmail ?
                  `为 ${tokenValidation.userEmail} 设置新密码` :
                  '请为您的账户设置新密码'
                }
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 新密码 */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    新密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="请输入新密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-600">密码强度:</span>
                      <span className={`text-sm font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  )}
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    密码至少8位，包含大小写字母和数字
                  </p>
                </div>

                {/* 确认密码 */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    确认新密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="请再次输入新密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-medium"
                >
                  {loading ? '重置中...' : '重置密码'}
                </Button>
              </form>

              {/* 返回登录 */}
              <div className="mt-6 text-center text-sm text-gray-600">
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
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

// 加载中占位符
function LoadingPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <ResetPasswordForm />
    </Suspense>
  );
}