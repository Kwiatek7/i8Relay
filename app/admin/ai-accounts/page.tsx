'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Users,
  Zap,
  Check,
  X,
  Square,
  CheckSquare,
  RefreshCw,
  Power,
  PowerOff
} from 'lucide-react';
import type { AIAccount } from '../../../lib/database/models/ai-account';

interface AIAccountStats {
  total_accounts: number;
  active_accounts: number;
  shared_accounts: number;
  dedicated_accounts: number;
  avg_health_score: number;
  provider: string;
}

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  account: AIAccount | null;
  isEdit: boolean;
}

function AccountFormModal({ isOpen, onClose, onSave, account, isEdit }: AccountFormModalProps) {
  const [formData, setFormData] = useState({
    account_name: account?.account_name || '',
    provider: account?.provider || 'openai',
    account_type: account?.account_type || 'standard',
    credentials: '',
    tier: account?.tier || 'basic',
    max_requests_per_minute: account?.max_requests_per_minute || 60,
    max_tokens_per_minute: account?.max_tokens_per_minute || 100000,
    max_concurrent_requests: account?.max_concurrent_requests || 3,
    is_shared: account?.is_shared !== false,
    monthly_cost: account?.monthly_cost || 0,
    cost_currency: account?.cost_currency || 'USD',
    description: account?.description || '',
    tags: account?.tags ? JSON.parse(account.tags).join(', ') : ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account && isEdit) {
      setFormData({
        account_name: account.account_name,
        provider: account.provider,
        account_type: account.account_type,
        credentials: '',
        tier: account.tier,
        max_requests_per_minute: account.max_requests_per_minute,
        max_tokens_per_minute: account.max_tokens_per_minute,
        max_concurrent_requests: account.max_concurrent_requests,
        is_shared: account.is_shared,
        monthly_cost: account.monthly_cost,
        cost_currency: account.cost_currency,
        description: account.description || '',
        tags: account.tags ? JSON.parse(account.tags).join(', ') : ''
      });
    }
  }, [account, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_name.trim()) {
      newErrors.account_name = '账号名称不能为空';
    }

    if (!isEdit && !formData.credentials.trim()) {
      newErrors.credentials = '凭据不能为空';
    }

    if (formData.max_requests_per_minute < 1) {
      newErrors.max_requests_per_minute = '请求限制必须大于0';
    }

    if (formData.max_tokens_per_minute < 1) {
      newErrors.max_tokens_per_minute = 'Token限制必须大于0';
    }

    if (formData.max_concurrent_requests < 1) {
      newErrors.max_concurrent_requests = '并发请求数必须大于0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : []
    };

    onSave(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-xl bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? '编辑AI账号' : '添加AI账号'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">基本信息</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  账号名称 *
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                    errors.account_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.account_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.account_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  服务商
                </label>
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  账号类型
                </label>
                <input
                  type="text"
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  等级
                </label>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="basic">基础</option>
                  <option value="standard">标准</option>
                  <option value="premium">高级</option>
                  <option value="enterprise">企业</option>
                </select>
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API凭据 *
                  </label>
                  <input
                    type="password"
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      errors.credentials ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="输入API密钥"
                  />
                  {errors.credentials && (
                    <p className="mt-1 text-sm text-red-600">{errors.credentials}</p>
                  )}
                </div>
              )}
            </div>

            {/* 性能配置 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">性能配置</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  请求限制 (每分钟)
                </label>
                <input
                  type="number"
                  name="max_requests_per_minute"
                  value={formData.max_requests_per_minute}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                    errors.max_requests_per_minute ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  min="1"
                />
                {errors.max_requests_per_minute && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_requests_per_minute}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token限制 (每分钟)
                </label>
                <input
                  type="number"
                  name="max_tokens_per_minute"
                  value={formData.max_tokens_per_minute}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                    errors.max_tokens_per_minute ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  min="1"
                />
                {errors.max_tokens_per_minute && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_tokens_per_minute}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  并发请求数
                </label>
                <input
                  type="number"
                  name="max_concurrent_requests"
                  value={formData.max_concurrent_requests}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                    errors.max_concurrent_requests ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  min="1"
                />
                {errors.max_concurrent_requests && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_concurrent_requests}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_shared"
                  checked={formData.is_shared}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  共享池账号
                </label>
              </div>
            </div>

            {/* 账单信息 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">账单信息</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  月度成本
                </label>
                <input
                  type="number"
                  name="monthly_cost"
                  value={formData.monthly_cost}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  货币
                </label>
                <select
                  name="cost_currency"
                  value={formData.cost_currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* 其他信息 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">其他信息</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  描述
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标签 (逗号分隔)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="如: 测试, 高优先级, 备用"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {isEdit ? '保存修改' : '创建账号'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AIAccountsPage() {
  const [accounts, setAccounts] = useState<AIAccount[]>([]);
  const [stats, setStats] = useState<AIAccountStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AIAccount | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 批量操作相关状态
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [batchOperationLoading, setBatchOperationLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchStats();
  }, [currentPage, filterProvider, filterTier, filterStatus]);

  const fetchAccounts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
      });

      if (filterProvider !== 'all') params.append('provider', filterProvider);
      if (filterTier !== 'all') params.append('tier', filterTier);
      if (filterStatus !== 'all') params.append('account_status', filterStatus);

      const response = await fetch(`/api/admin/ai-accounts?${params}`);
      const data = await response.json();

      if (data.success) {
        setAccounts(data.data.data);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('获取AI账号列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/ai-accounts/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data.by_provider);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  const getStatusIcon = (status: string, healthScore: number) => {
    if (status === 'active' && healthScore >= 80) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'active' && healthScore >= 60) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '活跃',
      inactive: '未激活',
      maintenance: '维护中',
      banned: '已禁用',
      expired: '已过期'
    };
    return statusMap[status] || status;
  };

  const getTierText = (tier: string) => {
    const tierMap: Record<string, string> = {
      basic: '基础',
      standard: '标准',
      premium: '高级',
      enterprise: '企业'
    };
    return tierMap[tier] || tier;
  };

  const getTierColor = (tier: string) => {
    const colorMap: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      standard: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      enterprise: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return colorMap[tier] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const handleViewDetails = (account: AIAccount) => {
    setSelectedAccount(account);
    setShowDetailsModal(true);
  };

  const handleEditAccount = (account: AIAccount) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleDeleteAccount = async (account: AIAccount) => {
    if (!confirm(`确认删除账号 "${account.account_name}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ai-accounts/${account.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('账号删除成功');
        fetchAccounts();
        fetchStats();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除账号失败:', error);
      alert('删除操作失败');
    }
  };

  const handleSaveAccount = async (accountData: any) => {
    try {
      const url = selectedAccount
        ? `/api/admin/ai-accounts/${selectedAccount.id}`
        : '/api/admin/ai-accounts';

      const method = selectedAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountData)
      });

      const data = await response.json();
      if (data.success) {
        alert(selectedAccount ? '账号更新成功' : '账号创建成功');
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedAccount(null);
        fetchAccounts();
        fetchStats();
      } else {
        alert(data.message || (selectedAccount ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('保存账号失败:', error);
      alert('保存操作失败');
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 批量操作函数
  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts(prev => [...prev, accountId]);
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(filteredAccounts.map(account => account.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedAccounts.length === 0) {
      alert('请先选择要删除的账号');
      return;
    }

    if (!confirm(`确认删除选中的 ${selectedAccounts.length} 个账号吗？此操作不可撤销。`)) {
      return;
    }

    setBatchOperationLoading(true);
    try {
      const response = await fetch('/api/admin/ai-accounts/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountIds: selectedAccounts })
      });

      const data = await response.json();
      if (data.success) {
        alert(`成功删除 ${data.deletedCount} 个账号`);
        setSelectedAccounts([]);
        fetchAccounts();
        fetchStats();
      } else {
        alert(data.message || '批量删除失败');
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('批量删除操作失败');
    } finally {
      setBatchOperationLoading(false);
    }
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedAccounts.length === 0) {
      alert('请先选择要操作的账号');
      return;
    }

    const statusNames: Record<string, string> = {
      active: '启用',
      inactive: '禁用',
      maintenance: '维护'
    };

    if (!confirm(`确认将选中的 ${selectedAccounts.length} 个账号设置为${statusNames[newStatus]}状态吗？`)) {
      return;
    }

    setBatchOperationLoading(true);
    try {
      const response = await fetch('/api/admin/ai-accounts/batch', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          updates: { account_status: newStatus }
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`成功更新 ${data.updatedCount} 个账号状态`);
        setSelectedAccounts([]);
        fetchAccounts();
        fetchStats();
      } else {
        alert(data.message || '批量更新失败');
      }
    } catch (error) {
      console.error('批量状态更新失败:', error);
      alert('批量操作失败');
    } finally {
      setBatchOperationLoading(false);
    }
  };

  const handleBatchHealthCheck = async () => {
    if (selectedAccounts.length === 0) {
      alert('请先选择要检查的账号');
      return;
    }

    if (!confirm(`确认对选中的 ${selectedAccounts.length} 个账号进行健康检查吗？`)) {
      return;
    }

    setBatchOperationLoading(true);
    try {
      const response = await fetch('/api/admin/ai-accounts/batch-health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountIds: selectedAccounts })
      });

      const data = await response.json();
      if (data.success) {
        alert(`健康检查完成：${data.healthyCount} 健康，${data.warningCount} 警告，${data.failedCount} 失败`);
        setSelectedAccounts([]);
        fetchAccounts();
      } else {
        alert(data.message || '批量健康检查失败');
      }
    } catch (error) {
      console.error('批量健康检查失败:', error);
      alert('批量健康检查操作失败');
    } finally {
      setBatchOperationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI账号管理</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            管理AI服务商账号池，配置账号分级和绑定策略
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAccount(null);
            setShowAddModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          添加账号
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.provider.toUpperCase()}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.active_accounts}/{stat.total_accounts}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="text-green-600 dark:text-green-400">
                    共享: {stat.shared_accounts}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    专属: {stat.dedicated_accounts}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Activity className="h-4 w-4 mr-1" />
                  健康度 {stat.avg_health_score}/100
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 批量操作工具栏 */}
      {selectedAccounts.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-900 dark:text-blue-100">
              已选择 {selectedAccounts.length} 个账号
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBatchStatusChange('active')}
                disabled={batchOperationLoading}
                className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                <Power className="h-4 w-4 mr-1" />
                启用
              </button>
              <button
                onClick={() => handleBatchStatusChange('inactive')}
                disabled={batchOperationLoading}
                className="flex items-center px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
              >
                <PowerOff className="h-4 w-4 mr-1" />
                禁用
              </button>
              <button
                onClick={handleBatchHealthCheck}
                disabled={batchOperationLoading}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${batchOperationLoading ? 'animate-spin' : ''}`} />
                健康检查
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={batchOperationLoading}
                className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </button>
              <button
                onClick={() => setSelectedAccounts([])}
                className="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                取消选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 搜索和过滤器 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索账号名称或服务商..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          {/* 过滤器 */}
          <div className="flex space-x-4">
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">所有服务商</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
            </select>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">所有等级</option>
              <option value="basic">基础</option>
              <option value="standard">标准</option>
              <option value="premium">高级</option>
              <option value="enterprise">企业</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">所有状态</option>
              <option value="active">活跃</option>
              <option value="inactive">未激活</option>
              <option value="maintenance">维护中</option>
              <option value="banned">已禁用</option>
            </select>
          </div>
        </div>
      </div>

      {/* 账号列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            const checked = (e.target as HTMLInputElement).checked;
                            handleSelectAll(checked);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0
                            ? <CheckSquare className="h-4 w-4" />
                            : <Square className="h-4 w-4" />
                          }
                        </button>
                        <span>账号信息</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      等级/类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      状态/健康度
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      使用统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      配置
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleSelectAccount(account.id, !selectedAccounts.includes(account.id))}
                            className="mr-3 text-blue-600 hover:text-blue-800"
                          >
                            {selectedAccounts.includes(account.id)
                              ? <CheckSquare className="h-4 w-4" />
                              : <Square className="h-4 w-4" />
                            }
                          </button>
                          <div className="flex-shrink-0">
                            {getStatusIcon(account.account_status, account.health_score)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {account.account_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                              {account.provider}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(account.tier)}`}>
                            {getTierText(account.tier)}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {account.is_shared ? (
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                共享池
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Zap className="h-3 w-3 mr-1" />
                                专属
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getStatusText(account.account_status)}
                          </div>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  account.health_score >= 80
                                    ? 'bg-green-500'
                                    : account.health_score >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${account.health_score}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              {account.health_score}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <div>请求: {account.total_requests.toLocaleString()}</div>
                          <div>Tokens: {account.total_tokens.toLocaleString()}</div>
                          <div className="text-xs">
                            错误(24h): {account.error_count_24h}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <div>{account.max_requests_per_minute}/分钟</div>
                          <div>{(account.max_tokens_per_minute / 1000).toFixed(0)}K tokens/分钟</div>
                          <div>并发: {account.max_concurrent_requests}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewDetails(account)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditAccount(account)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="编辑账号"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="删除账号"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    第 {currentPage} 页，共 {totalPages} 页
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI账号编辑/添加模态框 */}
      {(showEditModal || showAddModal) && (
        <AccountFormModal
          isOpen={showEditModal || showAddModal}
          onClose={() => {
            setShowEditModal(false);
            setShowAddModal(false);
            setSelectedAccount(null);
          }}
          onSave={handleSaveAccount}
          account={selectedAccount}
          isEdit={showEditModal}
        />
      )}

      {/* AI账号详情模态框 */}
      {showDetailsModal && selectedAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-xl bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI账号详情 - {selectedAccount.account_name}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">基本信息</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">账号名称:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAccount.account_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">服务商:</span>
                    <span className="font-medium text-gray-900 dark:text-white uppercase">{selectedAccount.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">账号类型:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAccount.account_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">等级:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(selectedAccount.tier)}`}>
                      {getTierText(selectedAccount.tier)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">账号状态:</span>
                    <div className="flex items-center">
                      {getStatusIcon(selectedAccount.account_status, selectedAccount.health_score)}
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {getStatusText(selectedAccount.account_status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">分配类型:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedAccount.is_shared ? '共享池' : '专属'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 性能配置 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">性能配置</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">请求限制:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAccount.max_requests_per_minute}/分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Token限制:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAccount.max_tokens_per_minute.toLocaleString()}/分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">并发请求:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAccount.max_concurrent_requests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">健康分数:</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            selectedAccount.health_score >= 80
                              ? 'bg-green-500'
                              : selectedAccount.health_score >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedAccount.health_score}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedAccount.health_score}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 使用统计 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">使用统计</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">总请求数:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAccount.total_requests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">总Token数:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAccount.total_tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">24h错误数:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAccount.error_count_24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">最后使用:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedAccount.last_used_at
                        ? new Date(selectedAccount.last_used_at).toLocaleString('zh-CN')
                        : '未使用'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">最后错误:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedAccount.last_error_at
                        ? new Date(selectedAccount.last_error_at).toLocaleString('zh-CN')
                        : '无'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* 账单信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">账单信息</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">月度成本:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedAccount.monthly_cost} {selectedAccount.cost_currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">密钥预览:</span>
                    <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                      {selectedAccount.key_preview || '未设置'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">创建时间:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedAccount.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">更新时间:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedAccount.updated_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 描述和标签 */}
            {(selectedAccount.description || selectedAccount.tags) && (
              <div className="mt-6 space-y-4">
                {selectedAccount.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">描述</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedAccount.description}</p>
                  </div>
                )}
                {selectedAccount.tags && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">标签</h4>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedAccount.tags).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}