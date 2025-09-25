import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { getDb } from '../../../../../lib/database/connection';

// 获取单个通知规则
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const { id } = await params;
    const result = await getNotificationRuleById(id);
    if (!result) {
      return createErrorResponse(new Error('通知规则不存在'), 404);
    }

    return createAuthResponse(result, '通知规则获取成功');

  } catch (error) {
    console.error('获取通知规则错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取通知规则失败'), 500);
  }
}

// 更新通知规则
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const result = await updateNotificationRule(id, {
      name,
      description,
      type,
      triggerCondition,
      templateId,
      targetScope,
      targetUsers,
      isEnabled,
      cooldownMinutes
    });

    if (!result) {
      return createErrorResponse(new Error('通知规则不存在'), 404);
    }

    return createAuthResponse(result, '通知规则更新成功');

  } catch (error) {
    console.error('更新通知规则错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('更新通知规则失败'), 500);
  }
}

// 删除通知规则
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const { id } = await params;
    const result = await deleteNotificationRule(id);
    if (!result) {
      return createErrorResponse(new Error('通知规则不存在'), 404);
    }

    return createAuthResponse({ id }, '通知规则删除成功');

  } catch (error) {
    console.error('删除通知规则错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('删除通知规则失败'), 500);
  }
}

// 获取单个通知规则详情
async function getNotificationRuleById(id: string) {
  const db = await getDb();

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
      t.template_message as templateMessage,
      t.template_type as templateType,
      t.template_priority as templatePriority,
      t.action_url as templateActionUrl,
      t.variables as templateVariables,
      u.username as createdByUsername
    FROM notification_rules r
    LEFT JOIN notification_templates t ON r.template_id = t.id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.id = ?
  `;

  const rule = await db.get(query, [id]);

  if (!rule) return null;

  return {
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
      id: rule.templateId,
      name: rule.templateName,
      title: rule.templateTitle,
      message: rule.templateMessage,
      type: rule.templateType,
      priority: rule.templatePriority,
      actionUrl: rule.templateActionUrl,
      variables: rule.templateVariables ? JSON.parse(rule.templateVariables) : {}
    },
    createdByUsername: rule.createdByUsername
  };
}

// 更新通知规则
async function updateNotificationRule(id: string, data: {
  name: string;
  description?: string;
  type: string;
  triggerCondition: any;
  templateId: string;
  targetScope: string;
  targetUsers?: string[];
  isEnabled: boolean;
  cooldownMinutes: number;
}) {
  const db = await getDb();

  // 检查规则是否存在
  const existing = await db.get('SELECT id FROM notification_rules WHERE id = ?', [id]);
  if (!existing) return null;

  await db.run(`
    UPDATE notification_rules SET
      rule_name = ?,
      description = ?,
      rule_type = ?,
      trigger_condition = ?,
      template_id = ?,
      target_scope = ?,
      target_users = ?,
      is_enabled = ?,
      cooldown_minutes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    data.name,
    data.description || null,
    data.type,
    JSON.stringify(data.triggerCondition),
    data.templateId,
    data.targetScope,
    data.targetUsers ? JSON.stringify(data.targetUsers) : null,
    data.isEnabled ? 1 : 0,
    data.cooldownMinutes,
    id
  ]);

  return {
    id,
    ...data,
    updatedAt: new Date().toISOString()
  };
}

// 删除通知规则
async function deleteNotificationRule(id: string) {
  const db = await getDb();

  // 检查规则是否存在
  const existing = await db.get('SELECT id FROM notification_rules WHERE id = ?', [id]);
  if (!existing) return null;

  await db.run('DELETE FROM notification_rules WHERE id = ?', [id]);

  return true;
}