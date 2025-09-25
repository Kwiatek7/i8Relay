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
  user_role VARCHAR(20) DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'super_admin')),
  user_status VARCHAR(20) DEFAULT 'active' CHECK (user_status IN ('active', 'inactive', 'banned', 'pending')),

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
  last_login_at TIMESTAMP
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
  key_name VARCHAR(255) NOT NULL,
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

-- 套餐分组表
CREATE TABLE IF NOT EXISTS plan_categories (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  category_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- 分组图标
  color VARCHAR(7) DEFAULT '#3b82f6', -- 分组主题色

  -- 显示配置
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- 是否为特色分组

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 套餐计划表
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(32) PRIMARY KEY,
  plan_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  duration_days INTEGER NOT NULL,

  -- 限制配置
  requests_limit INTEGER DEFAULT 10000, -- -1表示无限制
  tokens_limit INTEGER DEFAULT 100000,  -- -1表示无限制
  models JSONB DEFAULT '["gpt-3.5-turbo"]'::jsonb, -- JSON数组，支持的模型

  -- 功能特性
  features JSONB NOT NULL, -- JSON数组，功能列表
  billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly', 'one_time')),
  priority_support BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- 套餐分组
  category_id VARCHAR(32),

  -- 显示顺序
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  plan_id VARCHAR(32) NOT NULL,

  -- 订阅状态
  subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'paused')),

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

-- API使用日志表
CREATE TABLE IF NOT EXISTS usage_logs (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  api_key_id VARCHAR(32),

  -- 请求信息
  request_id VARCHAR(255),
  request_method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  model VARCHAR(100) NOT NULL,

  -- Token使用
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_creation_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- 响应信息
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,

  -- 费用
  cost DECIMAL(10,6) DEFAULT 0.000000,

  -- 请求元数据
  user_agent TEXT,
  ip_address INET,
  request_body_size INTEGER,
  response_body_size INTEGER,

  -- 错误信息
  error_code VARCHAR(50),
  error_message TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
);

-- 每日使用汇总表
CREATE TABLE IF NOT EXISTS daily_usage_summaries (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  record_date DATE NOT NULL,

  -- 统计数据
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,

  -- Token统计
  total_tokens INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_creation_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,

  -- 费用统计
  total_cost DECIMAL(10,6) DEFAULT 0.000000,

  -- 性能统计
  avg_response_time_ms INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, record_date)
);

-- 模型使用统计表
CREATE TABLE IF NOT EXISTS model_usage_stats (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  model VARCHAR(100) NOT NULL,
  record_date DATE NOT NULL,

  requests INTEGER DEFAULT 0,
  tokens INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0.000000,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, model, record_date)
);

-- ============================================================================
-- 计费相关表
-- ============================================================================

