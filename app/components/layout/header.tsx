"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Menu, X, Sun, Moon, ExternalLink, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Logo } from '../ui/logo';
import { Button } from '../ui/button';
import { useAuth } from '../../../lib/auth-context';

const navigation = [
  { name: '功能特性', href: '/features' },
  { name: '使用文档', href: '/docs' },
  { name: '定价方案', href: '/pricing' },
  { name: '联系我们', href: '/contact' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  // 确保组件在客户端挂载后才渲染主题相关内容
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md transition-colors duration-300 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
      <nav
        className="flex items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">i8Relay</span>
            <div className="flex items-center gap-2">
              <Logo className="text-black transition-colors duration-300 dark:text-white" size={32} />
            </div>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-all duration-200 transform hover:scale-105"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative rounded-md p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 cursor-pointer"
              suppressHydrationWarning
            >
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </button>
          )}

          {isAuthenticated ? (
            // 已登录状态
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full bg-gray-50 dark:bg-gray-800 p-1 pr-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 hover:shadow-md cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                  {user?.avatar ? (
                    <Image
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.username || '用户头像'}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                      unoptimized={user.avatar?.startsWith('data:') || user.avatar?.startsWith('blob:')}
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.username || user?.email}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* 用户下拉菜单 */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Link
                      href={user?.role === 'admin' || user?.role === 'super_admin' ? '/admin' : '/dashboard'}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-[1.02]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      管理中心
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 未登录状态
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <User className="h-4 w-4" />
                <span>登录/注册</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </nav>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-10" />
          <div className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">i8Relay</span>
                <div className="flex items-center gap-2">
                  <Logo className="text-black transition-colors duration-300 dark:text-white" size={32} />
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">
                    i8<span className="text-blue-600">Relay</span>
                  </span>
                </div>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden mr-3">
                          {user?.avatar ? (
                            <Image
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.username || '用户头像'}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                      unoptimized={user.avatar?.startsWith('data:') || user.avatar?.startsWith('blob:')}
                    />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.username || '用户'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={user?.role === 'admin' || user?.role === 'super_admin' ? '/admin' : '/dashboard'}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          <Settings className="h-4 w-4" />
                          管理中心
                        </Button>
                      </Link>
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        退出登录
                      </Button>
                    </div>
                  ) : (
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <User className="h-4 w-4" />
                        登录/注册
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}