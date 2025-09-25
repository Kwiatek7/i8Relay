import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // 中间件只处理路由，不包含复杂的系统初始化
  // 系统初始化将在API路由中按需进行

  // 继续处理请求
  return NextResponse.next();
}

export const config = {
  // 指定middleware运行的路径
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - api routes that start with `/api/`
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};