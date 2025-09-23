// Stripe 支付提供商实现

import Stripe from 'stripe';
import {
  PaymentProvider as PaymentProviderEnum,
  PaymentIntent,
  PaymentResult,
  CreatePaymentParams,
  WebhookEvent,
  PaymentStatus,
  StripeConfig
} from '../types';
import { PaymentProvider } from '../provider';
import { getDb } from '../../database/connection';

export class StripeProvider extends PaymentProvider {
  private stripe: Stripe | null = null;

  constructor(config: StripeConfig) {
    super(config, PaymentProviderEnum.STRIPE);
    this.initializeStripe();
  }

  /**
   * 初始化 Stripe 客户端
   */
  private initializeStripe(): void {
    const config = this.config as StripeConfig;
    if (this.isEnabled() && config.secretKey) {
      this.stripe = new Stripe(config.secretKey, {
        apiVersion: '2024-06-20',
        typescript: true,
      });
    }
  }

  /**
   * 检查提供商是否已启用且配置正确
   */
  isEnabled(): boolean {
    return this.config.enabled && this.validateConfig();
  }

  /**
   * 验证配置是否完整
   */
  validateConfig(): boolean {
    const config = this.config as StripeConfig;
    return !!(
      config.enabled &&
      config.publishableKey &&
      config.secretKey &&
      config.currency &&
      config.country
    );
  }

  /**
   * 创建支付意图
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe 客户端未初始化');
    }

    try {
      // 创建 Stripe PaymentIntent
      const stripePaymentIntent = await this.stripe.paymentIntents.create({
        amount: this.formatAmount(params.amount, params.currency),
        currency: params.currency.toLowerCase(),
        description: params.description,
        metadata: {
          userId: params.userId,
          userEmail: params.userEmail || '',
          planId: params.planId || '',
          subscriptionId: params.subscriptionId || '',
          timestamp: new Date().toISOString(),
          ...params.metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // 转换为统一的 PaymentIntent 格式
      const paymentIntent: PaymentIntent = {
        id: stripePaymentIntent.id,
        amount: this.parseAmount(stripePaymentIntent.amount, stripePaymentIntent.currency),
        currency: stripePaymentIntent.currency.toUpperCase(),
        status: this.mapStripeStatus(stripePaymentIntent.status),
        clientSecret: stripePaymentIntent.client_secret || undefined,
        metadata: stripePaymentIntent.metadata,
        createdAt: new Date(stripePaymentIntent.created * 1000),
      };

      // 记录到数据库
      await this.savePaymentRecord(paymentIntent, params);

      return paymentIntent;
    } catch (error) {
      console.error('Stripe 创建支付失败:', error);
      throw new Error(`创建支付失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    if (!this.stripe) {
      throw new Error('Stripe 客户端未初始化');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
      return this.mapStripeStatus(paymentIntent.status);
    } catch (error) {
      console.error('获取支付状态失败:', error);
      throw new Error(`获取支付状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 确认支付
   */
  async confirmPayment(paymentId: string, params?: any): Promise<PaymentResult> {
    if (!this.stripe) {
      throw new Error('Stripe 客户端未初始化');
    }

    try {
      const confirmParams: Stripe.PaymentIntentConfirmParams = {};
      if (params?.payment_method) {
        confirmParams.payment_method = params.payment_method;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentId, confirmParams);

      return {
        success: paymentIntent.status === 'succeeded',
        paymentId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        transactionId: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : undefined,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('确认支付失败:', error);
      return {
        success: false,
        paymentId,
        status: PaymentStatus.FAILED,
        message: error instanceof Error ? error.message : '确认支付失败'
      };
    }
  }

  /**
   * 取消支付
   */
  async cancelPayment(paymentId: string): Promise<PaymentResult> {
    if (!this.stripe) {
      throw new Error('Stripe 客户端未初始化');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentId);

      return {
        success: paymentIntent.status === 'canceled',
        paymentId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('取消支付失败:', error);
      return {
        success: false,
        paymentId,
        status: PaymentStatus.FAILED,
        message: error instanceof Error ? error.message : '取消支付失败'
      };
    }
  }

  /**
   * 处理退款
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<PaymentResult> {
    if (!this.stripe) {
      throw new Error('Stripe 客户端未初始化');
    }

    try {
      // 先获取 PaymentIntent 来找到对应的 Charge
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
      const chargeId = typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : null;

      if (!chargeId) {
        throw new Error('未找到可退款的交易');
      }

      const refundParams: Stripe.RefundCreateParams = { charge: chargeId };
      if (amount !== undefined) {
        refundParams.amount = this.formatAmount(amount, paymentIntent.currency);
      }
      if (reason) {
        refundParams.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        success: refund.status === 'succeeded',
        paymentId,
        status: refund.status === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
        transactionId: refund.id,
        metadata: { refundId: refund.id, refundReason: reason }
      };
    } catch (error) {
      console.error('退款失败:', error);
      return {
        success: false,
        paymentId,
        status: PaymentStatus.FAILED,
        message: error instanceof Error ? error.message : '退款失败'
      };
    }
  }

  /**
   * 验证 Webhook 签名
   */
  async validateWebhook(payload: string | Buffer, signature: string): Promise<WebhookEvent | null> {
    const config = this.config as StripeConfig;
    if (!this.stripe || !config.webhookSecret) {
      throw new Error('Webhook 配置不完整');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.webhookSecret
      );

      return {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: new Date(event.created * 1000)
      };
    } catch (error) {
      console.error('Webhook 验证失败:', error);
      return null;
    }
  }

