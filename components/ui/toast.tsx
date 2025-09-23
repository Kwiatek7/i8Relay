'use client'

import * as React from "react"
import { useState, useEffect } from "react"
import { X, CheckCircle, AlertCircle, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

interface ToastProviderProps {
  children: React.ReactNode
}

interface ToastContextType {
  toast: (props: Omit<ToastProps, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastProps = {
      id,
      duration: 3000,
      ...props,
    }

    setToasts((prevToasts) => [...prevToasts, newToast])

    // 自动移除
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }
  }

  const dismiss = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastViewport({
  toasts,
  onDismiss
}: {
  toasts: ToastProps[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}

function Toast({ id, title, description, type = 'info', onClose }: ToastProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        "relative pointer-events-auto w-full overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
        "transition-all duration-300 ease-in-out",
        styles[type]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {title && (
            <div className="text-sm font-medium">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90 mt-1">{description}</div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}