'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { cn } from '@/lib/utils';
import {
  Maximize2,
  Minimize2,
  Square,
  Minus,
  X,
  MoreHorizontal,
  Move,
  RotateCcw,
  Settings,
  Grid3X3,
  Columns,
  Rows,
  Layout,
  PanelLeftOpen,
  PanelRightOpen,
  PanelTopOpen,
  PanelBottomOpen,
  MousePointer2,
  Keyboard,
  Monitor
} from 'lucide-react';

// Desktop-optimized window manager
export interface DesktopWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  resizable?: boolean;
  draggable?: boolean;
  closable?: boolean;
  maximizable?: boolean;
  minimizable?: boolean;
  className?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onFocus?: () => void;
}

export function DesktopWindow({
  id,
  title,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  minSize = { width: 300, height: 200 },
  maxSize = { width: 1200, height: 800 },
  resizable = true,
  draggable = true,
  closable = true,
  maximizable = true,
  minimizable = true,
  className,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
}: DesktopWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [zIndex, setZIndex] = useState(1);

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle window focus
  const handleFocus = useCallback(() => {
    setZIndex(Date.now());
    onFocus?.();
  }, [onFocus]);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable || isMaximized) return;
    
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      handleFocus();
    }
  }, [draggable, isMaximized, handleFocus]);

  // Handle resizing
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    if (!resizable || isMaximized) return;
    
    e.stopPropagation();
    setResizeDirection(direction);
    setIsResizing(true);
    handleFocus();
  }, [resizable, isMaximized, handleFocus]);

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggable && !isMaximized) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }

      if (isResizing && resizable && !isMaximized) {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          let newSize = { ...size };
          let newPosition = { ...position };

          if (resizeDirection.includes('right')) {
            newSize.width = Math.max(minSize.width, Math.min(maxSize.width, e.clientX - rect.left));
          }
          if (resizeDirection.includes('left')) {
            const newWidth = Math.max(minSize.width, Math.min(maxSize.width, rect.right - e.clientX));
            newSize.width = newWidth;
            newPosition.x = e.clientX;
          }
          if (resizeDirection.includes('bottom')) {
            newSize.height = Math.max(minSize.height, Math.min(maxSize.height, e.clientY - rect.top));
          }
          if (resizeDirection.includes('top')) {
            const newHeight = Math.max(minSize.height, Math.min(maxSize.height, rect.bottom - e.clientY));
            newSize.height = newHeight;
            newPosition.y = e.clientY;
          }

          setSize(newSize);
          setPosition(newPosition);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeDirection, size, position, draggable, resizable, isMaximized, minSize, maxSize]);

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    onMaximize?.();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  if (isMinimized) {
    return null; // Handle minimized state in window manager
  }

  return (
    <div
      ref={windowRef}
      className={cn(
        'absolute bg-white border border-brand-secondary-300 rounded-lg shadow-brand-xl overflow-hidden select-none',
        isDragging && 'cursor-move',
        className
      )}
      style={{
        left: isMaximized ? 0 : position.x,
        top: isMaximized ? 0 : position.y,
        width: isMaximized ? '100vw' : size.width,
        height: isMaximized ? '100vh' : size.height,
        zIndex,
      }}
      onClick={handleFocus}
    >
      {/* Window Header */}
      <div
        ref={headerRef}
        className="flex items-center justify-between px-4 py-2 bg-brand-secondary-50 border-b border-brand-secondary-200 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-brand-secondary-900 truncate">
            {title}
          </h3>
        </div>

        <div className="flex items-center space-x-1">
          {minimizable && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleMinimize}
              className="h-6 w-6 hover:bg-brand-secondary-200"
            >
              <Minus className="h-3 w-3" />
            </Button>
          )}
          {maximizable && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleMaximize}
              className="h-6 w-6 hover:bg-brand-secondary-200"
            >
              {isMaximized ? (
                <Square className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          )}
          {closable && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="h-6 w-6 hover:bg-error-100 hover:text-error-600"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Window Content */}
      <div className="h-full overflow-auto">
        {children}
      </div>

      {/* Resize Handles */}
      {resizable && !isMaximized && (
        <>
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />
          <div
            className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          <div
            className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />

          {/* Edge handles */}
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}
    </div>
  );
}

// Desktop-optimized layout manager
export interface DesktopLayoutManagerProps {
  children: React.ReactNode;
  layout?: 'grid' | 'columns' | 'rows' | 'free';
  gridColumns?: number;
  gap?: number;
  className?: string;
}

export function DesktopLayoutManager({
  children,
  layout = 'free',
  gridColumns = 3,
  gap = 16,
  className,
}: DesktopLayoutManagerProps) {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return `grid grid-cols-${gridColumns} gap-${gap / 4}`;
      case 'columns':
        return `flex gap-${gap / 4}`;
      case 'rows':
        return `flex flex-col gap-${gap / 4}`;
      default: // free
        return 'relative';
    }
  };

  return (
    <div className={cn('h-full w-full', getLayoutClasses(), className)}>
      {children}
    </div>
  );
}

