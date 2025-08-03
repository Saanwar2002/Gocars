import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 shadow-sm transition-all duration-300 animate-fade-in-up group",
  {
    variants: {
      variant: {
        default: "bg-background text-brand-secondary-900 border-brand-secondary-200 hover:shadow-md",
        destructive: "border-error-200 bg-error-50 text-error-800 hover:shadow-lg [&>svg]:text-error-600",
        success: "border-success-200 bg-success-50 text-success-800 hover:shadow-lg [&>svg]:text-success-600",
        warning: "border-warning-200 bg-warning-50 text-warning-800 hover:shadow-lg [&>svg]:text-warning-600",
        info: "border-brand-primary-200 bg-brand-primary-50 text-brand-primary-800 hover:shadow-lg [&>svg]:text-brand-primary-600",
        accent: "border-brand-accent-yellow-200 bg-brand-accent-yellow-50 text-brand-secondary-800 hover:shadow-lg [&>svg]:text-brand-accent-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
  autoClose?: number
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, dismissible, onDismiss, icon, autoClose, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    
    // Auto close functionality
    React.useEffect(() => {
      if (autoClose && autoClose > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => onDismiss?.(), 300) // Wait for animation
        }, autoClose)
        
        return () => clearTimeout(timer)
      }
    }, [autoClose, onDismiss])
    
    // Default icons for each variant
    const getDefaultIcon = () => {
      switch (variant) {
        case 'destructive':
          return <AlertCircle className="h-4 w-4" />
        case 'success':
          return <CheckCircle2 className="h-4 w-4" />
        case 'warning':
          return <AlertTriangle className="h-4 w-4" />
        case 'info':
          return <Info className="h-4 w-4" />
        default:
          return <Info className="h-4 w-4" />
      }
    }
    
    const handleDismiss = () => {
      setIsVisible(false)
      setTimeout(() => onDismiss?.(), 300) // Wait for animation
    }
    
    if (!isVisible) {
      return null
    }
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          alertVariants({ variant }),
          !isVisible && "animate-fade-out opacity-0 scale-95",
          className
        )}
        {...props}
      >
        {/* Icon */}
        <div className="absolute left-4 top-4 transition-transform group-hover:scale-110">
          {icon || getDefaultIcon()}
        </div>
        
        {/* Content */}
        <div className="pl-7">
          {children}
        </div>
        
        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-full p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 transition-all duration-200 hover:scale-110"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        )}
        
        {/* Auto-close progress bar */}
        {autoClose && autoClose > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg animate-shrink-width" 
               style={{ animationDuration: `${autoClose}ms` }} />
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-2 font-semibold leading-none tracking-tight text-current group-hover:scale-[1.02] transition-transform duration-200",
      className
    )}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity duration-200 [&_p]:leading-relaxed",
      className
    )}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, alertVariants }
