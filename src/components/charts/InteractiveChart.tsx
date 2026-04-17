import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Maximize2,
  RefreshCw,
  Filter,
  Calendar,
  MapPin,
  Users,
  Car,
  DollarSign
} from "lucide-react"

// Chart Data Types
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  metadata?: Record<string, any>
}

export interface TimeSeriesDataPoint {
  timestamp: Date
  value: number
  category?: string
}

export interface ChartConfig {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap'
  data: ChartDataPoint[] | TimeSeriesDataPoint[]
  options: ChartOptions
  interactive: boolean
  exportable: boolean
  realTime?: boolean
}

export interface ChartOptions {
  width?: number
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showZoom?: boolean
  colors?: string[]
  xAxisLabel?: string
  yAxisLabel?: string
  dateRange?: { start: Date; end: Date }
}

interface InteractiveChartsProps {
  userRole: string
  className?: string
}

// Main Interactive Charts Component
export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  userRole,
  className,
}) => {
  const [selectedChart, setSelectedChart] = React.useState<string>('earnings-trend')
  const [timeRange, setTimeRange] = React.useState<string>('7d')
  const [isLoading, setIsLoading] = React.useState(false)
  const [chartData, setChartData] = React.useState<ChartConfig[]>([])

  const availableCharts = getChartsForRole(userRole)

  // Load chart data
  React.useEffect(() => {
    setIsLoading(true)
    const data = generateChartData(userRole, timeRange)
    setChartData(data)
    setIsLoading(false)
  }, [userRole, timeRange])

  const currentChart = chartData.find(chart => chart.id === selectedChart) || chartData[0]

  const handleExportChart = (chartId: string) => {
    console.log('Exporting chart:', chartId)
    // Implement chart export functionality
  }

  const handleRefreshChart = (chartId: string) => {
    console.log('Refreshing chart:', chartId)
    // Implement chart refresh functionality
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedChart} onValueChange={setSelectedChart}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select chart" />
            </SelectTrigger>
            <SelectContent>
              {availableCharts.map((chart) => (
                <SelectItem key={chart.id} value={chart.id}>
                  <div className="flex items-center gap-2">
                    {chart.icon}
                    {chart.title}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefreshChart(selectedChart)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportChart(selectedChart)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Chart Display */}
      {currentChart && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getChartIcon(currentChart.type)}
                  {currentChart.title}
                </CardTitle>
                <CardDescription>
                  {getChartDescription(currentChart, timeRange)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {currentChart.realTime && (
                  <Badge variant="secondary" className="text-xs">
                    Live
                  </Badge>
                )}
                <Button variant="ghost" size="icon">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ChartRenderer chart={currentChart} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.slice(1, 7).map((chart) => (
          <MiniChart
            key={chart.id}
            chart={chart}
            onSelect={() => setSelectedChart(chart.id)}
            onExport={() => handleExportChart(chart.id)}
          />
        ))}
      </div>

      {/* Chart Analytics Summary */}
      <ChartAnalyticsSummary
        charts={chartData}
        userRole={userRole}
        timeRange={timeRange}
      />
    </div>
  )
}

// Chart Renderer Component
interface ChartRendererProps {
  chart: ChartConfig
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  switch (chart.type) {
    case 'line':
      return <LineChartComponent chart={chart} />
    case 'bar':
      return <BarChartComponent chart={chart} />
    case 'pie':
      return <PieChartComponent chart={chart} />
    case 'area':
      return <AreaChartComponent chart={chart} />
    default:
      return <LineChartComponent chart={chart} />
  }
}

// Line Chart Component
const LineChartComponent: React.FC<ChartRendererProps> = ({ chart }) => {
  const data = chart.data as TimeSeriesDataPoint[]
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="h-64 w-full relative">
      <svg className="w-full h-full" viewBox="0 0 800 300">
        {/* Grid Lines */}
        {chart.options.showGrid && (
          <g className="opacity-20">
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="50"
                y1={50 + i * 50}
                x2="750"
                y2={50 + i * 50}
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
          </g>
        )}
        
        {/* Line Path */}
        <path
          d={generateLinePath(data, maxValue)}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        
        {/* Data Points */}
        {data.map((point, index) => (
          <circle
            key={index}
            cx={50 + (index * (700 / (data.length - 1)))}
            cy={250 - (point.value / maxValue) * 200}
            r="4"
            fill="hsl(var(--primary))"
            className="hover:r-6 transition-all cursor-pointer"
            title={`${point.value} at ${point.timestamp.toLocaleString()}`}
          />
        ))}
        
        {/* Axes */}
        <line x1="50" y1="250" x2="750" y2="250" stroke="currentColor" strokeWidth="1" />
        <line x1="50" y1="50" x2="50" y2="250" stroke="currentColor" strokeWidth="1" />
      </svg>
      
      {/* Interactive Tooltip */}
      <ChartTooltip chart={chart} />
    </div>
  )
}

