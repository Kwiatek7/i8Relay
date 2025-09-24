import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../lib/auth/middleware';
import { getDb } from '../../../lib/database/connection';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取用户的API密钥列表
    const apiKeys = await getUserApiKeys(auth.user.id);

    return createAuthResponse(apiKeys, 'API密钥列表获取成功');

  } catch (error) {
    console.error('获取API密钥列表错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取API密钥列表失败'), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取请求数据
    const body = await request.json();
    const { name, permissions = [] } = body;

    if (!name || typeof name !== 'string') {
      return createErrorResponse(new Error('API密钥名称不能为空'), 400);
    }

    // 创建新的API密钥
    const apiKey = await createApiKey(auth.user.id, name, permissions);

    return createAuthResponse(apiKey, 'API密钥创建成功');

  } catch (error) {
    console.error('创建API密钥错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('创建API密钥失败'), 500);
  }
}

async function getUserApiKeys(userId: string) {
  const db = await getDb();

  try {
    const apiKeys = await db.all(
      `SELECT
        id,
        name,
        key_preview,
        permissions,
        last_used_at,
        is_active,
        created_at
       FROM api_keys
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return apiKeys.map(key => ({
      ...key,
      permissions: key.permissions ? JSON.parse(key.permissions) : []
    }));

  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

async function createApiKey(userId: string, name: string, permissions: string[]) {
  const db = await getDb();

  try {
    // 生成API密钥
    const apiKey = `sk-${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = apiKey.substring(0, 8) + '...';
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // 插入数据库
    await db.run(
      `INSERT INTO api_keys (
        id, user_id, name, key_hash, key_preview, permissions, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        name,
        keyHash,
        keyPrefix,
        JSON.stringify(permissions),
        true,
        now,
        now
      ]
    );

    return {
      id,
      name,
      key: apiKey, // 只在创建时返回完整密钥
      key_preview: keyPrefix,
      permissions,
      is_active: true,
      created_at: now
    };

  } catch (error) {
    console.error('Database insert error:', error);
    throw new Error('创建API密钥失败');
  }
}