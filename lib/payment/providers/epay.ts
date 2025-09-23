// 易支付提供商实现

import crypto from 'crypto';
import {
  PaymentProvider as PaymentProviderEnum,
  PaymentIntent,
  PaymentResult,
  CreatePaymentParams,
  WebhookEvent,
  PaymentStatus,
  EpayConfig
} from '../types';
import { PaymentProvider } from '../provider';
import { getDb } from '../../database/connection';

export class EpayProvider extends PaymentProvider {
  constructor(config: EpayConfig) {
    super(config, PaymentProviderEnum.EPAY);
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
    const config = this.config as EpayConfig;
    return !!(
      config.enabled &&
      config.merchantId &&
      config.merchantKey &&
      config.apiUrl &&
      config.notifyUrl &&
      config.returnUrl
    );
  }

  /**
   * 创建支付意图
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      // 生成订单号
      const orderId = this.generateOrderId();

      // 准备支付参数
      const config = this.config as EpayConfig;
      const paymentParams = {
        pid: config.merchantId,
        type: 'alipay', // 默认使用支付宝，可根据需要扩展
        out_trade_no: orderId,
        notify_url: params.notifyUrl || config.notifyUrl,
        return_url: params.returnUrl || config.returnUrl,
        name: params.description || '商品购买',
        money: params.amount.toString(),
        clientip: '127.0.0.1', // 可以从请求中获取真实IP
        device: 'pc'
      };

      // 生成签名
      const sign = this.generateSignature(paymentParams);
      const signedParams = { ...paymentParams, sign, sign_type: config.signType };

      // 构造支付URL
      const paymentUrl = this.buildPaymentUrl(signedParams);

      // 创建统一的 PaymentIntent
      const paymentIntent: PaymentIntent = {
        id: orderId,
        amount: params.amount,
        currency: 'CNY', // 易支付通常使用人民币
        status: PaymentStatus.PENDING,
        paymentUrl,
        metadata: {
          userId: params.userId,
          userEmail: params.userEmail || '',
          planId: params.planId || '',
          subscriptionId: params.subscriptionId || '',
          epayTradeNo: orderId,
          ...params.metadata
        },
        createdAt: new Date(),
      };

      // 保存支付记录到数据库
      await this.savePaymentRecord(paymentIntent, params);

      return paymentIntent;
    } catch (error) {
      console.error('易支付创建支付失败:', error);
      throw new Error(`创建支付失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // 查询数据库中的支付状态
      const db = await getDb();
      const record = await db.get(
        'SELECT status FROM billing_records WHERE payment_id = ? AND provider = ?',
        [paymentId, PaymentProviderEnum.EPAY]
      );

      if (!record) {
        throw new Error('支付记录不存在');
      }

      return this.mapEpayStatus(record.status);
    } catch (error) {
      console.error('查询支付状态失败:', error);
      throw new Error(`查询支付状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 确认支付（易支付通常通过回调处理，此方法用于手动确认）
   */
  async confirmPayment(paymentId: string, params?: any): Promise<PaymentResult> {
    try {
      const db = await getDb();

      // 更新支付状态为成功
      const result = await db.run(`
        UPDATE billing_records
        SET status = ?, updated_at = ?, completed_at = ?
        WHERE payment_id = ? AND provider = ?
      `, [
        PaymentStatus.SUCCEEDED,
        new Date().toISOString(),
        new Date().toISOString(),
        paymentId,
        PaymentProviderEnum.EPAY
      ]);

      if ((result.changes ?? 0) === 0) {
        throw new Error('支付记录不存在或更新失败');
      }

      return {
        success: true,
        paymentId,
        status: PaymentStatus.SUCCEEDED,
        message: '支付确认成功'
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
    try {
      const db = await getDb();

      const result = await db.run(`
        UPDATE billing_records
        SET status = ?, updated_at = ?
        WHERE payment_id = ? AND provider = ? AND status = ?
      `, [
        PaymentStatus.CANCELED,
        new Date().toISOString(),
        paymentId,
        PaymentProviderEnum.EPAY,
        PaymentStatus.PENDING
      ]);

      if ((result.changes ?? 0) === 0) {
        throw new Error('支付记录不存在或无法取消');
      }

      return {
        success: true,
        paymentId,
        status: PaymentStatus.CANCELED,
        message: '支付已取消'
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
   * 处理退款（易支付一般不支持程序化退款，需要手动处理）
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<PaymentResult> {
    // 易支付通常不支持程序化退款，需要在管理后台手动处理
    return {
      success: false,
      paymentId,
      status: PaymentStatus.FAILED,
      message: '易支付不支持程序化退款，请在管理后台手动处理'
    };
  }

  /**
   * 验证 Webhook 签名
   */
  async validateWebhook(payload: string | Buffer, signature: string): Promise<WebhookEvent | null> {
    try {
      // 解析易支付回调参数
      const params = this.parseCallbackParams(payload.toString());

      // 验证签名
      const expectedSign = this.generateSignature(params);
      if (expectedSign !== signature && expectedSign !== params.sign) {
        console.error('易支付回调签名验证失败');
        return null;
      }

      // 构造 WebhookEvent
      return {
        id: params.out_trade_no || '',
        type: 'payment_notify',
        data: params,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('易支付 Webhook 验证失败:', error);
      return null;
    }
  }

  /**
   * 处理 Webhook 事件
   */
  async handleWebhook(event: WebhookEvent): Promise<PaymentResult> {
    try {
      const data = event.data;
      const paymentId = data.out_trade_no;
      const tradeStatus = data.trade_status;

      if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
        return await this.handlePaymentSuccess(paymentId, data);
      } else if (tradeStatus === 'TRADE_CLOSED') {
        return await this.handlePaymentCanceled(paymentId);
      } else {
        return {
          success: true,
          paymentId,
          status: PaymentStatus.PROCESSING,
          message: '支付处理中'
        };
      }
    } catch (error) {
      console.error('处理易支付 Webhook 事件失败:', error);
      return {
        success: false,
        paymentId: event.id,
        status: PaymentStatus.FAILED,
        message: error instanceof Error ? error.message : '处理事件失败'
      };
    }
  }

  /**
   * 格式化金额（易支付使用元为单位）
   */
  protected formatAmount(amount: number, currency: string): number {
    return amount; // 易支付使用元为单位，不需要转换
  }

  /**
   * 解析金额（易支付使用元为单位）
   */
  protected parseAmount(amount: number, currency: string): number {
    return amount; // 易支付使用元为单位，不需要转换
  }

  /**
   * 生成订单号
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `epay_${timestamp}_${random}`;
  }

  /**
   * 生成签名
   */
  protected generateSignature(params: Record<string, any>): string {
    // 排除 sign 和 sign_type 参数
    const filteredParams = Object.keys(params)
      .filter(key => key !== 'sign' && key !== 'sign_type')
      .sort()
      .reduce((result, key) => {
        if (params[key]) {
          result[key] = params[key];
        }
        return result;
      }, {} as Record<string, string>);

    // 构造签名字符串
    const config = this.config as EpayConfig;
    const signString = Object.keys(filteredParams)
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&') + config.merchantKey;

    // 根据签名类型生成签名
    if (config.signType === 'MD5') {
      return crypto.createHash('md5').update(signString).digest('hex');
    } else {
      // RSA 签名实现（如果需要）
      throw new Error('RSA 签名暂未实现');
    }
  }

  /**
   * 构造支付URL
   */
  private buildPaymentUrl(params: Record<string, string>): string {
    const config = this.config as EpayConfig;
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    return `${config.apiUrl}/submit.php?${queryString}`;
  }

  /**
   * 解析回调参数
   */
  private parseCallbackParams(payload: string): Record<string, string> {
    const params: Record<string, string> = {};

    // 如果是 URL 编码的表单数据
    if (payload.includes('=') && payload.includes('&')) {
      payload.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    } else {
      // 如果是 JSON 格式
      try {
        const jsonData = JSON.parse(payload);
        Object.assign(params, jsonData);
      } catch {
        throw new Error('无法解析回调参数');
      }
    }

    return params;
  }

  /**
   * 映射易支付状态到统一状态
   */
  private mapEpayStatus(epayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'pending': PaymentStatus.PENDING,
      'processing': PaymentStatus.PROCESSING,
      'succeeded': PaymentStatus.SUCCEEDED,
      'failed': PaymentStatus.FAILED,
      'canceled': PaymentStatus.CANCELED,
      'expired': PaymentStatus.EXPIRED,
    };

    return statusMap[epayStatus] || PaymentStatus.PENDING;
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
      PaymentProviderEnum.EPAY,
      'epay',
      paymentIntent.amount,
      paymentIntent.currency,
      paymentIntent.status,
      params.description || '支付',
      paymentIntent.id,
      params.subscriptionId || null,
      JSON.stringify({
        planId: params.planId || '',
        epayTradeNo: paymentIntent.id,
        paymentUrl: paymentIntent.paymentUrl,
        ...paymentIntent.metadata
      }),
      paymentIntent.createdAt.toISOString(),
      paymentIntent.createdAt.toISOString()
    ]);
  }

  /**
   * 处理支付成功事件
   */
  private async handlePaymentSuccess(paymentId: string, callbackData: any): Promise<PaymentResult> {
    const db = await getDb();

    try {
      await db.run(`
        UPDATE billing_records
        SET status = ?,
            updated_at = ?,
            completed_at = ?,
            transaction_id = ?,
            metadata = json_patch(metadata, ?)
        WHERE payment_id = ? AND provider = ?
      `, [
        PaymentStatus.SUCCEEDED,
        new Date().toISOString(),
        new Date().toISOString(),
        callbackData.trade_no || null,
        JSON.stringify({
          epayTradeStatus: callbackData.trade_status,
          epayTradeNo: callbackData.trade_no,
          epayBuyerEmail: callbackData.buyer_email,
          completedAt: new Date().toISOString()
        }),
        paymentId,
        PaymentProviderEnum.EPAY
      ]);

      // 获取支付记录并更新用户订阅
      const billingRecord = await db.get(`
        SELECT br.*, u.email as user_email
        FROM billing_records br
        JOIN users u ON br.user_id = u.id
        WHERE br.payment_id = ? AND br.provider = ?
      `, [paymentId, PaymentProviderEnum.EPAY]);

      if (billingRecord) {
        await this.updateUserSubscription(billingRecord);
      }

      return {
        success: true,
        paymentId,
        status: PaymentStatus.SUCCEEDED,
        transactionId: callbackData.trade_no
      };
    } catch (error) {
      console.error('处理易支付成功事件失败:', error);
      throw error;
    }
  }

  /**
   * 处理支付取消事件
   */
  private async handlePaymentCanceled(paymentId: string): Promise<PaymentResult> {
    const db = await getDb();

    await db.run(`
      UPDATE billing_records
      SET status = ?, updated_at = ?
      WHERE payment_id = ? AND provider = ?
    `, [
      PaymentStatus.CANCELED,
      new Date().toISOString(),
      paymentId,
      PaymentProviderEnum.EPAY
    ]);

    return {
      success: true,
      paymentId,
      status: PaymentStatus.CANCELED,
      message: '支付已取消'
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