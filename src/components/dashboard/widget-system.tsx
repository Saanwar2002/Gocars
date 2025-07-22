import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, X, Maximize2, Minimize2 } from "lucide-react"

// Widget Configuration Types
export interface WidgetConfig {
  id: string
  type: 'metric' | 'chart' | 'list' | 'map' | 'action' | 'custom'
  title: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  position?: { x: number; y: number }
  visible: boolean
  permissions: string[]
  customizable: boolean
  exportable: boolean
  refreshInterval?: number
  data?: Record<string, unknown>
  config?: Record<string, unknown>
}

export interface WidgetData {
  [key: string]: unknown
}

// Widget System Context
interface WidgetSystemContextType {
  widgets: WidgetConfig[]
  isEditMode: boolean
  setEditMode: (editMode: boolean) => void
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void
  removeWidget: (id: string) => void
  addWidget: (widget: WidgetConfig) => void
  reorderWidgets: (widgets: WidgetConfig[]) => void
}

const WidgetSystemContext = React.createContext<WidgetSystemContextType | null>(null)

// Widget System Provider
interface WidgetSystemProviderProps {
  children: React.ReactNode
  initialWidgets: WidgetConfig[]
  onWidgetUpdate?: (widgets: WidgetConfig[]) => void
}

export const WidgetSystemProvider: React.FC<WidgetSystemProviderProps> = ({
  children,
  initialWidgets,
  onWidgetUpdate,
}) => {
  const [widgets, setWidgets] = React.useState<WidgetConfig[]>(initialWidgets)
  const [isEditMode, setIsEditMode] = React.useState(false)

  // Update parent when widgets change
  React.useEffect(() => {
    onWidgetUpdate?.(widgets)
  }, [widgets, onWidgetUpdate])

  const setEditMode = (editMode: boolean) => {
    setIsEditMode(editMode)
  }

  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, ...updates } : widget
    ))
  }

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id))
  }

  const addWidget = (widget: WidgetConfig) => {
    setWidgets(prev => [...prev, widget])
  }

  const reorderWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets)
  }

  const value: WidgetSystemContextType = {
    widgets,
    isEditMode,
    setEditMode,
    updateWidget,
    removeWidget,
    addWidget,
    reorderWidgets,
  }

  return (
    <WidgetSystemContext.Provider value={value}>
      {children}
    </WidgetSystemContext.Provider>
  )
}

// Hook to use widget system
export const useWidgetSystem = () => {
  const context = React.useContext(WidgetSystemContext)
  if (!context) {
    throw new Error('useWidgetSystem must be used within a WidgetSystemProvider')
  }
  return context
}

// Configurable Widget Component
interface ConfigurableWidgetProps {
  config: WidgetConfig
  children: React.ReactNode
  className?: string
  onConfigure?: () => void
  onRemove?: () => void
  onMaximize?: () => void
}

export const ConfigurableWidget: React.FC<ConfigurableWidgetProps> = ({
  config,
  children,
  className,
  onConfigure,
  onRemove,
  onMaximize,
}) => {
  const { isEditMode, updateWidget, removeWidget } = useWidgetSystem()
  const [isMaximized, setIsMaximized] = React.useState(false)

  const handleToggleVisibility = () => {
    updateWidget(config.id, { visible: !config.visible })
  }

  const handleRemove = () => {
    removeWidget(config.id)
    onRemove?.()
  }

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
    onMaximize?.()
  }

  const sizeClasses = {
    sm: "col-span-1 row-span-1",
    md: "col-span-2 row-span-1", 
    lg: "col-span-2 row-span-2",
    xl: "col-span-3 row-span-2"
  }

  return (
    <Card 
      className={cn(
        "relative transition-all duration-200",
        sizeClasses[config.size],
        !config.visible && "opacity-50",
        isMaximized && "fixed inset-4 z-50 col-span-full row-span-full",
        isEditMode && "ring-2 ring-primary/20 hover:ring-primary/40",
        className
      )}
    >
      {/* Widget Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
        
        <div className="flex items-center gap-1">
          {/* Widget Status Badge */}
          {config.refreshInterval && (
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          )}
          
          {/* Edit Mode Controls */}
          {isEditMode && (
            <div className="flex items-center gap-1">
              {config.customizable && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onConfigure}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleMaximize}
              >
                {isMaximized ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Widget Content */}
      <CardContent className="pt-0">
        {config.visible ? children : (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            <div className="text-center">
              <div className="text-sm">Widget Hidden</div>
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleToggleVisibility}
                >
                  Show Widget
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Widget Size Utilities
export const getWidgetSizeClass = (size: WidgetConfig['size']) => {
  const sizeMap = {
    sm: "w-full h-32",
    md: "w-full h-48", 
    lg: "w-full h-64",
    xl: "w-full h-80"
  }
  return sizeMap[size] || sizeMap.md
}

// Widget Permission Check
export const hasWidgetPermission = (widget: WidgetConfig, userRole: string) => {
  return widget.permissions.includes(userRole) || widget.permissions.includes('all')
}

// Default Widget Configurations
export const createDefaultWidget = (
  id: string,
  title: string,
  type: WidgetConfig['type'] = 'metric',
  size: WidgetConfig['size'] = 'md'
): WidgetConfig => ({
  id,
  type,
  title,
  size,
  visible: true,
  permissions: ['all'],
  customizable: true,
  exportable: false,
})