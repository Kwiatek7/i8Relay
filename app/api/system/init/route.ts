import { NextRequest, NextResponse } from 'next/server';

// 系统初始化状态
let isSystemInitialized = false;

// GET - 获取系统初始化状态
export async function GET(request: NextRequest) {
  try {
    if (!isSystemInitialized) {
      // 异步启动初始化
      initializeSystemAsync().catch(console.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        initialized: isSystemInitialized,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取系统初始化状态失败:', error);
    return NextResponse.json(
      { success: false, message: '获取系统状态失败' },
      { status: 500 }
    );
  }
}

// POST - 手动触发系统初始化
export async function POST(request: NextRequest) {
  try {
    if (isSystemInitialized) {
      return NextResponse.json({
        success: true,
        message: '系统已经初始化完成'
      });
    }

    await initializeSystemAsync();

    return NextResponse.json({
      success: true,
      message: '系统初始化完成',
      data: {
        initialized: isSystemInitialized,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('系统初始化失败:', error);
    return NextResponse.json(
      { success: false, message: '系统初始化失败' },
      { status: 500 }
    );
  }
}

// 异步初始化系统
async function initializeSystemAsync() {
  if (isSystemInitialized) return;

  try {
    console.log('🚀 正在初始化系统服务...');

    // 动态导入启动服务
    const { startupService, setupProcessListeners } = await import('../../../../lib/services/startup');

    // 设置进程监听器
    setupProcessListeners();

    // 初始化系统服务
    await startupService.initialize();

    isSystemInitialized = true;
    console.log('✅ 系统服务初始化完成');

  } catch (error) {
    console.error('❌ 系统服务初始化失败:', error);
    throw error;
  }
}