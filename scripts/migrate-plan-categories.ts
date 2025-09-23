import { getDb } from '../lib/database/connection';
import fs from 'fs';
import path from 'path';

async function migratePlanCategories() {
  const db = await getDb();

  console.log('开始执行套餐分组迁移...');

  try {
    // 读取迁移SQL文件
    const migrationPath = path.join(process.cwd(), 'database/migrations/add_plan_categories.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // 分割SQL语句并执行
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`执行: ${statement.substring(0, 50)}...`);
        await db.run(statement);
      }
    }

    console.log('套餐分组迁移完成！');

    // 验证迁移结果
    console.log('\n验证迁移结果:');

    const categories = await db.all('SELECT * FROM plan_categories ORDER BY sort_order');
    console.log('分组数量:', categories.length);
    categories.forEach(cat => {
      console.log(`- ${cat.display_name} (${cat.id})`);
    });

    const plansWithCategories = await db.all(`
      SELECT p.id, p.display_name, p.category_id, pc.display_name as category_name
      FROM plans p
      LEFT JOIN plan_categories pc ON p.category_id = pc.id
    `);
    console.log('\n套餐分组关联:');
    plansWithCategories.forEach(plan => {
      console.log(`- ${plan.display_name}: ${plan.category_name || '未分组'}`);
    });

  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

// 运行迁移
if (require.main === module) {
  migratePlanCategories().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('迁移执行失败:', error);
    process.exit(1);
  });
}

export { migratePlanCategories };