import { NextResponse } from 'next/server';
import { configModel } from '../../../lib/database/models/config';

// 强制动态渲染，防止静态生成时的数据库访问问题
export const dynamic = 'force-dynamic';

// 获取公开的网站配置
export async function GET() {
  try {
    // 获取网站配置
    const siteConfig = await configModel.getSiteConfig();

    // 只返回前台需要的公开配置字段
    const publicConfig = {
      site_name: siteConfig.site_name,
      site_name_split_index: siteConfig.site_name_split_index,
      site_title: siteConfig.seo_title || `${siteConfig.site_name} - AI API中转服务`,
      site_description: siteConfig.site_description,
      site_keywords: siteConfig.seo_keywords || 'AI,API,Claude,GPT,OpenAI,中转,代理,人工智能',
      primary_color: siteConfig.theme_primary_color,
      secondary_color: siteConfig.theme_secondary_color,
      contact_email: siteConfig.contact_email,
      footer_text: siteConfig.footer_text,
      enable_registration: siteConfig.enable_registration,
      homepage_video_url: siteConfig.homepage_video_url
    };

    return NextResponse.json({
      success: true,
      data: publicConfig
    });

  } catch (error) {
    console.error('获取公开配置失败:', error);

    // 返回默认配置
    const defaultConfig = {
      site_name: 'i8Relay',
      site_title: 'i8Relay - AI API中转服务',
      site_description: '为用户提供稳定、安全、优惠的Claude、GPT、Gemini等AI模型API中转服务',
      site_keywords: 'AI,API,Claude,GPT,OpenAI,中转,代理,人工智能',
      primary_color: '#3b82f6',
      secondary_color: '#8b5cf6',
      contact_email: 'support@i8relay.com',
      footer_text: '© 2025 i8Relay. All rights reserved.',
      enable_registration: true,
      homepage_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    };

    return NextResponse.json({
      success: true,
      data: defaultConfig
    });
  }
}