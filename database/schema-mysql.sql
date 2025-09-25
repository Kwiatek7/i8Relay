-- i8Relay MySQL数据库架构设计
-- 创建时间: 2025-09-24
-- 基于 SQLite 版本转换

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================================
-- 用户相关表
-- ============================================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` TEXT NOT NULL,
  `salt` VARCHAR(255) NOT NULL,
  `user_role` ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
  `user_status` ENUM('active', 'inactive', 'banned', 'pending') DEFAULT 'active',

  -- 套餐相关
  `current_plan_id` VARCHAR(32),
  `plan_expires_at` DATETIME,

  -- 账户信息
  `balance` DECIMAL(10,4) DEFAULT 0.0000,
  `api_key` VARCHAR(255) UNIQUE,

  -- 个人信息
  `avatar` TEXT,
  `phone` VARCHAR(20),
  `company` VARCHAR(255),

  -- 统计信息
  `total_requests` INT DEFAULT 0,
  `total_tokens` INT DEFAULT 0,
  `total_cost` DECIMAL(10,4) DEFAULT 0.0000,

  -- 邮箱验证
  `email_verified` BOOLEAN DEFAULT FALSE,
  `email_verified_at` DATETIME,

  -- 时间戳
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` DATETIME,

  CONSTRAINT `fk_users_current_plan` FOREIGN KEY (`current_plan_id`) REFERENCES `plans`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户会话表 (JWT token管理)
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `token_hash` TEXT NOT NULL,
  `refresh_token_hash` TEXT,
  `device_info` TEXT,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_token_hash` (`token_hash`(255)),
  UNIQUE KEY `uk_refresh_token_hash` (`refresh_token_hash`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API密钥表
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `key_name` VARCHAR(255) NOT NULL,
  `key_hash` TEXT NOT NULL,
  `key_preview` VARCHAR(255) NOT NULL, -- 显示用的前缀，如 sk-abc***
  `permissions` JSON DEFAULT ('["read","write"]'), -- JSON数组
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_used_at` DATETIME,
  `expires_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_api_keys_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_key_hash` (`key_hash`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 套餐相关表
-- ============================================================================

-- 套餐分组表
CREATE TABLE IF NOT EXISTS `plan_categories` (
  `id` VARCHAR(32) PRIMARY KEY,
  `category_name` VARCHAR(100) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(50), -- 分组图标
  `color` VARCHAR(7) DEFAULT '#3b82f6', -- 分组主题色

  -- 显示配置
  `sort_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_featured` BOOLEAN DEFAULT FALSE, -- 是否为特色分组

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 套餐计划表
CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(32) PRIMARY KEY,
  `plan_name` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'CNY',
  `duration_days` INT NOT NULL,

  -- 限制配置
  `requests_limit` INT DEFAULT 10000, -- -1表示无限制
  `tokens_limit` INT DEFAULT 100000,  -- -1表示无限制
  `models` JSON DEFAULT ('["gpt-3.5-turbo"]'), -- JSON数组，支持的模型

  -- 功能特性
  `features` JSON NOT NULL, -- JSON数组，功能列表
  `billing_period` ENUM('monthly', 'yearly', 'one_time') DEFAULT 'monthly',
  `priority_support` BOOLEAN DEFAULT FALSE,
  `is_popular` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,

  -- 套餐分组
  `category_id` VARCHAR(32),

  -- 显示顺序
  `sort_order` INT DEFAULT 0,

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户订阅历史表
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `plan_id` VARCHAR(32) NOT NULL,
  `status` ENUM('pending', 'active', 'expired', 'cancelled') DEFAULT 'active',

  -- 订阅时间
  `starts_at` DATETIME NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `cancelled_at` DATETIME,

  -- 价格信息（记录历史价格）
  `price` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'CNY',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_user_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 计费相关表
-- ============================================================================

-- 账单记录表
CREATE TABLE IF NOT EXISTS `billing_records` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `record_type` ENUM('charge', 'usage', 'refund', 'subscription', 'topup') NOT NULL,
  `amount` DECIMAL(10,4) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'CNY',
  `description` TEXT NOT NULL,
  `record_status` ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',

  -- 支付相关
  `payment_method` VARCHAR(50), -- alipay, wechat, stripe等
  `payment_id` VARCHAR(255),     -- 第三方支付订单号

  -- 关联信息
  `subscription_id` VARCHAR(32),
  `reference_id` VARCHAR(32),   -- 关联的其他记录ID

  -- 元数据
  `metadata` JSON,       -- JSON格式的额外信息

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_billing_records_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_billing_records_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `user_subscriptions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 使用统计相关表
-- ============================================================================

-- API使用日志表
CREATE TABLE IF NOT EXISTS `usage_logs` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `api_key_id` VARCHAR(32),

  -- 请求信息
  `request_id` VARCHAR(255),
  `request_method` VARCHAR(10) NOT NULL,
  `endpoint` VARCHAR(500) NOT NULL,
  `model` VARCHAR(100) NOT NULL,

  -- Token使用
  `input_tokens` INT DEFAULT 0,
  `output_tokens` INT DEFAULT 0,
  `cache_creation_tokens` INT DEFAULT 0,
  `cache_read_tokens` INT DEFAULT 0,
  `total_tokens` INT DEFAULT 0,

  -- 响应信息
  `status_code` INT NOT NULL,
  `response_time_ms` INT,

  -- 费用
  `cost` DECIMAL(10,6) DEFAULT 0.000000,

  -- 请求元数据
  `user_agent` TEXT,
  `ip_address` VARCHAR(45),
  `request_body_size` INT,
  `response_body_size` INT,

  -- 错误信息
  `error_code` VARCHAR(50),
  `error_message` TEXT,

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT `fk_usage_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usage_logs_api_key` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 每日使用汇总表
CREATE TABLE IF NOT EXISTS `daily_usage_summaries` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `record_date` DATE NOT NULL,

  -- 统计数据
  `total_requests` INT DEFAULT 0,
  `successful_requests` INT DEFAULT 0,
  `failed_requests` INT DEFAULT 0,

  -- Token统计
  `total_tokens` INT DEFAULT 0,
  `input_tokens` INT DEFAULT 0,
  `output_tokens` INT DEFAULT 0,
  `cache_creation_tokens` INT DEFAULT 0,
  `cache_read_tokens` INT DEFAULT 0,

  -- 费用统计
  `total_cost` DECIMAL(10,6) DEFAULT 0.000000,

  -- 性能统计
  `avg_response_time_ms` INT DEFAULT 0,

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_daily_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_date` (`user_id`, `record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 模型使用统计表
CREATE TABLE IF NOT EXISTS `model_usage_stats` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `record_date` DATE NOT NULL,

  `requests` INT DEFAULT 0,
  `tokens` INT DEFAULT 0,
  `cost` DECIMAL(10,6) DEFAULT 0.000000,

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_model_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_model_date` (`user_id`, `model`, `record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 系统配置相关表
-- ============================================================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS `system_config` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `category` VARCHAR(100) NOT NULL,
  `config_key` VARCHAR(100) NOT NULL,
  `config_value` TEXT NOT NULL,
  `data_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `description` TEXT,
  `is_public` BOOLEAN DEFAULT FALSE, -- 是否可以公开读取
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_category_key` (`category`, `config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 网站配置表（用于前台网站配置）
CREATE TABLE IF NOT EXISTS `site_config` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `site_name` VARCHAR(255) DEFAULT 'i8Relay',
  `site_description` TEXT DEFAULT 'AI API中转服务',
  `site_logo` TEXT,
  `site_favicon` TEXT,

  -- 联系信息
  `contact_email` VARCHAR(255),
  `contact_phone` VARCHAR(20),
  `contact_wechat` VARCHAR(255),
  `contact_address` TEXT,

  -- SEO配置
  `seo_title` VARCHAR(255),
  `seo_description` TEXT,
  `seo_keywords` TEXT,

  -- 主题配置
  `theme_primary_color` VARCHAR(7) DEFAULT '#3b82f6',
  `theme_secondary_color` VARCHAR(7) DEFAULT '#8b5cf6',

  -- 功能开关
  `enable_registration` BOOLEAN DEFAULT TRUE,
  `enable_payment` BOOLEAN DEFAULT TRUE,
  `enable_api_docs` BOOLEAN DEFAULT TRUE,

  -- 自定义页面内容
  `homepage_hero_title` VARCHAR(500),
  `homepage_hero_subtitle` TEXT,
  `homepage_features` JSON, -- JSON格式

  -- 脚注信息
  `footer_text` TEXT,
  `footer_links` JSON, -- JSON格式

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 管理相关表
-- ============================================================================

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `admin_user_id` VARCHAR(32) NOT NULL,
  `admin_action` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(50) NOT NULL, -- 资源类型：user, plan, config等
  `resource_id` VARCHAR(32),            -- 资源ID
  `old_values` JSON,             -- JSON格式的旧值
  `new_values` JSON,             -- JSON格式的新值
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT `fk_admin_logs_user` FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统通知表
CREATE TABLE IF NOT EXISTS `system_notifications` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `title` VARCHAR(500) NOT NULL,
  `content` TEXT NOT NULL,
  `notification_type` ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
  `target_type` ENUM('all', 'users', 'admins', 'specific') DEFAULT 'all',
  `target_users` JSON, -- JSON数组，当target_type为specific时使用

  `is_active` BOOLEAN DEFAULT TRUE,
  `starts_at` DATETIME,
  `expires_at` DATETIME,

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户通知表
CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `notification_message` TEXT NOT NULL,
  `notification_type` ENUM('system', 'billing', 'security', 'info', 'warning', 'success') DEFAULT 'info',
  `notification_priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `is_read` BOOLEAN DEFAULT FALSE,
  `action_url` TEXT,
  `metadata` JSON, -- JSON格式的额外信息
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 通知模板表
CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `template_name` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(500) NOT NULL,
  `template_message` TEXT NOT NULL,
  `template_type` ENUM('system', 'billing', 'security', 'info', 'warning', 'success') DEFAULT 'info',
  `template_priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `action_url` TEXT,
  `variables` TEXT, -- JSON格式，可用变量说明
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 通知规则表
CREATE TABLE IF NOT EXISTS `notification_rules` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `rule_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `rule_type` VARCHAR(100) NOT NULL, -- balance_low, subscription_expiring, usage_limit, payment_failed等
  `trigger_condition` TEXT NOT NULL, -- JSON格式存储触发条件
  `template_id` VARCHAR(32) NOT NULL,
  `target_scope` ENUM('all_users', 'specific_users', 'user_roles') DEFAULT 'all_users',
  `target_users` TEXT, -- JSON格式存储目标用户ID或角色
  `is_enabled` BOOLEAN DEFAULT TRUE,
  `cooldown_minutes` INT DEFAULT 60, -- 冷却时间，避免重复发送
  `created_by` VARCHAR(32) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notification_rules_template` FOREIGN KEY (`template_id`) REFERENCES `notification_templates`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_rules_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 规则执行日志表
CREATE TABLE IF NOT EXISTS `notification_rule_logs` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `rule_id` VARCHAR(32) NOT NULL,
  `trigger_data` TEXT, -- JSON格式，触发时的数据
  `executed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `notifications_sent` INT DEFAULT 0,
  `target_users` TEXT, -- JSON格式，实际发送的用户列表
  `success` BOOLEAN DEFAULT TRUE,
  `error_message` TEXT,
  CONSTRAINT `fk_notification_rule_logs_rule` FOREIGN KEY (`rule_id`) REFERENCES `notification_rules`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 索引创建
-- ============================================================================

-- 用户表索引
CREATE INDEX `idx_users_email` ON `users`(`email`);
CREATE INDEX `idx_users_api_key` ON `users`(`api_key`);
CREATE INDEX `idx_users_status` ON `users`(`user_status`);
CREATE INDEX `idx_users_created_at` ON `users`(`created_at`);

-- 会话表索引
CREATE INDEX `idx_user_sessions_user_id` ON `user_sessions`(`user_id`);
CREATE INDEX `idx_user_sessions_expires_at` ON `user_sessions`(`expires_at`);

-- API密钥表索引
CREATE INDEX `idx_api_keys_user_id` ON `api_keys`(`user_id`);
CREATE INDEX `idx_api_keys_active` ON `api_keys`(`is_active`);

-- 套餐分组表索引
CREATE INDEX `idx_plan_categories_sort_order` ON `plan_categories`(`sort_order`);
CREATE INDEX `idx_plan_categories_active` ON `plan_categories`(`is_active`);
CREATE INDEX `idx_plan_categories_featured` ON `plan_categories`(`is_featured`);

-- 套餐表索引
CREATE INDEX `idx_plans_category_id` ON `plans`(`category_id`);
CREATE INDEX `idx_plans_active` ON `plans`(`is_active`);
CREATE INDEX `idx_plans_sort_order` ON `plans`(`sort_order`);

-- 订阅表索引
CREATE INDEX `idx_user_subscriptions_user_id` ON `user_subscriptions`(`user_id`);
CREATE INDEX `idx_user_subscriptions_plan_id` ON `user_subscriptions`(`plan_id`);
CREATE INDEX `idx_user_subscriptions_status` ON `user_subscriptions`(`status`);
CREATE INDEX `idx_user_subscriptions_expires_at` ON `user_subscriptions`(`expires_at`);

-- 账单表索引
CREATE INDEX `idx_billing_records_user_id` ON `billing_records`(`user_id`);
CREATE INDEX `idx_billing_records_type` ON `billing_records`(`record_type`);
CREATE INDEX `idx_billing_records_status` ON `billing_records`(`record_status`);
CREATE INDEX `idx_billing_records_created_at` ON `billing_records`(`created_at`);

-- 使用日志表索引
CREATE INDEX `idx_usage_logs_user_id` ON `usage_logs`(`user_id`);
CREATE INDEX `idx_usage_logs_api_key_id` ON `usage_logs`(`api_key_id`);
CREATE INDEX `idx_usage_logs_model` ON `usage_logs`(`model`);
CREATE INDEX `idx_usage_logs_created_at` ON `usage_logs`(`created_at`);
CREATE INDEX `idx_usage_logs_status_code` ON `usage_logs`(`status_code`);

-- 日汇总表索引
CREATE INDEX `idx_daily_usage_date` ON `daily_usage_summaries`(`record_date`);

-- 模型统计表索引
CREATE INDEX `idx_model_usage_model` ON `model_usage_stats`(`model`);

-- 系统配置索引
CREATE INDEX `idx_system_config_category` ON `system_config`(`category`);
CREATE INDEX `idx_system_config_key` ON `system_config`(`config_key`);

-- 管理日志索引
CREATE INDEX `idx_admin_logs_admin_user_id` ON `admin_logs`(`admin_user_id`);
CREATE INDEX `idx_admin_logs_action` ON `admin_logs`(`admin_action`);
CREATE INDEX `idx_admin_logs_created_at` ON `admin_logs`(`created_at`);

-- 通知模板表索引
CREATE INDEX `idx_notification_templates_name` ON `notification_templates`(`template_name`);
CREATE INDEX `idx_notification_templates_type` ON `notification_templates`(`template_type`);

-- 通知规则表索引
CREATE INDEX `idx_notification_rules_type` ON `notification_rules`(`rule_type`);
CREATE INDEX `idx_notification_rules_enabled` ON `notification_rules`(`is_enabled`);
CREATE INDEX `idx_notification_rules_template_id` ON `notification_rules`(`template_id`);
CREATE INDEX `idx_notification_rules_creator` ON `notification_rules`(`created_by`);

-- 通知规则日志表索引
CREATE INDEX `idx_notification_rule_logs_rule_id` ON `notification_rule_logs`(`rule_id`);
CREATE INDEX `idx_notification_rule_logs_executed_at` ON `notification_rule_logs`(`executed_at`);

-- ============================================================================
-- AI账号管理相关表 (新增)
-- ============================================================================

-- AI账号表
CREATE TABLE IF NOT EXISTS `ai_accounts` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `account_name` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `account_type` VARCHAR(50) NOT NULL,
  `credentials` TEXT NOT NULL COMMENT '加密存储的凭据',
  `credentials_hash` VARCHAR(64) COMMENT '凭据哈希用于验证',
  `key_preview` VARCHAR(50) COMMENT '脱敏的密钥预览',

  -- 账号配置
  `tier` ENUM('basic', 'standard', 'premium', 'enterprise') DEFAULT 'basic',
  `max_requests_per_minute` INT DEFAULT 60,
  `max_tokens_per_minute` INT DEFAULT 100000,
  `max_concurrent_requests` INT DEFAULT 3,
  `account_status` ENUM('active', 'inactive', 'maintenance', 'banned', 'expired') DEFAULT 'active',
  `is_shared` BOOLEAN DEFAULT TRUE COMMENT '是否为共享账号',

  -- 使用统计
  `total_requests` INT DEFAULT 0,
  `total_tokens` INT DEFAULT 0,
  `last_used_at` DATETIME,

  -- 健康状态
  `health_score` DECIMAL(3,2) DEFAULT 1.00 COMMENT '健康评分 0.00-1.00',
  `error_count_24h` INT DEFAULT 0 COMMENT '24小时内错误次数',
  `last_error_at` DATETIME,
  `last_health_check_at` DATETIME,

  -- 成本管理
  `monthly_cost` DECIMAL(10,4) DEFAULT 0.0000,
  `cost_currency` VARCHAR(3) DEFAULT 'USD',
  `description` TEXT,
  `tags` JSON,

  -- 时间戳
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_ai_accounts_provider` (`provider`),
  INDEX `idx_ai_accounts_tier` (`tier`),
  INDEX `idx_ai_accounts_status` (`account_status`),
  INDEX `idx_ai_accounts_shared` (`is_shared`),
  INDEX `idx_ai_accounts_health` (`health_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户账号绑定表
CREATE TABLE IF NOT EXISTS `user_account_bindings` (
  `id` VARCHAR(32) PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
  `user_id` VARCHAR(32) NOT NULL,
  `ai_account_id` VARCHAR(32) NOT NULL,
  `plan_id` VARCHAR(32) NOT NULL,

  -- 绑定配置
  `binding_type` ENUM('dedicated', 'priority', 'shared') DEFAULT 'shared',
  `priority_level` INT DEFAULT 1 COMMENT '优先级 1-10',
  `binding_status` ENUM('active', 'inactive', 'expired', 'suspended') DEFAULT 'active',

  -- 使用限制
  `max_requests_per_hour` INT COMMENT '每小时最大请求数',
  `max_tokens_per_hour` INT COMMENT '每小时最大token数',

  -- 时间范围
  `starts_at` DATETIME NOT NULL,
  `expires_at` DATETIME COMMENT '过期时间，NULL表示永不过期',
  `last_used_at` DATETIME,

  -- 使用统计
  `total_requests` INT DEFAULT 0,
  `total_tokens` INT DEFAULT 0,
  `total_cost` DECIMAL(10,4) DEFAULT 0.0000,

  -- 时间戳
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 外键约束
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`ai_account_id`) REFERENCES `ai_accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT,

  -- 索引
  INDEX `idx_user_bindings_user` (`user_id`),
  INDEX `idx_user_bindings_account` (`ai_account_id`),
  INDEX `idx_user_bindings_plan` (`plan_id`),
  INDEX `idx_user_bindings_status` (`binding_status`),
  INDEX `idx_user_bindings_type` (`binding_type`),
  INDEX `idx_user_bindings_expires` (`expires_at`),

  -- 唯一约束：同一用户不能多次绑定同一AI账号
  UNIQUE KEY `uk_user_account_binding` (`user_id`, `ai_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;