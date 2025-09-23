// 支付宝直连支付提供商实现

import crypto from 'crypto';
import {
  PaymentProvider as PaymentProviderEnum,
  PaymentIntent,
  PaymentResult,
  CreatePaymentParams,
  WebhookEvent,
  PaymentStatus,
  AlipayConfig
} from '../types';
import { PaymentProvider } from '../provider';
import { getDb } from '../../database/connection';

export class AlipayProvider extends PaymentProvider {
  constructor(config: AlipayConfig) {
    super(config, PaymentProviderEnum.ALIPAY);
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
    const config = this.config as AlipayConfig;
    return !!(
      config.enabled &&
      config.appId &&
      config.privateKey &&
      config.publicKey
    );
  }

  /**
   * 创建支付意图
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      const config = this.config as AlipayConfig;
      const orderId = this.generateOrderId();

      // 构建支付请求参数
      const bizContent = {
        out_trade_no: orderId,
        total_amount: params.amount.toFixed(2),
        subject: params.description || '商品支付',
        body: params.description || '商品支付',
        timeout_express: '15m', // 15分钟超时
        product_code: 'FAST_INSTANT_TRADE_PAY' // 即时到账产品码
      };

      const commonParams = {
        app_id: config.appId,
        method: 'alipay.trade.page.pay',
        charset: 'UTF-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
        notify_url: params.notifyUrl || this.getNotifyUrl(),
        return_url: params.returnUrl || this.getReturnUrl()
      };

      // 生成签名
      const sign = this.generateSignature(commonParams);
      const signedParams = { ...commonParams, sign };

      // 构建支付URL
      const paymentUrl = this.buildPaymentUrl(signedParams);

      // 创建统一的 PaymentIntent 对象
      const paymentIntent: PaymentIntent = {
        id: orderId,
        amount: params.amount,
        currency: 'CNY', // 支付宝使用人民币
        status: PaymentStatus.PENDING,
        paymentUrl: paymentUrl,
        metadata: {
          alipayOrderId: orderId,
          alipayAppId: config.appId,
          totalAmount: params.amount.toFixed(2),
          ...params.metadata
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15分钟后过期
      };

      // 如果是移动端或需要二维码，生成二维码支付
      if (this.needsQRCode(params.metadata?.paymentMethod)) {
        paymentIntent.qrCode = await this.generateQRCodePayment(params, orderId);
      }

      // 记录到数据库
      await this.savePaymentRecord(paymentIntent, params);

      return paymentIntent;
    } catch (error) {
      console.error('支付宝创建支付失败:', error);
      throw new Error(`创建支付失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const config = this.config as AlipayConfig;

      // 构建查询参数
      const bizContent = {
        out_trade_no: paymentId
      };

      const commonParams = {
        app_id: config.appId,
        method: 'alipay.trade.query',
        charset: 'UTF-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent)
      };

      const sign = this.generateSignature(commonParams);
      const signedParams = { ...commonParams, sign };

      // 发送查询请求
      const queryUrl = config.testMode
        ? 'https://openapi.alipaydev.com/gateway.do'
        : 'https://openapi.alipay.com/gateway.do';

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: this.buildQueryString(signedParams)
      });

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (result.alipay_trade_query_response?.code === '10000') {
        const tradeStatus = result.alipay_trade_query_response.trade_status;
        return this.mapAlipayStatus(tradeStatus);
      } else {
        // 如果查询失败，从数据库获取状态
        const db = await getDb();
        const record = await db.get(
          'SELECT status FROM billing_records WHERE payment_id = ? AND provider = ?',
          [paymentId, PaymentProviderEnum.ALIPAY]
        );
        return record ? this.mapAlipayStatus(record.status) : PaymentStatus.FAILED;
      }
    } catch (error) {
      console.error('查询支付宝支付状态失败:', error);
      throw new Error(`查询支付状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 确认支付
   */
  async confirmPayment(paymentId: string, params?: any): Promise<PaymentResult> {
    // 支付宝通过异步通知确认支付，这里只是查询状态
    try {
      const status = await this.getPaymentStatus(paymentId);

      return {
        success: status === PaymentStatus.SUCCEEDED,
        paymentId,
        status,
      };
    } catch (error) {
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
      const config = this.config as AlipayConfig;

      // 构建取消支付参数
      const bizContent = {
        out_trade_no: paymentId
      };

      const commonParams = {
        app_id: config.appId,
        method: 'alipay.trade.cancel',
        charset: 'UTF-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent)
      };

      const sign = this.generateSignature(commonParams);
      const signedParams = { ...commonParams, sign };

      // 发送取消请求
      const cancelUrl = config.testMode
        ? 'https://openapi.alipaydev.com/gateway.do'
        : 'https://openapi.alipay.com/gateway.do';

      const response = await fetch(cancelUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: this.buildQueryString(signedParams)
      });

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (result.alipay_trade_cancel_response?.code === '10000') {
        // 更新数据库状态
        const db = await getDb();
        await db.run(`
          UPDATE billing_records
          SET status = ?, updated_at = ?
          WHERE payment_id = ? AND provider = ?
        `, [PaymentStatus.CANCELED, new Date().toISOString(), paymentId, PaymentProviderEnum.ALIPAY]);

        return {
          success: true,
          paymentId,
          status: PaymentStatus.CANCELED,
          message: '支付已取消'
        };
      } else {
        throw new Error(result.alipay_trade_cancel_response?.msg || '取消支付失败');
      }
    } catch (error) {
      console.error('取消支付宝支付失败:', error);
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
    try {
      const config = this.config as AlipayConfig;

      // 构建退款参数
      const bizContent: any = {
        out_trade_no: paymentId,
        refund_reason: reason || '用户申请退款'
      };

      if (amount !== undefined) {
        bizContent.refund_amount = amount.toFixed(2);
      }

      const commonParams = {
        app_id: config.appId,
        method: 'alipay.trade.refund',
        charset: 'UTF-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent)
      };

      const sign = this.generateSignature(commonParams);
      const signedParams = { ...commonParams, sign };

      // 发送退款请求
      const refundUrl = config.testMode
        ? 'https://openapi.alipaydev.com/gateway.do'
        : 'https://openapi.alipay.com/gateway.do';

      const response = await fetch(refundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: this.buildQueryString(signedParams)
      });

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (result.alipay_trade_refund_response?.code === '10000') {
        return {
          success: true,
          paymentId,
          status: PaymentStatus.SUCCEEDED,
          transactionId: result.alipay_trade_refund_response.trade_no,
          metadata: {
            refundAmount: result.alipay_trade_refund_response.refund_fee,
            refundReason: reason
          }
        };
      } else {
        throw new Error(result.alipay_trade_refund_response?.msg || '退款失败');
      }
    } catch (error) {
      console.error('支付宝退款失败:', error);
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
    try {
      // 解析支付宝回调参数
      const params = this.parseCallbackParams(payload.toString());

      // 验证签名
      if (!this.verifySignature(params)) {
        console.error('支付宝回调签名验证失败');
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
      console.error('支付宝 Webhook 验证失败:', error);
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
      console.error('处理支付宝 Webhook 事件失败:', error);
      return {
        success: false,
        paymentId: event.id,
        status: PaymentStatus.FAILED,
        message: error instanceof Error ? error.message : '处理事件失败'
      };
    }
  }

  /**
   * 格式化金额（支付宝使用元为单位，保留两位小数）
   */
  protected formatAmount(amount: number, currency: string): number {
    return parseFloat(amount.toFixed(2));
  }

  /**
   * 解析金额（支付宝使用元为单位）
   */
  protected parseAmount(amount: number, currency: string): number {
    return amount;
  }

  /**
   * 生成订单号
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `alipay_${timestamp}_${random}`;
  }

  /**
   * 生成RSA2签名
   */
  protected generateSignature(params: Record<string, any>): string {
    const config = this.config as AlipayConfig;

    // 排除sign参数，按字母顺序排序
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'sign' && params[key] !== '' && params[key] !== null && params[key] !== undefined)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    // 构建待签名字符串
    const signString = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    // 使用RSA2私钥签名
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signString, 'utf8');
    return sign.sign(config.privateKey, 'base64');
  }

  /**
   * 验证RSA2签名
   */
  protected verifySignature(params: Record<string, any>): boolean {
    const config = this.config as AlipayConfig;
    const sign = params.sign;

    if (!sign) return false;

    // 构建待验证字符串
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'sign' && key !== 'sign_type')
      .sort()
      .reduce((result, key) => {
        if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
          result[key] = params[key];
        }
        return result;
      }, {} as Record<string, any>);

    const signString = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    // 使用支付宝公钥验证签名
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signString, 'utf8');
    return verify.verify(config.publicKey, sign, 'base64');
  }

  /**
   * 构建支付URL
   */
  private buildPaymentUrl(params: Record<string, string>): string {
    const config = this.config as AlipayConfig;
    const baseUrl = config.testMode
      ? 'https://openapi.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do';

    const queryString = this.buildQueryString(params);
    return `${baseUrl}?${queryString}`;
  }

  /**
   * 构建查询字符串
   */
  private buildQueryString(params: Record<string, any>): string {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  /**
   * 解析回调参数
   */
  private parseCallbackParams(payload: string): Record<string, any> {
    const params: Record<string, any> = {};

    if (payload.includes('=') && payload.includes('&')) {
      payload.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    } else {
      try {
        Object.assign(params, JSON.parse(payload));
      } catch {
        throw new Error('无法解析回调参数');
      }
    }

    return params;
  }

  /**
   * 判断是否需要二维码
   */
  private needsQRCode(paymentMethod?: string): boolean {
    return paymentMethod === 'qrcode' || paymentMethod === 'mobile';
  }

  /**
   * 生成二维码支付
   */
  private async generateQRCodePayment(params: CreatePaymentParams, orderId: string): Promise<string> {
    try {
      const config = this.config as AlipayConfig;

      // 使用支付宝当面付接口
      const bizContent = {
        out_trade_no: orderId,
        total_amount: params.amount.toFixed(2),
        subject: params.description || '扫码支付',
        timeout_express: '15m'
      };

      const commonParams = {
        app_id: config.appId,
        method: 'alipay.trade.precreate',
        charset: 'UTF-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
        notify_url: params.notifyUrl || this.getNotifyUrl()
      };

      const sign = this.generateSignature(commonParams);
      const signedParams = { ...commonParams, sign };

      const qrUrl = config.testMode
        ? 'https://openapi.alipaydev.com/gateway.do'
        : 'https://openapi.alipay.com/gateway.do';

      const response = await fetch(qrUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: this.buildQueryString(signedParams)
      });

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (result.alipay_trade_precreate_response?.code === '10000') {
        return result.alipay_trade_precreate_response.qr_code;
      } else {
        throw new Error(result.alipay_trade_precreate_response?.msg || '生成二维码失败');
      }
    } catch (error) {
      console.error('生成支付宝二维码失败:', error);
      // 返回支付URL作为备选
      return this.buildPaymentUrl({
        method: 'alipay.trade.page.pay',
        out_trade_no: orderId
      });
    }
  }

  /**
   * 获取通知URL
   */
  private getNotifyUrl(): string {
    // 这里应该返回您的服务器通知URL
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/alipay`;
  }

  /**
   * 获取返回URL
   */
  private getReturnUrl(): string {
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/result`;
  }

  /**
   * 映射支付宝状态到统一状态
   */
  private mapAlipayStatus(alipayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'WAIT_BUYER_PAY': PaymentStatus.PENDING,
      'TRADE_CLOSED': PaymentStatus.CANCELED,
      'TRADE_SUCCESS': PaymentStatus.SUCCEEDED,
      'TRADE_FINISHED': PaymentStatus.SUCCEEDED,
      'pending': PaymentStatus.PENDING,
      'processing': PaymentStatus.PROCESSING,
      'succeeded': PaymentStatus.SUCCEEDED,
      'failed': PaymentStatus.FAILED,
      'canceled': PaymentStatus.CANCELED,
    };

    return statusMap[alipayStatus] || PaymentStatus.PENDING;
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
      PaymentProviderEnum.ALIPAY,
      'alipay',
      paymentIntent.amount,
      paymentIntent.currency,
      paymentIntent.status,
      params.description || '支付宝支付',
      paymentIntent.id,
      params.subscriptionId || null,
      JSON.stringify({
        planId: params.planId || '',
        alipayOrderId: paymentIntent.id,
        paymentUrl: paymentIntent.paymentUrl,
        qrCode: paymentIntent.qrCode,
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
        callbackData.trade_no || '',
        JSON.stringify({
          alipayTradeNo: callbackData.trade_no || '',
          alipayTradeStatus: callbackData.trade_status || '',
          alipayBuyerId: callbackData.buyer_id || '',
          alipayBuyerLogonId: callbackData.buyer_logon_id || '',
          completedAt: new Date().toISOString()
        }),
        paymentId,
        PaymentProviderEnum.ALIPAY
      ]);

      // 获取支付记录并更新用户订阅
      const billingRecord = await db.get(`
        SELECT br.*, u.email as user_email
        FROM billing_records br
        JOIN users u ON br.user_id = u.id
        WHERE br.payment_id = ? AND br.provider = ?
      `, [paymentId, PaymentProviderEnum.ALIPAY]);

      if (billingRecord) {
        await this.updateUserSubscription(billingRecord);
      }

      return {
        success: true,
        paymentId,
        status: PaymentStatus.SUCCEEDED,
        transactionId: callbackData.trade_no || ''
      };
    } catch (error) {
      console.error('处理支付宝成功事件失败:', error);
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
      PaymentProviderEnum.ALIPAY
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