'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SiteConfig {
  site_name: string;
  site_name_split_index?: number;
  site_title: string;
  site_description: string;
  site_keywords: string;
  site_logo: string;
  primary_color: string;
  secondary_color: string;
  contact_email: string;
  company_address: string;
  footer_text: string;
  enable_registration: boolean;
  homepage_video_url?: string;
}

interface ConfigContextType {
  config: SiteConfig | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
      } else {
        // 如果获取失败，使用默认配置
        const defaultConfig: SiteConfig = {
          site_name: 'i8Relay',
          site_title: 'i8Relay - AI API中转服务',
          site_description: '为用户提供稳定、安全、优惠的Claude Code、GPT、Gemini等AI模型API中转服务',
          site_keywords: 'AI,API,Claude,GPT,OpenAI,中转,代理,人工智能',
          site_logo: '/logo.png',
          primary_color: '#3b82f6',
          secondary_color: '#8b5cf6',
          contact_email: 'support@i8relay.com',
          company_address: '',
          footer_text: '© 2025 i8Relay. All rights reserved.',
          enable_registration: true,
          homepage_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        };
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('获取配置失败:', error);
      // 使用默认配置
      const defaultConfig: SiteConfig = {
        site_name: 'i8Relay',
        site_title: 'i8Relay - AI API中转服务',
        site_description: '为用户提供稳定、安全、优惠的Claude Code、GPT、Gemini等AI模型API中转服务',
        site_keywords: 'AI,API,Claude,GPT,OpenAI,中转,代理,人工智能',
        site_logo: '/logo.png',
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        contact_email: 'support@i8relay.com',
        company_address: '',
        footer_text: '© 2024 i8Relay. All rights reserved.',
        enable_registration: true,
        homepage_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      };
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = async () => {
    setLoading(true);
    await fetchConfig();
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // 应用主色调到CSS变量
  useEffect(() => {
    if (config) {
      document.documentElement.style.setProperty('--primary-color', config.primary_color);
      document.documentElement.style.setProperty('--secondary-color', config.secondary_color);

      // 更新页面标题
      document.title = config.site_title;

      // 更新meta标签
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', config.site_description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('content', config.site_description);
        document.head.appendChild(metaDescription);
      }

      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', config.site_keywords);
      } else {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        metaKeywords.setAttribute('content', config.site_keywords);
        document.head.appendChild(metaKeywords);
      }
    }
  }, [config]);

  return (
    <ConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}