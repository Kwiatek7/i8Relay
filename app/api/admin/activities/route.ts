import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取查询参数
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // 获取最近活动
    const activities = await getRecentActivities(limit);

    return createAuthResponse(activities, '最近活动获取成功');

  } catch (error) {
    console.error('获取最近活动错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取最近活动失败'), 500);
  }
}

async function getRecentActivities(limit: number) {
  const db = await getDb();

  try {
    const activities: any[] = [];

    // 获取最近的用户注册
    const recentUsers = await db.all(
      `SELECT username, email, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ?`,
      [Math.ceil(limit / 3)]
    );

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_register',
        title: '新用户注册',
        description: `用户 ${user.username || user.email} 注册了账户`,
        timestamp: user.created_at,
        icon: 'user-plus',
        color: 'green'
      });
    });

    // 获取最近的套餐购买
    const recentSubscriptions = await db.all(
      `SELECT u.username, u.email, p.name as plan_name, us.created_at
       FROM user_subscriptions us
       JOIN users u ON us.user_id = u.id
       LEFT JOIN plans p ON us.plan_id = p.id
       WHERE us.status = 'active'
       ORDER BY us.created_at DESC
       LIMIT ?`,
      [Math.ceil(limit / 3)]
    );

    recentSubscriptions.forEach(sub => {
      activities.push({
        type: 'plan_purchase',
        title: '套餐购买',
        description: `${sub.username || sub.email} 购买了 ${sub.plan_name || '套餐'}`,
        timestamp: sub.created_at,
        icon: 'credit-card',
        color: 'blue'
      });
    });

    // 获取最近的系统配置更改
    const recentConfigs = await db.all(
      `SELECT key, value, updated_at
       FROM system_config
       ORDER BY updated_at DESC
       LIMIT ?`,
      [Math.ceil(limit / 3)]
    );

    recentConfigs.forEach(config => {
      activities.push({
        type: 'config_change',
        title: '系统配置更改',
        description: `配置项 ${config.key} 已更新`,
        timestamp: config.updated_at,
        icon: 'settings',
        color: 'purple'
      });
    });

    // 按时间排序并限制数量
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map(activity => ({
        ...activity,
        relativeTime: getRelativeTime(activity.timestamp)
      }));

  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return time.toLocaleDateString('zh-CN');
  }
}