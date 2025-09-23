// 支付系统通用类型定义

export interface PaymentConfig {
  enabled: boolean;
  testMode: boolean;
  [key: string]: any; // 允许每个支付提供商有自己的配置字段
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string;
  paymentUrl?: string;
  qrCode?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  message?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  description?: string;
  userId: string;
  userEmail?: string;
  planId?: string;
  subscriptionId?: string;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  signature?: string;
  timestamp: Date;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  REQUIRES_ACTION = 'requires_action'
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  EPAY = 'epay',
  ALIPAY = 'alipay',
  WECHAT_PAY = 'wechat_pay'
}

export interface PaymentMethod {
  id: string;
  name: string;
  provider: PaymentProvider;
  enabled: boolean;
  icon?: string;
  description?: string;
  supportedCurrencies: string[];
  minimumAmount?: number;
  maximumAmount?: number;
}

// 支付提供商配置接口
export interface StripeConfig extends PaymentConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currency: string;
  country: string;
}

export interface EpayConfig extends PaymentConfig {
  merchantId: string;
  merchantKey: string;
  apiUrl: string;
  notifyUrl: string;
  returnUrl: string;
  signType: 'MD5' | 'RSA';
  supportedChannels: string[]; // 支持的支付渠道，如 ['alipay', 'wxpay', 'qqpay']
}

export interface AlipayConfig extends PaymentConfig {
  appId: string;
  privateKey: string;
  publicKey: string; // 支付宝公钥
}

export interface WechatPayConfig extends PaymentConfig {
  mchId: string; // 商户号
  privateKey: string; // 商户私钥
  certificateSerial: string; // 商户证书序列号
  apiV3Key: string; // API v3 密钥
  appId?: string; // 应用ID（JSAPI支付需要）
}

// 数据库记录接口
export interface PaymentRecord {
  id: string;
  userId: string;
  provider: PaymentProvider;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  paymentId: string; // 支付提供商的订单ID
  transactionId?: string; // 第三方交易ID
  planId?: string;
  subscriptionId?: string;
  metadata?: string; // JSON字符串
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
}