// Bar Chart Component
const BarChartComponent: React.FC<ChartRendererProps> = ({ chart }) => {
  const data = chart.data as ChartDataPoint[]
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="h-64 w-full relative">
      <svg className="w-full h-full" viewBox="0 0 800 300">
        {/* Bars */}
        {data.map((point, index) => {
          const barWidth = 600 / data.length - 10
          const barHeight = (point.value / maxValue) * 200
          const x = 50 + index * (600 / data.length) + 5
          const y = 250 - barHeight
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={point.color || "hsl(var(--primary))"}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title={`${point.label}: ${point.value}`}
              />
              <text
                x={x + barWidth / 2}
                y={270}
                textAnchor="middle"
                className="text-xs fill-current"
              >
                {point.label}
              </text>
            </g>
          )
        })}
        
        {/* Axes */}
        <line x1="50" y1="250" x2="650" y2="250" stroke="currentColor" strokeWidth="1" />
        <line x1="50" y1="50" x2="50" y2="250" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  )
}

// Pie Chart Component
const PieChartComponent: React.FC<ChartRendererProps> = ({ chart }) => {
  const data = chart.data as ChartDataPoint[]
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let currentAngle = 0
  
  return (
    <div className="h-64 w-full flex items-center justify-center">
      <svg width="300" height="300" viewBox="0 0 300 300">
        {data.map((point, index) => {
          const percentage = point.value / total
          const angle = percentage * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          
          const path = createArcPath(150, 150, 100, startAngle, endAngle)
          currentAngle += angle
          
          return (
            <g key={index}>
              <path
                d={path}
                fill={point.color || `hsl(${index * 60}, 70%, 50%)`}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title={`${point.label}: ${point.value} (${(percentage * 100).toFixed(1)}%)`}
              />
            </g>
          )
        })}
        
        {/* Center Circle */}
        <circle
          cx="150"
          cy="150"
          r="40"
          fill="hsl(var(--background))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
        <text
          x="150"
          y="155"
          textAnchor="middle"
          className="text-sm font-medium fill-current"
        >
          Total: {total}
        </text>
      </svg>
      
      {/* Legend */}
      <div className="ml-6 space-y-2">
        {data.map((point, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: point.color || `hsl(${index * 60}, 70%, 50%)` }}
            />
            <span className="text-sm">{point.label}</span>
            <span className="text-sm text-muted-foreground">({point.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Area Chart Component
const AreaChartComponent: React.FC<ChartRendererProps> = ({ chart }) => {
  const data = chart.data as TimeSeriesDataPoint[]
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="h-64 w-full relative">
      <svg className="w-full h-full" viewBox="0 0 800 300">
        {/* Area Fill */}
        <path
          d={generateAreaPath(data, maxValue)}
          fill="hsl(var(--primary))"
          fillOpacity="0.2"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        
        {/* Data Points */}
        {data.map((point, index) => (
          <circle
            key={index}
            cx={50 + (index * (700 / (data.length - 1)))}
            cy={250 - (point.value / maxValue) * 200}
            r="3"
            fill="hsl(var(--primary))"
            className="hover:r-5 transition-all cursor-pointer"
          />
        ))}
        
        {/* Axes */}
        <line x1="50" y1="250" x2="750" y2="250" stroke="currentColor" strokeWidth="1" />
        <line x1="50" y1="50" x2="50" y2="250" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  )
}

// Mini Chart Component
interface MiniChartProps {
  chart: ChartConfig
  onSelect: () => void
  onExport: () => void
}

const MiniChart: React.FC<MiniChartProps> = ({ chart, onSelect, onExport }) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          {getChartIcon(chart.type)}
          {chart.title}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            onExport()
          }}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="h-20 w-full">
        <MiniChartRenderer chart={chart} />
      </div>
    </CardContent>
  </Card>
)

// Mini Chart Renderer
const MiniChartRenderer: React.FC<{ chart: ChartConfig }> = ({ chart }) => {
  if (chart.type === 'pie') {
    const data = chart.data as ChartDataPoint[]
    const total = data.reduce((sum, d) => sum + d.value, 0)
    
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
          <span className="text-xs font-medium">{total}</span>
        </div>
      </div>
    )
  }
  
  const data = chart.data as TimeSeriesDataPoint[]
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <svg className="w-full h-full" viewBox="0 0 200 80">
      <path
        d={generateMiniLinePath(data, maxValue)}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
      />
    </svg>
  )
}

