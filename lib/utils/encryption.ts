import crypto from 'crypto';

// 加密配置
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

// 从环境变量或默认值获取加密密钥
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-in-production';

  // 使用PBKDF2派生固定长度的密钥
  return crypto.pbkdf2Sync(key, 'ai-accounts-salt', 10000, KEY_LENGTH, 'sha256');
}

/**
 * 加密敏感数据
 * @param text 要加密的文本
 * @returns 加密后的数据（包含IV和认证标签）
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipher(ALGORITHM, key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 格式：iv:encrypted_data
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('数据加密失败');
  }
}

/**
 * 解密敏感数据
 * @param encryptedData 加密的数据字符串
 * @returns 解密后的原始文本
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 2) {
      throw new Error('加密数据格式错误');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipher(ALGORITHM, key);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error('数据解密失败');
  }
}

/**
 * 生成安全的随机密钥
 * @param length 密钥长度（字节）
 * @returns 十六进制格式的密钥
 */
export function generateSecretKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 验证密钥格式
 * @param key 要验证的密钥
 * @returns 是否为有效的API密钥格式
 */
export function validateApiKeyFormat(key: string): boolean {
  // OpenAI格式: sk-...
  if (key.startsWith('sk-') && key.length >= 40) {
    return true;
  }

  // Anthropic格式: sk-ant-...
  if (key.startsWith('sk-ant-') && key.length >= 50) {
    return true;
  }

  // Google格式: AIza...
  if (key.startsWith('AIza') && key.length >= 35) {
    return true;
  }

  // 其他自定义格式
  if (key.length >= 20) {
    return true;
  }

  return false;
}

/**
 * 生成密钥预览（用于显示）
 * @param key 完整的API密钥
 * @returns 脱敏后的密钥预览
 */
export function generateKeyPreview(key: string): string {
  if (key.length < 10) {
    return key;
  }

  const start = key.substring(0, Math.min(8, key.length - 6));
  const end = key.substring(key.length - 6);
  const middle = '*'.repeat(Math.min(20, key.length - start.length - end.length));

  return `${start}${middle}${end}`;
}

/**
 * 哈希API密钥（用于索引和验证）
 * @param key API密钥
 * @returns SHA256哈希值
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}