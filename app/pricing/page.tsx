'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useConfig } from '../../lib/providers/config-provider';
import { useRouter } from 'next/navigation';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';

// shadcn/ui 组件
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

// 图标
import { Check, ArrowRight, Code, Zap, Globe, Building, Package, Star, Crown, Sparkles, Users } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features: string[];
  tokens_limit: number;
  requests_limit: number;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  category_id?: string;
  category_name?: string;
}

interface PlanGroup {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_featured: boolean;
  plans: Plan[];
}

const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'Code': return Code;
    case 'Zap': return Zap;
    case 'Globe': return Globe;
    case 'Building': return Building;
    case 'Package': return Package;
    case 'Users': return Users;
    default: return Package;
  }
};

export default function PricingPage() {
  const [groupedPlans, setGroupedPlans] = useState<PlanGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isVisible, setIsVisible] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { config } = useConfig();
  const router = useRouter();

  const fetchGroupedPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/plans?grouped=true');
      if (response.ok) {
        const data = await response.json();
        setGroupedPlans(data.data);
        // 设置默认选中第一个特色分组
        const featuredGroup = data.data.find((group: PlanGroup) => group.is_featured);
        if (featuredGroup) {
          setActiveTab(featuredGroup.id);
        }
      }
    } catch (error) {
      console.error('获取套餐列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupedPlans();
    // 页面加载动画
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchGroupedPlans]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const handlePurchase = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setPurchasing(planId);

    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
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
    } finally {
      setPurchasing(null);
    }
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'monthly': return '月付';
      case 'yearly': return '年付';
      case 'one_time': return '一次性';
      default: return period;
    }
  };

  const isCurrentPlan = (planName: string) => {
    return user?.plan === planName;
  };

  const featuredGroups = groupedPlans.filter(group => group.is_featured);

  const faqs = [
    {
      question: "什么是Token？如何计算消耗？",
      answer: "Token是AI模型处理文本的基本单位。通常1个中文字符约等于2-3个Token，1个英文单词约等于1-2个Token。系统会实时统计您的使用量。"
    },
    {
      question: "支持哪些支付方式？",
      answer: "我们支持支付宝、微信支付、银行卡等多种支付方式。企业用户还可以选择对公转账和月结服务。"
    },
    {
      question: "如何升级或降级套餐？",
      answer: "您可以随时在用户中心升级套餐，升级后立即生效。降级需要在当前周期结束后生效，避免服务中断。"
    },
    {
      question: "API调用有频率限制吗？",
      answer: "不同套餐有不同的频率限制。基础版每分钟最多60次调用，标准版每分钟300次，专业版每分钟1000次。"
    },
    {
      question: "数据安全如何保障？",
      answer: "我们采用企业级加密技术，所有数据传输使用SSL加密。严格遵循数据保护法规，定期进行安全审计。"
    },
    {
      question: "是否提供技术支持？",
      answer: "是的，我们提供多层次技术支持。基础版提供邮件支持，标准版及以上提供工单系统，专业版提供24/7专属支持。"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 现代渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/80 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950"></div>

      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* 内容区域 */}
      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <Header />

        <div className="pt-24 pb-12">
          {/* 页面标题区域 */}
          <div className={`mx-auto w-full max-w-[630px] px-5 text-center transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-blue-200/50 text-blue-700 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-800/70 dark:border-blue-700/50 dark:text-blue-300">
              <Sparkles className="h-4 w-4" />
              简单透明的定价
            </div>
            <h1 className="text-6xl font-extrabold text-gray-900 max-md:text-4xl dark:text-white mb-8 leading-tight">
              选择适合您开发需求的
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> 完美方案</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              立即开始，随时升级。让AI为您的项目加速，创造无限可能。
            </p>
          </div>

          {/* 用户当前套餐信息 */}
          {isAuthenticated && user && (
            <div className={`mx-auto mt-16 max-w-4xl px-5 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 dark:bg-gray-800/70 dark:border-gray-700/30 hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center space-x-6">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg hover:scale-110 transition-transform duration-300">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                        当前套餐: {user.plan}
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                        账户余额: ¥{user.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (user.role === 'admin' || user.role === 'super_admin') {
                        router.push('/admin');
                      } else {
                        router.push('/dashboard');
                      }
                    }}
                    variant="premium"
                    size="lg"
                    className="shrink-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    查看详情
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {loading ? (
            <div className="text-center py-32">
              <div className="relative inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 dark:border-blue-800"></div>
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent absolute"></div>
              </div>
              <p className="mt-8 text-xl text-gray-600 dark:text-gray-400">正在加载套餐信息...</p>
            </div>
          ) : (
            <section className={`mx-auto mt-20 w-full max-w-[1400px] px-8 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* 套餐分组展示 */}
              <div className="space-y-24">
                {groupedPlans.map((group, groupIndex) => {
                  const IconComponent = getIconComponent(group.icon);
                  return (
                    <div
                      key={group.id}
                      className={`space-y-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                      style={{ transitionDelay: `${800 + groupIndex * 200}ms` }}
                    >
                      {/* 分组头部 */}
                      <div className="text-center">
                        <div className="inline-flex items-center gap-4 mb-8 hover:scale-105 transition-transform duration-300">
                          <div
                            className="p-4 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                            style={{
                              backgroundColor: `${group.color}15`,
                              border: `1px solid ${group.color}30`
                            }}
                          >
                            <IconComponent
                              className="h-8 w-8 transition-transform duration-300 hover:scale-110"
                              style={{ color: group.color }}
                            />
                          </div>
                          <div>
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                              {group.display_name}
                            </h2>
                            {group.is_featured && (
                              <Badge
                                className="mt-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white shadow-lg animate-pulse hover:animate-none hover:scale-110 transition-transform duration-300"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                推荐选择
                              </Badge>
                            )}
                          </div>
                        </div>
                        {group.description && (
                          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
                            {group.description}
                          </p>
                        )}
                      </div>

                      {/* 套餐卡片网格 */}
                      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                        {group.plans.map((plan, planIndex) => (
                          <div
                            key={plan.id}
                            className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: `${1000 + groupIndex * 200 + planIndex * 100}ms` }}
                          >
                            <PlanCard
                              plan={plan}
                              groupColor={group.color}
                              isCurrentPlan={isCurrentPlan(plan.name)}
                              onPurchase={handlePurchase}
                              purchasing={purchasing}
                              getPeriodText={getPeriodText}
                            />
                          </div>
                        ))}
                      </div>
                  </div>
                );
              })}
            </div>

              {groupedPlans.length === 0 && (
                <div className="text-center py-32">
                  <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-3xl p-12 shadow-2xl dark:bg-gray-800/70 dark:border-gray-700/30 max-w-lg mx-auto">
                    <Package className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                    <p className="text-2xl text-gray-500 dark:text-gray-400">暂无可用套餐</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 登录提示 */}
          {!isAuthenticated && (
            <div className="mx-auto mt-20 max-w-2xl px-5">
              <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-3xl p-12 shadow-2xl text-center dark:bg-gray-800/70 dark:border-gray-700/30">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-lg mx-auto w-fit mb-8">
                  <Crown className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">
                  开启您的AI之旅
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                  需要登录才能购买套餐，体验强大的AI服务
                </p>
                <Button
                  onClick={() => router.push('/login?redirect=/pricing')}
                  size="lg"
                  variant="premium"
                  className="px-12 py-4 text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                >
                  立即登录
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* 常见问题 */}
          <section className="pt-32 pb-16">
            <div className="mx-auto w-full max-w-[1000px] px-5">
              <div className="mb-16 text-center">
                <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">常见问题</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  关于我们定价的所有信息，为您答疑解惑
                </p>
              </div>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-gray-800/70 dark:border-gray-700/30">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {faq.question}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 最终号召性用语 */}
          <div className="mx-auto mt-24 mb-20 max-w-4xl">
            <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-3xl p-16 text-center shadow-2xl dark:bg-gray-800/70 dark:border-gray-700/30">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">
                准备好为您的开发加速了吗？
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto">
                加入已经在使用我们服务的数千名开发者，让AI为您的项目带来无限可能，体验前所未有的开发效率。
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button size="lg" variant="premium" className="px-12 py-4 text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300">
                  立即开始
                  <Sparkles className="ml-3 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="px-12 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  联系销售
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// 套餐卡片组件
interface PlanCardProps {
  plan: Plan;
  groupColor: string;
  isCurrentPlan: boolean;
  onPurchase: (planId: string) => void;
  purchasing: string | null;
  getPeriodText: (period: string) => string;
}

function PlanCard({ plan, groupColor, isCurrentPlan, onPurchase, purchasing, getPeriodText }: PlanCardProps) {
  return (
    <div
      className={`relative h-full flex flex-col backdrop-blur-lg border rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl group ${
        plan.is_popular
          ? 'bg-white/90 border-white/30 shadow-2xl scale-105 ring-2 ring-blue-500/20'
          : isCurrentPlan
          ? 'bg-green-50/90 border-green-200/50 shadow-xl ring-2 ring-green-500/20'
          : 'bg-white/70 border-white/20 shadow-lg hover:bg-white/90'
      } dark:${
        plan.is_popular
          ? 'bg-gray-800/90 border-gray-700/30 ring-blue-400/20'
          : isCurrentPlan
          ? 'bg-green-900/20 border-green-700/30 ring-green-400/20'
          : 'bg-gray-800/70 border-gray-700/30 hover:bg-gray-800/90'
      }`}
      style={{
        boxShadow: plan.is_popular
          ? `0 25px 50px -12px ${groupColor}20, 0 25px 50px -12px rgba(0, 0, 0, 0.25)`
          : isCurrentPlan
          ? '0 25px 50px -12px rgba(16, 185, 129, 0.25)'
          : '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* 套餐标签 */}
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4" />
            当前套餐
          </div>
        </div>
      )}

      {plan.is_popular && !isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div
            className="text-white px-6 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 animate-pulse"
            style={{ background: `linear-gradient(135deg, ${groupColor}, ${groupColor}dd)` }}
          >
            <Star className="h-4 w-4" />
            最受欢迎
          </div>
        </div>
      )}

      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden rounded-3xl">
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: plan.is_popular ? groupColor : isCurrentPlan ? '#10b981' : '#6b7280' }}
        ></div>
      </div>

      {/* 套餐标题和价格 */}
      <div className="text-center mb-8 relative z-10">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">
          {plan.name}
        </h3>
        <div className="mb-4">
          <div className="flex items-baseline justify-center">
            <span className="text-lg text-gray-500 dark:text-gray-400">¥</span>
            <span className="text-5xl font-extrabold text-gray-900 dark:text-white mx-1">
              {plan.price}
            </span>
            <span className="text-lg text-gray-600 dark:text-gray-400">
              {plan.billing_period === 'monthly' ? '/月' :
               plan.billing_period === 'yearly' ? '/年' :
               plan.billing_period === 'one_time' ? '/次' : ''}
            </span>
          </div>
        </div>
        <div
          className="inline-block px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm"
          style={{
            backgroundColor: `${plan.is_popular ? groupColor : isCurrentPlan ? '#10b981' : '#6b7280'}20`,
            color: plan.is_popular ? groupColor : isCurrentPlan ? '#10b981' : '#6b7280',
            border: `1px solid ${plan.is_popular ? groupColor : isCurrentPlan ? '#10b981' : '#6b7280'}30`
          }}
        >
          {getPeriodText(plan.billing_period)}
        </div>
      </div>

      {/* 套餐特性 */}
      <div className="flex-grow relative z-10">
        <div className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          包含功能
        </div>
        <ul className="space-y-4 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-3">
            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full mt-0.5">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-medium">
              {plan.tokens_limit ? `${plan.tokens_limit.toLocaleString()} Tokens` : '无限制 Tokens'}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full mt-0.5">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-medium">
              {plan.requests_limit ? `${plan.requests_limit.toLocaleString()} 次请求` : '无限制请求'}
            </span>
          </li>
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full mt-0.5">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-medium">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 购买按钮 */}
      <div className="mt-8 relative z-10">
        {isCurrentPlan ? (
          <Button
            disabled
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 text-lg font-semibold shadow-lg"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            当前套餐
          </Button>
        ) : (
          <Button
            onClick={() => onPurchase(plan.id)}
            disabled={purchasing === plan.id}
            className={`w-full py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 ${
              plan.is_popular ? '' : 'hover:shadow-blue-500/25'
            }`}
            variant={plan.is_popular ? "premium" : "default"}
            size="lg"
            style={
              !plan.is_popular && purchasing !== plan.id
                ? {
                    background: `linear-gradient(135deg, ${groupColor}, ${groupColor}dd)`,
                    color: 'white',
                    border: 'none'
                  }
                : undefined
            }
          >
            {purchasing === plan.id ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                购买中...
              </>
            ) : (
              <>
                立即选择
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}