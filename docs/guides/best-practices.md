---
title: "最佳实践指南"
description: "使用 i8Relay 和 AI 工具的最佳实践，提升开发效率和代码质量"
---

# 最佳实践指南

本指南汇总了使用 i8Relay 和 AI 工具的最佳实践，帮助您构建更高效、更可靠的应用程序。

## 提示工程最佳实践

### 1. 明确的角色定义

为AI模型定义清晰的角色和背景：

```javascript
const systemPrompt = `你是一个资深的软件架构师，具有15年的经验，专精于：
- 微服务架构设计
- 分布式系统
- 性能优化
- 安全最佳实践

请以专业、详细但易懂的方式回答问题，提供实际的代码示例。`;
```

### 2. 结构化提示

使用结构化的提示格式：

```markdown
# 任务描述
请帮我设计一个用户认证系统

# 需求
- 支持邮箱/密码登录
- JWT token认证
- 密码重置功能
- 社交登录集成

# 约束条件
- 必须支持横向扩展
- 响应时间 < 200ms
- 安全性要求高

# 期望输出
- 系统架构图
- 核心代码实现
- 安全考虑事项
```

### 3. 示例驱动

提供具体的输入输出示例：

```python
def generate_api_docs(function_code):
    prompt = f"""
请为以下函数生成API文档：

```python
{function_code}
```

期望输出格式：
## 函数名称
**描述**: 简短描述
**参数**:
- param1 (type): 描述
**返回值**: type - 描述
**示例**:
```python
# 使用示例
```
"""

    return client.chat.completions.create(
        model="claude-3.5-sonnet",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000
    )
```

## 模型选择策略

### 根据任务选择模型

| 任务类型 | 推荐模型 | 原因 |
|----------|----------|------|
| 代码生成/调试 | `claude-3.5-sonnet` | 编程能力强，逻辑清晰 |
| 创意写作 | `gpt-4o` | 创造力强，文风自然 |
| 数据分析 | `gpt-4-turbo` | 分析能力强，支持大上下文 |
| 快速问答 | `gpt-3.5-turbo` | 响应快速，成本低 |

### 动态模型选择

```python
class SmartModelSelector:
    def __init__(self):
        self.model_capabilities = {
            'code': ['claude-3.5-sonnet', 'gpt-4o'],
            'creative': ['gpt-4o', 'gpt-4-turbo'],
            'analysis': ['gpt-4-turbo', 'claude-3.5-sonnet'],
            'chat': ['gpt-3.5-turbo', 'gpt-4o']
        }

    def select_model(self, task_type, complexity='medium'):
        models = self.model_capabilities.get(task_type, ['gpt-3.5-turbo'])

        if complexity == 'high':
            return models[0]  # 最强模型
        elif complexity == 'low':
            return models[-1]  # 最快/便宜模型
        else:
            return models[0] if len(models) == 1 else models[1]
```

## 错误处理和重试

### 健壮的错误处理

```typescript
import { I8Relay } from '@i8relay/sdk';

class RobustAIClient {
  private client: I8Relay;
  private maxRetries = 3;
  private baseDelay = 1000; // 1秒

  constructor(apiKey: string) {
    this.client = new I8Relay({ apiKey });
  }

  async safeCompletion(params: any): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.client.chat.completions.create(params);
      } catch (error) {
        lastError = error as Error;

        // 不重试的错误类型
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // 指数退避
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);

        console.warn(`尝试 ${attempt} 失败，${delay}ms后重试:`, error.message);
      }
    }

    throw new Error(`所有重试尝试都失败了: ${lastError.message}`);
  }

  private isNonRetryableError(error: any): boolean {
    // API密钥错误、权限错误等不应重试
    return error.status === 401 || error.status === 403 || error.status === 400;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 优雅降级

```javascript
class GracefulAI {
  constructor(primaryModel, fallbackModel) {
    this.primary = primaryModel;
    this.fallback = fallbackModel;
  }

  async generateResponse(prompt) {
    try {
      // 尝试主要模型
      return await this.callModel(this.primary, prompt);
    } catch (error) {
      console.warn('主模型失败，切换到备用模型:', error.message);

      try {
        // 尝试备用模型
        return await this.callModel(this.fallback, prompt);
      } catch (fallbackError) {
        // 返回默认响应
        return {
          content: "抱歉，当前服务不可用，请稍后重试。",
          source: "fallback"
        };
      }
    }
  }

