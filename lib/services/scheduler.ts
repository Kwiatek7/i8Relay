// 定时任务调度器
import { healthChecker } from './health-checker';

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // cron格式 或 简单间隔时间
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
}

export class TaskScheduler {
  private static instance: TaskScheduler;
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isStarted: boolean = false;

  private constructor() {
    this.initializeDefaultTasks();
  }

  public static getInstance(): TaskScheduler {
    if (!TaskScheduler.instance) {
      TaskScheduler.instance = new TaskScheduler();
    }
    return TaskScheduler.instance;
  }

  /**
   * 初始化默认任务
   */
  private initializeDefaultTasks(): void {
    // 健康检查任务 - 每30分钟运行一次
    this.addTask({
      id: 'health-check',
      name: 'AI账号健康检查',
      schedule: '*/30 * * * *', // 每30分钟
      handler: async () => {
        console.log('🔍 执行定时健康检查...');
        await healthChecker.checkAllAccounts();
      },
      enabled: true,
      isRunning: false
    });

    // 清理任务 - 每天凌晨2点运行
    this.addTask({
      id: 'cleanup',
      name: '清理过期数据',
      schedule: '0 2 * * *', // 每天凌晨2点
      handler: async () => {
        console.log('🧹 执行数据清理...');
        await healthChecker.cleanupOldRecords();
        await this.cleanupUsageLogs();
        await this.cleanupExpiredBindings();
      },
      enabled: true,
      isRunning: false
    });

    // 统计任务 - 每小时运行一次
    this.addTask({
      id: 'statistics',
      name: '生成使用统计',
      schedule: '0 * * * *', // 每小时整点
      handler: async () => {
        console.log('📊 生成使用统计...');
        await this.generateHourlyStats();
      },
      enabled: true,
      isRunning: false
    });

    // 绑定状态检查 - 每小时运行一次
    this.addTask({
      id: 'binding-check',
      name: '检查绑定状态',
      schedule: '15 * * * *', // 每小时的15分
      handler: async () => {
        console.log('🔗 检查绑定状态...');
        await this.checkBindingStatus();
      },
      enabled: true,
      isRunning: false
    });
  }

  /**
   * 添加任务
   */
  addTask(task: ScheduledTask): void {
    this.tasks.set(task.id, task);
    
    if (this.isStarted && task.enabled) {
      this.scheduleTask(task);
    }
    
    console.log(`➕ 添加定时任务: ${task.name} (${task.schedule})`);
  }

