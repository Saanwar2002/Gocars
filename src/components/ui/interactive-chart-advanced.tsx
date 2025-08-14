'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Maximize2,
  TrendingUp,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface InteractiveChartProps {
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  showTooltip?: boolean;
  showZoom?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
  realTime?: boolean;
  updateInterval?: number;
  colors?: string[];
  className?: string;
  onDataPointClick?: (point: ChartDataPoint, index: number) => void;
  onZoom?: (zoomLevel: number) => void;
  onDownload?: () => void;
}

export function InteractiveChartAdvanced({
  data,
  type = 'line',
  title,
  description,
  width = 400,
  height = 300,
  showTooltip = true,
  showZoom = true,
  showGrid = true,
  showLegend = true,
  animated = true,
  realTime = false,
  updateInterval = 5000,
  colors = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'],
  className,
  onDataPointClick,
  onZoom,
  onDownload,
}: InteractiveChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredPoint, setHoveredPoint] = useState<{ point: ChartDataPoint; index: number; x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate chart dimensions
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Data processing
  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const maxX = data.length - 1;

  // Scale functions
  const scaleX = (index: number) => (index / maxX) * chartWidth * zoomLevel;
  const scaleY = (value: number) => chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

  // Generate path for line/area charts
  const generatePath = () => {
    if (data.length === 0) return '';
    
    const pathData = data.map((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point.y);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return pathData;
  };

  // Generate area path
  const generateAreaPath = () => {
    if (data.length === 0) return '';
    
    const linePath = generatePath();
    const lastPoint = data[data.length - 1];
    const lastX = scaleX(data.length - 1);
    const bottomY = scaleY(minY);
    
    return `${linePath} L ${lastX} ${bottomY} L ${scaleX(0)} ${bottomY} Z`;
  };

  // Handle mouse events
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - margin.left;
    const mouseY = event.clientY - rect.top - margin.top;

    // Find closest data point
    const closestIndex = Math.round((mouseX / (chartWidth * zoomLevel)) * maxX);
    if (closestIndex >= 0 && closestIndex < data.length) {
      const point = data[closestIndex];
      setHoveredPoint({
        point,
        index: closestIndex,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleDataPointClick = (point: ChartDataPoint, index: number) => {
    onDataPointClick?.(point, index);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.5, 5);
    setZoomLevel(newZoom);
    onZoom?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.5, 0.5);
    setZoomLevel(newZoom);
    onZoom?.(newZoom);
  };

  const handleReset = () => {
    setZoomLevel(1);
    onZoom?.(1);
  };

  const getChartIcon = () => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-4 w-4" />;
      case 'pie':
        return <PieChart className="h-4 w-4" />;
      case 'area':
        return <Activity className="h-4 w-4" />;
      default:
        return <LineChart className="h-4 w-4" />;
    }
  };

  // Real-time updates
  useEffect(() => {
    if (realTime && updateInterval > 0) {
      const interval = setInterval(() => {
        // Trigger re-render for real-time effect
        setZoomLevel(prev => prev);
      }, updateInterval);

      return () => clearInterval(interval);
    }
  }, [realTime, updateInterval]);

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <g>
            <path
              d={generatePath()}
              fill="none"
              stroke={colors[0]}
              strokeWidth="2"
              className={cn(animated && "animate-fade-in")}
            />
            {data.map((point, index) => (
              <circle
                key={index}
                cx={scaleX(index)}
                cy={scaleY(point.y)}
                r="4"
                fill={colors[0]}
                className="cursor-pointer hover:r-6 transition-all duration-200"
                onClick={() => handleDataPointClick(point, index)}
              />
            ))}
          </g>
        );

      case 'area':
        return (
          <g>
            <path
              d={generateAreaPath()}
              fill={`${colors[0]}40`}
              stroke={colors[0]}
              strokeWidth="2"
              className={cn(animated && "animate-fade-in")}
            />
            <path
              d={generatePath()}
              fill="none"
              stroke={colors[0]}
              strokeWidth="2"
            />
          </g>
        );

      case 'bar':
        return (
          <g>
            {data.map((point, index) => {
              const barWidth = (chartWidth / data.length) * 0.8;
              const barHeight = ((point.y - minY) / (maxY - minY)) * chartHeight;
              const x = scaleX(index) - barWidth / 2;
              const y = chartHeight - barHeight;

              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={colors[index % colors.length]}
                  className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  onClick={() => handleDataPointClick(point, index)}
                />
              );
            })}
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <Card 
      variant="elevated" 
      className={cn(
        "relative overflow-hidden",
        isFullscreen && "fixed inset-4 z-50",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getChartIcon()}
            <div>
              {title && <CardTitle className="text-lg">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {realTime && (
              <Badge variant="success" size="sm" pulse>
                Live
              </Badge>
            )}

            {showZoom && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-brand-secondary-500 min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 5}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            {onDownload && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="relative">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="border border-brand-secondary-200 rounded-lg bg-white overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Grid */}
            {showGrid && (
              <g className="opacity-20">
                {/* Horizontal grid lines */}
                {Array.from({ length: 5 }, (_, i) => {
                  const y = margin.top + (i * chartHeight) / 4;
                  return (
                    <line
                      key={`h-${i}`}
                      x1={margin.left}
                      y1={y}
                      x2={margin.left + chartWidth}
                      y2={y}
                      stroke="#64748b"
                      strokeWidth="1"
                    />
                  );
                })}
                {/* Vertical grid lines */}
                {Array.from({ length: 5 }, (_, i) => {
                  const x = margin.left + (i * chartWidth) / 4;
                  return (
                    <line
                      key={`v-${i}`}
                      x1={x}
                      y1={margin.top}
                      x2={x}
                      y2={margin.top + chartHeight}
                      stroke="#64748b"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
            )}

            {/* Chart content */}
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {renderChart()}
            </g>

            {/* Axes */}
            <g>
              {/* X-axis */}
              <line
                x1={margin.left}
                y1={margin.top + chartHeight}
                x2={margin.left + chartWidth}
                y2={margin.top + chartHeight}
                stroke="#64748b"
                strokeWidth="1"
              />
              {/* Y-axis */}
              <line
                x1={margin.left}
                y1={margin.top}
                x2={margin.left}
                y2={margin.top + chartHeight}
                stroke="#64748b"
                strokeWidth="1"
              />
            </g>

            {/* Axis labels */}
            <g className="text-xs fill-brand-secondary-600">
              {/* Y-axis labels */}
              {Array.from({ length: 5 }, (_, i) => {
                const value = minY + (i * (maxY - minY)) / 4;
                const y = margin.top + chartHeight - (i * chartHeight) / 4;
                return (
                  <text
                    key={`y-label-${i}`}
                    x={margin.left - 10}
                    y={y + 4}
                    textAnchor="end"
                  >
                    {Math.round(value)}
                  </text>
                );
              })}
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredPoint && showTooltip && (
            <div
              className="absolute z-10 bg-white border border-brand-secondary-200 rounded-lg shadow-brand-lg p-3 pointer-events-none animate-fade-in"
              style={{
                left: hoveredPoint.x + 10,
                top: hoveredPoint.y - 10,
                transform: 'translateY(-100%)',
              }}
            >
              <div className="text-sm font-medium text-brand-secondary-900">
                {hoveredPoint.point.label || `Point ${hoveredPoint.index + 1}`}
              </div>
              <div className="text-xs text-brand-secondary-600">
                Value: {hoveredPoint.point.y}
              </div>
              {hoveredPoint.point.metadata && (
                <div className="text-xs text-brand-secondary-500 mt-1">
                  {Object.entries(hoveredPoint.point.metadata).map(([key, value]) => (
                    <div key={key}>
                      {key}: {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-center space-x-4 mt-4">
            {colors.slice(0, Math.min(colors.length, 5)).map((color, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-brand-secondary-600">
                  Series {index + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </Card>
  );
}

// Specialized chart components
export function LineChart(props: Omit<InteractiveChartProps, 'type'>) {
  return <InteractiveChartAdvanced {...props} type="line" />;
}

export function BarChart(props: Omit<InteractiveChartProps, 'type'>) {
  return <InteractiveChartAdvanced {...props} type="bar" />;
}

export function AreaChart(props: Omit<InteractiveChartProps, 'type'>) {
  return <InteractiveChartAdvanced {...props} type="area" />;
}

export function RealTimeChart(props: Omit<InteractiveChartProps, 'realTime'>) {
  return <InteractiveChartAdvanced {...props} realTime />;
}