-- 账单记录表
CREATE TABLE IF NOT EXISTS billing_records (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,

  -- 交易类型
  record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('subscription', 'topup', 'usage', 'refund')),
  amount DECIMAL(10,4) NOT NULL, -- 正数为收入，负数为支出
  currency VARCHAR(3) DEFAULT 'CNY',
  description TEXT,

  -- 状态信息
  record_status VARCHAR(20) DEFAULT 'pending' CHECK (record_status IN ('pending', 'completed', 'failed', 'cancelled')),

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
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT,
  data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- 是否可以通过API公开访问

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(category, config_key)
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
  notification_type VARCHAR(20) DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'error', 'success')),

  target_type VARCHAR(20) DEFAULT 'all' CHECK (target_type IN ('all', 'users', 'admins', 'specific')),
  target_users JSONB, -- 特定用户ID列表，当target_type='specific'时使用

  is_active BOOLEAN DEFAULT true,
  notification_priority INTEGER DEFAULT 0, -- 优先级，数字越大优先级越高

  starts_at TIMESTAMP,
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户通知表
CREATE TABLE IF NOT EXISTS user_notifications (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  user_id VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  notification_message TEXT NOT NULL,
  notification_type VARCHAR(20) DEFAULT 'info' CHECK (notification_type IN ('system', 'billing', 'security', 'info', 'warning', 'success')),
  notification_priority VARCHAR(10) DEFAULT 'medium' CHECK (notification_priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB, -- JSON格式的额外信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 通知模板表
CREATE TABLE IF NOT EXISTS notification_templates (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  template_name VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  template_message TEXT NOT NULL,
  template_type VARCHAR(20) DEFAULT 'info' CHECK (template_type IN ('system', 'billing', 'security', 'info', 'warning', 'success')),
  template_priority VARCHAR(10) DEFAULT 'medium' CHECK (template_priority IN ('low', 'medium', 'high')),
  action_url TEXT,
  variables TEXT, -- JSON格式，可用变量说明
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通知规则表
CREATE TABLE IF NOT EXISTS notification_rules (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  rule_name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(100) NOT NULL, -- balance_low, subscription_expiring, usage_limit, payment_failed等
  trigger_condition TEXT NOT NULL, -- JSON格式存储触发条件
  template_id VARCHAR(32) NOT NULL,
  target_scope VARCHAR(20) DEFAULT 'all_users' CHECK (target_scope IN ('all_users', 'specific_users', 'user_roles')),
  target_users TEXT, -- JSON格式存储目标用户ID或角色
  is_enabled BOOLEAN DEFAULT TRUE,
  cooldown_minutes INTEGER DEFAULT 60, -- 冷却时间，避免重复发送
  created_by VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 规则执行日志表
CREATE TABLE IF NOT EXISTS notification_rule_logs (
  id VARCHAR(32) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::TEXT, '-', ''),
  rule_id VARCHAR(32) NOT NULL,
  trigger_data TEXT, -- JSON格式，触发时的数据
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notifications_sent INTEGER DEFAULT 0,
  target_users TEXT, -- JSON格式，实际发送的用户列表
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  FOREIGN KEY (rule_id) REFERENCES notification_rules(id) ON DELETE CASCADE
);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id VARCHAR(32) NOT NULL,

  admin_action VARCHAR(100) NOT NULL, -- 操作类型
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
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(user_status);
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
CREATE INDEX IF NOT EXISTS idx_plan_categories_sort_order ON plan_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_plan_categories_is_active ON plan_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_plan_categories_is_featured ON plan_categories(is_featured);

CREATE INDEX IF NOT EXISTS idx_plans_name ON plans(plan_name);
CREATE INDEX IF NOT EXISTS idx_plans_category_id ON plans(category_id);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON plans(sort_order);

-- 订阅相关索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- 使用记录索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_status_code ON usage_logs(status_code);

-- 每日汇总索引
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage_summaries(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage_summaries(record_date);

-- 模型统计索引
CREATE INDEX IF NOT EXISTS idx_model_usage_user_date ON model_usage_stats(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage_stats(model);

-- 计费记录索引
CREATE INDEX IF NOT EXISTS idx_billing_records_user_id ON billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_type ON billing_records(record_type);
CREATE INDEX IF NOT EXISTS idx_billing_records_status ON billing_records(record_status);
CREATE INDEX IF NOT EXISTS idx_billing_records_created_at ON billing_records(created_at);

-- 系统配置索引
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS idx_system_config_category_key ON system_config(category, config_key);

-- 通知相关索引
CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_target_type ON system_notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_is_active ON system_notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_system_notifications_priority ON system_notifications(notification_priority DESC);

-- 管理员日志索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(admin_action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- 用户通知索引
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_priority ON user_notifications(notification_priority);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON user_notifications(user_id, is_read);

-- 通知模板索引
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(template_type);

-- 通知规则索引
CREATE INDEX IF NOT EXISTS idx_notification_rules_type ON notification_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled ON notification_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_notification_rules_template_id ON notification_rules(template_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_creator ON notification_rules(created_by);

-- 通知规则日志索引
CREATE INDEX IF NOT EXISTS idx_notification_rule_logs_rule_id ON notification_rule_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_notification_rule_logs_executed_at ON notification_rule_logs(executed_at);

-- ============================================================================
-- 外键约束（延迟添加以解决依赖关系）
-- ============================================================================

-- 添加 users 表的外键约束（引用 plans 表）
ALTER TABLE users ADD CONSTRAINT fk_users_current_plan 
  FOREIGN KEY (current_plan_id) REFERENCES plans(id);