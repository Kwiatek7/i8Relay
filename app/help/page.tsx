import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  BookOpen,
  Settings,
  Shield,
  BarChart3,
  DollarSign,
  Users,
  AlertTriangle
} from 'lucide-react';

export const metadata = {
  title: 'Help Center - i8Relay',
  description: '帮助中心 - 常见问题、使用指南和技术支持',
};

export default function HelpPage() {
  const sections = [
    {
      icon: BookOpen,
      title: '快速入门',
      description: '了解如何开始使用 i8Relay',
      items: [
        { title: '如何注册账户', href: '#register' },
        { title: '选择合适的套餐', href: '#plans' },
        { title: '获取 API Key', href: '#api-key' },
        { title: '第一次 API 调用', href: '#first-call' },
      ]
    },
    {
      icon: Settings,
      title: '配置指南',
      description: 'API 配置和集成说明',
      items: [
        { title: 'API 端点配置', href: '#endpoints' },
        { title: '认证设置', href: '#authentication' },
        { title: 'SDK 集成', href: '#sdk-integration' },
        { title: '错误处理', href: '#error-handling' },
      ]
    },
    {
      icon: BarChart3,
      title: '使用统计',
      description: '了解使用量和计费',
      items: [
        { title: '查看使用统计', href: '#usage-stats' },
        { title: '理解计费规则', href: '#billing-rules' },
        { title: '设置使用限制', href: '#usage-limits' },
        { title: '导出使用报告', href: '#export-reports' },
      ]
    },
    {
      icon: DollarSign,
      title: '支付与账单',
      description: '支付方式和账单管理',
      items: [
        { title: '支付方式', href: '#payment-methods' },
        { title: '订阅管理', href: '#subscription' },
        { title: '发票下载', href: '#invoices' },
        { title: '退款政策', href: '#refund-policy' },
      ]
    },
    {
      icon: Shield,
      title: '安全与隐私',
      description: '数据安全和隐私保护',
      items: [
        { title: '数据安全措施', href: '#security' },
        { title: '隐私政策', href: '#privacy' },
        { title: 'API Key 安全', href: '#api-security' },
        { title: '服务协议', href: '#terms' },
      ]
    },
    {
      icon: AlertTriangle,
      title: '故障排除',
      description: '常见问题解决方案',
      items: [
        { title: '常见错误代码', href: '#error-codes' },
        { title: '连接问题', href: '#connection-issues' },
        { title: '性能优化', href: '#performance' },
        { title: '服务状态', href: '#service-status' },
      ]
    },
  ];

  const faqs = [
    {
      question: '什么是 i8Relay？',
      answer: 'i8Relay 是一个专业的 AI API 中转服务，为开发者提供稳定、安全、优惠的 Claude Code、GPT、Gemini 等 AI 模型 API 访问服务。'
    },
    {
      question: '如何开始使用？',
      answer: '1. 注册账户 2. 选择合适的套餐 3. 获取 API Key 4. 集成到您的应用中。详细步骤请参考快速入门指南。'
    },
    {
      question: '支持哪些 AI 模型？',
      answer: '我们支持 Claude 3、GPT-4、GPT-3.5、Gemini Pro 等主流 AI 模型，具体可用模型请查看定价页面。'
    },
    {
      question: '如何计费？',
      answer: '我们按照实际使用量计费，支持按月订阅和按量付费两种模式。不同模型有不同的定价标准。'
    },
    {
      question: '有免费额度吗？',
      answer: '新用户注册后会获得免费试用额度，具体额度请查看当前的优惠活动。'
    },
    {
      question: '如何联系技术支持？',
      answer: '您可以通过邮件、微信或提交工单联系我们的技术支持团队，我们会在 24 小时内回复。'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              帮助中心
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              欢迎来到 i8Relay 帮助中心，这里有您需要的所有信息和指南
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">快速导航</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <section.icon className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {section.description}
                </p>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <a
                        href={item.href}
                        className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">常见问题</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {faqs.map((faq, index) => (
              <div key={index} className={`p-6 ${index !== faqs.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            需要更多帮助？
          </h2>
          <p className="text-gray-600 mb-6">
            如果您在使用过程中遇到问题，我们的技术支持团队随时为您提供帮助
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              联系技术支持
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              查看文档
            </Link>
          </div>
        </div>

        {/* Popular Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">热门资源</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/docs/getting-started"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <BookOpen className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                快速入门指南
              </h3>
              <p className="text-gray-600 text-sm">
                了解如何快速开始使用 i8Relay
              </p>
            </Link>

            <Link
              href="/pricing"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <DollarSign className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                定价说明
              </h3>
              <p className="text-gray-600 text-sm">
                查看详细的定价和套餐信息
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                控制台
              </h3>
              <p className="text-gray-600 text-sm">
                管理您的账户和 API 使用情况
              </p>
            </Link>

            <Link
              href="/service-agreement"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <Shield className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                服务协议
              </h3>
              <p className="text-gray-600 text-sm">
                了解我们的服务条款和政策
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}