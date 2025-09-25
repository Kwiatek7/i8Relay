import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { getDb } from '../../../../../lib/database/connection';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 获取支付配置
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const db = await getDb();

    // 获取站点配置
    const siteConfig = await db.get('SELECT * FROM site_config WHERE id = ?', ['default']);

    if (!siteConfig) {
      // 返回默认配置
      return createAuthResponse(getDefaultPaymentConfig(), '获取支付配置成功');
    }

    // 构建支付配置对象
    const paymentConfig = {
      // 通用配置
      defaultProvider: siteConfig.default_payment_provider || 'stripe',

      // Stripe 配置
      stripeEnabled: !!siteConfig.stripe_enabled,
      stripePublishableKey: siteConfig.stripe_publishable_key || '',
      stripeSecretKey: siteConfig.stripe_secret_key || '',
      stripeWebhookSecret: siteConfig.stripe_webhook_secret || '',
      stripeTestMode: !!siteConfig.stripe_test_mode,
      stripeCurrency: siteConfig.stripe_currency || 'usd',
      stripeCountry: siteConfig.stripe_country || 'US',

      // 易支付配置
      epayEnabled: !!siteConfig.epay_enabled,
      epayMerchantId: siteConfig.epay_merchant_id || '',
      epayMerchantKey: siteConfig.epay_merchant_key || '',
      epayApiUrl: siteConfig.epay_api_url || '',
      epayNotifyUrl: siteConfig.epay_notify_url || '',
      epayReturnUrl: siteConfig.epay_return_url || '',
      epayTestMode: !!siteConfig.epay_test_mode,
      epaySignType: siteConfig.epay_sign_type || 'MD5',
      epaySupportedChannels: JSON.parse(siteConfig.epay_supported_channels || '["alipay", "wxpay"]'),

      // 支付宝直连配置
      alipayEnabled: !!siteConfig.alipay_enabled,
      alipayAppId: siteConfig.alipay_app_id || '',
      alipayPrivateKey: siteConfig.alipay_private_key || '',
      alipayPublicKey: siteConfig.alipay_public_key || '',
      alipayTestMode: !!siteConfig.alipay_test_mode,

      // 微信支付直连配置
      wechatPayEnabled: !!siteConfig.wechat_pay_enabled,
      wechatPayMchId: siteConfig.wechat_pay_mch_id || '',
      wechatPayPrivateKey: siteConfig.wechat_pay_private_key || '',
      wechatPayCertificateSerial: siteConfig.wechat_pay_certificate_serial || '',
      wechatPayApiV3Key: siteConfig.wechat_pay_api_v3_key || '',
      wechatPayTestMode: !!siteConfig.wechat_pay_test_mode,
    };

    return createAuthResponse(paymentConfig, '获取支付配置成功');

  } catch (error) {
    console.error('获取支付配置错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取支付配置失败'), 500);
  }
}

