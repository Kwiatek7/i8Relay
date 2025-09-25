'use client'

import { useState, useEffect } from 'react'
import { Input } from './input'

interface User {
  id: string
  username: string
  email: string
  user_role: string
}

interface UserSelectorProps {
  selectedUserIds: string[]
  onChange: (userIds: string[]) => void
  multiple?: boolean
  placeholder?: string
  className?: string
}

export function UserSelector({
  selectedUserIds = [],
  onChange,
  multiple = true,
  placeholder = "搜索并选择用户",
  className = ""
}: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])

  // 获取用户列表
  useEffect(() => {
    fetchUsers()
  }, [])

  // 根据选中的ID更新选中的用户列表
  useEffect(() => {
    if (allUsers.length > 0) {
      const selected = allUsers.filter(user => selectedUserIds.includes(user.id))
      setSelectedUsers(selected)
    }
  }, [selectedUserIds, allUsers])

  const fetchUsers = async (search = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '50'
      })
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const fetchedUsers = data.data?.users || []
        setUsers(fetchedUsers)
        if (!search) {
          setAllUsers(fetchedUsers) // 保存完整用户列表用于ID查找
        }
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (value.length > 0) {
      fetchUsers(value)
    } else {
      fetchUsers()
    }
  }

  const handleUserSelect = (user: User) => {
    if (multiple) {
      const isSelected = selectedUserIds.includes(user.id)
      let newSelectedIds: string[]
      
      if (isSelected) {
        newSelectedIds = selectedUserIds.filter(id => id !== user.id)
      } else {
        newSelectedIds = [...selectedUserIds, user.id]
      }
      
      onChange(newSelectedIds)
    } else {
      onChange([user.id])
      setIsOpen(false)
    }
  }

  const removeUser = (userId: string) => {
    const newSelectedIds = selectedUserIds.filter(id => id !== userId)
    onChange(newSelectedIds)
  }

  const getRoleText = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'super_admin': '超级管理员',
      'admin': '管理员',
      'user': '普通用户'
    }
    return roleMap[role] || role
  }

  const getRoleColor = (role: string) => {
    const colorMap: { [key: string]: string } = {
      'super_admin': 'text-purple-600 bg-purple-100',
      'admin': 'text-blue-600 bg-blue-100',
      'user': 'text-gray-600 bg-gray-100'
    }
    return colorMap[role] || 'text-gray-600 bg-gray-100'
  }

  return (
    <div className={`relative ${className}`}>
      {/* 已选择的用户标签 */}
      {selectedUsers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              <span>{user.username}</span>
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 搜索输入框 */}
      <div className="relative">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full"
        />
        
        {/* 下拉列表 */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">
                加载中...
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                    selectedUserIds.includes(user.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.user_role)}`}>
                        {getRoleText(user.user_role)}
                      </span>
                      {selectedUserIds.includes(user.id) && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">
                {searchTerm ? '未找到匹配的用户' : '暂无用户'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 点击外部关闭下拉列表 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}