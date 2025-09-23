import type { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';

// 真实认证服务类
export class AuthService {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  // 处理API响应
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;

    if (isJson) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    return data;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      credentials: 'include', // 包含cookie
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  // 登录
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    return {
      success: response.success,
      data: response.data,
      error: response.error
    };
  }

  // 注册
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      success: response.success,
      data: response.data,
      error: response.error
    };
  }

  // 获取当前用户
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  // 刷新token
  async refreshToken(): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/auth/refresh', {
      method: 'POST',
    });

    return {
      success: response.success,
      data: response.data,
      error: response.error
    };
  }

  // 登出
  async logout(): Promise<void> {
    await this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  // 更新个人资料
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 修改密码
  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<ApiResponse<void>> {
    return this.request<void>('/user/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// 导出认证服务实例
export const authService = new AuthService();