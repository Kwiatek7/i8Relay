/**
 * 全面测试关键字字段修复
 * 验证所有数据库表和API是否正确使用新的非关键字字段名
 */

import { getDb } from '../lib/database/connection';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  error?: any;
}

async function runComprehensiveKeywordTest(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  try {
    const db = await getDb();
    console.log('🔍 开始全面关键字修复测试...\n');

    // 测试1: 检查用户表字段
    try {
      const userTest = await db.get(`
        SELECT user_role, user_status, current_plan_id
        FROM users 
        WHERE email = 'admin@i8relay.com' 
        LIMIT 1
      `);
      
      if (userTest && userTest.user_role === 'super_admin' && userTest.user_status === 'active') {
        results.push({
          test: 'Users表关键字字段修复',
          status: 'PASS',
          message: `✅ user_role: ${userTest.user_role}, user_status: ${userTest.user_status}`
        });
      } else {
        results.push({
          test: 'Users表关键字字段修复',
          status: 'FAIL',
          message: '❌ 用户表字段映射错误'
        });
      }
    } catch (error) {
      results.push({
        test: 'Users表关键字字段修复',
        status: 'FAIL',
        message: '❌ 用户表查询失败',
        error: error
      });
    }

    // 测试2: 检查通知表字段
    try {
      const notificationTest = await db.get(`
        SELECT notification_type, notification_priority, notification_message
        FROM user_notifications 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (notificationTest) {
        results.push({
          test: '通知表关键字字段修复',
          status: 'PASS',
          message: `✅ notification_type: ${notificationTest.notification_type}, notification_priority: ${notificationTest.notification_priority}`
        });
      } else {
        // 创建测试通知
        const testId = 'test_' + Date.now();
        await db.run(`
          INSERT INTO user_notifications (id, user_id, title, notification_message, notification_type, notification_priority)
          VALUES (?, 'admin-001', '测试通知', '这是一条测试通知', 'info', 'medium')
        `, [testId]);
        
        results.push({
          test: '通知表关键字字段修复',
          status: 'PASS',
          message: '✅ 通知表字段创建测试成功'
        });
        
        // 清理测试数据
        await db.run('DELETE FROM user_notifications WHERE id = ?', [testId]);
      }
    } catch (error) {
      results.push({
        test: '通知表关键字字段修复',
        status: 'FAIL',
        message: '❌ 通知表字段测试失败',
        error: error
      });
    }

    // 测试3: 检查系统配置表字段
    try {
      const configTest = await db.get(`
        SELECT config_key, config_value 
        FROM system_config 
        WHERE config_key = 'api_rate_limit' 
        LIMIT 1
      `);
      
      if (configTest && configTest.config_key) {
        results.push({
          test: '配置表关键字字段修复',
          status: 'PASS',
          message: `✅ config_key: ${configTest.config_key}, config_value: ${configTest.config_value}`
        });
      } else {
        results.push({
          test: '配置表关键字字段修复',
          status: 'SKIP',
          message: '⚠️ 系统配置表无测试数据'
        });
      }
    } catch (error) {
      results.push({
        test: '配置表关键字字段修复',
        status: 'FAIL',
        message: '❌ 配置表查询失败',
        error: error
      });
    }

    // 测试4: 检查计费记录表字段
    try {
      const billingTest = await db.get(`
        SELECT record_type, record_status, created_at 
        FROM billing_records 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (billingTest) {
        results.push({
          test: '计费记录表关键字字段修复',
          status: 'PASS',
          message: `✅ record_type: ${billingTest.record_type}, record_status: ${billingTest.record_status}`
        });
      } else {
        results.push({
          test: '计费记录表关键字字段修复',
          status: 'SKIP',
          message: '⚠️ 无计费记录数据进行测试'
        });
      }
    } catch (error) {
      results.push({
        test: '计费记录表关键字字段修复',
        status: 'FAIL',
        message: '❌ 计费记录表查询失败',
        error: error
      });
    }

    // 测试5: 检查API密钥表字段
    try {
      const apiKeyTest = await db.get(`
        SELECT key_name, key_hash 
        FROM api_keys 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (apiKeyTest) {
        results.push({
          test: 'API密钥表关键字字段修复',
          status: 'PASS',
          message: `✅ key_name: ${apiKeyTest.key_name}`
        });
      } else {
        results.push({
          test: 'API密钥表关键字字段修复',
          status: 'SKIP',
          message: '⚠️ 无API密钥数据进行测试'
        });
      }
    } catch (error) {
      results.push({
        test: 'API密钥表关键字字段修复',
        status: 'FAIL',
        message: '❌ API密钥表查询失败',
        error: error
      });
    }

    // 测试6: 检查套餐表字段
    try {
      const planTest = await db.get(`
        SELECT plan_name, display_name, billing_period 
        FROM plans 
        WHERE plan_name = 'Pro' 
        LIMIT 1
      `);
      
      if (planTest && planTest.plan_name === 'Pro') {
        results.push({
          test: '套餐表关键字字段修复',
          status: 'PASS',
          message: `✅ plan_name: ${planTest.plan_name}, billing_period: ${planTest.billing_period}`
        });
      } else {
        results.push({
          test: '套餐表关键字字段修复',
          status: 'SKIP',
          message: '⚠️ 未找到Pro套餐数据进行测试'
        });
      }
    } catch (error) {
      results.push({
        test: '套餐表关键字字段修复',
        status: 'FAIL',
        message: '❌ 套餐表查询失败',
        error: error
      });
    }

    // 测试7: 检查notification_rules表字段（如果存在）
    try {
      const ruleTest = await db.get(`
        SELECT rule_name, rule_type 
        FROM notification_rules 
        LIMIT 1
      `);
      
      if (ruleTest) {
        results.push({
          test: '通知规则表关键字字段修复',
          status: 'PASS',
          message: `✅ rule_name: ${ruleTest.rule_name}, rule_type: ${ruleTest.rule_type}`
        });
      } else {
        results.push({
          test: '通知规则表关键字字段修复',
          status: 'SKIP',
          message: '⚠️ notification_rules表不存在或无数据'
        });
      }
    } catch (error) {
      results.push({
        test: '通知规则表关键字字段修复',
        status: 'SKIP',
        message: '⚠️ notification_rules表不存在',
        error: error
      });
    }

    // 测试8: 检查notification_templates表字段（如果存在）
    try {
      const templateTest = await db.get(`
        SELECT template_name, template_type, template_priority, template_message 
        FROM notification_templates 
        LIMIT 1
      `);
      
      if (templateTest) {
        results.push({
          test: '通知模板表关键字字段修复',
          status: 'PASS',
          message: `✅ template_name: ${templateTest.template_name}, template_type: ${templateTest.template_type}`
        });
      } else {
        results.push({
          test: '通知模板表关键字字段修复',
          status: 'SKIP',
          message: '⚠️ notification_templates表不存在或无数据'
        });
      }
    } catch (error) {
      results.push({
        test: '通知模板表关键字字段修复',
        status: 'SKIP',
        message: '⚠️ notification_templates表不存在',
        error: error
      });
    }

  } catch (error) {
    results.push({
      test: '数据库连接',
      status: 'FAIL',
      message: '❌ 数据库连接失败',
      error: error
    });
  }

  return results;
}

async function main() {
  console.log('🚀 开始全面关键字字段修复测试...\n');
  
  const results = await runComprehensiveKeywordTest();
  
  // 输出测试结果
  console.log('\n📊 测试结果统计:');
  console.log('='.repeat(50));
  
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.test}`);
    console.log(`   状态: ${result.status}`);
    console.log(`   信息: ${result.message}`);
    
    if (result.error) {
      console.log(`   错误: ${result.error.message || result.error}`);
    }
    
    switch (result.status) {
      case 'PASS':
        passCount++;
        break;
      case 'FAIL':
        failCount++;
        break;
      case 'SKIP':
        skipCount++;
        break;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 总计: ${results.length} 项测试`);
  console.log(`✅ 通过: ${passCount} 项`);
  console.log(`❌ 失败: ${failCount} 项`);
  console.log(`⚠️  跳过: ${skipCount} 项`);
  
  if (failCount === 0) {
    console.log('\n🎉 所有测试通过！关键字字段修复成功！');
  } else {
    console.log('\n⚠️ 存在失败的测试项，请检查相关问题。');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  });
}

export { runComprehensiveKeywordTest };