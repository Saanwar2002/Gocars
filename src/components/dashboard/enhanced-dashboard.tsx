import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Plus, 
  Edit3, 
  Save, 
  X, 
  RefreshCw,
  Download,
  Upload,
  Grid3X3,
  LayoutGrid
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  WidgetSystemProvider, 
  useWidgetSystem, 
  ConfigurableWidget,
  type WidgetConfig 
} from "./widget-system"
import { DraggableDashboardGrid } from "./drag-drop-system"
import { WidgetConfigurationDialog, WidgetTemplateSelector, WidgetCacheManager } from "./widget-configuration"
import { widgetDataService, useWidgetData } from "@/services/widgetDataService"
import { RoleBasedWidgets } from "./role-widgets"

// Enhanced Dashboard Props
interface EnhancedDashboardProps {
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  initialWidgets?: WidgetConfig[]
  onWidgetUpdate?: (widgets: WidgetConfig[]) => void
  className?: string
}

// Main Enhanced Dashboard Component
export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  userRole,
  initialWidgets = [],
  onWidgetUpdate,
  className,
}) => {
  // Get default widgets for user role if no initial widgets provided
  const defaultWidgets = React.useMemo(() => {
    if (initialWidgets.length > 0) return initialWidgets
    return getDefaultWidgetsForRole(userRole)
  }, [userRole, initialWidgets])

  return (
    <WidgetSystemProvider 
      initialWidgets={defaultWidgets}
      onWidgetUpdate={onWidgetUpdate}
    >
      <div className={cn("space-y-6", className)}>
        <DashboardHeader userRole={userRole} />
        <DashboardGrid />
        <DashboardFooter />
      </div>
    </WidgetSystemProvider>
  )
}

// Dashboard Header with Controls
const DashboardHeader: React.FC<{ userRole: string }> = ({ userRole }) => {
  const { isEditMode, setEditMode, widgets, addWidget, reorderWidgets } = useWidgetSystem()
  const [configWidget, setConfigWidget] = React.useState<WidgetConfig | null>(null)

  const handleSaveLayout = () => {
    // Save layout to localStorage or API
    localStorage.setItem(`dashboard-layout-${userRole}`, JSON.stringify(widgets))
    setEditMode(false)
  }

  const handleExportLayout = () => {
    const dataStr = JSON.stringify(widgets, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dashboard-layout-${userRole}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedWidgets = JSON.parse(e.target?.result as string)
        reorderWidgets(importedWidgets)
      } catch (error) {
        console.error('Failed to import layout:', error)
      }
    }
    reader.readAsText(file)
  }

  const handleRefreshAll = async () => {
    await widgetDataService.refreshMultipleWidgets(widgets)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
        </h1>
        <p className="text-muted-foreground">
          {isEditMode ? 'Customize your dashboard layout' : 'Welcome back! Here\'s your overview.'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh All Button */}
        <Button variant="outline" size="sm" onClick={handleRefreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>

        {/* Dashboard Controls Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportLayout}>
              <Download className="h-4 w-4 mr-2" />
              Export Layout
            </DropdownMenuItem>
            <DropdownMenuItem>
              <label className="flex items-center cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import Layout
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportLayout}
                />
              </label>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => widgetDataService.clearCache()}>
              Clear Cache
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Mode Toggle */}
        {isEditMode ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveLayout}>
              <Save className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Dashboard
          </Button>
        )}

        {/* Add Widget Button (only in edit mode) */}
        {isEditMode && (
          <WidgetTemplateSelector
            userRole={userRole}
            onSelect={(template) => {
              const newWidget: WidgetConfig = {
                id: `widget-${Date.now()}`,
                visible: true,
                customizable: true,
                exportable: false,
                permissions: [userRole],
                ...template,
              }
              addWidget(newWidget)
            }}
          />
        )}
      </div>

      {/* Widget Configuration Dialog */}
      {configWidget && (
        <WidgetConfigurationDialog
          widget={configWidget}
          onUpdate={(updates) => {
            // Handle widget updates
            console.log('Widget updated:', updates)
          }}
          onSave={() => setConfigWidget(null)}
          onCancel={() => setConfigWidget(null)}
        />
      )}
    </div>
  )
}

