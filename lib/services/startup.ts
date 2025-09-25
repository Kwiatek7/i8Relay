// 系统启动初始化服务
import { taskScheduler } from './scheduler';
import { healthChecker } from './health-checker';

class StartupService {
  private static instance: StartupService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): StartupService {
    if (!StartupService.instance) {
      StartupService.instance = new StartupService();
    }
    return StartupService.instance;
  }

  /**
   * 系统启动初始化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ 系统已经初始化完成');
      return;
    }

    console.log('🚀 开始系统初始化...');

    try {
      // 1. 启动定时任务调度器
      await this.initializeScheduler();

      // 2. 执行首次健康检查
      await this.performInitialHealthCheck();

      // 3. 清理初始化
      await this.performInitialCleanup();

      this.isInitialized = true;
      console.log('✅ 系统初始化完成');

    } catch (error) {
      console.error('❌ 系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化任务调度器
   */
  private async initializeScheduler(): Promise<void> {
    console.log('🕰️ 启动任务调度器...');
    
    try {
      // 启动调度器
      taskScheduler.start();

      // 延迟5秒后执行首次健康检查，避免系统启动时过载
      setTimeout(() => {
        console.log('🔍 执行启动后首次健康检查...');
        healthChecker.checkAllAccounts().catch(error => {
          console.error('启动时健康检查失败:', error);
        });
      }, 5000);

      console.log('✅ 任务调度器启动成功');
    } catch (error) {
      console.error('❌ 任务调度器启动失败:', error);
      throw error;
    }
  }

  /**
   * 执行初始健康检查
   */
  private async performInitialHealthCheck(): Promise<void> {
    console.log('🔍 执行初始健康检查...');
    
    try {
      const { getDb } = await import('../database/connection');
      const db = await getDb();

      // 检查是否有AI账号
      const accountCount = await db.get('SELECT COUNT(*) as count FROM ai_accounts WHERE account_status = "active"');
      
      if (accountCount.count === 0) {
        console.log('⚠️ 未发现活跃的AI账号，跳过健康检查');
        return;
      }

      console.log(`📊 发现 ${accountCount.count} 个活跃AI账号`);

      // 检查最近是否有健康检查记录
      const recentCheck = await db.get(`
        SELECT COUNT(*) as count 
        FROM account_health_checks 
        WHERE checked_at > datetime('now', '-1 hour')
      `);

      if (recentCheck.count > 0) {
        console.log('⏭️ 最近1小时内已有健康检查记录，跳过初始检查');
        return;
      }

      console.log('✅ 初始健康检查准备就绪');
    } catch (error) {
      console.error('❌ 初始健康检查准备失败:', error);
      // 不抛出错误，因为这不是关键功能
    }
  }

  /**
   * 执行初始清理
   */
  private async performInitialCleanup(): Promise<void> {
    console.log('🧹 执行初始数据清理...');
    
    try {
      const { getDb } = await import('../database/connection');
      const db = await getDb();

      // 清理过期的绑定
      const expiredBindings = await db.run(`
        UPDATE user_account_bindings 
        SET binding_status = 'expired',
            updated_at = ?
        WHERE binding_status = 'active' 
        AND expires_at IS NOT NULL 
        AND expires_at < ?
      `, [
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      if (expiredBindings.changes && expiredBindings.changes > 0) {
        console.log(`🗑️ 清理了 ${expiredBindings.changes} 个过期绑定`);
      }

      // 清理过期的会话
      const expiredSessions = await db.run(`
        DELETE FROM user_sessions 
        WHERE expires_at < ?
      `, [new Date().toISOString()]);

      if (expiredSessions.changes && expiredSessions.changes > 0) {
        console.log(`🗑️ 清理了 ${expiredSessions.changes} 个过期会话`);
      }

      console.log('✅ 初始清理完成');
    } catch (error) {
      console.error('❌ 初始清理失败:', error);
      // 不抛出错误，因为这不是关键功能
    }
  }

  /**
   * 系统关闭清理
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    console.log('🛑 开始系统关闭清理...');

    try {
      // 停止任务调度器
      taskScheduler.stop();

      // 等待正在运行的任务完成（最多等待30秒）
      const maxWaitTime = 30000;
      const checkInterval = 1000;
      let waitTime = 0;

      while (waitTime < maxWaitTime) {
        const runningTasks = taskScheduler.getTasksStatus().filter(t => t.isRunning);
        if (runningTasks.length === 0) {
          break;
        }

        console.log(`⏳ 等待 ${runningTasks.length} 个任务完成...`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
      }

      this.isInitialized = false;
      console.log('✅ 系统关闭清理完成');

    } catch (error) {
      console.error('❌ 系统关闭清理失败:', error);
    }
  }

  /**
   * 检查系统状态
   */
  getSystemStatus(): {
    initialized: boolean;
    scheduler: {
      running: boolean;
      taskCount: number;
      enabledTasks: number;
      runningTasks: number;
    };
  } {
    const tasks = taskScheduler.getTasksStatus();

    return {
      initialized: this.isInitialized,
      scheduler: {
        running: this.isInitialized,
        taskCount: tasks.length,
        enabledTasks: tasks.filter(t => t.enabled).length,
        runningTasks: tasks.filter(t => t.isRunning).length
      }
    };
  }
}

export const startupService = StartupService.getInstance();

// 设置进程退出事件监听器
export function setupProcessListeners(): void {
  if (typeof process !== 'undefined') {
    process.on('SIGTERM', async () => {
      console.log('收到SIGTERM信号，开始优雅关闭...');
      await startupService.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('收到SIGINT信号，开始优雅关闭...');
      await startupService.shutdown();
      process.exit(0);
    });
  }
}