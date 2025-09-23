const { User } = require('../lib/database/models/user');
const { Plan } = require('../lib/database/models/plan');
const { PlanCategory } = require('../lib/database/models/plan-category');

async function viewData() {
  console.log('=== 用户数据 ===');
  try {
    const users = await User.findAll();
    console.log(`用户总数: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - 余额: ¥${user.balance} - 套餐: ${user.plan}`);
    });
  } catch (e) {
    console.log('用户查询错误:', e.message);
  }

  console.log('\n=== 套餐分类 ===');
  try {
    const categories = await PlanCategory.findAll();
    console.log(`分类总数: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`- ${cat.display_name} (${cat.name}) - 颜色: ${cat.color} - 特色: ${cat.is_featured ? '是' : '否'}`);
    });
  } catch (e) {
    console.log('套餐分类查询错误:', e.message);
  }

  console.log('\n=== 套餐数据 ===');
  try {
    const plans = await Plan.findAll();
    console.log(`套餐总数: ${plans.length}`);
    plans.forEach(plan => {
      console.log(`- ${plan.name} - ¥${plan.price}/${plan.billing_period} - Tokens: ${plan.tokens_limit || '无限'} - ${plan.is_active ? '启用' : '禁用'}`);
    });
  } catch (e) {
    console.log('套餐查询错误:', e.message);
  }

  console.log('\n=== 按分组查看套餐 ===');
  try {
    const groupedPlans = await Plan.findGroupedPlans();
    groupedPlans.forEach(group => {
      console.log(`\n【${group.display_name}】(${group.plans.length}个套餐)`);
      group.plans.forEach(plan => {
        console.log(`  - ${plan.name}: ¥${plan.price}/${plan.billing_period}`);
      });
    });
  } catch (e) {
    console.log('分组套餐查询错误:', e.message);
  }
}

viewData().catch(console.error);