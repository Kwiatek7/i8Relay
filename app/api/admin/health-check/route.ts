import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth/jwt';
import { healthChecker } from '../../../../lib/services/health-checker';

// GET - 获取健康检查状态
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
    const accountId = searchParams.get('accountId');

    if (accountId) {
      // 检查特定账号
      const results = await healthChecker.checkAccount(accountId);
      return NextResponse.json({
        success: true,
        data: results
      });
    } else {
      // 获取所有账号的健康状态摘要
      const { getDb } = await import('../../../../lib/database/connection');
      const db = await getDb();

      const healthSummary = await db.all(`
        SELECT 
          a.id,
          a.account_name,
          a.provider,
          a.tier,
          a.health_score,
          a.error_count_24h,
          a.last_health_check_at,
          a.last_error_at,
          COUNT(ahc.id) as recent_checks
        FROM ai_accounts a
        LEFT JOIN account_health_checks ahc ON a.id = ahc.ai_account_id 
          AND ahc.checked_at > datetime('now', '-1 hour')
        WHERE a.account_status = 'active'
        GROUP BY a.id
        ORDER BY a.health_score DESC, a.account_name ASC
      `);

      return NextResponse.json({
        success: true,
        data: healthSummary
      });
    }

  } catch (error) {
    console.error('获取健康检查状态失败:', error);
    return NextResponse.json(
      { success: false, message: '获取健康检查状态失败' },
      { status: 500 }
    );
  }
}

// POST - 手动触发健康检查
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { accountId, action } = body;

    if (action === 'check-all') {
      // 检查所有账号
      console.log(`管理员 ${user.email} 触发了全量健康检查`);
      
      // 异步执行，不阻塞响应
      healthChecker.checkAllAccounts().catch(error => {
        console.error('全量健康检查失败:', error);
      });

      return NextResponse.json({
        success: true,
        message: '全量健康检查已启动，请稍后查看结果'
      });

    } else if (accountId) {
      // 检查特定账号
      console.log(`管理员 ${user.email} 触发了账号 ${accountId} 的健康检查`);
      
      const results = await healthChecker.checkAccount(accountId);
      
      return NextResponse.json({
        success: true,
        message: '健康检查完成',
        data: results
      });

    } else {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('执行健康检查失败:', error);
    return NextResponse.json(
      { success: false, message: '执行健康检查失败' },
      { status: 500 }
    );
  }
}