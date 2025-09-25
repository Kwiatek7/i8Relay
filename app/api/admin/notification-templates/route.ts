import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

// 获取所有通知模板
export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const result = await getNotificationTemplates();
    return createAuthResponse(result, '通知模板获取成功');

  } catch (error) {
    console.error('获取通知模板错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取通知模板失败'), 500);
  }
}

// 创建新的通知模板
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

    const result = await createNotificationTemplate({
      name,
      title,
      message,
      type: type || 'info',
      priority: priority || 'medium',
      actionUrl,
      variables
    });

    return createAuthResponse(result, '通知模板创建成功');

  } catch (error) {
    console.error('创建通知模板错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('创建通知模板失败'), 500);
  }
}

// 获取通知模板列表
async function getNotificationTemplates() {
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
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `;

  const templates = await db.all(query);

  // 转换数据格式
  const formattedTemplates = templates.map((template: any) => ({
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
  }));

  return formattedTemplates;
}

// 创建新的通知模板
async function createNotificationTemplate(data: {
  name: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
  variables?: any;
}) {
  const db = await getDb();

  const id = 'tpl_' + Math.random().toString(36).substr(2, 9);

  await db.run(`
    INSERT INTO notification_templates (
      id, template_name, title, template_message, template_type, template_priority, action_url, variables
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    data.name,
    data.title,
    data.message,
    data.type,
    data.priority,
    data.actionUrl || null,
    data.variables ? JSON.stringify(data.variables) : null
  ]);

  return {
    id,
    ...data,
    createdAt: new Date().toISOString()
  };
}