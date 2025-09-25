#!/usr/bin/env tsx

/**
 * 全面测试所有数据库关键字修复
 * 验证用户创建、通知系统、账单记录等功能
 */

import { getDb } from '../lib/database/connection';

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  message: string;
  error?: any;
}

const results: TestResult[] = [];

function addResult(test: string, status: 'pass' | 'fail', message: string, error?: any) {
  results.push({ test, status, message, error });
  console.log(`${status === 'pass' ? '✅' : '❌'} ${test}: ${message}`);
  if (error) {
    console.error(`   错误详情: ${error.message || error}`);
  }
}

async function testUserCreation() {
  console.log('\n🧪 测试用户创建功能...');
  const db = await getDb();
  
  try {
    // 测试创建用户（包含所有修复的字段名）
    const testUserId = 'test-' + Date.now();
    const testEmail = `test-${Date.now()}@example.com`;
    
    await db.run(`
      INSERT INTO users (
        id, username, email, password_hash, salt, 
        user_role, user_status, current_plan_id,
        balance, api_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testUserId,
      '测试用户',
      testEmail,
      'test_hash',
      'test_salt',
      'user',
      'active',
      null, // 用户创建时无套餐
      0.00,
      'sk-test-' + Date.now(),
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    // 验证用户是否创建成功
    const user = await db.get(`
      SELECT id, user_role, user_status, current_plan_id 
      FROM users WHERE id = ?
    `, [testUserId]);

    if (user && user.user_role === 'user' && user.user_status === 'active' && user.current_plan_id === null) {
      addResult('用户创建', 'pass', '成功创建用户，字段映射正确');
      
      // 清理测试数据
      await db.run('DELETE FROM users WHERE id = ?', [testUserId]);
    } else {
      addResult('用户创建', 'fail', '用户创建后字段值不正确');
    }
    
  } catch (error) {
    addResult('用户创建', 'fail', '用户创建失败', error);
  }
}

async function testNotificationSystem() {
  console.log('\n🧪 测试通知系统...');
  const db = await getDb();
  
  try {
    // 测试系统通知查询
    const notifications = await db.all(`
      SELECT id, title, content, notification_type, target_type, is_active
      FROM system_notifications 
      WHERE notification_type = 'info'
      LIMIT 1
    `);
    
    if (notifications && notifications.length > 0) {
      addResult('系统通知查询', 'pass', '成功查询系统通知，notification_type字段正常');
    } else {
      addResult('系统通知查询', 'fail', '系统通知查询失败或无数据');
    }

    // 测试用户通知插入（如果有用户的话）
    const testUser = await db.get('SELECT id FROM users LIMIT 1');
    if (testUser) {
      const notificationId = 'test-notif-' + Date.now();
      
      await db.run(`
        INSERT INTO user_notifications (
          id, user_id, title, notification_message, notification_type, notification_priority, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        notificationId,
        testUser.id,
        '测试通知',
        '这是一个测试通知',
        'info',
        'medium',
        0
      ]);

      // 验证通知是否插入成功
      const notification = await db.get(`
        SELECT notification_type FROM user_notifications WHERE id = ?
      `, [notificationId]);

      if (notification && notification.notification_type === 'info') {
        addResult('用户通知插入', 'pass', '成功插入用户通知，notification_type字段正常');
        
        // 清理测试数据
        await db.run('DELETE FROM user_notifications WHERE id = ?', [notificationId]);
      } else {
        addResult('用户通知插入', 'fail', '用户通知插入后字段值不正确');
      }
    }
    
  } catch (error) {
    addResult('通知系统', 'fail', '通知系统测试失败', error);
  }
}

