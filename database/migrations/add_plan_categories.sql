-- 添加套餐分组功能
-- 创建时间: 2025-09-23

-- 创建套餐分组表
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

-- 为plans表添加category_id字段
ALTER TABLE plans ADD COLUMN category_id TEXT;

-- 添加外键约束
-- 注意：SQLite需要特殊处理外键，这里先不添加约束

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_plans_category_id ON plans(category_id);
CREATE INDEX IF NOT EXISTS idx_plan_categories_sort_order ON plan_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_plan_categories_active ON plan_categories(is_active);

-- 插入默认分组数据
INSERT OR REPLACE INTO plan_categories (id, name, display_name, description, icon, color, sort_order, is_featured) VALUES
('claude-code', 'claude-code', 'Claude Code', '专业的AI编程助手，为开发者提供智能代码生成和优化服务', 'Code', '#6366f1', 1, true),
('codex', 'codex', 'CodeX', '高性能代码解决方案，适合企业级开发和大型项目', 'Zap', '#8b5cf6', 2, true),
('api-relay', 'api-relay', 'API中转', '稳定可靠的API中转服务，支持多种AI模型接口', 'Globe', '#06b6d4', 3, false),
('enterprise', 'enterprise', '企业定制', '为企业客户量身定制的专属解决方案', 'Building', '#10b981', 4, false);

-- 更新现有套餐的分组
UPDATE plans SET category_id = 'claude-code' WHERE id IN ('free', 'basic');
UPDATE plans SET category_id = 'codex' WHERE id IN ('standard', 'pro');
UPDATE plans SET category_id = 'api-relay' WHERE id = 'shared';