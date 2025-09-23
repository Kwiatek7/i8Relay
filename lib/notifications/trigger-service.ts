import { getDb } from '../database/connection';

// 通知触发器接口
export interface NotificationTrigger {
  checkCondition(triggerData: any, condition: any): Promise<boolean>;
  prepareNotificationData(triggerData: any, template: NotificationTemplate): Promise<{
    title: string;
    message: string;
    actionUrl?: string;
  }>;
  getTargetUsers(triggerData: any, targetScope: string, targetUsers?: string[]): Promise<string[]>;
}

// 通知模板接口
export interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
  variables?: Record<string, string>;
}

// 通知规则接口
export interface NotificationRule {
  id: string;
  name: string;
  type: string;
  triggerCondition: any;
  template: NotificationTemplate;
  targetScope: string;
  targetUsers?: string[];
  isEnabled: boolean;
  cooldownMinutes: number;
}

// 通知触发器服务
export class NotificationTriggerService {
  private triggers: Map<string, NotificationTrigger> = new Map();

  constructor() {
    // 注册内置触发器
    this.registerTrigger('balance_low', new BalanceLowTrigger());
    this.registerTrigger('subscription_expiring', new SubscriptionExpiringTrigger());
    this.registerTrigger('usage_limit', new UsageLimitTrigger());
    this.registerTrigger('payment_failed', new PaymentFailedTrigger());
    this.registerTrigger('login_security', new LoginSecurityTrigger());
  }

  // 注册触发器
  registerTrigger(type: string, trigger: NotificationTrigger) {
    this.triggers.set(type, trigger);
  }

  // 检查并触发通知
  async checkAndTrigger(triggerType: string, triggerData: any): Promise<{
    triggered: number;
    total: number;
    results: Array<{ ruleId: string; success: boolean; error?: string; notificationsSent?: number }>;
  }> {
    const results: Array<{ ruleId: string; success: boolean; error?: string; notificationsSent?: number }> = [];
    let triggered = 0;

    try {
      // 获取启用的规则
      const rules = await this.getEnabledRules(triggerType);
      console.log(`检查 ${triggerType} 类型的规则，找到 ${rules.length} 个启用的规则`);

      for (const rule of rules) {
        try {
          const result = await this.processRule(rule, triggerData);
          results.push(result);
          if (result.success && result.notificationsSent && result.notificationsSent > 0) {
            triggered++;
          }
        } catch (error) {
          console.error(`处理规则 ${rule.id} 失败:`, error);
          results.push({
            ruleId: rule.id,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          });
        }
      }

      return {
        triggered,
        total: rules.length,
        results
      };

    } catch (error) {
      console.error(`检查通知触发失败 (${triggerType}):`, error);
      throw error;
    }
  }

