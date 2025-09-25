# 数据库自动初始化功能说明

## 功能概述

为了提供更好的用户体验，我们实现了数据库自动初始化功能。现在用户首次运行应用时，系统会智能检测数据库状态并自动完成初始化，无需手动执行任何命令。

## 核心特性

### 🧠 智能检测
- 应用启动时自动检测数据库是否已初始化
- 通过检查关键表（如 `users` 表）的存在来判断
- 支持所有数据库类型：SQLite、MySQL、PostgreSQL

### 🚀 零配置启动
- **首次运行**：自动执行完整的数据库初始化（schema + seed data）
- **后续运行**：自动跳过初始化，直接连接数据库
- **错误恢复**：初始化失败时提供清晰的错误信息和解决建议

### ⚡ 性能优化
- 已初始化的数据库跳过检查，连接速度更快
- 只在必要时执行初始化，避免重复操作
- 日志输出清晰，便于调试和监控

## 使用方式

### 开发者体验
```bash
# 第一次运行 - 自动初始化
pnpm run dev
# 输出：🔍 检测到数据库为空，开始自动初始化...
# 输出：🎉 数据库自动初始化完成！

# 第二次运行 - 跳过初始化
pnpm run dev
# 输出：✅ 数据库已初始化，跳过自动初始化
```

### 测试和调试
```bash
# 测试自动初始化功能
pnpm run db:test-auto

# 检查数据库配置
pnpm run db:check

# 手动强制初始化（仅用于故障排除）
pnpm run db:init
```

## 技术实现

### 数据库适配器接口扩展
```typescript
interface DatabaseAdapter {
  // 新增方法
  needsInitialization(): Promise<boolean>;  // 检查是否需要初始化
  initializeIfNeeded(): Promise<void>;     // 智能初始化

  // 原有方法
  initialize(): Promise<void>;             // 强制初始化
}
```

### 检查逻辑
每个数据库适配器都实现了相同的检查逻辑：

**SQLite:**
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='users'
```

**MySQL:**
```sql
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
```

**PostgreSQL:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'users'
```

### 连接流程
1. **创建适配器** - 根据环境自动选择数据库类型
2. **建立连接** - 连接到数据库服务器
3. **智能初始化** - 调用 `initializeIfNeeded()` 而不是 `initialize()`
4. **创建接口包装器** - 提供统一的数据库操作接口

## 日志输出

### 首次初始化
```
🔍 检测到 MySQL 数据库为空，开始自动初始化...
🔧 正在初始化 MySQL 数据库架构...
✅ MySQL 数据库架构已创建
✅ MySQL 初始化数据已导入
🎉 MySQL 数据库自动初始化完成！
```

### 跳过初始化
```
✅ MySQL 数据库已初始化，跳过自动初始化
```

### 错误处理
```
❌ MySQL 数据库自动初始化失败: Error: ...
```

## 支持的数据库

| 数据库 | 自动检测 | 自动初始化 | Schema 文件 | Seed 文件 |
|--------|----------|------------|-------------|-----------|
| SQLite | ✅ | ✅ | `database/schema.sql` | `database/seed.sql` |
| MySQL | ✅ | ✅ | `database/schema-mysql.sql` | `database/seed-mysql.sql` |
| PostgreSQL | ✅ | ✅ | `database/schema-postgres.sql` | `database/seed-postgres.sql` |

## 默认数据

自动初始化完成后，数据库包含：

### 用户账户
- **管理员**: admin@i8relay.com / admin123
- **演示用户1**: demo@i8relay.com / demo123
- **演示用户2**: demo2@i8relay.com / demo123

### 套餐配置
- 体验版（免费）
- 基础版（¥29.90/月）
- 标准版（¥99.90/月）
- 专业版（¥299.90/月）
- 拼车版（¥19.90/月）

### 系统配置
- 网站基础设置
- 支付配置模板
- 邮件配置模板
- AI 模型配置
- 安全和限流配置

## 故障排查

### 常见问题

**问题**: 初始化失败
**解决方案**:
1. 检查数据库服务是否运行
2. 验证用户权限（需要 CREATE、INSERT 权限）
3. 确认数据库存在
4. 检查 schema 和 seed 文件

**问题**: 连接超时
**解决方案**:
1. 检查网络连接
2. 验证数据库配置
3. 确认防火墙设置

**问题**: 权限不足
**解决方案**:
```sql
-- MySQL 示例
GRANT CREATE, INSERT, SELECT, UPDATE, DELETE ON aiporxy.* TO 'username'@'%';
FLUSH PRIVILEGES;
```

### 调试命令
```bash
# 检查环境配置
pnpm run db:check

# 测试连接（MySQL）
pnpm run db:test-mysql

# 查看详细日志
DEBUG=1 pnpm run dev
```

## 向后兼容

- 原有的手动初始化命令 `pnpm run db:init` 仍然可用
- 现有的数据库不会受到影响
- 可以通过环境变量禁用自动初始化（如果需要）

## 开发建议

1. **新项目**: 直接运行 `pnpm run dev`，系统会自动处理一切
2. **现有项目**: 无需更改现有工作流程
3. **生产部署**: 确保数据库用户有足够权限创建表和插入数据
4. **Docker 部署**: 容器启动时会自动初始化数据库

这个功能让 i8Relay 的部署和开发体验更加友好，用户无需了解复杂的数据库初始化过程就能快速开始使用。