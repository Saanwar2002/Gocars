import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { TrendingUp, TrendingDown, Minus, MoreHorizontal, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { Loading } from "./loading"

const widgetVariants = cva(
  "relative overflow-hidden transition-all duration-300 hover:shadow-gocars-lg group",
  {
    variants: {
      variant: {
        default: "bg-card",
        gradient: "bg-gradient-to-br from-primary/5 to-accent/5",
        glass: "bg-card/80 backdrop-blur-sm border-primary/20",
      },
      size: {
        sm: "min-h-[120px]",
        default: "min-h-[160px]",
        lg: "min-h-[200px]",
        xl: "min-h-[240px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface DashboardWidgetProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof widgetVariants> {
  title: string
  description?: string
  value?: string | number
  previousValue?: string | number
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  loading?: boolean
  refreshable?: boolean
  onRefresh?: () => void
  badge?: {
    text: string
    variant?: "default" | "success" | "warning" | "destructive" | "info"
  }
  actions?: React.ReactNode
}

const DashboardWidget = React.forwardRef<HTMLDivElement, DashboardWidgetProps>(
  ({
    className,
    variant,
    size,
    title,
    description,
    value,
    previousValue,
    trend,
    trendValue,
    loading,
    refreshable,
    onRefresh,
    badge,
    actions,
    children,
    ...props
  }, ref) => {
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    const handleRefresh = async () => {
      if (onRefresh && !isRefreshing) {
        setIsRefreshing(true)
        await onRefresh()
        setTimeout(() => setIsRefreshing(false), 500) // Minimum refresh animation time
      }
    }

    const getTrendIcon = () => {
      switch (trend) {
        case "up":
          return <TrendingUp className="h-4 w-4 text-gocars-green-600" />
        case "down":
          return <TrendingDown className="h-4 w-4 text-destructive" />
        default:
          return <Minus className="h-4 w-4 text-muted-foreground" />
      }
    }

    const getTrendColor = () => {
      switch (trend) {
        case "up":
          return "text-gocars-green-600"
        case "down":
          return "text-destructive"
        default:
          return "text-muted-foreground"
      }
    }

    return (
      <Card
        ref={ref}
        className={cn(widgetVariants({ variant, size }), className)}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {title}
              {badge && (
                <Badge variant={badge.variant} size="sm">
                  {badge.text}
                </Badge>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            {refreshable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            )}
            {actions && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {actions}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <>
              {value !== undefined && (
                <div className="text-2xl font-bold animate-fade-in">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              )}
              {(trend || trendValue) && (
                <div className={cn("flex items-center text-xs animate-slide-up", getTrendColor())}>
                  {trend && getTrendIcon()}
                  {trendValue && <span className="ml-1">{trendValue}</span>}
                  {previousValue && (
                    <span className="ml-1 text-muted-foreground">
                      from {typeof previousValue === 'number' ? previousValue.toLocaleString() : previousValue}
                    </span>
                  )}
                </div>
              )}
              {children && (
                <div className="mt-4 animate-fade-in">
                  {children}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }
)
DashboardWidget.displayName = "DashboardWidget"

// Specialized widget variants
interface MetricWidgetProps extends Omit<DashboardWidgetProps, 'children'> {
  metric: {
    value: string | number
    label: string
    change?: {
      value: string
      trend: "up" | "down" | "neutral"
    }
  }
}

const MetricWidget = React.forwardRef<HTMLDivElement, MetricWidgetProps>(
  ({ metric, ...props }, ref) => (
    <DashboardWidget
      ref={ref}
      value={metric.value}
      trend={metric.change?.trend}
      trendValue={metric.change?.value}
      {...props}
    />
  )
)
MetricWidget.displayName = "MetricWidget"

interface ChartWidgetProps extends Omit<DashboardWidgetProps, 'value' | 'trend' | 'trendValue'> {
  chart: React.ReactNode
  summary?: {
    value: string | number
    change?: string
    trend?: "up" | "down" | "neutral"
  }
}

const ChartWidget = React.forwardRef<HTMLDivElement, ChartWidgetProps>(
  ({ chart, summary, ...props }, ref) => (
    <DashboardWidget
      ref={ref}
      value={summary?.value}
      trend={summary?.trend}
      trendValue={summary?.change}
      {...props}
    >
      <div className="mt-4">
        {chart}
      </div>
    </DashboardWidget>
  )
)
ChartWidget.displayName = "ChartWidget"

export { 
  DashboardWidget, 
  MetricWidget, 
  ChartWidget, 
  widgetVariants,
  type DashboardWidgetProps,
  type MetricWidgetProps,
  type ChartWidgetProps
}