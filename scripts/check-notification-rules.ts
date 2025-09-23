import { getDb } from '../lib/database/connection';

async function checkNotificationRules() {
  try {
    const db = await getDb();

    console.log('📋 检查通知规则和模板...\n');

    // 检查模板
    const templates = await db.all('SELECT id, name, type FROM notification_templates ORDER BY name');
    console.log('💌 通知模板:');
    templates.forEach(template => {
      console.log(`  - ${template.id}: ${template.name} (${template.type})`);
    });

    console.log('\n📜 通知规则:');
    const rules = await db.all('SELECT id, name, type, is_enabled FROM notification_rules ORDER BY name');
    rules.forEach(rule => {
      console.log(`  - ${rule.id}: ${rule.name} (${rule.type}) ${rule.is_enabled ? '✅' : '❌'}`);
    });

    console.log('\n🔍 需要的模板类型:');
    const neededTypes = ['balance_low', 'subscription_expiring', 'usage_limit', 'payment_failed', 'login_security'];
    neededTypes.forEach(type => {
      const template = templates.find(t => t.id.includes(type));
      const rule = rules.find(r => r.type === type);
      console.log(`  - ${type}: 模板${template ? '✅' : '❌'} 规则${rule ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkNotificationRules();