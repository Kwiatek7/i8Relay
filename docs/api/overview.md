---
title: "API 概览"
description: "i8Relay API 完整参考文档，包含所有端点和参数说明"
---

# API 概览

i8Relay API 提供了简单而强大的接口来访问多种AI模型。我们的API设计遵循REST原则，使用JSON格式进行数据交换。

## 基础信息

### 基础URL

```
https://api.i8relay.com/v1
```

### 认证

所有API请求都需要在请求头中包含API密钥：

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.i8relay.com/v1/models
```

### 请求格式

所有POST请求都应该：
- 使用 `Content-Type: application/json`
- 请求体为有效的JSON格式
- 使用UTF-8编码

### 响应格式

API响应始终为JSON格式，包含以下字段：

```json
{
  "data": {},
  "error": null,
  "metadata": {
    "request_id": "req_123456",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

## 模型列表

### 获取可用模型

获取当前可用的所有AI模型列表。

**请求**

```http
GET /v1/models
```

**响应**

```json
{
  "data": [
    {
      "id": "claude-3.5-sonnet",
      "object": "model",
      "created": 1699564800,
      "owned_by": "anthropic",
      "capabilities": {
        "chat": true,
        "completion": true,
        "function_calling": true
      },
      "context_length": 200000,
      "pricing": {
        "input": 0.003,
        "output": 0.015
      }
    },
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1699564800,
      "owned_by": "openai",
      "capabilities": {
        "chat": true,
        "completion": true,
        "function_calling": true,
        "vision": true
      },
      "context_length": 128000,
      "pricing": {
        "input": 0.005,
        "output": 0.015
      }
    }
  ]
}
```

## 聊天补全

### 创建聊天补全

生成聊天式的文本补全。这是最常用的API端点。

**请求**

```http
POST /v1/chat/completions
```

**参数**

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `model` | string | 是 | 要使用的模型ID |
| `messages` | array | 是 | 对话消息列表 |
| `max_tokens` | integer | 否 | 最大生成token数量 |
| `temperature` | number | 否 | 0-2之间，控制随机性 |
| `stream` | boolean | 否 | 是否流式返回结果 |

**消息格式**

```json
{
  "role": "user|assistant|system",
  "content": "消息内容"
}
```

**示例请求**

```bash
curl -X POST "https://api.i8relay.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3.5-sonnet",
    "messages": [
      {
        "role": "system",
        "content": "你是一个有用的AI助手。"
      },
      {
        "role": "user",
        "content": "请解释什么是机器学习。"
      }
    ],
    "max_tokens": 1000,
    "temperature": 0.7
  }'
```

**示例响应**

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1699564800,
  "model": "claude-3.5-sonnet",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "机器学习是人工智能的一个分支..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

### 流式响应

启用流式响应可以实时获取生成的内容：

```bash
curl -X POST "https://api.i8relay.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "写一首关于AI的诗"}],
    "stream": true
  }'
```

**流式响应格式**

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1699564800,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1699564800,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"在"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1699564800,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"数字"},"finish_reason":null}]}

data: [DONE]
```

## 函数调用

### 定义工具函数

您可以定义工具函数，让AI模型调用外部API或执行特定操作：

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "北京今天天气怎么样？"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "获取指定城市的天气信息",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "城市名称"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "description": "温度单位"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

**函数调用响应**

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1699564800,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"北京\", \"unit\": \"celsius\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}
```

## 图像理解

### 支持图像的模型

某些模型（如 `gpt-4o`）支持图像理解功能：

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "这张图片显示了什么？"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image.jpg"
          }
        }
      ]
    }
  ]
}
```

## 错误处理

### 错误响应格式

当请求出错时，API会返回相应的HTTP状态码和错误信息：

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_api_key",
    "message": "Invalid API key provided",
    "param": null
  }
}
```

### 常见错误码

| HTTP状态码 | 错误类型 | 描述 |
|------------|----------|------|
| 400 | `invalid_request_error` | 请求格式错误 |
| 401 | `authentication_error` | API密钥无效 |
| 429 | `rate_limit_exceeded` | 请求频率超限 |
| 500 | `api_error` | 服务器内部错误 |

### 重试策略

建议实现指数退避重试策略：

```python
import time
import random

def api_request_with_retry(request_func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return request_func()
        except RateLimitError:
            if attempt == max_retries - 1:
                raise
            # 指数退避 + 随机抖动
            delay = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)
```

## 使用限制

### 速率限制

不同模型有不同的速率限制：

| 模型 | 每分钟请求数 | 每分钟token数 |
|------|-------------|---------------|
| `gpt-3.5-turbo` | 3,000 | 40,000 |
| `gpt-4` | 500 | 10,000 |
| `gpt-4o` | 500 | 30,000 |
| `claude-3.5-sonnet` | 1,000 | 40,000 |

### 内容限制

请确保您的内容符合以下要求：

- 不包含有害、非法或不当内容
- 不侵犯他人版权或隐私
- 不用于生成虚假信息或垃圾内容

## SDK 和工具

### 官方SDK

我们提供多种编程语言的官方SDK：

```bash
# Python
pip install i8relay

# JavaScript/TypeScript
npm install @i8relay/sdk

# Go
go get github.com/i8relay/go-sdk

# PHP
composer require i8relay/php-sdk
```

### CLI 工具

```bash
# 安装CLI工具
npm install -g @i8relay/cli

# 使用CLI
i8relay chat "你好，世界！"
```

## 最佳实践

### 1. 提示工程

编写高质量的提示词：

```json
{
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的Python开发者，专注于编写高质量、可维护的代码。请提供详细的解释和最佳实践建议。"
    },
    {
      "role": "user",
      "content": "如何优化这个Python函数的性能？\n\n```python\ndef process_data(data):\n    result = []\n    for item in data:\n        if item > 0:\n            result.append(item * 2)\n    return result\n```"
    }
  ]
}
```

### 2. 成本优化

- 选择合适的模型（平衡性能和成本）
- 设置合理的 `max_tokens` 限制
- 使用流式响应提高用户体验
- 实现请求缓存减少重复调用

### 3. 安全考虑

- 定期轮换API密钥
- 使用环境变量存储敏感信息
- 实施输入验证和输出过滤
- 监控API使用情况和异常

## 支持和反馈

如果您在使用API过程中遇到问题：

- 查看[错误代码参考](/docs/api/errors)
- 访问[开发者社区](https://discord.gg/i8relay)
- 联系[技术支持](/contact?topic=api)

## 更新日志

### v1.2.0 (2025-01-15)
- 新增 `claude-3.5-sonnet` 模型支持
- 优化流式响应性能
- 增加函数调用参数验证

### v1.1.0 (2025-01-01)
- 新增图像理解功能
- 支持批量请求处理
- 改进错误消息可读性

查看完整的[API更新日志](/docs/api/changelog)。