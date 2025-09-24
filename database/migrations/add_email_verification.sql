-- 邮箱验证功能数据库迁移
-- 创建时间: 2025-09-24

-- ============================================================================
-- 1. 为用户表添加邮箱验证状态字段
-- ============================================================================

-- 添加邮箱验证相关字段到用户表
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN email_verified_at DATETIME;

-- ============================================================================
-- 2. 创建邮箱验证令牌表
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  
  -- 验证类型
  type TEXT DEFAULT 'email_verification' CHECK (type IN ('email_verification', 'email_change')),
  
  -- 状态
  is_used BOOLEAN DEFAULT false,
  used_at DATETIME,
  
  -- 过期时间 (默认24小时后过期)
  expires_at DATETIME NOT NULL,
  
  -- 重试计数
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- IP和设备信息
  ip_address TEXT,
  user_agent TEXT,
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. 系统配置表添加邮箱验证相关配置
-- ============================================================================

-- 插入邮箱验证系统配置
INSERT OR REPLACE INTO system_config (category, key, value, data_type, description, is_public) VALUES
('email_verification', 'enable_email_verification', 'false', 'boolean', '是否启用邮箱验证功能', true),
('email_verification', 'require_verification_for_registration', 'false', 'boolean', '注册时是否强制邮箱验证', true),
('email_verification', 'verification_token_expires_hours', '24', 'number', '验证令牌过期时间（小时）', false),
('email_verification', 'max_verification_attempts', '3', 'number', '最大验证尝试次数', false),
('email_verification', 'resend_cooldown_minutes', '5', 'number', '重新发送验证邮件冷却时间（分钟）', false),
('email_verification', 'verification_email_subject', '请验证您的邮箱地址', 'string', '验证邮件主题', false),
('email_verification', 'block_unverified_users', 'false', 'boolean', '是否阻止未验证用户使用服务', true);

-- ============================================================================
-- 4. 创建索引以优化查询性能
-- ============================================================================

-- 邮箱验证令牌表索引
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON email_verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_type ON email_verification_tokens(type);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_created_at ON email_verification_tokens(created_at);

-- 用户表邮箱验证状态索引
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);

-- ============================================================================
-- 5. 创建触发器来自动更新时间戳
-- ============================================================================

-- 邮箱验证令牌表的更新时间触发器
CREATE TRIGGER IF NOT EXISTS update_email_verification_tokens_updated_at
  AFTER UPDATE ON email_verification_tokens
  FOR EACH ROW
BEGIN
  UPDATE email_verification_tokens 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- ============================================================================
-- 6. 数据迁移：为现有用户设置默认值
-- ============================================================================

-- 将所有现有用户的邮箱验证状态设置为未验证
UPDATE users 
SET email_verified = false 
WHERE email_verified IS NULL;

-- 如果有管理员用户，可以设置为已验证（可选）
-- UPDATE users 
-- SET email_verified = true, email_verified_at = CURRENT_TIMESTAMP 
-- WHERE role IN ('admin', 'super_admin');