// Dashboard Grid with Drag & Drop
const DashboardGrid: React.FC = () => {
  const { widgets, reorderWidgets, isEditMode, updateWidget } = useWidgetSystem()
  const [layoutMode, setLayoutMode] = React.useState<'grid' | 'freeform'>('grid')

  const visibleWidgets = widgets.filter(widget => widget.visible)

  return (
    <div className="space-y-4">
      {/* Layout Mode Toggle (only in edit mode) */}
      {isEditMode && (
        <div className="flex items-center gap-2">
          <Button
            variant={layoutMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLayoutMode('grid')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Grid Layout
          </Button>
          <Button
            variant={layoutMode === 'freeform' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLayoutMode('freeform')}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Freeform Layout
          </Button>
        </div>
      )}

      {/* Dashboard Grid */}
      <DraggableDashboardGrid
        widgets={visibleWidgets}
        onWidgetsReorder={reorderWidgets}
        disabled={!isEditMode}
        className="min-h-[400px]"
      >
        {(widget, index) => (
          <ConfigurableWidget
            key={widget.id}
            config={widget}
            onConfigure={() => {
              // Open configuration dialog
              console.log('Configure widget:', widget.id)
            }}
            onRemove={() => {
              console.log('Remove widget:', widget.id)
            }}
            onMaximize={() => {
              console.log('Maximize widget:', widget.id)
            }}
          >
            <WidgetContent widget={widget} />
          </ConfigurableWidget>
        )}
      </DraggableDashboardGrid>
    </div>
  )
}

// Widget Content Renderer
const WidgetContent: React.FC<{ widget: WidgetConfig }> = ({ widget }) => {
  const { data, loading, error, refresh } = useWidgetData(widget)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <p className="text-sm text-destructive mb-2">Error loading data</p>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // Render different widget types
  switch (widget.type) {
    case 'metric':
      return <MetricWidget data={data} />
    case 'chart':
      return <ChartWidget data={data} />
    case 'list':
      return <ListWidget data={data} />
    case 'map':
      return <MapWidget data={data} />
    case 'action':
      return <ActionWidget data={data} />
    default:
      return <div className="p-4 text-center text-muted-foreground">Unknown widget type</div>
  }
}

// Widget Type Components
interface MetricWidgetData {
  value: number | string
  label?: string
  change?: number
}

const MetricWidget: React.FC<{ data: MetricWidgetData }> = ({ data }) => (
  <div className="text-center">
    <div className="text-2xl font-bold">{data?.value || 0}</div>
    <div className="text-sm text-muted-foreground">{data?.period}</div>
    {data?.change && (
      <Badge variant={data.trend === 'up' ? 'default' : 'secondary'} className="mt-2">
        {data.change > 0 ? '+' : ''}{data.change}%
      </Badge>
    )}
  </div>
)

interface ChartWidgetData {
  title: string
  data: Array<{ value: number; label?: string }>
}

const ChartWidget: React.FC<{ data: ChartWidgetData }> = ({ data }) => (
  <div className="space-y-2">
    <div className="text-sm font-medium">{data?.title}</div>
    <div className="h-32 bg-muted rounded flex items-end justify-center gap-1 p-2">
      {data?.data?.map((point, index: number) => (
        <div
          key={index}
          className="bg-primary rounded-t flex-1 min-w-[4px]"
          style={{ height: `${(point.value / 100) * 100}%` }}
          title={`${point.label}: ${point.value}`}
        />
      ))}
    </div>
  </div>
)

interface ListWidgetData {
  items: Array<{ id: string; title: string; value?: string | number }>
}

const ListWidget: React.FC<{ data: ListWidgetData }> = ({ data }) => (
  <div className="space-y-2">
    {data?.items?.map((item) => (
      <div key={item.id} className="flex items-center justify-between text-sm">
        <span className="truncate">{item.title}</span>
        <Badge variant="outline" className="text-xs">
          {item.status}
        </Badge>
      </div>
    ))}
    {data?.hasMore && (
      <div className="text-xs text-muted-foreground text-center pt-2">
        +{data.total - data.items.length} more items
      </div>
    )}
  </div>
)

interface MapWidgetData {
  center?: { lat: number; lng: number }
  markers?: Array<{ id: string; lat: number; lng: number; title: string }>
}

const MapWidget: React.FC<{ data: MapWidgetData }> = ({ data }) => (
  <div className="h-32 bg-muted rounded flex items-center justify-center">
    <div className="text-center">
      <div className="text-sm font-medium">Map View</div>
      <div className="text-xs text-muted-foreground">
        {data?.locations?.length || 0} locations
      </div>
    </div>
  </div>
)

interface ActionWidgetData {
  actions: Array<{ id: string; label: string; variant?: 'default' | 'outline' | 'ghost' }>
}

const ActionWidget: React.FC<{ data: ActionWidgetData }> = ({ data }) => (
  <div className="space-y-2">
    {data?.actions?.map((action) => (
      <Button
        key={action.id}
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!action.enabled}
      >
        {action.label}
      </Button>
    ))}
  </div>
)

