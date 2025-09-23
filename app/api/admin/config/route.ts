import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

// 默认配置值
const DEFAULT_CONFIG = {
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
  enable_registration: true
};

// 获取网站配置
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const db = await getDb();

    // 获取站点配置
    const siteConfig = await db.get('SELECT * FROM site_config WHERE id = ?', ['default']);

    if (siteConfig) {
      // 从site_config表构建配置对象
      const config = {
        site_name: siteConfig.site_name || DEFAULT_CONFIG.site_name,
        site_name_split_index: siteConfig.site_name_split_index,
        site_title: siteConfig.seo_title || DEFAULT_CONFIG.site_title,
        site_description: siteConfig.site_description || DEFAULT_CONFIG.site_description,
        site_keywords: siteConfig.seo_keywords || DEFAULT_CONFIG.site_keywords,
        site_logo: siteConfig.site_logo || DEFAULT_CONFIG.site_logo,
        primary_color: siteConfig.theme_primary_color || DEFAULT_CONFIG.primary_color,
        secondary_color: siteConfig.theme_secondary_color || DEFAULT_CONFIG.secondary_color,
        contact_email: siteConfig.contact_email || DEFAULT_CONFIG.contact_email,
        company_address: siteConfig.contact_address || DEFAULT_CONFIG.company_address,
        footer_text: siteConfig.footer_text || DEFAULT_CONFIG.footer_text,
        enable_registration: siteConfig.enable_registration !== null ? !!siteConfig.enable_registration : DEFAULT_CONFIG.enable_registration,

        // SMTP邮件配置
        smtp_enabled: siteConfig.smtp_enabled !== null ? !!siteConfig.smtp_enabled : false,
        smtp_host: siteConfig.smtp_host || '',
        smtp_port: siteConfig.smtp_port || 587,
        smtp_user: siteConfig.smtp_user || '',
        smtp_password: siteConfig.smtp_password || '',
        smtp_secure: siteConfig.smtp_secure !== null ? !!siteConfig.smtp_secure : false,
        contact_form_email: siteConfig.contact_form_email || '',

        // 首页配置
        homepage_video_url: siteConfig.homepage_video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      };

      return createAuthResponse(config, '配置获取成功');
    } else {
      // 如果没有配置，返回默认配置
      return createAuthResponse(DEFAULT_CONFIG, '配置获取成功');
    }

  } catch (error) {
    console.error('获取配置错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取配置失败'), 500);
  }
}

// 更新网站配置
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const db = await getDb();
    const configData = await request.json();

    // 验证配置数据 - 只检查网站基本配置字段
    const allowedKeys = [
      'site_name', 'site_name_split_index', 'site_title', 'site_description', 'site_keywords', 'site_logo',
      'primary_color', 'secondary_color', 'contact_email', 'company_address',
      'footer_text', 'enable_registration', 'homepage_video_url',
      // SMTP邮件配置
      'smtp_enabled', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'contact_form_email'
    ];
    for (const key of Object.keys(configData)) {
      if (!allowedKeys.includes(key)) {
        return createErrorResponse(new Error(`无效的配置项: ${key}`), 400);
      }
    }

    // 检查是否存在配置记录
    const existingConfig = await db.get('SELECT id FROM site_config WHERE id = ?', ['default']);

    if (existingConfig) {
      // 更新现有配置
      await db.run(`
        UPDATE site_config SET
          site_name = ?,
          site_name_split_index = ?,
          site_description = ?,
          seo_title = ?,
          seo_description = ?,
          seo_keywords = ?,
          site_logo = ?,
          contact_email = ?,
          contact_address = ?,
          theme_primary_color = ?,
          theme_secondary_color = ?,
          enable_registration = ?,
          footer_text = ?,
          homepage_video_url = ?,
          smtp_enabled = ?,
          smtp_host = ?,
          smtp_port = ?,
          smtp_user = ?,
          smtp_password = ?,
          smtp_secure = ?,
          contact_form_email = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        configData.site_name || '',
        configData.site_name_split_index || null,
        configData.site_description || '',
        configData.site_title || '',
        configData.site_description || '', // 使用描述作为SEO描述
        configData.site_keywords || '',
        configData.site_logo || '',
        configData.contact_email || '',
        configData.company_address || '',
        configData.primary_color || '#3b82f6',
        configData.secondary_color || '#8b5cf6',
        configData.enable_registration ? 1 : 0,
        configData.footer_text || '',
        configData.homepage_video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        configData.smtp_enabled ? 1 : 0,
        configData.smtp_host || '',
        configData.smtp_port || 587,
        configData.smtp_user || '',
        configData.smtp_password || '',
        configData.smtp_secure ? 1 : 0,
        configData.contact_form_email || '',
        new Date().toISOString(),
        'default'
      ]);
    } else {
      // 插入新配置
      await db.run(`
        INSERT INTO site_config (
          id, site_name, site_name_split_index, site_description, seo_title, seo_description, seo_keywords,
          site_logo, contact_email, contact_address, theme_primary_color, theme_secondary_color,
          enable_registration, footer_text, homepage_video_url, smtp_enabled, smtp_host, smtp_port, smtp_user, smtp_password,
          smtp_secure, contact_form_email, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'default',
        configData.site_name || '',
        configData.site_name_split_index || null,
        configData.site_description || '',
        configData.site_title || '',
        configData.site_description || '', // 使用描述作为SEO描述
        configData.site_keywords || '',
        configData.site_logo || '',
        configData.contact_email || '',
        configData.company_address || '',
        configData.primary_color || '#3b82f6',
        configData.secondary_color || '#8b5cf6',
        configData.enable_registration ? 1 : 0,
        configData.footer_text || '',
        configData.homepage_video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        configData.smtp_enabled ? 1 : 0,
        configData.smtp_host || '',
        configData.smtp_port || 587,
        configData.smtp_user || '',
        configData.smtp_password || '',
        configData.smtp_secure ? 1 : 0,
        configData.contact_form_email || '',
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    }

    // 同时更新system_config表中的相关配置
    const systemUpdates = [
      { key: 'name', value: configData.site_name },
      { key: 'description', value: configData.site_description },
      { key: 'logo_url', value: configData.site_logo },
    ];

    for (const update of systemUpdates) {
      await db.run(`
        UPDATE system_config SET
          value = ?,
          updated_at = ?
        WHERE category = 'site' AND key = ?
      `, [update.value, new Date().toISOString(), update.key]);
    }

    return createAuthResponse({ message: '配置更新成功' }, '配置更新成功');

  } catch (error) {
    console.error('更新配置错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('更新配置失败'), 500);
  }
}