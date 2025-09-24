# Vercel 部署指南

本文档详细介绍如何将 i8Relay 应用部署到 Vercel 平台，包括 PostgreSQL 数据库配置和自动初始化功能。

## 📋 部署准备

### 1. 账户准备
- [Vercel 账户](https://vercel.com/)
- [GitHub 账户](https://github.com/)（用于代码仓库）

### 2. 数据库准备
推荐使用 Vercel Postgres（无服务器 PostgreSQL）：
- 登录 [Vercel Dashboard](https://vercel.com/dashboard)
- 在项目页面选择 "Storage" 标签
- 点击 "Create Database" → 选择 "Postgres"
- 按照引导完成数据库创建

## 🚀 快速部署

### 方式一：从 GitHub 部署（推荐）

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "准备部署到 Vercel"
git push origin main
```

2. **在 Vercel 创建项目**
- 访问 [Vercel Dashboard](https://vercel.com/dashboard)
- 点击 "New Project"
- 选择你的 GitHub 仓库
- 点击 "Import"

3. **配置环境变量**（见下节详细说明）

4. **部署**
- 点击 "Deploy" 开始部署
- 等待构建完成（约 2-3 分钟）

### 方式二：使用 Vercel CLI

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
# 首次部署
vercel

# 生产部署
vercel --prod
```

## ⚙️ 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

### 🔐 必需的环境变量

#### JWT 认证配置
```env
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-token-secret-different-from-jwt-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

#### 网站配置
```env
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SITE_NAME=i8Relay
```

### 🗄️ 数据库配置（PostgreSQL）

Vercel Postgres 会自动提供以下环境变量：
```env
# Vercel 自动提供，无需手动设置
POSTGRES_URL=postgres://username:password@host:port/database
POSTGRES_PRISMA_URL=postgres://username:password@host:port/database?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgres://username:password@host:port/database
POSTGRES_USER=username
POSTGRES_HOST=host
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=database
```

如果使用外部 PostgreSQL 数据库，请手动设置：
```env
DATABASE_TYPE=postgres
POSTGRES_URL=postgres://username:password@host:port/database
```

### 📧 邮件配置（可选）
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### 💳 支付配置（可选）
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
```

### 🤖 AI API 配置（可选）
```env
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
```

## 🗄️ 数据库自动初始化

### ✨ 零配置初始化
应用首次运行时会自动检测数据库状态：

- **首次部署**：自动创建数据库表结构并导入初始数据
- **后续部署**：跳过初始化，直接连接数据库
- **错误处理**：初始化失败时提供详细错误信息

### 📊 初始化包含的内容

#### 默认用户账户
```
管理员账户：
- 邮箱：admin@i8relay.com
- 密码：admin123
- 角色：超级管理员
- 套餐：专业版
- 余额：¥1000

演示用户：
- demo@i8relay.com / demo123
- demo2@i8relay.com / demo123
```

#### 套餐配置
- 体验版（免费）
- 基础版（¥29.90/月）
- 标准版（¥99.90/月）
- 专业版（¥299.90/月）
- 拼车版（¥19.90/月）

#### 系统配置
- 网站基础设置
- 支付配置模板
- 邮件配置模板
- AI 模型配置
- 安全和限流配置

### 🔍 初始化验证

部署完成后，检查应用日志：

```bash
# 使用 Vercel CLI 查看日志
vercel logs

# 或在 Vercel Dashboard 的 Functions 标签查看
```

成功初始化的日志示例：
```
🔍 检测到 PostgreSQL 数据库为空，开始自动初始化...
🔧 正在初始化 PostgreSQL 数据库架构...
✅ PostgreSQL 数据库架构已创建
✅ PostgreSQL 初始化数据已导入
🎉 PostgreSQL 数据库自动初始化完成！
```

## 🌐 自定义域名

### 1. 添加域名
- 在 Vercel 项目设置中点击 "Domains"
- 添加你的自定义域名
- 按照指引配置 DNS 记录

### 2. 更新环境变量
更新 `NEXT_PUBLIC_SITE_URL` 为你的自定义域名：
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. SSL 证书
Vercel 会自动为你的域名配置 SSL 证书。

## 🛠️ 构建配置

### next.config.js 优化
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 部署优化
  output: 'standalone',
  
  // 图像优化配置
  images: {
    domains: ['your-domain.com'],
    unoptimized: process.env.NODE_ENV === 'production'
  },
  
  // 实验性功能
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}

module.exports = nextConfig
```

### 构建优化
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "build:analyze": "ANALYZE=true next build"
  }
}
```

## 📊 监控和分析

### 1. Vercel Analytics
在 Vercel Dashboard 启用 Analytics：
- 访问项目设置
- 点击 "Analytics" 标签
- 启用 Web Analytics

### 2. 性能监控
```javascript
// 在 _app.tsx 中添加
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

### 3. 错误监控
推荐集成 Sentry 或其他错误监控服务。

## 🔧 故障排查

### 常见问题

#### 1. 数据库连接失败
```
错误：Failed to connect to PostgreSQL
解决方案：
- 检查 POSTGRES_URL 环境变量
- 确认数据库实例正在运行
- 验证网络连接和防火墙设置
```

#### 2. 构建失败
```
错误：Module not found
解决方案：
- 检查 package.json 依赖
- 清除构建缓存：vercel --force
- 检查环境变量配置
```

#### 3. 初始化失败
```
错误：PostgreSQL 数据库自动初始化失败
解决方案：
- 检查数据库权限（需要 CREATE、INSERT 权限）
- 确认 schema 和 seed 文件存在
- 查看详细错误日志
```

#### 4. API 路由 404
```
错误：API route not found
解决方案：
- 检查文件路径和命名
- 确认 app/api 目录结构
- 重新部署项目
```

### 调试工具

#### 1. 本地调试
```bash
# 使用 Vercel 开发环境
vercel dev

# 模拟生产环境
NODE_ENV=production npm start
```

#### 2. 日志查看
```bash
# 实时查看部署日志
vercel logs --follow

# 查看特定函数日志
vercel logs --function=api/auth/login
```

#### 3. 环境变量检查
```bash
# 列出所有环境变量
vercel env ls

# 添加环境变量
vercel env add

# 删除环境变量
vercel env rm
```

## 🔒 安全最佳实践

### 1. 环境变量安全
- 使用强随机密钥作为 JWT_SECRET
- 定期轮换敏感密钥
- 避免在代码中硬编码敏感信息

### 2. 数据库安全
- 使用强密码
- 启用数据库 SSL 连接
- 定期备份数据库

### 3. 应用安全
- 启用 HTTPS（Vercel 自动处理）
- 设置适当的 CORS 策略
- 实施速率限制

## 📈 性能优化

### 1. 缓存策略
```javascript
// 在 API 路由中设置缓存头
export async function GET() {
  return Response.json(data, {
    headers: {
      'Cache-Control': 's-maxage=300, stale-while-revalidate'
    }
  })
}
```

### 2. 图像优化
- 使用 Next.js Image 组件
- 配置适当的图像域名
- 启用图像压缩

### 3. 代码分割
- 使用动态导入
- 实施路由级别的代码分割
- 优化包大小

## 🔄 CI/CD 配置

### GitHub Actions 集成
```yaml
name: Vercel Deployment
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📚 相关资源

### 官方文档
- [Vercel 部署文档](https://vercel.com/docs/deployments)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)

### 社区资源
- [Vercel 社区论坛](https://github.com/vercel/vercel/discussions)
- [Next.js GitHub](https://github.com/vercel/next.js)

### 支持联系
如果遇到部署问题：
1. 查看 [Vercel 状态页面](https://www.vercel-status.com/)
2. 搜索 [GitHub Issues](https://github.com/vercel/vercel/issues)
3. 联系 [Vercel 支持](https://vercel.com/contact)

---

🎉 **部署完成后，你的 i8Relay 应用将拥有：**
- ⚡ 全球 CDN 加速
- 🔒 自动 HTTPS 证书
- 📊 内置分析工具
- 🚀 无服务器架构
- 🔄 持续部署集成
- 💾 PostgreSQL 数据库
- 🛡️ 企业级安全性

**访问你的应用：** `https://your-app-name.vercel.app`