  /**
   * 移除任务
   */
  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // 清理定时器
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }

    this.tasks.delete(taskId);
    console.log(`➖ 移除定时任务: ${task.name}`);
    return true;
  }

  /**
   * 启用/禁用任务
   */
  toggleTask(taskId: string, enabled: boolean): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.enabled = enabled;

    if (enabled && this.isStarted) {
      this.scheduleTask(task);
    } else {
      const timer = this.timers.get(taskId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(taskId);
      }
    }

    console.log(`${enabled ? '✅' : '⏸️'} ${enabled ? '启用' : '禁用'}任务: ${task.name}`);
    return true;
  }

  /**
   * 手动执行任务
   */
  async runTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.isRunning) {
      console.log(`⚠️ 任务 ${task.name} 正在运行中，跳过`);
      return false;
    }

    try {
      task.isRunning = true;
      task.lastRun = new Date();
      
      console.log(`🚀 手动执行任务: ${task.name}`);
      await task.handler();
      console.log(`✅ 任务完成: ${task.name}`);
      
      return true;
    } catch (error) {
      console.error(`❌ 任务执行失败: ${task.name}`, error);
      return false;
    } finally {
      task.isRunning = false;
    }
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isStarted) {
      console.log('⚠️ 调度器已经启动');
      return;
    }

    this.isStarted = true;
    console.log('🎯 启动定时任务调度器...');

    // 调度所有启用的任务
    for (const task of this.tasks.values()) {
      if (task.enabled) {
        this.scheduleTask(task);
      }
    }

    console.log(`✅ 调度器启动完成，管理 ${this.tasks.size} 个任务`);
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.isStarted) return;

    this.isStarted = false;
    console.log('🛑 停止定时任务调度器...');

    // 清理所有定时器
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    console.log('✅ 调度器已停止');
  }

  /**
   * 调度单个任务
   */
  private scheduleTask(task: ScheduledTask): void {
    // 清理现有定时器
    const existingTimer = this.timers.get(task.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const nextRunTime = this.getNextRunTime(task.schedule);
    if (!nextRunTime) {
      console.error(`❌ 无法解析任务调度: ${task.name} (${task.schedule})`);
      return;
    }

    task.nextRun = nextRunTime;
    const delayMs = nextRunTime.getTime() - Date.now();

    const timer = setTimeout(async () => {
      await this.executeTask(task);
      
      // 如果任务仍然启用，重新调度
      if (task.enabled && this.isStarted) {
        this.scheduleTask(task);
      }
    }, delayMs);

    this.timers.set(task.id, timer);

    console.log(`⏰ 任务 ${task.name} 已调度，下次运行: ${nextRunTime.toLocaleString()}`);
  }

  /**
   * 执行任务
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    if (task.isRunning) {
      console.log(`⚠️ 任务 ${task.name} 仍在运行，跳过此次执行`);
      return;
    }

    try {
      task.isRunning = true;
      task.lastRun = new Date();
      
      console.log(`🚀 执行定时任务: ${task.name}`);
      const startTime = Date.now();
      
      await task.handler();
      
      const duration = Date.now() - startTime;
      console.log(`✅ 任务完成: ${task.name} (耗时: ${duration}ms)`);
      
    } catch (error) {
      console.error(`❌ 定时任务执行失败: ${task.name}`, error);
    } finally {
      task.isRunning = false;
    }
  }

  /**
   * 解析调度表达式并计算下次运行时间
   */
  private getNextRunTime(schedule: string): Date | null {
    const now = new Date();
    
    // 简单的间隔时间格式支持 (如 "5m", "1h", "30s")
    const intervalMatch = schedule.match(/^(\d+)([smh])$/);
    if (intervalMatch) {
      const value = parseInt(intervalMatch[1]);
      const unit = intervalMatch[2];
      
      let milliseconds = 0;
      switch (unit) {
        case 's': milliseconds = value * 1000; break;
        case 'm': milliseconds = value * 60 * 1000; break;
        case 'h': milliseconds = value * 60 * 60 * 1000; break;
      }
      
      return new Date(now.getTime() + milliseconds);
    }

    // 简化版cron表达式解析 (分 时 日 月 周)
    const cronParts = schedule.split(' ');
    if (cronParts.length === 5) {
      return this.parseCronExpression(schedule, now);
    }

    return null;
  }

  /**
   * 简化版cron表达式解析
   */
  private parseCronExpression(cron: string, from: Date): Date | null {
    const parts = cron.split(' ');
    const [minute, hour, day, month, weekday] = parts;

    const next = new Date(from);
    next.setSeconds(0);
    next.setMilliseconds(0);

    // 解析分钟
    if (minute === '*') {
      // 通配符，保持当前分钟
    } else if (minute.startsWith('*/')) {
      const interval = parseInt(minute.substring(2));
      const currentMinute = next.getMinutes();
      const nextMinute = Math.ceil((currentMinute + 1) / interval) * interval;
      if (nextMinute >= 60) {
        next.setMinutes(0);
        next.setHours(next.getHours() + 1);
      } else {
        next.setMinutes(nextMinute);
      }
    } else {
      const targetMinute = parseInt(minute);
      if (targetMinute <= next.getMinutes()) {
        next.setHours(next.getHours() + 1);
      }
      next.setMinutes(targetMinute);
    }

    // 解析小时
    if (hour !== '*') {
      const targetHour = parseInt(hour);
      if (targetHour <= next.getHours() && minute !== '*') {
        next.setDate(next.getDate() + 1);
      }
      next.setHours(targetHour);
    }

    // 确保下次运行时间在未来
    if (next <= from) {
      next.setMinutes(next.getMinutes() + 1);
    }

    return next;
  }

  /**
   * 获取所有任务状态
   */
  getTasksStatus(): Array<ScheduledTask & { nextRunIn?: string }> {
    const now = new Date();
    
    return Array.from(this.tasks.values()).map(task => ({
      ...task,
      nextRunIn: task.nextRun 
        ? this.formatDuration(task.nextRun.getTime() - now.getTime())
        : undefined
    }));
  }

  /**
   * 格式化持续时间
   */
  private formatDuration(ms: number): string {
    if (ms < 0) return '已过期';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天 ${hours % 24}小时`;
    if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`;
    return `${seconds}秒`;
  }

  /**
   * 清理使用日志
   */
  private async cleanupUsageLogs(): Promise<void> {
    const { getDb } = await import('../database/connection');
    const db = await getDb();
    
    // 保留90天的使用日志
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const result = await db.run(`
      DELETE FROM account_usage_logs 
      WHERE created_at < ?
    `, [ninetyDaysAgo]);

    console.log(`清理了 ${result.changes} 条过期的使用日志`);
  }

  /**
   * 清理过期绑定
   */
  private async cleanupExpiredBindings(): Promise<void> {
    const { getDb } = await import('../database/connection');
    const db = await getDb();
    
    const now = new Date().toISOString();
    
    const result = await db.run(`
      UPDATE user_account_bindings 
      SET binding_status = 'expired',
          updated_at = ?
      WHERE binding_status = 'active' 
      AND expires_at IS NOT NULL 
      AND expires_at < ?
    `, [now, now]);

    if (result.changes && result.changes > 0) {
      console.log(`标记了 ${result.changes} 个过期绑定`);
    }
  }

  /**
   * 生成每小时统计
   */
  private async generateHourlyStats(): Promise<void> {
    // 这里可以实现统计逻辑，比如：
    // - 统计每小时的请求数
    // - 统计Token使用量
    // - 统计错误率
    // 暂时只是一个占位符
    console.log('📊 生成每小时统计（占位符）');
  }

  /**
   * 检查绑定状态
   */
  private async checkBindingStatus(): Promise<void> {
    const { getDb } = await import('../database/connection');
    const db = await getDb();
    
    // 检查即将过期的绑定（7天内过期）
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const expiringBindings = await db.all(`
      SELECT b.*, u.email, p.display_name
      FROM user_account_bindings b
      JOIN users u ON b.user_id = u.id
      JOIN plans p ON b.plan_id = p.id
      WHERE b.binding_status = 'active'
      AND b.expires_at IS NOT NULL
      AND b.expires_at < ?
      AND b.expires_at > ?
    `, [sevenDaysFromNow, new Date().toISOString()]);

    if (expiringBindings.length > 0) {
      console.log(`⚠️ 发现 ${expiringBindings.length} 个即将过期的绑定`);
      // 这里可以发送通知或警报
    }
  }
}

export const taskScheduler = TaskScheduler.getInstance();