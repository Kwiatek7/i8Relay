# GitHub Actions 工作流程说明

本项目配置了以下 GitHub Actions 工作流程来自动化开发、测试和部署流程：

## 🚀 已配置的工作流程

### 1. CI/CD Pipeline (`ci.yml`)
**触发条件**: 推送到 `main`/`develop` 分支或创建 PR
**功能**:
- ✅ 在 Node.js 18.x 和 20.x 上测试
- ✅ TypeScript 类型检查
- ✅ 项目构建验证
- ✅ 数据库初始化测试
- ✅ ESLint 代码检查（如已配置）
- ✅ 依赖检查

### 2. Docker Build & Push (`docker.yml`)
**触发条件**: 推送到 `main` 分支或创建标签
**功能**:
- 🐳 多平台 Docker 镜像构建 (amd64/arm64)
- 📦 自动推送到 GitHub Container Registry
- 🔒 Trivy 安全漏洞扫描
- 🏷️ 自动标签管理（latest, 版本号等）

### 3. Deploy (`deploy.yml`)
**触发条件**: 推送到 `main` 分支或手动触发
**功能**:
- 🌐 Vercel 自动部署（推荐）
- 🖥️ 服务器 SSH 部署（可选）
- 🐳 Docker 容器部署（可选）
- ✅ 部署后健康检查
- 💬 部署结果通知（可选）

### 4. Security & Quality (`security.yml`)
**触发条件**: 推送到分支、PR 或每周定时扫描
**功能**:
- 🔍 依赖安全扫描 (npm audit)
- 🔎 CodeQL 代码安全分析
- 🗝️ Secret 泄露检测
- 📄 许可证兼容性检查
- 📊 代码质量检查
- 📦 构建包大小分析

## ⚙️ 配置要求

### 必需的 Secrets 配置

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置：

#### Vercel 部署 (推荐)
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

#### 服务器部署 (可选)
```
HOST=your-server-ip
USERNAME=your-ssh-username
PRIVATE_KEY=your-private-key
PORT=22
```

#### Docker 部署 (可选)
```
DOCKER_HOST=your-docker-server
DOCKER_USER=your-docker-username
DOCKER_PRIVATE_KEY=your-docker-private-key
```

#### 应用配置
```
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
APP_URL=https://your-app-domain.com
```

#### 通知 (可选)
```
SLACK_WEBHOOK=your-slack-webhook-url
```

### Docker Hub 配置 (可选)
如果要推送到 Docker Hub 而不是 GitHub Container Registry：
```
DOCKERHUB_USERNAME=your-dockerhub-username
DOCKERHUB_TOKEN=your-dockerhub-token
```

## 📋 使用指南

### 启用自动部署
1. 编辑 `deploy.yml` 文件
2. 将相应部署方式的 `if: false` 改为 `if: true`
3. 配置对应的 Secrets

### 启用通知
1. 编辑 `deploy.yml` 中的通知部分
2. 将 `if: false` 改为 `if: true`
3. 配置 `SLACK_WEBHOOK` secret

### 手动触发部署
1. 前往 Actions 页面
2. 选择 "Deploy Application" 工作流程
3. 点击 "Run workflow" 并选择部署环境

## 🎯 工作流程状态徽章

添加到 README.md：

```markdown
[![CI/CD](https://github.com/your-username/aiporxy/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/aiporxy/actions/workflows/ci.yml)
[![Docker Build](https://github.com/your-username/aiporxy/actions/workflows/docker.yml/badge.svg)](https://github.com/your-username/aiporxy/actions/workflows/docker.yml)
[![Security Scan](https://github.com/your-username/aiporxy/actions/workflows/security.yml/badge.svg)](https://github.com/your-username/aiporxy/actions/workflows/security.yml)
```

## 🔧 自定义配置

### 修改触发条件
在每个工作流程文件的 `on` 部分修改触发条件，例如：
```yaml
on:
  push:
    branches: [ main, dev, staging ]  # 添加更多分支
```

### 添加环境变量
在工作流程中添加 `env` 部分：
```yaml
env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 修改通知设置
可以添加更多通知方式：
- Microsoft Teams
- Discord
- 邮件通知
- GitHub Issues

## 📚 更多资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vercel GitHub Actions](https://vercel.com/docs/concepts/git/vercel-for-github)
- [Docker GitHub Actions](https://docs.docker.com/ci-cd/github-actions/)
- [CodeQL 分析](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/about-code-scanning-with-codeql)

## ❗ 注意事项

1. **首次运行可能失败** - 需要配置相应的 Secrets
2. **Docker 镜像权限** - 确保 GITHUB_TOKEN 有写入包的权限
3. **Vercel 部署** - 需要先在 Vercel 创建项目
4. **安全扫描结果** - 查看 Security 选项卡查看扫描报告
5. **费用考虑** - GitHub Actions 对私有仓库有使用限制

## 🆘 故障排除

### 常见问题
1. **Token 权限不足** - 检查 GITHUB_TOKEN 权限设置
2. **Secret 配置错误** - 确保所有必需的 Secrets 已正确配置
3. **构建失败** - 检查 Node.js 版本兼容性
4. **部署失败** - 验证部署目标的连通性和权限

如有问题，请查看 Actions 运行日志获取详细错误信息。