// 支付管理器实现

import {
  PaymentIntent,
  PaymentResult,
  CreatePaymentParams,
  PaymentProvider as PaymentProviderEnum,
  PaymentStatus
} from './types';
import { PaymentProvider, PaymentManager as IPaymentManager } from './provider';

/**
 * 支付管理器实现类
 * 管理多个支付提供商，提供统一的支付接口
 */
export class PaymentManager implements IPaymentManager {
  private providers: Map<PaymentProviderEnum, PaymentProvider> = new Map();
  private defaultProvider: PaymentProviderEnum | null = null;

  /**
   * 注册支付提供商
   */
  registerProvider(provider: PaymentProvider): void {
    const providerName = provider.getProviderName();
    this.providers.set(providerName, provider);

    // 如果是第一个启用的提供商，设为默认
    if (provider.isEnabled() && !this.defaultProvider) {
      this.defaultProvider = providerName;
    }
  }

  /**
   * 获取支付提供商
   */
  getProvider(providerName: PaymentProviderEnum): PaymentProvider | null {
    return this.providers.get(providerName) || null;
  }

  /**
   * 获取所有已启用的支付提供商
   */
  getEnabledProviders(): PaymentProvider[] {
    return Array.from(this.providers.values()).filter(provider => provider.isEnabled());
  }

  /**
   * 获取支持指定货币的提供商
   */
  getProvidersByCurrency(currency: string): PaymentProvider[] {
    // 这里可以根据货币类型过滤提供商
    // 暂时返回所有启用的提供商
    return this.getEnabledProviders();
  }

  /**
   * 设置默认支付提供商
   */
  setDefaultProvider(providerName: PaymentProviderEnum): void {
    const provider = this.getProvider(providerName);
    if (provider && provider.isEnabled()) {
      this.defaultProvider = providerName;
    } else {
      throw new Error(`Payment provider '${providerName}' is not available`);
    }
  }

  /**
   * 获取默认支付提供商
   */
  getDefaultProvider(): PaymentProvider | null {
    if (!this.defaultProvider) return null;
    return this.getProvider(this.defaultProvider);
  }

  /**
   * 创建支付
   */
  async createPayment(params: CreatePaymentParams & { provider?: PaymentProviderEnum }): Promise<PaymentIntent> {
    let provider: PaymentProvider | null = null;

    // 如果指定了支付提供商，使用指定的
    if (params.provider) {
      provider = this.getProvider(params.provider);
      if (!provider || !provider.isEnabled()) {
        throw new Error(`Payment provider '${params.provider}' is not available`);
      }
    } else {
      // 否则使用默认提供商
      provider = this.getDefaultProvider();
      if (!provider) {
        throw new Error('No payment provider available');
      }
    }

    try {
      return await provider.createPayment(params);
    } catch (error) {
      console.error(`Payment creation failed with ${provider.getProviderName()}:`, error);
      throw error;
    }
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(providerName: PaymentProviderEnum, paymentId: string): Promise<PaymentStatus> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Payment provider '${providerName}' not found`);
    }

    return await provider.getPaymentStatus(paymentId);
  }

  /**
   * 确认支付
   */
  async confirmPayment(
    providerName: PaymentProviderEnum,
    paymentId: string,
    params?: any
  ): Promise<PaymentResult> {
    const provider = this.getProvider(providerName);
    if (!provider || !provider.confirmPayment) {
      throw new Error(`Payment provider '${providerName}' does not support confirmation`);
    }

    return await provider.confirmPayment(paymentId, params);
  }

  /**
   * 取消支付
   */
  async cancelPayment(providerName: PaymentProviderEnum, paymentId: string): Promise<PaymentResult> {
    const provider = this.getProvider(providerName);
    if (!provider || !provider.cancelPayment) {
      throw new Error(`Payment provider '${providerName}' does not support cancellation`);
    }

    return await provider.cancelPayment(paymentId);
  }

  /**
   * 退款
   */
  async refundPayment(
    providerName: PaymentProviderEnum,
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    const provider = this.getProvider(providerName);
    if (!provider || !provider.refundPayment) {
      throw new Error(`Payment provider '${providerName}' does not support refunds`);
    }

    return await provider.refundPayment(paymentId, amount, reason);
  }

  /**
   * 处理 Webhook
   */
  async handleWebhook(
    providerName: PaymentProviderEnum,
    payload: string | Buffer,
    signature: string
  ): Promise<PaymentResult> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Payment provider '${providerName}' not found`);
    }

    // 验证 Webhook 签名
    const event = await provider.validateWebhook(payload, signature);
    if (!event) {
      throw new Error('Invalid webhook signature');
    }

    // 处理 Webhook 事件
    return await provider.handleWebhook(event);
  }

  /**
   * 获取可用的支付方式列表
   */
  getAvailablePaymentMethods(): Array<{
    provider: PaymentProviderEnum;
    name: string;
    enabled: boolean;
    config: Partial<any>;
  }> {
    return Array.from(this.providers.entries()).map(([providerName, provider]) => ({
      provider: providerName,
      name: this.getProviderDisplayName(providerName),
      enabled: provider.isEnabled(),
      config: provider.getPublicConfig()
    }));
  }

  /**
   * 获取支付提供商显示名称
   */
  private getProviderDisplayName(provider: PaymentProviderEnum): string {
    const displayNames = {
      [PaymentProviderEnum.STRIPE]: 'Stripe',
      [PaymentProviderEnum.EPAY]: '易支付',
      [PaymentProviderEnum.ALIPAY]: '支付宝',
      [PaymentProviderEnum.WECHAT_PAY]: '微信支付'
    };
    return displayNames[provider] || provider;
  }

  /**
   * 检查是否有可用的支付提供商
   */
  hasAvailableProviders(): boolean {
    return this.getEnabledProviders().length > 0;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.providers.clear();
    this.defaultProvider = null;
  }
}

// 导出单例实例
export const paymentManager = new PaymentManager();