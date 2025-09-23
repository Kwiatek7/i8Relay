import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus-visible:ring-blue-400 dark:hover:border-gray-600",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none dark:text-gray-400" />
      </div>
    )
  }
)
Select.displayName = "Select"

// Legacy components for backwards compatibility
const SelectTrigger = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <Select className={className} ref={ref} {...props}>
      {children}
    </Select>
  )
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ children }: { children: React.ReactNode }) => children
const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
)
const SelectValue = ({ placeholder }: { placeholder?: string }) => null

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }