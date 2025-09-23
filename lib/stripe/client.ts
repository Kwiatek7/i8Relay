import Stripe from 'stripe';
import { getStripeConfig, validateStripeConfig, StripeConfig } from './config';

let stripeInstance: Stripe | null = null;
let currentConfig: StripeConfig | null = null;

/**
 * 获取 Stripe 客户端实例
 */
export async function getStripeClient(): Promise<Stripe | null> {
  try {
    const config = await getStripeConfig();

    if (!config || !validateStripeConfig(config)) {
      console.warn('Stripe 配置不完整或未启用');
      return null;
    }

    // 如果配置已更改，重新创建实例
    if (!stripeInstance || !currentConfig ||
        currentConfig.secretKey !== config.secretKey ||
        currentConfig.testMode !== config.testMode) {

      stripeInstance = new Stripe(config.secretKey, {
        apiVersion: '2024-06-20',
        typescript: true,
      });

      currentConfig = config;
    }

    return stripeInstance;
  } catch (error) {
    console.error('初始化 Stripe 客户端失败:', error);
    return null;
  }
}

/**
 * 创建支付意图
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  customerId?: string;
}): Promise<Stripe.PaymentIntent | null> {
  try {
    const stripe = await getStripeClient();
    const config = await getStripeConfig();

    if (!stripe || !config) {
      throw new Error('Stripe 服务不可用');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // 转换为最小货币单位
      currency: params.currency || config.currency,
      description: params.description,
      metadata: params.metadata || {},
      customer: params.customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('创建支付意图失败:', error);
    return null;
  }
}

/**
 * 确认支付意图
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent | null> {
  try {
    const stripe = await getStripeClient();

    if (!stripe) {
      throw new Error('Stripe 服务不可用');
    }

    const params: Stripe.PaymentIntentConfirmParams = {};
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }

    const paymentIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      params
    );

    return paymentIntent;
  } catch (error) {
    console.error('确认支付意图失败:', error);
    return null;
  }
}

/**
 * 获取支付意图详情
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  try {
    const stripe = await getStripeClient();

    if (!stripe) {
      throw new Error('Stripe 服务不可用');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('获取支付意图失败:', error);
    return null;
  }
}

/**
 * 创建客户
 */
export async function createCustomer(params: {
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer | null> {
  try {
    const stripe = await getStripeClient();

    if (!stripe) {
      throw new Error('Stripe 服务不可用');
    }

    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata || {},
    });

    return customer;
  } catch (error) {
    console.error('创建客户失败:', error);
    return null;
  }
}

/**
 * 获取客户详情
 */
export async function getCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  try {
    const stripe = await getStripeClient();

    if (!stripe) {
      throw new Error('Stripe 服务不可用');
    }

    const customer = await stripe.customers.retrieve(customerId);
    return customer as Stripe.Customer;
  } catch (error) {
    console.error('获取客户失败:', error);
    return null;
  }
}

/**
 * 验证 Webhook 签名
 */
export async function validateWebhookSignature(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event | null> {
  try {
    const stripe = await getStripeClient();
    const config = await getStripeConfig();

    if (!stripe || !config || !config.webhookSecret) {
      throw new Error('Stripe Webhook 配置不完整');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.webhookSecret
    );

    return event;
  } catch (error) {
    console.error('Webhook 签名验证失败:', error);
    return null;
  }
}

/**
 * 格式化金额（从 Stripe 最小单位转换为标准单位）
 */
export function formatAmount(amount: number, currency: string): number {
  // 大多数货币使用 100 倍
  const divisors: Record<string, number> = {
    'jpy': 1, // 日元不使用小数
    'krw': 1, // 韩元不使用小数
    'usd': 100,
    'eur': 100,
    'gbp': 100,
    'cny': 100,
    'hkd': 100,
  };

  const divisor = divisors[currency.toLowerCase()] || 100;
  return amount / divisor;
}

/**
 * 转换金额到 Stripe 最小单位
 */
export function toStripeAmount(amount: number, currency: string): number {
  const multipliers: Record<string, number> = {
    'jpy': 1,
    'krw': 1,
    'usd': 100,
    'eur': 100,
    'gbp': 100,
    'cny': 100,
    'hkd': 100,
  };

  const multiplier = multipliers[currency.toLowerCase()] || 100;
  return Math.round(amount * multiplier);
}