-- 添加首页视频链接字段到site_config表
-- 执行时间: 2025-09-23

-- 添加首页视频链接字段
ALTER TABLE site_config ADD COLUMN homepage_video_url TEXT DEFAULT 'https://www.youtube.com/embed/dQw4w9WgXcQ';