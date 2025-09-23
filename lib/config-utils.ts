import { configModel, SiteConfig } from './database/models/config';

// 获取网站配置的服务端函数
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    return await configModel.getSiteConfig();
  } catch (error) {
    console.error('获取网站配置失败:', error);
    // 返回默认配置
    return {
      site_name: 'i8Relay',
      site_description: 'AI API中转服务，为开发者提供稳定、安全、优惠的Claude、GPT、Gemini等AI模型API中转服务',
      seo_title: 'i8Relay - 最稳定的AI中转站 | Claude、GPT、Gemini API服务',
      seo_description: '为开发者提供稳定、安全、优惠的Claude、GPT、Gemini等AI模型API中转服务。企业级安全保障，低延迟路由，实时统计，支持多种支付方式。',
      seo_keywords: 'AI API, Claude API, GPT API, Gemini API, AI中转, API代理, AI模型, 人工智能, 开发者工具',
      contact_email: 'support@i8relay.com',
      theme_primary_color: '#3b82f6',
      theme_secondary_color: '#8b5cf6',
      enable_registration: true,
      enable_payment: true,
      enable_api_docs: true,
      footer_text: '© 2025 i8Relay. All rights reserved.'
    };
  }
}