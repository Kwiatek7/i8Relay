"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardHeader } from './dashboard-header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function DashboardLayout({ children, title, subtitle, className = "" }: DashboardLayoutProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 初始化侧边栏收缩状态
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // 身份验证检查
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        // 管理员用户重定向到管理后台
        router.push('/admin');
      }
    }
  }, [isAuthenticated, loading, router, user]);

  // 如果正在加载或未认证，不渲染内容
  if (loading || !isAuthenticated) {
    return null;
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSidebarCollapse = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">

      {/* 侧边栏 */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={handleSidebarClose}
        onCollapse={handleSidebarCollapse}
      />

      {/* 主内容区域 */}
      <div className={`transition-all duration-300 min-h-screen ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>

        {/* 头部 */}
        <DashboardHeader
          onMenuClick={handleSidebarToggle}
          title={title}
          subtitle={subtitle}
        />

        {/* 主内容 */}
        <main className={`relative ${className}`}>
          {/* 内容区域 */}
          <div className="px-4 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>

          {/* 底部装饰 */}
          <div className="mt-16 border-t border-gray-200 dark:border-gray-800">
            <div className="px-4 lg:px-8 py-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-6">
                    <span>© 2024 i8Relay. 保留所有权利.</span>
                    <a href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer">
                      服务条款
                    </a>
                    <a href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer">
                      隐私政策
                    </a>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center space-x-4">
                    <span>站长微信：qianyvs</span>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>v1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}