
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg bg-background px-4 py-2.5 text-base transition-all duration-200 placeholder:text-brand-secondary-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 touch-target",
  {
    variants: {
      variant: {
        default: "border border-brand-secondary-300 hover:border-brand-primary-400 focus-visible:border-brand-primary-500 focus-visible:ring-2 focus-visible:ring-brand-primary-500/20 shadow-sm hover:shadow-md focus-visible:shadow-brand-md",
        error: "border-error-500 hover:border-error-600 focus-visible:border-error-500 focus-visible:ring-2 focus-visible:ring-error-500/20 shadow-sm hover:shadow-md focus-visible:shadow-lg",
        success: "border-success-500 hover:border-success-600 focus-visible:border-success-500 focus-visible:ring-2 focus-visible:ring-success-500/20 shadow-sm hover:shadow-md focus-visible:shadow-lg",
        ghost: "border-transparent hover:border-brand-secondary-300 focus-visible:border-brand-primary-500 focus-visible:ring-2 focus-visible:ring-brand-primary-500/20 hover:bg-brand-secondary-50",
      },
      size: {
        sm: "h-9 px-3 py-2 text-sm",
        default: "h-11 px-4 py-2.5 text-base",
        lg: "h-12 px-5 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
  VariantProps<typeof inputVariants> {
  error?: string
  success?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    type,
    error,
    success,
    leftIcon,
    rightIcon,
    loading,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type
    const hasError = !!error
    const hasSuccess = !!success && !hasError

    // Determine variant based on state
    const effectiveVariant = hasError ? "error" : hasSuccess ? "success" : variant

    return (
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary-400 transition-colors duration-200">
            {leftIcon}
          </div>
        )}

        <input
          type={inputType}
          className={cn(
            inputVariants({ variant: effectiveVariant, size, className }),
            leftIcon && "pl-10",
            (rightIcon || isPassword || hasError || hasSuccess || loading) && "pr-10",
            isFocused && "animate-pulse-brand"
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />

        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {/* Loading spinner */}
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary-500 border-t-transparent" />
          )}

          {/* Success icon */}
          {hasSuccess && !loading && (
            <CheckCircle2 className="h-4 w-4 text-success-500" />
          )}

          {/* Error icon */}
          {hasError && !loading && (
            <AlertCircle className="h-4 w-4 text-error-500" />
          )}

          {/* Password toggle */}
          {isPassword && !loading && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-brand-secondary-400 hover:text-brand-secondary-600 transition-colors duration-200 touch-target-sm"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Custom right icon */}
          {rightIcon && !isPassword && !hasError && !hasSuccess && !loading && (
            <div className="text-brand-secondary-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-error-500 animate-fade-in-up">
            {error}
          </p>
        )}

        {/* Success message */}
        {success && !error && (
          <p className="mt-1 text-sm text-success-500 animate-fade-in-up">
            {success}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