// Desktop-optimized multi-monitor support
export interface DesktopMultiMonitorProps {
  monitors: Array<{
    id: string;
    name: string;
    width: number;
    height: number;
    primary?: boolean;
  }>;
  currentMonitor?: string;
  onMonitorChange?: (monitorId: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function DesktopMultiMonitor({
  monitors,
  currentMonitor,
  onMonitorChange,
  children,
  className,
}: DesktopMultiMonitorProps) {
  const [activeMonitor, setActiveMonitor] = useState(
    currentMonitor || monitors.find(m => m.primary)?.id || monitors[0]?.id
  );

  const handleMonitorChange = (monitorId: string) => {
    setActiveMonitor(monitorId);
    onMonitorChange?.(monitorId);
  };

  const activeMonitorData = monitors.find(m => m.id === activeMonitor);

  return (
    <div className={cn('h-full w-full', className)}>
      {/* Monitor Selector */}
      <div className="flex items-center space-x-2 p-2 bg-brand-secondary-100 border-b border-brand-secondary-200">
        <Monitor className="h-4 w-4 text-brand-secondary-600" />
        <span className="text-sm font-medium text-brand-secondary-700">Monitor:</span>
        <div className="flex items-center space-x-1">
          {monitors.map((monitor) => (
            <Button
              key={monitor.id}
              variant={activeMonitor === monitor.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMonitorChange(monitor.id)}
              className="h-7 px-2 text-xs"
            >
              {monitor.name}
              {monitor.primary && (
                <span className="ml-1 text-xs opacity-60">(Primary)</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Monitor Content */}
      <div
        className="relative overflow-hidden"
        style={{
          width: activeMonitorData?.width || '100%',
          height: activeMonitorData ? activeMonitorData.height - 40 : 'calc(100% - 40px)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Desktop-optimized keyboard shortcuts
export interface DesktopKeyboardShortcutsProps {
  shortcuts: Array<{
    key: string;
    description: string;
    action: () => void;
  }>;
  enabled?: boolean;
}

export function DesktopKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: DesktopKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => {
        const keys = s.key.toLowerCase().split('+');
        const hasCtrl = keys.includes('ctrl') && (e.ctrlKey || e.metaKey);
        const hasShift = keys.includes('shift') && e.shiftKey;
        const hasAlt = keys.includes('alt') && e.altKey;
        const mainKey = keys[keys.length - 1];
        
        return (
          e.key.toLowerCase() === mainKey &&
          (!keys.includes('ctrl') || hasCtrl) &&
          (!keys.includes('shift') || hasShift) &&
          (!keys.includes('alt') || hasAlt)
        );
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);

  return null; // This component doesn't render anything
}

// Desktop-optimized context menu
export interface DesktopContextMenuProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    disabled?: boolean;
    separator?: boolean;
    onClick?: () => void;
  }>;
  position: { x: number; y: number };
  onClose: () => void;
  className?: string;
}

export function DesktopContextMenu({
  items,
  position,
  onClose,
  className,
}: DesktopContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed bg-white border border-brand-secondary-200 rounded-lg shadow-brand-xl py-2 min-w-[200px] z-50 animate-fade-in-down',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {items.map((item) => (
        <React.Fragment key={item.id}>
          {item.separator ? (
            <div className="my-1 border-t border-brand-secondary-200" />
          ) : (
            <button
              onClick={() => {
                if (!item.disabled) {
                  item.onClick?.();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors duration-200',
                item.disabled
                  ? 'text-brand-secondary-400 cursor-not-allowed'
                  : 'text-brand-secondary-900 hover:bg-brand-secondary-100'
              )}
            >
              <div className="flex items-center space-x-2">
                {item.icon && (
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-xs text-brand-secondary-500 ml-4">
                  {item.shortcut}
                </span>
              )}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Desktop-optimized taskbar
export interface DesktopTaskbarProps {
  windows: Array<{
    id: string;
    title: string;
    icon?: React.ReactNode;
    active?: boolean;
    minimized?: boolean;
  }>;
  onWindowClick?: (windowId: string) => void;
  onWindowClose?: (windowId: string) => void;
  className?: string;
}

export function DesktopTaskbar({
  windows,
  onWindowClick,
  onWindowClose,
  className,
}: DesktopTaskbarProps) {
  return (
    <div className={cn(
      'flex items-center space-x-2 p-2 bg-brand-secondary-100 border-t border-brand-secondary-200',
      className
    )}>
      {windows.map((window) => (
        <div
          key={window.id}
          className={cn(
            'flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 group',
            window.active
              ? 'bg-brand-primary-100 text-brand-primary-700'
              : 'hover:bg-brand-secondary-200 text-brand-secondary-700',
            window.minimized && 'opacity-60'
          )}
          onClick={() => onWindowClick?.(window.id)}
        >
          {window.icon && (
            <span className="flex-shrink-0">
              {window.icon}
            </span>
          )}
          <span className="text-sm font-medium truncate max-w-32">
            {window.title}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onWindowClose?.(window.id);
            }}
            className="opacity-0 group-hover:opacity-100 h-4 w-4 hover:bg-error-100 hover:text-error-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}