  // 处理单个规则
  private async processRule(rule: NotificationRule, triggerData: any): Promise<{
    ruleId: string;
    success: boolean;
    error?: string;
    notificationsSent?: number;
  }> {
    const trigger = this.triggers.get(rule.type);
    if (!trigger) {
      return {
        ruleId: rule.id,
        success: false,
        error: `不支持的触发器类型: ${rule.type}`
      };
    }

    try {
      // 检查冷却时间
      const coolingDown = await this.isInCooldown(rule.id, rule.cooldownMinutes);
      if (coolingDown) {
        console.log(`规则 ${rule.id} 在冷却期内，跳过执行`);
        return {
          ruleId: rule.id,
          success: true,
          notificationsSent: 0
        };
      }

      // 检查触发条件
      const shouldTrigger = await trigger.checkCondition(triggerData, rule.triggerCondition);
      if (!shouldTrigger) {
        console.log(`规则 ${rule.id} 条件不满足，跳过执行`);
        return {
          ruleId: rule.id,
          success: true,
          notificationsSent: 0
        };
      }

      // 获取目标用户
      const targetUsers = await trigger.getTargetUsers(triggerData, rule.targetScope, rule.targetUsers);
      if (targetUsers.length === 0) {
        console.log(`规则 ${rule.id} 没有目标用户，跳过执行`);
        return {
          ruleId: rule.id,
          success: true,
          notificationsSent: 0
        };
      }

      // 准备通知内容
      const notificationData = await trigger.prepareNotificationData(triggerData, rule.template);

      // 创建通知
      const notificationsSent = await this.createNotifications(
        targetUsers,
        notificationData,
        rule.template.type,
        rule.template.priority
      );

      // 记录执行日志
      await this.logExecution(rule.id, triggerData, targetUsers, true, notificationsSent);

      console.log(`规则 ${rule.id} 执行成功，发送 ${notificationsSent} 个通知`);

      return {
        ruleId: rule.id,
        success: true,
        notificationsSent
      };

    } catch (error) {
      console.error(`处理规则 ${rule.id} 出错:`, error);

      // 记录错误日志
      await this.logExecution(rule.id, triggerData, [], false, 0, error instanceof Error ? error.message : '未知错误');

      return {
        ruleId: rule.id,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 获取启用的规则
  private async getEnabledRules(type: string): Promise<NotificationRule[]> {
    const db = await getDb();

    const query = `
      SELECT
        r.id,
        r.name,
        r.type,
        r.trigger_condition as triggerCondition,
        r.target_scope as targetScope,
        r.target_users as targetUsers,
        r.is_enabled as isEnabled,
        r.cooldown_minutes as cooldownMinutes,
        t.id as templateId,
        t.title as templateTitle,
        t.message as templateMessage,
        t.type as templateType,
        t.priority as templatePriority,
        t.action_url as templateActionUrl,
        t.variables as templateVariables
      FROM notification_rules r
      LEFT JOIN notification_templates t ON r.template_id = t.id
      WHERE r.type = ? AND r.is_enabled = 1
      ORDER BY r.created_at ASC
    `;

    const rows = await db.all(query, [type]);

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      triggerCondition: row.triggerCondition ? JSON.parse(row.triggerCondition) : {},
      targetScope: row.targetScope,
      targetUsers: row.targetUsers ? JSON.parse(row.targetUsers) : undefined,
      isEnabled: row.isEnabled === 1,
      cooldownMinutes: row.cooldownMinutes,
      template: {
        id: row.templateId,
        title: row.templateTitle,
        message: row.templateMessage,
        type: row.templateType,
        priority: row.templatePriority,
        actionUrl: row.templateActionUrl,
        variables: row.templateVariables ? JSON.parse(row.templateVariables) : {}
      }
    }));
  }

  // 检查冷却时间
  private async isInCooldown(ruleId: string, cooldownMinutes: number): Promise<boolean> {
    if (cooldownMinutes <= 0) return false;

    const db = await getDb();

    const lastExecution = await db.get(`
      SELECT executed_at
      FROM notification_rule_logs
      WHERE rule_id = ? AND success = 1
      ORDER BY executed_at DESC
      LIMIT 1
    `, [ruleId]);

    if (!lastExecution) return false;

    const lastExecutionTime = new Date(lastExecution.executed_at);
    const cooldownEnd = new Date(lastExecutionTime.getTime() + cooldownMinutes * 60 * 1000);
    const now = new Date();

    return now < cooldownEnd;
  }

