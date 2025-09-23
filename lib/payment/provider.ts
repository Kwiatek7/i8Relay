// 支付提供商抽象接口

import {
  PaymentConfig,
  PaymentIntent,
  PaymentResult,
  CreatePaymentParams,
  WebhookEvent,
  PaymentStatus,
  PaymentProvider as PaymentProviderEnum
} from './types';

/**
 * 支付提供商抽象基类
 * 所有支付提供商都必须实现这个接口
 */
export abstract class PaymentProvider {
  protected config: PaymentConfig;
  protected providerName: PaymentProviderEnum;

  constructor(config: PaymentConfig, providerName: PaymentProviderEnum) {
    this.config = config;
    this.providerName = providerName;
  }

  /**
   * 检查提供商是否已启用且配置正确
   */
  abstract isEnabled(): boolean;

  /**
   * 验证配置是否完整
   */
  abstract validateConfig(): boolean;

  /**
   * 创建支付意图/订单
   */
  abstract createPayment(params: CreatePaymentParams): Promise<PaymentIntent>;

  /**
   * 查询支付状态
   */
  abstract getPaymentStatus(paymentId: string): Promise<PaymentStatus>;

  /**
   * 确认支付（如果需要）
   */
  abstract confirmPayment?(paymentId: string, params?: any): Promise<PaymentResult>;

  /**
   * 取消支付
   */
  abstract cancelPayment?(paymentId: string): Promise<PaymentResult>;

  /**
   * 处理退款
   */
  abstract refundPayment?(paymentId: string, amount?: number, reason?: string): Promise<PaymentResult>;

  /**
   * 验证 Webhook 签名
   */
  abstract validateWebhook(payload: string | Buffer, signature: string): Promise<WebhookEvent | null>;

  /**
   * 处理 Webhook 事件
   */
  abstract handleWebhook(event: WebhookEvent): Promise<PaymentResult>;

  /**
   * 获取支付提供商名称
   */
  getProviderName(): PaymentProviderEnum {
    return this.providerName;
  }

  /**
   * 获取配置信息（敏感信息会被过滤）
   */
  getPublicConfig(): Partial<PaymentConfig> {
    const { enabled, testMode } = this.config;
    return { enabled, testMode };
  }

  /**
   * 格式化金额（转换为支付提供商要求的格式）
   */
  protected abstract formatAmount(amount: number, currency: string): number;

  /**
   * 解析金额（从支付提供商格式转换为标准格式）
   */
  protected abstract parseAmount(amount: number, currency: string): number;

  /**
   * 生成签名（如果支付提供商需要）
   */
  protected generateSignature?(data: Record<string, any>): string;

  /**
   * 验证签名
   */
  protected verifySignature?(data: Record<string, any>, signature: string): boolean;
}

/**
 * 支付管理器接口
 */
export interface PaymentManager {
  /**
   * 注册支付提供商
   */
  registerProvider(provider: PaymentProvider): void;

  /**
   * 获取支付提供商
   */
  getProvider(providerName: PaymentProviderEnum): PaymentProvider | null;

  /**
   * 获取所有已启用的支付提供商
   */
  getEnabledProviders(): PaymentProvider[];

  /**
   * 获取支持指定货币的提供商
   */
  getProvidersByCurrency(currency: string): PaymentProvider[];

  /**
   * 创建支付（自动选择合适的提供商）
   */
  createPayment(params: CreatePaymentParams & { provider?: PaymentProviderEnum }): Promise<PaymentIntent>;

  /**
   * 处理 Webhook
   */
  handleWebhook(providerName: PaymentProviderEnum, payload: string | Buffer, signature: string): Promise<PaymentResult>;
}