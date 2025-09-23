import { getDb } from '../lib/database/connection';

async function migratePlanCategories() {
  const db = await getDb();

  console.log('开始执行套餐分组迁移...');

  try {
    // 1. 创建套餐分组表
    console.log('1. 创建套餐分组表...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS plan_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT DEFAULT '#3b82f6',
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. 为plans表添加category_id字段
    console.log('2. 为plans表添加category_id字段...');
    try {
      await db.run('ALTER TABLE plans ADD COLUMN category_id TEXT');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('   category_id字段已存在，跳过...');
      } else {
        throw error;
      }
    }

    // 3. 创建索引
    console.log('3. 创建索引...');
    await db.run('CREATE INDEX IF NOT EXISTS idx_plans_category_id ON plans(category_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_plan_categories_sort_order ON plan_categories(sort_order)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_plan_categories_active ON plan_categories(is_active)');

    // 4. 插入默认分组数据
    console.log('4. 插入默认分组数据...');

    const categories = [
      {
        id: 'claude-code',
        name: 'claude-code',
        display_name: 'Claude Code',
        description: '专业的AI编程助手，为开发者提供智能代码生成和优化服务',
        icon: 'Code',
        color: '#6366f1',
        sort_order: 1,
        is_featured: true
      },
      {
        id: 'codex',
        name: 'codex',
        display_name: 'CodeX',
        description: '高性能代码解决方案，适合企业级开发和大型项目',
        icon: 'Zap',
        color: '#8b5cf6',
        sort_order: 2,
        is_featured: true
      },
      {
        id: 'api-relay',
        name: 'api-relay',
        display_name: 'API中转',
        description: '稳定可靠的API中转服务，支持多种AI模型接口',
        icon: 'Globe',
        color: '#06b6d4',
        sort_order: 3,
        is_featured: false
      },
      {
        id: 'enterprise',
        name: 'enterprise',
        display_name: '企业定制',
        description: '为企业客户量身定制的专属解决方案',
        icon: 'Building',
        color: '#10b981',
        sort_order: 4,
        is_featured: false
      }
    ];

    for (const category of categories) {
      await db.run(`
        INSERT OR REPLACE INTO plan_categories (
          id, name, display_name, description, icon, color, sort_order, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        category.id,
        category.name,
        category.display_name,
        category.description,
        category.icon,
        category.color,
        category.sort_order,
        category.is_featured
      ]);
    }

    // 5. 更新现有套餐的分组
    console.log('5. 更新现有套餐的分组...');

    // Claude Code 分组
    await db.run("UPDATE plans SET category_id = 'claude-code' WHERE id IN ('free', 'basic')");

    // CodeX 分组
    await db.run("UPDATE plans SET category_id = 'codex' WHERE id IN ('standard', 'pro')");

    // API中转 分组
    await db.run("UPDATE plans SET category_id = 'api-relay' WHERE id = 'shared'");

    console.log('套餐分组迁移完成！');

    // 验证迁移结果
    console.log('\n验证迁移结果:');

    const categories_result = await db.all('SELECT * FROM plan_categories ORDER BY sort_order');
    console.log('分组数量:', categories_result.length);
    categories_result.forEach(cat => {
      console.log(`- ${cat.display_name} (${cat.id}) - ${cat.is_featured ? '特色' : '普通'}`);
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