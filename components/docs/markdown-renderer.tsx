"use client";

import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 生成标题ID的函数（与TableOfContents保持一致）
  const generateId = (title: string) => {
    return title.toLowerCase()
      .replace(/[^\u4e00-\u9fa5\w\s-]/g, '') // 保留中文、字母、数字、空格、连字符
      .replace(/\s+/g, '-'); // 空格转连字符
  };

  // 语言别名映射
  const getLanguage = (lang: string) => {
    const aliases: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'jsx': 'javascript',
      'py': 'python',
      'sh': 'bash',
      'shell': 'bash',
      'yml': 'yaml',
      'md': 'markdown'
    };
    return aliases[lang.toLowerCase()] || lang.toLowerCase();
  };

  // 简化的markdown解析
  const parseMarkdown = (text: string) => {
    // 首先保护代码块，避免被其他规则影响
    const codeBlocks: { language: string; code: string }[] = [];
    text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, language, code) => {
      const lang = getLanguage(language || 'text');
      const trimmedCode = code.trim();
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ language: lang, code: trimmedCode });
      return placeholder;
    });

    // 处理标题（添加id属性）- 从长到短匹配避免冲突
    text = text.replace(/^###### (.*$)/gim, (match, title) => {
      const id = generateId(title.trim());
      return `<h6 id="${id}" class="text-sm font-bold text-gray-900 dark:text-white mt-4 mb-2">${title}</h6>`;
    });
    text = text.replace(/^##### (.*$)/gim, (match, title) => {
      const id = generateId(title.trim());
      return `<h5 id="${id}" class="text-base font-bold text-gray-900 dark:text-white mt-4 mb-2">${title}</h5>`;
    });
    text = text.replace(/^#### (.*$)/gim, (match, title) => {
      const id = generateId(title.trim());
      return `<h4 id="${id}" class="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3">${title}</h4>`;
    });
    text = text.replace(/^### (.*$)/gim, (match, title) => {
      const id = generateId(title.trim());
      return `<h3 id="${id}" class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">${title}</h3>`;
    });
    text = text.replace(/^## (.*$)/gim, (match, title) => {
      const id = generateId(title.trim());
      return `<h2 id="${id}" class="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-6">${title}</h2>`;
    });
    text = text.replace(/^# (.*$)/gim, (match, title) => {
      const id = generateId(title.trim());
      return `<h1 id="${id}" class="text-3xl font-bold text-gray-900 dark:text-white mb-8">${title}</h1>`;
    });

    // 处理粗体和斜体
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // 处理行内代码
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>');

    // 处理链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>');

    // 处理引用块
    text = text.replace(/^> (.*)$/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">$1</blockquote>');

    // 处理表格
    text = text.replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell);
      const isHeader = text.indexOf(match) < text.indexOf('|---') || text.indexOf('|-') > -1;

      if (isHeader) {
        const headerCells = cells.map((cell: string) => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">${cell}</th>`).join('');
        return `<tr class="bg-gray-50 dark:bg-gray-800">${headerCells}</tr>`;
      } else {
        const dataCells = cells.map((cell: string) => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">${cell}</td>`).join('');
        return `<tr class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">${dataCells}</tr>`;
      }
    });

    // 包装表格
    text = text.replace(/(<tr.*?<\/tr>[\s\S]*?<tr.*?<\/tr>)/g, '<div class="overflow-x-auto my-6"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">$1</table></div>');

    // 处理列表 - 改进算法
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let listType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 检测有序列表
      const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      // 检测无序列表
      const unorderedMatch = trimmedLine.match(/^[\*\-\+]\s+(.+)$/);

      if (orderedMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ol class="my-4 space-y-1 ml-6 list-decimal">');
          inList = true;
          listType = 'ol';
        }
        processedLines.push(`<li class="text-gray-700 dark:text-gray-300">${orderedMatch[2]}</li>`);
      } else if (unorderedMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ul class="my-4 space-y-1 ml-6 list-disc">');
          inList = true;
          listType = 'ul';
        }
        processedLines.push(`<li class="text-gray-700 dark:text-gray-300">${unorderedMatch[1]}</li>`);
      } else {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = '';
        }
        processedLines.push(line);
      }
    }

    if (inList) {
      processedLines.push(`</${listType}>`);
    }

    text = processedLines.join('\n');

    // 处理段落（简单换行转换）
    const paragraphLines = text.split('\n');
    const finalProcessedLines = paragraphLines.map(line => {
      if (line.trim() === '') return '';
      if (line.startsWith('<h') || line.startsWith('<div') || line.startsWith('<blockquote') || line.startsWith('<li') || line.startsWith('<ul') || line.startsWith('<ol') || line.startsWith('<table') || line.startsWith('<tr') || line.startsWith('</') || line.includes('__CODE_BLOCK_')) {
        return line;
      }
      return `<p class="my-4 leading-7 text-gray-700 dark:text-gray-300">${line}</p>`;
    });

    let result = finalProcessedLines.filter(line => line.trim() !== '').join('\n');

    return { htmlContent: result, codeBlocks };
  };

  // HTML转义
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const { htmlContent, codeBlocks } = parseMarkdown(content);

  // 将 HTML 内容按代码块占位符分割
  const renderContent = () => {
    const parts = htmlContent.split(/(__CODE_BLOCK_\d+__)/);

    return parts.map((part, index) => {
      const codeBlockMatch = part.match(/^__CODE_BLOCK_(\d+)__$/);

      if (codeBlockMatch) {
        const blockIndex = parseInt(codeBlockMatch[1]);
        const block = codeBlocks[blockIndex];

        if (!block) return null;

        return (
          <div key={`code-${index}`} className="my-6 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                {block.language}
              </span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>
            <div className="relative bg-gray-900 dark:bg-gray-950">
              {isClient ? (
                <SyntaxHighlighter
                  language={block.language}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: 'rgb(17 24 39)', // gray-900
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    borderRadius: 0
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                    }
                  }}
                >
                  {block.code}
                </SyntaxHighlighter>
              ) : (
                <pre className="text-gray-100 p-4 overflow-x-auto m-0 text-sm leading-relaxed font-mono">
                  <code>{block.code}</code>
                </pre>
              )}
            </div>
          </div>
        );
      }

      // 普通 HTML 内容
      if (part.trim()) {
        return (
          <div
            key={`html-${index}`}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      }

      return null;
    }).filter(Boolean);
  };

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {renderContent()}
    </div>
  );
}