---
title: "快速开始"
description: "5分钟内快速上手 i8Relay，开始您的AI开发之旅"
---

# 快速开始

欢迎使用 i8Relay！本指南将帮助您在5分钟内快速上手，开始您的AI开发之旅。

## 什么是 i8Relay？

i8Relay 是一个智能的AI工具中继平台，为开发者提供：

- 🤖 **多模型支持**: 支持 Claude、GPT、Gemini 等主流AI模型
- 🔄 **智能切换**: 根据任务类型自动选择最适合的模型
- 🛡️ **安全保障**: 企业级安全保护，保障您的数据安全
- 📊 **使用统计**: 详细的使用分析和成本优化建议

## 第一步：获取API密钥

1. 访问 [i8Relay 控制台](https://console.i8relay.com)
2. 注册账号并完成邮箱验证
3. 创建新项目，获取您的API密钥

```bash
# 设置环境变量
export I8RELAY_API_KEY="your-api-key-here"
```

## 第二步：安装SDK

### Node.js

```bash
npm install @i8relay/sdk
```

```javascript
import { I8Relay } from '@i8relay/sdk';

const client = new I8Relay({
  apiKey: process.env.I8RELAY_API_KEY
});

const response = await client.chat.completions.create({
  model: 'claude-3.5-sonnet',
  messages: [
    { role: 'user', content: 'Hello, world!' }
  ]
});

console.log(response.choices[0].message.content);
```

### Python

```bash
pip install i8relay
```

```python
import i8relay

client = i8relay.Client(api_key="your-api-key")

response = client.chat.completions.create(
    model="claude-3.5-sonnet",
    messages=[
        {"role": "user", "content": "Hello, world!"}
    ]
)

print(response.choices[0].message.content)
```

### curl

```bash
curl -X POST "https://api.i8relay.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3.5-sonnet",
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ]
  }'
```

## 第三步：选择合适的模型

| 模型 | 适用场景 | 特点 |
|------|---------|------|
| `claude-3.5-sonnet` | 代码生成、分析 | 编程能力强，逻辑清晰 |
| `gpt-4o` | 通用对话、创作 | 创意能力强，回复自然 |
| `gemini-pro` | 多媒体处理 | 支持图片、视频分析 |

## 下一步

🎉 恭喜！您已经成功完成了基础设置。接下来您可以：

- [查看详细的API文档](/docs/api/overview)
- [学习最佳实践](/docs/guides/best-practices)
- [了解安全配置](/docs/article/security)
- [查看使用案例](/docs/guides/use-cases)

## 常见问题

### API密钥在哪里找？

在控制台的「项目设置」→「API密钥」中可以查看和管理您的密钥。

### 如何计费？

我们采用按使用量计费，每个模型的价格不同。具体价格请查看[定价页面](/pricing)。

### 遇到错误怎么办？

1. 检查API密钥是否正确
2. 确认账户余额充足
3. 查看[错误代码文档](/docs/api/errors)
4. 联系技术支持

## 获取帮助

如果您在使用过程中遇到任何问题：

- 📖 查看[完整文档](/docs)
- 💬 加入[开发者社区](https://discord.gg/i8relay)
- 📧 发送邮件至 [support@i8relay.com](mailto:support@i8relay.com)