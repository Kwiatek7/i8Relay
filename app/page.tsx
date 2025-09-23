'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from './components/layout/header';
import { Footer } from './components/layout/footer';
import { Button } from './components/ui/button';
import { SiteName } from './components/ui/site-name';
import { useConfig } from '../lib/providers/config-provider';
import { Shield, Zap, BarChart3, CreditCard, Code, Bug, Wrench } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: '企业级安全',
    description: '多层安全防护，保障您的数据安全'
  },
  {
    icon: Zap,
    title: '低延迟路由',
    description: '全球多节点部署，毫秒级响应'
  },
  {
    icon: BarChart3,
    title: '实时统计',
    description: '详细的API调用统计和监控'
  },
  {
    icon: CreditCard,
    title: 'Stripe 支付',
    description: '安全便捷的国际支付体验'
  }
];

const capabilities = [
  {
    icon: Code,
    title: 'AI 代码生成',
    description: '使用先进的 AI 模型生成高质量、可维护的代码，支持多种编程语言和框架'
  },
  {
    icon: Bug,
    title: '智能调试',
    description: '快速识别和修复代码中的错误，提供详细的解决方案和最佳实践建议'
  },
  {
    icon: Wrench,
    title: '代码优化',
    description: '通过自动重构建议提升性能和可维护性，让您的代码更清洁、更快速'
  }
];

const stats = [
  { value: '99.9%', label: '服务可用率', description: '全年无休，稳定可靠的API服务保障' },
  { value: '50ms', label: '平均延迟', description: '全球加速网络，毫秒级响应时间' },
  { value: '10W+', label: '开发者', description: '全球超过10万名开发者的信赖选择' }
];

export default function Home() {
  const { config } = useConfig();

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />

      {/* Hero Section */}
      <div className="relative isolate pt-14">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto rounded-full border border-gray-200 bg-gray-50/50 px-5 py-2 text-sm text-gray-600 backdrop-blur-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300 mb-8">
                无降智风险，无安全风险。
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl dark:text-white">
                <SiteName variant="title" />
              </h1>

              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {config.site_description}
              </p>

              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4">
                    免费注册
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-20">
              <div className="text-center text-gray-400 dark:text-gray-500 mb-8">
                深受全球开发者信赖
              </div>
              <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-gray-600 transition-all duration-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transform hover:scale-105 hover:shadow-lg cursor-pointer"
                  >
                    <feature.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Demo Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
              观看演示
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              了解 {config.site_name} 如何通过智能代码辅助改变您的开发工作流程
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="aspect-video rounded-xl bg-gray-900 shadow-2xl">
              <iframe
                className="w-full h-full rounded-xl"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="i8Relay Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
              为什么选择 {config.site_name}？
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              强大AI驱动的编程助手，助您编写更优质的代码
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {capabilities.map((capability, index) => (
                <div
                  key={index}
                  className="flex flex-col rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <capability.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
                    {capability.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {capability.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer"
              >
                <div className="text-4xl font-bold text-blue-600 lg:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white lg:text-3xl">
                  {stat.label}
                </div>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 lg:text-xl">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
              准备好开始了吗？
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              立即体验 {config.site_name} 的强大功能
            </p>
            <div className="mt-10">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4">
                  免费注册
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
