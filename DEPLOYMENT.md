# 🚀 i8Relay 部署指南

本项目支持多种数据库和部署环境，提供灵活的配置选项。

## 📋 部署方式

### 🌐 Vercel 部署（推荐）

#### 1. 准备工作

1. **Fork 或克隆项目**
   ```bash
   git clone https://github.com/7836246/i8Relay.git
   cd i8Relay
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

#### 2. 在 Vercel 中部署

1. **连接 GitHub 仓库**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择你的 i8Relay 仓库

2. **配置数据库**
   - 在项目设置中选择 "Storage"
   - 创建 "Postgres" 数据库
   - Vercel 会自动配置所需的环境变量：
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`

3. **配置环境变量**
   在 Vercel 项目设置 → Environment Variables 中添加：
   ```
   DATABASE_TYPE=postgres
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-token-secret
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_SITE_NAME=i8Relay
   ```

4. **部署**
   - 点击 "Deploy" 完成部署
   - 首次部署时数据库会自动初始化

#### 3. 验证部署

访问你的 Vercel 域名，应该能看到：
- ✅ 主页正常显示
- ✅ 登录页面可访问
- ✅ 数据库连接正常

---

### 💻 本地开发

#### 1. 环境配置

1. **复制环境变量文件**
   ```bash
   cp .env.example .env.local
   ```

2. **编辑 .env.local**
   ```env
   # 本地开发使用 SQLite
   DATABASE_TYPE=sqlite
   DATABASE_PATH=./data/aiporxy.db

   JWT_SECRET=your-local-jwt-secret
   JWT_REFRESH_SECRET=your-local-refresh-secret
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

#### 2. 启动开发服务器

```bash
# 初始化数据库
pnpm run db:init

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看应用。

---

## 🗄️ 数据库适配器

项目支持自动数据库切换：

### 🎯 自动检测逻辑

1. **优先级1**: 检查 `DATABASE_TYPE` 环境变量
2. **优先级2**: 检测 Vercel Postgres 环境变量
3. **优先级3**: 回退到 SQLite（本地开发）

### 📊 支持的数据库

| 数据库 | 环境 | 配置方式 |
|--------|------|---------|
| **SQLite** | 本地开发 | `DATABASE_TYPE=sqlite` |
| **Postgres** | Vercel 生产 | `DATABASE_TYPE=postgres` |

### 🔧 手动指定数据库

在环境变量中设置：
```env
# 强制使用 SQLite
DATABASE_TYPE=sqlite

# 强制使用 Postgres
DATABASE_TYPE=postgres
```

---

## ⚙️ 配置选项

### 🔑 必需的环境变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `JWT_SECRET` | JWT 签名密钥 | `your-super-secret-key` |
| `JWT_REFRESH_SECRET` | 刷新令牌密钥 | `your-refresh-secret` |
| `NEXT_PUBLIC_SITE_URL` | 网站 URL | `https://your-domain.com` |

### 📧 可选的环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `SMTP_HOST` | 邮件服务器 | - |
| `SMTP_PORT` | 邮件端口 | `587` |
| `SMTP_USER` | 邮件用户名 | - |
| `SMTP_PASS` | 邮件密码 | - |

---

## 🔍 故障排除

### ❌ 常见问题

#### 1. SQLite3 模块加载失败
**错误**: `Error: Could not locate the bindings file`

**解决**:
- Vercel 环境：确保设置了 `DATABASE_TYPE=postgres`
- 本地环境：重新安装依赖 `pnpm install`

#### 2. 数据库连接失败
**错误**: `未找到可用的数据库适配器`

**解决**:
1. 检查环境变量配置
2. 验证数据库服务状态
3. 查看控制台日志

#### 3. Vercel 部署失败
**错误**: Build 或 Runtime 错误

**解决**:
1. 确保创建了 Postgres 数据库
2. 检查环境变量配置
3. 查看 Vercel Function 日志

### 🔍 调试信息

项目启动时会显示数据库环境信息：
```
🎯 数据库环境信息: {
  推荐适配器: 'postgres',
  SQLite可用: false,
  Postgres可用: true
}
```

---

## 📈 性能优化

### 🚀 生产环境建议

1. **数据库**
   - 使用 Vercel Postgres（自动扩展）
   - 启用连接池优化

2. **安全性**
   - 使用强密码的 JWT 密钥
   - 定期更新环境变量

3. **监控**
   - 启用 Vercel Analytics
   - 配置错误追踪

---

## 🔗 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)

---

## 🆘 获取帮助

如果遇到问题：

1. 查看项目 [GitHub Issues](https://github.com/7836246/i8Relay/issues)
2. 检查 Vercel Function 日志
3. 联系项目维护者

---

**⭐ 部署成功后，请给项目一个星标支持！**