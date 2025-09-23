#!/usr/bin/env tsx

import bcrypt from 'bcryptjs';
import { getDb } from '../lib/database/connection';

async function seedRealisticData() {
  console.log('🌱 开始填充真实数据...');

  const db = await getDb();

  // 1. 清理现有的测试用户（保留管理员）
  await db.run(`DELETE FROM users WHERE email NOT LIKE '%admin%' AND role != 'super_admin'`);

  // 2. 创建真实用户数据
  const users = [
    {
      username: '张明',
      email: 'zhangming@example.com',
      password: await bcrypt.hash('123456', 10),
      role: 'user',
      plan: 'Claude Code 标准版',
      balance: 2580.50,
      phone: '13812345678',
      company: '北京科技有限公司'
    },
    {
      username: '李小华',
      email: 'lixiaohua@tech.com',
      password: await bcrypt.hash('123456', 10),
      role: 'user',
      plan: 'Claude Code 专业版',
      balance: 8960.00,
      phone: '13998765432',
      company: '深圳创新科技'
    },
    {
      username: '王开发',
      email: 'wangdev@startup.io',
      password: await bcrypt.hash('123456', 10),
      role: 'user',
      plan: 'Claude Code 基础版',
      balance: 456.80,
      phone: '15612345678',
      company: '创业公司'
    },
    {
      username: '陈架构师',
      email: 'chen@architect.com',
      password: await bcrypt.hash('123456', 10),
      role: 'user',
      plan: 'CodeX 企业版',
      balance: 15200.00,
      phone: '13711111111',
      company: '大型互联网公司'
    },
    {
      username: '刘产品',
      email: 'liu@product.com',
      password: await bcrypt.hash('123456', 10),
      role: 'user',
      plan: 'API Relay 高级版',
      balance: 3280.90,
      phone: '18899998888',
      company: '产品科技公司'
    },
    {
      username: '赵前端',
      email: 'zhao@frontend.dev',
      password: await bcrypt.hash('123456', 10),
      role: 'user',
      plan: 'Claude Code 标准版',
      balance: 1850.30,
      phone: '17766665555',
      company: '前端工作室'
    },
    {
      username: '周全栈',
      email: 'zhou@fullstack.com',
      password: await bcrypt.hash('123456', 10),
      role: 'user',
      plan: 'CodeX 专业版',
      balance: 6780.20,
      phone: '13644443333',
      company: '全栈开发团队'
    },
    {
      username: '孙测试',
      email: 'sun@qa.com',
      password: await bcrypt.hash('123456', 10),
      role: 'user',
      plan: 'Claude Code 基础版',
      balance: 890.40,
      phone: '15522221111',
      company: '质量保证部'
    },
    {
      username: '管理员',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      plan: '企业定制版',
      balance: 99999.00,
      phone: '18888888888',
      company: 'AI Proxy 公司'
    }
  ];

  console.log('👥 创建用户数据...');
  for (const user of users) {
    try {
      await db.run(`
        INSERT INTO users (id, username, email, password_hash, role, plan, balance, phone, company, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        Math.random().toString(36).substring(2) + Date.now().toString(36),
        user.username,
        user.email,
        user.password,
        user.role,
        user.plan,
        user.balance,
        user.phone,
        user.company
      ]);
      console.log(`✅ 用户 ${user.username} (${user.email}) 创建成功`);
    } catch (error) {
      console.log(`❌ 用户 ${user.username} 创建失败:`, (error as Error).message);
    }
  }

  // 3. 完善套餐数据
  console.log('\n📦 完善套餐数据...');

  // 获取分类ID
  const categories = await db.all('SELECT * FROM plan_categories');
  const claudeCodeId = categories.find((c: any) => c.name === 'claude-code')?.id;
  const codeXId = categories.find((c: any) => c.name === 'codex')?.id;
  const apiRelayId = categories.find((c: any) => c.name === 'api-relay')?.id;
  const enterpriseId = categories.find((c: any) => c.name === 'enterprise')?.id;

  // 清理现有套餐
  await db.run('DELETE FROM plans');

  const plans = [
    // Claude Code 系列
    {
      name: 'Claude Code 体验版',
      description: '适合初学者和个人开发者',
      price: 0,
      billing_period: 'monthly',
      tokens_limit: 10000,
      requests_limit: 100,
      features: JSON.stringify(['基础代码补全', '简单问答', '社区支持']),
      is_popular: false,
      is_active: true,
      sort_order: 1,
      category_id: claudeCodeId
    },
    {
      name: 'Claude Code 基础版',
      description: '个人开发者的理想选择',
      price: 29,
      billing_period: 'monthly',
      tokens_limit: 100000,
      requests_limit: 1000,
      features: JSON.stringify(['高级代码补全', '代码重构建议', '邮件支持', '基础模型访问']),
      is_popular: false,
      is_active: true,
      sort_order: 2,
      category_id: claudeCodeId
    },
    {
      name: 'Claude Code 标准版',
      description: '小团队和中级开发者',
      price: 99,
      billing_period: 'monthly',
      tokens_limit: 500000,
      requests_limit: 5000,
      features: JSON.stringify(['智能代码生成', '架构建议', '代码审查', '在线客服', '多模型选择']),
      is_popular: true,
      is_active: true,
      sort_order: 3,
      category_id: claudeCodeId
    },
    {
      name: 'Claude Code 专业版',
      description: '专业开发团队',
      price: 299,
      billing_period: 'monthly',
      tokens_limit: 2000000,
      requests_limit: 20000,
      features: JSON.stringify(['全功能代码助手', '项目分析', '性能优化建议', '优先支持', '团队协作功能']),
      is_popular: false,
      is_active: true,
      sort_order: 4,
      category_id: claudeCodeId
    },

    // CodeX 系列
    {
      name: 'CodeX 入门版',
      description: '代码转换和优化入门',
      price: 19,
      billing_period: 'monthly',
      tokens_limit: 50000,
      requests_limit: 500,
      features: JSON.stringify(['代码格式化', '基础重构', '语言转换', '基础支持']),
      is_popular: false,
      is_active: true,
      sort_order: 1,
      category_id: codeXId
    },
    {
      name: 'CodeX 专业版',
      description: '高级代码处理和优化',
      price: 199,
      billing_period: 'monthly',
      tokens_limit: 1000000,
      requests_limit: 10000,
      features: JSON.stringify(['智能重构', '性能优化', '安全检查', '多语言支持', '团队功能']),
      is_popular: true,
      is_active: true,
      sort_order: 2,
      category_id: codeXId
    },
    {
      name: 'CodeX 企业版',
      description: '大型企业级代码管理',
      price: 999,
      billing_period: 'monthly',
      tokens_limit: null,
      requests_limit: null,
      features: JSON.stringify(['无限制访问', '企业级安全', '私有部署', '专属客服', '定制开发']),
      is_popular: false,
      is_active: true,
      sort_order: 3,
      category_id: codeXId
    },

    // API Relay 系列
    {
      name: 'API Relay 基础版',
      description: 'API转发和缓存服务',
      price: 39,
      billing_period: 'monthly',
      tokens_limit: 200000,
      requests_limit: 2000,
      features: JSON.stringify(['API转发', '基础缓存', '流量监控', '基础分析']),
      is_popular: false,
      is_active: true,
      sort_order: 1,
      category_id: apiRelayId
    },
    {
      name: 'API Relay 高级版',
      description: '高性能API网关服务',
      price: 159,
      billing_period: 'monthly',
      tokens_limit: 1500000,
      requests_limit: 15000,
      features: JSON.stringify(['高级缓存', '负载均衡', '详细分析', '自定义规则', '多区域部署']),
      is_popular: true,
      is_active: true,
      sort_order: 2,
      category_id: apiRelayId
    },

    // Enterprise 系列
    {
      name: '企业定制版',
      description: '完全定制的企业解决方案',
      price: 2999,
      billing_period: 'monthly',
      tokens_limit: null,
      requests_limit: null,
      features: JSON.stringify(['完全定制', '私有云部署', '专属技术团队', '7x24支持', 'SLA保证', '安全认证']),
      is_popular: false,
      is_active: true,
      sort_order: 1,
      category_id: enterpriseId
    }
  ];

  for (const plan of plans) {
    try {
      await db.run(`
        INSERT INTO plans (id, name, description, price, billing_period, tokens_limit, requests_limit, features, is_popular, is_active, sort_order, category_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        Math.random().toString(36).substring(2) + Date.now().toString(36),
        plan.name,
        plan.description,
        plan.price,
        plan.billing_period,
        plan.tokens_limit,
        plan.requests_limit,
        plan.features,
        plan.is_popular ? 1 : 0,
        plan.is_active ? 1 : 0,
        plan.sort_order,
        plan.category_id
      ]);
      console.log(`✅ 套餐 ${plan.name} 创建成功`);
    } catch (error) {
      console.log(`❌ 套餐 ${plan.name} 创建失败:`, (error as Error).message);
    }
  }

  // 4. 添加使用记录（示例数据）
  console.log('\n📊 添加使用记录...');

  const userIds = await db.all('SELECT id FROM users WHERE role = "user"');
  const usageLogs = [];

  for (let i = 0; i < 50; i++) {
    const randomUser = userIds[Math.floor(Math.random() * userIds.length)];
    const randomDays = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - randomDays);

    usageLogs.push({
      user_id: (randomUser as any).id,
      endpoint: ['/api/chat', '/api/completion', '/api/analysis'][Math.floor(Math.random() * 3)],
      method: 'POST',
      tokens_used: Math.floor(Math.random() * 5000) + 100,
      cost: (Math.random() * 10).toFixed(2),
      response_time: Math.floor(Math.random() * 2000) + 100,
      created_at: date.toISOString()
    });
  }

  for (const [index, log] of usageLogs.entries()) {
    try {
      await db.run(`
        INSERT INTO usage_logs (id, user_id, endpoint, method, tokens_used, cost, response_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        Math.random().toString(36).substring(2) + Date.now().toString(36),
        log.user_id,
        log.endpoint,
        log.method,
        log.tokens_used,
        log.cost,
        log.response_time,
        log.created_at
      ]);
      if (index % 10 === 0) {
        console.log(`✅ 已添加 ${index + 1} 条使用记录`);
      }
    } catch (error) {
      console.log(`❌ 使用记录添加失败:`, (error as Error).message);
    }
  }

  // 5. 添加账单记录
  console.log('\n💰 添加账单记录...');

  const billingRecords = [
    { user_id: (userIds[0] as any)?.id, type: 'subscription', amount: 99.00, description: 'Claude Code 标准版 - 月付', status: 'completed' },
    { user_id: (userIds[1] as any)?.id, type: 'subscription', amount: 299.00, description: 'Claude Code 专业版 - 月付', status: 'completed' },
    { user_id: (userIds[2] as any)?.id, type: 'subscription', amount: 29.00, description: 'Claude Code 基础版 - 月付', status: 'completed' },
    { user_id: (userIds[3] as any)?.id, type: 'subscription', amount: 999.00, description: 'CodeX 企业版 - 月付', status: 'completed' },
    { user_id: (userIds[4] as any)?.id, type: 'subscription', amount: 159.00, description: 'API Relay 高级版 - 月付', status: 'completed' },
    { user_id: (userIds[0] as any)?.id, type: 'recharge', amount: 500.00, description: '账户充值', status: 'completed' },
    { user_id: (userIds[1] as any)?.id, type: 'recharge', amount: 1000.00, description: '账户充值', status: 'completed' },
    { user_id: (userIds[2] as any)?.id, type: 'usage', amount: -15.60, description: 'API 使用费用', status: 'completed' }
  ];

  for (const record of billingRecords) {
    if (record.user_id) {
      try {
        await db.run(`
          INSERT INTO billing_records (id, user_id, type, amount, description, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          Math.random().toString(36).substring(2) + Date.now().toString(36),
          record.user_id,
          record.type,
          record.amount,
          record.description,
          record.status
        ]);
        console.log(`✅ 账单记录: ${record.description} - ¥${record.amount}`);
      } catch (error) {
        console.log(`❌ 账单记录添加失败:`, (error as Error).message);
      }
    }
  }

  console.log('\n🎉 真实数据填充完成！');
  console.log('\n📋 数据统计:');

  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  const planCount = await db.get('SELECT COUNT(*) as count FROM plans');
  const usageCount = await db.get('SELECT COUNT(*) as count FROM usage_logs');
  const billingCount = await db.get('SELECT COUNT(*) as count FROM billing_records');

  console.log(`- 用户总数: ${(userCount as any)?.count}`);
  console.log(`- 套餐总数: ${(planCount as any)?.count}`);
  console.log(`- 使用记录: ${(usageCount as any)?.count}`);
  console.log(`- 账单记录: ${(billingCount as any)?.count}`);
}

seedRealisticData().catch(console.error);