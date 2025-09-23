"use client";

import React from 'react';
import { useUsageStats, useUserSubscription } from '../../lib/hooks/use-api';
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
    '7days': {
      pieData: calculatePeriodData(7),
      chartData: chartData
    },
    '30days': {
      pieData: calculatePeriodData(30),
      chartData: chartData
    }
  };

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
      <div className="space-y-6">
        {/* 当前使用套餐 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-[#0D0E24] dark:text-white">
                当前使用套餐:
              </h2>
              <div className="flex items-center space-x-6">
                <div className="text-sm text-[#565766] dark:text-gray-400">
                  到期时间：
                  <span className="ml-2 font-semibold text-black dark:text-white">
                    {subscriptionData?.subscription?.period?.expires_at
                      ? new Date(subscriptionData.subscription.period.expires_at).toLocaleDateString('zh-CN')
                      : '永久有效'
                    }
                  </span>
                </div>
                <div className="text-sm text-[#565766] dark:text-gray-400">
                  剩余天数：
                  <span className="ml-2 font-semibold text-black dark:text-white">
                    {subscriptionData?.subscription?.period?.remaining_days !== null
                      ? `${subscriptionData.subscription.period.remaining_days}天`
                      : '永久'
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                阅读教程
              </Button>
              <Button size="sm">
                立即续费
              </Button>
            </div>
          </div>

          {/* 套餐详情 */}
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="text-sm text-[#565766] dark:text-gray-400 mb-2">
                类型: {subscriptionData?.subscription?.plan?.display_name || '未知套餐'}
              </div>
              <div className="text-sm text-[#565766] dark:text-gray-400 mb-4">
                {subscriptionData?.subscription?.plan?.description || '套餐描述'}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {(subscriptionData?.subscription?.plan?.features || []).map((feature: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <span className="text-sm text-[#565766] dark:text-gray-400">
                  每次临时增加 <span className="text-blue-600">$50.00</span>，当天有效
                </span>
                <Button size="sm">
                  点我临时提额
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:w-80">
              <div className="bg-[#F9FAFC] dark:bg-gray-700 rounded-lg p-3">
                <div className="font-semibold text-black dark:text-white">
                  ${subscriptionData?.quota?.daily_limit?.toFixed(2) || '200.00'}
                </div>
                <div className="text-sm text-[#565766] dark:text-gray-400">基础日额度</div>
              </div>
              <div className="bg-[#F9FAFC] dark:bg-gray-700 rounded-lg p-3">
                <div className="font-semibold text-black dark:text-white">
                  ${subscriptionData?.quota?.temporary_quota?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-[#565766] dark:text-gray-400">今日临时额度</div>
              </div>
              <div className="bg-[#F9FAFC] dark:bg-gray-700 rounded-lg p-3">
                <div className="font-semibold text-black dark:text-white">
                  ${((subscriptionData?.quota?.daily_limit || 0) + (subscriptionData?.quota?.temporary_quota || 0)).toFixed(2)}
                </div>
                <div className="text-sm text-[#565766] dark:text-gray-400">今日有效上限</div>
              </div>
              <div className="bg-[#F9FAFC] dark:bg-gray-700 rounded-lg p-3">
                <div className="font-semibold text-black dark:text-white">
                  ${(todayData?.cost || 0).toFixed(4)}
                </div>
                <div className="text-sm text-[#565766] dark:text-gray-400">今日已消费</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 主要数据展示区域 */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* 今日统计和趋势图 */}
          <div className="xl:col-span-3">
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#0D0E24] dark:text-white">今日统计</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                {todayStats.map((stat, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 group cursor-pointer">
                    <div className="text-xs font-medium text-[#565766] dark:text-gray-400 mb-2 uppercase tracking-wider">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-bold text-[#0D0E24] dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                      {stat.value}
                    </div>
                    <div className="text-xs text-[#9E9FA7] dark:text-gray-500 mb-2">较昨日</div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#D8F3E5] text-[#29BA63] px-2 py-1 rounded-lg text-xs font-medium">
                        {stat.change}
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-[#29BA63]" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 累计统计 */}
          <div className="xl:col-span-1">
            <Card className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#0D0E24] dark:text-white">累计统计</h2>
                <Badge variant="secondary" className="bg-[#FF9A41] text-white hover:bg-[#FF9A41]/80">
                  历史统计
                </Badge>
              </div>

              {/* 总花费卡片 */}
              <div
                className="rounded-xl p-5 mb-6 text-white bg-cover bg-center bg-no-repeat shadow-lg border border-white/10"
                style={{backgroundImage: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`}}
              >
                <div className="flex justify-between items-center border-b border-white/20 pb-3 mb-3">
                  <span className="text-sm font-medium">当前总花费</span>
                  <span className="bg-white/20 px-3 py-1 rounded-lg text-xs">单位：$美元</span>
                </div>
                <div className="text-2xl font-bold mb-2">
                  ${(usageStats?.total_cost || 0).toFixed(4)}
                </div>
                <div className="text-sm opacity-90">
                  较昨日 <span className="text-yellow-200">+{(todayData?.cost || 0).toFixed(4)}</span>
                </div>
              </div>

              {/* 累计统计数据 */}
              <div className="flex-1 space-y-4">
                {totalStats.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm font-medium text-[#565766] dark:text-gray-400">{stat.label}</span>
                    <span className="text-sm font-bold text-[#0D0E24] dark:text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token使用分布 */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-semibold text-[#0D0E24] dark:text-white">Token使用分布</CardTitle>
              <CardDescription className="text-sm text-[#9E9FA7] dark:text-gray-400">
                今日各类Token使用情况统计
              </CardDescription>
            </CardHeader>
            <div className="h-96">
              <TokenDistributionChart
                data={timeRangeData.today.pieData}
              />
            </div>
          </Card>

          {/* 7天使用趋势 */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-semibold text-[#0D0E24] dark:text-white">7天使用趋势</CardTitle>
              <CardDescription className="text-sm text-[#9E9FA7] dark:text-gray-400">
                最近7天的Token使用量和费用变化趋势
              </CardDescription>
            </CardHeader>
            <div className="h-96">
              <UsageTrendChart
                data={timeRangeData.today.chartData}
              />
            </div>
          </Card>
        </div>

        {/* 最近使用记录 */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-lg font-semibold text-[#0D0E24] dark:text-white">最近使用记录</CardTitle>
            <CardDescription className="text-sm text-[#9E9FA7] dark:text-gray-400">
              最近7天的详细使用数据
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>输入Token</TableHead>
                  <TableHead>输出Token</TableHead>
                  <TableHead>缓存创建</TableHead>
                  <TableHead>缓存读取</TableHead>
                  <TableHead>请求数</TableHead>
                  <TableHead>费用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.slice(-7).reverse().map((day, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{day.date}</TableCell>
                    <TableCell>{day.inputTokens.toLocaleString()}</TableCell>
                    <TableCell>{day.outputTokens.toLocaleString()}</TableCell>
                    <TableCell>{day.cacheCreated.toLocaleString()}</TableCell>
                    <TableCell>{day.cacheRead.toLocaleString()}</TableCell>
                    <TableCell>{day.requests.toLocaleString()}</TableCell>
                    <TableCell>${day.cost.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}