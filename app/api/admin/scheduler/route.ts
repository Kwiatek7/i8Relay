import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth/jwt';
import { taskScheduler } from '../../../../lib/services/scheduler';

// GET - 获取定时任务状态
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const tasks = taskScheduler.getTasksStatus();

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        schedulerStatus: {
          isStarted: true, // 调度器应该总是运行的
          totalTasks: tasks.length,
          enabledTasks: tasks.filter(t => t.enabled).length,
          runningTasks: tasks.filter(t => t.isRunning).length
        }
      }
    });

  } catch (error) {
    console.error('获取定时任务状态失败:', error);
    return NextResponse.json(
      { success: false, message: '获取定时任务状态失败' },
      { status: 500 }
    );
  }
}

// POST - 管理定时任务
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
    const { action, taskId, enabled } = body;

    switch (action) {
      case 'run':
        if (!taskId) {
          return NextResponse.json(
            { success: false, message: '缺少taskId参数' },
            { status: 400 }
          );
        }

        console.log(`管理员 ${user.email} 手动执行任务: ${taskId}`);
        const runSuccess = await taskScheduler.runTask(taskId);
        
        return NextResponse.json({
          success: runSuccess,
          message: runSuccess ? '任务执行成功' : '任务执行失败'
        });

      case 'toggle':
        if (!taskId || typeof enabled !== 'boolean') {
          return NextResponse.json(
            { success: false, message: '缺少必要参数' },
            { status: 400 }
          );
        }

        console.log(`管理员 ${user.email} ${enabled ? '启用' : '禁用'}任务: ${taskId}`);
        const toggleSuccess = taskScheduler.toggleTask(taskId, enabled);
        
        return NextResponse.json({
          success: toggleSuccess,
          message: toggleSuccess 
            ? `任务已${enabled ? '启用' : '禁用'}` 
            : '任务不存在'
        });

      case 'restart':
        console.log(`管理员 ${user.email} 重启任务调度器`);
        taskScheduler.stop();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        taskScheduler.start();
        
        return NextResponse.json({
          success: true,
          message: '任务调度器已重启'
        });

      default:
        return NextResponse.json(
          { success: false, message: '不支持的操作' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('管理定时任务失败:', error);
    return NextResponse.json(
      { success: false, message: '管理定时任务失败' },
      { status: 500 }
    );
  }
}