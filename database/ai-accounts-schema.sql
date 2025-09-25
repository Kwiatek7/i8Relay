-- AI账号管理系统表结构
-- 用于实现基于套餐的分级账号分配

-- ============================================================================
-- AI账号池表 - 存储各种AI服务的账号信息
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- 基本信息
  account_name TEXT NOT NULL,          -- 账号名称（便于管理识别）
  provider TEXT NOT NULL,              -- AI服务商：openai, anthropic, google等
  account_type TEXT NOT NULL,          -- 账号类型：api_key, session_token等
  credentials TEXT NOT NULL,           -- 加密存储的账号凭据（API Key等）
  
  -- 分级信息
  tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'standard', 'premium', 'enterprise')),
  max_requests_per_minute INTEGER DEFAULT 60,      -- 每分钟最大请求数
  max_tokens_per_minute INTEGER DEFAULT 100000,    -- 每分钟最大Token数
  max_concurrent_requests INTEGER DEFAULT 5,       -- 最大并发请求数
  
  -- 状态管理
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'maintenance', 'banned', 'expired')),
  is_shared BOOLEAN DEFAULT true,                  -- 是否为共享账号（false表示专属账号）
  
  -- 使用统计
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  last_used_at DATETIME,
  
  -- 健康状态
  health_score INTEGER DEFAULT 100,               -- 健康分数 0-100
  error_count_24h INTEGER DEFAULT 0,              -- 24小时内错误次数
  last_error_at DATETIME,                         -- 最后错误时间
  last_health_check_at DATETIME,                  -- 最后健康检查时间
  
  -- 成本信息
  monthly_cost DECIMAL(10,2) DEFAULT 0.00,        -- 月度成本
  cost_currency TEXT DEFAULT 'USD',
  
  -- 备注信息
  description TEXT,                                -- 账号描述
  tags TEXT,                                       -- 标签，JSON数组格式
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 确保账号名称在同一服务商下唯一
  UNIQUE(provider, account_name)
);

-- ============================================================================
-- 用户账号绑定表 - 管理拼车套餐用户的专属账号绑定
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_account_bindings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- 绑定关系
  user_id TEXT NOT NULL,
  ai_account_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,                           -- 绑定时的套餐ID
  
  -- 绑定配置
  binding_type TEXT DEFAULT 'dedicated' CHECK (binding_type IN ('dedicated', 'priority', 'shared')),
  priority_level INTEGER DEFAULT 1,               -- 优先级（数字越小优先级越高）
  
  -- 状态管理
  binding_status TEXT DEFAULT 'active' CHECK (binding_status IN ('active', 'inactive', 'expired', 'suspended')),
  
  -- 使用限制
  max_requests_per_hour INTEGER,                   -- 每小时最大请求数（可覆盖账号默认限制）
  max_tokens_per_hour INTEGER,                     -- 每小时最大Token数
  
  -- 时间管理
  starts_at DATETIME NOT NULL,                     -- 绑定开始时间
  expires_at DATETIME,                             -- 绑定过期时间（NULL表示永不过期）
  last_used_at DATETIME,                           -- 最后使用时间
  
  -- 使用统计
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.0000,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_account_id) REFERENCES ai_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  
  -- 确保用户在同一AI服务商下只能绑定一个账号
  UNIQUE(user_id, ai_account_id)
);

