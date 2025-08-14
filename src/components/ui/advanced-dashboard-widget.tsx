'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal, 
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Settings,
  Download,
  Share2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

export interface DashboardWidgetProps {
  title: string;
  description?: string;
  value: string | number;
  previousValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  refreshable?: boolean;
  expandable?: boolean;
  hideable?: boolean;
  downloadable?: boolean;
  shareable?: boolean;
  realTimeUpdate?: boolean;
  updateInterval?: number;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onRefresh?: () => void;
  onExpand?: () => void;
  onHide?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onSettingsClick?: () => void;
}

export function AdvancedDashboardWidget({
  title,
  description,
  value,
  previousValue,
  trend = 'neutral',
  trendPercentage,
  status,
  loading = false,
  refreshable = false,
  expandable = false,
  hideable = false,
  downloadable = false,
  shareable = false,
  realTimeUpdate = false,
  updateInterval = 5000,
  icon,
  children,
  className,
  onRefresh,
  onExpand,
  onHide,
  onDownload,
  onShare,
  onSettingsClick,
  ...props
}: DashboardWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);

  // Real-time update effect
  useEffect(() => {
    if (realTimeUpdate && updateInterval > 0) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
        onRefresh?.();
      }, updateInterval);

      return () => clearInterval(interval);
    }
  }, [realTimeUpdate, updateInterval, onRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  const handleHide = () => {
    setIsHidden(true);
    onHide?.();
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-error-500" />;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      case 'info':
        return <Clock className="h-4 w-4 text-brand-primary-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success-500';
      case 'down':
        return 'text-error-500';
      default:
        return 'text-brand-secondary-500';
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <Card
      variant={isExpanded ? "elevated" : "default"}
      interactive
      loading={loading}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isExpanded && "col-span-2 row-span-2",
        realTimeUpdate && "animate-pulse-brand",
        className
      )}
      {...props}
    >
      {/* Real-time indicator */}
      {realTimeUpdate && (
        <div className="absolute top-2 right-2 h-2 w-2 bg-success-500 rounded-full animate-pulse" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            {icon && (
              <div className="p-2 bg-brand-primary-50 rounded-lg group-hover:bg-brand-primary-100 transition-colors duration-200">
                {icon}
              </div>
            )}
            
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                <span>{title}</span>
                {getStatusIcon()}
              </CardTitle>
              {description && (
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-brand-secondary-200 rounded-lg shadow-brand-lg z-50 min-w-[160px] animate-fade-in-down">
                <div className="py-1">
                  {refreshable && (
                    <button
                      onClick={handleRefresh}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200"
                    >
                      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                      <span>Refresh</span>
                    </button>
                  )}
                  
                  {expandable && (
                    <button
                      onClick={handleExpand}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200"
                    >
                      {isExpanded ? (
                        <>
                          <Minimize2 className="h-4 w-4" />
                          <span>Minimize</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4" />
                          <span>Expand</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {downloadable && (
                    <button
                      onClick={onDownload}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  )}
                  
                  {shareable && (
                    <button
                      onClick={onShare}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                  )}
                  
                  {onSettingsClick && (
                    <button
                      onClick={onSettingsClick}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                  )}
                  
                  {hideable && (
                    <button
                      onClick={handleHide}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-brand-secondary-50 text-error-600 transition-colors duration-200"
                    >
                      <EyeOff className="h-4 w-4" />
                      <span>Hide</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Value */}
        <div className="space-y-2">
          <div className="text-3xl font-bold font-display text-brand-secondary-900 animate-fade-in">
            {loading ? (
              <div className="h-8 bg-brand-secondary-200 rounded animate-pulse" />
            ) : (
              value
            )}
          </div>

          {/* Trend Information */}
          {(trend !== 'neutral' || trendPercentage) && (
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              {trendPercentage && (
                <span className={cn("text-sm font-medium", getTrendColor())}>
                  {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
                  {Math.abs(trendPercentage)}%
                </span>
              )}
              {previousValue && (
                <span className="text-sm text-brand-secondary-500">
                  from {previousValue}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        {status && (
          <Badge 
            variant={status === 'success' ? 'success' : status === 'warning' ? 'warning' : status === 'error' ? 'destructive' : 'info'}
            size="sm"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )}

        {/* Custom Content */}
        {children && (
          <div className={cn("transition-all duration-300", isExpanded && "mt-6")}>
            {children}
          </div>
        )}

        {/* Last Updated */}
        {realTimeUpdate && (
          <div className="flex items-center space-x-1 text-xs text-brand-secondary-400">
            <Clock className="h-3 w-3" />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </Card>
  );
}

// Specialized widget variants
export function MetricWidget(props: Omit<DashboardWidgetProps, 'children'>) {
  return <AdvancedDashboardWidget {...props} />;
}

export function ChartWidget({ 
  children, 
  ...props 
}: DashboardWidgetProps) {
  return (
    <AdvancedDashboardWidget {...props} expandable>
      <div className="h-32 flex items-center justify-center bg-brand-secondary-50 rounded-lg">
        {children || (
          <div className="text-brand-secondary-400 text-sm">Chart placeholder</div>
        )}
      </div>
    </AdvancedDashboardWidget>
  );
}

export function StatusWidget({ 
  status = 'info',
  ...props 
}: DashboardWidgetProps) {
  return (
    <AdvancedDashboardWidget 
      {...props} 
      status={status}
      realTimeUpdate
      refreshable
    />
  );
}