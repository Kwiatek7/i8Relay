import { getDb } from '../database/connection';

export interface StripeConfig {
  enabled: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
  currency: string;
  country: string;
}

/**
 * 获取 Stripe 配置
 */
export async function getStripeConfig(): Promise<StripeConfig | null> {
  try {
    const db = await getDb();
    const config = await db.get('SELECT * FROM site_config WHERE id = ?', ['default']);

    if (!config || !config.stripe_enabled) {
      return null;
    }

    return {
      enabled: !!config.stripe_enabled,
      publishableKey: config.stripe_publishable_key || '',
      secretKey: config.stripe_secret_key || '',
      webhookSecret: config.stripe_webhook_secret || '',
      testMode: !!config.stripe_test_mode,
      currency: config.stripe_currency || 'usd',
      country: config.stripe_country || 'US'
    };
  } catch (error) {
    console.error('获取 Stripe 配置失败:', error);
    return null;
  }
}

/**
 * 验证 Stripe 配置是否完整
 */
export function validateStripeConfig(config: StripeConfig): boolean {
  if (!config.enabled) {
    return false;
  }

  // 检查必需的配置项
  return !!(
    config.publishableKey &&
    config.secretKey &&
    config.currency &&
    config.country
  );
}

/**
 * 获取公开的 Stripe 配置（不包含敏感信息）
 */
export async function getPublicStripeConfig() {
  const config = await getStripeConfig();

  if (!config || !validateStripeConfig(config)) {
    return null;
  }

  return {
    enabled: config.enabled,
    publishableKey: config.publishableKey,
    currency: config.currency,
    country: config.country,
    testMode: config.testMode
  };
}