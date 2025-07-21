import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const formFieldVariants = cva(
  "space-y-2",
  {
    variants: {
      state: {
        default: "",
        success: "",
        error: "",
        loading: "",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
)

interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  required?: boolean
  loading?: boolean
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, state, label, description, error, success, required, loading, children, ...props }, ref) => {
    const fieldState = loading ? "loading" : error ? "error" : success ? "success" : "default"

    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ state: fieldState }), className)}
        {...props}
      >
        {label && (
          <label className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            required && "after:content-['*'] after:ml-1 after:text-destructive",
            error && "text-destructive",
            success && "text-gocars-green-700 dark:text-gocars-green-400"
          )}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {children}
          
          {/* State indicators */}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {success && !loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle className="h-4 w-4 text-gocars-green-600" />
            </div>
          )}
          
          {error && !loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>
        
        {/* Messages */}
        {description && !error && !success && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>{description}</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive animate-slide-down">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 text-sm text-gocars-green-700 dark:text-gocars-green-400 animate-slide-down">
            <CheckCircle className="h-3 w-3" />
            <span>{success}</span>
          </div>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

// Enhanced Input with built-in validation states
interface EnhancedInputProps extends React.ComponentProps<"input"> {
  state?: "default" | "success" | "error" | "loading"
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, state = "default", leftIcon, rightIcon, ...props }, ref) => {
    const stateClasses = {
      default: "border-input focus-visible:border-primary",
      success: "border-gocars-green-500 focus-visible:border-gocars-green-600 focus-visible:ring-gocars-green-200",
      error: "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
      loading: "border-input focus-visible:border-primary",
    }

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-background px-4 py-2.5 text-base shadow-gocars-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 hover:border-primary/50 hover:shadow-gocars disabled:cursor-not-allowed disabled:opacity-50",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            stateClasses[state],
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

export { FormField, EnhancedInput, formFieldVariants }