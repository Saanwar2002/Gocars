import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  DollarSign,
  MapPin,
  Clock,
  Star,
  AlertTriangle,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  Eye,
  Target,
  Zap
} from "lucide-react"
import { InteractiveCharts } from "@/components/charts/interactive-charts"

// Analytics Types
export interface AnalyticsMetric {
  id: string
  label: string
  value: string | number
  change?: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  color?: string
  target?: number
  description?: string
}

export interface AnalyticsFilter {
  id: string
  label: string
  value: string
  options: { label: string; value: string }[]
}

interface AnalyticsDashboardProps {
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  className?: string
}

// Main Analytics Dashboard Component
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userRole,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [timeRange, setTimeRange] = React.useState("7d")
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(false)

  const metrics = getMetricsForRole(userRole, timeRange)
  const availableFilters = getFiltersForRole(userRole)
  const tabs = getTabsForRole(userRole)

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }))
  }

  const handleExportData = () => {
    console.log('Exporting analytics data...')
    // Implement export functionality
  }

  const handleRefreshData = () => {
    setIsLoading(true)
    // Simulate data refresh
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics for {userRole}s
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleRefreshData}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {availableFilters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4">
              {availableFilters.map((filter) => (
                <div key={filter.id} className="flex items-center gap-2">
                  <label className="text-sm font-medium">{filter.label}:</label>
                  <Select
                    value={filters[filter.id] || filter.value}
                    onValueChange={(value) => handleFilterChange(filter.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <div className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab userRole={userRole} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab userRole={userRole} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendsTab userRole={userRole} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsTab userRole={userRole} timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  metric: AnalyticsMetric
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
      <div className={cn("text-muted-foreground", metric.color)}>
        {metric.icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{metric.value}</div>
      {metric.change !== undefined && (
        <div className={cn(
          "text-xs flex items-center gap-1 mt-1",
          metric.trend === 'up' ? "text-green-600" : 
          metric.trend === 'down' ? "text-red-600" : "text-muted-foreground"
        )}>
          {metric.trend === 'up' && <TrendingUp className="h-3 w-3" />}
          {metric.trend === 'down' && <TrendingDown className="h-3 w-3" />}
          {metric.change > 0 ? '+' : ''}{metric.change}% from last period
        </div>
      )}
      {metric.target && (
        <div className="text-xs text-muted-foreground mt-1">
          Target: {metric.target}
        </div>
      )}
      {metric.description && (
        <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
      )}
    </CardContent>
  </Card>
)

// Overview Tab Component
interface TabProps {
  userRole: string
  timeRange: string
}

const OverviewTab: React.FC<TabProps> = ({ userRole }) => (
  <div className="space-y-6">
    {/* Interactive Charts */}
    <InteractiveCharts userRole={userRole} />
    
    {/* Quick Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <QuickStatCard
        title="Performance Score"
        value="94.2%"
        change={2.1}
        icon={<Target className="h-4 w-4" />}
        description="Overall performance rating"
      />
      <QuickStatCard
        title="Efficiency Rate"
        value="87.5%"
        change={-1.2}
        icon={<Zap className="h-4 w-4" />}
        description="Operational efficiency metric"
      />
      <QuickStatCard
        title="User Satisfaction"
        value="4.8/5"
        change={0.3}
        icon={<Star className="h-4 w-4" />}
        description="Average user rating"
      />
    </div>

    {/* Recent Activity */}
    <RecentActivityCard userRole={userRole} />
  </div>
)

// Performance Tab Component
const PerformanceTab: React.FC<TabProps> = ({ userRole }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getPerformanceMetrics(userRole).map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <span className="text-sm">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{metric.value}</span>
                  <Badge variant={metric.status === 'good' ? 'default' : 'destructive'}>
                    {metric.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Performance changes over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Performance trend chart would be rendered here
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Performance Insights */}
    <PerformanceInsightsCard userRole={userRole} />
  </div>
)

// Trends Tab Component
const TrendsTab: React.FC<TabProps> = ({ userRole }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trend Analysis
          </CardTitle>
          <CardDescription>
            Identify patterns and trends in your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getTrendAnalysis(userRole).map((trend, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2",
                  trend.type === 'positive' ? 'bg-green-500' :
                  trend.type === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                )} />
                <div>
                  <div className="font-medium text-sm">{trend.title}</div>
                  <div className="text-xs text-muted-foreground">{trend.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seasonal Patterns
          </CardTitle>
          <CardDescription>
            Recurring patterns and seasonality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Seasonal pattern visualization would be rendered here
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Predictive Analytics */}
    <PredictiveAnalyticsCard userRole={userRole} />
  </div>
)

// Insights Tab Component
const InsightsTab: React.FC<TabProps> = ({ userRole }) => (
  <div className="space-y-6">
    {/* AI-Generated Insights */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          AI-Generated Insights
        </CardTitle>
        <CardDescription>
          Intelligent analysis and recommendations based on your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {getAIInsights(userRole).map((insight, index) => (
            <div key={index} className="border-l-4 border-primary pl-4">
              <div className="font-medium text-sm">{insight.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{insight.description}</div>
              {insight.action && (
                <Button variant="outline" size="sm" className="mt-2">
                  {insight.action}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Recommendations */}
    <RecommendationsCard userRole={userRole} />

    {/* Alerts and Notifications */}
    <AlertsCard userRole={userRole} />
  </div>
)

// Supporting Components
const QuickStatCard: React.FC<{
  title: string
  value: string
  change: number
  icon: React.ReactNode
  description: string
}> = ({ title, value, change, icon, description }) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-xl font-bold">{value}</div>
      <div className={cn(
        "text-xs flex items-center gap-1 mt-1",
        change > 0 ? "text-green-600" : "text-red-600"
      )}>
        {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {change > 0 ? '+' : ''}{change}%
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
)

const RecentActivityCard: React.FC<{ userRole: string }> = ({ userRole }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Recent Activity
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {getRecentActivity(userRole).map((activity, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <div className="flex-1">
              <div className="text-sm">{activity.description}</div>
              <div className="text-xs text-muted-foreground">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const PerformanceInsightsCard: React.FC<{ userRole: string }> = ({ userRole }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        Performance Insights
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {getPerformanceInsights(userRole).map((insight, index) => (
          <div key={index} className="p-3 bg-muted/50 rounded-md">
            <div className="font-medium text-sm">{insight.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{insight.description}</div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const PredictiveAnalyticsCard: React.FC<{ userRole: string }> = ({ userRole }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Predictive Analytics
      </CardTitle>
      <CardDescription>
        Forecasts and predictions based on historical data
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {getPredictiveAnalytics(userRole).map((prediction, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <div className="font-medium text-sm">{prediction.metric}</div>
              <div className="text-xs text-muted-foreground">{prediction.timeframe}</div>
            </div>
            <div className="text-right">
              <div className="font-bold">{prediction.prediction}</div>
              <div className={cn(
                "text-xs",
                prediction.confidence > 80 ? "text-green-600" : 
                prediction.confidence > 60 ? "text-yellow-600" : "text-red-600"
              )}>
                {prediction.confidence}% confidence
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const RecommendationsCard: React.FC<{ userRole: string }> = ({ userRole }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        Recommendations
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {getRecommendations(userRole).map((rec, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-md">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
            <div className="flex-1">
              <div className="font-medium text-sm">{rec.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{rec.description}</div>
              {rec.impact && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Impact: {rec.impact}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const AlertsCard: React.FC<{ userRole: string }> = ({ userRole }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Alerts & Notifications
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {getAlerts(userRole).map((alert, index) => (
          <div key={index} className={cn(
            "flex items-start gap-3 p-3 rounded-md",
            alert.severity === 'high' ? 'bg-red-50 border border-red-200' :
            alert.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          )}>
            <AlertTriangle className={cn(
              "h-4 w-4 mt-0.5",
              alert.severity === 'high' ? 'text-red-500' :
              alert.severity === 'medium' ? 'text-yellow-500' :
              'text-blue-500'
            )} />
            <div className="flex-1">
              <div className="font-medium text-sm">{alert.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{alert.description}</div>
              <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// Utility Functions
const getMetricsForRole = (role: string, timeRange: string): AnalyticsMetric[] => {
  const baseMetrics = {
    passenger: [
      {
        id: 'total-rides',
        label: 'Total Rides',
        value: '127',
        change: 12,
        trend: 'up' as const,
        icon: <Car className="h-4 w-4" />,
        description: 'Rides completed this period'
      },
      {
        id: 'total-spent',
        label: 'Total Spent',
        value: '$1,247',
        change: 8,
        trend: 'up' as const,
        icon: <DollarSign className="h-4 w-4" />,
        description: 'Amount spent on rides'
      },
      {
        id: 'avg-rating',
        label: 'Average Rating',
        value: '4.8',
        change: 0.2,
        trend: 'up' as const,
        icon: <Star className="h-4 w-4" />,
        description: 'Your average driver rating'
      },
      {
        id: 'favorite-routes',
        label: 'Favorite Routes',
        value: '8',
        change: 2,
        trend: 'up' as const,
        icon: <MapPin className="h-4 w-4" />,
        description: 'Saved favorite locations'
      },
    ],
    driver: [
      {
        id: 'total-earnings',
        label: 'Total Earnings',
        value: '$3,247',
        change: 15,
        trend: 'up' as const,
        icon: <DollarSign className="h-4 w-4" />,
        description: 'Earnings this period'
      },
      {
        id: 'rides-completed',
        label: 'Rides Completed',
        value: '89',
        change: 7,
        trend: 'up' as const,
        icon: <Car className="h-4 w-4" />,
        description: 'Successfully completed rides'
      },
      {
        id: 'avg-rating',
        label: 'Average Rating',
        value: '4.9',
        change: 0.1,
        trend: 'up' as const,
        icon: <Star className="h-4 w-4" />,
        description: 'Your passenger rating'
      },
      {
        id: 'online-hours',
        label: 'Online Hours',
        value: '156',
        change: -3,
        trend: 'down' as const,
        icon: <Clock className="h-4 w-4" />,
        description: 'Hours spent online'
      },
    ],
    operator: [
      {
        id: 'active-drivers',
        label: 'Active Drivers',
        value: '234',
        change: 5,
        trend: 'up' as const,
        icon: <Users className="h-4 w-4" />,
        description: 'Currently active drivers'
      },
      {
        id: 'total-rides',
        label: 'Total Rides',
        value: '1,847',
        change: 12,
        trend: 'up' as const,
        icon: <Car className="h-4 w-4" />,
        description: 'Rides completed by fleet'
      },
      {
        id: 'fleet-utilization',
        label: 'Fleet Utilization',
        value: '78%',
        change: 3,
        trend: 'up' as const,
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'Percentage of fleet in use'
      },
      {
        id: 'avg-response-time',
        label: 'Avg Response Time',
        value: '4.2 min',
        change: -8,
        trend: 'up' as const,
        icon: <Clock className="h-4 w-4" />,
        description: 'Average pickup time'
      },
    ],
    admin: [
      {
        id: 'total-revenue',
        label: 'Total Revenue',
        value: '$47,892',
        change: 18,
        trend: 'up' as const,
        icon: <DollarSign className="h-4 w-4" />,
        description: 'Platform revenue this period'
      },
      {
        id: 'active-users',
        label: 'Active Users',
        value: '2,341',
        change: 9,
        trend: 'up' as const,
        icon: <Users className="h-4 w-4" />,
        description: 'Monthly active users'
      },
      {
        id: 'platform-health',
        label: 'Platform Health',
        value: '99.2%',
        change: 0.1,
        trend: 'up' as const,
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'System uptime percentage'
      },
      {
        id: 'customer-satisfaction',
        label: 'Customer Satisfaction',
        value: '4.7',
        change: 0.3,
        trend: 'up' as const,
        icon: <Star className="h-4 w-4" />,
        description: 'Overall platform rating'
      },
    ],
  }

  return baseMetrics[role as keyof typeof baseMetrics] || baseMetrics.passenger
}

const getFiltersForRole = (role: string): AnalyticsFilter[] => {
  const commonFilters = [
    {
      id: 'region',
      label: 'Region',
      value: 'all',
      options: [
        { label: 'All Regions', value: 'all' },
        { label: 'North', value: 'north' },
        { label: 'South', value: 'south' },
        { label: 'East', value: 'east' },
        { label: 'West', value: 'west' },
      ],
    },
  ]

  const roleFilters = {
    operator: [
      ...commonFilters,
      {
        id: 'vehicle-type',
        label: 'Vehicle Type',
        value: 'all',
        options: [
          { label: 'All Types', value: 'all' },
          { label: 'Sedan', value: 'sedan' },
          { label: 'SUV', value: 'suv' },
          { label: 'Premium', value: 'premium' },
        ],
      },
    ],
    admin: [
      ...commonFilters,
      {
        id: 'user-type',
        label: 'User Type',
        value: 'all',
        options: [
          { label: 'All Users', value: 'all' },
          { label: 'Passengers', value: 'passengers' },
          { label: 'Drivers', value: 'drivers' },
          { label: 'Operators', value: 'operators' },
        ],
      },
    ],
  }

  return roleFilters[role as keyof typeof roleFilters] || []
}

const getTabsForRole = (role: string) => [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'performance', label: 'Performance', icon: <Target className="h-4 w-4" /> },
  { id: 'trends', label: 'Trends', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'insights', label: 'Insights', icon: <Eye className="h-4 w-4" /> },
]

const getPerformanceMetrics = (_role: string) => [
  { label: 'Response Time', value: '4.2 min', status: 'good', icon: <Clock className="h-4 w-4" /> },
  { label: 'Success Rate', value: '94.2%', status: 'good', icon: <Target className="h-4 w-4" /> },
  { label: 'User Satisfaction', value: '4.8/5', status: 'good', icon: <Star className="h-4 w-4" /> },
  { label: 'Efficiency Score', value: '87%', status: 'warning', icon: <Zap className="h-4 w-4" /> },
]

const getTrendAnalysis = (_role: string) => [
  {
    title: 'Increasing demand during peak hours',
    description: 'Ride requests have increased by 15% during 7-9 AM and 5-7 PM',
    type: 'positive'
  },
  {
    title: 'Seasonal booking patterns detected',
    description: 'Higher booking frequency observed during weekends and holidays',
    type: 'neutral'
  },
  {
    title: 'Driver availability gap in downtown area',
    description: 'Response times are 20% higher in the downtown region',
    type: 'negative'
  },
]

const getAIInsights = (_role: string) => [
  {
    title: 'Optimize peak hour pricing',
    description: 'Implementing dynamic pricing during peak hours could increase revenue by 12%',
    action: 'View Recommendations'
  },
  {
    title: 'Driver retention opportunity',
    description: 'Drivers with ratings above 4.8 are 30% more likely to stay active',
    action: 'Implement Program'
  },
  {
    title: 'Route optimization potential',
    description: 'AI-powered route optimization could reduce average trip time by 8%',
    action: 'Enable Feature'
  },
]

const getRecentActivity = (_role: string) => [
  { description: 'New driver onboarded', time: '2 hours ago' },
  { description: 'Peak demand alert triggered', time: '4 hours ago' },
  { description: 'Weekly report generated', time: '1 day ago' },
  { description: 'System maintenance completed', time: '2 days ago' },
]

const getPerformanceInsights = (_role: string) => [
  {
    title: 'Peak Performance Hours',
    description: 'Your best performance is typically between 10 AM - 2 PM with 95% success rate'
  },
  {
    title: 'Improvement Opportunity',
    description: 'Response time could be improved by 15% with better route planning'
  },
]

const getPredictiveAnalytics = (_role: string) => [
  { metric: 'Next Week Revenue', prediction: '$52,000', timeframe: '7 days', confidence: 85 },
  { metric: 'Driver Demand', prediction: '+12%', timeframe: '30 days', confidence: 78 },
  { metric: 'User Growth', prediction: '2,450 users', timeframe: '30 days', confidence: 92 },
]

const getRecommendations = (_role: string) => [
  {
    title: 'Increase driver incentives during peak hours',
    description: 'Offering 20% bonus during rush hours could improve availability',
    impact: 'High'
  },
  {
    title: 'Implement loyalty program for frequent riders',
    description: 'Reward system could increase customer retention by 25%',
    impact: 'Medium'
  },
]

const getAlerts = (_role: string) => [
  {
    title: 'High demand detected',
    description: 'Current demand is 40% above average for this time',
    severity: 'high' as const,
    time: '5 minutes ago'
  },
  {
    title: 'Driver availability low in downtown',
    description: 'Only 3 drivers available in high-demand area',
    severity: 'medium' as const,
    time: '15 minutes ago'
  },
]

export default AnalyticsDashboard