'use client';

import React from 'react';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import { ContactForm } from '../components/contact/contact-form';
import { useConfig } from '../../lib/providers/config-provider';

export default function ContactPage() {
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

      <div className="py-16 px-5 mt-14">
        {/* 页面标题区域 */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {/* 主标题 */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              联系<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">我们</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              请填写以下信息，我们的专业团队将在 <span className="text-blue-600 font-medium">1-3个工作日</span> 内与您取得联系
            </p>
          </div>

          {/* 主要内容区域 - 左右布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* 左侧：优势展示 */}
            <div className="space-y-8">
              {/* 服务优势 */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">为什么选择{config.site_name}？</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">快速响应</h4>
                      <p className="text-gray-600 dark:text-gray-400">专业客服团队，1-3个工作日内快速回复，确保您的问题得到及时解决</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">专业团队</h4>
                      <p className="text-gray-600 dark:text-gray-400">经验丰富的技术专家，深度了解AI应用场景，为您提供最专业的建议</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">安全保障</h4>
                      <p className="text-gray-600 dark:text-gray-400">严格的数据保护机制，您的信息将被严格保密，确保数据安全</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 联系方式 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">其他联系方式</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{config.contact_email}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>在线客服（工作日 9:00-18:00）</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：联系表单 */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}