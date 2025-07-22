import * as React from "react"
import { cn } from "@/lib/utils"
import { WidgetConfig } from "./widget-system"

// Grid Position Types
export interface GridPosition {
  x: number
  y: number
  width?: number
  height?: number
}

export interface GridItem extends WidgetConfig {
  gridPosition?: GridPosition
}

// Draggable Dashboard Grid Component
interface DraggableDashboardGridProps {
  widgets: WidgetConfig[]
  onWidgetsReorder: (widgets: WidgetConfig[]) => void
  disabled?: boolean
  className?: string
  children: (widget: WidgetConfig, index: number) => React.ReactNode
}

export const DraggableDashboardGrid: React.FC<DraggableDashboardGridProps> = ({
  widgets,
  onWidgetsReorder,
  disabled = false,
  className,
  children,
}) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (disabled || draggedIndex === null) return
    e.preventDefault()
    
    const newWidgets = [...widgets]
    const draggedWidget = newWidgets[draggedIndex]
    
    // Remove dragged widget from its original position
    newWidgets.splice(draggedIndex, 1)
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    newWidgets.splice(insertIndex, 0, draggedWidget)
    
    onWidgetsReorder(newWidgets)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min",
      className
    )}>
      {widgets.map((widget, index) => (
        <div
          key={widget.id}
          draggable={!disabled}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            "transition-all duration-200",
            !disabled && "cursor-move hover:scale-[1.02]",
            draggedIndex === index && "opacity-50 scale-95",
            dragOverIndex === index && "ring-2 ring-primary ring-offset-2",
            getSizeClasses(widget.size)
          )}
        >
          {children(widget, index)}
        </div>
      ))}
    </div>
  )
}

// Grid Layout Component (for freeform positioning)
interface GridLayoutProps {
  widgets: GridItem[]
  onWidgetMove: (widgetId: string, position: GridPosition) => void
  disabled?: boolean
  className?: string
  children: (widget: GridItem) => React.ReactNode
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  widgets,
  onWidgetMove,
  disabled = false,
  className,
  children,
}) => {
  const gridRef = React.useRef<HTMLDivElement>(null)
  const [draggedWidget, setDraggedWidget] = React.useState<string | null>(null)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent, widgetId: string) => {
    if (disabled) return
    
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget?.gridPosition) return

    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setDraggedWidget(widgetId)
  }

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!draggedWidget || !gridRef.current) return

    const gridRect = gridRef.current.getBoundingClientRect()
    const gridSize = 50 // Grid cell size in pixels
    
    const x = Math.max(0, Math.floor((e.clientX - gridRect.left - dragOffset.x) / gridSize))
    const y = Math.max(0, Math.floor((e.clientY - gridRect.top - dragOffset.y) / gridSize))

    onWidgetMove(draggedWidget, { x, y })
  }, [draggedWidget, dragOffset, onWidgetMove])

  const handleMouseUp = React.useCallback(() => {
    setDraggedWidget(null)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  React.useEffect(() => {
    if (draggedWidget) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggedWidget, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={gridRef}
      className={cn(
        "relative bg-grid-pattern bg-grid-size",
        "min-h-[600px] border-2 border-dashed border-muted-foreground/20 rounded-lg",
        className
      )}
      style={{
        backgroundImage: disabled ? 'none' : 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {widgets.map((widget) => {
        const position = widget.gridPosition || { x: 0, y: 0 }
        const width = position.width || getSizeWidth(widget.size)
        const height = position.height || getSizeHeight(widget.size)
        
        return (
          <div
            key={widget.id}
            className={cn(
              "absolute transition-all duration-200",
              !disabled && "cursor-move hover:z-10 hover:shadow-lg",
              draggedWidget === widget.id && "z-20 shadow-2xl scale-105"
            )}
            style={{
              left: position.x * 50,
              top: position.y * 50,
              width: width * 50,
              height: height * 50,
            }}
            onMouseDown={(e) => handleMouseDown(e, widget.id)}
          >
            {children(widget)}
          </div>
        )
      })}
    </div>
  )
}

// Utility Functions
const getSizeClasses = (size: WidgetConfig['size']) => {
  const sizeMap = {
    sm: "col-span-1",
    md: "col-span-1 md:col-span-2", 
    lg: "col-span-1 md:col-span-2 lg:col-span-3",
    xl: "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4"
  }
  return sizeMap[size] || sizeMap.md
}

const getSizeWidth = (size: WidgetConfig['size']) => {
  const sizeMap = {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12
  }
  return sizeMap[size] || sizeMap.md
}

const getSizeHeight = (size: WidgetConfig['size']) => {
  const sizeMap = {
    sm: 3,
    md: 4,
    lg: 6,
    xl: 8
  }
  return sizeMap[size] || sizeMap.md
}

// Drag and Drop Utilities
export const reorderArray = <T,>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const result = [...array]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export const snapToGrid = (position: { x: number; y: number }, gridSize: number = 50) => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  }
}