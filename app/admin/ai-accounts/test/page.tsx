'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Activity,
  Monitor,
  Server,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';

interface TestResult {
  type: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message: string;
  timestamp: string;
  responseTime?: string;
  statusCode?: number;
  error?: string;
  rateLimitInfo?: Record<string, string>;
}

interface TestData {
  accountId: string;
  accountName: string;
  provider: string;
  testType: string;
  testResults: TestResult[];
  overallStatus: 'healthy' | 'warning' | 'failed';
  healthScore: number;
  timestamp: string;
}

interface AIAccount {
  id: string;
  account_name: string;
  provider: string;
  tier: string;
  account_status: string;
  health_score: number;
}

export default function AIAccountTestPage() {
  const [accounts, setAccounts] = useState<AIAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [testType, setTestType] = useState<'ping' | 'full'>('ping');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestData | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // 获取AI账号列表
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/admin/ai-accounts?pageSize=100');
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data.data || []);
      }
    } catch (error) {
      console.error('获取账号列表失败:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const runTest = async () => {
    if (!selectedAccount) {
      alert('请选择要测试的AI账号');
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    try {
      const response = await fetch('/api/admin/ai-accounts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          testType
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults(data.data);
      } else {
        console.error('测试失败:', data.message);
        alert(data.message || '测试失败');
      }
    } catch (error) {
      console.error('测试请求失败:', error);
      alert('测试请求失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTestTypeDescription = (type: string) => {
    switch (type) {
      case 'credentials':
        return '验证凭据格式是否正确';
      case 'api_ping':
        return '测试API连接可用性';
      case 'api_call':
        return '执行实际API调用测试';
      case 'rate_limit':
        return '检查速率限制状态';
      default:
        return type;
    }
  };

  const selectedAccountData = accounts.find(acc => acc.id === selectedAccount);

  return (
    <div className="space-y-6">
      {/* 头部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/ai-accounts"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回账号管理
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Monitor className="h-6 w-6 mr-2 text-blue-600" />
            AI账号测试工具
          </h1>
        </div>
      </div>

      {/* 测试配置区域 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-500" />
          测试配置
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 选择账号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择AI账号
            </label>
            {loadingAccounts ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            ) : (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择账号...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} ({account.provider}/{account.tier})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 测试类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              测试类型
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as 'ping' | 'full')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ping">快速测试 (连接检查)</option>
              <option value="full">完整测试 (包含API调用)</option>
            </select>
          </div>
        </div>

        {/* 选中账号的信息 */}
        {selectedAccountData && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">选中账号信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">名称:</span>
                <div className="font-medium">{selectedAccountData.account_name}</div>
              </div>
              <div>
                <span className="text-gray-600">提供商:</span>
                <div className="font-medium">{selectedAccountData.provider}</div>
              </div>
              <div>
                <span className="text-gray-600">等级:</span>
                <div className="font-medium">{selectedAccountData.tier}</div>
              </div>
              <div>
                <span className="text-gray-600">健康评分:</span>
                <div className="font-medium">{Math.round(selectedAccountData.health_score * 100)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* 启动测试按钮 */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={runTest}
            disabled={!selectedAccount || isLoading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isLoading ? '测试中...' : '开始测试'}
          </button>
        </div>
      </div>

      {/* 测试结果区域 */}
      {testResults && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-500" />
            测试结果
          </h2>

          {/* 测试摘要 */}
          <div className={`p-4 rounded-lg border-2 mb-6 ${getStatusColor(testResults.overallStatus)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  整体状态: {testResults.overallStatus === 'healthy' ? '健康' :
                           testResults.overallStatus === 'warning' ? '警告' : '失败'}
                </h3>
                <p className="text-sm opacity-90">
                  账号: {testResults.accountName} |
                  健康评分: {testResults.healthScore}% |
                  测试时间: {new Date(testResults.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{testResults.healthScore}%</div>
                <div className="text-sm opacity-90">健康评分</div>
              </div>
            </div>
          </div>

          {/* 详细测试结果 */}
          <div className="space-y-4">
            {testResults.testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {result.type === 'credentials' ? '凭据验证' :
                           result.type === 'api_ping' ? 'API连接测试' :
                           result.type === 'api_call' ? 'API调用测试' :
                           result.type === 'rate_limit' ? '速率限制检查' : result.type}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium
                          ${result.status === 'passed' ? 'bg-green-100 text-green-800' :
                            result.status === 'failed' ? 'bg-red-100 text-red-800' :
                            result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {result.status === 'passed' ? '通过' :
                           result.status === 'failed' ? '失败' :
                           result.status === 'warning' ? '警告' : '跳过'}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-2">{result.message}</p>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>测试时间: {new Date(result.timestamp).toLocaleString()}</div>
                        {result.responseTime && (
                          <div>响应时间: {result.responseTime}</div>
                        )}
                        {result.statusCode && (
                          <div>HTTP状态: {result.statusCode}</div>
                        )}
                        {result.error && (
                          <div className="text-red-600 mt-1">
                            错误: {result.error}
                          </div>
                        )}
                        {result.rateLimitInfo && (
                          <div className="mt-2">
                            <div className="font-medium text-gray-600">速率限制信息:</div>
                            {Object.entries(result.rateLimitInfo).map(([key, value]) => (
                              <div key={key} className="ml-2">
                                {key}: {value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  {getTestTypeDescription(result.type)}
                </div>
              </div>
            ))}
          </div>

          {/* 重新测试按钮 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={runTest}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新测试
            </button>
          </div>
        </div>
      )}

      {/* 测试说明 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">测试说明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>快速测试</strong>: 验证凭据格式和API连接可用性，耗时较短</li>
          <li><strong>完整测试</strong>: 包含实际API调用和速率限制检查，可能产生少量费用</li>
          <li>测试结果会自动更新账号的健康评分</li>
          <li>建议定期进行测试以确保账号可用性</li>
        </ul>
      </div>
    </div>
  );
}