async function testBillingRecords() {
  console.log('\n🧪 测试账单记录系统...');
  const db = await getDb();
  
  try {
    // 测试账单记录查询
    const records = await db.all(`
      SELECT id, record_type, amount, currency, record_status
      FROM billing_records 
      WHERE record_type IN ('subscription', 'topup', 'usage')
      LIMIT 3
    `);
    
    if (records && records.length > 0) {
      addResult('账单记录查询', 'pass', `成功查询账单记录，record_type字段正常 (找到${records.length}条)`);
    } else {
      addResult('账单记录查询', 'pass', '账单记录查询正常（暂无数据）');
    }

    // 测试账单记录插入
    const testUser = await db.get('SELECT id FROM users LIMIT 1');
    if (testUser) {
      const billingId = 'test-bill-' + Date.now();
      
      await db.run(`
        INSERT INTO billing_records (
          id, user_id, record_type, amount, currency, description, record_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        billingId,
        testUser.id,
        'topup',
        10.00,
        'CNY',
        '测试充值',
        'completed',
        new Date().toISOString()
      ]);

      // 验证记录是否插入成功
      const record = await db.get(`
        SELECT record_type, record_status FROM billing_records WHERE id = ?
      `, [billingId]);

      if (record && record.record_type === 'topup' && record.record_status === 'completed') {
        addResult('账单记录插入', 'pass', '成功插入账单记录，record_type和record_status字段正常');
        
        // 清理测试数据
        await db.run('DELETE FROM billing_records WHERE id = ?', [billingId]);
      } else {
        addResult('账单记录插入', 'fail', '账单记录插入后字段值不正确');
      }
    }
    
  } catch (error) {
    addResult('账单记录', 'fail', '账单记录测试失败', error);
  }
}

async function testConfigSystem() {
  console.log('\n🧪 测试配置系统...');
  const db = await getDb();
  
  try {
    // 测试系统配置查询（使用修复后的字段名）
    const configs = await db.all(`
      SELECT category, config_key, config_value, data_type
      FROM system_config 
      WHERE category = 'site' AND config_key = 'name'
      LIMIT 1
    `);
    
    if (configs && configs.length > 0) {
      addResult('配置系统查询', 'pass', '成功查询配置，config_key和config_value字段正常');
    } else {
      addResult('配置系统查询', 'fail', '配置系统查询失败');
    }
    
  } catch (error) {
    addResult('配置系统', 'fail', '配置系统测试失败', error);
  }
}

async function testPlanSystem() {
  console.log('\n🧪 测试套餐系统...');
  const db = await getDb();
  
  try {
    // 测试套餐查询（使用修复后的字段名）
    const plans = await db.all(`
      SELECT id, plan_name, category_id
      FROM plans 
      LIMIT 3
    `);
    
    if (plans && plans.length > 0) {
      addResult('套餐系统查询', 'pass', `成功查询套餐，plan_name字段正常 (找到${plans.length}个套餐)`);
    } else {
      addResult('套餐系统查询', 'fail', '套餐系统查询失败');
    }

    // 测试套餐分类查询
    const categories = await db.all(`
      SELECT id, category_name, display_name
      FROM plan_categories 
      LIMIT 3
    `);
    
    if (categories && categories.length > 0) {
      addResult('套餐分类查询', 'pass', `成功查询套餐分类，category_name字段正常 (找到${categories.length}个分类)`);
    } else {
      addResult('套餐分类查询', 'fail', '套餐分类查询失败');
    }
    
  } catch (error) {
    addResult('套餐系统', 'fail', '套餐系统测试失败', error);
  }
}

async function testKeywordsResolution() {
  console.log('\n🧪 测试关键字冲突解决...');
  const db = await getDb();
  
  try {
    // 测试所有修复过的关键字字段
    const keywordTests = [
      { table: 'users', field: 'user_role', desc: 'role关键字' },
      { table: 'users', field: 'user_status', desc: 'status关键字' },
      { table: 'system_config', field: 'config_key', desc: 'key关键字' },
      { table: 'system_config', field: 'config_value', desc: 'value关键字' },
      { table: 'billing_records', field: 'record_type', desc: 'type关键字' },
      { table: 'billing_records', field: 'created_at', desc: 'date关键字（使用created_at）' },
      { table: 'plans', field: 'plan_name', desc: 'name关键字' },
      { table: 'system_notifications', field: 'content', desc: 'message关键字（使用content）' },
      { table: 'user_notifications', field: 'notification_priority', desc: 'priority关键字（用户通知）' },
      { table: 'system_notifications', field: 'notification_type', desc: 'type关键字' }
    ];

    let passCount = 0;
    for (const test of keywordTests) {
      try {
        const result = await db.get(`SELECT ${test.field} FROM ${test.table} LIMIT 1`);
        addResult(`${test.desc}修复`, 'pass', `${test.table}.${test.field}字段查询正常`);
        passCount++;
      } catch (error) {
        addResult(`${test.desc}修复`, 'fail', `${test.table}.${test.field}字段查询失败`, error);
      }
    }

    if (passCount === keywordTests.length) {
      addResult('关键字冲突解决', 'pass', `所有${passCount}个关键字字段修复成功`);
    } else {
      addResult('关键字冲突解决', 'fail', `${keywordTests.length - passCount}个字段仍有问题`);
    }
    
  } catch (error) {
    addResult('关键字冲突解决', 'fail', '关键字测试失败', error);
  }
}

async function main() {
  console.log('🚀 开始全面测试数据库关键字修复...\n');

  try {
    await testUserCreation();
    await testNotificationSystem();
    await testBillingRecords();
    await testConfigSystem();
    await testPlanSystem();
    await testKeywordsResolution();
    
    // 统计结果
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    
    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过: ${passCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`📈 成功率: ${Math.round((passCount / results.length) * 100)}%`);
    
    if (failCount === 0) {
      console.log('\n🎉 所有关键字修复测试通过！数据库兼容性问题已解决。');
    } else {
      console.log('\n⚠️  仍有一些问题需要处理:');
      results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`   - ${r.test}: ${r.message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}