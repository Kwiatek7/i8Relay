-- i8Relay SQLite数据库架构设计
-- 创建时间: 2025-09-22

-- ============================================================================
-- 用户相关表
-- ============================================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'pending')),

  -- 套餐相关
  current_plan_id TEXT,
  plan_expires_at DATETIME,

  -- 账户信息
  balance DECIMAL(10,4) DEFAULT 0.0000,
  api_key TEXT UNIQUE,

  -- 个人信息
  avatar TEXT,
  phone TEXT,
  company TEXT,

  -- 统计信息
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.0000,

  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,

  FOREIGN KEY (current_plan_id) REFERENCES plans(id)
);

-- 用户会话表 (JWT token管理)
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL, -- 显示用的前缀，如 sk-abc***
  permissions TEXT DEFAULT '["read","write"]', -- JSON数组
  is_active BOOLEAN DEFAULT true,
  last_used_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 套餐相关表
-- ============================================================================

-- 套餐分组表
CREATE TABLE IF NOT EXISTS plan_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- 分组图标
  color TEXT DEFAULT '#3b82f6', -- 分组主题色

  -- 显示配置
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- 是否为特色分组

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 套餐计划表
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  duration_days INTEGER NOT NULL,

  -- 限制配置
  requests_limit INTEGER DEFAULT 10000, -- -1表示无限制
  tokens_limit INTEGER DEFAULT 100000,  -- -1表示无限制
  models TEXT DEFAULT '["gpt-3.5-turbo"]', -- JSON数组，支持的模型

  -- 功能特性
  features TEXT NOT NULL, -- JSON数组，功能列表
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly', 'one_time')),
  priority_support BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- 套餐分组
  category_id TEXT,

  -- 显示顺序
  sort_order INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户订阅历史表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),

  -- 订阅时间
  starts_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  cancelled_at DATETIME,

  -- 价格信息（记录历史价格）
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- ============================================================================
-- 计费相关表
-- ============================================================================

-- 账单记录表
CREATE TABLE IF NOT EXISTS billing_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('charge', 'usage', 'refund', 'subscription', 'topup')),
  amount DECIMAL(10,4) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),

  -- 支付相关
  payment_method TEXT, -- alipay, wechat, stripe等
  payment_id TEXT,     -- 第三方支付订单号

  -- 关联信息
  subscription_id TEXT,
  reference_id TEXT,   -- 关联的其他记录ID

  -- 元数据
  metadata TEXT,       -- JSON格式的额外信息

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);

-- ============================================================================
-- 使用统计相关表
-- ============================================================================

-- API使用日志表
CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  api_key_id TEXT,

  -- 请求信息
  request_id TEXT,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,

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
  ip_address TEXT,
  request_body_size INTEGER,
  response_body_size INTEGER,

  -- 错误信息
  error_code TEXT,
  error_message TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
);

-- 每日使用汇总表
CREATE TABLE IF NOT EXISTS daily_usage_summaries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,

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

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- 模型使用统计表
CREATE TABLE IF NOT EXISTS model_usage_stats (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  model TEXT NOT NULL,
  date DATE NOT NULL,

  requests INTEGER DEFAULT 0,
  tokens INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0.000000,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, model, date)
);

-- ============================================================================
-- 系统配置相关表
-- ============================================================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- 是否可以公开读取
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(category, key)
);

-- 网站配置表（用于前台网站配置）
CREATE TABLE IF NOT EXISTS site_config (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  site_name TEXT DEFAULT 'i8Relay',
  site_description TEXT DEFAULT 'AI API中转服务',
  site_logo TEXT,
  site_favicon TEXT,

  -- 联系信息
  contact_email TEXT,
  contact_phone TEXT,
  contact_wechat TEXT,
  contact_address TEXT,

  -- SEO配置
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,

  -- 主题配置
  theme_primary_color TEXT DEFAULT '#3b82f6',
  theme_secondary_color TEXT DEFAULT '#8b5cf6',

  -- 功能开关
  enable_registration BOOLEAN DEFAULT true,
  enable_payment BOOLEAN DEFAULT true,
  enable_api_docs BOOLEAN DEFAULT true,

  -- 自定义页面内容
  homepage_hero_title TEXT,
  homepage_hero_subtitle TEXT,
  homepage_features TEXT, -- JSON格式

  -- 脚注信息
  footer_text TEXT,
  footer_links TEXT, -- JSON格式

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 管理相关表
-- ============================================================================

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 资源类型：user, plan, config等
  resource_id TEXT,            -- 资源ID
  old_values TEXT,             -- JSON格式的旧值
  new_values TEXT,             -- JSON格式的新值
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 系统通知表
CREATE TABLE IF NOT EXISTS system_notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'users', 'admins', 'specific')),
  target_users TEXT, -- JSON数组，当target_type为specific时使用

  is_active BOOLEAN DEFAULT true,
  starts_at DATETIME,
  expires_at DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 索引创建
-- ============================================================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 会话表索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- API密钥表索引
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- 订阅表索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- 账单表索引
CREATE INDEX IF NOT EXISTS idx_billing_records_user_id ON billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_type ON billing_records(type);
CREATE INDEX IF NOT EXISTS idx_billing_records_status ON billing_records(status);
CREATE INDEX IF NOT EXISTS idx_billing_records_created_at ON billing_records(created_at);

-- 使用日志表索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_status_code ON usage_logs(status_code);

-- 日汇总表索引
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_id_date ON daily_usage_summaries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage_summaries(date);

-- 模型统计表索引
CREATE INDEX IF NOT EXISTS idx_model_usage_user_id_date ON model_usage_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage_stats(model);

-- 系统配置索引
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- 管理日志索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);