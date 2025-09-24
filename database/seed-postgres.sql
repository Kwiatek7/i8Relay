-- i8Relay PostgreSQL 数据库初始化数据
-- 创建时间: 2025-09-25
-- 基于 MySQL 版本转换

-- ============================================================================
-- 初始化套餐数据
-- ============================================================================

INSERT INTO plans (id, name, display_name, description, price, currency, duration_days, requests_limit, tokens_limit, models, features, priority_support, is_popular, is_active, sort_order) VALUES
-- 免费体验版
('free', 'free', '体验版', '适合个人用户体验AI服务', 0.00, 'CNY', 30, 10000, 100000, '["gpt-3.5-turbo", "claude-3-haiku"]'::jsonb, '["每月10万Tokens", "Claude-3-Haiku", "基础API支持", "邮件技术支持"]'::jsonb, false, false, true, 1),

-- 基础版
('basic', 'basic', '基础版', '适合轻度使用的个人开发者', 29.90, 'CNY', 30, 100000, 500000, '["gpt-3.5-turbo", "claude-3-haiku", "claude-3-sonnet"]'::jsonb, '["每月50万Tokens", "Claude-3-Haiku + Sonnet", "标准API支持", "工单技术支持", "7天数据保留"]'::jsonb, false, false, true, 2),

-- 标准版（推荐）
('standard', 'standard', '标准版', '适合中小企业和团队使用', 99.90, 'CNY', 30, 500000, 2000000, '["gpt-3.5-turbo", "gpt-4", "claude-3-haiku", "claude-3-sonnet", "claude-3.5-sonnet"]'::jsonb, '["每月200万Tokens", "Claude全系列模型", "高级API支持", "优先技术支持", "30天数据保留", "API监控面板"]'::jsonb, true, true, true, 3),

-- 专业版
('pro', 'pro', '专业版', '适合大型企业和高频使用', 299.90, 'CNY', 30, 2000000, 8000000, '["*"]'::jsonb, '["每月800万Tokens", "Claude全系列模型", "企业级API支持", "24/7技术支持", "90天数据保留", "高级监控面板", "专属客户经理"]'::jsonb, true, false, true, 4),

