import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-primary-500 text-white hover:bg-brand-primary-600 focus:ring-brand-primary-500/20",
        secondary: "border-transparent bg-brand-secondary-100 text-brand-secondary-900 hover:bg-brand-secondary-200 focus:ring-brand-secondary-500/20",
        destructive: "border-transparent bg-error-500 text-white hover:bg-error-600 focus:ring-error-500/20",
        outline: "text-brand-secondary-700 border-brand-secondary-300 hover:bg-brand-secondary-50 hover:text-brand-secondary-900 focus:ring-brand-secondary-500/20",
        success: "border-transparent bg-success-100 text-success-800 hover:bg-success-200 focus:ring-success-500/20",
        warning: "border-transparent bg-warning-100 text-warning-800 hover:bg-warning-200 focus:ring-warning-500/20",
        info: "border-transparent bg-brand-primary-100 text-brand-primary-800 hover:bg-brand-primary-200 focus:ring-brand-primary-500/20",
        accent: "border-transparent bg-brand-accent-yellow-500 text-brand-secondary-900 hover:bg-brand-accent-yellow-600 focus:ring-brand-accent-yellow-500/20",
        gradient: "border-transparent bg-gradient-brand text-white hover:opacity-90 focus:ring-brand-primary-500/20",
        ghost: "border-transparent hover:bg-brand-secondary-100 hover:text-brand-secondary-900 focus:ring-brand-secondary-500/20",
      },
      size: {
        xs: "px-2 py-0.5 text-xs h-5",
        sm: "px-2.5 py-0.5 text-xs h-6",
        default: "px-3 py-1 text-sm h-7",
        lg: "px-4 py-1.5 text-sm h-8",
        xl: "px-5 py-2 text-base h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Badge({ 
  className, 
  variant, 
  size, 
  pulse, 
  dot, 
  removable, 
  onRemove, 
  leftIcon, 
  rightIcon, 
  children,
  ...props 
}: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant, size }), 
        pulse && "animate-pulse-brand",
        dot && "relative",
        "group",
        className
      )} 
      {...props} 
    >
      {/* Status dot */}
      {dot && (
        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-error-500 animate-pulse-brand" />
      )}
      
      {/* Left icon */}
      {leftIcon && (
        <span className="mr-1 transition-transform group-hover:scale-110">
          {leftIcon}
        </span>
      )}
      
      {/* Content */}
      <span className="truncate">{children}</span>
      
      {/* Right icon */}
      {rightIcon && !removable && (
        <span className="ml-1 transition-transform group-hover:scale-110">
          {rightIcon}
        </span>
      )}
      
      {/* Remove button */}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current transition-colors duration-200"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
