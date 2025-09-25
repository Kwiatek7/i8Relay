-- 通知规则系统数据库表

-- 通知模板表
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  template_name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  template_message TEXT NOT NULL,
  template_type TEXT DEFAULT 'info' CHECK (template_type IN ('system', 'billing', 'security', 'info', 'warning', 'success')),
  template_priority TEXT DEFAULT 'medium' CHECK (template_priority IN ('low', 'medium', 'high')),
  action_url TEXT,
  variables TEXT, -- JSON格式，可用变量说明
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知规则表
CREATE TABLE IF NOT EXISTS notification_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  rule_name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- balance_low, subscription_expiring, usage_limit, payment_failed等
  trigger_condition TEXT NOT NULL, -- JSON格式存储触发条件
  template_id TEXT NOT NULL,
  target_scope TEXT DEFAULT 'all_users' CHECK (target_scope IN ('all_users', 'specific_users', 'user_roles')),
  target_users TEXT, -- JSON格式存储目标用户ID或角色
  is_enabled BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 60, -- 冷却时间，避免重复发送
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 规则执行日志表
CREATE TABLE IF NOT EXISTS notification_rule_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  rule_id TEXT NOT NULL,
  trigger_data TEXT, -- JSON格式，触发时的数据
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notifications_sent INTEGER DEFAULT 0,
  target_users TEXT, -- JSON格式，实际发送的用户列表
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  FOREIGN KEY (rule_id) REFERENCES notification_rules(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notification_rules_type ON notification_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled ON notification_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_notification_rule_logs_rule_id ON notification_rule_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_notification_rule_logs_executed_at ON notification_rule_logs(executed_at);

-- 插入默认通知模板
INSERT OR IGNORE INTO notification_templates (id, template_name, title, template_message, template_type, template_priority, action_url, variables) VALUES
('tpl_balance_low', '余额不足提醒', '账户余额不足', '您的账户余额已不足 {{threshold}} 元，当前余额为 {{current_balance}} 元，请及时充值以免影响服务使用。', 'billing', 'high', '/dashboard/billing', '{"threshold": "触发阈值", "current_balance": "当前余额"}'),
('tpl_subscription_expiring', '套餐即将到期', '您的套餐即将到期', '您的 {{plan_name}} 套餐将在 {{days_left}} 天后到期（{{expire_date}}），请及时续费以免影响服务使用。', 'billing', 'medium', '/dashboard/billing', '{"plan_name": "套餐名称", "days_left": "剩余天数", "expire_date": "到期日期"}'),
('tpl_usage_limit', '使用量超限提醒', '使用量即将超限', '您的 {{resource_type}} 使用量已达到 {{usage_percent}}%（{{current_usage}}/{{limit}}），请注意合理使用。', 'warning', 'medium', '/dashboard/usage', '{"resource_type": "资源类型", "usage_percent": "使用百分比", "current_usage": "当前使用量", "limit": "限制"}'),
('tpl_payment_failed', '支付失败通知', '支付失败', '您的支付失败了，金额：{{amount}} 元，原因：{{reason}}。请检查支付方式或联系客服。', 'billing', 'high', '/dashboard/billing', '{"amount": "支付金额", "reason": "失败原因"}'),
('tpl_login_security', '异常登录提醒', '检测到异常登录', '系统检测到您的账户在 {{login_time}} 从 {{location}} ({{ip}}) 登录，如非本人操作请立即修改密码。', 'security', 'high', '/dashboard/security', '{"login_time": "登录时间", "location": "登录地点", "ip": "IP地址"}'),
('tpl_system_maintenance', '系统维护通知', '系统维护通知', '系统将在 {{start_time}} 至 {{end_time}} 进行维护，期间服务可能中断，请合理安排使用时间。', 'system', 'medium', null, '{"start_time": "开始时间", "end_time": "结束时间"}');

-- 插入默认通知规则
INSERT OR IGNORE INTO notification_rules (id, rule_name, description, rule_type, trigger_condition, template_id, target_scope, is_enabled, cooldown_minutes, created_by) VALUES
('rule_balance_low', '余额不足自动提醒', '当用户余额低于设定阈值时自动发送通知', 'balance_low', '{"threshold": 10}', 'tpl_balance_low', 'all_users', true, 1440, 'admin-001'),
('rule_subscription_expiring', '套餐到期提醒', '套餐到期前自动提醒用户续费', 'subscription_expiring', '{"days_before": 7}', 'tpl_subscription_expiring', 'all_users', true, 1440, 'admin-001'),
('rule_usage_limit', '使用量超限提醒', '使用量达到阈值时提醒用户', 'usage_limit', '{"threshold_percent": 80}', 'tpl_usage_limit', 'all_users', true, 360, 'admin-001');