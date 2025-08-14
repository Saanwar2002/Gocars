'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { cn } from '@/lib/utils';
import {
  Grid,
  List,
  Columns,
  Sidebar,
  PanelLeft,
  PanelRight,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Tablet-optimized split view
export interface TabletSplitViewProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelWidth?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export function TabletSplitView({
  leftPanel,
  rightPanel,
  leftPanelWidth = 'md',
  collapsible = true,
  defaultCollapsed = false,
  className,
}: TabletSplitViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const getLeftPanelWidth = () => {
    if (isCollapsed) return 'w-0';
    
    switch (leftPanelWidth) {
      case 'sm':
        return 'w-80';
      case 'lg':
        return 'w-96';
      default: // md
        return 'w-88';
    }
  };

  return (
    <div className={cn('flex h-full', className)}>
      {/* Left Panel */}
      <div
        className={cn(
          'flex-shrink-0 border-r border-brand-secondary-200 bg-white transition-all duration-300 overflow-hidden',
          getLeftPanelWidth()
        )}
      >
        {!isCollapsed && (
          <div className="h-full overflow-auto">
            {leftPanel}
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      {collapsible && (
        <div className="flex-shrink-0 w-6 bg-brand-secondary-50 border-r border-brand-secondary-200 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-4"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}

      {/* Right Panel */}
      <div className="flex-1 overflow-auto">
        {rightPanel}
      </div>
    </div>
  );
}

// Tablet-optimized grid with adaptive columns
export interface TabletAdaptiveGridProps {
  children: React.ReactNode;
  minItemWidth?: number;
  gap?: number;
  className?: string;
}

export function TabletAdaptiveGrid({
  children,
  minItemWidth = 280,
  gap = 24,
  className,
}: TabletAdaptiveGridProps) {
  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

// Tablet-optimized card grid with view switcher
export interface TabletCardGridProps {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    image?: string;
    metadata?: Record<string, any>;
  }>;
  viewMode?: 'grid' | 'list' | 'columns';
  onViewModeChange?: (mode: 'grid' | 'list' | 'columns') => void;
  onItemClick?: (item: any) => void;
  loading?: boolean;
  className?: string;
}

export function TabletCardGrid({
  items,
  viewMode = 'grid',
  onViewModeChange,
  onItemClick,
  loading = false,
  className,
}: TabletCardGridProps) {
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

  const handleViewModeChange = (mode: 'grid' | 'list' | 'columns') => {
    setCurrentViewMode(mode);
    onViewModeChange?.(mode);
  };

  const renderGridView = () => (
    <TabletAdaptiveGrid minItemWidth={280} gap={24}>
      {items.map((item) => (
        <Card
          key={item.id}
          variant="default"
          interactive
          onClick={() => onItemClick?.(item)}
          className="h-full"
        >
          {item.image && (
            <div className="aspect-video bg-brand-secondary-100 rounded-t-xl overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{item.title}</CardTitle>
            {item.description && (
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            )}
          </CardHeader>
          {item.metadata && (
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {Object.entries(item.metadata).slice(0, 3).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-1 text-xs bg-brand-secondary-100 text-brand-secondary-700 rounded-full"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </TabletAdaptiveGrid>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {items.map((item) => (
        <Card
          key={item.id}
          variant="default"
          interactive
          onClick={() => onItemClick?.(item)}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              {item.image && (
                <div className="flex-shrink-0 w-20 h-20 bg-brand-secondary-100 rounded-lg overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-brand-secondary-900 mb-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-brand-secondary-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}
                {item.metadata && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.metadata).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-1 text-xs bg-brand-secondary-100 text-brand-secondary-700 rounded-full"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle item actions
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderColumnsView = () => (
    <div className="grid grid-cols-2 gap-6">
      {items.map((item) => (
        <Card
          key={item.id}
          variant="default"
          interactive
          onClick={() => onItemClick?.(item)}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              {item.image && (
                <div className="flex-shrink-0 w-16 h-16 bg-brand-secondary-100 rounded-lg overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-brand-secondary-900 mb-1 truncate">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-brand-secondary-600 line-clamp-2">
                    {item.description}
                  </p>
                )}
                {item.metadata && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(item.metadata).slice(0, 2).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-1.5 py-0.5 text-xs bg-brand-secondary-100 text-brand-secondary-700 rounded"
                      >
                        {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} loading />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* View Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-brand-secondary-700">
            View:
          </span>
          <div className="flex items-center bg-brand-secondary-100 rounded-lg p-1">
            <Button
              variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={currentViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={currentViewMode === 'columns' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('columns')}
              className="h-8 px-3"
            >
              <Columns className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-brand-secondary-500">
          {items.length} items
        </div>
      </div>

      {/* Content */}
      {currentViewMode === 'grid' && renderGridView()}
      {currentViewMode === 'list' && renderListView()}
      {currentViewMode === 'columns' && renderColumnsView()}
    </div>
  );
}

// Tablet-optimized sidebar navigation
export interface TabletSidebarProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    active?: boolean;
    children?: Array<{
      id: string;
      label: string;
      href?: string;
      active?: boolean;
    }>;
  }>;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onItemClick?: (item: any) => void;
  className?: string;
}

export function TabletSidebar({
  items,
  collapsible = true,
  defaultCollapsed = false,
  onItemClick,
  className,
}: TabletSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div
      className={cn(
        'bg-white border-r border-brand-secondary-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-brand-secondary-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-brand-secondary-900">
              Navigation
            </h2>
          )}
          {collapsible && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <PanelRight className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-2 space-y-1">
        {items.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.children) {
                  toggleExpanded(item.id);
                } else {
                  onItemClick?.(item);
                }
              }}
              className={cn(
                'flex items-center w-full p-3 rounded-lg text-left transition-colors duration-200',
                item.active
                  ? 'bg-brand-primary-100 text-brand-primary-700'
                  : 'text-brand-secondary-700 hover:bg-brand-secondary-100 hover:text-brand-secondary-900'
              )}
            >
              {item.icon && (
                <span className="flex-shrink-0 mr-3">
                  {item.icon}
                </span>
              )}
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.children && (
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        expandedItems.has(item.id) && 'rotate-90'
                      )}
                    />
                  )}
                </>
              )}
            </button>

            {/* Children */}
            {item.children && !isCollapsed && expandedItems.has(item.id) && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onItemClick?.(child)}
                    className={cn(
                      'flex items-center w-full p-2 rounded-lg text-left text-sm transition-colors duration-200',
                      child.active
                        ? 'bg-brand-primary-100 text-brand-primary-700'
                        : 'text-brand-secondary-600 hover:bg-brand-secondary-100 hover:text-brand-secondary-800'
                    )}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Tablet-optimized multi-panel layout
export interface TabletMultiPanelProps {
  panels: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    width?: 'sm' | 'md' | 'lg' | 'xl';
    resizable?: boolean;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  }>;
  className?: string;
}

export function TabletMultiPanel({
  panels,
  className,
}: TabletMultiPanelProps) {
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(
    new Set(panels.filter(p => p.defaultCollapsed).map(p => p.id))
  );

  const togglePanel = (panelId: string) => {
    const newCollapsed = new Set(collapsedPanels);
    if (newCollapsed.has(panelId)) {
      newCollapsed.delete(panelId);
    } else {
      newCollapsed.add(panelId);
    }
    setCollapsedPanels(newCollapsed);
  };

  const getWidthClass = (width?: string) => {
    switch (width) {
      case 'sm': return 'w-64';
      case 'md': return 'w-80';
      case 'lg': return 'w-96';
      case 'xl': return 'w-128';
      default: return 'flex-1';
    }
  };

  return (
    <div className={cn('flex h-full', className)}>
      {panels.map((panel, index) => {
        const isCollapsed = collapsedPanels.has(panel.id);
        
        return (
          <React.Fragment key={panel.id}>
            <div
              className={cn(
                'bg-white transition-all duration-300 overflow-hidden',
                isCollapsed ? 'w-0' : getWidthClass(panel.width)
              )}
            >
              {!isCollapsed && (
                <>
                  {/* Panel Header */}
                  <div className="flex items-center justify-between p-4 border-b border-brand-secondary-200">
                    <h3 className="font-semibold text-brand-secondary-900">
                      {panel.title}
                    </h3>
                    {panel.collapsible && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => togglePanel(panel.id)}
                      >
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Panel Content */}
                  <div className="h-full overflow-auto">
                    {panel.content}
                  </div>
                </>
              )}
            </div>

            {/* Panel Separator */}
            {index < panels.length - 1 && (
              <div className="w-px bg-brand-secondary-200 flex-shrink-0">
                {isCollapsed && panel.collapsible && (
                  <div className="flex items-center justify-center h-full">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => togglePanel(panel.id)}
                      className="rotate-90"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}