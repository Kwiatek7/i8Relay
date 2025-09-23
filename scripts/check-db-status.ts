import { getDb } from '../lib/database/connection';

async function checkDbStatus() {
  const db = await getDb();

  console.log('检查数据库状态...');

  try {
    // 检查所有表
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('数据库中的表:');
    tables.forEach(table => {
      console.log(`- ${table.name}`);
    });

    // 检查plan_categories表是否存在
    const planCategoriesExists = tables.some(table => table.name === 'plan_categories');
    console.log(`\nplan_categories表是否存在: ${planCategoriesExists}`);

    // 检查plans表结构
    const plansTableInfo = await db.all("PRAGMA table_info(plans)");
    console.log('\nplans表结构:');
    plansTableInfo.forEach(column => {
      console.log(`- ${column.name}: ${column.type}`);
    });

    const hasCategoryId = plansTableInfo.some(column => column.name === 'category_id');
    console.log(`\nplans表是否有category_id字段: ${hasCategoryId}`);

  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkDbStatus().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('执行失败:', error);
  process.exit(1);
});