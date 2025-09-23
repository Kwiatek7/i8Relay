-- 为支付相关字段创建索引
-- 创建时间: 2024-01-XX

-- 创建支付相关索引
CREATE INDEX IF NOT EXISTS idx_billing_records_provider ON billing_records(provider);
CREATE INDEX IF NOT EXISTS idx_billing_records_payment_id ON billing_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_transaction_id ON billing_records(transaction_id);