import { getDb } from '../lib/database/connection';

async function addDemoUsageData() {
  const db = await getDb();

  console.log('开始添加演示使用数据...');

  try {
    // 获取演示用户
    const demoUsers = await db.all('SELECT id FROM users WHERE id LIKE "demo-user-%"');

    if (demoUsers.length === 0) {
      console.log('没有找到演示用户，请先运行种子数据');
      return;
    }

    // 为每个演示用户添加最近7天的使用数据
    for (const user of demoUsers) {
      await addUserUsageData(db, user.id);
    }

    console.log('演示使用数据添加完成！');

  } catch (error) {
    console.error('添加演示使用数据失败:', error);
  }
}

async function addUserUsageData(db: any, userId: string) {
  console.log(`为用户 ${userId} 添加使用数据...`);

  const models = ['gpt-3.5-turbo', 'gpt-4', 'claude-3-haiku', 'claude-3-sonnet', 'claude-3.5-sonnet'];
  const endpoints = ['/v1/chat/completions', '/v1/completions'];

  // 添加最近7天的数据
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // 每天添加10-50个随机请求
    const requestCount = Math.floor(Math.random() * 40) + 10;

    for (let j = 0; j < requestCount; j++) {
      // 生成随机使用数据
      const model = models[Math.floor(Math.random() * models.length)];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

      // 生成合理的token数据
      const inputTokens = Math.floor(Math.random() * 2000) + 100;
      const outputTokens = Math.floor(Math.random() * 1500) + 50;
      const cacheCreationTokens = Math.random() < 0.3 ? Math.floor(Math.random() * 500) : 0; // 30%概率有缓存创建
      const cacheReadTokens = Math.random() < 0.5 ? Math.floor(Math.random() * 300) : 0; // 50%概率有缓存读取
      const totalTokens = inputTokens + outputTokens;

      // 计算费用（基于不同模型的定价）
      let cost = 0;
      switch (model) {
        case 'gpt-3.5-turbo':
          cost = (inputTokens * 0.0015 + outputTokens * 0.002) / 1000;
          break;
        case 'gpt-4':
          cost = (inputTokens * 0.03 + outputTokens * 0.06) / 1000;
          break;
        case 'claude-3-haiku':
          cost = (inputTokens * 0.00025 + outputTokens * 0.00125) / 1000;
          break;
        case 'claude-3-sonnet':
        case 'claude-3.5-sonnet':
          cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
          break;
      }

      // 添加一些随机时间偏移
      const requestTime = new Date(date);
      requestTime.setHours(Math.floor(Math.random() * 24));
      requestTime.setMinutes(Math.floor(Math.random() * 60));
      requestTime.setSeconds(Math.floor(Math.random() * 60));

      // 插入使用记录
      await db.run(`
        INSERT INTO usage_logs (
          id, user_id, request_id, method, endpoint, model,
          input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_tokens,
          status_code, response_time_ms, cost,
          user_agent, ip_address, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        generateId(),
        userId,
        `req-${generateId()}`,
        'POST',
        endpoint,
        model,
        inputTokens,
        outputTokens,
        cacheCreationTokens,
        cacheReadTokens,
        totalTokens,
        200,
        Math.floor(Math.random() * 3000) + 200, // 响应时间 200-3200ms
        cost,
        'Claude-Dashboard/1.0',
        `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        requestTime.toISOString()
      ]);
    }
  }

  console.log(`用户 ${userId} 的使用数据添加完成`);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 运行脚本
if (require.main === module) {
  addDemoUsageData().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

export { addDemoUsageData };