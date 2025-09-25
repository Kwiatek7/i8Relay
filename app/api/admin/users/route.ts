import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { getDb } from '../../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const db = await getDb();
    console.log('数据库连接成功');

    // 先测试简单查询
    const testQuery = await db.get('SELECT COUNT(*) as count FROM users');
    console.log('用户总数:', testQuery);

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    console.log('查询参数:', { page, pageSize, search, role, status });

    // 构建查询条件
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (search) {
      whereConditions.push('(username LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push('user_role = ?');
      params.push(role);
    }

    if (status) {
      whereConditions.push('user_status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    console.log('WHERE子句:', whereClause, '参数:', params);

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    console.log('计数查询:', countQuery);
    const countResult = await db.get(countQuery, params) as { total: number };
    const total = countResult.total;
    console.log('总记录数:', total);

    // 获取用户列表
    const offset = (page - 1) * pageSize;
    const usersQuery = `
      SELECT
        id, username, email, user_role, current_plan_id, balance, user_status,
        created_at, last_login_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    console.log('用户查询:', usersQuery);
    console.log('查询参数:', [...params, pageSize, offset]);
    const users = await db.all(usersQuery, [...params, pageSize, offset]);
    console.log('查询结果数量:', users.length);

    // 转换字段名为前端期望的格式
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      user_role: user.user_role,
      plan: user.current_plan_id,  // 字段名映射
      balance: user.balance,
      user_status: user.user_status,
      created_at: user.created_at,
      last_login: user.last_login_at  // 字段名映射
    }));

    const totalPages = Math.ceil(total / pageSize);

    return createAuthResponse({
      users: formattedUsers,
      total,
      page,
      pageSize,
      totalPages
    }, '用户列表获取成功');

  } catch (error) {
    console.error('获取用户列表错误:', error);
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取用户列表失败'), 500);
  }
}