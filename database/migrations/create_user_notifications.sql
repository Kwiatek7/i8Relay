-- 用户个人通知表
CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('system', 'billing', 'security', 'info', 'warning', 'success')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata TEXT, -- JSON格式的额外信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引创建
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_priority ON user_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON user_notifications(user_id, is_read);

-- 创建一些示例通知数据
INSERT OR IGNORE INTO user_notifications (id, user_id, title, message, type, priority, is_read, action_url, created_at) VALUES
  ('notif_001', 'user_test', '账户余额不足', '您的账户余额仅剩 $5.23，建议及时充值以避免服务中断。', 'billing', 'high', false, '/dashboard/billing', datetime('now', '-2 hours')),
  ('notif_002', 'user_test', '系统维护通知', '系统将于今晚 22:00-24:00 进行例行维护，期间服务可能会短暂中断。', 'system', 'medium', false, null, datetime('now', '-5 hours')),
  ('notif_003', 'user_test', '密码安全提醒', '检测到您的密码已使用超过 90 天，建议及时更换密码确保账户安全。', 'security', 'medium', true, '/dashboard/profile', datetime('now', '-1 day')),
  ('notif_004', 'user_test', 'API 密钥即将过期', '您的 API 密钥将在 7 天后过期，请及时更新以确保服务正常使用。', 'warning', 'high', true, '/dashboard/profile', datetime('now', '-1 day')),
  ('notif_005', 'user_test', '新功能上线', '我们推出了全新的使用统计功能，现在您可以更详细地了解API使用情况。', 'info', 'low', true, '/dashboard/usage', datetime('now', '-3 days')),
  ('notif_006', 'user_test', '账单支付成功', '您的月度账单 $29.99 已支付成功，感谢您的使用。', 'success', 'low', true, '/dashboard/billing', datetime('now', '-4 days'));