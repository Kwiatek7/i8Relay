'use client';

import { useState, useEffect } from 'react';
import {
  Code,
  Play,
  Copy,
  Check,
  Book,
  Server,
  Key,
  Users,
  Settings,
  Activity,
  CreditCard,
  Bell,
  FileText,
  AlertCircle,
  Zap,
  Database
} from 'lucide-react';

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  category: string;
  authentication: boolean;
  adminOnly: boolean;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: string;
  }[];
  body?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
  }[];
  responses: {
    status: number;
    description: string;
    example: any;
  }[];
}

const apiEndpoints: APIEndpoint[] = [
  {
    id: 'auth-login',
    method: 'POST',
    path: '/api/auth/login',
    title: '用户登录',
    description: '用户使用邮箱和密码登录系统',
    category: '认证',
    authentication: false,
    adminOnly: false,
    body: [
      { name: 'email', type: 'string', required: true, description: '用户邮箱', example: 'user@example.com' },
      { name: 'password', type: 'string', required: true, description: '用户密码', example: 'password123' }
    ],
    responses: [
      {
        status: 200,
        description: '登录成功',
        example: {
          success: true,
          data: {
            user: {
              id: 'user123',
              username: 'john_doe',
              email: 'user@example.com',
              role: 'user'
            },
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          message: '登录成功'
        }
      },
      {
        status: 401,
        description: '登录失败',
        example: {
          success: false,
          message: '邮箱或密码错误'
        }
      }
    ]
  },
  {
    id: 'user-profile',
    method: 'GET',
    path: '/api/user/profile',
    title: '获取用户资料',
    description: '获取当前登录用户的详细资料信息',
    category: '用户',
    authentication: true,
    adminOnly: false,
    responses: [
      {
        status: 200,
        description: '获取成功',
        example: {
          success: true,
          data: {
            id: 'user123',
            username: 'john_doe',
            email: 'user@example.com',
            balance: 100.50,
            subscription_plan: 'pro',
            created_at: '2024-01-01T00:00:00Z'
          }
        }
      }
    ]
  },
  {
    id: 'admin-users',
    method: 'GET',
    path: '/api/admin/users',
    title: '获取用户列表',
    description: '获取系统中所有用户的列表（管理员权限）',
    category: '用户管理',
    authentication: true,
    adminOnly: true,
    parameters: [
      { name: 'page', type: 'number', required: false, description: '页码', example: '1' },
      { name: 'pageSize', type: 'number', required: false, description: '每页数量', example: '20' },
      { name: 'search', type: 'string', required: false, description: '搜索关键词', example: 'john' }
    ],
    responses: [
      {
        status: 200,
        description: '获取成功',
        example: {
          success: true,
          data: {
            data: [
              {
                id: 'user123',
                username: 'john_doe',
                email: 'user@example.com',
                role: 'user',
                balance: 100.50,
                created_at: '2024-01-01T00:00:00Z'
              }
            ],
            pagination: {
              current: 1,
              pageSize: 20,
              total: 100,
              pages: 5
            }
          }
        }
      }
    ]
  },
  {
    id: 'admin-ai-accounts',
    method: 'GET',
    path: '/api/admin/ai-accounts',
    title: '获取AI账号列表',
    description: '获取系统中所有AI账号的列表',
    category: 'AI账号管理',
    authentication: true,
    adminOnly: true,
    parameters: [
      { name: 'page', type: 'number', required: false, description: '页码', example: '1' },
      { name: 'provider', type: 'string', required: false, description: '服务商', example: 'openai' },
      { name: 'tier', type: 'string', required: false, description: '等级', example: 'premium' }
    ],
    responses: [
      {
        status: 200,
        description: '获取成功',
        example: {
          success: true,
          data: {
            data: [
              {
                id: 'acc123',
                account_name: 'OpenAI Pro Account',
                provider: 'openai',
                tier: 'premium',
                health_score: 95,
                account_status: 'active'
              }
            ]
          }
        }
      }
    ]
  },
  {
    id: 'admin-ai-account-test',
    method: 'POST',
    path: '/api/admin/ai-accounts/test',
    title: 'AI账号测试',
    description: '测试指定AI账号的连接和健康状态',
    category: 'AI账号管理',
    authentication: true,
    adminOnly: true,
    body: [
      { name: 'accountId', type: 'string', required: true, description: 'AI账号ID', example: 'acc123' },
      { name: 'testType', type: 'string', required: false, description: '测试类型', example: 'ping' }
    ],
    responses: [
      {
        status: 200,
        description: '测试完成',
        example: {
          success: true,
          data: {
            accountId: 'acc123',
            testResults: [
              {
                type: 'api_ping',
                status: 'passed',
                message: 'API连接测试通过',
                responseTime: '245ms'
              }
            ],
            overallStatus: 'healthy',
            healthScore: 95
          }
        }
      }
    ]
  }
];

const categories = [
  { id: 'all', name: '全部', icon: Book },
  { id: '认证', name: '认证', icon: Key },
  { id: '用户', name: '用户', icon: Users },
  { id: '用户管理', name: '用户管理', icon: Settings },
  { id: 'AI账号管理', name: 'AI账号管理', icon: Zap },
  { id: '使用统计', name: '使用统计', icon: Activity },
  { id: '计费', name: '计费', icon: CreditCard },
  { id: '通知', name: '通知', icon: Bell },
  { id: '配置', name: '配置', icon: Settings }
];

export default function APIDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [testForm, setTestForm] = useState<Record<string, any>>({});

  const filteredEndpoints = selectedCategory === 'all'
    ? apiEndpoints
    : apiEndpoints.filter(endpoint => endpoint.category === selectedCategory);

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800 border-green-200',
      POST: 'bg-blue-100 text-blue-800 border-blue-200',
      PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      PATCH: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const generateCurlCommand = (endpoint: APIEndpoint) => {
    let curl = `curl -X ${endpoint.method}`;
    curl += ` "${window.location.origin}${endpoint.path}`;

    // 添加查询参数
    if (endpoint.parameters && endpoint.method === 'GET') {
      const params = endpoint.parameters
        .filter(p => testForm[p.name])
        .map(p => `${p.name}=${encodeURIComponent(testForm[p.name])}`)
        .join('&');
      if (params) curl += `?${params}`;
    }
    curl += '"';

    // 添加请求头
    curl += ' -H "Content-Type: application/json"';
    if (endpoint.authentication) {
      curl += ' -H "Authorization: Bearer YOUR_TOKEN"';
    }

    // 添加请求体
    if (endpoint.body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      const bodyData: Record<string, any> = {};
      endpoint.body.forEach(field => {
        if (testForm[field.name] !== undefined) {
          bodyData[field.name] = testForm[field.name];
        } else if (field.example !== undefined) {
          bodyData[field.name] = field.example;
        }
      });
      if (Object.keys(bodyData).length > 0) {
        curl += ` -d '${JSON.stringify(bodyData, null, 2)}'`;
      }
    }

    return curl;
  };

  const testAPI = async (endpoint: APIEndpoint) => {
    setTestLoading(true);
    setTestResults(null);

    try {
      let url = endpoint.path;
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // 添加查询参数（GET请求）
      if (endpoint.parameters && endpoint.method === 'GET') {
        const params = new URLSearchParams();
        endpoint.parameters.forEach(param => {
          if (testForm[param.name]) {
            params.append(param.name, testForm[param.name]);
          }
        });
        if (params.toString()) {
          url += '?' + params.toString();
        }
      }

      // 添加请求体
      if (endpoint.body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        const bodyData: Record<string, any> = {};
        endpoint.body.forEach(field => {
          if (testForm[field.name] !== undefined) {
            bodyData[field.name] = testForm[field.name];
          }
        });
        options.body = JSON.stringify(bodyData);
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      const responseData = await response.json();

      setTestResults({
        status: response.status,
        statusText: response.statusText,
        responseTime: endTime - startTime,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      });

    } catch (error) {
      setTestResults({
        error: true,
        message: error instanceof Error ? error.message : '请求失败',
        data: null
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleFormChange = (fieldName: string, value: any) => {
    setTestForm(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 侧边栏 */}
        <div className="w-80 bg-white shadow-lg">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Book className="h-6 w-6 mr-2 text-blue-600" />
              API文档
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              i8Relay API接口文档和测试工具
            </p>
          </div>

          {/* 分类导航 */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">API分类</h3>
            <nav className="space-y-1">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {category.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 接口列表 */}
          <div className="p-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              接口列表 ({filteredEndpoints.length})
            </h3>
            <div className="space-y-2">
              {filteredEndpoints.map(endpoint => (
                <button
                  key={endpoint.id}
                  onClick={() => setSelectedEndpoint(endpoint)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedEndpoint?.id === endpoint.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    {endpoint.adminOnly && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        管理员
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {endpoint.title}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {endpoint.path}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 p-8">
          {selectedEndpoint ? (
            <div className="space-y-6">
              {/* 接口标题 */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-sm font-semibold rounded border ${getMethodColor(selectedEndpoint.method)}`}>
                      {selectedEndpoint.method}
                    </span>
                    <code className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                      {selectedEndpoint.path}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedEndpoint.authentication && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded flex items-center">
                        <Key className="h-3 w-3 mr-1" />
                        需要认证
                      </span>
                    )}
                    {selectedEndpoint.adminOnly && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        管理员权限
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedEndpoint.title}
                </h2>
                <p className="text-gray-600">
                  {selectedEndpoint.description}
                </p>
              </div>

              {/* 测试区域和文档 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API测试 */}
                <div className="bg-white rounded-lg border">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Play className="h-5 w-5 mr-2 text-green-600" />
                      API测试
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* 请求参数 */}
                    {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">查询参数</h4>
                        <div className="space-y-2">
                          {selectedEndpoint.parameters.map(param => (
                            <div key={param.name}>
                              <label className="block text-xs text-gray-600 mb-1">
                                {param.name} {param.required && <span className="text-red-500">*</span>}
                                <span className="text-gray-400 ml-1">({param.type})</span>
                              </label>
                              <input
                                type="text"
                                value={testForm[param.name] || ''}
                                onChange={(e) => handleFormChange(param.name, e.target.value)}
                                placeholder={param.example || param.description}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 请求体 */}
                    {selectedEndpoint.body && selectedEndpoint.body.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">请求体</h4>
                        <div className="space-y-2">
                          {selectedEndpoint.body.map(field => (
                            <div key={field.name}>
                              <label className="block text-xs text-gray-600 mb-1">
                                {field.name} {field.required && <span className="text-red-500">*</span>}
                                <span className="text-gray-400 ml-1">({field.type})</span>
                              </label>
                              <input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={testForm[field.name] || ''}
                                onChange={(e) => handleFormChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                placeholder={field.example || field.description}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 发送按钮 */}
                    <button
                      onClick={() => testAPI(selectedEndpoint)}
                      disabled={testLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {testLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          测试中...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          发送请求
                        </>
                      )}
                    </button>

                    {/* 测试结果 */}
                    {testResults && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">响应结果</h4>
                        <div className="bg-gray-50 rounded p-3">
                          {testResults.error ? (
                            <div className="text-red-600 text-sm">
                              错误: {testResults.message}
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  testResults.status >= 200 && testResults.status < 300
                                    ? 'bg-green-100 text-green-800'
                                    : testResults.status >= 400
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {testResults.status} {testResults.statusText}
                                </span>
                                <span className="ml-2">
                                  {testResults.responseTime}ms
                                </span>
                              </div>
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(testResults.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 文档详情 */}
                <div className="space-y-4">
                  {/* 代码示例 */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Code className="h-5 w-5 mr-2 text-purple-600" />
                        cURL示例
                      </h3>
                      <button
                        onClick={() => copyToClipboard(generateCurlCommand(selectedEndpoint), 'curl')}
                        className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {copiedCode === 'curl' ? (
                          <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        {copiedCode === 'curl' ? '已复制' : '复制'}
                      </button>
                    </div>
                    <div className="p-4">
                      <pre className="text-sm bg-gray-50 p-3 rounded overflow-x-auto">
                        <code>{generateCurlCommand(selectedEndpoint)}</code>
                      </pre>
                    </div>
                  </div>

                  {/* 响应示例 */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Database className="h-5 w-5 mr-2 text-blue-600" />
                        响应示例
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {selectedEndpoint.responses.map((response, index) => (
                        <div key={index}>
                          <div className="flex items-center mb-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              response.status >= 200 && response.status < 300
                                ? 'bg-green-100 text-green-800'
                                : response.status >= 400
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {response.status}
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              {response.description}
                            </span>
                          </div>
                          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                            <code>{JSON.stringify(response.example, null, 2)}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Server className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                选择一个API接口
              </h3>
              <p className="text-gray-600">
                从左侧列表中选择一个API接口来查看文档和进行测试
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}