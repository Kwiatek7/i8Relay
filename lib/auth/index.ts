// 认证模块统一导出

export * from './jwt';
export * from './middleware';
export * from './service';

// 导出主要实例
export { jwtManager } from './jwt';
export { authService } from './service';

// 导出认证相关类型
export type {
  JwtPayload,
  TokenPair
} from './jwt';

export type {
  AuthenticatedRequest,
  AuthContext
} from './middleware';

export {
  AuthError,
  authenticateRequest,
  optionalAuthenticate,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  checkApiAccess,
  refreshTokenMiddleware,
  createAuthResponse,
  createErrorResponse,
  logout,
  logoutAllDevices
} from './middleware';