import * as React from "react"
import {
  Settings,
  Plus,
  Palette,
  Layout,
  Clock,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { type WidgetConfig } from "./widget-system"

// Widget Configuration Types
interface WidgetTheme {
  primaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  borderRadius: number
  shadow: 'none' | 'sm' | 'md' | 'lg'
}

interface WidgetSettings {
  refreshInterval: number
  showHeader: boolean
  showFooter: boolean
  showBorder: boolean
  showShadow: boolean
  animationEnabled: boolean
  compactMode: boolean
  theme: WidgetTheme
}

// Extended WidgetConfig with optional description
interface ExtendedWidgetConfig extends WidgetConfig {
  description?: string
}

interface WidgetConfigurationProps {
  widget: ExtendedWidgetConfig
  onUpdate: (updates: Partial<ExtendedWidgetConfig>) => void
  onSave: () => void
  onCancel: () => void
  children?: React.ReactNode
}

// Widget Configuration Dialog
export const WidgetConfigurationDialog: React.FC<WidgetConfigurationProps> = ({
  widget,
  onUpdate,
  onSave,
  onCancel,
  children,
}) => {
  const [localConfig, setLocalConfig] = React.useState<ExtendedWidgetConfig>(widget)
  const [activeTab, setActiveTab] = React.useState<'general' | 'appearance' | 'behavior'>('general')

  const handleLocalUpdate = (updates: Partial<ExtendedWidgetConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }))
  }

  const handleSave = () => {
    onUpdate(localConfig)
    onSave()
  }

  const handleReset = () => {
    setLocalConfig(widget)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Widget</DialogTitle>
          <DialogDescription>
            Customize the appearance and behavior of &quot;{widget.title}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Configuration Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'general', label: 'General', icon: Layout },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'behavior', label: 'Behavior', icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(id as 'general' | 'appearance' | 'behavior')}
              className="flex-1"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <GeneralSettings
              config={localConfig}
              onUpdate={handleLocalUpdate}
            />
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <AppearanceSettings
              config={localConfig}
              onUpdate={handleLocalUpdate}
            />
          )}

          {/* Behavior Settings */}
          {activeTab === 'behavior' && (
            <BehaviorSettings
              config={localConfig}
              onUpdate={handleLocalUpdate}
            />
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// General Settings Component
interface GeneralSettingsProps {
  config: ExtendedWidgetConfig
  onUpdate: (updates: Partial<ExtendedWidgetConfig>) => void
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="widget-title">Widget Title</Label>
          <Input
            id="widget-title"
            value={config.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter widget title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="widget-size">Widget Size</Label>
          <Select
            value={config.size}
            onValueChange={(value: 'sm' | 'md' | 'lg' | 'xl') => onUpdate({ size: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small (1x1)</SelectItem>
              <SelectItem value="md">Medium (2x1)</SelectItem>
              <SelectItem value="lg">Large (2x2)</SelectItem>
              <SelectItem value="xl">Extra Large (3x2)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="widget-description">Description</Label>
        <Input
          id="widget-description"
          value={config.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Optional widget description"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Widget Visibility</Label>
          <p className="text-sm text-muted-foreground">
            Show or hide this widget on the dashboard
          </p>
        </div>
        <Switch
          checked={config.visible}
          onCheckedChange={(checked) => onUpdate({ visible: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Allow Customization</Label>
          <p className="text-sm text-muted-foreground">
            Allow users to customize this widget
          </p>
        </div>
        <Switch
          checked={config.customizable}
          onCheckedChange={(checked) => onUpdate({ customizable: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Enable Data Export</Label>
          <p className="text-sm text-muted-foreground">
            Allow users to export widget data
          </p>
        </div>
        <Switch
          checked={config.exportable}
          onCheckedChange={(checked) => onUpdate({ exportable: checked })}
        />
      </div>
    </div>
  )
}

// Appearance Settings Component
const AppearanceSettings: React.FC<GeneralSettingsProps> = ({ config, onUpdate }) => {
  const [isThemeOpen, setIsThemeOpen] = React.useState(false)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Widget Type</Label>
        <Select
          value={config.type}
          onValueChange={(value: 'metric' | 'chart' | 'list' | 'map' | 'action' | 'custom') => onUpdate({ type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="metric">Metric Display</SelectItem>
            <SelectItem value="chart">Chart/Graph</SelectItem>
            <SelectItem value="list">List View</SelectItem>
            <SelectItem value="map">Map View</SelectItem>
            <SelectItem value="action">Action Button</SelectItem>
            <SelectItem value="custom">Custom Widget</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Collapsible open={isThemeOpen} onOpenChange={setIsThemeOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>Theme Customization</span>
            </div>
            {isThemeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  className="w-12 h-8 p-1 border rounded"
                  defaultValue="#3b82f6"
                />
                <Input
                  value="#3b82f6"
                  className="flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  className="w-12 h-8 p-1 border rounded"
                  defaultValue="#ffffff"
                />
                <Input
                  value="#ffffff"
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Border Radius</Label>
            <Slider
              defaultValue={[8]}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0px</span>
              <span>20px</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Shadow</Label>
            <Select defaultValue="md">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Behavior Settings Component
const BehaviorSettings: React.FC<GeneralSettingsProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Auto Refresh Interval</Label>
        <Select
          value={config.refreshInterval?.toString() || '0'}
          onValueChange={(value: string) => onUpdate({ refreshInterval: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Manual Only</SelectItem>
            <SelectItem value="5000">5 seconds</SelectItem>
            <SelectItem value="10000">10 seconds</SelectItem>
            <SelectItem value="30000">30 seconds</SelectItem>
            <SelectItem value="60000">1 minute</SelectItem>
            <SelectItem value="300000">5 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium">Widget Permissions</h4>
        <div className="space-y-2">
          {['passenger', 'driver', 'operator', 'admin'].map((role) => (
            <div key={role} className="flex items-center justify-between">
              <Label className="capitalize">{role}</Label>
              <Switch
                checked={config.permissions.includes(role)}
                onCheckedChange={(checked) => {
                  const newPermissions = checked
                    ? [...config.permissions, role]
                    : config.permissions.filter(p => p !== role)
                  onUpdate({ permissions: newPermissions })
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium">Advanced Options</h4>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Animations</Label>
            <p className="text-sm text-muted-foreground">
              Show loading and transition animations
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Compact Mode</Label>
            <p className="text-sm text-muted-foreground">
              Reduce padding and spacing for smaller displays
            </p>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Timestamps</Label>
            <p className="text-sm text-muted-foreground">
              Display last updated time
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
    </div>
  )
}

// Widget Template Selector
interface WidgetTemplateSelectorProps {
  onSelect: (template: Partial<WidgetConfig>) => void
  userRole: string
}

export const WidgetTemplateSelector: React.FC<WidgetTemplateSelectorProps> = ({
  onSelect,
  userRole,
}) => {
  const templates = [
    {
      id: 'metric',
      name: 'Metric Widget',
      description: 'Display key performance indicators',
      icon: '📊',
      config: {
        type: 'metric' as const,
        size: 'sm' as const,
        title: 'New Metric',
        permissions: [userRole],
      }
    },
    {
      id: 'chart',
      name: 'Chart Widget',
      description: 'Visualize data with charts and graphs',
      icon: '📈',
      config: {
        type: 'chart' as const,
        size: 'lg' as const,
        title: 'New Chart',
        permissions: [userRole],
      }
    },
    {
      id: 'list',
      name: 'List Widget',
      description: 'Show data in a structured list format',
      icon: '📋',
      config: {
        type: 'list' as const,
        size: 'md' as const,
        title: 'New List',
        permissions: [userRole],
      }
    },
    {
      id: 'action',
      name: 'Action Widget',
      description: 'Quick action buttons and controls',
      icon: '🎯',
      config: {
        type: 'action' as const,
        size: 'sm' as const,
        title: 'New Action',
        permissions: [userRole],
      }
    },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Widget Template</DialogTitle>
          <DialogDescription>
            Select a template to create a new widget
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onSelect(template.config)}
            >
              <div className="text-2xl">{template.icon}</div>
              <div className="text-left">
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted-foreground">
                  {template.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Widget Cache Management
interface WidgetCacheManagerProps {
  widgets: WidgetConfig[]
  onClearCache: (widgetId?: string) => void
  onRefreshAll: () => void
}

export const WidgetCacheManager: React.FC<WidgetCacheManagerProps> = ({
  widgets,
  onClearCache,
  onRefreshAll,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Cache Management</h4>
        <Button variant="outline" size="sm" onClick={onRefreshAll}>
          Refresh All
        </Button>
      </div>

      <div className="space-y-2">
        {widgets.map((widget) => (
          <div key={widget.id} className="flex items-center justify-between p-2 border rounded">
            <div>
              <div className="font-medium text-sm">{widget.title}</div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClearCache(widget.id)}
            >
              Clear Cache
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { WidgetTheme, WidgetSettings }