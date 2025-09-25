#!/usr/bin/env npx tsx

// 更新AI账号种子数据，使其使用加密存储
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { encrypt, generateKeyPreview, hashApiKey } from '../lib/utils/encryption';

// 示例凭据（实际使用时应该使用真实的API密钥）
const sampleCredentials = {
  'sk-encrypted_basic_key_001': 'sk-test-basic-openai-key-001-replace-with-real-key-abc123',
  'sk-encrypted_basic_key_002': 'sk-test-basic-openai-key-002-replace-with-real-key-def456',
  'sk-encrypted_basic_key_003': 'sk-test-basic-openai-key-003-replace-with-real-key-ghi789',
  'sk-encrypted_std_key_001': 'sk-test-standard-openai-key-001-replace-with-real-key-jkl012',
  'sk-encrypted_std_key_002': 'sk-test-standard-openai-key-002-replace-with-real-key-mno345',
  'sk-encrypted_std_key_003': 'sk-test-standard-openai-key-003-replace-with-real-key-pqr678',
  'sk-encrypted_premium_key_001': 'sk-test-premium-openai-key-001-replace-with-real-key-stu901',

  'sk-ant-encrypted_basic_key_001': 'sk-ant-test-basic-claude-key-001-replace-with-real-key-abc123',
  'sk-ant-encrypted_basic_key_002': 'sk-ant-test-basic-claude-key-002-replace-with-real-key-def456',
  'sk-ant-encrypted_std_key_001': 'sk-ant-test-standard-claude-key-001-replace-with-real-key-ghi789',
  'sk-ant-encrypted_std_key_002': 'sk-ant-test-standard-claude-key-002-replace-with-real-key-jkl012',
  'sk-ant-encrypted_premium_key_001': 'sk-ant-test-premium-claude-key-001-replace-with-real-key-mno345',

  'AIza-encrypted_basic_key_001': 'AIzaTest-basic-gemini-key-001-replace-with-real-key',
  'AIza-encrypted_basic_key_002': 'AIzaTest-basic-gemini-key-002-replace-with-real-key',
  'AIza-encrypted_std_key_001': 'AIzaTest-standard-gemini-key-001-replace-with-real-key'
};

function generateEncryptedSeedData() {
  console.log('开始生成加密的种子数据...');

  const encryptedData: Array<{
    placeholder: string;
    encrypted: string;
    hash: string;
    preview: string;
  }> = [];

  // 为每个示例凭据生成加密数据
  Object.entries(sampleCredentials).forEach(([placeholder, realKey]) => {
    try {
      const encrypted = encrypt(realKey);
      const hash = hashApiKey(realKey);
      const preview = generateKeyPreview(realKey);

      encryptedData.push({
        placeholder,
        encrypted,
        hash,
        preview
      });

      console.log(`✓ 已加密: ${placeholder} -> ${preview}`);
    } catch (error) {
      console.error(`✗ 加密失败: ${placeholder}`, error);
    }
  });

  return encryptedData;
}

function updateSeedFile() {
  const seedPath = join(process.cwd(), 'database/ai-accounts-seed.sql');
  let content = readFileSync(seedPath, 'utf-8');

  console.log('\n更新种子数据文件...');

  const encryptedData = generateEncryptedSeedData();

  // 更新INSERT语句，添加加密字段
  encryptedData.forEach(({ placeholder, encrypted, hash, preview }) => {
    // 替换凭据占位符为加密值
    content = content.replace(
      new RegExp(`'${placeholder}'`, 'g'),
      `'${encrypted}'`
    );
  });

  // 在INSERT语句中添加hash和preview字段的注释
  const insertNote = `
-- 注意：在生产环境中使用时：
-- 1. 将示例凭据替换为真实的API密钥
-- 2. 运行 npx tsx scripts/encrypt-seed-credentials.ts 重新加密
-- 3. 确保设置了 ENCRYPTION_KEY 环境变量

`;

  content = insertNote + content;

  // 备份原文件
  const backupPath = seedPath + '.backup';
  writeFileSync(backupPath, readFileSync(seedPath, 'utf-8'));
  console.log(`✓ 原文件已备份到: ${backupPath}`);

  // 写入更新后的文件
  writeFileSync(seedPath, content);
  console.log(`✓ 种子数据文件已更新: ${seedPath}`);

  // 生成凭据映射文件供参考
  const mappingPath = join(process.cwd(), 'database/credentials-mapping.json');
  const mapping = encryptedData.reduce((acc, { placeholder, hash, preview }) => {
    acc[placeholder] = { hash, preview };
    return acc;
  }, {} as Record<string, { hash: string; preview: string }>);

  writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`✓ 凭据映射已保存到: ${mappingPath}`);

  console.log('\n🔐 加密种子数据生成完成！');
  console.log('⚠️  重要提醒：');
  console.log('   1. 请将示例API密钥替换为真实密钥');
  console.log('   2. 设置 ENCRYPTION_KEY 环境变量');
  console.log('   3. 不要将真实密钥提交到代码仓库');
}

// 如果直接运行此脚本
if (require.main === module) {
  try {
    updateSeedFile();
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}

export { generateEncryptedSeedData, updateSeedFile };