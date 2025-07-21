import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ResponsiveContainer, ResponsiveGrid, ResponsiveFlex, ResponsiveStack } from "./responsive-grid"
import { TouchButton } from "./touch-optimized"
import { ResponsiveHeading, Typography } from "./responsive-typography"

// Main Layout Component
const layoutVariants = cva(
  "min-h-screen bg-background",
  {
    variants: {
      variant: {
        default: "flex flex-col",
        sidebar: "flex flex-col lg:flex-row",
        dashboard: "flex flex-col",
        centered: "flex flex-col items-center justify-center",
      },
      spacing: {
        none: "",
        sm: "gap-2 sm:gap-4",
        default: "gap-4 sm:gap-6 lg:gap-8",
        lg: "gap-6 sm:gap-8 lg:gap-12",
      },
    },
    defaultVariants: {
      variant: "default",
      spacing: "default",
    },
  }
)

interface ResponsiveLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof layoutVariants> {
  children: React.ReactNode
  header?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
}

const ResponsiveLayout = React.forwardRef<HTMLDivElement, ResponsiveLayoutProps>(
  ({ className, variant, spacing, children, header, sidebar, footer, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(layoutVariants({ variant, spacing }), className)}
        {...props}
      >
        {header && (
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b safe-top">
            <ResponsiveContainer>
              {header}
            </ResponsiveContainer>
          </header>
        )}
        
        <main className="flex-1 flex flex-col lg:flex-row">
          {sidebar && variant === "sidebar" && (
            <aside className="w-full lg:w-64 xl:w-80 border-b lg:border-b-0 lg:border-r bg-card/50">
              <div className="sticky top-16 p-4 lg:p-6">
                {sidebar}
              </div>
            </aside>
          )}
          
          <div className="flex-1 min-w-0">
            <ResponsiveContainer className="py-4 sm:py-6 lg:py-8">
              {children}
            </ResponsiveContainer>
          </div>
        </main>
        
        {footer && (
          <footer className="border-t bg-card/50 safe-bottom">
            <ResponsiveContainer className="py-4 sm:py-6">
              {footer}
            </ResponsiveContainer>
          </footer>
        )}
      </div>
    )
  }
)
ResponsiveLayout.displayName = "ResponsiveLayout"

// Mobile-First Section Component
interface ResponsiveSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  fullWidth?: boolean
  noPadding?: boolean
}

const ResponsiveSection = React.forwardRef<HTMLElement, ResponsiveSectionProps>(
  ({ className, children, title, subtitle, actions, fullWidth = false, noPadding = false, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          "space-y-4 sm:space-y-6",
          !noPadding && "py-4 sm:py-6 lg:py-8",
          className
        )}
        {...props}
      >
        {(title || subtitle || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              {title && (
                <ResponsiveHeading level={2} className="text-2xl sm:text-3xl">
                  {title}
                </ResponsiveHeading>
              )}
              {subtitle && (
                <Typography variant="muted" className="text-base sm:text-lg">
                  {subtitle}
                </Typography>
              )}
            </div>
            {actions && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {actions}
              </div>
            )}
          </div>
        )}
        
        <div className={cn(!fullWidth && "max-w-none")}>
          {children}
        </div>
      </section>
    )
  }
)
ResponsiveSection.displayName = "ResponsiveSection"

// Card Grid Layout
interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | "auto"
  gap?: "sm" | "default" | "lg"
  minItemWidth?: string
}

const CardGrid = React.forwardRef<HTMLDivElement, CardGridProps>(
  ({ className, children, cols = 3, gap = "default", minItemWidth, ...props }, ref) => {
    return (
      <ResponsiveGrid
        ref={ref}
        cols={cols}
        gap={gap}
        minItemWidth={minItemWidth}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </ResponsiveGrid>
    )
  }
)
CardGrid.displayName = "CardGrid"

// Mobile Navigation Bar
interface MobileNavBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title?: string
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
}

const MobileNavBar = React.forwardRef<HTMLDivElement, MobileNavBarProps>(
  ({ className, children, title, leftAction, rightAction, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between h-14 px-4 bg-background/95 backdrop-blur-sm border-b safe-top",
          "sm:h-16 sm:px-6",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 min-w-0">
          {leftAction}
          {title && (
            <h1 className="font-semibold text-lg sm:text-xl truncate">
              {title}
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
        
        {children}
      </div>
    )
  }
)
MobileNavBar.displayName = "MobileNavBar"

// Bottom Navigation for Mobile
interface BottomNavItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  badge?: string | number
  active?: boolean
}

interface BottomNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  items: BottomNavItem[]
  onItemClick?: (item: BottomNavItem) => void
}

const BottomNavigation = React.forwardRef<HTMLDivElement, BottomNavigationProps>(
  ({ className, items, onItemClick, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t safe-bottom",
          "sm:hidden", // Hide on larger screens
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {items.map((item) => (
            <TouchButton
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 px-1 min-h-[60px] relative",
                item.active && "text-primary bg-primary/10"
              )}
              onClick={() => {
                item.onClick?.()
                onItemClick?.(item)
              }}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium truncate max-w-full">
                {item.label}
              </span>
            </TouchButton>
          ))}
        </div>
      </nav>
    )
  }
)
BottomNavigation.displayName = "BottomNavigation"

// Responsive Content Area
interface ContentAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  centered?: boolean
  withBottomNav?: boolean
}

const ContentArea = React.forwardRef<HTMLDivElement, ContentAreaProps>(
  ({ className, children, maxWidth = "full", centered = false, withBottomNav = false, ...props }, ref) => {
    const maxWidthClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      full: "max-w-full",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          maxWidthClasses[maxWidth],
          centered && "mx-auto",
          withBottomNav && "pb-20 sm:pb-0", // Add bottom padding for mobile nav
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ContentArea.displayName = "ContentArea"

export {
  ResponsiveLayout,
  ResponsiveSection,
  CardGrid,
  MobileNavBar,
  BottomNavigation,
  ContentArea,
  layoutVariants,
  type ResponsiveLayoutProps,
  type ResponsiveSectionProps,
  type CardGridProps,
  type MobileNavBarProps,
  type BottomNavigationProps,
  type ContentAreaProps,
  type BottomNavItem,
}