"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Book, FileText } from 'lucide-react';
import { DocSection } from '@/lib/docs';

interface DocsNavigationProps {
  sections: DocSection[];
  currentPath: string;
}

export function DocsNavigation({ sections, currentPath }: DocsNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section) => ({ ...acc, [section.slug]: true }), {})
  );

  const toggleSection = (slug: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [slug]: !prev[slug]
    }));
  };

  return (
    <aside className="hidden lg:block w-80 h-screen bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sticky top-16 overflow-y-auto">
      <div className="p-6">
        {/* 搜索框 */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="搜索文档..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="space-y-2">
          {sections.map((section) => (
            <div key={section.slug}>
              <button
                onClick={() => toggleSection(section.slug)}
                className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                <span className="flex items-center">
                  <Book className="h-4 w-4 mr-2" />
                  {section.title}
                </span>
                {expandedSections[section.slug] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {expandedSections[section.slug] && (
                <div className="ml-6 mt-1 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={item.path}
                      className={`flex items-center p-2 text-sm rounded-md transition-colors ${
                        currentPath === item.path
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}