-- ============================================================================
-- 账号使用记录表 - 详细记录AI账号的使用情况
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_usage_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- 基本信息
  ai_account_id TEXT NOT NULL,
  user_id TEXT,                                    -- NULL表示系统内部使用
  binding_id TEXT,                                 -- 关联的绑定记录，NULL表示公共池使用
  
  -- 请求信息
  request_id TEXT,                                 -- 关联的API请求ID
  provider TEXT NOT NULL,                          -- AI服务商
  model TEXT NOT NULL,                             -- 使用的模型
  endpoint TEXT,                                   -- API端点
  
  -- Token使用
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- 响应信息
  status_code INTEGER,                             -- HTTP状态码
  response_time_ms INTEGER,                        -- 响应时间（毫秒）
  success BOOLEAN DEFAULT true,                    -- 是否成功
  
  -- 成本信息
  cost DECIMAL(10,6) DEFAULT 0.000000,
  cost_currency TEXT DEFAULT 'USD',
  
  -- 错误信息
  error_type TEXT,                                 -- 错误类型
  error_message TEXT,                              -- 错误信息
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ai_account_id) REFERENCES ai_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (binding_id) REFERENCES user_account_bindings(id) ON DELETE SET NULL
);

-- ============================================================================
-- 账号健康监控表 - 定期监控AI账号的健康状态
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_health_checks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  ai_account_id TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('ping', 'quota', 'balance', 'rate_limit')),
  
  -- 检查结果
  check_status TEXT NOT NULL CHECK (check_status IN ('success', 'warning', 'error', 'timeout')),
  response_time_ms INTEGER,
  status_message TEXT,
  
  -- 详细信息
  check_details TEXT,                              -- JSON格式存储详细检查结果
  
  -- 时间戳
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ai_account_id) REFERENCES ai_accounts(id) ON DELETE CASCADE
);

-- ============================================================================
-- 套餐账号配额表 - 定义不同套餐可以绑定的账号数量和类型
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan_account_quotas (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  plan_id TEXT NOT NULL,
  provider TEXT NOT NULL,                          -- AI服务商
  tier TEXT NOT NULL,                              -- 账号等级
  
  -- 配额配置
  max_bindings INTEGER DEFAULT 1,                  -- 最大绑定账号数
  can_bind_dedicated BOOLEAN DEFAULT false,        -- 是否可以绑定专属账号
  priority_level INTEGER DEFAULT 5,                -- 账号分配优先级
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  
  -- 确保每个套餐在同一服务商和等级下只有一条配额记录
  UNIQUE(plan_id, provider, tier)
);

-- ============================================================================
-- 索引创建
-- ============================================================================

-- AI账号表索引
CREATE INDEX IF NOT EXISTS idx_ai_accounts_provider ON ai_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_tier ON ai_accounts(tier);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_status ON ai_accounts(account_status);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_shared ON ai_accounts(is_shared);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_health ON ai_accounts(health_score);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_last_used ON ai_accounts(last_used_at);

-- 用户账号绑定表索引
CREATE INDEX IF NOT EXISTS idx_user_bindings_user_id ON user_account_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bindings_account_id ON user_account_bindings(ai_account_id);
CREATE INDEX IF NOT EXISTS idx_user_bindings_plan_id ON user_account_bindings(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_bindings_status ON user_account_bindings(binding_status);
CREATE INDEX IF NOT EXISTS idx_user_bindings_expires ON user_account_bindings(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_bindings_priority ON user_account_bindings(priority_level);

-- 账号使用记录表索引
CREATE INDEX IF NOT EXISTS idx_account_usage_account_id ON account_usage_logs(ai_account_id);
CREATE INDEX IF NOT EXISTS idx_account_usage_user_id ON account_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_account_usage_binding_id ON account_usage_logs(binding_id);
CREATE INDEX IF NOT EXISTS idx_account_usage_provider ON account_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_account_usage_created_at ON account_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_account_usage_success ON account_usage_logs(success);

-- 健康检查表索引
CREATE INDEX IF NOT EXISTS idx_health_checks_account_id ON account_health_checks(ai_account_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_type ON account_health_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON account_health_checks(check_status);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON account_health_checks(checked_at);

-- 套餐配额表索引
CREATE INDEX IF NOT EXISTS idx_plan_quotas_plan_id ON plan_account_quotas(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_quotas_provider ON plan_account_quotas(provider);
CREATE INDEX IF NOT EXISTS idx_plan_quotas_tier ON plan_account_quotas(tier);