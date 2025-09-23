const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'lib/database/models/user.ts',
  'lib/database/models/plan.ts',
  'lib/database/models/config.ts',
  'lib/database/models/session.ts',
  'lib/database/models/usage.ts',
  'lib/database/models/plan-category.ts'
];

// 修复规则
const fixes = [
  // 修复 .changes 的比较
  { pattern: /result\.changes === 0/g, replacement: '(result.changes ?? 0) === 0' },
  { pattern: /result\.changes > 0/g, replacement: '(result.changes ?? 0) > 0' },
  { pattern: /result\.changes < /g, replacement: '(result.changes ?? 0) < ' },
  { pattern: /result\.changes >= /g, replacement: '(result.changes ?? 0) >= ' },
  { pattern: /result\.changes <= /g, replacement: '(result.changes ?? 0) <= ' },
  { pattern: /!result\.changes/g, replacement: '!(result.changes ?? 0)' },

  // 修复直接返回 .changes 的情况
  { pattern: /return result\.changes;/g, replacement: 'return result.changes ?? 0;' },

  // 修复其他变量名的 .changes
  { pattern: /(\w+)\.changes === 0/g, replacement: '($1.changes ?? 0) === 0' },
  { pattern: /(\w+)\.changes > 0/g, replacement: '($1.changes ?? 0) > 0' },
  { pattern: /!(\w+)\.changes/g, replacement: '!($1.changes ?? 0)' },
];

console.log('🔧 开始修复数据库类型安全问题...');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let hasChanges = false;

  fixes.forEach(fix => {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 已修复: ${filePath}`);
  } else {
    console.log(`✓  无需修复: ${filePath}`);
  }
});

console.log('🎉 数据库类型安全修复完成！');