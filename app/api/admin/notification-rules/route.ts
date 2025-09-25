import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

// 获取所有通知规则
export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取查询参数
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const enabled = url.searchParams.get('enabled');

    const result = await getNotificationRules({ type, enabled });
    return createAuthResponse(result, '通知规则获取成功');

  } catch (error) {
    console.error('获取通知规则错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取通知规则失败'), 500);
  }
}

// 创建新的通知规则
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 解析请求体
    const body = await request.json();
    const {
      name,
      description,
      type,
      triggerCondition,
      templateId,
      targetScope,
      targetUsers,
      isEnabled,
      cooldownMinutes
    } = body;

    // 验证必填字段
    if (!name || !type || !triggerCondition || !templateId) {
      return createErrorResponse(new Error('名称、类型、触发条件和模板ID不能为空'), 400);
    }

    // 如果是指定用户但没有提供用户列表，则报错
    if (targetScope === 'specific_users' && (!targetUsers || targetUsers.length === 0)) {
      return createErrorResponse(new Error('选择指定用户时必须提供用户列表'), 400);
    }

    const result = await createNotificationRule({
      name,
      description,
      type,
      triggerCondition,
      templateId,
      targetScope: targetScope || 'all_users',
      targetUsers,
      isEnabled: isEnabled !== false,
      cooldownMinutes: cooldownMinutes || 60,
      createdBy: auth.user.id
    });

    return createAuthResponse(result, '通知规则创建成功');

  } catch (error) {
    console.error('创建通知规则错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('创建通知规则失败'), 500);
  }
}

// 获取通知规则列表
async function getNotificationRules(filter: {
  type?: string | null;
  enabled?: string | null;
}) {
  const db = await getDb();

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (filter.type) {
    whereClause += ' AND r.rule_type = ?';
    params.push(filter.type);
  }

  if (filter.enabled !== null) {
    whereClause += ' AND r.is_enabled = ?';
    params.push(filter.enabled === 'true' ? 1 : 0);
  }

  const query = `
    SELECT
      r.id,
      r.rule_name,
      r.description,
      r.rule_type,
      r.trigger_condition as triggerCondition,
      r.template_id as templateId,
      r.target_scope as targetScope,
      r.target_users as targetUsers,
      r.is_enabled as isEnabled,
      r.cooldown_minutes as cooldownMinutes,
      r.created_by as createdBy,
      r.created_at as createdAt,
      r.updated_at as updatedAt,
      t.template_name as templateName,
      t.title as templateTitle,
      t.template_type as templateType,
      t.template_priority as templatePriority,
      u.username as createdByUsername
    FROM notification_rules r
    LEFT JOIN notification_templates t ON r.template_id = t.id
    LEFT JOIN users u ON r.created_by = u.id
    ${whereClause}
    ORDER BY r.created_at DESC
  `;

  const rules = await db.all(query, params);

  // 转换数据格式
  const formattedRules = rules.map((rule: any) => ({
    id: rule.id,
    name: rule.rule_name,
    description: rule.description,
    type: rule.rule_type,
    triggerCondition: rule.triggerCondition ? JSON.parse(rule.triggerCondition) : {},
    templateId: rule.templateId,
    targetScope: rule.targetScope,
    targetUsers: rule.targetUsers ? JSON.parse(rule.targetUsers) : null,
    isEnabled: rule.isEnabled === 1,
    cooldownMinutes: rule.cooldownMinutes,
    createdBy: rule.createdBy,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    template: {
      name: rule.templateName,
      title: rule.templateTitle,
      type: rule.templateType,
      priority: rule.templatePriority
    },
    createdByUsername: rule.createdByUsername
  }));

  return formattedRules;
}

// 创建新的通知规则
async function createNotificationRule(data: {
  name: string;
  description?: string;
  type: string;
  triggerCondition: any;
  templateId: string;
  targetScope: string;
  targetUsers?: string[];
  isEnabled: boolean;
  cooldownMinutes: number;
  createdBy: string;
}) {
  const db = await getDb();

  const id = 'rule_' + Math.random().toString(36).substr(2, 9);

  await db.run(`
    INSERT INTO notification_rules (
      id, rule_name, description, rule_type, trigger_condition, template_id,
      target_scope, target_users, is_enabled, cooldown_minutes, created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    data.name,
    data.description || null,
    data.type,
    JSON.stringify(data.triggerCondition),
    data.templateId,
    data.targetScope,
    data.targetUsers ? JSON.stringify(data.targetUsers) : null,
    data.isEnabled ? 1 : 0,
    data.cooldownMinutes,
    data.createdBy
  ]);

  return {
    id,
    ...data,
    createdAt: new Date().toISOString()
  };
}