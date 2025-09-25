import { BaseModel } from '../base-model';

export interface SystemConfig {
  id: string;
  category: string;
  config_key: string;
  config_value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteConfig {
  site_name: string;
  site_name_split_index?: number;  // 网站名称分割点索引
  site_description: string;
  contact_email?: string;
  contact_wechat?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  theme_primary_color: string;
  theme_secondary_color: string;
  enable_registration: boolean;
  enable_payment: boolean;
  enable_api_docs: boolean;
  homepage_hero_title?: string;
  homepage_hero_subtitle?: string;
  homepage_features?: any[];
  homepage_video_url?: string;  // 首页演示视频链接
  footer_text?: string;
}

export class ConfigModel extends BaseModel {
  protected tableName = 'system_config';

  // 获取配置值
  async get(category: string, key: string): Promise<any> {
    const config = await this.findOne<SystemConfig>(`
      SELECT * FROM ${this.tableName}
      WHERE category = ? AND config_key = ?
    `, [category, key]);

    if (!config) {
      return null;
    }

    return this.parseConfigValue(config.config_value, config.data_type);
  }

  // 获取分类下的所有配置
  async getByCategory(category: string, publicOnly: boolean = false): Promise<Record<string, any>> {
    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE category = ?
    `;
    const params = [category];

    if (publicOnly) {
      sql += ' AND is_public = true';
    }

    const configs = await this.findMany<SystemConfig>(sql, params);
    const result: Record<string, any> = {};

    configs.forEach(config => {
      result[config.config_key] = this.parseConfigValue(config.config_value, config.data_type);
    });

    return result;
  }

  // 获取所有公开配置
  async getPublicConfigs(): Promise<Record<string, Record<string, any>>> {
    const configs = await this.findMany<SystemConfig>(`
      SELECT * FROM ${this.tableName}
      WHERE is_public = true
      ORDER BY category, key
    `);

    const result: Record<string, Record<string, any>> = {};

    configs.forEach(config => {
      if (!result[config.category]) {
        result[config.category] = {};
      }
      result[config.category][config.config_key] = this.parseConfigValue(config.config_value, config.data_type);
    });

    return result;
  }

  // 设置配置值
  async set(
    category: string,
    key: string,
    value: any,
    dataType: 'string' | 'number' | 'boolean' | 'json' = 'string',
    description?: string,
    isPublic: boolean = false
  ): Promise<void> {
    const stringValue = this.stringifyConfigValue(value, dataType);

    // 尝试更新现有配置
    const updateResult = await this.execute(`
      UPDATE ${this.tableName}
      SET config_value = ?, data_type = ?, description = ?, is_public = ?, updated_at = ?
      WHERE category = ? AND config_key = ?
    `, [stringValue, dataType, description, isPublic, this.getCurrentTimestamp(), category, key]);

    // 如果没有更新到记录，则插入新记录
    if ((updateResult.changes ?? 0) === 0) {
      await this.execute(`
        INSERT INTO ${this.tableName} (
          id, category, config_key, config_value, data_type, description, is_public
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        this.generateId(), category, key, stringValue,
        dataType, description, isPublic
      ]);
    }
  }

  // 批量设置配置
  async setBatch(configs: Array<{
    category: string;
    key: string;
    value: any;
    data_type?: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    is_public?: boolean;
  }>): Promise<void> {
    await this.transaction(async () => {
      for (const config of configs) {
        await this.set(
          config.category,
          config.key,
          config.value,
          config.data_type || 'string',
          config.description,
          config.is_public || false
        );
      }
    });
  }

  // 删除配置
  async delete(category: string, key: string): Promise<boolean> {
    const result = await this.execute(`
      DELETE FROM ${this.tableName}
      WHERE category = ? AND config_key = ?
    `, [category, key]);

    return (result.changes ?? 0) > 0;
  }

  // 删除分类下的所有配置
  async deleteCategory(category: string): Promise<number> {
    const result = await this.execute(`
      DELETE FROM ${this.tableName}
      WHERE category = ?
    `, [category]);

    return result.changes ?? 0;
  }

  // 获取网站配置
  async getSiteConfig(): Promise<SiteConfig> {
    const siteConfig = await this.findOne<any>(`
      SELECT * FROM site_config WHERE id = 'default'
    `);

    if (!siteConfig) {
      // 返回默认配置
      return {
        site_name: 'i8Relay',
        site_description: 'AI API中转服务',
        theme_primary_color: '#3b82f6',
        theme_secondary_color: '#8b5cf6',
        enable_registration: true,
        enable_payment: true,
        enable_api_docs: true,
        homepage_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      };
    }

    // 解析JSON字段
    const features = this.parseJsonField(siteConfig.homepage_features, []);

    return {
      site_name: siteConfig.site_name,
      site_name_split_index: siteConfig.site_name_split_index,
      site_description: siteConfig.site_description,
      contact_email: siteConfig.contact_email,
      contact_wechat: siteConfig.contact_wechat,
      seo_title: siteConfig.seo_title,
      seo_description: siteConfig.seo_description,
      seo_keywords: siteConfig.seo_keywords,
      theme_primary_color: siteConfig.theme_primary_color,
      theme_secondary_color: siteConfig.theme_secondary_color,
      enable_registration: Boolean(siteConfig.enable_registration),
      enable_payment: Boolean(siteConfig.enable_payment),
      enable_api_docs: Boolean(siteConfig.enable_api_docs),
      homepage_hero_title: siteConfig.homepage_hero_title,
      homepage_hero_subtitle: siteConfig.homepage_hero_subtitle,
      homepage_features: features,
      homepage_video_url: siteConfig.homepage_video_url,
      footer_text: siteConfig.footer_text
    };
  }

  // 更新网站配置
  async updateSiteConfig(config: Partial<SiteConfig>): Promise<SiteConfig> {
    const cleanData = this.cleanData({
      ...config,
      // JSON字段处理
      ...(config.homepage_features && {
        homepage_features: JSON.stringify(config.homepage_features)
      }),
      updated_at: this.getCurrentTimestamp()
    });

    if (Object.keys(cleanData).length === 0) {
      throw new Error('没有要更新的配置');
    }

    // 尝试更新现有配置
    const { setClause, params } = this.buildSetClause(cleanData);
    const updateResult = await this.execute(`
      UPDATE site_config SET ${setClause} WHERE id = 'default'
    `, params);

    // 如果没有更新到记录，则插入新记录
    if ((updateResult.changes ?? 0) === 0) {
      const defaultConfig = {
        id: 'default',
        site_name: 'i8Relay',
        site_description: 'AI API中转服务',
        theme_primary_color: '#3b82f6',
        theme_secondary_color: '#8b5cf6',
        enable_registration: true,
        enable_payment: true,
        enable_api_docs: true,
        created_at: this.getCurrentTimestamp(),
        ...cleanData
      };

      const { sql, params: insertParams } = this.buildInsertQuery('site_config', defaultConfig);
      await this.execute(sql, insertParams);
    }

    return await this.getSiteConfig();
  }

  // 获取常用配置的便捷方法
  async getJwtSecret(): Promise<string> {
    const secret = await this.get('security', 'jwt_secret');
    if (!secret) {
      // 生成并保存默认密钥
      const defaultSecret = this.generateRandomString(64);
      await this.set('security', 'jwt_secret', defaultSecret, 'string', 'JWT密钥', false);
      return defaultSecret;
    }
    return secret;
  }

  async isMaintenanceMode(): Promise<boolean> {
    return await this.get('maintenance', 'enabled') || false;
  }

  async getMaintenanceMessage(): Promise<string> {
    return await this.get('maintenance', 'message') || '系统正在维护中，请稍后再试';
  }

  async isRegistrationEnabled(): Promise<boolean> {
    return await this.get('features', 'enable_registration') !== false;
  }

  async isPaymentEnabled(): Promise<boolean> {
    return await this.get('features', 'enable_payment') !== false;
  }

  // 获取模型定价配置
  async getModelPricing(): Promise<Record<string, { input: number; output: number }>> {
    const pricing = await this.get('models', 'default_model_pricing');
    if (!pricing) {
      return {
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
        'gpt-4': { input: 0.03, output: 0.06 },
        'claude-3-haiku': { input: 0.00025, output: 0.00125 },
        'claude-3-sonnet': { input: 0.003, output: 0.015 },
        'claude-3.5-sonnet': { input: 0.003, output: 0.015 }
      };
    }
    return pricing;
  }

  // 获取邮箱验证配置
  async getEmailVerificationConfig(): Promise<{
    enable_email_verification: boolean;
    require_verification_for_registration: boolean;
    verification_token_expires_hours: number;
    max_verification_attempts: number;
    resend_cooldown_minutes: number;
    block_unverified_users: boolean;
  }> {
    const configs = await this.getByCategory('email_verification');
    
    return {
      enable_email_verification: configs.enable_email_verification || false,
      require_verification_for_registration: configs.require_verification_for_registration || false,
      verification_token_expires_hours: configs.verification_token_expires_hours || 24,
      max_verification_attempts: configs.max_verification_attempts || 3,
      resend_cooldown_minutes: configs.resend_cooldown_minutes || 5,
      block_unverified_users: configs.block_unverified_users || false
    };
  }

  // 解析配置值
  private parseConfigValue(value: string, dataType: string): any {
    switch (dataType) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      default:
        return value;
    }
  }

  // 将值转换为字符串
  private stringifyConfigValue(value: any, dataType: string): string {
    switch (dataType) {
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return String(value);
    }
  }

  // 安全解析JSON字段
  private parseJsonField<T>(jsonString: string | null, defaultValue: T): T {
    if (!jsonString) return defaultValue;
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  }

  // 生成随机字符串
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// 导出单例实例
export const configModel = new ConfigModel();