"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import {
  User,
  BarChart3,
  CreditCard,
  Bell,
  Activity,
  LogOut,
  Zap,
  FileText,
  Menu,
  ChevronRight
} from 'lucide-react';

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  active?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  currentPath: string;
  isLoading?: boolean;
}

const defaultMenuItems: Omit<MenuItem, 'active'>[] = [
  {
    name: '数据仪表板',
    icon: <Activity className="w-5 h-5" />,
    path: '/dashboard'
  },
  {
    name: '我的使用记录',
    icon: <FileText className="w-5 h-5" />,
    path: '/dashboard/usage'
  },
  {
    name: '我的账单',
    icon: <CreditCard className="w-5 h-5" />,
    path: '/dashboard/billing'
  },
  {
    name: '套餐计划',
    icon: <Zap className="w-5 h-5" />,
    path: '/dashboard/plans'
  },
  {
    name: '个人资料',
    icon: <User className="w-5 h-5" />,
    path: '/dashboard/profile'
  }
];

export function DashboardLayout({
  children,
  title,
  subtitle,
  currentPath,
  isLoading = false
}: DashboardLayoutProps) {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 构建菜单项，设置当前页面为active
  const menuItems: MenuItem[] = defaultMenuItems.map(item => ({
    ...item,
    active: item.path === currentPath
  }));

  const loading = authLoading || isLoading;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // 获取面包屑导航
  const getBreadcrumb = () => {
    const pathMap: Record<string, string> = {
      '/dashboard': '数据仪表板',
      '/dashboard/usage': '我的使用记录',
      '/dashboard/billing': '我的账单',
      '/dashboard/plans': '套餐计划',
      '/dashboard/profile': '个人资料'
    };
    return pathMap[currentPath] || title;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eff5ff] to-[#f2f5f7] dark:from-[#1a1a1a] dark:to-[#0f0f0f]">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-200 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">i8Relay</span>
          </div>
        </div>

        <nav className="mt-8 px-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => {
                    router.push(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform cursor-pointer ${
                    item.active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.02] hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              logout();
              setSidebarOpen(false);
              router.push('/');
            }}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="lg:pl-60">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-4 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-all duration-200 transform hover:scale-105 cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
              <nav className="hidden sm:flex items-center space-x-1 text-sm">
                <span className="text-gray-500 dark:text-gray-400">首页</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white font-medium">{getBreadcrumb()}</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/notifications')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
              >
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username || '用户'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* 页面标题 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0D0E24] dark:text-white">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-base text-[#9E9FA7] dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>

            {/* 页面内容 */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}