  async callModel(model, prompt) {
    return await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }]
    });
  }
}
```

## 性能优化

### 1. 请求缓存

```python
import hashlib
import json
from functools import lru_cache
import redis

class CachedAIClient:
    def __init__(self, api_key, redis_url=None):
        self.client = I8Relay(api_key=api_key)
        self.redis_client = redis.from_url(redis_url) if redis_url else None
        self.cache_ttl = 3600  # 1小时

    def generate_cache_key(self, params):
        """生成缓存键"""
        # 移除不影响结果的参数
        cache_params = {k: v for k, v in params.items()
                       if k not in ['stream', 'user']}

        content = json.dumps(cache_params, sort_keys=True)
        return f"ai_cache:{hashlib.md5(content.encode()).hexdigest()}"

    async def cached_completion(self, **params):
        cache_key = self.generate_cache_key(params)

        # 尝试从缓存获取
        if self.redis_client:
            cached = self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

        # 调用API
        response = await self.client.chat.completions.create(**params)

        # 存储到缓存
        if self.redis_client and not params.get('stream', False):
            self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(response.dict())
            )

        return response
```

### 2. 批量处理

```javascript
class BatchProcessor {
  constructor(client, batchSize = 5) {
    this.client = client;
    this.batchSize = batchSize;
    this.queue = [];
    this.processing = false;
  }

  async addRequest(prompt) {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      try {
        // 并行处理批次
        const promises = batch.map(({ prompt }) =>
          this.client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
          })
        );

        const results = await Promise.all(promises);

        // 返回结果
        batch.forEach(({ resolve }, index) => {
          resolve(results[index]);
        });
      } catch (error) {
        // 处理错误
        batch.forEach(({ reject }) => {
          reject(error);
        });
      }
    }

    this.processing = false;
  }
}
```

### 3. 流式处理优化

```typescript
class StreamOptimizer {
  async processLargeDocument(document: string, chunkSize = 2000) {
    const chunks = this.splitDocument(document, chunkSize);
    const results: string[] = [];

    for (const chunk of chunks) {
      const stream = await client.chat.completions.create({
        model: 'claude-3.5-sonnet',
        messages: [
          { role: 'system', content: '请总结以下文档片段的要点：' },
          { role: 'user', content: chunk }
        ],
        stream: true
      });

      let summary = '';
      for await (const part of stream) {
        const content = part.choices[0]?.delta?.content || '';
        summary += content;

        // 实时反馈给用户
        this.onProgress?.(content, results.length, chunks.length);
      }

      results.push(summary);
    }

    return this.combineSummaries(results);
  }

  private splitDocument(text: string, maxLength: number): string[] {
    const sentences = text.split(/[.!?]+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }
}
```

## 监控和分析

### 使用指标监控

```python
import time
import logging
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class RequestMetrics:
    model: str
    tokens_used: int
    latency_ms: int
    success: bool
    cost_estimate: float

class AIMetricsCollector:
    def __init__(self):
        self.metrics: List[RequestMetrics] = []
        self.logger = logging.getLogger(__name__)

