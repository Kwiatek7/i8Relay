-- AI账号管理系统种子数据
-- 用于测试账号分级和绑定功能

-- ============================================================================
-- 创建示例AI账号池
-- ============================================================================

-- OpenAI账号池
INSERT OR REPLACE INTO ai_accounts (id, account_name, provider, account_type, credentials, tier, max_requests_per_minute, max_tokens_per_minute, max_concurrent_requests, is_shared, health_score, monthly_cost, description, tags) VALUES
-- 基础级别账号（公共池）
('ai-openai-basic-001', 'OpenAI基础账号1', 'openai', 'api_key', 'sk-encrypted_basic_key_001', 'basic', 60, 80000, 3, true, 95, 50.00, 'OpenAI基础级别账号，适用于轻度使用', '["gpt-3.5-turbo", "public-pool"]'),
('ai-openai-basic-002', 'OpenAI基础账号2', 'openai', 'api_key', 'sk-encrypted_basic_key_002', 'basic', 60, 80000, 3, true, 88, 50.00, 'OpenAI基础级别账号，适用于轻度使用', '["gpt-3.5-turbo", "public-pool"]'),
('ai-openai-basic-003', 'OpenAI基础账号3', 'openai', 'api_key', 'sk-encrypted_basic_key_003', 'basic', 60, 80000, 3, true, 92, 50.00, 'OpenAI基础级别账号，适用于轻度使用', '["gpt-3.5-turbo", "public-pool"]'),

-- 标准级别账号（拼车专用）
('ai-openai-std-001', 'OpenAI标准账号1', 'openai', 'api_key', 'sk-encrypted_std_key_001', 'standard', 120, 150000, 5, false, 96, 120.00, 'OpenAI标准级别专属账号，支持GPT-4', '["gpt-3.5-turbo", "gpt-4", "dedicated"]'),
('ai-openai-std-002', 'OpenAI标准账号2', 'openai', 'api_key', 'sk-encrypted_std_key_002', 'standard', 120, 150000, 5, false, 94, 120.00, 'OpenAI标准级别专属账号，支持GPT-4', '["gpt-3.5-turbo", "gpt-4", "dedicated"]'),
('ai-openai-std-003', 'OpenAI标准账号3', 'openai', 'api_key', 'sk-encrypted_std_key_003', 'standard', 120, 150000, 5, false, 98, 120.00, 'OpenAI标准级别专属账号，支持GPT-4', '["gpt-3.5-turbo", "gpt-4", "dedicated"]'),

-- 高级账号（企业专用）
('ai-openai-premium-001', 'OpenAI高级账号1', 'openai', 'api_key', 'sk-encrypted_premium_key_001', 'premium', 300, 500000, 10, false, 99, 500.00, 'OpenAI高级账号，企业级服务', '["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "enterprise"]');

-- Anthropic/Claude账号池
INSERT OR REPLACE INTO ai_accounts (id, account_name, provider, account_type, credentials, tier, max_requests_per_minute, max_tokens_per_minute, max_concurrent_requests, is_shared, health_score, monthly_cost, description, tags) VALUES
-- 基础级别账号（公共池）
('ai-claude-basic-001', 'Claude基础账号1', 'anthropic', 'api_key', 'sk-ant-encrypted_basic_key_001', 'basic', 50, 100000, 3, true, 93, 40.00, 'Claude基础级别账号，支持Haiku和Sonnet', '["claude-3-haiku", "claude-3-sonnet", "public-pool"]'),
('ai-claude-basic-002', 'Claude基础账号2', 'anthropic', 'api_key', 'sk-ant-encrypted_basic_key_002', 'basic', 50, 100000, 3, true, 91, 40.00, 'Claude基础级别账号，支持Haiku和Sonnet', '["claude-3-haiku", "claude-3-sonnet", "public-pool"]'),

-- 标准级别账号（拼车专用）
('ai-claude-std-001', 'Claude标准账号1', 'anthropic', 'api_key', 'sk-ant-encrypted_std_key_001', 'standard', 100, 200000, 5, false, 97, 100.00, 'Claude标准级别专属账号，支持全系列模型', '["claude-3-haiku", "claude-3-sonnet", "claude-3.5-sonnet", "dedicated"]'),
('ai-claude-std-002', 'Claude标准账号2', 'anthropic', 'api_key', 'sk-ant-encrypted_std_key_002', 'standard', 100, 200000, 5, false, 95, 100.00, 'Claude标准级别专属账号，支持全系列模型', '["claude-3-haiku", "claude-3-sonnet", "claude-3.5-sonnet", "dedicated"]'),

