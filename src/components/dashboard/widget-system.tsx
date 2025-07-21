import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MoreHorizontal, 
  RefreshCw,
  Maximize2,
  Minimize2,
  Settings,
  Download,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { DashboardWidget } from "@/components/ui/dashboard-widget"

// Widget Configuration Types
interface WidgetConfig {
  id: string
  type: 'metric' | 'chart' | 'list' | 'map' | 'action' | 'custom'
  title: string
  description?: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  position: { x: number; y: number }
  visible: boolean
  refreshInterval?: number
  permissions: string[]
  customizable: boolean
  exportable: boolean
  data?: any
}

interface WidgetData {
  value?: string | number
  previousValue?: string | number
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  loading?: boolean
  error?: string
  lastUpdated?: Date
}

// Widget System Context
interface WidgetSystemContextType {
  widgets: WidgetConfig[]
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void
  removeWidget: (id: string) => void
  addWidget: (widget: WidgetConfig) => void
  refreshWidget: (id: string) => Promise<void>
  isEditMode: boolean
  setEditMode: (enabled: boolean) => void
}

const WidgetSystemContext = React.createContext<WidgetSystemContextType | undefined>(undefined)

export const useWidgetSystem = () => {
  const context = React.useContext(WidgetSystemContext)
  if (!context) {
    throw new Error('useWidgetSystem must be used within a WidgetSystemProvider')
  }
  return context
}

// Widget System Provider
interface WidgetSystemProviderProps {
  children: React.ReactNode
  initialWidgets?: WidgetConfig[]
  onWidgetUpdate?: (widgets: WidgetConfig[]) => void
}

export const WidgetSystemProvider: React.FC<WidgetSystemProviderProps> = ({
  children,
  initialWidgets = [],
  onWidgetUpdate,
}) => {
  const [widgets, setWidgets] = React.useState<WidgetConfig[]>(initialWidgets)
  const [isEditMode, setEditMode] = React.useState(false)

  const updateWidget = React.useCallback((id: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => {
      const updated = prev.map(widget => 
        widget.id === id ? { ...widget, ...updates } : widget
      )
      onWidgetUpdate?.(updated)
      return updated
    })
  }, [onWidgetUpdate])

  const removeWidget = React.useCallback((id: string) => {
    setWidgets(prev => {
      const updated = prev.filter(widget => widget.id !== id)
      onWidgetUpdate?.(updated)
      return updated
    })
  }, [onWidgetUpdate])

  const addWidget = React.useCallback((widget: WidgetConfig) => {
    setWidgets(prev => {
      const updated = [...prev, widget]
      onWidgetUpdate?.(updated)
      return updated
    })
  }, [onWidgetUpdate])

  const refreshWidget = React.useCallback(async (id: string) => {
    // Implement widget refresh logic
    console.log(`Refreshing widget: ${id}`)
  }, [])

  const value = React.useMemo(() => ({
    widgets,
    updateWidget,
    removeWidget,
    addWidget,
    refreshWidget,
    isEditMode,
    setEditMode,
  }), [widgets, updateWidget, removeWidget, addWidget, refreshWidget, isEditMode])

  return (
    <WidgetSystemContext.Provider value={value}>
      {children}
    </WidgetSystemContext.Provider>
  )
}

// Configurable Widget Component
interface ConfigurableWidgetProps {
  config: WidgetConfig
  data?: WidgetData
  children?: React.ReactNode
  onRefresh?: () => Promise<void>
}

export const ConfigurableWidget: React.FC<ConfigurableWidgetProps> = ({
  config,
  data,
  children,
  onRefresh,
}) => {
  const { updateWidget, removeWidget, isEditMode } = useWidgetSystem()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setTimeout(() => setIsRefreshing(false), 500)
      }
    }
  }

  const handleToggleVisibility = () => {
    updateWidget(config.id, { visible: !config.visible })
  }

  const handleRemove = () => {
    removeWidget(config.id)
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'col-span-1 row-span-1'
      case 'md': return 'col-span-2 row-span-1'
      case 'lg': return 'col-span-2 row-span-2'
      case 'xl': return 'col-span-3 row-span-2'
      default: return 'col-span-1 row-span-1'
    }
  }

  if (!config.visible && !isEditMode) {
    return null
  }

  return (
    <div 
      className={cn(
        "relative group transition-all duration-200",
        getSizeClasses(config.size),
        !config.visible && isEditMode && "opacity-50",
        isEditMode && "ring-2 ring-primary/20 hover:ring-primary/40"
      )}
    >
      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleToggleVisibility}
            >
              {config.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
            >
              Remove
            </Button>
          </div>
        </div>
      )}

      <DashboardWidget
        title={config.title}
        description={config.description}
        value={data?.value}
        previousValue={data?.previousValue}
        trend={data?.trend}
        trendValue={data?.trendValue}
        loading={data?.loading}
        refreshable={true}
        onRefresh={handleRefresh}
        badge={data?.error ? { text: "Error", variant: "destructive" } : undefined}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </DropdownMenuItem>
              {config.exportable && (
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
              )}
              {config.customizable && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleVisibility}>
                {config.visible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {config.visible ? 'Hide' : 'Show'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRemove} className="text-destructive">
                Remove Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {children}
      </DashboardWidget>
    </div>
  )
}

// Dashboard Grid Layout
interface DashboardGridProps {
  children: React.ReactNode
  className?: string
  editMode?: boolean
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  className,
  editMode = false,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-min",
        editMode && "min-h-[400px]",
        className
      )}
    >
      {children}
    </div>
  )
}

// Widget Toolbar
interface WidgetToolbarProps {
  className?: string
}

export const WidgetToolbar: React.FC<WidgetToolbarProps> = ({ className }) => {
  const { isEditMode, setEditMode, widgets } = useWidgetSystem()
  const visibleWidgets = widgets.filter(w => w.visible)

  return (
    <div className={cn("flex items-center justify-between gap-4 p-4 bg-card rounded-lg border", className)}>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {visibleWidgets.length} of {widgets.length} widgets visible
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          onClick={() => setEditMode(!isEditMode)}
        >
          {isEditMode ? "Done" : "Edit Layout"}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Add Widget
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <TrendingUp className="h-4 w-4 mr-2" />
              Metric Widget
            </DropdownMenuItem>
            <DropdownMenuItem>
              📊 Chart Widget
            </DropdownMenuItem>
            <DropdownMenuItem>
              📋 List Widget
            </DropdownMenuItem>
            <DropdownMenuItem>
              🗺️ Map Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Pre-built Widget Templates
export const WidgetTemplates = {
  metric: (id: string, title: string, permissions: string[] = []): WidgetConfig => ({
    id,
    type: 'metric',
    title,
    size: 'sm',
    position: { x: 0, y: 0 },
    visible: true,
    permissions,
    customizable: true,
    exportable: true,
  }),

  chart: (id: string, title: string, permissions: string[] = []): WidgetConfig => ({
    id,
    type: 'chart',
    title,
    size: 'lg',
    position: { x: 0, y: 0 },
    visible: true,
    permissions,
    customizable: true,
    exportable: true,
  }),

  list: (id: string, title: string, permissions: string[] = []): WidgetConfig => ({
    id,
    type: 'list',
    title,
    size: 'md',
    position: { x: 0, y: 0 },
    visible: true,
    permissions,
    customizable: true,
    exportable: false,
  }),
}

export type { WidgetConfig, WidgetData, ConfigurableWidgetProps }