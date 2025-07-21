import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Touch-optimized Button variants
const touchButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium shadow-gocars-sm ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-gocars hover:shadow-gocars-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-10 px-4 text-sm", // Increased from h-9 for better touch
        default: "h-12 px-6 py-3", // Increased from h-11 for better touch
        lg: "h-14 px-8 text-base", // Increased from h-12 for better touch
        xl: "h-16 px-10 text-lg", // New extra large size for mobile
        icon: "h-12 w-12", // Increased from h-10 w-10 for better touch
        "icon-sm": "h-10 w-10",
        "icon-lg": "h-14 w-14",
      },
      touchTarget: {
        default: "min-h-[44px] min-w-[44px]", // Apple's recommended minimum
        large: "min-h-[48px] min-w-[48px]", // Google's recommended minimum
        comfortable: "min-h-[56px] min-w-[56px]", // Extra comfortable
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      touchTarget: "default",
    },
  }
)

interface TouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof touchButtonVariants> {
  asChild?: boolean
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, variant, size, touchTarget, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(touchButtonVariants({ variant, size, touchTarget }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
TouchButton.displayName = "TouchButton"

// Touch-optimized Input
const touchInputVariants = cva(
  "flex w-full rounded-lg border border-input bg-background px-4 py-3 text-base shadow-gocars-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary focus-visible:shadow-gocars transition-all duration-200 hover:border-primary/50 hover:shadow-gocars disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
  {
    variants: {
      size: {
        sm: "h-10 px-3 py-2 text-sm",
        default: "h-12 px-4 py-3 text-base", // Increased height for mobile
        lg: "h-14 px-5 py-4 text-lg",
      },
      touchOptimized: {
        true: "min-h-[44px] text-base", // Ensure minimum touch target
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      touchOptimized: true,
    },
  }
)

interface TouchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof touchInputVariants> {}

const TouchInput = React.forwardRef<HTMLInputElement, TouchInputProps>(
  ({ className, size, touchOptimized, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(touchInputVariants({ size, touchOptimized }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
TouchInput.displayName = "TouchInput"

// Touch-optimized Card with better spacing
const touchCardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow-gocars-sm hover:shadow-gocars-md transition-all duration-300 touch-manipulation",
  {
    variants: {
      padding: {
        sm: "p-4",
        default: "p-6", // Increased padding for mobile
        lg: "p-8",
        responsive: "p-4 sm:p-6 lg:p-8",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-gocars-lg",
        false: "",
      },
      touchTarget: {
        true: "min-h-[44px]",
        false: "",
      },
    },
    defaultVariants: {
      padding: "responsive",
      interactive: false,
      touchTarget: false,
    },
  }
)

interface TouchCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof touchCardVariants> {}

const TouchCard = React.forwardRef<HTMLDivElement, TouchCardProps>(
  ({ className, padding, interactive, touchTarget, ...props }, ref) => {
    return (
      <div
        className={cn(touchCardVariants({ padding, interactive, touchTarget }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
TouchCard.displayName = "TouchCard"

// Mobile-optimized Navigation
interface MobileNavProps {
  children: React.ReactNode
  className?: string
}

const MobileNav = React.forwardRef<HTMLDivElement, MobileNavProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          "flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50 min-h-[56px]",
          className
        )}
        {...props}
      >
        {children}
      </nav>
    )
  }
)
MobileNav.displayName = "MobileNav"

// Touch-optimized List Item
const touchListItemVariants = cva(
  "flex items-center gap-3 p-4 rounded-lg transition-all duration-200 touch-manipulation cursor-pointer",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        ghost: "hover:bg-muted/50 active:bg-muted/80",
        bordered: "border border-border hover:border-primary/50 hover:bg-accent/50",
      },
      size: {
        sm: "p-3 min-h-[44px]",
        default: "p-4 min-h-[48px]",
        lg: "p-5 min-h-[56px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface TouchListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof touchListItemVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  title: string
  subtitle?: string
}

const TouchListItem = React.forwardRef<HTMLDivElement, TouchListItemProps>(
  ({ className, variant, size, leftIcon, rightIcon, title, subtitle, ...props }, ref) => {
    return (
      <div
        className={cn(touchListItemVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {leftIcon && (
          <div className="flex-shrink-0 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-sm text-muted-foreground truncate">
              {subtitle}
            </div>
          )}
        </div>
        
        {rightIcon && (
          <div className="flex-shrink-0 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
TouchListItem.displayName = "TouchListItem"

// Swipe Actions Component
interface SwipeActionsProps {
  children: React.ReactNode
  leftActions?: Array<{
    icon: React.ReactNode
    label: string
    color: 'primary' | 'destructive' | 'success' | 'warning'
    onAction: () => void
  }>
  rightActions?: Array<{
    icon: React.ReactNode
    label: string
    color: 'primary' | 'destructive' | 'success' | 'warning'
    onAction: () => void
  }>
  className?: string
}

const SwipeActions = React.forwardRef<HTMLDivElement, SwipeActionsProps>(
  ({ children, leftActions = [], rightActions = [], className, ...props }, ref) => {
    const [swipeOffset, setSwipeOffset] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const startX = React.useRef(0)
    const currentX = React.useRef(0)

    const handleTouchStart = (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX
      setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return
      
      currentX.current = e.touches[0].clientX
      const diff = currentX.current - startX.current
      setSwipeOffset(diff)
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      
      // Snap to action or return to center
      if (Math.abs(swipeOffset) > 80) {
        if (swipeOffset > 0 && leftActions.length > 0) {
          // Show left actions
          setSwipeOffset(120)
        } else if (swipeOffset < 0 && rightActions.length > 0) {
          // Show right actions
          setSwipeOffset(-120)
        } else {
          setSwipeOffset(0)
        }
      } else {
        setSwipeOffset(0)
      }
    }

    const getActionColor = (color: string) => {
      switch (color) {
        case 'destructive': return 'bg-destructive text-destructive-foreground'
        case 'success': return 'bg-gocars-green-600 text-white'
        case 'warning': return 'bg-gocars-orange-600 text-white'
        default: return 'bg-primary text-primary-foreground'
      }
    }

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {/* Left Actions */}
        {leftActions.length > 0 && (
          <div className="absolute left-0 top-0 h-full flex items-center">
            {leftActions.map((action, index) => (
              <button
                key={index}
                className={cn(
                  "h-full px-4 flex flex-col items-center justify-center gap-1 min-w-[80px]",
                  getActionColor(action.color)
                )}
                onClick={() => {
                  action.onAction()
                  setSwipeOffset(0)
                }}
              >
                {action.icon}
                <span className="text-xs">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right Actions */}
        {rightActions.length > 0 && (
          <div className="absolute right-0 top-0 h-full flex items-center">
            {rightActions.map((action, index) => (
              <button
                key={index}
                className={cn(
                  "h-full px-4 flex flex-col items-center justify-center gap-1 min-w-[80px]",
                  getActionColor(action.color)
                )}
                onClick={() => {
                  action.onAction()
                  setSwipeOffset(0)
                }}
              >
                {action.icon}
                <span className="text-xs">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div
          className="relative bg-background transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </div>
      </div>
    )
  }
)
SwipeActions.displayName = "SwipeActions"

// Touch-optimized hooks
const useTouchGestures = () => {
  const [gesture, setGesture] = React.useState<{
    type: 'tap' | 'swipe' | 'pinch' | null
    direction?: 'left' | 'right' | 'up' | 'down'
    distance?: number
  }>({ type: null })

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    // Touch gesture detection logic
  }, [])

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    // Touch gesture tracking logic
  }, [])

  const handleTouchEnd = React.useCallback((e: TouchEvent) => {
    // Touch gesture completion logic
  }, [])

  return {
    gesture,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

export {
  TouchButton,
  TouchInput,
  TouchCard,
  MobileNav,
  TouchListItem,
  SwipeActions,
  useTouchGestures,
  touchButtonVariants,
  touchInputVariants,
  touchCardVariants,
  touchListItemVariants,
  type TouchButtonProps,
  type TouchInputProps,
  type TouchCardProps,
  type MobileNavProps,
  type TouchListItemProps,
  type SwipeActionsProps,
}