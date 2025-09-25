# MySQL 数据库支持修复说明

## 修复内容

针对用户反馈的 MySQL 语法错误问题，已完成以下修复：

### 1. 修复布尔值转换问题 ✅
- **问题**: `FALSE` 被错误转换为 `FALSE.0000`
- **修复**: 将布尔值正确转换为数值：`FALSE → 0`, `TRUE → 1`
- **位置**: `lib/database/adapters/mysql.ts:convertSQLiteToMySQL()`

### 2. 修复多语句执行问题 ✅
- **问题**: `START TRANSACTION` 等语句不支持预编译语句协议
- **修复**: 为不支持预编译的语句使用 `query()` 方法而非 `execute()`
- **新增**: `isNonPreparedStatement()` 方法识别特殊语句
- **位置**: `lib/database/adapters/mysql.ts:exec()`

### 3. 修复 TEXT 字段默认值问题 ✅
- **问题**: MySQL 不支持 TEXT 类型字段的默认值
- **修复**: 自动移除 TEXT 字段的 `DEFAULT` 子句
- **位置**: `lib/database/adapters/mysql.ts:convertSQLiteToMySQL()` 和 `convertSchemaToMySQL()`

### 4. 改进 SQL 语句分割处理 ✅
- **问题**: 复杂 SQL 脚本执行失败
- **修复**: 智能分割 SQL 语句，逐个执行，避免多语句执行问题
- **新增**: `splitSQLStatements()` 方法处理字符串内分号
- **位置**: `lib/database/adapters/mysql.ts:splitSQLStatements()`

## 测试验证

### 基础连接测试
```bash
# 测试 MySQL 连接和基本操作
npx tsx scripts/test-mysql-connection.ts
```

### 数据库配置检查
```bash
# 检查所有数据库适配器的可用性
npx tsx scripts/check-database-config.ts
```

### 完整数据库初始化
```bash
# 强制重新初始化数据库（删除现有数据）
npx tsx scripts/force-mysql-reinit.ts
```

## 使用方法

### 1. 环境配置
在 `.env.local` 文件中配置 MySQL 连接：

```bash
# 指定使用 MySQL
DATABASE_TYPE=mysql

# MySQL 连接配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=aiporxy

# 或者使用连接字符串
DATABASE_URL=mysql://user:password@host:port/database
```

### 2. 数据库初始化
```bash
# 使用项目默认初始化命令
pnpm run db:init

# 或直接使用 MySQL 强制初始化
npx tsx scripts/force-mysql-reinit.ts
```

### 3. 验证安装
成功初始化后，数据库将包含：
- 13 个表（包括 users, plans, site_config 等）
- 管理员账户：admin@i8relay.com / admin123
- 演示用户：demo@i8relay.com / demo123
- 完整的种子数据和配置

## 技术细节

### 数据库适配器优先级
系统会按以下优先级自动选择数据库适配器：
1. **MySQL** - 如果配置了 `MYSQL_*` 环境变量或 `DATABASE_URL`
2. **PostgreSQL** - 如果在 Vercel 环境中
3. **SQLite** - 本地开发环境默认

### MySQL 语法转换规则
- `INTEGER` → `INT`
- `AUTOINCREMENT` → `AUTO_INCREMENT`
- `TEXT DEFAULT 'value'` → `TEXT`（移除默认值）
- `FALSE/TRUE` → `0/1`
- `BEGIN TRANSACTION` → `START TRANSACTION`
- 移除 SQLite 特有的 `PRAGMA` 语句

### 错误处理改进
- 智能识别不支持预编译的 MySQL 语句
- 自动分割复杂 SQL 脚本
- 提供详细的错误信息和排查建议

## 故障排查

如果遇到问题，请检查：
1. MySQL 服务器是否正在运行
2. 数据库用户是否有足够权限（CREATE、DROP、INSERT 等）
3. 数据库是否存在
4. 网络连接是否正常

使用 `npx tsx scripts/check-database-config.ts` 可以快速诊断配置问题。