// 更新支付配置
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const db = await getDb();
    const configData = await request.json();

    // 验证配置数据
    const allowedKeys = [
      'defaultProvider',
      'stripeEnabled', 'stripePublishableKey', 'stripeSecretKey', 'stripeWebhookSecret',
      'stripeTestMode', 'stripeCurrency', 'stripeCountry',
      'epayEnabled', 'epayMerchantId', 'epayMerchantKey', 'epayApiUrl', 'epayNotifyUrl',
      'epayReturnUrl', 'epayTestMode', 'epaySignType', 'epaySupportedChannels',
      'alipayEnabled', 'alipayAppId', 'alipayPrivateKey', 'alipayPublicKey', 'alipayTestMode',
      'wechatPayEnabled', 'wechatPayMchId', 'wechatPayPrivateKey', 'wechatPayCertificateSerial',
      'wechatPayApiV3Key', 'wechatPayTestMode'
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
          default_payment_provider = ?,
          stripe_enabled = ?,
          stripe_publishable_key = ?,
          stripe_secret_key = ?,
          stripe_webhook_secret = ?,
          stripe_test_mode = ?,
          stripe_currency = ?,
          stripe_country = ?,
          epay_enabled = ?,
          epay_merchant_id = ?,
          epay_merchant_key = ?,
          epay_api_url = ?,
          epay_notify_url = ?,
          epay_return_url = ?,
          epay_test_mode = ?,
          epay_sign_type = ?,
          epay_supported_channels = ?,
          alipay_enabled = ?,
          alipay_app_id = ?,
          alipay_private_key = ?,
          alipay_public_key = ?,
          alipay_test_mode = ?,
          wechat_pay_enabled = ?,
          wechat_pay_mch_id = ?,
          wechat_pay_private_key = ?,
          wechat_pay_certificate_serial = ?,
          wechat_pay_api_v3_key = ?,
          wechat_pay_test_mode = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        configData.defaultProvider || 'stripe',
        configData.stripeEnabled ? 1 : 0,
        configData.stripePublishableKey || '',
        configData.stripeSecretKey || '',
        configData.stripeWebhookSecret || '',
        configData.stripeTestMode ? 1 : 0,
        configData.stripeCurrency || 'usd',
        configData.stripeCountry || 'US',
        configData.epayEnabled ? 1 : 0,
        configData.epayMerchantId || '',
        configData.epayMerchantKey || '',
        configData.epayApiUrl || '',
        configData.epayNotifyUrl || '',
        configData.epayReturnUrl || '',
        configData.epayTestMode ? 1 : 0,
        configData.epaySignType || 'MD5',
        JSON.stringify(configData.epaySupportedChannels || ['alipay', 'wxpay']),
        configData.alipayEnabled ? 1 : 0,
        configData.alipayAppId || '',
        configData.alipayPrivateKey || '',
        configData.alipayPublicKey || '',
        configData.alipayTestMode ? 1 : 0,
        configData.wechatPayEnabled ? 1 : 0,
        configData.wechatPayMchId || '',
        configData.wechatPayPrivateKey || '',
        configData.wechatPayCertificateSerial || '',
        configData.wechatPayApiV3Key || '',
        configData.wechatPayTestMode ? 1 : 0,
        new Date().toISOString(),
        'default'
      ]);
    } else {
      // 插入新配置 - 使用最小的必需字段集合
      await db.run(`
        INSERT INTO site_config (
          id, default_payment_provider,
          stripe_enabled, stripe_publishable_key, stripe_secret_key, stripe_webhook_secret,
          stripe_test_mode, stripe_currency, stripe_country,
          epay_enabled, epay_merchant_id, epay_merchant_key, epay_api_url, epay_notify_url,
          epay_return_url, epay_test_mode, epay_sign_type, epay_supported_channels,
          alipay_enabled, alipay_app_id, alipay_private_key, alipay_public_key, alipay_test_mode,
          wechat_pay_enabled, wechat_pay_mch_id, wechat_pay_private_key, wechat_pay_certificate_serial,
          wechat_pay_api_v3_key, wechat_pay_test_mode,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'default',
        configData.defaultProvider || 'stripe',
        configData.stripeEnabled ? 1 : 0,
        configData.stripePublishableKey || '',
        configData.stripeSecretKey || '',
        configData.stripeWebhookSecret || '',
        configData.stripeTestMode ? 1 : 0,
        configData.stripeCurrency || 'usd',
        configData.stripeCountry || 'US',
        configData.epayEnabled ? 1 : 0,
        configData.epayMerchantId || '',
        configData.epayMerchantKey || '',
        configData.epayApiUrl || '',
        configData.epayNotifyUrl || '',
        configData.epayReturnUrl || '',
        configData.epayTestMode ? 1 : 0,
        configData.epaySignType || 'MD5',
        JSON.stringify(configData.epaySupportedChannels || ['alipay', 'wxpay']),
        configData.alipayEnabled ? 1 : 0,
        configData.alipayAppId || '',
        configData.alipayPrivateKey || '',
        configData.alipayPublicKey || '',
        configData.alipayTestMode ? 1 : 0,
        configData.wechatPayEnabled ? 1 : 0,
        configData.wechatPayMchId || '',
        configData.wechatPayPrivateKey || '',
        configData.wechatPayCertificateSerial || '',
        configData.wechatPayApiV3Key || '',
        configData.wechatPayTestMode ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    }

    // 重新初始化支付系统以应用新配置
    try {
      const { reinitializePaymentSystem } = await import('../../../../../lib/payment/init');
      await reinitializePaymentSystem();
    } catch (initError) {
      console.error('重新初始化支付系统失败:', initError);
      // 不阻塞配置保存，只是记录错误
    }

    return createAuthResponse({ message: '支付配置更新成功' }, '支付配置更新成功');

  } catch (error) {
    console.error('更新支付配置错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('更新支付配置失败'), 500);
  }
}

// 获取默认支付配置
function getDefaultPaymentConfig() {
  return {
    defaultProvider: 'stripe',
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripeTestMode: true,
    stripeCurrency: 'usd',
    stripeCountry: 'US',
    epayEnabled: false,
    epayMerchantId: '',
    epayMerchantKey: '',
    epayApiUrl: '',
    epayNotifyUrl: '',
    epayReturnUrl: '',
    epayTestMode: true,
    epaySignType: 'MD5',
    epaySupportedChannels: ['alipay', 'wxpay'],
    alipayEnabled: false,
    alipayAppId: '',
    alipayPrivateKey: '',
    alipayPublicKey: '',
    alipayTestMode: true,
    wechatPayEnabled: false,
    wechatPayMchId: '',
    wechatPayPrivateKey: '',
    wechatPayCertificateSerial: '',
    wechatPayApiV3Key: '',
    wechatPayTestMode: true
  };
}