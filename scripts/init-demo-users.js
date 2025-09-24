/**
 * 初始化演示用户脚本
 * 在浏览器控制台中运行此脚本来创建默认演示账号
 */

const initDemoUsers = () => {
  const demoUsers = [
    {
      id: 'demo-admin-001',
      username: '管理员',
      email: 'admin@demo.com',
      plan: 'pro',
      balance: 500.00,
      apiKey: 'sk-demo-admin-key-001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-user-001',
      username: '演示用户',
      email: 'user@demo.com',
      plan: 'basic',
      balance: 100.00,
      apiKey: 'sk-demo-user-key-001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-dev-001',
      username: '开发者',
      email: 'dev@demo.com',
      plan: 'claude-code-free',
      balance: 50.00,
      apiKey: 'sk-demo-dev-key-001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // 保存到 localStorage
  localStorage.setItem('mock_users', JSON.stringify(demoUsers));

  console.log('✅ 演示用户创建成功！');
  console.log('📝 可用登录账号：');
  demoUsers.forEach(user => {
    console.log(`   邮箱: ${user.email} | 密码: demo123 | 套餐: ${user.plan}`);
  });
  console.log('\n🔄 请刷新页面后使用这些账号登录');
};

// 如果在 Node.js 环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initDemoUsers };
} else {
  // 在浏览器中直接执行
  initDemoUsers();
}