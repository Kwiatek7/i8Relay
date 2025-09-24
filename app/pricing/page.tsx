'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useConfig } from '../../lib/providers/config-provider';
import { useRouter } from 'next/navigation';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';

// shadcn/ui 组件
import { Button } from '../../components/ui/button';

// 图标
import { Check } from 'lucide-react';

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

export default function PricingPage() {
  const [groupedPlans, setGroupedPlans] = useState<PlanGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { config } = useConfig();
  const router = useRouter();

  const fetchGroupedPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/plans?grouped=true');
      if (response.ok) {
        const data = await response.json();
        setGroupedPlans(data.data);
      }
    } catch (error) {
      console.error('获取套餐列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupedPlans();
  }, [fetchGroupedPlans]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handlePurchase = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/pricing');
      return;
    }

    // 跳转到后台dashboard/plans页面，并通过URL参数传递要购买的套餐ID
    router.push(`/dashboard/plans?plan_id=${planId}`);
  };

  const isCurrentPlan = (planName: string) => {
    return user?.plan === planName;
  };

  const faqs = [
    {
      question: "我可以随时更换套餐吗？",
      answer: "是的，您可以随时升级套餐，我们会立即为您开通服务。我们只按使用量付费，不会重复收费。"
    },
    {
      question: "如何获取更优惠的API使用权限吗？",
      answer: "当您需求更具体的需求时，我们可为您定制批发价格权限。我们可以为业内提供最优惠的价格和服务。"
    },
    {
      question: "你们提供发票吗？",
      answer: "我们可以提供电子发票。我们可提供形式专用发票。如您需要项发票请联系我们客服。"
    },
    {
      question: "如何开始使用i8Relay？",
      answer: "注册账户后，您可以立即获得免费权限并使用。我们提供灵活的计费和邀码服务，不会产生额外费用。"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-16">
        {/* 页面标题 */}
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            简单透明的 <span className="text-blue-600">定价</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            选择适合的升级服务的完整方案，立即开始，随时升级。
          </p>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">正在加载套餐信息...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 套餐展示 */}
            {groupedPlans.map((group) => (
              <div key={group.id} className="mb-16">
                {/* 分组标题 */}
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {group.display_name}
                  </h2>
                </div>

                {/* 套餐卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {group.plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isCurrentPlan={isCurrentPlan(plan.name)}
                      onPurchase={handlePurchase}
                      purchasing={purchasing}
                    />
                  ))}
                </div>
              </div>
            ))}

            {groupedPlans.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-gray-500">暂无可用套餐</p>
              </div>
            )}
          </div>
        )}

        {/* 常见问题 */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">常见问题</h2>
            <p className="text-lg text-gray-600">
              关于 i8Relay 定价的常见疑问。
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              满意对方的吗？开发加油了吗？
            </h3>
            <p className="text-gray-600 mb-8">
              加入已经在使用i8Relay的开发者，感受专属优质开发服务权限的专属体验。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={() => router.push('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                立即开始
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/contact')}
                className="px-8 py-3"
              >
                联系客服
              </Button>
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
  isCurrentPlan: boolean;
  onPurchase: (planId: string) => void;
  purchasing: string | null;
}

function PlanCard({ plan, isCurrentPlan, onPurchase, purchasing }: PlanCardProps) {
  const periodText = plan.billing_period === 'monthly' ? '/月' :
                    plan.billing_period === 'yearly' ? '/年' : '/次';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-6 h-full flex flex-col ${
      plan.is_popular ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
    }`}>
      {/* 套餐名称 */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {plan.name}
        </h3>
        <div className="flex items-baseline justify-center">
          <span className="text-3xl font-bold text-gray-900">
            {plan.price}
          </span>
          <span className="text-gray-600 ml-1">
            {periodText}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          适合个人开发者使用的{plan.name.includes('体验') ? '入门级' : plan.name.includes('基础') ? '基础版' : plan.name.includes('标准') ? '标准版' : plan.name.includes('专业') ? '专业版' : plan.name.includes('拼车') ? '共享版' : ''}套餐
        </p>
      </div>

      {/* 功能列表 */}
      <div className="flex-grow">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">包含功能:</h4>
        </div>
        <ul className="space-y-3">
          <li className="flex items-start">
            <Check className="h-4 w-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              每月 Claude 模型 {plan.tokens_limit ? plan.tokens_limit.toLocaleString() : '无限'} Tokens
            </span>
          </li>
          <li className="flex items-start">
            <Check className="h-4 w-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              每月请求上限 {plan.requests_limit ? plan.requests_limit.toLocaleString() : '无限'} 次
            </span>
          </li>
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 购买按钮 */}
      <div className="mt-6">
        {isCurrentPlan ? (
          <Button
            disabled
            className="w-full bg-green-500 text-white py-2.5"
          >
            当前套餐
          </Button>
        ) : (
          <Button
            onClick={() => onPurchase(plan.id)}
            disabled={purchasing === plan.id}
            className={`w-full py-2.5 ${
              plan.is_popular
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}
          >
            {purchasing === plan.id ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                购买中...
              </>
            ) : (
              '立即购买'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}