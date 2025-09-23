#!/usr/bin/env tsx

import bcrypt from 'bcryptjs';
import { getDb } from '../lib/database/connection';

async function seedRealisticData() {
  console.log('🌱 开始填充真实数据...');

  const db = await getDb();

  // 暂时禁用外键约束
  await db.run('PRAGMA foreign_keys = OFF');

  try {
    // 1. 清理现有数据（保留管理员）
    console.log('🧹 清理现有数据...');
    await db.run(`DELETE FROM billing_records WHERE user_id != 'admin-001'`);
    await db.run(`DELETE FROM usage_logs WHERE user_id != 'admin-001'`);
    await db.run(`DELETE FROM user_subscriptions WHERE user_id != 'admin-001'`);
    await db.run(`DELETE FROM users WHERE id != 'admin-001'`);
    await db.run('DELETE FROM plans');

    // 2. 创建套餐数据
    console.log('📦 创建套餐数据...');

    const plans = [
      // Claude Code 系列
      {
        id: 'claude-code-free',
        name: 'claude-code-free',
        display_name: 'Claude Code 体验版',
        description: '适合初学者和个人开发者体验AI编程助手的基础功能',
        price: 0,
        duration_days: 30,
        tokens_limit: 10000,
        requests_limit: 100,
        models: JSON.stringify(['gpt-3.5-turbo']),
        features: JSON.stringify(['基础代码补全', '简单问答', '社区支持', '基础模型访问']),
        priority_support: false,
        is_popular: false,
        is_active: true,
        sort_order: 1,
        category_id: 'claude-code'
      },
      {
        id: 'claude-code-basic',
        name: 'claude-code-basic',
        display_name: 'Claude Code 基础版',
        description: '个人开发者的理想选择，提供完整的AI编程助手功能',
        price: 29,
        duration_days: 30,
        tokens_limit: 100000,
        requests_limit: 1000,
        models: JSON.stringify(['gpt-3.5-turbo', 'claude-3-haiku']),
        features: JSON.stringify(['高级代码补全', '代码重构建议', '邮件支持', '多模型访问', '代码解释']),
        priority_support: false,
        is_popular: false,
        is_active: true,
        sort_order: 2,
        category_id: 'claude-code'
      },
      {
        id: 'claude-code-standard',
        name: 'claude-code-standard',
        display_name: 'Claude Code 标准版',
        description: '小团队和中级开发者的专业选择，功能丰富性价比高',
        price: 99,
        duration_days: 30,
        tokens_limit: 500000,
        requests_limit: 5000,
        models: JSON.stringify(['gpt-3.5-turbo', 'gpt-4o-mini', 'claude-3-haiku', 'claude-3-sonnet']),
        features: JSON.stringify(['智能代码生成', '架构建议', '代码审查', '在线客服', '多模型选择', '项目分析']),
        priority_support: true,
        is_popular: true,
        is_active: true,
        sort_order: 3,
        category_id: 'claude-code'
      },
      {
        id: 'claude-code-pro',
        name: 'claude-code-pro',
        display_name: 'Claude Code 专业版',
        description: '专业开发团队的首选，提供最全面的AI编程助手服务',
        price: 299,
        duration_days: 30,
        tokens_limit: 2000000,
        requests_limit: 20000,
        models: JSON.stringify(['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']),
        features: JSON.stringify(['全功能代码助手', '高级项目分析', '性能优化建议', '优先支持', '团队协作功能', '定制化服务']),
        priority_support: true,
        is_popular: false,
        is_active: true,
        sort_order: 4,
        category_id: 'claude-code'
      },

      // CodeX 系列
      {
        id: 'codex-starter',
        name: 'codex-starter',
        display_name: 'CodeX 入门版',
        description: '代码转换和优化入门级服务，适合学习和小项目',
        price: 19,
        duration_days: 30,
        tokens_limit: 50000,
        requests_limit: 500,
        models: JSON.stringify(['gpt-3.5-turbo', 'claude-3-haiku']),
        features: JSON.stringify(['代码格式化', '基础重构', '语言转换', '代码优化建议', '基础支持']),
        priority_support: false,
        is_popular: false,
        is_active: true,
        sort_order: 1,
        category_id: 'codex'
      },
      {
        id: 'codex-pro',
        name: 'codex-pro',
        display_name: 'CodeX 专业版',
        description: '高级代码处理和优化服务，适合专业开发团队',
        price: 199,
        duration_days: 30,
        tokens_limit: 1000000,
        requests_limit: 10000,
        models: JSON.stringify(['gpt-3.5-turbo', 'gpt-4o-mini', 'claude-3-haiku', 'claude-3-sonnet']),
        features: JSON.stringify(['智能重构', '性能优化', '安全检查', '多语言支持', '团队功能', '代码质量分析']),
        priority_support: true,
        is_popular: true,
        is_active: true,
        sort_order: 2,
        category_id: 'codex'
      },
      {
        id: 'codex-enterprise',
        name: 'codex-enterprise',
        display_name: 'CodeX 企业版',
        description: '大型企业级代码管理解决方案，无限制使用',
        price: 999,
        duration_days: 30,
        tokens_limit: null,
        requests_limit: null,
        models: JSON.stringify(['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']),
        features: JSON.stringify(['无限制访问', '企业级安全', '私有部署支持', '专属客服', '定制开发', 'SLA保证']),
        priority_support: true,
        is_popular: false,
        is_active: true,
        sort_order: 3,
        category_id: 'codex'
      },

      // API Relay 系列
      {
        id: 'api-relay-basic',
        name: 'api-relay-basic',
        display_name: 'API中转 基础版',
        description: 'API转发和缓存服务，稳定可靠的中转方案',
        price: 39,
        duration_days: 30,
        tokens_limit: 200000,
        requests_limit: 2000,
        models: JSON.stringify(['gpt-3.5-turbo', 'claude-3-haiku']),
        features: JSON.stringify(['API转发', '基础缓存', '流量监控', '基础分析', '99.5%可用性']),
        priority_support: false,
        is_popular: false,
        is_active: true,
        sort_order: 1,
        category_id: 'api-relay'
      },
      {
        id: 'api-relay-advanced',
        name: 'api-relay-advanced',
        display_name: 'API中转 高级版',
        description: '高性能API网关服务，企业级稳定性保障',
        price: 159,
        duration_days: 30,
        tokens_limit: 1500000,
        requests_limit: 15000,
        models: JSON.stringify(['gpt-3.5-turbo', 'gpt-4o-mini', 'claude-3-haiku', 'claude-3-sonnet']),
        features: JSON.stringify(['高级缓存', '负载均衡', '详细分析', '自定义规则', '多区域部署', '99.9%可用性']),
        priority_support: true,
        is_popular: true,
        is_active: true,
        sort_order: 2,
        category_id: 'api-relay'
      },

      // Enterprise 系列
      {
        id: 'enterprise-custom',
        name: 'enterprise-custom',
        display_name: '企业定制版',
        description: '完全定制的企业解决方案，为大型企业量身打造',
        price: 2999,
        duration_days: 30,
        tokens_limit: null,
        requests_limit: null,
        models: JSON.stringify(['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']),
        features: JSON.stringify(['完全定制', '私有云部署', '专属技术团队', '7x24支持', 'SLA保证', '安全认证', '专属服务器']),
        priority_support: true,
        is_popular: false,
        is_active: true,
        sort_order: 1,
        category_id: 'enterprise'
      }
    ];

    for (const plan of plans) {
      try {
        await db.run(`
          INSERT INTO plans (id, name, display_name, description, price, duration_days, tokens_limit, requests_limit, models, features, priority_support, is_popular, is_active, sort_order, category_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          plan.id,
          plan.name,
          plan.display_name,
          plan.description,
          plan.price,
          plan.duration_days,
          plan.tokens_limit,
          plan.requests_limit,
          plan.models,
          plan.features,
          plan.priority_support ? 1 : 0,
          plan.is_popular ? 1 : 0,
          plan.is_active ? 1 : 0,
          plan.sort_order,
          plan.category_id
        ]);
        console.log(`✅ 套餐 ${plan.display_name} 创建成功`);
      } catch (error) {
        console.log(`❌ 套餐 ${plan.display_name} 创建失败:`, (error as Error).message);
      }
    }

    // 3. 创建真实用户数据
    console.log('\n👥 创建用户数据...');

    const users = [
      {
        id: 'user-001',
        username: '张明',
        email: 'zhangming@example.com',
        password: await bcrypt.hash('123456', 10),
        salt: 'salt123',
        role: 'user',
        current_plan_id: 'claude-code-standard',
        balance: 2580.50,
        phone: '13812345678',
        company: '北京科技有限公司',
        total_requests: 1250,
        total_tokens: 45680,
        total_cost: 156.78
      },
      {
        id: 'user-002',
        username: '李小华',
        email: 'lixiaohua@tech.com',
        password: await bcrypt.hash('123456', 10),
        salt: 'salt456',
        role: 'user',
        current_plan_id: 'claude-code-pro',
        balance: 8960.00,
        phone: '13998765432',
        company: '深圳创新科技',
        total_requests: 3890,
        total_tokens: 125600,
        total_cost: 589.20
      },
      {
        id: 'user-003',
        username: '王开发',
        email: 'wangdev@startup.io',
        password: await bcrypt.hash('123456', 10),
        salt: 'salt789',
        role: 'user',
        current_plan_id: 'claude-code-basic',
        balance: 456.80,
        phone: '15612345678',
        company: '创业公司',
        total_requests: 456,
        total_tokens: 12300,
        total_cost: 45.60
      },
      {
        id: 'user-004',
        username: '陈架构师',
        email: 'chen@architect.com',
        password: await bcrypt.hash('123456', 10),
        salt: 'salt101',
        role: 'user',
        current_plan_id: 'codex-enterprise',
        balance: 15200.00,
        phone: '13711111111',
        company: '大型互联网公司',
        total_requests: 8920,
        total_tokens: 256700,
        total_cost: 1250.80
      },
      {
        id: 'user-005',
        username: '刘产品',
        email: 'liu@product.com',
        password: await bcrypt.hash('123456', 10),
        salt: 'salt112',
        role: 'user',
        current_plan_id: 'api-relay-advanced',
        balance: 3280.90,
        phone: '18899998888',
        company: '产品科技公司',
        total_requests: 2340,
        total_tokens: 78900,
        total_cost: 289.50
      },
      {
        id: 'user-006',
        username: '赵前端',
        email: 'zhao@frontend.dev',
        password: await bcrypt.hash('123456', 10),
        salt: 'salt131',
        role: 'user',
        current_plan_id: 'claude-code-standard',
        balance: 1850.30,
        phone: '17766665555',
        company: '前端工作室',
        total_requests: 890,
        total_tokens: 34500,
        total_cost: 123.40
      },
      {
        id: 'user-007',
        username: '周全栈',
        email: 'zhou@fullstack.com',
        password: await bcrypt.hash('123456', 10),
        salt: 'salt151',
        role: 'user',
        current_plan_id: 'codex-pro',
        balance: 6780.20,
        phone: '13644443333',
        company: '全栈开发团队',
        total_requests: 4567,
        total_tokens: 145600,
        total_cost: 445.80
      },
      {
        id: 'user-008',
        username: '孙测试',
        email: 'sun@qa.com',
        password: await bcrypt.hash('123456', 10),
        salt: 'salt171',
        role: 'user',
        current_plan_id: 'claude-code-basic',
        balance: 890.40,
        phone: '15522221111',
        company: '质量保证部',
        total_requests: 234,
        total_tokens: 8900,
        total_cost: 34.60
      }
    ];

    for (const user of users) {
      try {
        // 计算套餐到期时间
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await db.run(`
          INSERT INTO users (id, username, email, password_hash, salt, role, current_plan_id, plan_expires_at, balance, phone, company, total_requests, total_tokens, total_cost, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          user.id,
          user.username,
          user.email,
          user.password,
          user.salt,
          user.role,
          user.current_plan_id,
          expiresAt.toISOString(),
          user.balance,
          user.phone,
          user.company,
          user.total_requests,
          user.total_tokens,
          user.total_cost
        ]);
        console.log(`✅ 用户 ${user.username} (${user.email}) 创建成功`);
      } catch (error) {
        console.log(`❌ 用户 ${user.username} 创建失败:`, (error as Error).message);
      }
    }

    // 4. 创建用户订阅记录
    console.log('\n📋 创建用户订阅记录...');

    const subscriptions = [
      { user_id: 'user-001', plan_id: 'claude-code-standard', status: 'active', start_date: '2025-09-01 00:00:00', end_date: '2025-10-01 00:00:00' },
      { user_id: 'user-002', plan_id: 'claude-code-pro', status: 'active', start_date: '2025-09-01 00:00:00', end_date: '2025-10-01 00:00:00' },
      { user_id: 'user-003', plan_id: 'claude-code-basic', status: 'active', start_date: '2025-09-10 00:00:00', end_date: '2025-10-10 00:00:00' },
      { user_id: 'user-004', plan_id: 'codex-enterprise', status: 'active', start_date: '2025-08-15 00:00:00', end_date: '2025-10-15 00:00:00' },
      { user_id: 'user-005', plan_id: 'api-relay-advanced', status: 'active', start_date: '2025-09-05 00:00:00', end_date: '2025-10-05 00:00:00' },
      { user_id: 'user-006', plan_id: 'claude-code-standard', status: 'active', start_date: '2025-09-12 00:00:00', end_date: '2025-10-12 00:00:00' },
      { user_id: 'user-007', plan_id: 'codex-pro', status: 'active', start_date: '2025-09-03 00:00:00', end_date: '2025-10-03 00:00:00' },
      { user_id: 'user-008', plan_id: 'claude-code-basic', status: 'active', start_date: '2025-09-15 00:00:00', end_date: '2025-10-15 00:00:00' }
    ];

    for (const sub of subscriptions) {
      try {
        await db.run(`
          INSERT INTO user_subscriptions (id, user_id, plan_id, status, start_date, end_date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          Math.random().toString(36).substring(2) + Date.now().toString(36),
          sub.user_id,
          sub.plan_id,
          sub.status,
          sub.start_date,
          sub.end_date
        ]);
        console.log(`✅ 订阅记录: ${sub.user_id} -> ${sub.plan_id}`);
      } catch (error) {
        console.log(`❌ 订阅记录创建失败:`, (error as Error).message);
      }
    }

    // 5. 添加使用记录
    console.log('\n📊 添加使用记录...');

    const endpoints = [
      '/api/chat/completions',
      '/api/code/complete',
      '/api/code/analyze',
      '/api/code/refactor',
      '/api/code/explain',
      '/api/translate',
      '/api/optimize'
    ];

    const userIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006', 'user-007', 'user-008'];

    for (let i = 0; i < 100; i++) {
      const randomUser = userIds[Math.floor(Math.random() * userIds.length)];
      const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const randomDays = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - randomDays);

      const tokensUsed = Math.floor(Math.random() * 5000) + 100;
      const cost = (tokensUsed * 0.002).toFixed(4);

      try {
        await db.run(`
          INSERT INTO usage_logs (id, user_id, endpoint, method, tokens_used, cost, response_time, status_code, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          Math.random().toString(36).substring(2) + Date.now().toString(36),
          randomUser,
          randomEndpoint,
          'POST',
          tokensUsed,
          cost,
          Math.floor(Math.random() * 2000) + 100,
          200,
          date.toISOString()
        ]);

        if (i % 20 === 0) {
          console.log(`✅ 已添加 ${i + 1} 条使用记录`);
        }
      } catch (error) {
        console.log(`❌ 使用记录添加失败:`, (error as Error).message);
      }
    }

    // 6. 添加账单记录
    console.log('\n💰 添加账单记录...');

    const billingRecords = [
      { user_id: 'user-001', type: 'subscription', amount: 99.00, description: 'Claude Code 标准版 - 月付', status: 'completed', transaction_id: 'txn_001' },
      { user_id: 'user-002', type: 'subscription', amount: 299.00, description: 'Claude Code 专业版 - 月付', status: 'completed', transaction_id: 'txn_002' },
      { user_id: 'user-003', type: 'subscription', amount: 29.00, description: 'Claude Code 基础版 - 月付', status: 'completed', transaction_id: 'txn_003' },
      { user_id: 'user-004', type: 'subscription', amount: 999.00, description: 'CodeX 企业版 - 月付', status: 'completed', transaction_id: 'txn_004' },
      { user_id: 'user-005', type: 'subscription', amount: 159.00, description: 'API中转 高级版 - 月付', status: 'completed', transaction_id: 'txn_005' },
      { user_id: 'user-001', type: 'recharge', amount: 500.00, description: '账户充值', status: 'completed', transaction_id: 'txn_006' },
      { user_id: 'user-002', type: 'recharge', amount: 1000.00, description: '账户充值', status: 'completed', transaction_id: 'txn_007' },
      { user_id: 'user-003', type: 'usage', amount: -15.60, description: 'API 使用费用扣除', status: 'completed', transaction_id: 'txn_008' },
      { user_id: 'user-004', type: 'refund', amount: 50.00, description: '服务补偿', status: 'completed', transaction_id: 'txn_009' },
      { user_id: 'user-006', type: 'subscription', amount: 99.00, description: 'Claude Code 标准版 - 月付', status: 'completed', transaction_id: 'txn_010' },
      { user_id: 'user-007', type: 'subscription', amount: 199.00, description: 'CodeX 专业版 - 月付', status: 'completed', transaction_id: 'txn_011' },
      { user_id: 'user-008', type: 'subscription', amount: 29.00, description: 'Claude Code 基础版 - 月付', status: 'completed', transaction_id: 'txn_012' }
    ];

    for (const record of billingRecords) {
      try {
        await db.run(`
          INSERT INTO billing_records (id, user_id, type, amount, description, status, transaction_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          Math.random().toString(36).substring(2) + Date.now().toString(36),
          record.user_id,
          record.type,
          record.amount,
          record.description,
          record.status,
          record.transaction_id
        ]);
        console.log(`✅ 账单记录: ${record.description} - ¥${record.amount}`);
      } catch (error) {
        console.log(`❌ 账单记录添加失败:`, (error as Error).message);
      }
    }

  } finally {
    // 重新启用外键约束
    await db.run('PRAGMA foreign_keys = ON');
  }

  console.log('\n🎉 真实数据填充完成！');
  console.log('\n📋 数据统计:');

  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  const planCount = await db.get('SELECT COUNT(*) as count FROM plans');
  const usageCount = await db.get('SELECT COUNT(*) as count FROM usage_logs');
  const billingCount = await db.get('SELECT COUNT(*) as count FROM billing_records');
  const subscriptionCount = await db.get('SELECT COUNT(*) as count FROM user_subscriptions');

  console.log(`- 用户总数: ${(userCount as any)?.count}`);
  console.log(`- 套餐总数: ${(planCount as any)?.count}`);
  console.log(`- 订阅记录: ${(subscriptionCount as any)?.count}`);
  console.log(`- 使用记录: ${(usageCount as any)?.count}`);
  console.log(`- 账单记录: ${(billingCount as any)?.count}`);

  console.log('\n📝 测试用户账户信息:');
  console.log('🔹 邮箱: zhangming@example.com | 密码: 123456 (Claude Code 标准版，余额¥2580.50)');
  console.log('🔸 邮箱: lixiaohua@tech.com | 密码: 123456 (Claude Code 专业版，余额¥8960.00)');
  console.log('🔹 邮箱: chen@architect.com | 密码: 123456 (CodeX 企业版，余额¥15200.00)');
  console.log('🔸 邮箱: liu@product.com | 密码: 123456 (API中转 高级版，余额¥3280.90)');
  console.log('👑 邮箱: admin@i8relay.com | 密码: admin123 (系统管理员)');

  console.log('\n🚀 现在可以使用这些账户登录系统测试各种功能！');
}

seedRealisticData().catch(console.error);