-- 高级账号（企业专用）
('ai-claude-premium-001', 'Claude高级账号1', 'anthropic', 'api_key', 'sk-ant-encrypted_premium_key_001', 'premium', 200, 400000, 8, false, 99, 300.00, 'Claude高级账号，企业级服务', '["claude-3-haiku", "claude-3-sonnet", "claude-3.5-sonnet", "claude-3-opus", "enterprise"]');

-- Google Gemini账号池
INSERT OR REPLACE INTO ai_accounts (id, account_name, provider, account_type, credentials, tier, max_requests_per_minute, max_tokens_per_minute, max_concurrent_requests, is_shared, health_score, monthly_cost, description, tags) VALUES
-- 基础级别账号（公共池）
('ai-gemini-basic-001', 'Gemini基础账号1', 'google', 'api_key', 'AIza-encrypted_basic_key_001', 'basic', 60, 120000, 3, true, 90, 30.00, 'Gemini基础级别账号', '["gemini-pro", "public-pool"]'),
('ai-gemini-basic-002', 'Gemini基础账号2', 'google', 'api_key', 'AIza-encrypted_basic_key_002', 'basic', 60, 120000, 3, true, 87, 30.00, 'Gemini基础级别账号', '["gemini-pro", "public-pool"]'),

-- 标准级别账号（拼车专用）
('ai-gemini-std-001', 'Gemini标准账号1', 'google', 'api_key', 'AIza-encrypted_std_key_001', 'standard', 120, 250000, 5, false, 94, 80.00, 'Gemini标准级别专属账号', '["gemini-pro", "gemini-ultra", "dedicated"]');

-- ============================================================================
-- 配置套餐账号配额
-- ============================================================================

-- 免费套餐：只能使用基础账号，公共池
INSERT OR REPLACE INTO plan_account_quotas (plan_id, provider, tier, max_bindings, can_bind_dedicated, priority_level) VALUES
('free', 'openai', 'basic', 0, false, 10),
('free', 'anthropic', 'basic', 0, false, 10),
('free', 'google', 'basic', 0, false, 10);

-- 基础套餐：只能使用基础账号，公共池
INSERT OR REPLACE INTO plan_account_quotas (plan_id, provider, tier, max_bindings, can_bind_dedicated, priority_level) VALUES
('basic', 'openai', 'basic', 0, false, 8),
('basic', 'anthropic', 'basic', 0, false, 8),
('basic', 'google', 'basic', 0, false, 8);

-- 标准套餐：可以使用标准账号，公共池优先
INSERT OR REPLACE INTO plan_account_quotas (plan_id, provider, tier, max_bindings, can_bind_dedicated, priority_level) VALUES
('standard', 'openai', 'basic', 0, false, 5),
('standard', 'openai', 'standard', 0, false, 6),
('standard', 'anthropic', 'basic', 0, false, 5),
('standard', 'anthropic', 'standard', 0, false, 6),
('standard', 'google', 'basic', 0, false, 5),
('standard', 'google', 'standard', 0, false, 6);

-- 专业套餐：可以使用高级账号，公共池高优先级
INSERT OR REPLACE INTO plan_account_quotas (plan_id, provider, tier, max_bindings, can_bind_dedicated, priority_level) VALUES
('pro', 'openai', 'basic', 0, false, 2),
('pro', 'openai', 'standard', 0, false, 3),
('pro', 'openai', 'premium', 0, false, 4),
('pro', 'anthropic', 'basic', 0, false, 2),
('pro', 'anthropic', 'standard', 0, false, 3),
('pro', 'anthropic', 'premium', 0, false, 4),
('pro', 'google', 'basic', 0, false, 2),
('pro', 'google', 'standard', 0, false, 3);

-- 拼车套餐：可以绑定专属标准账号
INSERT OR REPLACE INTO plan_account_quotas (plan_id, provider, tier, max_bindings, can_bind_dedicated, priority_level) VALUES
('shared', 'openai', 'standard', 1, true, 1),
('shared', 'anthropic', 'standard', 1, true, 1),
('shared', 'google', 'standard', 1, true, 1);

