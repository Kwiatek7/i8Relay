'use client'

import { useState, useEffect } from 'react'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Select } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { UserSelector } from '../../../components/ui/user-selector'
import { ToastProvider, useToast } from '../../../components/ui/toast'

type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'billing' | 'security' | 'system'

interface TriggerCondition {
  threshold?: number
  days_before?: number
  threshold_percent?: number
}

interface AdminNotification {
  id: string
  title: string
  message: string
  type: string
  priority: string
  isRead: boolean
  actionUrl: string | null
  createdAt: string
  updatedAt: string
  userId: string
  user?: {
    username: string
    email: string
  }
}

interface NotificationTemplate {
  id: string
  name: string
  title: string
  message: string
  type: NotificationType
  priority: string
  actionUrl: string | null
  variables: any
  createdAt: string
  updatedAt: string
  rulesCount: number
}

interface NotificationRule {
  id: string
  name: string
  description: string
  type: string
  triggerCondition: TriggerCondition
  templateId: string
  targetScope: string
  targetUsers: string[] | null
  isEnabled: boolean
  cooldownMinutes: number
  createdBy: string
  createdAt: string
  updatedAt: string
  template?: {
    name: string
    title: string
    type: string
    priority: string
  }
  createdByUsername?: string
}

function AdminNotificationsPageContent() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates' | 'rules'>('notifications')

  // 统一提示方法
  const showSuccess = (message: string) => {
    toast({
      type: 'success',
      title: '操作成功',
      description: message
    })
  }

  const showError = (message: string) => {
    toast({
      type: 'error',
      title: '操作失败',
      description: message
    })
  }
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  
  // 对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    type: 'info' as NotificationType,
    targetUsers: [] as string[],
    scheduled_at: ''
  })
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    title: '',
    message: '',
    type: 'info' as NotificationType,
    priority: 'medium',
    actionUrl: '',
    variables: ''
  })
  const [createRuleDialogOpen, setCreateRuleDialogOpen] = useState(false)
  const [editRuleDialogOpen, setEditRuleDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null)
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    type: 'balance_low',
    triggerCondition: {} as TriggerCondition,
    templateId: '',
    targetScope: 'all_users',
    targetUsers: [] as string[],
    isEnabled: true,
    cooldownMinutes: 60
  })

  useEffect(() => {
    fetchData()
  }, [activeTab, currentPage, searchTerm, statusFilter, typeFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'notifications') {
        await fetchNotifications()
      } else if (activeTab === 'templates') {
        await fetchTemplates()
      } else if (activeTab === 'rules') {
        // 规则页面需要同时获取规则和模板数据
        await Promise.all([fetchRules(), fetchTemplates()])
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      pageSize: pageSize.toString(),
    })
    if (searchTerm) params.append('search', searchTerm)
    if (statusFilter) params.append('status', statusFilter)
    if (typeFilter) params.append('type', typeFilter)

    try {
      const response = await fetch(`/api/admin/notifications?${params}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data) // 调试信息
        if (data.success && data.data) {
          // API返回的data.data直接就是结果对象，包含data数组和分页信息
          const result = data.data
          const notificationsData = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : [])
          setNotifications(notificationsData)
          const total = result.total || 0
          const pages = result.totalPages || Math.ceil(total / pageSize)
          setTotalItems(total)
          setTotalPages(pages)
          console.log('分页信息:', { total, pageSize, pages, currentPage, result }) // 调试分页信息
        } else {
          setNotifications([])
        }
      } else {
        console.error('API Error:', response.status)
        setNotifications([])
      }
    } catch (error) {
      console.error('Fetch Error:', error)
      setNotifications([])
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/notification-templates', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Templates API Response:', data) // 调试信息
        // API直接返回模板数组
        const templatesData = Array.isArray(data.data) ? data.data : []
        setTemplates(templatesData)
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error('Fetch Templates Error:', error)
      setTemplates([])
    }
  }

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/admin/notification-rules', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Rules API Response:', data) // 调试信息
        const rulesData = Array.isArray(data.data) ? data.data : []
        setRules(rulesData)
      } else {
        setRules([])
      }
    } catch (error) {
      console.error('Fetch Rules Error:', error)
      setRules([])
    }
  }

  const handleCreateNotification = async () => {
    try {
      const notificationData = {
        title: newNotification.title,
        message: newNotification.content,
        type: newNotification.type,
        priority: 'medium',
        targetUsers: newNotification.targetUsers,
        sendToAll: newNotification.targetUsers.length === 0,
        scheduled_at: newNotification.scheduled_at
      };

      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      })
      
      if (response.ok) {
        setCreateDialogOpen(false)
        setNewNotification({
          title: '',
          content: '',
          type: 'info',
          targetUsers: [],
          scheduled_at: ''
        })
        fetchNotifications()
        showSuccess('通知创建成功')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '创建通知失败')
      }
    } catch (error) {
      console.error('创建通知失败:', error)
      showError('创建通知失败，请稍后重试')
    }
  }

  const handleBatchAction = async (action: string) => {
    if (selectedNotifications.length === 0) return

    try {
      const response = await fetch('/api/admin/notifications/batch', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notificationIds: selectedNotifications
        })
      })

      if (response.ok) {
        setSelectedNotifications([])
        fetchNotifications()
        const actionText = action === 'markAsRead' ? '标记为已读' : action === 'markAsUnread' ? '标记为未读' : '删除'
        showSuccess(`批量${actionText}操作成功`)
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '批量操作失败')
      }
    } catch (error) {
      console.error('批量操作失败:', error)
      showError('批量操作失败，请稍后重试')
    }
  }

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('确定要删除这条通知吗？')) return

    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        fetchNotifications()
        showSuccess('通知删除成功')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '删除通知失败')
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      showError('删除通知失败，请稍后重试')
    }
  }

  const handleToggleRead = async (id: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !isRead })
      })

      if (response.ok) {
        fetchNotifications()
        showSuccess(isRead ? '已标记为未读' : '已标记为已读')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '更新通知状态失败')
      }
    } catch (error) {
      console.error('更新通知状态失败:', error)
      showError('更新通知状态失败，请稍后重试')
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const templateData = {
        name: newTemplate.name,
        title: newTemplate.title,
        message: newTemplate.message,
        type: newTemplate.type,
        priority: newTemplate.priority,
        actionUrl: newTemplate.actionUrl || null,
        variables: newTemplate.variables ? JSON.parse(newTemplate.variables) : {}
      };

      const response = await fetch('/api/admin/notification-templates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      
      if (response.ok) {
        setEditTemplateDialogOpen(false)
        setNewTemplate({
          name: '',
          title: '',
          message: '',
          type: 'info',
          priority: 'medium',
          actionUrl: '',
          variables: ''
        })
        fetchTemplates()
        showSuccess('模板创建成功')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '创建模板失败')
      }
    } catch (error) {
      console.error('创建模板失败:', error)
      showError('创建模板失败，请稍后重试')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return
    
    try {
      const templateData = {
        name: newTemplate.name,
        title: newTemplate.title,
        message: newTemplate.message,
        type: newTemplate.type,
        priority: newTemplate.priority,
        actionUrl: newTemplate.actionUrl || null,
        variables: newTemplate.variables ? JSON.parse(newTemplate.variables) : {}
      };

      const response = await fetch(`/api/admin/notification-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      
      if (response.ok) {
        setEditTemplateDialogOpen(false)
        setSelectedTemplate(null)
        setNewTemplate({
          name: '',
          title: '',
          message: '',
          type: 'info',
          priority: 'medium',
          actionUrl: '',
          variables: ''
        })
        fetchTemplates()
        showSuccess('模板更新成功')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '更新模板失败')
      }
    } catch (error) {
      console.error('更新模板失败:', error)
      showError('更新模板失败，请稍后重试')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return

    try {
      const response = await fetch(`/api/admin/notification-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        fetchTemplates()
        showSuccess('模板删除成功')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '删除模板失败')
      }
    } catch (error) {
      console.error('删除模板失败:', error)
      showError('删除模板失败，请稍后重试')
    }
  }

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/admin/notification-rules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      })
      
      if (response.ok) {
        setCreateRuleDialogOpen(false)
        setNewRule({
          name: '',
          description: '',
          type: 'balance_low',
          triggerCondition: {} as TriggerCondition,
          templateId: '',
          targetScope: 'all_users',
          targetUsers: [],
          isEnabled: true,
          cooldownMinutes: 60
        })
        fetchRules()
        showSuccess('规则创建成功')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '创建规则失败')
      }
    } catch (error) {
      console.error('创建规则失败:', error)
      showError('创建规则失败，请稍后重试')
    }
  }

  const handleUpdateRule = async () => {
    if (!selectedRule) return
    
    try {
      const response = await fetch(`/api/admin/notification-rules/${selectedRule.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      })
      
      if (response.ok) {
        setEditRuleDialogOpen(false)
        setSelectedRule(null)
        setNewRule({
          name: '',
          description: '',
          type: 'balance_low',
          triggerCondition: {} as TriggerCondition,
          templateId: '',
          targetScope: 'all_users',
          targetUsers: [],
          isEnabled: true,
          cooldownMinutes: 60
        })
        fetchRules()
        showSuccess('规则更新成功')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '更新规则失败')
      }
    } catch (error) {
      console.error('更新规则失败:', error)
      showError('更新规则失败，请稍后重试')
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm('确定要删除这个规则吗？')) return

    try {
      const response = await fetch(`/api/admin/notification-rules/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        fetchRules()
        showSuccess('规则删除成功')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '删除规则失败')
      }
    } catch (error) {
      console.error('删除规则失败:', error)
      showError('删除规则失败，请稍后重试')
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      // 找到对应的规则对象
      const rule = rules.find(r => r.id === ruleId)
      if (!rule) {
        console.error('未找到规则:', ruleId)
        return
      }

      // 发送完整的规则数据
      const ruleData = {
        name: rule.name,
        description: rule.description,
        type: rule.type,
        triggerCondition: rule.triggerCondition,
        templateId: rule.templateId,
        targetScope: rule.targetScope,
        targetUsers: rule.targetUsers,
        isEnabled: enabled,
        cooldownMinutes: rule.cooldownMinutes
      }

      const response = await fetch(`/api/admin/notification-rules/${ruleId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      })

      if (response.ok) {
        fetchRules()
        showSuccess(enabled ? '规则已启用' : '规则已禁用')
      } else {
        const errorData = await response.json()
        showError(errorData.error?.message || '更新规则状态失败')
      }
    } catch (error) {
      console.error('更新规则失败:', error)
      showError('更新规则状态失败，请稍后重试')
    }
  }

  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      info: '信息',
      warning: '警告',
      error: '错误',
      success: '成功',
      billing: '账单',
      security: '安全',
      system: '系统'
    }
    return typeMap[type] || type
  }

  const getRuleTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      balance_low: '余额不足',
      subscription_expiring: '套餐到期',
      usage_limit: '使用量超限',
      payment_failed: '支付失败',
      login_security: '登录安全'
    }
    return typeMap[type] || type
  }

  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      info: 'text-blue-600 bg-blue-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100', 
      success: 'text-green-600 bg-green-100',
      billing: 'text-purple-600 bg-purple-100',
      security: 'text-red-600 bg-red-100',
      system: 'text-gray-600 bg-gray-100'
    }
    return colorMap[type] || 'text-gray-600 bg-gray-100'
  }

  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      low: '低',
      medium: '中',
      high: '高'
    }
    return priorityMap[priority] || priority
  }

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100'
    }
    return colorMap[priority] || 'text-gray-600 bg-gray-100'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">通知管理</h1>
        <p className="text-gray-600">管理系统通知、模板和规则</p>
      </div>

      {/* 标签页 */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600 border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              通知列表
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600 border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              通知模板
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'rules'
                  ? 'border-blue-500 text-blue-600 border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              通知规则
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 通知列表页面 */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {/* 搜索和筛选 */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="搜索通知"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">全部状态</option>
                    <option value="true">已读</option>
                    <option value="false">未读</option>
                  </select>
                </div>
                <div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">全部类型</option>
                    <option value="info">信息</option>
                    <option value="warning">警告</option>
                    <option value="error">错误</option>
                    <option value="success">成功</option>
                    <option value="billing">账单</option>
                    <option value="security">安全</option>
                    <option value="system">系统</option>
                  </select>
                </div>
                <div>
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    创建通知
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setTypeFilter('')
                      setCurrentPage(1)
                    }}
                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    清除筛选
                  </button>
                </div>
              </div>

              {/* 批量操作 */}
              {selectedNotifications.length > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-600">
                    已选择 {selectedNotifications.length} 项
                  </span>
                  <button
                    onClick={() => handleBatchAction('markAsRead')}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    标记为已读
                  </button>
                  <button
                    onClick={() => handleBatchAction('markAsUnread')}
                    className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-800"
                  >
                    标记为未读
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定要删除选中的 ${selectedNotifications.length} 条通知吗？`)) {
                        handleBatchAction('delete')
                      }
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              )}

              {/* 通知表格 */}
              {loading ? (
                <div className="animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="py-4 border-b border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedNotifications(notifications.map(n => n.id))
                              } else {
                                setSelectedNotifications([])
                              }
                            }}
                            checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          标题
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          类型
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          优先级
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          创建时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(notifications) && notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <tr key={notification.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedNotifications.includes(notification.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedNotifications([...selectedNotifications, notification.id])
                                  } else {
                                    setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id))
                                  }
                                }}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {notification.message}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                                {getTypeText(notification.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                                {getPriorityText(notification.priority)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                notification.isRead ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                              }`}>
                                {notification.isRead ? '已读' : '未读'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {notification.user?.username || notification.userId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(notification.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleToggleRead(notification.id, notification.isRead)}
                                className={`mr-2 ${notification.isRead ? 'text-gray-600 hover:text-gray-800' : 'text-green-600 hover:text-green-800'}`}
                              >
                                {notification.isRead ? '标记未读' : '标记已读'}
                              </button>
                              <button 
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                删除
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                            暂无通知数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 分页 */}
              {totalItems > pageSize && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    显示 {((currentPage - 1) * pageSize) + 1} 到 {Math.min(currentPage * pageSize, totalItems)} 项，共 {totalItems} 项
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      上一页
                    </button>
                    <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 通知模板页面 */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">通知模板</h3>
                <button
                  onClick={() => {
                    setSelectedTemplate(null)
                    setNewTemplate({
                      name: '',
                      title: '',
                      message: '',
                      type: 'info',
                      priority: 'medium',
                      actionUrl: '',
                      variables: ''
                    })
                    setEditTemplateDialogOpen(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  新建模板
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(templates) && templates.length > 0 ? (
                  templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(template.type)}`}>
                            {getTypeText(template.type)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(template.priority)}`}>
                            {getPriorityText(template.priority)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.title}</p>
                      <div className="text-xs text-gray-500 mb-3 h-12 overflow-hidden">
                        {template.message}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-400">
                          <span>关联规则: {template.rulesCount}</span>
                          {template.actionUrl && <span className="ml-2">• 有操作链接</span>}
                          {template.variables && Object.keys(template.variables).length > 0 && (
                            <span className="ml-2">• 变量: {Object.keys(template.variables).length}</span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTemplate(template)
                              setNewTemplate({
                                name: template.name,
                                title: template.title,
                                message: template.message,
                                type: template.type as NotificationType,
                                priority: template.priority,
                                actionUrl: template.actionUrl || '',
                                variables: JSON.stringify(template.variables || {}, null, 2)
                              })
                              setEditTemplateDialogOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            编辑
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 col-span-full">
                    暂无模板数据
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 通知规则页面 */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">通知规则</h3>
                <button 
                  onClick={() => {
                    setSelectedRule(null)
                    setNewRule({
                      name: '',
                      description: '',
                      type: 'balance_low',
                      triggerCondition: {} as TriggerCondition,
                      templateId: '',
                      targetScope: 'all_users',
                      targetUsers: [],
                      isEnabled: true,
                      cooldownMinutes: 60
                    })
                    setCreateRuleDialogOpen(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  新建规则
                </button>
              </div>

              <div className="space-y-4">
                {Array.isArray(rules) && rules.length > 0 ? (
                  rules.map((rule) => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{rule.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>类型: {getRuleTypeText(rule.type)}</div>
                            <div>模板: {rule.template?.name || rule.templateId}</div>
                            <div>目标: {rule.targetScope === 'all_users' ? '所有用户' : '指定用户'}</div>
                            <div>冷却时间: {rule.cooldownMinutes}分钟</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={rule.isEnabled}
                              onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-600">启用</span>
                          </label>
                          <button 
                            onClick={() => {
                              setSelectedRule(rule)
                              setNewRule({
                                name: rule.name,
                                description: rule.description,
                                type: rule.type,
                                triggerCondition: rule.triggerCondition,
                                templateId: rule.templateId,
                                targetScope: rule.targetScope,
                                targetUsers: rule.targetUsers || [],
                                isEnabled: rule.isEnabled,
                                cooldownMinutes: rule.cooldownMinutes
                              })
                              setEditRuleDialogOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            编辑
                          </button>
                          <button 
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无规则数据
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建通知对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="flex-shrink-0 px-6 pt-6">
            <DialogTitle>创建新通知</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题
                </label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  placeholder="通知标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容
                </label>
                <Textarea
                  value={newNotification.content}
                  onChange={(e) => setNewNotification({...newNotification, content: e.target.value})}
                  placeholder="通知内容"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  类型
                </label>
                <Select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({...newNotification, type: e.target.value as NotificationType})}
                >
                  <option value="info">信息</option>
                  <option value="warning">警告</option>
                  <option value="error">错误</option>
                  <option value="success">成功</option>
                  <option value="billing">账单</option>
                  <option value="security">安全</option>
                  <option value="system">系统</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标用户 (可选)
                </label>
                <UserSelector
                  selectedUserIds={newNotification.targetUsers}
                  onChange={(userIds) => setNewNotification({...newNotification, targetUsers: userIds})}
                  placeholder="搜索并选择目标用户，留空表示全部用户"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  定时发送 (可选)
                </label>
                <Input
                  type="datetime-local"
                  value={newNotification.scheduled_at}
                  onChange={(e) => setNewNotification({...newNotification, scheduled_at: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end space-x-2 px-6 pb-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setCreateDialogOpen(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleCreateNotification}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              创建
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑模板对话框 */}
      <Dialog open={editTemplateDialogOpen} onOpenChange={setEditTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0 px-6 pt-6">
            <DialogTitle>
              {selectedTemplate ? '编辑模板' : '新建模板'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板名称
                </label>
                <Input 
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="模板名称" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题
                </label>
                <Input 
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                  placeholder="通知标题" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容
                </label>
                <Textarea 
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({...newTemplate, message: e.target.value})}
                  placeholder="通知内容模板，支持 {{变量}} 语法" 
                  rows={4} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <Select
                  value={newTemplate.priority}
                  onChange={(e) => setNewTemplate({...newTemplate, priority: e.target.value})}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作链接 (可选)
                </label>
                <Input 
                  value={newTemplate.actionUrl}
                  onChange={(e) => setNewTemplate({...newTemplate, actionUrl: e.target.value})}
                  placeholder="如：/dashboard/billing" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  变量说明 (JSON 格式，可选)
                </label>
                <Textarea 
                  value={newTemplate.variables}
                  onChange={(e) => setNewTemplate({...newTemplate, variables: e.target.value})}
                  placeholder='{"变量名": "说明", "threshold": "阈值"}'
                  rows={3} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  类型
                </label>
                <Select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value as NotificationType})}
                >
                  <option value="info">信息</option>
                  <option value="warning">警告</option>
                  <option value="error">错误</option>
                  <option value="success">成功</option>
                  <option value="billing">账单</option>
                  <option value="security">安全</option>
                  <option value="system">系统</option>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end space-x-2 px-6 pb-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setEditTemplateDialogOpen(false)
                setSelectedTemplate(null)
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button 
              onClick={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 创建规则对话框 */}
      <Dialog open={createRuleDialogOpen} onOpenChange={setCreateRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0 px-6 pt-6">
            <DialogTitle>创建新规则</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  规则名称
                </label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  placeholder="规则名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <Textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  placeholder="规则描述"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  触发类型
                </label>
                <Select
                  value={newRule.type}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                >
                  <option value="">选择触发类型</option>
                  <option value="balance_low">余额不足</option>
                  <option value="subscription_expiring">套餐到期</option>
                  <option value="usage_limit">使用量超限</option>
                  <option value="payment_failed">支付失败</option>
                  <option value="login_security">登录安全</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知模板
                </label>
                <Select
                  value={newRule.templateId}
                  onChange={(e) => setNewRule({...newRule, templateId: e.target.value})}
                >
                  <option value="">选择模板</option>
                  {Array.isArray(templates) && templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标范围
                </label>
                <Select
                  value={newRule.targetScope}
                  onChange={(e) => setNewRule({...newRule, targetScope: e.target.value})}
                >
                  <option value="all_users">所有用户</option>
                  <option value="specific_users">指定用户</option>
                </Select>
              </div>
              {newRule.targetScope === 'specific_users' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择用户
                  </label>
                  <UserSelector
                    selectedUserIds={newRule.targetUsers}
                    onChange={(userIds) => setNewRule({...newRule, targetUsers: userIds})}
                    placeholder="搜索并选择目标用户"
                  />
                </div>
              )}

              {/* 触发条件 */}
              {newRule.type === 'balance_low' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    余额阈值（元）
                  </label>
                  <Input
                    type="number"
                    value={newRule.triggerCondition?.threshold || ''}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      triggerCondition: { threshold: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="10"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {newRule.type === 'subscription_expiring' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提前天数
                  </label>
                  <Input
                    type="number"
                    value={newRule.triggerCondition?.days_before || ''}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      triggerCondition: { days_before: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="7"
                    min="1"
                  />
                </div>
              )}

              {newRule.type === 'usage_limit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    使用量阈值（%）
                  </label>
                  <Input
                    type="number"
                    value={newRule.triggerCondition?.threshold_percent || ''}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      triggerCondition: { threshold_percent: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="80"
                    min="1"
                    max="100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  冷却时间（分钟）
                </label>
                <Input
                  type="number"
                  value={newRule.cooldownMinutes}
                  onChange={(e) => setNewRule({...newRule, cooldownMinutes: parseInt(e.target.value) || 60})}
                  placeholder="60"
                  min="1"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRule.isEnabled}
                    onChange={(e) => setNewRule({...newRule, isEnabled: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">启用规则</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end space-x-2 px-6 pb-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setCreateRuleDialogOpen(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleCreateRule}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              创建
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑规则对话框 */}
      <Dialog open={editRuleDialogOpen} onOpenChange={setEditRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0 px-6 pt-6">
            <DialogTitle>编辑规则</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  规则名称
                </label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  placeholder="规则名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <Textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  placeholder="规则描述"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  触发类型
                </label>
                <Select
                  value={newRule.type}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                >
                  <option value="">选择触发类型</option>
                  <option value="balance_low">余额不足</option>
                  <option value="subscription_expiring">套餐到期</option>
                  <option value="usage_limit">使用量超限</option>
                  <option value="payment_failed">支付失败</option>
                  <option value="login_security">登录安全</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知模板
                </label>
                <Select
                  value={newRule.templateId}
                  onChange={(e) => setNewRule({...newRule, templateId: e.target.value})}
                >
                  <option value="">选择模板</option>
                  {Array.isArray(templates) && templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标范围
                </label>
                <Select
                  value={newRule.targetScope}
                  onChange={(e) => setNewRule({...newRule, targetScope: e.target.value})}
                >
                  <option value="all_users">所有用户</option>
                  <option value="specific_users">指定用户</option>
                </Select>
              </div>
              {newRule.targetScope === 'specific_users' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择用户
                  </label>
                  <UserSelector
                    selectedUserIds={newRule.targetUsers}
                    onChange={(userIds) => setNewRule({...newRule, targetUsers: userIds})}
                    placeholder="搜索并选择目标用户"
                  />
                </div>
              )}

              {/* 触发条件 */}
              {newRule.type === 'balance_low' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    余额阈值（元）
                  </label>
                  <Input
                    type="number"
                    value={newRule.triggerCondition?.threshold || ''}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      triggerCondition: { threshold: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="10"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {newRule.type === 'subscription_expiring' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提前天数
                  </label>
                  <Input
                    type="number"
                    value={newRule.triggerCondition?.days_before || ''}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      triggerCondition: { days_before: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="7"
                    min="1"
                  />
                </div>
              )}

              {newRule.type === 'usage_limit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    使用量阈值（%）
                  </label>
                  <Input
                    type="number"
                    value={newRule.triggerCondition?.threshold_percent || ''}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      triggerCondition: { threshold_percent: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="80"
                    min="1"
                    max="100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  冷却时间（分钟）
                </label>
                <Input
                  type="number"
                  value={newRule.cooldownMinutes}
                  onChange={(e) => setNewRule({...newRule, cooldownMinutes: parseInt(e.target.value) || 60})}
                  placeholder="60"
                  min="1"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRule.isEnabled}
                    onChange={(e) => setNewRule({...newRule, isEnabled: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">启用规则</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end space-x-2 px-6 pb-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setEditRuleDialogOpen(false)
                setSelectedRule(null)
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleUpdateRule}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminNotificationsPage() {
  return (
    <ToastProvider>
      <AdminNotificationsPageContent />
    </ToastProvider>
  )
}