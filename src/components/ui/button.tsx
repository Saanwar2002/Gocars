import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-brand-primary-500 text-white hover:bg-brand-primary-600 shadow-sm hover:shadow-brand-md active:shadow-sm",
        destructive: "bg-error-500 text-white hover:bg-error-600 shadow-sm hover:shadow-lg active:shadow-sm",
        outline: "border border-brand-secondary-300 bg-background hover:bg-brand-secondary-50 hover:text-brand-secondary-900 hover:shadow-sm",
        secondary: "bg-brand-secondary-100 text-brand-secondary-900 hover:bg-brand-secondary-200 shadow-sm hover:shadow-md active:shadow-sm",
        ghost: "hover:bg-brand-secondary-100 hover:text-brand-secondary-900 hover:shadow-sm",
        link: "text-brand-primary-500 underline-offset-4 hover:underline hover:text-brand-primary-600",
        success: "bg-success-500 text-white hover:bg-success-600 shadow-sm hover:shadow-lg active:shadow-sm",
        warning: "bg-warning-500 text-brand-secondary-900 hover:bg-warning-600 shadow-sm hover:shadow-lg active:shadow-sm",
        accent: "bg-brand-accent-yellow-500 text-brand-secondary-900 hover:bg-brand-accent-yellow-600 shadow-sm hover:shadow-brand-md active:shadow-sm",
        gradient: "bg-gradient-brand text-white hover:opacity-90 shadow-sm hover:shadow-brand-lg active:shadow-sm",
      },
      size: {
        xs: "h-7 rounded px-2 text-xs touch-target-sm",
        sm: "h-9 rounded-md px-3 text-xs touch-target-sm",
        default: "h-11 px-5 py-2.5 touch-target",
        lg: "h-12 rounded-lg px-8 text-base touch-target-lg",
        xl: "h-14 rounded-xl px-10 text-lg touch-target-lg",
        icon: "h-10 w-10 touch-target",
        "icon-sm": "h-8 w-8 touch-target-sm",
        "icon-lg": "h-12 w-12 touch-target-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "cursor-not-allowed",
          "group relative overflow-hidden"
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading shimmer effect */}
        {loading && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
        
        {/* Left icon */}
        {leftIcon && !loading && (
          <span className="transition-transform group-hover:scale-110">
            {leftIcon}
          </span>
        )}
        
        {/* Loading spinner */}
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        
        {/* Button text */}
        <span className={cn(
          "transition-all duration-200",
          loading && "opacity-70"
        )}>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {/* Right icon */}
        {rightIcon && !loading && (
          <span className="transition-transform group-hover:scale-110">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
