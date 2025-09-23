import React from 'react';
import { ArrowRight, BookOpen, Code, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { getDocsNavigation } from '@/lib/docs';

export default function DocsHomePage() {
  const navigation = getDocsNavigation();

  // 从实际的文档中生成快速开始卡片
  const quickStartCards = navigation.flatMap(section =>
    section.items.slice(0, 2).map(item => ({
      title: item.title,
      description: item.description || `了解 ${item.title}`,
      href: item.path,
      icon: section.slug === 'getting-started' ? Code :
            section.slug === 'article' ? BookOpen :
            section.slug === 'security' ? Shield :
            Zap,
      color: section.slug === 'getting-started' ? 'blue' :
             section.slug === 'article' ? 'purple' :
             section.slug === 'security' ? 'red' : 'green'
    }))
  ).slice(0, 4);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-400",
      green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-500 dark:hover:border-green-400",
      purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-500 dark:hover:border-purple-400",
      red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:border-red-500 dark:hover:border-red-400"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      blue: "text-blue-600 dark:text-blue-400",
      green: "text-green-600 dark:text-green-400",
      purple: "text-purple-600 dark:text-purple-400",
      red: "text-red-600 dark:text-red-400"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <>
      {/* 欢迎区域 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          欢迎使用 i8Relay 文档
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          完整的使用指南，帮助您快速上手 Claude Code 和 AI 开发工具，提升编程效率
        </p>
      </div>

      {/* 快速开始卡片或空状态 */}
      {quickStartCards.length > 0 ? (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">快速开始</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickStartCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`block p-6 rounded-lg border transition-all duration-200 ${getColorClasses(card.color)}`}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg ${card.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : card.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' : card.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-red-100 dark:bg-red-900/30'} mr-4`}>
                      <Icon className={`h-6 w-6 ${getIconColorClasses(card.color)}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {card.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {card.description}
                      </p>
                      <div className="flex items-center text-sm font-medium">
                        <span className={getIconColorClasses(card.color)}>开始学习</span>
                        <ArrowRight className={`h-4 w-4 ml-1 ${getIconColorClasses(card.color)}`} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">开始使用</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              还没有文档
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              开始创建您的第一个文档吧！只需在 <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">docs/</code> 目录中添加 Markdown 文件。
            </p>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">例如，创建文件：</p>
              <code className="text-sm text-gray-800 dark:text-gray-200">
                docs/getting-started/quickstart.md
              </code>
            </div>
          </div>
        </div>
      )}

      {/* 帮助信息 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">需要帮助？</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          如果您在使用过程中遇到问题，可以通过以下方式获取帮助：
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            联系我们
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
          {navigation.length > 0 && navigation.some(section => section.items.length > 0) && (
            <Link
              href={navigation[0].items[0]?.path || '/docs'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              查看文档
            </Link>
          )}
        </div>
      </div>
    </>
  );
}