'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Menu,
  X,
  Search,
  Filter,
  MoreVertical,
  Grid,
  List,
  ArrowUp,
  Share,
  Heart,
  Bookmark
} from 'lucide-react';

// Mobile-first navigation drawer
export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: 'left' | 'right' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function MobileDrawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'left',
  size = 'md',
  className,
}: MobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getPositionClasses = () => {
    switch (position) {
      case 'right':
        return {
          container: 'justify-end',
          panel: 'translate-x-full',
          open: 'translate-x-0',
        };
      case 'bottom':
        return {
          container: 'items-end',
          panel: 'translate-y-full w-full',
          open: 'translate-y-0',
        };
      default: // left
        return {
          container: 'justify-start',
          panel: '-translate-x-full',
          open: 'translate-x-0',
        };
    }
  };

  const getSizeClasses = () => {
    if (position === 'bottom') {
      switch (size) {
        case 'sm': return 'h-1/3';
        case 'md': return 'h-1/2';
        case 'lg': return 'h-2/3';
        case 'full': return 'h-full';
        default: return 'h-1/2';
      }
    } else {
      switch (size) {
        case 'sm': return 'w-64';
        case 'md': return 'w-80';
        case 'lg': return 'w-96';
        case 'full': return 'w-full';
        default: return 'w-80';
      }
    }
  };

  const positionClasses = getPositionClasses();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn('relative h-full flex', positionClasses.container)}>
        <div
          className={cn(
            'bg-white shadow-brand-xl transform transition-transform duration-300 ease-out',
            getSizeClasses(),
            position === 'bottom' ? 'rounded-t-2xl' : 'h-full',
            isOpen ? positionClasses.open : positionClasses.panel,
            className
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-brand-secondary-200">
              <h2 className="text-lg font-semibold text-brand-secondary-900">
                {title}
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized card list
export interface MobileCardListProps {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    image?: string;
    badge?: string;
    metadata?: Record<string, any>;
  }>;
  onItemClick?: (item: any) => void;
  onItemAction?: (item: any, action: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function MobileCardList({
  items,
  onItemClick,
  onItemAction,
  loading = false,
  emptyMessage = 'No items found',
  className,
}: MobileCardListProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} loading />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-secondary-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => (
        <Card
          key={item.id}
          variant="default"
          interactive
          className="touch-target"
          onClick={() => onItemClick?.(item)}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              {/* Image */}
              {item.image && (
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brand-secondary-100 rounded-lg flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-8 h-8 object-cover rounded"
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-brand-secondary-900 truncate">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-brand-secondary-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <span className="ml-2 px-2 py-1 text-xs bg-brand-primary-100 text-brand-primary-700 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Metadata */}
                {item.metadata && (
                  <div className="flex items-center space-x-4 mt-2 text-xs text-brand-secondary-500">
                    {Object.entries(item.metadata).slice(0, 2).map(([key, value]) => (
                      <span key={key}>
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemAction?.(item, 'menu');
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Mobile-optimized tabs
export interface MobileTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number;
    content: React.ReactNode;
  }>;
  defaultTab?: string;
  scrollable?: boolean;
  className?: string;
}

export function MobileTabs({
  tabs,
  defaultTab,
  scrollable = true,
  className,
}: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tab Navigation */}
      <div className={cn(
        'flex border-b border-brand-secondary-200 bg-white',
        scrollable && 'overflow-x-auto scrollbar-hide'
      )}>
        <div className="flex space-x-1 p-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-target-sm whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-brand-primary-100 text-brand-primary-700'
                  : 'text-brand-secondary-600 hover:text-brand-secondary-900 hover:bg-brand-secondary-50'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-brand-primary-500 text-white rounded-full min-w-[1.25rem] text-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTabContent}
      </div>
    </div>
  );
}

// Mobile-optimized action sheet
export interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive';
    onClick: () => void;
  }>;
  className?: string;
}

export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  className,
}: MobileActionSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Action Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-brand-xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 bg-brand-secondary-300 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-4 pb-2">
            <h3 className="text-lg font-semibold text-brand-secondary-900 text-center">
              {title}
            </h3>
          </div>
        )}

        {/* Actions */}
        <div className={cn('p-4 space-y-2', className)}>
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={cn(
                'flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-colors duration-200 touch-target',
                action.variant === 'destructive'
                  ? 'text-error-600 hover:bg-error-50'
                  : 'text-brand-secondary-900 hover:bg-brand-secondary-50'
              )}
            >
              {action.icon && (
                <span className="flex-shrink-0">
                  {action.icon}
                </span>
              )}
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        <div className="p-4 pt-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full touch-target"
          >
            Cancel
          </Button>
        </div>

        {/* Safe area padding */}
        <div className="h-safe-bottom" />
      </div>
    </div>
  );
}

// Mobile-optimized floating action button
export interface MobileFABProps {
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function MobileFAB({
  icon,
  onClick,
  position = 'bottom-right',
  size = 'md',
  variant = 'primary',
  className,
}: MobileFABProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      default: // bottom-right
        return 'bottom-6 right-6';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'lg':
        return 'w-16 h-16';
      default: // md
        return 'w-14 h-14';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-brand-secondary-100 text-brand-secondary-900 hover:bg-brand-secondary-200';
      case 'accent':
        return 'bg-brand-accent-yellow-500 text-brand-secondary-900 hover:bg-brand-accent-yellow-600';
      default: // primary
        return 'bg-brand-primary-500 text-white hover:bg-brand-primary-600';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-40 rounded-full shadow-brand-lg hover:shadow-brand-xl transition-all duration-200 flex items-center justify-center touch-target active:scale-95',
        getPositionClasses(),
        getSizeClasses(),
        getVariantClasses(),
        className
      )}
    >
      {icon}
    </button>
  );
}

// Mobile-optimized pull-to-refresh
export interface MobilePullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  threshold?: number;
  className?: string;
}

export function MobilePullToRefresh({
  children,
  onRefresh,
  refreshing = false,
  threshold = 80,
  className,
}: MobilePullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0 && window.scrollY === 0) {
      setIsPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !refreshing) {
      await onRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(isPulling || refreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-brand-primary-50 transition-all duration-200 z-10"
          style={{
            height: Math.max(pullDistance * 0.5, refreshing ? 60 : 0),
            transform: `translateY(-${refreshing ? 0 : Math.max(0, 60 - pullDistance * 0.5)}px)`,
          }}
        >
          <div className="flex items-center space-x-2 text-brand-primary-600">
            <div
              className={cn(
                'w-5 h-5 border-2 border-brand-primary-300 border-t-brand-primary-600 rounded-full',
                (refreshing || pullProgress >= 1) && 'animate-spin'
              )}
              style={{
                transform: `rotate(${pullProgress * 360}deg)`,
              }}
            />
            <span className="text-sm font-medium">
              {refreshing
                ? 'Refreshing...'
                : pullProgress >= 1
                ? 'Release to refresh'
                : 'Pull to refresh'
              }
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${isPulling ? pullDistance * 0.5 : refreshing ? 60 : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}