-- 拼车版
('shared', 'shared', '拼车版', '多人共享，经济实惠', 19.90, 'CNY', 30, 150000, 300000, '["gpt-3.5-turbo", "claude-3-haiku", "claude-3-sonnet"]'::jsonb, '["共享30万Tokens", "Claude-3-Haiku + Sonnet", "基础API支持", "社区技术支持", "适合学习和测试"]'::jsonb, false, false, true, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days,
  requests_limit = EXCLUDED.requests_limit,
  tokens_limit = EXCLUDED.tokens_limit,
  models = EXCLUDED.models,
  features = EXCLUDED.features,
  priority_support = EXCLUDED.priority_support,
  is_popular = EXCLUDED.is_popular,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- 初始化系统配置
-- ============================================================================

INSERT INTO system_config (category, key, value, data_type, description, is_public) VALUES
-- 网站基础配置
('site', 'name', 'i8Relay', 'string', '网站名称', true),
('site', 'description', '为用户提供稳定、安全、优惠的AI模型API中转服务', 'string', '网站描述', true),
('site', 'logo_url', '/logo.png', 'string', '网站Logo URL', true),
('site', 'favicon_url', '/favicon.ico', 'string', '网站图标URL', true),

-- 联系信息
('contact', 'email', 'support@i8relay.com', 'string', '客服邮箱', true),
('contact', 'wechat', 'qianyvs', 'string', '微信号', true),
('contact', 'phone', '', 'string', '客服电话', true),

-- 功能开关
('features', 'enable_registration', 'true', 'boolean', '是否开启用户注册', false),
('features', 'enable_payment', 'true', 'boolean', '是否开启支付功能', false),
('features', 'enable_api_docs', 'true', 'boolean', '是否显示API文档', true),

-- 支付配置
('payment', 'stripe_public_key', '', 'string', 'Stripe公钥', false),
('payment', 'alipay_app_id', '', 'string', '支付宝应用ID', false),
('payment', 'wechat_app_id', '', 'string', '微信支付应用ID', false),

-- 邮件配置
('email', 'smtp_host', '', 'string', 'SMTP服务器', false),
('email', 'smtp_port', '587', 'number', 'SMTP端口', false),
('email', 'smtp_user', '', 'string', 'SMTP用户名', false),
('email', 'smtp_password', '', 'string', 'SMTP密码', false),

-- AI模型配置
('models', 'openai_api_key', '', 'string', 'OpenAI API密钥', false),
('models', 'anthropic_api_key', '', 'string', 'Anthropic API密钥', false),
('models', 'default_model_pricing', '{"gpt-3.5-turbo": {"input": 0.0015, "output": 0.002}, "gpt-4": {"input": 0.03, "output": 0.06}, "claude-3-haiku": {"input": 0.00025, "output": 0.00125}, "claude-3-sonnet": {"input": 0.003, "output": 0.015}, "claude-3.5-sonnet": {"input": 0.003, "output": 0.015}}', 'json', '默认模型定价（每1K tokens美元）', false),

-- 安全配置
('security', 'jwt_secret', '', 'string', 'JWT密钥', false),
('security', 'jwt_expires_in', '24h', 'string', 'JWT过期时间', false),
('security', 'refresh_token_expires_in', '30d', 'string', '刷新Token过期时间', false),
('security', 'password_salt_rounds', '12', 'number', '密码加盐轮数', false),

-- 限流配置
('rate_limiting', 'default_requests_per_minute', '60', 'number', '默认每分钟请求限制', false),
('rate_limiting', 'default_tokens_per_minute', '10000', 'number', '默认每分钟Token限制', false),

-- 系统维护
('maintenance', 'enabled', 'false', 'boolean', '是否开启维护模式', false),
('maintenance', 'message', '系统正在维护中，请稍后再试', 'string', '维护提示信息', true)
ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  data_type = EXCLUDED.data_type,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;

-- ============================================================================
-- 初始化网站配置
-- ============================================================================

INSERT INTO site_config (
  id, site_name, site_description,
  contact_email, contact_wechat,
  seo_title, seo_description, seo_keywords,
  theme_primary_color, theme_secondary_color,
  enable_registration, enable_payment, enable_api_docs,
  homepage_hero_title, homepage_hero_subtitle,
  homepage_features,
  footer_text
) VALUES (
  'default',
  'i8Relay',
  '为用户提供稳定、安全、优惠的Claude Code、GPT、Gemini等AI模型API中转服务',
  'support@i8relay.com',
  'qianyvs',
  'i8Relay - AI API中转服务',
  '稳定、安全、优惠的AI模型API中转服务，支持Claude、GPT、Gemini等主流AI模型',
  'AI,API,Claude,GPT,OpenAI,中转,代理,人工智能',
  '#3b82f6',
  '#8b5cf6',
  true,
  true,
  true,
  'i8Relay',
  '为用户提供稳定、安全、优惠的Claude Code、GPT、Gemini等AI模型API中转服务，使用体验与直连官网完全相同。确保使用官方原版安装包，仅优化网络，不做其他任何处理。',
  '[
    {"icon": "Shield", "title": "企业级安全", "description": "多层安全防护，保障您的数据安全"},
    {"icon": "Zap", "title": "低延迟路由", "description": "全球多节点部署，毫秒级响应"},
    {"icon": "BarChart3", "title": "实时统计", "description": "详细的API调用统计和监控"},
    {"icon": "CreditCard", "title": "Stripe 支付", "description": "安全便捷的国际支付体验"}
  ]'::jsonb,
  '© 2025 i8Relay. All rights reserved. 与AI一起带来无限的创新，无尽的机遇'
)
ON CONFLICT (id) DO UPDATE SET
  site_name = EXCLUDED.site_name,
  site_description = EXCLUDED.site_description,
  contact_email = EXCLUDED.contact_email,
  contact_wechat = EXCLUDED.contact_wechat,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  seo_keywords = EXCLUDED.seo_keywords,
  theme_primary_color = EXCLUDED.theme_primary_color,
  theme_secondary_color = EXCLUDED.theme_secondary_color,
  enable_registration = EXCLUDED.enable_registration,
  enable_payment = EXCLUDED.enable_payment,
  enable_api_docs = EXCLUDED.enable_api_docs,
  homepage_hero_title = EXCLUDED.homepage_hero_title,
  homepage_hero_subtitle = EXCLUDED.homepage_hero_subtitle,
  homepage_features = EXCLUDED.homepage_features,
  footer_text = EXCLUDED.footer_text;

-- ============================================================================
-- 创建默认管理员用户（密码: admin123456）
-- ============================================================================

