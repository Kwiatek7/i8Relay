-- 添加SMTP邮件配置字段到site_config表
-- 执行时间: 2025-09-23

-- 添加SMTP配置字段
ALTER TABLE site_config ADD COLUMN smtp_host TEXT DEFAULT '';
ALTER TABLE site_config ADD COLUMN smtp_port INTEGER DEFAULT 587;
ALTER TABLE site_config ADD COLUMN smtp_user TEXT DEFAULT '';
ALTER TABLE site_config ADD COLUMN smtp_password TEXT DEFAULT '';
ALTER TABLE site_config ADD COLUMN smtp_secure BOOLEAN DEFAULT false;

-- 添加邮件相关配置
ALTER TABLE site_config ADD COLUMN contact_form_email TEXT DEFAULT '';  -- 联系表单接收邮箱
ALTER TABLE site_config ADD COLUMN smtp_enabled BOOLEAN DEFAULT false;  -- 是否启用SMTP