    def track_request(self, model: str):
        """装饰器：跟踪API请求"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                start_time = time.time()

                try:
                    result = await func(*args, **kwargs)
                    success = True
                    tokens = result.usage.total_tokens
                except Exception as e:
                    success = False
                    tokens = 0
                    raise
                finally:
                    latency = (time.time() - start_time) * 1000
                    cost = self.estimate_cost(model, tokens)

                    metric = RequestMetrics(
                        model=model,
                        tokens_used=tokens,
                        latency_ms=latency,
                        success=success,
                        cost_estimate=cost
                    )

                    self.metrics.append(metric)
                    self.logger.info(f"API调用: {metric}")

                return result
            return wrapper
        return decorator

    def get_summary(self) -> Dict:
        if not self.metrics:
            return {}

        total_requests = len(self.metrics)
        successful_requests = sum(1 for m in self.metrics if m.success)
        total_tokens = sum(m.tokens_used for m in self.metrics)
        total_cost = sum(m.cost_estimate for m in self.metrics)
        avg_latency = sum(m.latency_ms for m in self.metrics) / total_requests

        return {
            'total_requests': total_requests,
            'success_rate': successful_requests / total_requests,
            'total_tokens': total_tokens,
            'total_cost': total_cost,
            'average_latency_ms': avg_latency,
            'cost_per_request': total_cost / total_requests if total_requests > 0 else 0
        }
```

## 测试策略

### 单元测试

```python
import unittest
from unittest.mock import Mock, patch
import pytest

class TestAIIntegration(unittest.TestCase):
    def setUp(self):
        self.client = Mock()
        self.ai_service = AIService(self.client)

    def test_successful_completion(self):
        # 模拟成功响应
        mock_response = Mock()
        mock_response.choices[0].message.content = "测试响应"
        self.client.chat.completions.create.return_value = mock_response

        result = self.ai_service.generate_response("测试提示")

        self.assertEqual(result, "测试响应")
        self.client.chat.completions.create.assert_called_once()

    def test_api_error_handling(self):
        # 模拟API错误
        self.client.chat.completions.create.side_effect = Exception("API错误")

        with self.assertRaises(Exception):
            self.ai_service.generate_response("测试提示")

    @patch('time.sleep')  # 跳过重试延迟
    def test_retry_mechanism(self):
        # 测试重试机制
        self.client.chat.completions.create.side_effect = [
            Exception("临时错误"),
            Mock(choices=[Mock(message=Mock(content="成功响应"))])
        ]

        result = self.ai_service.generate_response_with_retry("测试提示")

        self.assertEqual(result, "成功响应")
        self.assertEqual(self.client.chat.completions.create.call_count, 2)
```

### 集成测试

```javascript
// tests/integration/ai-service.test.js
const { AIService } = require('../../src/ai-service');

describe('AI Service Integration Tests', () => {
  let aiService;

  beforeAll(() => {
    aiService = new AIService(process.env.TEST_API_KEY);
  });

  test('should generate valid code', async () => {
    const prompt = "创建一个JavaScript函数来计算数组平均值";

    const response = await aiService.generateCode(prompt);

    expect(response).toContain('function');
    expect(response).toContain('array');

    // 验证生成的代码可以执行
    const generatedFunction = eval(`(${response})`);
    expect(typeof generatedFunction).toBe('function');

    const testResult = generatedFunction([1, 2, 3, 4, 5]);
    expect(testResult).toBe(3);
  }, 30000); // 30秒超时

  test('should handle rate limiting gracefully', async () => {
    const promises = Array(100).fill().map(() =>
      aiService.generateResponse("简短回答: 什么是AI?")
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled');

    // 至少应该有一些成功的请求
    expect(successful.length).toBeGreaterThan(0);
  });
});
```

## 部署和运维

### 配置管理

```yaml
# config/production.yaml
ai_service:
  api_key: ${AI_API_KEY}
  base_url: "https://api.i8relay.com"
  timeout: 30000
  retry:
    max_attempts: 3
    base_delay: 1000
  models:
    default: "gpt-3.5-turbo"
    premium: "gpt-4o"
    coding: "claude-3.5-sonnet"
  rate_limits:
    requests_per_minute: 1000
    tokens_per_minute: 50000
  monitoring:
    enable_metrics: true
    log_level: "info"
    alert_thresholds:
      error_rate: 0.05
      avg_latency: 5000
```

### 健康检查

```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/health")
async def health_check():
    try:
        # 测试AI服务连接
        test_response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1
        )

        return JSONResponse({
            "status": "healthy",
            "ai_service": "operational",
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "ai_service": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
```

## 总结

遵循这些最佳实践可以帮助您：

1. **提高可靠性** - 通过错误处理和重试机制
2. **优化性能** - 通过缓存、批处理和模型选择
3. **降低成本** - 通过智能模型选择和资源优化
4. **增强可维护性** - 通过良好的代码结构和测试
5. **确保安全性** - 通过适当的监控和配置管理

记住，AI集成是一个持续优化的过程。定期review您的实现，根据实际使用情况调整策略，始终关注用户体验和系统性能。

## 相关资源

- [API参考文档](/docs/api/overview)
- [错误处理指南](/docs/guides/error-handling)
- [性能优化技巧](/docs/guides/performance)
- [安全最佳实践](/docs/article/security)