import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ZoomIn, ZoomOut, Download, Maximize2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"

const chartVariants = cva(
  "relative w-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-background",
        card: "bg-card border rounded-lg shadow-gocars-sm",
        glass: "bg-card/80 backdrop-blur-sm border rounded-lg",
      },
      size: {
        sm: "h-48",
        default: "h-64",
        lg: "h-80",
        xl: "h-96",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface InteractiveChartProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chartVariants> {
  title?: string
  description?: string
  data?: any[]
  loading?: boolean
  error?: string
  zoomable?: boolean
  downloadable?: boolean
  fullscreenable?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onReset?: () => void
  onDownload?: () => void
  onFullscreen?: () => void
  toolbar?: React.ReactNode
  legend?: React.ReactNode
  chart: React.ReactNode
}

const InteractiveChart = React.forwardRef<HTMLDivElement, InteractiveChartProps>(
  ({
    className,
    variant,
    size,
    title,
    description,
    data,
    loading,
    error,
    zoomable = true,
    downloadable = true,
    fullscreenable = true,
    onZoomIn,
    onZoomOut,
    onReset,
    onDownload,
    onFullscreen,
    toolbar,
    legend,
    chart,
    ...props
  }, ref) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [zoomLevel, setZoomLevel] = React.useState(1)

    const handleZoomIn = () => {
      const newZoom = Math.min(zoomLevel * 1.2, 3)
      setZoomLevel(newZoom)
      onZoomIn?.()
    }

    const handleZoomOut = () => {
      const newZoom = Math.max(zoomLevel / 1.2, 0.5)
      setZoomLevel(newZoom)
      onZoomOut?.()
    }

    const handleReset = () => {
      setZoomLevel(1)
      onReset?.()
    }

    const handleFullscreen = () => {
      setIsFullscreen(!isFullscreen)
      onFullscreen?.()
    }

    const ChartContent = () => (
      <div className="relative w-full h-full">
        {/* Chart Toolbar */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {toolbar}
          {zoomable && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={handleReset}
                disabled={zoomLevel === 1}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
          {downloadable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={onDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {fullscreenable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={handleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Chart Area */}
        <div 
          className="w-full h-full overflow-hidden"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading chart...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="text-destructive">⚠️</div>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          ) : (
            chart
          )}
        </div>

        {/* Zoom Level Indicator */}
        {zoomable && zoomLevel !== 1 && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge variant="secondary" size="sm">
              {Math.round(zoomLevel * 100)}%
            </Badge>
          </div>
        )}

        {/* Legend */}
        {legend && (
          <div className="absolute bottom-2 right-2 z-10">
            {legend}
          </div>
        )}
      </div>
    )

    if (variant === "card") {
      return (
        <Card
          ref={ref}
          className={cn(chartVariants({ variant, size }), "group", className)}
          {...props}
        >
          {(title || description) && (
            <CardHeader className="pb-2">
              {title && <CardTitle className="text-lg">{title}</CardTitle>}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </CardHeader>
          )}
          <CardContent className="p-0">
            <div className={cn(chartVariants({ size: "default" }))}>
              <ChartContent />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(chartVariants({ variant, size }), "group", className)}
        {...props}
      >
        <ChartContent />
      </div>
    )
  }
)
InteractiveChart.displayName = "InteractiveChart"

// Tooltip component for charts
interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: any, name: string) => [string, string]
  labelFormatter?: (label: string) => string
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-gocars-lg p-3 animate-fade-in">
      {label && (
        <p className="font-medium text-sm mb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Chart Legend component
interface ChartLegendProps {
  payload?: any[]
  align?: "left" | "center" | "right"
  verticalAlign?: "top" | "middle" | "bottom"
}

const ChartLegend: React.FC<ChartLegendProps> = ({
  payload,
  align = "center",
  verticalAlign = "bottom",
}) => {
  if (!payload || !payload.length) {
    return null
  }

  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  return (
    <div className={cn("flex flex-wrap gap-4 text-sm", alignClasses[align])}>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export { 
  InteractiveChart, 
  ChartTooltip, 
  ChartLegend, 
  chartVariants,
  type InteractiveChartProps,
  type ChartTooltipProps,
  type ChartLegendProps
}