'use client';

import { useConfig } from '../../../lib/providers/config-provider';

interface SiteNameProps {
  className?: string;
  variant?: 'default' | 'logo' | 'title';
}

export function SiteName({ className = '', variant = 'default' }: SiteNameProps) {
  const { config } = useConfig();

  if (!config) {
    return null;
  }

  // 自动检测分割点的逻辑
  const detectSplitPoint = (name: string) => {
    // 检测常见的分割模式
    const patterns = [
      // 数字+字母组合，如 i7Relay, i8Relay
      /^([a-zA-Z]*\d+)([a-zA-Z]+)$/,
      // 大小写变化，如 iRelay, MyApp
      /^([a-z]+)([A-Z][a-zA-Z]*)$/,
      // 特殊字符分割，如 i-Relay, My_App
      /^([^-_]+)[-_](.+)$/,
    ];

    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        return {
          prefix: match[1],
          suffix: match[2]
        };
      }
    }

    // 如果没有匹配模式，检查是否有后台配置的分割点
    // 可以在config中添加 site_name_split_index 字段
    const splitIndex = (config as any).site_name_split_index;
    if (splitIndex && splitIndex > 0 && splitIndex < name.length) {
      return {
        prefix: name.substring(0, splitIndex),
        suffix: name.substring(splitIndex)
      };
    }

    // 默认不分割
    return { prefix: name, suffix: '' };
  };

  const { prefix, suffix } = detectSplitPoint(config.site_name);

  const getColorClass = () => {
    switch (variant) {
      case 'logo':
        return 'text-blue-600 dark:text-blue-400';
      case 'title':
        return 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (!suffix) {
    // 如果没有后缀，直接显示完整名称
    return (
      <span className={className}>
        {config.site_name}
      </span>
    );
  }

  return (
    <span className={className}>
      {prefix}
      <span className={getColorClass()}>
        {suffix}
      </span>
    </span>
  );
}