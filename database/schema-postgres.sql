-- i8Relay PostgreSQL 数据库架构设计
-- 创建时间: 2025-09-25
-- 基于 SQLite 版本转换为 PostgreSQL 兼容格式

-- ============================================================================
-- 启用扩展
-- ============================================================================

-- 启用 UUID 生成扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 用户相关表
-- ============================================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'pending')),

  -- 套餐相关
  current_plan_id VARCHAR(32),
  plan_expires_at TIMESTAMP,

  -- 账户信息
  balance DECIMAL(10,4) DEFAULT 0.0000,
  api_key VARCHAR(255) UNIQUE,

  -- 个人信息
  avatar TEXT,
  phone VARCHAR(20),
  company VARCHAR(255),

  -- 统计信息
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.0000,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,

  FOREIGN KEY (current_plan_id) REFERENCES plans(id)
);

-- 用户会话表 (JWT token管理)
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255) UNIQUE,
  device_info TEXT,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_preview VARCHAR(100) NOT NULL, -- 显示用的前缀，如 sk-abc***
  permissions JSONB DEFAULT '["read","write"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 套餐相关表
-- ============================================================================

-- 套餐表
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- 定价信息
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'CNY',
  billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly', 'one-time')),
  duration_days INTEGER DEFAULT 30,

  -- 限制配置
  requests_limit INTEGER DEFAULT 0, -- 0表示无限制
  tokens_limit INTEGER DEFAULT 0,
  concurrent_limit INTEGER DEFAULT 5,

  -- 功能配置
  models JSONB, -- 支持的模型列表，JSON数组
  features JSONB, -- 功能特性列表，JSON数组

  -- 显示配置
  priority_support BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  plan_id VARCHAR(32) NOT NULL,

  -- 订阅状态
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'paused')),

  -- 时间信息
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,

  -- 支付信息
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- ============================================================================
-- 使用记录表
-- ============================================================================

-- 使用日志表（详细记录）
CREATE TABLE IF NOT EXISTS usage_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,

  -- 请求信息
  model VARCHAR(100) NOT NULL,
  provider VARCHAR(50), -- openai, anthropic, etc.
  endpoint VARCHAR(255),
  method VARCHAR(10),

  -- Token使用
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- 费用信息
  cost DECIMAL(10,6) DEFAULT 0.000000,
  currency VARCHAR(3) DEFAULT 'USD',

  -- 请求详情
  request_id VARCHAR(100),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 每日使用汇总表
CREATE TABLE IF NOT EXISTS daily_usage_summaries (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  date DATE NOT NULL,

  -- 汇总统计
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.0000,

  -- 按模型分类的使用情况
  model_usage_stats JSONB, -- JSON格式的详细统计

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 模型使用统计表
CREATE TABLE IF NOT EXISTS model_usage_stats (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  model VARCHAR(100) NOT NULL,
  date DATE NOT NULL,

  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0.000000,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, model, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 计费相关表
-- ============================================================================

-- 账单记录表
CREATE TABLE IF NOT EXISTS billing_records (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,

  -- 交易类型
  type VARCHAR(20) NOT NULL CHECK (type IN ('subscription', 'topup', 'usage', 'refund')),
  amount DECIMAL(10,4) NOT NULL, -- 正数为收入，负数为支出
  currency VARCHAR(3) DEFAULT 'CNY',
  description TEXT,

  -- 状态信息
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),

  -- 支付信息
  payment_method VARCHAR(50), -- stripe, alipay, wechat, etc.
  payment_id VARCHAR(255), -- 第三方支付ID

  -- 关联信息
  subscription_id VARCHAR(32),
  plan_id VARCHAR(32),

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- ============================================================================
-- 系统配置表
-- ============================================================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- 是否可以通过API公开访问

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(category, key)
);

-- 网站配置表
CREATE TABLE IF NOT EXISTS site_config (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
  site_name VARCHAR(255) DEFAULT 'i8Relay',
  site_description TEXT,
  site_logo TEXT,
  site_favicon TEXT,

  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_wechat VARCHAR(255),
  contact_address TEXT,

  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,

  theme_primary_color VARCHAR(7) DEFAULT '#3b82f6',
  theme_secondary_color VARCHAR(7) DEFAULT '#8b5cf6',

  enable_registration BOOLEAN DEFAULT true,
  enable_payment BOOLEAN DEFAULT true,
  enable_api_docs BOOLEAN DEFAULT true,

  homepage_hero_title VARCHAR(500),
  homepage_hero_subtitle TEXT,
  homepage_features JSONB, -- JSON格式

  footer_text TEXT,
  footer_links JSONB, -- JSON格式

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 通知相关表
-- ============================================================================

-- 系统通知表
CREATE TABLE IF NOT EXISTS system_notifications (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),

  target_type VARCHAR(20) DEFAULT 'all' CHECK (target_type IN ('all', 'users', 'admins', 'specific')),
  target_users JSONB, -- 特定用户ID列表，当target_type='specific'时使用

  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- 优先级，数字越大优先级越高

  starts_at TIMESTAMP,
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id VARCHAR(32) NOT NULL,

  action VARCHAR(100) NOT NULL, -- 操作类型
  target_type VARCHAR(50), -- 操作对象类型：user, plan, config等
  target_id VARCHAR(32), -- 操作对象ID

  details JSONB, -- 操作详情，JSON格式
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 索引创建
-- ============================================================================

-- 用户相关索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 会话相关索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- API密钥索引
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- 套餐相关索引
CREATE INDEX IF NOT EXISTS idx_plans_name ON plans(name);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON plans(sort_order);

-- 订阅相关索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- 使用记录索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON usage_logs(user_id, created_at);

-- 每日汇总索引
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage_summaries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage_summaries(date);

-- 模型统计索引
CREATE INDEX IF NOT EXISTS idx_model_usage_user_date ON model_usage_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage_stats(model);

-- 计费记录索引
CREATE INDEX IF NOT EXISTS idx_billing_records_user_id ON billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_type ON billing_records(type);
CREATE INDEX IF NOT EXISTS idx_billing_records_status ON billing_records(status);
CREATE INDEX IF NOT EXISTS idx_billing_records_created_at ON billing_records(created_at);

-- 系统配置索引
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS idx_system_config_category_key ON system_config(category, key);

-- 通知相关索引
CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_target_type ON system_notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_is_active ON system_notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_system_notifications_priority ON system_notifications(priority DESC);

-- 管理员日志索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);