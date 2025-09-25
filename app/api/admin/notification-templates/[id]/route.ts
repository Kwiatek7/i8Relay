import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { getDb } from '../../../../../lib/database/connection';

// 获取单个通知模板
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const { id } = await params;
    const result = await getNotificationTemplateById(id);
    if (!result) {
      return createErrorResponse(new Error('通知模板不存在'), 404);
    }

    return createAuthResponse(result, '通知模板获取成功');

  } catch (error) {
    console.error('获取通知模板错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取通知模板失败'), 500);
  }
}

// 更新通知模板
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
      title,
      message,
      type,
      priority,
      actionUrl,
      variables
    } = body;

    // 验证必填字段
    if (!name || !title || !message) {
      return createErrorResponse(new Error('名称、标题和消息内容不能为空'), 400);
    }

    const { id } = await params;
    const result = await updateNotificationTemplate(id, {
      name,
      title,
      message,
      type,
      priority,
      actionUrl,
      variables
    });

    if (!result) {
      return createErrorResponse(new Error('通知模板不存在'), 404);
    }

    return createAuthResponse(result, '通知模板更新成功');

  } catch (error) {
    console.error('更新通知模板错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('更新通知模板失败'), 500);
  }
}

// 删除通知模板
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const { id } = await params;
    
    // 检查是否有关联的规则
    const db = await getDb();
    const rulesCount = await db.get('SELECT COUNT(*) as count FROM notification_rules WHERE template_id = ?', [id]);
    
    if (rulesCount.count > 0) {
      return createErrorResponse(new Error('无法删除，该模板正被规则使用'), 400);
    }

    const result = await deleteNotificationTemplate(id);
    if (!result) {
      return createErrorResponse(new Error('通知模板不存在'), 404);
    }

    return createAuthResponse({ id }, '通知模板删除成功');

  } catch (error) {
    console.error('删除通知模板错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('删除通知模板失败'), 500);
  }
}

// 获取单个通知模板详情
async function getNotificationTemplateById(id: string) {
  const db = await getDb();

  const query = `
    SELECT
      t.id,
      t.template_name,
      t.title,
      t.template_message,
      t.template_type,
      t.template_priority,
      t.action_url as actionUrl,
      t.variables,
      t.created_at as createdAt,
      t.updated_at as updatedAt,
      COUNT(r.id) as rulesCount
    FROM notification_templates t
    LEFT JOIN notification_rules r ON t.id = r.template_id
    WHERE t.id = ?
    GROUP BY t.id
  `;

  const template = await db.get(query, [id]);

  if (!template) return null;

  return {
    id: template.id,
    name: template.template_name,
    title: template.title,
    message: template.template_message,
    type: template.template_type,
    priority: template.template_priority,
    actionUrl: template.actionUrl,
    variables: template.variables ? JSON.parse(template.variables) : {},
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    rulesCount: template.rulesCount
  };
}

// 更新通知模板
async function updateNotificationTemplate(id: string, data: {
  name: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
  variables?: any;
}) {
  const db = await getDb();

  // 检查模板是否存在
  const existing = await db.get('SELECT id FROM notification_templates WHERE id = ?', [id]);
  if (!existing) return null;

  await db.run(`
    UPDATE notification_templates SET
      template_name = ?,
      title = ?,
      template_message = ?,
      template_type = ?,
      template_priority = ?,
      action_url = ?,
      variables = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    data.name,
    data.title,
    data.message,
    data.type,
    data.priority,
    data.actionUrl || null,
    data.variables ? JSON.stringify(data.variables) : null,
    id
  ]);

  return {
    id,
    ...data,
    updatedAt: new Date().toISOString()
  };
}

// 删除通知模板
async function deleteNotificationTemplate(id: string) {
  const db = await getDb();

  // 检查模板是否存在
  const existing = await db.get('SELECT id FROM notification_templates WHERE id = ?', [id]);
  if (!existing) return null;

  await db.run('DELETE FROM notification_templates WHERE id = ?', [id]);

  return true;
}