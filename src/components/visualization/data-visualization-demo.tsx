import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3,
  LineChart,
  PieChart,
  Map,
  TrendingUp,
  Eye,
  Download,
  Settings,
  Zap,
  Target
} from "lucide-react"
import { InteractiveCharts } from "@/components/charts/interactive-charts"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { InteractiveMaps } from "@/components/maps/interactive-maps"

// Data Visualization Demo Component
export const DataVisualizationDemo: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("charts")
  const [userRole, setUserRole] = React.useState<'passenger' | 'driver' | 'operator' | 'admin'>('admin')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Visualization & Analytics</h1>
          <p className="text-muted-foreground">
            Interactive charts, comprehensive analytics, and real-time maps with advanced filtering and drill-down capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 2 - Data Visualization
          </Badge>
          <RoleSelector userRole={userRole} onRoleChange={setUserRole} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Interactive Charts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="maps" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Interactive Maps
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Features Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <ChartsDemo userRole={userRole} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDemo userRole={userRole} />
        </TabsContent>

        <TabsContent value="maps" className="space-y-6">
          <MapsDemo userRole={userRole} />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <FeaturesOverview />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Role Selector Component
const RoleSelector: React.FC<{
  userRole: string
  onRoleChange: (role: 'passenger' | 'driver' | 'operator' | 'admin') => void
}> = ({ userRole, onRoleChange }) => (
  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
    {(['passenger', 'driver', 'operator', 'admin'] as const).map((role) => (
      <Button
        key={role}
        variant={userRole === role ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onRoleChange(role)}
        className="capitalize"
      >
        {role}
      </Button>
    ))}
  </div>
)

// Charts Demo Component
const ChartsDemo: React.FC<{ userRole: string }> = ({ userRole }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Interactive Charts System
        </CardTitle>
        <CardDescription>
          Real-time charts with interactive features, data export, and responsive design
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InteractiveCharts userRole={userRole} />
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <FeatureHighlight
        icon={<LineChart className="h-5 w-5" />}
        title="Real-time Updates"
        description="Charts automatically refresh with live data from WebSocket connections"
        features={[
          "Live data streaming",
          "Configurable refresh intervals",
          "Optimistic UI updates",
          "Connection status indicators"
        ]}
      />
      <FeatureHighlight
        icon={<PieChart className="h-5 w-5" />}
        title="Interactive Elements"
        description="Hover, zoom, and click interactions for detailed data exploration"
        features={[
          "Hover tooltips with details",
          "Zoom and pan functionality",
          "Click-through drill-downs",
          "Data point selection"
        ]}
      />
      <FeatureHighlight
        icon={<Download className="h-5 w-5" />}
        title="Export Capabilities"
        description="Export charts and data in multiple formats for reporting"
        features={[
          "PNG/SVG image export",
          "CSV/Excel data export",
          "PDF report generation",
          "Scheduled exports"
        ]}
      />
    </div>
  </div>
)

