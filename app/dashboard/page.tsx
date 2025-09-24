"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUsageStats, useUserSubscription, useTemporaryQuota } from '../../lib/hooks/use-api';
import { useAuth } from '../../lib/auth-context';
import { authService } from '../../lib/auth/service';
import { useToast } from '@/components/ui/toast';
import { EmailVerificationDialog } from '@/components/email-verification-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TokenDistributionChart } from '@/components/charts/token-distribution-chart';
import { UsageTrendChart } from '@/components/charts/usage-trend-chart';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  ArrowUpRight,
  Gauge,
  TrendingUp,
  Server,
  Clock,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // 邮箱验证相关状态
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<{
    isVerified: boolean;
    verifiedAt?: string;
    email?: string;
  }>({ isVerified: false });

  // 获取使用统计数据
  const {
    data: usageStats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats
  } = useUsageStats('month');

  // 获取用户订阅信息
  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
    refresh: refreshSubscription
  } = useUserSubscription();

  // 临时提额相关
  const {
    loading: tempQuotaLoading,
    error: tempQuotaError,
    requestTemporaryQuota,
    clearError: clearTempQuotaError
  } = useTemporaryQuota();

  // Token使用分布时间范围状态
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // 检查URL参数，显示邮箱验证对话框
  useEffect(() => {
    const showEmailVerification = searchParams.get('show_email_verification');
    if (showEmailVerification === 'true') {
      setShowEmailVerificationDialog(true);
      // 清理URL参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('show_email_verification');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

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

  // 处理临时提额
  const handleTemporaryQuotaIncrease = async () => {
    try {
      clearTempQuotaError();
      const result = await requestTemporaryQuota();
      
      if (result.success && result.data) {
        toast({
          type: 'success',
          title: '临时提额成功！',
          description: `已成功增加临时额度 $${result.data.amount}，当天有效`,
          duration: 5000
        });
        
        // 刷新订阅数据以更新UI
        await refreshSubscription();
      } else {
        toast({
          type: 'error',
          title: '临时提额失败',
          description: result.error || '操作失败，请稍后重试',
          duration: 5000
        });
      }
    } catch (error) {
      toast({
        type: 'error',
        title: '临时提额失败',
        description: error instanceof Error ? error.message : '操作失败，请稍后重试',
        duration: 5000
      });
    }
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

  // 处理加载状态
  const loading = statsLoading || subscriptionLoading;

  // 获取今日数据（最后一天的数据）
  const todayData = usageStats?.daily_requests?.[usageStats.daily_requests.length - 1];

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const todayStats = [
    {
      label: '总Token',
      value: formatNumber(todayData?.tokens || 0),
      change: '+12.5%',
      icon: <Gauge className="w-6 h-6 text-blue-600" />
    },
    {
      label: '输入Token',
      value: formatNumber(todayData?.inputTokens || 0),
      change: '+8.3%',
      icon: <ArrowUpRight className="w-6 h-6 text-green-600" />
    },
    {
      label: '输出Token',
      value: formatNumber(todayData?.outputTokens || 0),
      change: '+15.2%',
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />
    },
    {
      label: '缓存创建',
      value: formatNumber(todayData?.cacheCreated || 0),
      change: '+22.1%',
      icon: <Server className="w-6 h-6 text-orange-600" />
    },
    {
      label: '缓存读取',
      value: formatNumber(todayData?.cacheRead || 0),
      change: '+18.7%',
      icon: <Clock className="w-6 h-6 text-teal-600" />
    },
    {
      label: '请求数',
      value: formatNumber(todayData?.requests || 0),
      change: '+9.4%',
      icon: <Activity className="w-6 h-6 text-indigo-600" />
    }
  ];

  // 计算累计统计数据
  const calculateTotalStats = () => {
    if (!usageStats?.daily_requests) return [];

    const totals = usageStats.daily_requests.reduce((acc, day) => ({
      tokens: acc.tokens + (day.tokens || 0),
      inputTokens: acc.inputTokens + (day.inputTokens || 0),
      outputTokens: acc.outputTokens + (day.outputTokens || 0),
      cacheCreated: acc.cacheCreated + (day.cacheCreated || 0),
      cacheRead: acc.cacheRead + (day.cacheRead || 0),
      requests: acc.requests + (day.requests || 0)
    }), { tokens: 0, inputTokens: 0, outputTokens: 0, cacheCreated: 0, cacheRead: 0, requests: 0 });

    return [
      {
        label: '总Token',
        value: formatNumber(totals.tokens)
      },
      {
        label: '输入Token',
        value: formatNumber(totals.inputTokens)
      },
      {
        label: '输出Token',
        value: formatNumber(totals.outputTokens)
      },
      {
        label: '缓存创建',
        value: formatNumber(totals.cacheCreated)
      },
      {
        label: '缓存读取',
        value: formatNumber(totals.cacheRead)
      },
      {
        label: '请求数',
        value: formatNumber(totals.requests)
      }
    ];
  };

  const totalStats = calculateTotalStats();

  // 生成图表数据
  const generateChartData = () => {
    if (!usageStats?.daily_requests) return [];

    // 取最近7天的数据用于图表显示
    return usageStats.daily_requests.slice(-7).map(day => ({
      date: new Date(day.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      totalTokens: day.tokens,
      inputTokens: day.inputTokens || 0,
      outputTokens: day.outputTokens || 0,
      cacheCreated: day.cacheCreated || 0,
      cacheRead: day.cacheRead || 0,
      requests: day.requests,
      cost: day.cost
    }));
  };

  const generatePieData = () => {
    const today = todayData;
    if (!today) return [];

    return [
      { name: '输入Token', value: today.inputTokens || 0, color: '#3b82f6' },
      { name: '输出Token', value: today.outputTokens || 0, color: '#10b981' },
      { name: '缓存创建', value: today.cacheCreated || 0, color: '#f59e0b' },
      { name: '缓存读取', value: today.cacheRead || 0, color: '#8b5cf6' }
    ].filter(item => item.value > 0);
  };

  // 计算时间段数据
  const calculatePeriodData = (days: number) => {
    if (!usageStats?.daily_requests) return [];

    const periodData = usageStats.daily_requests.slice(-days);
    const totals = periodData.reduce((acc, day) => ({
      inputTokens: acc.inputTokens + (day.inputTokens || 0),
      outputTokens: acc.outputTokens + (day.outputTokens || 0),
      cacheTokens: acc.cacheTokens + (day.cacheCreated || 0) + (day.cacheRead || 0)
    }), { inputTokens: 0, outputTokens: 0, cacheTokens: 0 });

    return [
      { name: '输入Token', value: totals.inputTokens, color: '#3B82F6' },
      { name: '输出Token', value: totals.outputTokens, color: '#10B981' },
      { name: '缓存Token', value: totals.cacheTokens, color: '#F59E0B' }
    ];
  };

  // 不同时间段的数据
  const chartData = generateChartData();
  const pieData = generatePieData();

  const timeRangeData = {
    today: {
      pieData: pieData,
      chartData: chartData
    },
    week: {
      pieData: calculatePeriodData(7),
      chartData: chartData
    },
    month: {
      pieData: calculatePeriodData(30),
      chartData: chartData
    }
  };

  // 获取当前选择时间范围的数据
  const getCurrentPieData = () => {
    return timeRangeData[timeRange].pieData;
  };

  // 时间范围选项
  const timeRangeOptions = [
    { value: 'today', label: '当天', description: "Today's Distribution" },
    { value: 'week', label: '本周', description: "This Week's Distribution" },
    { value: 'month', label: '本月', description: "This Month's Distribution" }
  ];

  if (loading) {
    return (
      <DashboardLayout
        title="数据仪表板"
        subtitle="实时监控您的API使用情况和费用统计"
      >
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
            <div className="xl:col-span-1">
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 错误显示组件
  if (statsError) {
    return (
      <DashboardLayout
        title="数据仪表板"
        subtitle="实时监控您的API使用情况和费用统计"
      >
        <Card className="text-center p-8 max-w-md mx-auto">
          <div className="text-red-500 text-lg mb-4 font-semibold">数据加载失败</div>
          <div className="text-gray-600 dark:text-gray-400 mb-6">{statsError}</div>
          <Button onClick={refreshStats}>
            重试
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="数据仪表板"
      subtitle="实时监控您的API使用情况和费用统计"
    >
      <div className="space-y-4">
        {/* 当前使用套餐 */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <h2 className="text-lg font-bold text-[#0D0E24] dark:text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                当前使用套餐
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                  <span className="text-[#565766] dark:text-gray-400">到期时间</span>
                  <span className="font-semibold text-[#0D0E24] dark:text-white">
                    {subscriptionData?.subscription?.period?.expires_at
                      ? new Date(subscriptionData.subscription.period.expires_at).toLocaleDateString('zh-CN')
                      : '永久有效'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                  <span className="text-[#565766] dark:text-gray-400">剩余天数</span>
                  <span className="font-semibold text-[#0D0E24] dark:text-white">
                    {subscriptionData?.subscription?.period?.remaining_days !== null
                      ? `${subscriptionData.subscription.period.remaining_days}天`
                      : '永久'
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => router.push('/docs')}>
                阅读教程
              </Button>
              <Button size="sm" onClick={() => router.push('/dashboard/plans')}>
                立即续费
              </Button>
            </div>
          </div>

          {/* 套餐详情 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 套餐信息 */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-semibold text-[#0D0E24] dark:text-white">
                    {subscriptionData?.subscription?.plan?.display_name || '未知套餐'}
                  </span>
                  <p className="text-xs text-[#565766] dark:text-gray-400">
                    {subscriptionData?.subscription?.plan?.description || '套餐描述'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(subscriptionData?.subscription?.plan?.features || []).map((feature: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-600">
                    {feature}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-[#565766] dark:text-gray-400">
                    每次临时增加 <span className="text-blue-600 font-semibold">$50.00</span>，当天有效
                  </span>
                </div>
                <Button 
                  size="sm"
                  onClick={handleTemporaryQuotaIncrease}
                  disabled={tempQuotaLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 h-8 px-3 text-xs rounded-full shadow-md"
                >
                  {tempQuotaLoading ? '提额中...' : '点我临时提额'}
                </Button>
              </div>
            </div>

            {/* 额度统计 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${subscriptionData?.quota?.daily_limit?.toFixed(2) || '200.00'}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">基础日额度</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  ${subscriptionData?.quota?.temporary_quota?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">今日临时额度</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  ${((subscriptionData?.quota?.daily_limit || 0) + (subscriptionData?.quota?.temporary_quota || 0)).toFixed(2)}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300">今日有效上限</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  ${(todayData?.cost || 0).toFixed(4)}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">今日已消费</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 主要数据展示区域 */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* 今日统计 */}
          <div className="xl:col-span-3">
            <Card className="p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0D0E24] dark:text-white">今日统计</h2>
                    <p className="text-xs text-[#9E9FA7] dark:text-gray-400">Today's Usage Overview</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  实时数据
                </Badge>
              </div>

              <div className="grid grid-cols-3 grid-rows-2 gap-4 h-96">
                {todayStats.map((stat, index) => (
                  <div key={index} className="relative group h-full">
                    <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-500 hover:scale-105 transition-all duration-300 cursor-pointer h-full flex flex-col justify-between">
                      {/* 顶部区域：图标和状态灯 */}
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-500 group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-600 dark:group-hover:to-blue-500 transition-all">
                          {stat.icon}
                        </div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                      </div>

                      {/* 中间区域：标签 */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-sm font-semibold text-[#565766] dark:text-gray-400 mb-2">
                          {stat.label}
                        </div>
                        <div className="text-3xl font-bold text-[#0D0E24] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                          {stat.value}
                        </div>
                      </div>

                      {/* 底部区域：趋势 */}
                      <div className="flex items-center gap-2 justify-center">
                        <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">{stat.change}</span>
                        <span className="text-xs text-[#9E9FA7] dark:text-gray-500">较昨日</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 累计统计 */}
          <div className="xl:col-span-2">
            <Card className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0D0E24] dark:text-white">累计统计</h2>
                    <p className="text-xs text-[#9E9FA7] dark:text-gray-400">Historical Overview</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                  历史数据
                </Badge>
              </div>

              {/* 总花费卡片 - 优化版 */}
              <div className="relative rounded-xl p-4 mb-4 text-white bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 shadow-lg overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-2 right-2 w-4 h-4 bg-white/20 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-2 h-2 bg-white/30 rounded-full"></div>
                  <div className="absolute top-6 left-8 w-1 h-1 bg-white/40 rounded-full"></div>
                </div>
                <div className="relative">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-5 bg-white rounded-full"></div>
                      <span className="text-sm font-medium">累计总花费</span>
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">USD</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    ${(usageStats?.total_cost || 0).toFixed(4)}
                  </div>
                  <div className="text-sm opacity-90">
                    今日 <span className="text-yellow-200 font-medium">+${(todayData?.cost || 0).toFixed(4)}</span>
                  </div>
                </div>
              </div>

              {/* 累计统计数据 - 紧凑网格版 */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {totalStats.map((stat, index) => (
                    <div key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-all duration-200 rounded-lg border border-gray-100 dark:border-gray-600 p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.8 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 group-hover:scale-125 transition-transform"></div>
                        <span className="text-xs font-medium text-[#565766] dark:text-gray-400 group-hover:text-[#0D0E24] dark:group-hover:text-white transition-colors leading-tight">
                          {stat.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#0D0E24] dark:text-white bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-center inline-block min-w-[50px]">
                          {stat.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Token使用分布 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0D0E24] dark:text-white">Token使用分布</h3>
                  <p className="text-xs text-[#9E9FA7] dark:text-gray-400">
                    {timeRangeOptions.find(option => option.value === timeRange)?.description}
                  </p>
                </div>
              </div>
              <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value as 'today' | 'week' | 'month')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                      timeRange === option.value
                        ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80 w-full">
              <TokenDistributionChart
                data={getCurrentPieData()}
              />
            </div>
          </Card>

          {/* 7天使用趋势 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0D0E24] dark:text-white">7天使用趋势</h3>
                  <p className="text-xs text-[#9E9FA7] dark:text-gray-400">7-Day Usage Trends</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                趋势
              </Badge>
            </div>
            <div className="h-80 w-full">
              <UsageTrendChart
                data={timeRangeData.today.chartData}
              />
            </div>
          </Card>
        </div>

        {/* 最近使用记录 */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0D0E24] dark:text-white">最近使用记录</h3>
                <p className="text-xs text-[#9E9FA7] dark:text-gray-400">Recent 7 Days Usage Details</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
              详细数据
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-xs font-semibold text-[#565766] dark:text-gray-300 uppercase tracking-wider">日期</TableHead>
                  <TableHead className="text-xs font-semibold text-[#565766] dark:text-gray-300 uppercase tracking-wider">输入Token</TableHead>
                  <TableHead className="text-xs font-semibold text-[#565766] dark:text-gray-300 uppercase tracking-wider">输出Token</TableHead>
                  <TableHead className="text-xs font-semibold text-[#565766] dark:text-gray-300 uppercase tracking-wider">缓存创建</TableHead>
                  <TableHead className="text-xs font-semibold text-[#565766] dark:text-gray-300 uppercase tracking-wider">缓存读取</TableHead>
                  <TableHead className="text-xs font-semibold text-[#565766] dark:text-gray-300 uppercase tracking-wider">请求数</TableHead>
                  <TableHead className="text-xs font-semibold text-[#565766] dark:text-gray-300 uppercase tracking-wider">费用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.slice(-7).reverse().map((day, index) => (
                  <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-800">
                    <TableCell className="font-medium text-sm text-[#0D0E24] dark:text-white py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        {day.date}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#565766] dark:text-gray-300 py-3">
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md text-xs font-medium">
                        {day.inputTokens.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#565766] dark:text-gray-300 py-3">
                      <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-md text-xs font-medium">
                        {day.outputTokens.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#565766] dark:text-gray-300 py-3">
                      <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md text-xs font-medium">
                        {day.cacheCreated.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#565766] dark:text-gray-300 py-3">
                      <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md text-xs font-medium">
                        {day.cacheRead.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#565766] dark:text-gray-300 py-3">
                      <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md text-xs font-medium">
                        {day.requests.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-[#0D0E24] dark:text-white py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">${day.cost.toFixed(4)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 邮箱验证对话框 */}
        <EmailVerificationDialog
          isOpen={showEmailVerificationDialog}
          onClose={() => setShowEmailVerificationDialog(false)}
          userEmail={user?.email || ''}
          onVerificationSent={handleVerificationSent}
          onVerificationComplete={handleVerificationComplete}
        />
      </div>
    </DashboardLayout>
  );
}