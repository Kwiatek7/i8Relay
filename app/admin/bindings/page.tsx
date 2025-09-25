'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Zap,
  Search,
  Filter,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import type { UserAccountBindingDetail } from '../../../lib/database/models/user-account-binding';

interface BindingStats {
  total_bindings: number;
  active_bindings: number;
  expired_bindings: number;
  by_provider: Array<{
    provider: string;
    binding_count: number;
  }>;
  by_plan: Array<{
    plan_name: string;
    binding_count: number;
  }>;
}

interface BindingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  binding: UserAccountBindingDetail | null;
  isEdit: boolean;
}

function BindingFormModal({ isOpen, onClose, onSave, binding, isEdit }: BindingFormModalProps) {
  const [formData, setFormData] = useState({
    user_id: binding?.user_id || '',
    ai_account_id: binding?.ai_account_id || '',
    plan_id: binding?.plan_id || '',
    binding_type: binding?.binding_type || 'dedicated',
    priority_level: binding?.priority_level || 1,
    max_requests_per_hour: binding?.max_requests_per_hour || 100,
    max_tokens_per_hour: binding?.max_tokens_per_hour || 10000,
    binding_status: binding?.binding_status || 'active',
    expires_at: binding?.expires_at ? new Date(binding.expires_at).toISOString().split('T')[0] : '',
    starts_at: binding?.starts_at ? new Date(binding.starts_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const [users, setUsers] = useState<Array<{id: string, username: string, email: string}>>([]);
  const [aiAccounts, setAiAccounts] = useState<Array<{id: string, account_name: string, provider: string}>>([]);
  const [plans, setPlans] = useState<Array<{id: string, plan_name: string, display_name: string}>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchFormData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (binding && isEdit) {
      setFormData({
        user_id: binding.user_id,
        ai_account_id: binding.ai_account_id,
        plan_id: binding.plan_id,
        binding_type: binding.binding_type,
        priority_level: binding.priority_level,
        max_requests_per_hour: binding.max_requests_per_hour || 100,
        max_tokens_per_hour: binding.max_tokens_per_hour || 10000,
        binding_status: binding.binding_status,
        expires_at: binding.expires_at ? new Date(binding.expires_at).toISOString().split('T')[0] : '',
        starts_at: binding.starts_at ? new Date(binding.starts_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [binding, isEdit]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const [usersRes, accountsRes, plansRes] = await Promise.all([
        fetch('/api/admin/users?pageSize=1000'),
        fetch('/api/admin/ai-accounts?pageSize=1000'),
        fetch('/api/admin/plans')
      ]);

      if (usersRes.ok) {
        const userData = await usersRes.json();
        setUsers(userData.data?.data || []);
      }

      if (accountsRes.ok) {
        const accountData = await accountsRes.json();
        setAiAccounts(accountData.data?.data || []);
      }

      if (plansRes.ok) {
        const planData = await plansRes.json();
        setPlans(planData.data || []);
      }
    } catch (error) {
      console.error('获取表单数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.user_id) {
      newErrors.user_id = '请选择用户';
    }

    if (!formData.ai_account_id) {
      newErrors.ai_account_id = '请选择AI账号';
    }

    if (!formData.plan_id) {
      newErrors.plan_id = '请选择套餐';
    }

    if (formData.priority_level < 1 || formData.priority_level > 100) {
      newErrors.priority_level = '优先级必须在1-100之间';
    }

    if (formData.max_requests_per_hour && formData.max_requests_per_hour < 1) {
      newErrors.max_requests_per_hour = '请求限制必须大于0';
    }

    if (formData.max_tokens_per_hour && formData.max_tokens_per_hour < 1) {
      newErrors.max_tokens_per_hour = 'Token限制必须大于0';
    }

    if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
      newErrors.expires_at = '到期时间必须在未来';
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
      expires_at: formData.expires_at ? new Date(formData.expires_at + 'T23:59:59').toISOString() : null
    };

    onSave(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-xl bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? '编辑用户绑定' : '创建用户绑定'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">基本信息</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    用户 *
                  </label>
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      errors.user_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={isEdit}
                  >
                    <option value="">请选择用户</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                  {errors.user_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI账号 *
                  </label>
                  <select
                    name="ai_account_id"
                    value={formData.ai_account_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      errors.ai_account_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={isEdit}
                  >
                    <option value="">请选择AI账号</option>
                    {aiAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} ({account.provider.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  {errors.ai_account_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.ai_account_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    套餐 *
                  </label>
                  <select
                    name="plan_id"
                    value={formData.plan_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      errors.plan_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">请选择套餐</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.display_name || plan.plan_name}
                      </option>
                    ))}
                  </select>
                  {errors.plan_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.plan_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    绑定类型
                  </label>
                  <select
                    name="binding_type"
                    value={formData.binding_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="dedicated">专属</option>
                    <option value="priority">优先</option>
                    <option value="shared">共享</option>
                  </select>
                </div>
              </div>

              {/* 配置信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">配置信息</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    优先级 (1-100)
                  </label>
                  <input
                    type="number"
                    name="priority_level"
                    value={formData.priority_level}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      errors.priority_level ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    min="1"
                    max="100"
                  />
                  {errors.priority_level && (
                    <p className="mt-1 text-sm text-red-600">{errors.priority_level}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    请求限制 (每小时)
                  </label>
                  <input
                    type="number"
                    name="max_requests_per_hour"
                    value={formData.max_requests_per_hour}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      errors.max_requests_per_hour ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    min="1"
                  />
                  {errors.max_requests_per_hour && (
                    <p className="mt-1 text-sm text-red-600">{errors.max_requests_per_hour}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token限制 (每小时)
                  </label>
                  <input
                    type="number"
                    name="max_tokens_per_hour"
                    value={formData.max_tokens_per_hour}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      errors.max_tokens_per_hour ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    min="1"
                  />
                  {errors.max_tokens_per_hour && (
                    <p className="mt-1 text-sm text-red-600">{errors.max_tokens_per_hour}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    绑定状态
                  </label>
                  <select
                    name="binding_status"
                    value={formData.binding_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="active">活跃</option>
                    <option value="inactive">未激活</option>
                    <option value="expired">已过期</option>
                    <option value="suspended">已暂停</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    开始时间
                  </label>
                  <input
                    type="date"
                    name="starts_at"
                    value={formData.starts_at}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    到期时间
                  </label>
                  <input
                    type="date"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      errors.expires_at ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.expires_at && (
                    <p className="mt-1 text-sm text-red-600">{errors.expires_at}</p>
                  )}
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
                {isEdit ? '保存修改' : '创建绑定'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function BindingsPage() {
  const [bindings, setBindings] = useState<UserAccountBindingDetail[]>([]);
  const [stats, setStats] = useState<BindingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBinding, setSelectedBinding] = useState<UserAccountBindingDetail | null>(null);

  useEffect(() => {
    fetchBindings();
    fetchStats();
  }, [currentPage, filterProvider, filterStatus, filterPlan]);

  const fetchBindings = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
      });

      if (filterProvider !== 'all') params.append('provider', filterProvider);
      if (filterStatus !== 'all') params.append('binding_status', filterStatus);
      if (filterPlan !== 'all') params.append('plan_id', filterPlan);

      const response = await fetch(`/api/admin/bindings?${params}`);
      const data = await response.json();

      if (data.success) {
        setBindings(data.data.data);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('获取绑定列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/bindings/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  const getStatusIcon = (status: string, expiresAt?: string) => {
    if (status === 'active') {
      if (expiresAt && new Date(expiresAt) <= new Date()) {
        return <Clock className="h-5 w-5 text-yellow-500" />;
      }
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'expired') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (status === 'suspended') {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '活跃',
      inactive: '未激活',
      expired: '已过期',
      suspended: '已暂停'
    };
    return statusMap[status] || status;
  };

  const getBindingTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      dedicated: '专属',
      priority: '优先',
      shared: '共享'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewDetails = (binding: UserAccountBindingDetail) => {
    setSelectedBinding(binding);
    setShowDetailsModal(true);
  };

  const handleEditBinding = (binding: UserAccountBindingDetail) => {
    setSelectedBinding(binding);
    setShowEditModal(true);
  };

  const handleDeleteBinding = async (binding: UserAccountBindingDetail) => {
    if (!confirm(`确认删除用户 "${binding.username}" 与账号 "${binding.account_name}" 的绑定吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bindings/${binding.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('绑定删除成功');
        fetchBindings();
        fetchStats();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除绑定失败:', error);
      alert('删除操作失败');
    }
  };

  const handleSaveBinding = async (bindingData: any) => {
    try {
      const url = selectedBinding
        ? `/api/admin/bindings/${selectedBinding.id}`
        : '/api/admin/bindings';

      const method = selectedBinding ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bindingData)
      });

      const data = await response.json();
      if (data.success) {
        alert(selectedBinding ? '绑定更新成功' : '绑定创建成功');
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedBinding(null);
        fetchBindings();
        fetchStats();
      } else {
        alert(data.message || (selectedBinding ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('保存绑定失败:', error);
      alert('保存操作失败');
    }
  };

  const filteredBindings = bindings.filter(binding => {
    const matchesSearch = 
      binding.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      binding.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      binding.account_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">用户绑定管理</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            管理拼车套餐用户的专属AI账号绑定关系
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedBinding(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          创建绑定
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    总绑定数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.total_bindings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    活跃绑定
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.active_bindings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    过期绑定
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.expired_bindings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    激活率
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.total_bindings > 0 
                      ? Math.round((stats.active_bindings / stats.total_bindings) * 100)
                      : 0
                    }%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 按服务商统计 */}
      {stats && stats.by_provider.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            按服务商统计
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.by_provider.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item.binding_count}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                  {item.provider}
                </div>
              </div>
            ))}
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
              placeholder="搜索用户名、邮箱或账号..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">所有状态</option>
              <option value="active">活跃</option>
              <option value="inactive">未激活</option>
              <option value="expired">已过期</option>
              <option value="suspended">已暂停</option>
            </select>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">所有套餐</option>
              <option value="shared">拼车套餐</option>
            </select>
          </div>
        </div>
      </div>

      {/* 绑定列表 */}
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
                      用户信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      AI账号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      绑定信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      使用统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      状态/到期
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredBindings.map((binding) => (
                    <tr key={binding.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {binding.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {binding.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {binding.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {binding.account_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                            {binding.provider} - {binding.tier}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getBindingTypeText(binding.binding_type)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            优先级: {binding.priority_level}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {binding.plan_display_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <div>请求: {binding.total_requests.toLocaleString()}</div>
                          <div>Tokens: {binding.total_tokens.toLocaleString()}</div>
                          <div>费用: ¥{binding.total_cost.toFixed(2)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(binding.binding_status, binding.expires_at)}
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {getStatusText(binding.binding_status)}
                            </div>
                            {binding.expires_at && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {(() => {
                                  const days = getDaysUntilExpiry(binding.expires_at);
                                  if (days === null) return '';
                                  if (days < 0) return '已过期';
                                  if (days === 0) return '今天过期';
                                  if (days <= 7) return `${days}天后过期`;
                                  return formatDate(binding.expires_at);
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewDetails(binding)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditBinding(binding)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="编辑绑定"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBinding(binding)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="删除绑定"
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

      {/* 用户绑定编辑/创建模态框 */}
      {(showEditModal || showCreateModal) && (
        <BindingFormModal
          isOpen={showEditModal || showCreateModal}
          onClose={() => {
            setShowEditModal(false);
            setShowCreateModal(false);
            setSelectedBinding(null);
          }}
          onSave={handleSaveBinding}
          binding={selectedBinding}
          isEdit={showEditModal}
        />
      )}

      {/* 用户绑定详情模态框 */}
      {showDetailsModal && selectedBinding && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-xl bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                用户绑定详情 - {selectedBinding.username}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 用户信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">用户信息</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">用户名:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBinding.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">邮箱:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBinding.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">套餐:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBinding.plan_display_name}</span>
                  </div>
                </div>
              </div>

              {/* AI账号信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">AI账号信息</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">账号名称:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBinding.account_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">服务商:</span>
                    <span className="font-medium text-gray-900 dark:text-white uppercase">{selectedBinding.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">账号等级:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedBinding.tier}</span>
                  </div>
                </div>
              </div>

              {/* 绑定配置 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">绑定配置</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">绑定类型:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getBindingTypeText(selectedBinding.binding_type)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">优先级:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedBinding.priority_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">绑定状态:</span>
                    <div className="flex items-center">
                      {getStatusIcon(selectedBinding.binding_status, selectedBinding.expires_at)}
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {getStatusText(selectedBinding.binding_status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">请求限制:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedBinding.max_requests_per_hour || '无限制'}/小时
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Token限制:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedBinding.max_tokens_per_hour ? `${selectedBinding.max_tokens_per_hour.toLocaleString()}/小时` : '无限制'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 时间信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">时间信息</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">开始时间:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedBinding.starts_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">到期时间:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedBinding.expires_at ? formatDate(selectedBinding.expires_at) : '永不过期'}
                    </span>
                  </div>
                  {selectedBinding.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">剩余天数:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const days = getDaysUntilExpiry(selectedBinding.expires_at);
                          if (days === null) return '永不过期';
                          if (days < 0) return '已过期';
                          if (days === 0) return '今天过期';
                          return `${days}天`;
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">最后使用:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedBinding.last_used_at ? formatDate(selectedBinding.last_used_at) : '从未使用'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">创建时间:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedBinding.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 使用统计 */}
            <div className="mt-6 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">使用统计</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedBinding.total_requests.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总请求数</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedBinding.total_tokens.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总Token数</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ¥{selectedBinding.total_cost.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总费用</div>
                </div>
              </div>
            </div>

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