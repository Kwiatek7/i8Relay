"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  FileText,
  CreditCard,
  Zap,
  User,
  LogOut,
  Settings,
  Home,
  BarChart3,
  Coins,
  HelpCircle,
  X,
  ChevronRight
} from 'lucide-react';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: '数据仪表板',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/dashboard',
      badge: null
    },
    {
      name: '使用记录',
      icon: <Activity className="w-5 h-5" />,
      path: '/dashboard/usage',
      badge: null
    },
    {
      name: '账单管理',
      icon: <CreditCard className="w-5 h-5" />,
      path: '/dashboard/billing',
      badge: null
    },
    {
      name: '套餐计划',
      icon: <Zap className="w-5 h-5" />,
      path: '/dashboard/plans',
      badge: 'HOT'
    },
    {
      name: '个人资料',
      icon: <User className="w-5 h-5" />,
      path: '/dashboard/profile',
      badge: null
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-800 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col`}>

        {/* 头部Logo区域 */}
        <div className="relative flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <span className="text-lg font-bold text-white">i8Relay</span>
              <div className="text-xs text-blue-100 opacity-90">AI Proxy Service</div>
            </div>
          </div>

          {/* 移动端关闭按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 用户信息卡片 */}
        <div className="px-4 py-4 flex-shrink-0">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.username || '用户'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'user@example.com'}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
                活跃用户
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation('/dashboard/profile')}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 h-6 px-2"
              >
                <Settings className="w-3 h-3 mr-1" />
                设置
              </Button>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="px-4 pb-4 flex-1 overflow-y-auto min-h-0">
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="ml-3">{item.name}</span>
                  </div>

                  <div className="flex items-center">
                    {item.badge && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs mr-2">
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 帮助和反馈 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => handleNavigation('/help')}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="ml-3">帮助与支持</span>
            </button>
          </div>
        </nav>

        {/* 底部退出按钮 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
              <LogOut className="w-4 h-4" />
            </div>
            退出登录
          </Button>
        </div>
      </aside>
    </>
  );
}