  /**
   * 处理 Webhook 事件
   */
  async handleWebhook(event: WebhookEvent): Promise<PaymentResult> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
        case 'payment_intent.canceled':
          return await this.handlePaymentCanceled(event.data.object);
        case 'payment_intent.requires_action':
          return await this.handlePaymentRequiresAction(event.data.object);
        default:
          console.log(`未处理的 Stripe 事件类型: ${event.type}`);
          return {
            success: true,
            paymentId: '',
            status: PaymentStatus.PENDING,
            message: '事件已忽略'
          };
      }
    } catch (error) {
      console.error('处理 Webhook 事件失败:', error);
      return {
        success: false,
        paymentId: '',
        status: PaymentStatus.FAILED,
        message: error instanceof Error ? error.message : '处理事件失败'
      };
    }
  }

  /**
   * 格式化金额（转换为支付提供商要求的格式）
   */
  protected formatAmount(amount: number, currency: string): number {
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

  /**
   * 解析金额（从支付提供商格式转换为标准格式）
   */
  protected parseAmount(amount: number, currency: string): number {
    const divisors: Record<string, number> = {
      'jpy': 1,
      'krw': 1,
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
   * 映射 Stripe 状态到统一状态
   */
  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'requires_payment_method': PaymentStatus.PENDING,
      'requires_confirmation': PaymentStatus.PENDING,
      'requires_action': PaymentStatus.REQUIRES_ACTION,
      'processing': PaymentStatus.PROCESSING,
      'requires_capture': PaymentStatus.PROCESSING,
      'canceled': PaymentStatus.CANCELED,
      'succeeded': PaymentStatus.SUCCEEDED,
    };

    return statusMap[stripeStatus] || PaymentStatus.FAILED;
  }

  /**
   * 保存支付记录到数据库
   */
  private async savePaymentRecord(paymentIntent: PaymentIntent, params: CreatePaymentParams): Promise<void> {
    const db = await getDb();

    await db.run(`
      INSERT INTO billing_records (
        id, user_id, provider, payment_method, amount, currency, status,
        description, payment_id, subscription_id, metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentIntent.id,
      params.userId,
      PaymentProviderEnum.STRIPE,
      'stripe',
      paymentIntent.amount,
      paymentIntent.currency,
      paymentIntent.status,
      params.description || '支付',
      paymentIntent.id,
      params.subscriptionId || null,
      JSON.stringify({
        planId: params.planId || '',
        stripePaymentIntentId: paymentIntent.id,
        ...paymentIntent.metadata
      }),
      paymentIntent.createdAt.toISOString(),
      paymentIntent.createdAt.toISOString()
    ]);
  }

  /**
   * 处理支付成功事件
   */
  private async handlePaymentSucceeded(paymentIntent: any): Promise<PaymentResult> {
    const db = await getDb();

    try {
      await db.run(`
        UPDATE billing_records
        SET status = 'succeeded',
            updated_at = ?,
            completed_at = ?,
            metadata = json_patch(metadata, ?)
        WHERE payment_id = ?
      `, [
        new Date().toISOString(),
        new Date().toISOString(),
        JSON.stringify({
          stripePaymentStatus: paymentIntent.status,
          stripeChargeId: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : null
        }),
        paymentIntent.id
      ]);

      // 获取支付记录并更新用户订阅
      const billingRecord = await db.get(`
        SELECT br.*, u.email as user_email
        FROM billing_records br
        JOIN users u ON br.user_id = u.id
        WHERE br.payment_id = ?
      `, [paymentIntent.id]);

      if (billingRecord) {
        await this.updateUserSubscription(billingRecord);
      }

      return {
        success: true,
        paymentId: paymentIntent.id,
        status: PaymentStatus.SUCCEEDED
      };
    } catch (error) {
      console.error('处理支付成功事件失败:', error);
      throw error;
    }
  }

  /**
   * 处理支付失败事件
   */
  private async handlePaymentFailed(paymentIntent: any): Promise<PaymentResult> {
    const db = await getDb();

    await db.run(`
      UPDATE billing_records
      SET status = 'failed',
          updated_at = ?,
          failed_at = ?,
          metadata = json_patch(metadata, ?)
      WHERE payment_id = ?
    `, [
      new Date().toISOString(),
      new Date().toISOString(),
      JSON.stringify({
        stripePaymentStatus: paymentIntent.status,
        failureReason: paymentIntent.last_payment_error?.message || '支付失败'
      }),
      paymentIntent.id
    ]);

    return {
      success: false,
      paymentId: paymentIntent.id,
      status: PaymentStatus.FAILED,
      message: paymentIntent.last_payment_error?.message || '支付失败'
    };
  }

  /**
   * 处理支付取消事件
   */
  private async handlePaymentCanceled(paymentIntent: any): Promise<PaymentResult> {
    const db = await getDb();

    await db.run(`
      UPDATE billing_records
      SET status = 'canceled',
          updated_at = ?,
          metadata = json_patch(metadata, ?)
      WHERE payment_id = ?
    `, [
      new Date().toISOString(),
      JSON.stringify({
        stripePaymentStatus: paymentIntent.status,
        canceledAt: new Date().toISOString()
      }),
      paymentIntent.id
    ]);

    return {
      success: true,
      paymentId: paymentIntent.id,
      status: PaymentStatus.CANCELED
    };
  }

  /**
   * 处理需要进一步操作的支付事件
   */
  private async handlePaymentRequiresAction(paymentIntent: any): Promise<PaymentResult> {
    const db = await getDb();

    await db.run(`
      UPDATE billing_records
      SET status = 'requires_action',
          updated_at = ?,
          metadata = json_patch(metadata, ?)
      WHERE payment_id = ?
    `, [
      new Date().toISOString(),
      JSON.stringify({
        stripePaymentStatus: paymentIntent.status,
        requiresAction: true,
        nextAction: paymentIntent.next_action?.type || 'unknown'
      }),
      paymentIntent.id
    ]);

    return {
      success: false,
      paymentId: paymentIntent.id,
      status: PaymentStatus.REQUIRES_ACTION,
      message: '需要进一步操作'
    };
  }

  /**
   * 更新用户订阅状态
   */
  private async updateUserSubscription(billingRecord: any): Promise<void> {
    const db = await getDb();

    try {
      const metadata = JSON.parse(billingRecord.metadata || '{}');
      const planId = metadata.planId;

      if (planId) {
        const plan = await db.get('SELECT * FROM plans WHERE id = ?', [planId]);

        if (plan) {
          const currentTime = new Date();
          const expiresAt = new Date(currentTime.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

          await db.run(`
            UPDATE users
            SET subscription_plan_id = ?,
                subscription_expires_at = ?,
                updated_at = ?
            WHERE id = ?
          `, [
            planId,
            expiresAt.toISOString(),
            currentTime.toISOString(),
            billingRecord.user_id
          ]);

          console.log(`用户订阅更新成功: 用户 ${billingRecord.user_id}, 套餐 ${planId}`);
        }
      }
    } catch (error) {
      console.error('更新用户订阅失败:', error);
      throw error;
    }
  }
}