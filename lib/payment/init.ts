// 支付系统初始化

import { paymentManager } from './manager';
import { StripeProvider, EpayProvider } from './providers';
import { AlipayProvider } from './providers/alipay';
import { WechatPayProvider } from './providers/wechat';
import { PaymentProvider as PaymentProviderEnum } from './types';
import { getDb } from '../database/connection';

/**
 * 初始化支付系统
 * 从数据库读取配置并注册所有可用的支付提供商
 */
export async function initializePaymentSystem(): Promise<void> {
  try {
    console.log('正在初始化支付系统...');

    // 清理之前的提供商
    paymentManager.destroy();

    const db = await getDb();
    const config = await db.get('SELECT * FROM site_config WHERE id = ?', ['default']);

    if (!config) {
      console.warn('未找到系统配置，跳过支付系统初始化');
      return;
    }

    // 初始化 Stripe 提供商
    if (config.stripe_enabled && config.stripe_secret_key) {
      try {
        const stripeConfig = {
          enabled: !!config.stripe_enabled,
          publishableKey: config.stripe_publishable_key || '',
          secretKey: config.stripe_secret_key || '',
          webhookSecret: config.stripe_webhook_secret || '',
          testMode: !!config.stripe_test_mode,
          currency: config.stripe_currency || 'usd',
          country: config.stripe_country || 'US'
        };

        const stripeProvider = new StripeProvider(stripeConfig);
        paymentManager.registerProvider(stripeProvider);
        console.log('✅ Stripe 支付提供商已注册');
      } catch (error) {
        console.error('❌ Stripe 提供商初始化失败:', error);
      }
    }

    // 初始化易支付提供商
    if (config.epay_enabled && config.epay_merchant_id) {
      try {
        const epayConfig = {
          enabled: !!config.epay_enabled,
          testMode: !!config.epay_test_mode,
          merchantId: config.epay_merchant_id || '',
          merchantKey: config.epay_merchant_key || '',
          apiUrl: config.epay_api_url || '',
          notifyUrl: config.epay_notify_url || '',
          returnUrl: config.epay_return_url || '',
          signType: (config.epay_sign_type as 'MD5' | 'RSA') || 'MD5',
          supportedChannels: JSON.parse(config.epay_supported_channels || '["alipay", "wxpay"]')
        };

        const epayProvider = new EpayProvider(epayConfig);
        paymentManager.registerProvider(epayProvider);
        console.log('✅ 易支付提供商已注册');
      } catch (error) {
        console.error('❌ 易支付提供商初始化失败:', error);
      }
    }

    // 初始化支付宝直连提供商
    if (config.alipay_enabled && config.alipay_app_id) {
      try {
        const alipayConfig = {
          enabled: !!config.alipay_enabled,
          testMode: !!config.alipay_test_mode,
          appId: config.alipay_app_id || '',
          privateKey: config.alipay_private_key || '',
          publicKey: config.alipay_public_key || ''
        };

        const alipayProvider = new AlipayProvider(alipayConfig);
        paymentManager.registerProvider(alipayProvider);
        console.log('✅ 支付宝直连提供商已注册');
      } catch (error) {
        console.error('❌ 支付宝直连提供商初始化失败:', error);
      }
    }

    // 初始化微信支付直连提供商
    if (config.wechat_pay_enabled && config.wechat_pay_mch_id) {
      try {
        const wechatPayConfig = {
          enabled: !!config.wechat_pay_enabled,
          testMode: !!config.wechat_pay_test_mode,
          mchId: config.wechat_pay_mch_id || '',
          privateKey: config.wechat_pay_private_key || '',
          certificateSerial: config.wechat_pay_certificate_serial || '',
          apiV3Key: config.wechat_pay_api_v3_key || '',
          appId: config.wechat_pay_app_id || undefined
        };

        const wechatPayProvider = new WechatPayProvider(wechatPayConfig);
        paymentManager.registerProvider(wechatPayProvider);
        console.log('✅ 微信支付直连提供商已注册');
      } catch (error) {
        console.error('❌ 微信支付直连提供商初始化失败:', error);
      }
    }

    // 设置默认支付提供商
    const enabledProviders = paymentManager.getEnabledProviders();
    if (enabledProviders.length > 0) {
      const defaultProviderName = config.default_payment_provider as PaymentProviderEnum;

      if (defaultProviderName && paymentManager.getProvider(defaultProviderName)?.isEnabled()) {
        paymentManager.setDefaultProvider(defaultProviderName);
        console.log(`✅ 设置默认支付提供商: ${defaultProviderName}`);
      } else {
        // 如果没有配置默认提供商或配置的提供商不可用，使用第一个可用的
        const firstProvider = enabledProviders[0];
        paymentManager.setDefaultProvider(firstProvider.getProviderName());
        console.log(`✅ 自动设置默认支付提供商: ${firstProvider.getProviderName()}`);
      }
    }

    const availableProviders = paymentManager.getAvailablePaymentMethods();
    console.log(`🎉 支付系统初始化完成，可用支付方式: ${availableProviders.length} 个`);

    if (availableProviders.length === 0) {
      console.warn('⚠️  警告: 没有可用的支付提供商');
    } else {
      availableProviders.forEach(provider => {
        console.log(`   - ${provider.name} (${provider.provider}): ${provider.enabled ? '启用' : '禁用'}`);
      });
    }

  } catch (error) {
    console.error('❌ 支付系统初始化失败:', error);
    throw error;
  }
}

/**
 * 重新初始化支付系统
 * 当配置更新时调用
 */
export async function reinitializePaymentSystem(): Promise<void> {
  console.log('重新初始化支付系统...');
  await initializePaymentSystem();
}

/**
 * 获取支付系统状态
 */
export function getPaymentSystemStatus() {
  const enabledProviders = paymentManager.getEnabledProviders();
  const defaultProvider = paymentManager.getDefaultProvider();
  const availableMethods = paymentManager.getAvailablePaymentMethods();

  return {
    initialized: enabledProviders.length > 0,
    enabledProvidersCount: enabledProviders.length,
    defaultProvider: defaultProvider?.getProviderName() || null,
    availableMethods: availableMethods.map(method => ({
      provider: method.provider,
      name: method.name,
      enabled: method.enabled
    })),
    hasAvailableProviders: paymentManager.hasAvailableProviders()
  };
}