-- ============================================================================
-- 创建示例用户账号绑定（拼车套餐用户专属账号）
-- ============================================================================

-- 为演示用户创建专属账号绑定（假设有拼车套餐用户）
INSERT OR REPLACE INTO user_account_bindings (
  id, user_id, ai_account_id, plan_id, binding_type, priority_level,
  binding_status, max_requests_per_hour, max_tokens_per_hour,
  starts_at, expires_at
) VALUES
-- 演示用户1绑定Claude标准账号（如果他有拼车套餐）
('binding-001', 'demo-user-001', 'ai-claude-std-001', 'shared', 'dedicated', 1, 'active',
  1000, 50000, datetime('now', '-1 days'), datetime('now', '+29 days')),

-- 演示用户2绑定OpenAI标准账号（如果他有拼车套餐）  
('binding-002', 'demo-user-002', 'ai-openai-std-001', 'shared', 'dedicated', 1, 'active',
  1500, 80000, datetime('now', '-5 days'), datetime('now', '+25 days'));

-- ============================================================================
-- 创建示例使用记录
-- ============================================================================

-- 一些使用记录示例
INSERT OR REPLACE INTO account_usage_logs (
  id, ai_account_id, user_id, binding_id, provider, model, input_tokens, output_tokens, total_tokens,
  status_code, response_time_ms, success, cost
) VALUES
-- 专属账号使用记录
('usage-001', 'ai-claude-std-001', 'demo-user-001', 'binding-001', 'anthropic', 'claude-3-sonnet', 
  1500, 800, 2300, 200, 1250, true, 0.0125),
('usage-002', 'ai-openai-std-001', 'demo-user-002', 'binding-002', 'openai', 'gpt-4',
  2000, 1200, 3200, 200, 2100, true, 0.096),

-- 公共池使用记录
('usage-003', 'ai-claude-basic-001', 'demo-user-001', NULL, 'anthropic', 'claude-3-haiku',
  800, 400, 1200, 200, 980, true, 0.0008),
('usage-004', 'ai-openai-basic-001', 'demo-user-002', NULL, 'openai', 'gpt-3.5-turbo',
  1000, 600, 1600, 200, 750, true, 0.0024);

-- ============================================================================
-- 创建健康检查记录
-- ============================================================================

INSERT OR REPLACE INTO account_health_checks (
  id, ai_account_id, check_type, check_status, response_time_ms, status_message, check_details
) VALUES
-- OpenAI账号健康检查
('health-001', 'ai-openai-basic-001', 'ping', 'success', 150, 'API响应正常', '{"quota_remaining": 50000, "rate_limit_remaining": 58}'),
('health-002', 'ai-openai-std-001', 'quota', 'success', 200, '配额充足', '{"quota_used": 12000, "quota_limit": 100000}'),

-- Claude账号健康检查
('health-003', 'ai-claude-basic-001', 'ping', 'success', 180, 'API响应正常', '{"status": "healthy", "latency": "normal"}'),
('health-004', 'ai-claude-std-001', 'rate_limit', 'success', 120, '速率限制正常', '{"requests_per_minute": 45, "limit": 100}');

-- ============================================================================
-- 更新现有套餐数据，为拼车套餐添加标记
-- ============================================================================

-- 更新拼车套餐的features，明确标识专属账号特性
UPDATE plans SET 
  features = '["绑定专属AI账号", "Claude-3-Haiku + Sonnet", "专属API密钥", "稳定服务保障", "优先技术支持", "适合团队协作"]',
  description = '拼车专享：每位用户独享专属AI账号，稳定可靠'
WHERE id = 'shared';

-- 为其他套餐添加公共池说明
UPDATE plans SET 
  description = CASE 
    WHEN id = 'free' THEN '免费体验：使用公共AI账号池，适合轻度测试'
    WHEN id = 'basic' THEN '基础版：使用公共AI账号池，适合个人开发者'
    WHEN id = 'standard' THEN '标准版：优先使用高质量公共账号，适合中小企业'
    WHEN id = 'pro' THEN '专业版：最高优先级使用公共账号池，适合大型企业'
    ELSE description
  END
WHERE id IN ('free', 'basic', 'standard', 'pro');