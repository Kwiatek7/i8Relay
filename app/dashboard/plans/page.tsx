"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useGroupedPlans } from '../../../lib/hooks/use-api';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  Star,
  Crown,
  Code,
  Globe,
  Building,
  Package
} from 'lucide-react';
import type { Plan, PlanGroup } from '../../../lib/types';

const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'Code': return Code;
    case 'Zap': return Package;
    case 'Globe': return Globe;
    case 'Building': return Building;
    case 'Package': return Package;
    default: return Package;
  }
};

export default function PlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeGroup, setActiveGroup] = useState<string>('all');

  // 获取分组套餐数据
  const {
    data: groupedPlans,
    loading: plansLoading,
    error: plansError,
    refresh: refreshPlans
  } = useGroupedPlans();

  // 模拟当前套餐（从用户数据获取）
  const currentPlan = user?.plan ? {
    userPlanId: user.id,
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remainingDays: 30,
    name: user.plan === 'free' ? '免费版' : user.plan === 'basic' ? '基础版' : user.plan === 'pro' ? '专业版' : '企业版',
    description: '当前使用套餐',
    price: user.plan === 'free' ? 0 : user.plan === 'basic' ? 99 : user.plan === 'pro' ? 299 : 999,
    features: groupedPlans?.find(group =>
      group.plans?.find((p: Plan) => p.id === user.plan)
    )?.plans?.find((p: Plan) => p.id === user.plan)?.features || []
  } : null;

  useEffect(() => {
    // 设置默认活动分组
    if (groupedPlans && groupedPlans.length > 0 && activeGroup === 'all') {
      const featuredGroup = groupedPlans.find(group => group.is_featured);
      if (featuredGroup) {
        setActiveGroup(featuredGroup.id);
      }
    }
  }, [groupedPlans, activeGroup]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '/');
  };

  const handlePlanSelect = async (plan: Plan) => {
    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: plan.id,
          payment_method: 'balance',
        }),
      });

      if (response.ok) {
        alert('购买成功！');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || '购买失败');
      }
    } catch (error) {
      console.error('购买套餐失败:', error);
      alert('购买失败，请稍后重试');
    }
  };

  const handleRenew = () => {
    router.push('/pricing');
  };

  const getButtonText = (plan: Plan) => {
    if (!currentPlan) {
      return '立即购买';
    }
    if (plan.name === currentPlan.name) {
      return '当前套餐';
    }
    return '立即购买';
  };

  const isButtonDisabled = (plan: Plan) => {
    if (!currentPlan) {
      return false;
    }
    return plan.name === currentPlan.name;
  };

  const isCurrentPlan = (planName: string) => {
    return currentPlan?.name === planName;
  };

  const activeGroupData = activeGroup === 'all'
    ? null
    : groupedPlans?.find(group => group.id === activeGroup);

  const featuredGroups = groupedPlans?.filter(group => group.is_featured) || [];
  const regularGroups = groupedPlans?.filter(group => !group.is_featured) || [];

  if (plansLoading) {
    return (
      <DashboardLayout
        title="套餐计划"
        subtitle="选择适合您需求的套餐方案"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (plansError) {
    return (
      <DashboardLayout
        title="套餐计划"
        subtitle="选择适合您需求的套餐方案"
      >
        <Card className="text-center p-8 max-w-md mx-auto">
          <div className="text-red-500 text-lg mb-4 font-semibold">套餐数据加载失败</div>
          <div className="text-gray-600 dark:text-gray-400 mb-6">{plansError}</div>
          <Button onClick={refreshPlans}>
            重试
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="套餐计划"
      subtitle="选择适合您需求的套餐方案"
    >
      <div className="space-y-8">
        {/* 当前套餐信息 */}
        {currentPlan && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-500" />
                    当前套餐
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    您正在使用的套餐信息
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  活跃中
                </Badge>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentPlan.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  套餐类型
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ¥{currentPlan.price}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  月费价格
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentPlan.remainingDays}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  剩余天数
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {formatDate(currentPlan.endAt).split(' ')[0]}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  到期时间
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={handleRenew} className="bg-blue-600 hover:bg-blue-700">
                续费套餐
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/billing')}>
                查看账单
              </Button>
            </div>
          </Card>
        )}

        {/* 套餐分组导航 */}
        {groupedPlans && groupedPlans.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveGroup('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeGroup === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              全部套餐
            </button>
            {groupedPlans.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeGroup === group.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {group.is_featured && <Star className="w-4 h-4" />}
                {group.name}
              </button>
            ))}
          </div>
        )}

        {/* 套餐列表 */}
        {activeGroup === 'all' ? (
          // 显示所有分组
          <div className="space-y-8">
            {featuredGroups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    推荐
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.plans?.map((plan: Plan) => {
                    const IconComponent = getIconComponent(plan.icon);
                    return (
                      <Card
                        key={plan.id}
                        className={`relative p-6 transition-all duration-200 hover:shadow-lg ${
                          isCurrentPlan(plan.name)
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:shadow-xl'
                        }`}
                      >
                        {isCurrentPlan(plan.name) && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-blue-600 text-white px-3 py-1">
                              当前套餐
                            </Badge>
                          </div>
                        )}

                        <CardHeader className="p-0 mb-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                              <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {plan.name}
                              </CardTitle>
                              <CardDescription className="text-gray-600 dark:text-gray-400">
                                {plan.description}
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                              ¥{plan.price}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              /{plan.billing_period === 'monthly' ? '月' : '年'}
                            </span>
                          </div>
                        </CardHeader>

                        <div className="space-y-3 mb-6">
                          {plan.features?.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={() => handlePlanSelect(plan)}
                          disabled={isButtonDisabled(plan)}
                          className={`w-full ${
                            isCurrentPlan(plan.name)
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {getButtonText(plan)}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

            {regularGroups.map((group) => (
              <div key={group.id}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {group.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.plans?.map((plan: Plan) => {
                    const IconComponent = getIconComponent(plan.icon);
                    return (
                      <Card
                        key={plan.id}
                        className={`relative p-6 transition-all duration-200 hover:shadow-lg ${
                          isCurrentPlan(plan.name)
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:shadow-xl'
                        }`}
                      >
                        {isCurrentPlan(plan.name) && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-blue-600 text-white px-3 py-1">
                              当前套餐
                            </Badge>
                          </div>
                        )}

                        <CardHeader className="p-0 mb-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                              <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {plan.name}
                              </CardTitle>
                              <CardDescription className="text-gray-600 dark:text-gray-400">
                                {plan.description}
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                              ¥{plan.price}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              /{plan.billing_period === 'monthly' ? '月' : '年'}
                            </span>
                          </div>
                        </CardHeader>

                        <div className="space-y-3 mb-6">
                          {plan.features?.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={() => handlePlanSelect(plan)}
                          disabled={isButtonDisabled(plan)}
                          className={`w-full ${
                            isCurrentPlan(plan.name)
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {getButtonText(plan)}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 显示特定分组
          activeGroupData && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGroupData.plans?.map((plan: Plan) => {
                  const IconComponent = getIconComponent(plan.icon);
                  return (
                    <Card
                      key={plan.id}
                      className={`relative p-6 transition-all duration-200 hover:shadow-lg ${
                        isCurrentPlan(plan.name)
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:shadow-xl'
                      }`}
                    >
                      {isCurrentPlan(plan.name) && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-blue-600 text-white px-3 py-1">
                            当前套餐
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="p-0 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                              {plan.name}
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                              {plan.description}
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            ¥{plan.price}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            /{plan.billing_period === 'monthly' ? '月' : '年'}
                          </span>
                        </div>
                      </CardHeader>

                      <div className="space-y-3 mb-6">
                        {plan.features?.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => handlePlanSelect(plan)}
                        disabled={isButtonDisabled(plan)}
                        className={`w-full ${
                          isCurrentPlan(plan.name)
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {getButtonText(plan)}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}