# 🚀 i8Relay - AI API中转平台

一个基于 Next.js 15 构建的现代化 AI API 中转服务平台，提供稳定、安全、高效的 Claude、GPT、Gemini 等 AI 模型 API 代理服务。

# 由于 Claude 官方额度限制问题 此项目暂停更新

## 特别推荐：i7relay
🔥 **强烈推荐使用原版 i7relay！**

- **官网地址**: [https://i7dc.com/](https://i7dc.com/)
- **项目名称**: i7relay - 专业的 AI API 中转平台
- **核心优势**:
    - ⚡ 更稳定的服务质量和可靠性
    - 🛡️ 更完善的安全机制和风控系统
    - 🚀 更优秀的性能表现和响应速度
    - 💪 更丰富的功能特性和模型支持
    - 👥 更专业的技术支持和社区服务

**如果你正在寻找生产级的 AI API 中转解决方案，请优先考虑使用原版 i7relay！**

**i8relay直接抄袭了i7relay🙏**

## ✨ 特性

### 🎯 核心功能
- **多模型支持**: 支持 Claude、GPT、Gemini 等主流 AI 模型
- **企业级安全**: JWT 认证、API 密钥管理、权限控制
- **实时监控**: 使用统计、成本分析、性能监控
- **灵活套餐**: 多层级套餐管理，支持自定义定价
- **管理后台**: 完整的管理员控制面板
- **通知系统**: 实时通知、多类型消息、智能提醒

### 🎨 现代化界面
- **统一布局**: 响应式设计，移动端友好
- **深色模式**: 完整的明暗主题切换
- **组件化UI**: 基于 shadcn/ui 的现代组件库
- **数据可视化**: ECharts 驱动的专业图表
- **实时交互**: 流畅的用户体验和反馈

### 🏗️ 技术架构
- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **UI组件**: shadcn/ui + Lucide React Icons
- **图表库**: ECharts + echarts-for-react
- **数据库**: SQLite（生产环境可切换至 PostgreSQL/MySQL）
- **认证**: JWT + HTTP Cookies
- **状态管理**: React Context + Custom Hooks
- **API**: RESTful API 设计

## 🛠️ 快速开始

### 环境要求
- Node.js 18+
- npm/pnpm/yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd aiporxy
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **环境配置**
```bash
cp .env.example .env.local
# 编辑 .env.local 配置必要的环境变量
```

4. **初始化数据库**
```bash
npm run db:init
# 这将创建数据库表并插入初始数据
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
   - 主页: http://localhost:3000
   - 用户仪表板: http://localhost:3000/dashboard
   - 管理后台: http://localhost:3000/admin

## 🔐 默认账号

系统初始化后将创建以下默认账号：

### 管理员账号
```
邮箱: admin@i8relay.com
密码: admin123
角色: 超级管理员
套餐: Pro
余额: ¥1000
```

### 演示用户账号
```
邮箱: demo@i8relay.com
密码: demo123
角色: 普通用户
套餐: Basic
余额: ¥100

邮箱: demo2@i8relay.com
密码: demo123
角色: 普通用户
套餐: Pro
余额: ¥300
```

## 📊 功能模块

### 🏠 用户仪表板
- **📈 数据总览**: 使用统计、成本分析、实时图表
- **📋 使用记录**: 请求明细、日汇总、筛选搜索
- **💳 账单管理**: 消费记录、支付状态、费用分析
- **🎯 套餐计划**: 套餐选择、购买升级、功能对比
- **👤 个人资料**: 信息管理、密码修改、API密钥
- **🔔 通知中心**: 系统通知、消息管理、实时提醒

### 💼 用户端功能
- **用户认证**: 注册、登录、密码重置
- **账户管理**: 个人资料、API 密钥管理
- **套餐管理**: 套餐购买、升级、续费
- **使用统计**: 实时使用量、成本分析、数据图表
- **账单记录**: 消费明细、充值记录、支付状态
- **通知系统**: 多类型通知、批量操作、实时推送

### 🛡️ 管理端功能
- **用户管理**: 用户列表、角色权限、状态管理
- **套餐管理**: 套餐配置、定价设置、分组管理
- **使用监控**: 系统使用统计、用户排行榜
- **网站配置**: 站点设置、外观配置、功能开关
- **系统活动**: 操作日志、系统监控

### 🎯 通知系统特性
- **📊 统计面板**: 总通知、未读、高优先级、已读数量
- **🔍 高级筛选**: 按状态、类型、优先级、时间范围筛选
- **🔎 搜索功能**: 支持标题和内容全文搜索
- **⚡ 批量操作**: 全部标记已读、清空所有通知
- **🎨 多种类型**: 系统、账单、安全、警告、信息、成功
- **📱 实时更新**: 头部铃铛显示未读数量

### 🔧 开发特性
- **TypeScript**: 完整的类型支持和代码提示
- **响应式设计**: 移动端友好的自适应界面
- **组件化架构**: shadcn/ui 现代组件库
- **主题系统**: 深色/浅色模式无缝切换
- **数据可视化**: ECharts 专业图表组件
- **状态管理**: Custom Hooks + Context API

## 🗄️ 数据库架构

### 核心表结构
- **users**: 用户信息、认证数据
- **plans**: 套餐配置、定价信息
- **plan_groups**: 套餐分组、分类管理
- **user_subscriptions**: 用户订阅关系
- **billing_records**: 账单记录、交易历史
- **usage_logs**: API 使用日志
- **daily_summaries**: 日汇总数据
- **api_keys**: API 密钥管理
- **notifications**: 通知消息管理
- **site_config**: 网站配置信息

### 数据特性
- **完整的外键约束**: 确保数据一致性
- **索引优化**: 提高查询性能
- **时间戳管理**: 自动维护创建和更新时间
- **软删除支持**: 重要数据的安全删除

## 🎨 界面特性

### 🎯 现代化设计
- **统一布局**: 所有页面使用一致的布局系统
- **响应式栅格**: 适配各种屏幕尺寸
- **微交互**: 流畅的过渡动画和反馈
- **无障碍访问**: 符合WCAG标准的可访问性

### 📊 数据可视化
- **Token分布图**: 饼图展示模型使用分布
- **使用趋势图**: 柱状图+折线图组合展示
- **实时统计**: 动态数据更新和展示
- **交互式图表**: 支持缩放、筛选等操作

### 🎨 自定义配置

#### 网站配置
通过管理后台 `/admin/config` 可以配置：
- 网站名称和标题
- Logo 和颜色主题
- 联系信息
- SEO 设置
- 功能开关

#### 主题定制
- 支持动态主色调配置
- CSS 变量系统
- 响应式设计
- 深色模式完整支持

## 🚀 部署指南

### 生产环境构建
```bash
npm run build
npm start
```

### Docker 部署

#### 方式一：使用 Docker Compose（推荐）

1. **准备环境文件**
```bash
# 复制环境变量示例文件
cp .env.example .env.production

# 编辑环境变量
vim .env.production
```

2. **启动服务**
```bash
# 构建并启动应用
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f i8relay
```

3. **使用 Nginx 反向代理（可选）**
```bash
# 复制 Nginx 配置示例
cp nginx.conf.example nginx.conf

# 编辑配置文件，修改域名和SSL证书路径
vim nginx.conf

# 启动包含 Nginx 的完整服务
docker-compose --profile with-nginx up -d
```

#### 方式二：使用 Docker 命令

1. **构建镜像**
```bash
# 构建应用镜像
docker build -t i8relay:latest .
```

2. **运行容器**
```bash
# 创建数据目录
mkdir -p ./data

# 运行容器（基础版本）
docker run -d \
  --name i8relay-app \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e DATABASE_URL=sqlite:./data/aiporxy.db \
  --restart unless-stopped \
  i8relay:latest
```

3. **完整配置运行**
```bash
# 使用环境文件运行
docker run -d \
  --name i8relay-app \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env.production:/app/.env.local:ro \
  --restart unless-stopped \
  i8relay:latest
```

#### 数据备份

```bash
# 备份数据库
docker exec i8relay-app cp /app/data/aiporxy.db /app/data/backup-$(date +%Y%m%d).db

# 复制备份到宿主机
docker cp i8relay-app:/app/data/backup-$(date +%Y%m%d).db ./backup/
```

#### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 查看容器健康状态
docker inspect --format='{{json .State.Health}}' i8relay-app
```

### 环境变量配置
```env
# 数据库配置
DATABASE_URL=sqlite:./data/database.db

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# 网站配置
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 🔧 开发指南

### 项目结构
```
aiporxy/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理后台页面
│   ├── api/               # API 路由
│   ├── dashboard/         # 用户仪表板
│   │   ├── billing/      # 账单管理
│   │   ├── notifications/ # 通知中心
│   │   ├── plans/        # 套餐计划
│   │   ├── profile/      # 个人资料
│   │   └── usage/        # 使用记录
│   └── components/        # 页面组件
├── components/            # 通用组件
│   ├── ui/               # shadcn/ui 组件
│   ├── charts/           # 图表组件
│   └── layout/           # 布局组件
├── lib/                   # 工具库
│   ├── auth/             # 认证相关
│   ├── database/         # 数据库操作
│   ├── hooks/            # 自定义Hooks
│   └── providers/        # Context 提供者
├── database/             # 数据库文件
│   ├── schema.sql        # 数据库架构
│   └── seed.sql          # 初始数据
└── docs/                 # 文档目录
```

### 开发规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 组件使用 React Hooks
- API 路由使用标准 RESTful 设计
- 数据库操作使用事务保证一致性
- 组件库优先使用 shadcn/ui

### 架构原则
- **组件化**: 可复用的UI组件
- **类型安全**: 完整的TypeScript支持
- **响应式**: 移动端优先设计
- **性能优化**: 懒加载和代码分割
- **可访问性**: 遵循无障碍设计标准

### 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 支持

- **文档**: [在线文档](https://docs.example.com)
- **问题反馈**: [GitHub Issues](https://github.com/7836246/i8Relay/issues)
- **邮箱支持**: support@i8relay.com

## 🎯 路线图

### 近期计划
- [x] 深色模式支持
- [x] 现代化UI组件库
- [x] 数据可视化图表
- [x] 通知系统完整实现
- [x] 统一布局系统
- [ ] 多语言国际化
- [ ] 移动端 App
- [ ] API 文档生成器

### 长期规划
- [ ] 插件系统
- [ ] 第三方集成
- [ ] 高级分析功能
- [ ] 企业版功能
- [ ] 微服务架构
- [ ] 容器化部署


**⭐ 如果这个项目对你有帮助，请给它一个星标！**

> 构建一个更智能的 AI API 中转平台 🚀# i8Relay
