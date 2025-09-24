"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useApiKeys } from '../../../lib/hooks/use-api';
import { authService } from '../../../lib/auth/service';
import { useToast } from '@/components/ui/toast';
import { EmailVerificationDialog } from '@/components/email-verification-dialog';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Key,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout, updateProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRegenerateAlert, setShowRegenerateAlert] = useState(false);
  
  // 邮箱验证相关状态
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<{
    isVerified: boolean;
    verifiedAt?: string;
    email?: string;
  }>({ isVerified: false });
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);

  // 获取API密钥数据
  const {
    apiKeys,
    loading: apiKeysLoading,
    error: apiKeysError,
    refresh: refreshApiKeys,
    createApiKey,
    deleteApiKey
  } = useApiKeys();

  // 处理加载状态
  const loading = authLoading || apiKeysLoading;

  // 获取主要API密钥
  const primaryApiKey = apiKeys.find(key => key.is_active) || apiKeys[0];

  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    nickname: user?.username || ''
  });

  // 当用户数据加载完成后更新表单
  useEffect(() => {
    if (user) {
      setProfileForm({
        email: user.email,
        nickname: user.username
      });
    }
  }, [user]);

  // 获取邮箱验证状态
  useEffect(() => {
    const fetchEmailVerificationStatus = async () => {
      try {
        const result = await authService.getEmailVerificationStatus();
        if (result.success && result.data) {
          setEmailVerificationStatus(result.data);
        }
      } catch (error) {
        console.error('获取邮箱验证状态失败:', error);
      }
    };

    if (user) {
      fetchEmailVerificationStatus();
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <DashboardLayout
        title="个人资料"
        subtitle="管理您的个人信息和账户安全"
      >
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // 错误显示组件
  if (apiKeysError) {
    return (
      <DashboardLayout
        title="个人资料"
        subtitle="管理您的个人信息和账户安全"
      >
        <Card className="text-center p-8 max-w-md mx-auto">
          <div className="text-red-500 text-lg mb-4 font-semibold">API密钥数据加载失败</div>
          <div className="text-gray-600 dark:text-gray-400 mb-6">{apiKeysError}</div>
          <Button onClick={refreshApiKeys}>
            重试
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await updateProfile({
        username: profileForm.nickname,
        email: profileForm.email
      });

      if (result.success) {
        toast({
          type: 'success',
          title: '更新成功',
          description: '个人信息已成功更新'
        });
      } else {
        toast({
          type: 'error',
          title: '更新失败',
          description: result.error || '请稍后重试'
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        type: 'error',
        title: '更新失败',
        description: '网络错误，请稍后重试'
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本验证
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        type: 'warning',
        title: '验证失败',
        description: '请填写所有密码字段'
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        type: 'warning',
        title: '验证失败',
        description: '新密码和确认密码不匹配'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        type: 'warning',
        title: '验证失败',
        description: '新密码长度至少8位'
      });
      return;
    }

    try {
      const result = await authService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      if (result.success) {
        toast({
          type: 'success',
          title: '修改成功',
          description: '密码已成功修改'
        });
        // 重置表单
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast({
          type: 'error',
          title: '修改失败',
          description: result.error?.message || '请稍后重试'
        });
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        type: 'error',
        title: '修改失败',
        description: '网络错误，请稍后重试'
      });
    }
  };

  const handleGenerateApiKey = async () => {
    setShowRegenerateAlert(false);
    try {
      const result = await createApiKey('默认密钥');
      if (result.success) {
        toast({
          type: 'success',
          title: '生成成功',
          description: 'API密钥已成功生成'
        });
        refreshApiKeys(); // 刷新密钥列表
      } else {
        toast({
          type: 'error',
          title: '生成失败',
          description: result.error || '请稍后重试'
        });
      }
    } catch (error) {
      console.error('API key generation error:', error);
      toast({
        type: 'error',
        title: '生成失败',
        description: '网络错误，请稍后重试'
      });
    }
  };

  // 处理邮箱验证
  const handleEmailVerification = () => {
    setShowEmailVerificationDialog(true);
  };

  // 验证邮件发送成功回调
  const handleVerificationSent = () => {
    toast({
      type: 'info',
      title: '验证邮件已发送',
      description: '请查收邮箱并点击验证链接'
    });
  };

  // 验证完成回调
  const handleVerificationComplete = () => {
    // 重新获取验证状态
    const fetchEmailVerificationStatus = async () => {
      try {
        const result = await authService.getEmailVerificationStatus();
        if (result.success && result.data) {
          setEmailVerificationStatus(result.data);
        }
      } catch (error) {
        console.error('获取邮箱验证状态失败:', error);
      }
    };
    fetchEmailVerificationStatus();
    
    toast({
      type: 'success',
      title: '验证成功',
      description: '邮箱验证已完成'
    });
  };

  const copyApiKey = async () => {
    if (!primaryApiKey?.key) {
      toast({
        type: 'warning',
        title: '复制失败',
        description: '没有可复制的API密钥'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(primaryApiKey.key);
      toast({
        type: 'success',
        title: '复制成功',
        description: 'API密钥已复制到剪贴板'
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        type: 'error',
        title: '复制失败',
        description: '请手动复制密钥'
      });
    }
  };

  const copyBaseUrl = async () => {
    // 使用本地API地址，适配部署环境
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/api`
      : '/api';
    try {
      await navigator.clipboard.writeText(baseUrl);
      toast({
        type: 'success',
        title: '复制成功',
        description: 'API地址已复制到剪贴板'
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        type: 'error',
        title: '复制失败',
        description: '请手动复制地址'
      });
    }
  };

  return (
    <DashboardLayout
      title="个人资料"
      subtitle="管理您的个人信息和账户安全"
    >
      <div className="space-y-6">

        {/* 用户信息卡片 */}
        <Card className="p-6">
          <div className="flex items-center">
            <div className="relative mr-4">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                小
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{profileForm.nickname}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{profileForm.email}</p>
              <div className="mt-3 flex items-center gap-4">
                {emailVerificationStatus.isVerified ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    邮箱已验证
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                      onClick={handleEmailVerification}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      邮箱未验证
                    </Badge>
                    <button
                      onClick={handleEmailVerification}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      立即验证
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-right hidden md:block">
              <p className="text-sm text-gray-500 dark:text-gray-400">加入时间</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">2025-09-08</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 个人信息 */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">个人信息</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      邮箱地址
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      昵称
                    </label>
                    <input
                      type="text"
                      value={profileForm.nickname}
                      onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                      placeholder="设置一个昵称"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium"
                  >
                    保存更改
                  </Button>
                </form>
            </CardContent>
          </Card>

          {/* 安全设置 */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">安全设置</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      当前密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="输入当前密码"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      新密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="输入新密码（至少8位）"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      确认新密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="再次输入新密码"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium"
                  >
                    更新密码
                  </Button>
                </form>
            </CardContent>
          </Card>
        </div>

        {/* API 密钥管理 */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">API 密钥管理</CardTitle>
                <span className="text-orange-500 dark:text-orange-400 text-sm">
                  密钥仅显示一次(首次使用需要重新生成一次)
                </span>
              </div>
              <Button
                onClick={copyBaseUrl}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                复制BaseUrl
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  当前密钥
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={primaryApiKey?.key || '暂无API密钥，请生成新密钥'}
                      disabled
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                    <button
                      onClick={copyApiKey}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

            {/* 警告提示 */}
            {showRegenerateAlert && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-300">
                    生成新密钥将立即使旧密钥失效，请谨慎操作
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                if (showRegenerateAlert) {
                  handleGenerateApiKey();
                } else {
                  setShowRegenerateAlert(true);
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              生成新密钥
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 邮箱验证对话框 */}
      <EmailVerificationDialog
        isOpen={showEmailVerificationDialog}
        onClose={() => setShowEmailVerificationDialog(false)}
        userEmail={profileForm.email}
        onVerificationSent={handleVerificationSent}
        onVerificationComplete={handleVerificationComplete}
      />
    </DashboardLayout>
  );
}