// Dashboard Footer
const DashboardFooter: React.FC = () => {
  const { widgets } = useWidgetSystem()
  const cacheStats = widgetDataService.getCacheStats()

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
      <div>
        {widgets.length} widgets • {widgets.filter(w => w.visible).length} visible
      </div>
      <div>
        Cache: {cacheStats.size} entries • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}

// Utility Functions
const getDefaultWidgetsForRole = (role: string): WidgetConfig[] => {
  const baseWidgets: Record<string, WidgetConfig[]> = {
    passenger: [
      {
        id: 'quick-book',
        type: 'action',
        title: 'Quick Book',
        size: 'sm',
        visible: true,
        permissions: ['passenger'],
        customizable: true,
        exportable: false,
      },
      {
        id: 'recent-rides',
        type: 'list',
        title: 'Recent Rides',
        size: 'md',
        visible: true,
        permissions: ['passenger'],
        customizable: true,
        exportable: true,
      },
      {
        id: 'ride-stats',
        type: 'metric',
        title: 'Total Rides',
        size: 'sm',
        visible: true,
        permissions: ['passenger'],
        customizable: true,
        exportable: false,
        refreshInterval: 30000,
      },
    ],
    driver: [
      {
        id: 'earnings-today',
        type: 'metric',
        title: 'Today\'s Earnings',
        size: 'sm',
        visible: true,
        permissions: ['driver'],
        customizable: true,
        exportable: false,
        refreshInterval: 10000,
      },
      {
        id: 'active-requests',
        type: 'list',
        title: 'Active Requests',
        size: 'md',
        visible: true,
        permissions: ['driver'],
        customizable: true,
        exportable: false,
        refreshInterval: 5000,
      },
      {
        id: 'performance-chart',
        type: 'chart',
        title: 'Performance Trends',
        size: 'lg',
        visible: true,
        permissions: ['driver'],
        customizable: true,
        exportable: true,
      },
    ],
    operator: [
      {
        id: 'fleet-overview',
        type: 'metric',
        title: 'Active Drivers',
        size: 'sm',
        visible: true,
        permissions: ['operator'],
        customizable: true,
        exportable: false,
        refreshInterval: 15000,
      },
      {
        id: 'live-map',
        type: 'map',
        title: 'Live Fleet Map',
        size: 'lg',
        visible: true,
        permissions: ['operator'],
        customizable: true,
        exportable: false,
        refreshInterval: 10000,
      },
      {
        id: 'dispatch-queue',
        type: 'list',
        title: 'Dispatch Queue',
        size: 'md',
        visible: true,
        permissions: ['operator'],
        customizable: true,
        exportable: false,
        refreshInterval: 5000,
      },
    ],
    admin: [
      {
        id: 'system-health',
        type: 'metric',
        title: 'System Health',
        size: 'sm',
        visible: true,
        permissions: ['admin'],
        customizable: true,
        exportable: false,
        refreshInterval: 30000,
      },
      {
        id: 'revenue-chart',
        type: 'chart',
        title: 'Revenue Analytics',
        size: 'lg',
        visible: true,
        permissions: ['admin'],
        customizable: true,
        exportable: true,
        refreshInterval: 60000,
      },
      {
        id: 'user-activity',
        type: 'list',
        title: 'Recent Activity',
        size: 'md',
        visible: true,
        permissions: ['admin'],
        customizable: true,
        exportable: true,
        refreshInterval: 20000,
      },
    ],
  }

  return baseWidgets[role] || []
}

export default EnhancedDashboard