  // 创建通知
  private async createNotifications(
    userIds: string[],
    notificationData: { title: string; message: string; actionUrl?: string },
    type: string,
    priority: string
  ): Promise<number> {
    const db = await getDb();
    let createdCount = 0;

    for (const userId of userIds) {
      try {
        const id = 'notif_' + Math.random().toString(36).substr(2, 9);
        await db.run(`
          INSERT INTO user_notifications (id, user_id, title, message, type, priority, action_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id, userId, notificationData.title, notificationData.message, type, priority, notificationData.actionUrl]);
        createdCount++;
      } catch (error) {
        console.error(`为用户 ${userId} 创建通知失败:`, error);
      }
    }

    return createdCount;
  }

  // 记录执行日志
  private async logExecution(
    ruleId: string,
    triggerData: any,
    targetUsers: string[],
    success: boolean,
    notificationsSent: number,
    errorMessage?: string
  ): Promise<void> {
    const db = await getDb();

    const id = 'log_' + Math.random().toString(36).substr(2, 9);

    await db.run(`
      INSERT INTO notification_rule_logs (
        id, rule_id, trigger_data, notifications_sent, target_users, success, error_message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      ruleId,
      JSON.stringify(triggerData),
      notificationsSent,
      JSON.stringify(targetUsers),
      success ? 1 : 0,
      errorMessage || null
    ]);
  }
}

// 模板变量替换工具
export class TemplateRenderer {
  static render(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }
}

// 余额不足触发器
class BalanceLowTrigger implements NotificationTrigger {
  async checkCondition(triggerData: any, condition: any): Promise<boolean> {
    const { balance } = triggerData;
    const { threshold } = condition;
    return balance <= threshold;
  }

  async prepareNotificationData(triggerData: any, template: NotificationTemplate) {
    const variables = {
      current_balance: triggerData.balance,
      threshold: triggerData.threshold || 10
    };

    return {
      title: TemplateRenderer.render(template.title, variables),
      message: TemplateRenderer.render(template.message, variables),
      actionUrl: template.actionUrl
    };
  }

  async getTargetUsers(triggerData: any, targetScope: string, targetUsers?: string[]): Promise<string[]> {
    if (targetScope === 'specific_users' && targetUsers) {
      return targetUsers;
    } else if (triggerData.userId) {
      return [triggerData.userId];
    } else {
      return [];
    }
  }
}

// 套餐到期触发器
class SubscriptionExpiringTrigger implements NotificationTrigger {
  async checkCondition(triggerData: any, condition: any): Promise<boolean> {
    const { daysUntilExpiry } = triggerData;
    const { days_before } = condition;
    return daysUntilExpiry <= days_before;
  }

  async prepareNotificationData(triggerData: any, template: NotificationTemplate) {
    const variables = {
      plan_name: triggerData.planName || '当前套餐',
      days_left: triggerData.daysUntilExpiry,
      expire_date: triggerData.expireDate
    };

    return {
      title: TemplateRenderer.render(template.title, variables),
      message: TemplateRenderer.render(template.message, variables),
      actionUrl: template.actionUrl
    };
  }

  async getTargetUsers(triggerData: any, targetScope: string, targetUsers?: string[]): Promise<string[]> {
    if (targetScope === 'specific_users' && targetUsers) {
      return targetUsers;
    } else if (triggerData.userId) {
      return [triggerData.userId];
    } else {
      return [];
    }
  }
}

// 使用量超限触发器
class UsageLimitTrigger implements NotificationTrigger {
  async checkCondition(triggerData: any, condition: any): Promise<boolean> {
    const { usagePercent } = triggerData;
    const { threshold_percent } = condition;
    return usagePercent >= threshold_percent;
  }

  async prepareNotificationData(triggerData: any, template: NotificationTemplate) {
    const variables = {
      resource_type: triggerData.resourceType || '资源',
      usage_percent: triggerData.usagePercent,
      current_usage: triggerData.currentUsage,
      limit: triggerData.limit
    };

    return {
      title: TemplateRenderer.render(template.title, variables),
      message: TemplateRenderer.render(template.message, variables),
      actionUrl: template.actionUrl
    };
  }

  async getTargetUsers(triggerData: any, targetScope: string, targetUsers?: string[]): Promise<string[]> {
    if (targetScope === 'specific_users' && targetUsers) {
      return targetUsers;
    } else if (triggerData.userId) {
      return [triggerData.userId];
    } else {
      return [];
    }
  }
}

// 支付失败触发器
class PaymentFailedTrigger implements NotificationTrigger {
  async checkCondition(triggerData: any, condition: any): Promise<boolean> {
    return true; // 支付失败总是需要通知
  }

  async prepareNotificationData(triggerData: any, template: NotificationTemplate) {
    const variables = {
      amount: triggerData.amount,
      reason: triggerData.reason || '支付处理失败'
    };

    return {
      title: TemplateRenderer.render(template.title, variables),
      message: TemplateRenderer.render(template.message, variables),
      actionUrl: template.actionUrl
    };
  }

  async getTargetUsers(triggerData: any, targetScope: string, targetUsers?: string[]): Promise<string[]> {
    if (targetScope === 'specific_users' && targetUsers) {
      return targetUsers;
    } else if (triggerData.userId) {
      return [triggerData.userId];
    } else {
      return [];
    }
  }
}

// 异常登录触发器
class LoginSecurityTrigger implements NotificationTrigger {
  async checkCondition(triggerData: any, condition: any): Promise<boolean> {
    return true; // 异常登录总是需要通知
  }

  async prepareNotificationData(triggerData: any, template: NotificationTemplate) {
    const variables = {
      login_time: triggerData.loginTime,
      location: triggerData.location || '未知位置',
      ip: triggerData.ip
    };

    return {
      title: TemplateRenderer.render(template.title, variables),
      message: TemplateRenderer.render(template.message, variables),
      actionUrl: template.actionUrl
    };
  }

  async getTargetUsers(triggerData: any, targetScope: string, targetUsers?: string[]): Promise<string[]> {
    if (targetScope === 'specific_users' && targetUsers) {
      return targetUsers;
    } else if (triggerData.userId) {
      return [triggerData.userId];
    } else {
      return [];
    }
  }
}

// 创建默认实例
export const notificationTriggerService = new NotificationTriggerService();