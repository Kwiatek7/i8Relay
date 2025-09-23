"use client";

import React, { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 从markdown内容中提取标题（支持h1-h6）
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const tocItems: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const id = title.toLowerCase()
        .replace(/[^\u4e00-\u9fa5\w\s-]/g, '') // 保留中文、字母、数字、空格、连字符
        .replace(/\s+/g, '-'); // 空格转连字符

      // 只显示h1-h4级别的标题在目录中，避免过于冗长
      if (level <= 4) {
        tocItems.push({
          id,
          title,
          level
        });
      }
    }

    setToc(tocItems);
  }, [content]);

  useEffect(() => {
    // 监听滚动，高亮当前标题
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -35% 0%'
      }
    );

    // 观察所有标题元素
    toc.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (toc.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block fixed left-[calc(55%+32rem)] top-20 w-72 h-[calc(100vh-6rem)] overflow-y-auto z-10">
      <div className="p-4">
        <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-gray-100/20 dark:shadow-gray-900/20">
          {/* 标题区域 */}
          <div className="p-5 border-b border-gray-200/70 dark:border-gray-700/70 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-t-xl">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-md">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent font-bold">
                目录导读
              </span>
            </h3>
          </div>

          {/* 导航区域 */}
          <nav className="p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="space-y-0.5">
              {toc.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToHeading(item.id)}
                  className={`group flex items-center text-left text-sm py-2 px-3 rounded-lg transition-all duration-300 ease-out relative ${
                    item.level === 1 ? 'font-semibold' : item.level === 4 ? 'font-normal text-xs' : 'font-medium'
                  } ${
                    activeId === item.id
                      ? 'text-blue-700 dark:text-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 shadow-sm border border-blue-200/50 dark:border-blue-700/50'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 hover:shadow-sm hover:border hover:border-gray-200/50 dark:hover:border-gray-600/50'
                  }`}
                  style={{
                    paddingLeft: `${(item.level - 1) * 16 + 8}px`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* 活跃状态指示器 */}
                  {activeId === item.id && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r shadow-sm"></span>
                  )}

                  {/* 级别指示器 */}
                  <span className={`flex-shrink-0 ${item.level === 4 ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full mr-2 transition-all duration-300 ${
                    activeId === item.id
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm'
                      : item.level === 1
                        ? 'bg-gray-400 dark:bg-gray-500 group-hover:bg-gray-500 dark:group-hover:bg-gray-400'
                        : item.level === 4
                          ? 'bg-gray-300 dark:bg-gray-700 group-hover:bg-gray-400 dark:group-hover:bg-gray-600'
                          : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500'
                  }`}></span>

                  {/* 标题文本 */}
                  <span className="truncate group-hover:text-shadow-sm transition-all duration-300 flex-1">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {/* 章节统计 */}
          {toc.length > 5 && (
            <div className="px-4 py-3 border-t border-gray-200/70 dark:border-gray-700/70 bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-800/50 dark:to-blue-900/10 rounded-b-xl">
              <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">共 {toc.length} 个章节</span>
              </div>
            </div>
          )}
        </div>

        {/* 返回顶部按钮 */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mt-6 w-full py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 dark:hover:from-gray-700/50 dark:hover:to-blue-900/20 hover:text-gray-900 dark:hover:text-white hover:border-blue-200/50 dark:hover:border-blue-700/50 hover:shadow-lg hover:shadow-gray-100/20 dark:hover:shadow-gray-900/20 transition-all duration-300 ease-out group"
        >
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="group-hover:text-shadow-sm transition-all duration-300">返回顶部</span>
          </div>
        </button>
      </div>
    </aside>
  );
}