// Analytics Demo Component
const AnalyticsDemo: React.FC<{ userRole: string }> = ({ userRole }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Advanced Analytics Dashboard
        </CardTitle>
        <CardDescription>
          Comprehensive business intelligence with AI-powered insights and predictive analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnalyticsDashboard userRole={userRole} />
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analytics Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnalyticsFeature
              title="AI-Powered Insights"
              description="Machine learning algorithms analyze patterns and provide actionable recommendations"
            />
            <AnalyticsFeature
              title="Predictive Analytics"
              description="Forecast trends and predict future performance based on historical data"
            />
            <AnalyticsFeature
              title="Custom Dashboards"
              description="Role-based dashboards with customizable widgets and layouts"
            />
            <AnalyticsFeature
              title="Real-time Monitoring"
              description="Live performance tracking with automated alerts and notifications"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <BIMetric
              label="Revenue Growth"
              value="+18.5%"
              trend="up"
              description="Month-over-month revenue increase"
            />
            <BIMetric
              label="User Engagement"
              value="94.2%"
              trend="up"
              description="Active user retention rate"
            />
            <BIMetric
              label="Operational Efficiency"
              value="87.3%"
              trend="stable"
              description="Fleet utilization percentage"
            />
            <BIMetric
              label="Customer Satisfaction"
              value="4.8/5"
              trend="up"
              description="Average customer rating"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

// Maps Demo Component
const MapsDemo: React.FC<{ userRole: string }> = ({ userRole }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Interactive Maps with Clustering
        </CardTitle>
        <CardDescription>
          Real-time location tracking with advanced filtering, clustering, and heatmap visualization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InteractiveMaps userRole={userRole} />
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MapFeature
        title="Smart Clustering"
        description="Automatically groups nearby locations based on zoom level and density"
        features={[
          "Dynamic cluster sizing",
          "Zoom-based clustering",
          "Performance optimized",
          "Custom cluster styles"
        ]}
      />
      <MapFeature
        title="Advanced Filtering"
        description="Filter map data by multiple criteria with real-time updates"
        features={[
          "Multi-criteria filtering",
          "Real-time filter updates",
          "Saved filter presets",
          "Custom filter logic"
        ]}
      />
      <MapFeature
        title="Layer Management"
        description="Toggle different data layers for comprehensive visualization"
        features={[
          "Heatmap overlays",
          "Route visualization",
          "Service zone display",
          "Custom layer support"
        ]}
      />
    </div>
  </div>
)

// Features Overview Component
const FeaturesOverview: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Data Visualization Features
        </CardTitle>
        <CardDescription>
          Comprehensive overview of all visualization and analytics capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCategory
            title="Interactive Charts"
            icon={<BarChart3 className="h-6 w-6" />}
            features={[
              "Line, Bar, Pie, Area charts",
              "Real-time data updates",
              "Interactive tooltips",
              "Zoom and pan controls",
              "Data export options",
              "Responsive design"
            ]}
          />
          
          <FeatureCategory
            title="Analytics Dashboard"
            icon={<TrendingUp className="h-6 w-6" />}
            features={[
              "AI-powered insights",
              "Predictive analytics",
              "Custom KPI tracking",
              "Automated reporting",
              "Trend analysis",
              "Performance monitoring"
            ]}
          />
          
          <FeatureCategory
            title="Interactive Maps"
            icon={<Map className="h-6 w-6" />}
            features={[
              "Real-time location tracking",
              "Smart clustering",
              "Heatmap visualization",
              "Advanced filtering",
              "Layer management",
              "Route optimization"
            ]}
          />
          
          <FeatureCategory
            title="Data Export"
            icon={<Download className="h-6 w-6" />}
            features={[
              "Multiple export formats",
              "Scheduled exports",
              "Custom report templates",
              "Automated delivery",
              "Data transformation",
              "API integration"
            ]}
          />
          
          <FeatureCategory
            title="Performance"
            icon={<Zap className="h-6 w-6" />}
            features={[
              "Optimized rendering",
              "Efficient data loading",
              "Caching strategies",
              "Lazy loading",
              "Memory management",
              "Responsive updates"
            ]}
          />
          
          <FeatureCategory
            title="Customization"
            icon={<Settings className="h-6 w-6" />}
            features={[
              "Configurable layouts",
              "Custom themes",
              "Role-based views",
              "Widget customization",
              "Filter presets",
              "User preferences"
            ]}
          />
        </div>
      </CardContent>
    </Card>

    {/* Implementation Status */}
    <Card>
      <CardHeader>
        <CardTitle>Implementation Status</CardTitle>
        <CardDescription>
          Current progress on data visualization and analytics features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ImplementationStatus
            feature="Interactive Charts System"
            status="completed"
            description="Full implementation with real-time updates, export capabilities, and responsive design"
          />
          <ImplementationStatus
            feature="Analytics Dashboard"
            status="completed"
            description="Comprehensive analytics with AI insights, predictive analytics, and custom dashboards"
          />
          <ImplementationStatus
            feature="Interactive Maps"
            status="completed"
            description="Real-time maps with clustering, filtering, and layer management"
          />
          <ImplementationStatus
            feature="Data Export System"
            status="completed"
            description="Multi-format export capabilities with scheduling and automation"
          />
        </div>
      </CardContent>
    </Card>
  </div>
)

// Supporting Components
const FeatureHighlight: React.FC<{
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
}> = ({ icon, title, description, features }) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-1">
        {features.map((feature, index) => (
          <li key={index} className="text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)

const AnalyticsFeature: React.FC<{
  title: string
  description: string
}> = ({ title, description }) => (
  <div className="flex items-start gap-3">
    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
    <div>
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
)

const BIMetric: React.FC<{
  label: string
  value: string
  trend: 'up' | 'down' | 'stable'
  description: string
}> = ({ label, value, trend, description }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
    <div className="text-right">
      <div className="font-bold">{value}</div>
      <div className={`text-xs ${
        trend === 'up' ? 'text-green-600' : 
        trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
      }`}>
        {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
      </div>
    </div>
  </div>
)

const MapFeature: React.FC<{
  title: string
  description: string
  features: string[]
}> = ({ title, description, features }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-1">
        {features.map((feature, index) => (
          <li key={index} className="text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)

const FeatureCategory: React.FC<{
  title: string
  icon: React.ReactNode
  features: string[]
}> = ({ title, icon, features }) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)

const ImplementationStatus: React.FC<{
  feature: string
  status: 'completed' | 'in-progress' | 'planned'
  description: string
}> = ({ feature, status, description }) => (
  <div className="flex items-start gap-3">
    <div className={`w-3 h-3 rounded-full mt-1 ${
      status === 'completed' ? 'bg-green-500' :
      status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-300'
    }`} />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm">{feature}</h4>
        <Badge variant={
          status === 'completed' ? 'default' :
          status === 'in-progress' ? 'secondary' : 'outline'
        } className="text-xs">
          {status === 'completed' ? 'Completed' :
           status === 'in-progress' ? 'In Progress' : 'Planned'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
)

export default DataVisualizationDemo