-- 注意：这里使用的是示例密码hash，实际部署时需要修改
INSERT INTO users (
  id, username, email, password_hash, salt, role, status,
  current_plan_id, balance, api_key,
  created_at, updated_at
) VALUES (
  'admin-001',
  '系统管理员',
  'admin@i8relay.com',
  '$2b$12$LQv3c1yqBw2LenN5Qc8LDOHqrOQK.V5O9x7Y.VvHV.H5W.K5K.K5K', -- admin123456的hash
  'admin_salt_001',
  'super_admin',
  'active',
  'pro',
  1000.0000,
  CONCAT('sk-admin-', REPLACE(uuid_generate_v4()::TEXT, '-', '')),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  current_plan_id = EXCLUDED.current_plan_id,
  balance = EXCLUDED.balance,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 创建演示用户
-- ============================================================================

INSERT INTO users (
  id, username, email, password_hash, salt, role, status,
  current_plan_id, balance, api_key,
  created_at, updated_at
) VALUES
-- 演示用户1 - 基础版用户
('demo-user-001',
  '演示用户1',
  'demo@i8relay.com',
  '$2b$12$LQv3c1yqBw2LenN5Qc8LDOHqrOQK.V5O9x7Y.VvHV.H5W.K5K.K5K', -- password123
  'demo_salt_001',
  'user',
  'active',
  'basic',
  100.0000,
  CONCAT('sk-demo-', REPLACE(uuid_generate_v4()::TEXT, '-', '')),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),

-- 演示用户2 - 专业版用户
('demo-user-002',
  '演示用户2',
  'demo2@i8relay.com',
  '$2b$12$LQv3c1yqBw2LenN5Qc8LDOHqrOQK.V5O9x7Y.VvHV.H5W.K5K.K5K', -- password123
  'demo_salt_002',
  'user',
  'active',
  'pro',
  300.0000,
  CONCAT('sk-demo2-', REPLACE(uuid_generate_v4()::TEXT, '-', '')),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  current_plan_id = EXCLUDED.current_plan_id,
  balance = EXCLUDED.balance,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 创建演示订阅数据
-- ============================================================================

INSERT INTO user_subscriptions (
  id, user_id, plan_id, status,
  starts_at, expires_at,
  price, currency
) VALUES
('sub-001', 'demo-user-001', 'basic', 'active',
  NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days',
  29.90, 'CNY'
),
('sub-002', 'demo-user-002', 'pro', 'active',
  NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days',
  299.90, 'CNY'
)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  plan_id = EXCLUDED.plan_id,
  status = EXCLUDED.status,
  starts_at = EXCLUDED.starts_at,
  expires_at = EXCLUDED.expires_at,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency;

-- ============================================================================
-- 创建演示API密钥
-- ============================================================================

INSERT INTO api_keys (
  id, user_id, name, key_hash, key_preview,
  permissions, is_active, last_used_at
) VALUES
('key-001', 'demo-user-001', '默认密钥',
  'demo_key_hash_001', 'sk-demo***************************abc123',
  '["read", "write"]'::jsonb, true, NOW() - INTERVAL '2 hours'
),
('key-002', 'demo-user-002', '生产环境',
  'demo_key_hash_002', 'sk-prod***************************def456',
  '["read", "write", "admin"]'::jsonb, true, NOW() - INTERVAL '30 minutes'
),
('key-003', 'demo-user-002', '测试环境',
  'demo_key_hash_003', 'sk-test***************************ghi789',
  '["read"]'::jsonb, false, NULL
)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  key_hash = EXCLUDED.key_hash,
  key_preview = EXCLUDED.key_preview,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  last_used_at = EXCLUDED.last_used_at;

-- ============================================================================
-- 创建演示账单记录
-- ============================================================================

INSERT INTO billing_records (
  id, user_id, type, amount, currency, description, status,
  payment_method, created_at
) VALUES
('bill-001', 'demo-user-001', 'subscription', -29.90, 'CNY', '基础版套餐 - 2025年1月', 'completed',
  'alipay', NOW() - INTERVAL '15 days'
),
('bill-002', 'demo-user-001', 'topup', 100.00, 'CNY', '账户充值', 'completed',
  'wechat', NOW() - INTERVAL '20 days'
),
('bill-003', 'demo-user-002', 'subscription', -299.90, 'CNY', '专业版套餐 - 2025年1月', 'completed',
  'alipay', NOW() - INTERVAL '10 days'
),
('bill-004', 'demo-user-002', 'usage', -25.50, 'CNY', 'API调用费用 - GPT-4', 'completed',
  NULL, NOW() - INTERVAL '5 days'
)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  type = EXCLUDED.type,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  payment_method = EXCLUDED.payment_method,
  created_at = EXCLUDED.created_at;

-- ============================================================================
-- 创建系统通知
-- ============================================================================

INSERT INTO system_notifications (
  id, title, content, type, target_type, is_active
) VALUES
('notif-001', '欢迎使用i8Relay', '感谢您选择i8Relay AI API中转服务！如有任何问题，请联系客服微信：qianyvs', 'info', 'users', true),
('notif-002', '维护通知', '系统将在今晚2:00-4:00进行维护升级，期间可能短暂中断服务，请合理安排使用时间。', 'warning', 'all', false)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  target_type = EXCLUDED.target_type,
  is_active = EXCLUDED.is_active;