// Chart Tooltip Component
const ChartTooltip: React.FC<{ chart: ChartConfig }> = ({ chart }) => {
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; content: string } | null>(null)
  
  return tooltip ? (
    <div
      className="absolute bg-popover border rounded-md shadow-md p-2 text-sm pointer-events-none z-10"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      {tooltip.content}
    </div>
  ) : null
}

// Chart Analytics Summary Component
interface ChartAnalyticsSummaryProps {
  charts: ChartConfig[]
  userRole: string
  timeRange: string
}

const ChartAnalyticsSummary: React.FC<ChartAnalyticsSummaryProps> = ({
  charts,
  userRole,
  timeRange,
}) => {
  const summary = generateAnalyticsSummary(charts, userRole, timeRange)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics Summary
        </CardTitle>
        <CardDescription>
          Key insights from your data over the selected time period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-primary">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
              {metric.change && (
                <div className={cn(
                  "text-xs flex items-center justify-center gap-1 mt-1",
                  metric.change > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {metric.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(metric.change)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Chart Skeleton Component
const ChartSkeleton: React.FC = () => (
  <div className="h-64 w-full animate-pulse">
    <div className="h-full bg-muted rounded-md flex items-end justify-around p-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-muted-foreground/20 rounded-t"
          style={{ 
            height: `${Math.random() * 80 + 20}%`,
            width: '8%'
          }}
        />
      ))}
    </div>
  </div>
)

// Utility Functions
const getChartsForRole = (role: string) => {
  const charts = {
    passenger: [
      { id: 'ride-history', title: 'Ride History', icon: <Car className="h-4 w-4" /> },
      { id: 'spending-trend', title: 'Spending Trend', icon: <DollarSign className="h-4 w-4" /> },
      { id: 'favorite-routes', title: 'Favorite Routes', icon: <MapPin className="h-4 w-4" /> },
    ],
    driver: [
      { id: 'earnings-trend', title: 'Earnings Trend', icon: <DollarSign className="h-4 w-4" /> },
      { id: 'ride-completion', title: 'Ride Completion', icon: <Car className="h-4 w-4" /> },
      { id: 'rating-trend', title: 'Rating Trend', icon: <TrendingUp className="h-4 w-4" /> },
    ],
    operator: [
      { id: 'fleet-utilization', title: 'Fleet Utilization', icon: <Car className="h-4 w-4" /> },
      { id: 'driver-performance', title: 'Driver Performance', icon: <Users className="h-4 w-4" /> },
      { id: 'demand-heatmap', title: 'Demand Heatmap', icon: <MapPin className="h-4 w-4" /> },
    ],
    admin: [
      { id: 'revenue-analytics', title: 'Revenue Analytics', icon: <DollarSign className="h-4 w-4" /> },
      { id: 'user-growth', title: 'User Growth', icon: <Users className="h-4 w-4" /> },
      { id: 'platform-health', title: 'Platform Health', icon: <TrendingUp className="h-4 w-4" /> },
    ],
  }
  
  return charts[role as keyof typeof charts] || charts.passenger
}

const generateChartData = (role: string, timeRange: string): ChartConfig[] => {
  // Generate sample data based on role and time range
  const dataPoints = getTimeRangePoints(timeRange)
  
  return [
    {
      id: 'earnings-trend',
      title: 'Earnings Trend',
      type: 'line',
      data: dataPoints.map(date => ({
        timestamp: date,
        value: Math.floor(Math.random() * 500) + 100,
      })),
      options: { showGrid: true, showLegend: true },
      interactive: true,
      exportable: true,
      realTime: true,
    },
    {
      id: 'ride-distribution',
      title: 'Ride Distribution',
      type: 'pie',
      data: [
        { label: 'Completed', value: 85, color: '#22c55e' },
        { label: 'Cancelled', value: 10, color: '#ef4444' },
        { label: 'In Progress', value: 5, color: '#3b82f6' },
      ],
      options: { showLegend: true },
      interactive: true,
      exportable: true,
    },
    // Add more chart configurations...
  ]
}

const getTimeRangePoints = (range: string): Date[] => {
  const now = new Date()
  const points: Date[] = []
  
  const days = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }[range] || 7
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    points.push(date)
  }
  
  return points
}

const getChartIcon = (type: string) => {
  const icons = {
    line: <LineChart className="h-4 w-4" />,
    bar: <BarChart3 className="h-4 w-4" />,
    pie: <PieChart className="h-4 w-4" />,
    area: <TrendingUp className="h-4 w-4" />,
  }
  return icons[type as keyof typeof icons] || <BarChart3 className="h-4 w-4" />
}

const getChartDescription = (chart: ChartConfig, timeRange: string) => {
  return `${chart.title} data for the last ${timeRange.replace('d', ' days').replace('y', ' year')}`
}

const generateLinePath = (data: TimeSeriesDataPoint[], maxValue: number): string => {
  if (data.length === 0) return ''
  
  const points = data.map((point, index) => {
    const x = 50 + (index * (700 / (data.length - 1)))
    const y = 250 - (point.value / maxValue) * 200
    return `${x},${y}`
  })
  
  return `M ${points.join(' L ')}`
}

const generateAreaPath = (data: TimeSeriesDataPoint[], maxValue: number): string => {
  if (data.length === 0) return ''
  
  const linePath = generateLinePath(data, maxValue)
  const lastX = 50 + ((data.length - 1) * (700 / (data.length - 1)))
  
  return `${linePath} L ${lastX},250 L 50,250 Z`
}

const generateMiniLinePath = (data: TimeSeriesDataPoint[], maxValue: number): string => {
  if (data.length === 0) return ''
  
  const points = data.map((point, index) => {
    const x = 10 + (index * (180 / (data.length - 1)))
    const y = 70 - (point.value / maxValue) * 60
    return `${x},${y}`
  })
  
  return `M ${points.join(' L ')}`
}

const createArcPath = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string => {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
  
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ")
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  }
}

const generateAnalyticsSummary = (charts: ChartConfig[], role: string, timeRange: string) => {
  // Generate summary metrics based on charts and role
  return [
    { label: 'Total Revenue', value: '$12,847', change: 15 },
    { label: 'Active Users', value: '2,341', change: 7 },
    { label: 'Completion Rate', value: '94.2%', change: 2 },
    { label: 'Avg Rating', value: '4.8', change: -1 },
  ]
}

export default InteractiveCharts