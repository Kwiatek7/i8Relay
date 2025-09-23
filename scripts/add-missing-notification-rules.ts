import { getDb } from '../lib/database/connection';

async function addMissingNotificationRules() {
  try {
    const db = await getDb();

    console.log('🔧 添加缺失的通知规则...\n');

    // 添加支付失败通知规则
    const paymentFailedRuleId = 'rule_payment_failed';
    const paymentFailedRule = await db.get('SELECT id FROM notification_rules WHERE id = ?', [paymentFailedRuleId]);

    if (!paymentFailedRule) {
      await db.run(`
        INSERT INTO notification_rules (
          id, name, description, type, trigger_condition, template_id,
          target_scope, is_enabled, cooldown_minutes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        paymentFailedRuleId,
        '支付失败自动通知',
        '当支付失败时自动通知用户',
        'payment_failed',
        '{}', // 支付失败总是触发，无需特殊条件
        'tpl_payment_failed',
        'all_users',
        1, // 启用
        60, // 1小时冷却
        'admin-001'
      ]);
      console.log('✅ 添加支付失败通知规则');
    } else {
      console.log('ℹ️ 支付失败通知规则已存在');
    }

    // 添加异常登录通知规则
    const loginSecurityRuleId = 'rule_login_security';
    const loginSecurityRule = await db.get('SELECT id FROM notification_rules WHERE id = ?', [loginSecurityRuleId]);

    if (!loginSecurityRule) {
      await db.run(`
        INSERT INTO notification_rules (
          id, name, description, type, trigger_condition, template_id,
          target_scope, is_enabled, cooldown_minutes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        loginSecurityRuleId,
        '异常登录自动检查',
        '检测到可能的异常登录时通知用户',
        'login_security',
        '{}', // 异常登录检测基于业务逻辑，无需特殊条件
        'tpl_login_security',
        'all_users',
        1, // 启用
        1440, // 24小时冷却（避免同一天多次登录都发送通知）
        'admin-001'
      ]);
      console.log('✅ 添加异常登录通知规则');
    } else {
      console.log('ℹ️ 异常登录通知规则已存在');
    }

    // 验证添加结果
    console.log('\n📋 更新后的通知规则:');
    const allRules = await db.all('SELECT id, name, type, is_enabled FROM notification_rules ORDER BY name');
    allRules.forEach(rule => {
      console.log(`  - ${rule.id}: ${rule.name} (${rule.type}) ${rule.is_enabled ? '✅' : '❌'}`);
    });

    console.log('\n🎉 通知规则更新完成！');

  } catch (error) {
    console.error('❌ 添加通知规则失败:', error);
  }
}

addMissingNotificationRules();