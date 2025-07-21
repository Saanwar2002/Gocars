import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight, Home, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./dropdown-menu"

// Breadcrumb Components
const breadcrumbVariants = cva(
  "flex items-center space-x-1 text-sm text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        modern: "bg-muted/30 rounded-lg px-3 py-2",
        minimal: "border-b pb-2",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
}

interface BreadcrumbProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbVariants> {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  maxItems?: number
  showHome?: boolean
  homeHref?: string
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ 
    className, 
    variant, 
    size, 
    items, 
    separator = <ChevronRight className="h-4 w-4" />,
    maxItems = 5,
    showHome = true,
    homeHref = "/",
    ...props 
  }, ref) => {
    const displayItems = React.useMemo(() => {
      let processedItems = [...items]
      
      // Add home item if requested
      if (showHome && (!items.length || items[0].href !== homeHref)) {
        processedItems.unshift({
          label: "Home",
          href: homeHref,
          icon: <Home className="h-4 w-4" />,
        })
      }

      // Handle overflow with ellipsis
      if (processedItems.length > maxItems) {
        const start = processedItems.slice(0, 1)
        const end = processedItems.slice(-(maxItems - 2))
        return [...start, { label: "...", ellipsis: true }, ...end]
      }

      return processedItems
    }, [items, showHome, homeHref, maxItems])

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn(breadcrumbVariants({ variant, size }), className)}
        {...props}
      >
        <ol className="flex items-center space-x-1">
          {displayItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted-foreground/50">
                  {separator}
                </span>
              )}
              
              {(item as any).ellipsis ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {items.slice(1, -(maxItems - 2)).map((hiddenItem, hiddenIndex) => (
                      <DropdownMenuItem key={hiddenIndex} asChild>
                        {hiddenItem.href ? (
                          <Link href={hiddenItem.href}>
                            {hiddenItem.icon && (
                              <span className="mr-2">{hiddenItem.icon}</span>
                            )}
                            {hiddenItem.label}
                          </Link>
                        ) : (
                          <span>
                            {hiddenItem.icon && (
                              <span className="mr-2">{hiddenItem.icon}</span>
                            )}
                            {hiddenItem.label}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : item.current || !item.href ? (
                <span className={cn(
                  "flex items-center font-medium",
                  item.current ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )
  }
)
Breadcrumb.displayName = "Breadcrumb"

// Auto Breadcrumb - generates breadcrumbs from current path
interface AutoBreadcrumbProps extends Omit<BreadcrumbProps, 'items'> {
  pathMapping?: Record<string, { label: string; icon?: React.ReactNode }>
  excludePaths?: string[]
}

const AutoBreadcrumb = React.forwardRef<HTMLElement, AutoBreadcrumbProps>(
  ({ pathMapping = {}, excludePaths = [], ...props }, ref) => {
    const pathname = usePathname()
    
    const items = React.useMemo(() => {
      const segments = pathname.split('/').filter(Boolean)
      const breadcrumbItems: BreadcrumbItem[] = []
      
      segments.forEach((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/')
        
        if (excludePaths.includes(path)) return
        
        const mapping = pathMapping[path] || pathMapping[segment]
        const isLast = index === segments.length - 1
        
        breadcrumbItems.push({
          label: mapping?.label || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: isLast ? undefined : path,
          icon: mapping?.icon,
          current: isLast,
        })
      })
      
      return breadcrumbItems
    }, [pathname, pathMapping, excludePaths])

    return <Breadcrumb ref={ref} items={items} {...props} />
  }
)
AutoBreadcrumb.displayName = "AutoBreadcrumb"

// Step Navigation Component
interface StepItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  status: "pending" | "current" | "completed" | "error"
}

interface StepNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: StepItem[]
  orientation?: "horizontal" | "vertical"
  showConnector?: boolean
  onStepClick?: (stepId: string) => void
}

const StepNavigation = React.forwardRef<HTMLDivElement, StepNavigationProps>(
  ({ 
    className, 
    steps, 
    orientation = "horizontal",
    showConnector = true,
    onStepClick,
    ...props 
  }, ref) => {
    const getStepColor = (status: StepItem['status']) => {
      switch (status) {
        case "completed":
          return "bg-gocars-green-600 text-white border-gocars-green-600"
        case "current":
          return "bg-primary text-primary-foreground border-primary"
        case "error":
          return "bg-destructive text-destructive-foreground border-destructive"
        default:
          return "bg-muted text-muted-foreground border-muted"
      }
    }

    const getConnectorColor = (currentStatus: StepItem['status'], nextStatus: StepItem['status']) => {
      if (currentStatus === "completed") return "bg-gocars-green-600"
      if (currentStatus === "current" && nextStatus === "pending") return "bg-gradient-to-r from-primary to-muted"
      return "bg-muted"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-col space-y-4" : "items-center space-x-4",
          className
        )}
        {...props}
      >
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex items-center",
                orientation === "vertical" ? "space-x-3" : "flex-col space-y-2"
              )}
            >
              <button
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-105",
                  getStepColor(step.status),
                  onStepClick && "cursor-pointer",
                  !onStepClick && "cursor-default"
                )}
                onClick={() => onStepClick?.(step.id)}
                disabled={!onStepClick}
              >
                {step.icon || (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>
              
              <div className={cn(
                "text-center",
                orientation === "vertical" ? "text-left flex-1" : ""
              )}>
                <div className={cn(
                  "text-sm font-medium",
                  step.status === "current" ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
            
            {/* Connector */}
            {showConnector && index < steps.length - 1 && (
              <div
                className={cn(
                  "transition-all duration-300",
                  orientation === "vertical" 
                    ? "w-0.5 h-8 ml-5" 
                    : "h-0.5 flex-1 min-w-8",
                  getConnectorColor(step.status, steps[index + 1]?.status)
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }
)
StepNavigation.displayName = "StepNavigation"

// Page Header with Breadcrumbs
interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  showBreadcrumbs?: boolean
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ 
    className, 
    title, 
    description, 
    breadcrumbs = [],
    actions,
    showBreadcrumbs = true,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4 pb-4 border-b", className)}
        {...props}
      >
        {showBreadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} variant="minimal" />
        )}
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

export {
  Breadcrumb,
  AutoBreadcrumb,
  StepNavigation,
  PageHeader,
  breadcrumbVariants,
  type BreadcrumbProps,
  type AutoBreadcrumbProps,
  type StepNavigationProps,
  type PageHeaderProps,
  type BreadcrumbItem,
  type StepItem,
}