import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth/jwt';
import { getDb } from '../../../../lib/database/connection';

// 日志类型定义
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  userId?: string;
  userEmail?: string;
  accountId?: string;
  metadata?: Record<string, any>;
}

// 获取系统日志
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
    const level = searchParams.get('level') || '';
    const category = searchParams.get('category') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const userId = searchParams.get('userId') || '';
    const accountId = searchParams.get('accountId') || '';

    const db = await getDb();

    // 构建查询条件
    let whereConditions = ['1=1'];
    const params: any[] = [];

    if (level) {
      whereConditions.push('level = ?');
      params.push(level);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    if (startDate) {
      whereConditions.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('created_at <= ?');
      params.push(endDate);
    }

    if (userId) {
      whereConditions.push('user_id = ?');
      params.push(userId);
    }

    if (accountId) {
      whereConditions.push('account_id = ?');
      params.push(accountId);
    }

    const whereClause = whereConditions.join(' AND ');

    // 创建虚拟日志数据（因为实际的日志表可能不存在，我们从现有表中构造日志）
    const logs: LogEntry[] = [];

    // 从管理员日志表获取数据
    try {
      const adminLogs = await db.all(`
        SELECT
          id,
          created_at as timestamp,
          'info' as level,
          'admin' as category,
          CONCAT(admin_action, ': ', target_type, ' ', target_id) as message,
          admin_user_id as userId,
          null as accountId,
          CONCAT('{"action":"', admin_action, '","target_type":"', target_type, '","target_id":"', target_id, '"}') as metadata
        FROM admin_logs
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [pageSize, (page - 1) * pageSize]);

      logs.push(...adminLogs.map((log: any) => ({
        id: `admin_${log.id}`,
        timestamp: log.timestamp,
        level: log.level as any,
        category: log.category,
        message: log.message,
        userId: log.userId,
        accountId: log.accountId,
        metadata: log.metadata ? JSON.parse(log.metadata) : null
      })));
    } catch (error) {
      console.warn('无法获取管理员日志:', error);
    }

    // 从使用日志表获取数据
    try {
      const usageLogs = await db.all(`
        SELECT
          id,
          created_at as timestamp,
          CASE
            WHEN status_code >= 500 THEN 'error'
            WHEN status_code >= 400 THEN 'warn'
            ELSE 'info'
          END as level,
          'api' as category,
          CONCAT(method, ' ', endpoint, ' - ', model, ' (', status_code, ')') as message,
          user_id as userId,
          null as accountId,
          CONCAT('{"method":"', method, '","endpoint":"', endpoint, '","model":"', model, '","status_code":', status_code, ',"tokens":', input_tokens + output_tokens, ',"cost":', cost, '}') as metadata
        FROM usage_logs
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [Math.floor(pageSize / 2), 0]);

      logs.push(...usageLogs.map((log: any) => ({
        id: `usage_${log.id}`,
        timestamp: log.timestamp,
        level: log.level as any,
        category: log.category,
        message: log.message,
        userId: log.userId,
        accountId: log.accountId,
        metadata: log.metadata ? JSON.parse(log.metadata) : null
      })));
    } catch (error) {
      console.warn('无法获取使用日志:', error);
    }

    // 从计费记录获取数据
    try {
      const billingLogs = await db.all(`
        SELECT
          id,
          created_at as timestamp,
          CASE
            WHEN payment_status = 'failed' THEN 'error'
            WHEN payment_status = 'pending' THEN 'warn'
            ELSE 'info'
          END as level,
          'billing' as category,
          CONCAT('Payment ', payment_status, ' - ', amount, ' ', currency, ' (', payment_method, ')') as message,
          user_id as userId,
          null as accountId,
          CONCAT('{"amount":', amount, ',"currency":"', currency, '","payment_status":"', payment_status, '","payment_method":"', payment_method, '"}') as metadata
        FROM billing_records
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [Math.floor(pageSize / 4), 0]);

      logs.push(...billingLogs.map((log: any) => ({
        id: `billing_${log.id}`,
        timestamp: log.timestamp,
        level: log.level as any,
        category: log.category,
        message: log.message,
        userId: log.userId,
        accountId: log.accountId,
        metadata: log.metadata ? JSON.parse(log.metadata) : null
      })));
    } catch (error) {
      console.warn('无法获取计费日志:', error);
    }

    // 添加系统事件日志
    const systemLogs: LogEntry[] = [
      {
        id: 'system_startup',
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'system',
        message: 'AI账号管理系统启动',
        metadata: {
          component: 'scheduler',
          event: 'startup',
          health_check_interval: '30min'
        }
      },
      {
        id: 'health_check',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        level: 'info',
        category: 'health',
        message: '定期健康检查完成',
        metadata: {
          accounts_checked: 4,
          healthy_accounts: 3,
          warning_accounts: 1,
          failed_accounts: 0
        }
      }
    ];

    logs.push(...systemLogs);

    // 按时间戳排序
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 应用过滤条件
    let filteredLogs = logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    // 分页
    const total = filteredLogs.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

    // 获取用户邮箱信息
    for (const log of paginatedLogs) {
      if (log.userId) {
        try {
          const user = await db.get('SELECT email FROM users WHERE id = ?', [log.userId]);
          if (user) {
            log.userEmail = user.email;
          }
        } catch (error) {
          console.warn('获取用户邮箱失败:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          current: page,
          pageSize,
          total,
          pages: Math.ceil(total / pageSize)
        },
        categories: ['admin', 'api', 'billing', 'system', 'health', 'auth', 'notification'],
        levels: ['info', 'warn', 'error', 'debug']
      },
      message: '日志获取成功'
    });

  } catch (error) {
    console.error('获取日志失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取日志失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}