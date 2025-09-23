// 微信支付直连支付提供商实现

import crypto from 'crypto';
import {
  PaymentProvider as PaymentProviderEnum,
  PaymentIntent,
  PaymentResult,
  CreatePaymentParams,
  WebhookEvent,
  PaymentStatus,
  WechatPayConfig
} from '../types';
import { PaymentProvider } from '../provider';
import { getDb } from '../../database/connection';

export class WechatPayProvider extends PaymentProvider {
  private readonly baseUrl: string;

  constructor(config: WechatPayConfig) {
    super(config, PaymentProviderEnum.WECHAT_PAY);
    this.baseUrl = config.testMode
      ? 'https://api.mch.weixin.qq.com'
      : 'https://api.mch.weixin.qq.com';
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
    const config = this.config as WechatPayConfig;
    return !!(
      config.enabled &&
      config.mchId &&
      config.privateKey &&
      config.certificateSerial &&
      config.apiV3Key
    );
  }

  /**
   * 创建支付意图
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      const config = this.config as WechatPayConfig;
      const orderId = this.generateOrderId();

      // 确定支付场景
      const tradeType = this.determineTradeType(params.metadata?.paymentMethod);

      // 构建支付请求参数
      const requestBody = {
        appid: config.appId || '', // JSAPI支付必需
        mchid: config.mchId,
        description: params.description || '商品支付',
        out_trade_no: orderId,
        time_expire: this.getExpireTime(),
        notify_url: params.notifyUrl || this.getNotifyUrl(),
        amount: {
          total: Math.round(params.amount * 100), // 微信支付使用分为单位
          currency: 'CNY'
        },
        ...(tradeType === 'JSAPI' && {
          payer: {
            openid: params.metadata?.openid || '' // JSAPI支付需要openid
          }
        }),
        ...(tradeType === 'H5' && {
          scene_info: {
            payer_client_ip: params.metadata?.clientIp || '127.0.0.1',
            h5_info: {
              type: 'Wap',
              app_name: params.metadata?.appName || '商户应用',
              app_url: params.metadata?.appUrl || this.getReturnUrl()
            }
          }
        })
      };

      // 发起支付请求
      const response = await this.makeWechatRequest(
        'POST',
        `/v3/pay/transactions/${tradeType.toLowerCase()}`,
        requestBody
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`微信支付创建失败: ${errorData.message || '未知错误'}`);
      }

      const responseData = await response.json();

      // 创建统一的 PaymentIntent 对象
      const paymentIntent: PaymentIntent = {
        id: orderId,
        amount: params.amount,
        currency: 'CNY',
        status: PaymentStatus.PENDING,
        metadata: {
          wechatOrderId: orderId,
          wechatPrepayId: responseData.prepay_id,
          tradeType,
          mchId: config.mchId,
          ...params.metadata
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15分钟后过期
      };

      // 根据支付场景设置不同的支付信息
      if (tradeType === 'NATIVE') {
        // 二维码支付
        paymentIntent.qrCode = responseData.code_url;
      } else if (tradeType === 'H5') {
        // H5支付
        paymentIntent.paymentUrl = responseData.h5_url;
      } else if (tradeType === 'JSAPI') {
        // JSAPI支付需要前端调用微信支付
        paymentIntent.clientSecret = this.generateJSAPIPayParams(responseData.prepay_id);
      }

      // 记录到数据库
      await this.savePaymentRecord(paymentIntent, params);

      return paymentIntent;
    } catch (error) {
      console.error('微信支付创建支付失败:', error);
      throw new Error(`创建支付失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const config = this.config as WechatPayConfig;

      // 发起查询请求
      const response = await this.makeWechatRequest(
        'GET',
        `/v3/pay/transactions/out-trade-no/${paymentId}?mchid=${config.mchId}`
      );

      if (!response.ok) {
        // 如果查询失败，从数据库获取状态
        const db = await getDb();
        const record = await db.get(
          'SELECT status FROM billing_records WHERE payment_id = ? AND provider = ?',
          [paymentId, PaymentProviderEnum.WECHAT_PAY]
        );
        return record ? this.mapWechatStatus(record.status) : PaymentStatus.FAILED;
      }

      const responseData = await response.json();
      return this.mapWechatStatus(responseData.trade_state);
    } catch (error) {
      console.error('查询微信支付状态失败:', error);
      throw new Error(`查询支付状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 确认支付
   */
  async confirmPayment(paymentId: string, params?: any): Promise<PaymentResult> {
    // 微信支付通过异步通知确认支付，这里只是查询状态
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
      const config = this.config as WechatPayConfig;

      // 构建关闭订单请求
      const requestBody = {
        mchid: config.mchId
      };

      const response = await this.makeWechatRequest(
        'POST',
        `/v3/pay/transactions/out-trade-no/${paymentId}/close`,
        requestBody
      );

      if (response.ok || response.status === 204) {
        // 更新数据库状态
        const db = await getDb();
        await db.run(`
          UPDATE billing_records
          SET status = ?, updated_at = ?
          WHERE payment_id = ? AND provider = ?
        `, [PaymentStatus.CANCELED, new Date().toISOString(), paymentId, PaymentProviderEnum.WECHAT_PAY]);

        return {
          success: true,
          paymentId,
          status: PaymentStatus.CANCELED,
          message: '支付已取消'
        };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '取消支付失败');
      }
    } catch (error) {
      console.error('取消微信支付失败:', error);
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
      const config = this.config as WechatPayConfig;
      const refundId = this.generateRefundId();

      // 获取原支付信息
      const db = await getDb();
      const originalPayment = await db.get(
        'SELECT * FROM billing_records WHERE payment_id = ? AND provider = ?',
        [paymentId, PaymentProviderEnum.WECHAT_PAY]
      );

      if (!originalPayment) {
        throw new Error('原支付记录不存在');
      }

      const totalAmount = Math.round(originalPayment.amount * 100);
      const refundAmount = amount ? Math.round(amount * 100) : totalAmount;

      // 构建退款请求
      const requestBody = {
        out_trade_no: paymentId,
        out_refund_no: refundId,
        reason: reason || '用户申请退款',
        notify_url: this.getRefundNotifyUrl(),
        amount: {
          refund: refundAmount,
          total: totalAmount,
          currency: 'CNY'
        }
      };

      const response = await this.makeWechatRequest(
        'POST',
        '/v3/refund/domestic/refunds',
        requestBody
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '退款申请失败');
      }

      const responseData = await response.json();

      return {
        success: true,
        paymentId,
        status: PaymentStatus.SUCCEEDED,
        transactionId: responseData.refund_id,
        metadata: {
          refundId: responseData.out_refund_no,
          refundAmount: responseData.amount.refund / 100,
          refundReason: reason
        }
      };
    } catch (error) {
      console.error('微信支付退款失败:', error);
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
      // 解析微信支付回调头部信息
      const signatureParts = signature.split(',');
      const timestampMatch = signatureParts.find(part => part.startsWith('t='));
      const nonceMatch = signatureParts.find(part => part.startsWith('n='));
      const signatureMatch = signatureParts.find(part => part.startsWith('s='));

      if (!timestampMatch || !nonceMatch || !signatureMatch) {
        console.error('微信支付回调签名格式错误');
        return null;
      }

      const timestamp = timestampMatch.split('=')[1];
      const nonce = nonceMatch.split('=')[1];
      const sign = signatureMatch.split('=')[1];

      // 验证签名
      if (!this.verifyWebhookSignature(timestamp, nonce, payload.toString(), sign)) {
        console.error('微信支付回调签名验证失败');
        return null;
      }

      // 解析回调数据
      const callbackData = JSON.parse(payload.toString());

      // 解密resource数据
      const decryptedData = this.decryptWebhookResource(callbackData.resource);

      // 构造 WebhookEvent
      return {
        id: callbackData.id || '',
        type: callbackData.event_type || 'payment_notify',
        data: {
          ...callbackData,
          resource: decryptedData
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('微信支付 Webhook 验证失败:', error);
      return null;
    }
  }

  /**
   * 处理 Webhook 事件
   */
  async handleWebhook(event: WebhookEvent): Promise<PaymentResult> {
    try {
      const eventType = event.type;
      const resource = event.data.resource;

      if (eventType === 'TRANSACTION.SUCCESS') {
        return await this.handlePaymentSuccess(resource.out_trade_no, resource);
      } else if (eventType === 'REFUND.SUCCESS') {
        return await this.handleRefundSuccess(resource.out_trade_no, resource);
      } else {
        return {
          success: true,
          paymentId: resource.out_trade_no || event.id,
          status: PaymentStatus.PROCESSING,
          message: '事件处理成功'
        };
      }
    } catch (error) {
      console.error('处理微信支付 Webhook 事件失败:', error);
      return {
        success: false,
        paymentId: event.id,
        status: PaymentStatus.FAILED,
        message: error instanceof Error ? error.message : '处理事件失败'
      };
    }
  }

  /**
   * 格式化金额（微信支付使用分为单位）
   */
  protected formatAmount(amount: number, currency: string): number {
    return Math.round(amount * 100);
  }

  /**
   * 解析金额（微信支付使用分为单位）
   */
  protected parseAmount(amount: number, currency: string): number {
    return amount / 100;
  }

  /**
   * 生成订单号
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `wechat_${timestamp}_${random}`;
  }

  /**
   * 生成退款订单号
   */
  private generateRefundId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `refund_${timestamp}_${random}`;
  }

  /**
   * 确定支付场景类型
   */
  private determineTradeType(paymentMethod?: string): string {
    switch (paymentMethod) {
      case 'jsapi':
        return 'JSAPI';
      case 'h5':
        return 'H5';
      case 'qrcode':
      case 'native':
      default:
        return 'NATIVE';
    }
  }

  /**
   * 生成过期时间
   */
  private getExpireTime(): string {
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 15); // 15分钟后过期
    return expireTime.toISOString();
  }

  /**
   * 发起微信支付请求
   */
  private async makeWechatRequest(method: string, path: string, body?: any): Promise<Response> {
    const config = this.config as WechatPayConfig;
    const url = `${this.baseUrl}${path}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const bodyString = body ? JSON.stringify(body) : '';

    // 构建签名字符串
    const signString = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyString}\n`;

    // 生成签名
    const signature = this.generateRequestSignature(signString);

    // 构建Authorization头
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${config.certificateSerial}"`;

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorization,
        'User-Agent': 'aiporxy-wechat-pay/1.0'
      }
    };

    if (body) {
      requestOptions.body = bodyString;
    }

    return fetch(url, requestOptions);
  }

  /**
   * 生成请求签名
   */
  private generateRequestSignature(signString: string): string {
    const config = this.config as WechatPayConfig;
    const sign = crypto.createSign('SHA256');
    sign.update(signString);
    return sign.sign(config.privateKey, 'base64');
  }

  /**
   * 验证Webhook签名
   */
  private verifyWebhookSignature(timestamp: string, nonce: string, body: string, signature: string): boolean {
    const config = this.config as WechatPayConfig;

    // 构建验证字符串
    const verifyString = `${timestamp}\n${nonce}\n${body}\n`;

    // 这里需要微信支付平台证书公钥来验证，暂时返回true
    // 在生产环境中，需要获取并验证微信支付平台证书
    console.log('微信支付Webhook签名验证 - 验证字符串:', verifyString);
    return true;
  }

  /**
   * 解密Webhook资源数据
   */
  private decryptWebhookResource(resource: any): any {
    const config = this.config as WechatPayConfig;

    try {
      const { ciphertext, nonce, associated_data } = resource;

      // 使用AEAD_AES_256_GCM解密
      const decipher = crypto.createDecipher('aes-256-gcm', config.apiV3Key);

      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('解密微信支付回调数据失败:', error);
      // 如果解密失败，返回原始数据
      return resource;
    }
  }

  /**
   * 生成JSAPI支付参数
   */
  private generateJSAPIPayParams(prepayId: string): string {
    const config = this.config as WechatPayConfig;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const pkg = `prepay_id=${prepayId}`;

    // 构建签名字符串
    const signString = `${config.appId}\n${timestamp}\n${nonce}\n${pkg}\n`;

    // 生成签名
    const paySign = this.generateRequestSignature(signString);

    return JSON.stringify({
      appId: config.appId,
      timeStamp: timestamp,
      nonceStr: nonce,
      package: pkg,
      signType: 'RSA',
      paySign: paySign
    });
  }

  /**
   * 获取通知URL
   */
  private getNotifyUrl(): string {
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/wechat`;
  }

  /**
   * 获取退款通知URL
   */
  private getRefundNotifyUrl(): string {
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/wechat/refund`;
  }

  /**
   * 获取返回URL
   */
  private getReturnUrl(): string {
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/result`;
  }

  /**
   * 映射微信支付状态到统一状态
   */
  private mapWechatStatus(wechatStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'SUCCESS': PaymentStatus.SUCCEEDED,
      'REFUND': PaymentStatus.SUCCEEDED,
      'NOTPAY': PaymentStatus.PENDING,
      'CLOSED': PaymentStatus.CANCELED,
      'REVOKED': PaymentStatus.CANCELED,
      'USERPAYING': PaymentStatus.PROCESSING,
      'PAYERROR': PaymentStatus.FAILED,
      'pending': PaymentStatus.PENDING,
      'processing': PaymentStatus.PROCESSING,
      'succeeded': PaymentStatus.SUCCEEDED,
      'failed': PaymentStatus.FAILED,
      'canceled': PaymentStatus.CANCELED,
    };

    return statusMap[wechatStatus] || PaymentStatus.PENDING;
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
      PaymentProviderEnum.WECHAT_PAY,
      'wechat_pay',
      paymentIntent.amount,
      paymentIntent.currency,
      paymentIntent.status,
      params.description || '微信支付',
      paymentIntent.id,
      params.subscriptionId || null,
      JSON.stringify({
        planId: params.planId || '',
        wechatOrderId: paymentIntent.id,
        paymentUrl: paymentIntent.paymentUrl,
        qrCode: paymentIntent.qrCode,
        clientSecret: paymentIntent.clientSecret,
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
        callbackData.transaction_id || '',
        JSON.stringify({
          wechatTransactionId: callbackData.transaction_id || '',
          wechatTradeState: callbackData.trade_state || '',
          wechatPayerId: callbackData.payer?.openid || '',
          completedAt: new Date().toISOString()
        }),
        paymentId,
        PaymentProviderEnum.WECHAT_PAY
      ]);

      // 获取支付记录并更新用户订阅
      const billingRecord = await db.get(`
        SELECT br.*, u.email as user_email
        FROM billing_records br
        JOIN users u ON br.user_id = u.id
        WHERE br.payment_id = ? AND br.provider = ?
      `, [paymentId, PaymentProviderEnum.WECHAT_PAY]);

      if (billingRecord) {
        await this.updateUserSubscription(billingRecord);
      }

      return {
        success: true,
        paymentId,
        status: PaymentStatus.SUCCEEDED,
        transactionId: callbackData.transaction_id || ''
      };
    } catch (error) {
      console.error('处理微信支付成功事件失败:', error);
      throw error;
    }
  }

  /**
   * 处理退款成功事件
   */
  private async handleRefundSuccess(paymentId: string, callbackData: any): Promise<PaymentResult> {
    console.log('微信支付退款成功:', { paymentId, callbackData });

    return {
      success: true,
      paymentId,
      status: PaymentStatus.SUCCEEDED,
      message: '退款成功'
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