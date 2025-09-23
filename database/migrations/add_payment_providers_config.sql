-- 添加支付提供商配置字段到 site_config 表
-- 创建时间: 2024-01-XX

-- 添加默认支付提供商配置
ALTER TABLE site_config ADD COLUMN default_payment_provider TEXT DEFAULT 'stripe';

-- Stripe 支付配置
ALTER TABLE site_config ADD COLUMN stripe_enabled BOOLEAN DEFAULT false;
ALTER TABLE site_config ADD COLUMN stripe_publishable_key TEXT;
ALTER TABLE site_config ADD COLUMN stripe_secret_key TEXT;
ALTER TABLE site_config ADD COLUMN stripe_webhook_secret TEXT;
ALTER TABLE site_config ADD COLUMN stripe_test_mode BOOLEAN DEFAULT true;
ALTER TABLE site_config ADD COLUMN stripe_currency TEXT DEFAULT 'usd';
ALTER TABLE site_config ADD COLUMN stripe_country TEXT DEFAULT 'US';

-- 易支付配置
ALTER TABLE site_config ADD COLUMN epay_enabled BOOLEAN DEFAULT false;
ALTER TABLE site_config ADD COLUMN epay_merchant_id TEXT;
ALTER TABLE site_config ADD COLUMN epay_merchant_key TEXT;
ALTER TABLE site_config ADD COLUMN epay_api_url TEXT;
ALTER TABLE site_config ADD COLUMN epay_notify_url TEXT;
ALTER TABLE site_config ADD COLUMN epay_return_url TEXT;
ALTER TABLE site_config ADD COLUMN epay_test_mode BOOLEAN DEFAULT true;
ALTER TABLE site_config ADD COLUMN epay_sign_type TEXT DEFAULT 'MD5' CHECK (epay_sign_type IN ('MD5', 'RSA'));
ALTER TABLE site_config ADD COLUMN epay_supported_channels TEXT DEFAULT '["alipay", "wxpay"]'; -- JSON 数组

-- 支付宝直连配置（未来扩展）
ALTER TABLE site_config ADD COLUMN alipay_enabled BOOLEAN DEFAULT false;
ALTER TABLE site_config ADD COLUMN alipay_app_id TEXT;
ALTER TABLE site_config ADD COLUMN alipay_private_key TEXT;
ALTER TABLE site_config ADD COLUMN alipay_public_key TEXT;
ALTER TABLE site_config ADD COLUMN alipay_test_mode BOOLEAN DEFAULT true;

-- 微信支付直连配置（未来扩展）
ALTER TABLE site_config ADD COLUMN wechat_pay_enabled BOOLEAN DEFAULT false;
ALTER TABLE site_config ADD COLUMN wechat_pay_mch_id TEXT;
ALTER TABLE site_config ADD COLUMN wechat_pay_private_key TEXT;
ALTER TABLE site_config ADD COLUMN wechat_pay_certificate_serial TEXT;
ALTER TABLE site_config ADD COLUMN wechat_pay_api_v3_key TEXT;
ALTER TABLE site_config ADD COLUMN wechat_pay_test_mode BOOLEAN DEFAULT true;

-- 更新 billing_records 表，添加更多支付相关字段
ALTER TABLE billing_records ADD COLUMN provider TEXT; -- 支付提供商：stripe, epay, alipay, wechat_pay
ALTER TABLE billing_records ADD COLUMN transaction_id TEXT; -- 第三方交易ID
ALTER TABLE billing_records ADD COLUMN completed_at DATETIME; -- 支付完成时间
ALTER TABLE billing_records ADD COLUMN failed_at DATETIME; -- 支付失败时间

-- 创建支付相关索引（在后续单独的语句中执行）

-- 插入默认的站点配置记录（如果不存在）
INSERT OR IGNORE INTO site_config (id) VALUES ('default');