import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  Clock,
  MapPin,
  Bell,
  Settings,
  RefreshCw,
  Edit3,
  Save,
  Plus
} from "lucide-react"
import { EnhancedDashboard } from "./enhanced-dashboard"

// Demo Dashboard Component
export const DashboardDemo: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("passenger")
  const [demoMode, setDemoMode] = React.useState<'enhanced' | 'legacy'>('enhanced')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GoCars Dashboard System</h1>
          <p className="text-muted-foreground">
            Experience the new configurable dashboard system with real-time updates and drag-and-drop customization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 2 - Dashboard Enhancement
          </Badge>
          <Button
            variant={demoMode === 'enhanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDemoMode('enhanced')}
          >
            Enhanced Dashboard
          </Button>
          <Button
            variant={demoMode === 'legacy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDemoMode('legacy')}
          >
            Legacy View
          </Button>
        </div>
      </div>

      {demoMode === 'enhanced' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="passenger">Passenger</TabsTrigger>
            <TabsTrigger value="driver">Driver</TabsTrigger>
            <TabsTrigger value="operator">Operator</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="passenger" className="space-y-4">
            <EnhancedDashboard 
              userRole="passenger"
              onWidgetUpdate={(widgets) => console.log('Passenger widgets updated:', widgets)}
            />
          </TabsContent>

          <TabsContent value="driver" className="space-y-4">
            <EnhancedDashboard 
              userRole="driver"
              onWidgetUpdate={(widgets) => console.log('Driver widgets updated:', widgets)}
            />
          </TabsContent>

          <TabsContent value="operator" className="space-y-4">
            <EnhancedDashboard 
              userRole="operator"
              onWidgetUpdate={(widgets) => console.log('Operator widgets updated:', widgets)}
            />
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <EnhancedDashboard 
              userRole="admin"
              onWidgetUpdate={(widgets) => console.log('Admin widgets updated:', widgets)}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <LegacyDashboardView activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Feature Showcase */}
      <FeatureShowcase />
    </div>
  )
}

// Legacy Dashboard View for Comparison
const LegacyDashboardView: React.FC<{
  activeTab: string
  setActiveTab: (tab: string) => void
}> = ({ activeTab, setActiveTab }) => (
  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="passenger">Passenger</TabsTrigger>
      <TabsTrigger value="driver">Driver</TabsTrigger>
      <TabsTrigger value="operator">Operator</TabsTrigger>
      <TabsTrigger value="admin">Admin</TabsTrigger>
    </TabsList>

    <TabsContent value="passenger" className="space-y-4">
      <PassengerDashboard />
    </TabsContent>

    <TabsContent value="driver" className="space-y-4">
      <DriverDashboard />
    </TabsContent>

    <TabsContent value="operator" className="space-y-4">
      <OperatorDashboard />
    </TabsContent>

    <TabsContent value="admin" className="space-y-4">
      <AdminDashboard />
    </TabsContent>
  </Tabs>
)

// Legacy Dashboard Components (simplified versions)
const PassengerDashboard: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <MetricCard title="Total Rides" value="127" change="+12%" icon={<Car className="h-4 w-4" />} />
    <MetricCard title="Favorite Locations" value="8" icon={<MapPin className="h-4 w-4" />} />
    <MetricCard title="Average Rating" value="4.8" icon={<TrendingUp className="h-4 w-4" />} />
    
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Recent Rides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Downtown to Airport</span>
            <Badge variant="outline">Completed</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Home to Office</span>
            <Badge variant="outline">Completed</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Mall to Restaurant</span>
            <Badge variant="outline">Completed</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const DriverDashboard: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <MetricCard title="Today's Earnings" value="$247" change="+18%" icon={<DollarSign className="h-4 w-4" />} />
    <MetricCard title="Rides Completed" value="23" change="+5%" icon={<Car className="h-4 w-4" />} />
    <MetricCard title="Online Hours" value="8.5" icon={<Clock className="h-4 w-4" />} />
    
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Active Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Pickup at Main St</span>
            <Button size="sm">Accept</Button>
          </div>
          <div className="flex justify-between text-sm">
            <span>Airport Run - Premium</span>
            <Button size="sm">Accept</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const OperatorDashboard: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <MetricCard title="Active Drivers" value="156" change="+8%" icon={<Users className="h-4 w-4" />} />
    <MetricCard title="Pending Requests" value="12" icon={<Bell className="h-4 w-4" />} />
    <MetricCard title="Fleet Utilization" value="78%" change="+3%" icon={<Activity className="h-4 w-4" />} />
    
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Dispatch Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>High Priority - Downtown</span>
            <Badge variant="destructive">Urgent</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Airport Pickup</span>
            <Badge variant="secondary">Assigned</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Corporate Booking</span>
            <Badge variant="outline">Pending</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const AdminDashboard: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <MetricCard title="Total Revenue" value="$12,847" change="+15%" icon={<DollarSign className="h-4 w-4" />} />
    <MetricCard title="Active Users" value="2,341" change="+7%" icon={<Users className="h-4 w-4" />} />
    <MetricCard title="System Health" value="99.2%" icon={<Activity className="h-4 w-4" />} />
    
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>New driver registration</span>
            <span className="text-muted-foreground">2 min ago</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Payment processed</span>
            <span className="text-muted-foreground">5 min ago</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>System backup completed</span>
            <span className="text-muted-foreground">1 hour ago</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

// Metric Card Component
const MetricCard: React.FC<{
  title: string
  value: string
  change?: string
  icon: React.ReactNode
}> = ({ title, value, change, icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className="text-xs text-muted-foreground">
          {change} from last period
        </p>
      )}
    </CardContent>
  </Card>
)

// Feature Showcase Component
const FeatureShowcase: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Enhanced Dashboard Features
      </CardTitle>
      <CardDescription>
        New capabilities in the GoCars dashboard system
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          icon={<Edit3 className="h-5 w-5" />}
          title="Drag & Drop Customization"
          description="Rearrange widgets by dragging them to new positions. Changes are saved automatically."
        />
        <FeatureCard
          icon={<RefreshCw className="h-5 w-5" />}
          title="Real-time Data Updates"
          description="Widgets automatically refresh with live data. Configure refresh intervals per widget."
        />
        <FeatureCard
          icon={<Plus className="h-5 w-5" />}
          title="Widget Templates"
          description="Add new widgets from templates. Choose from metrics, charts, lists, maps, and actions."
        />
        <FeatureCard
          icon={<Settings className="h-5 w-5" />}
          title="Advanced Configuration"
          description="Customize widget appearance, behavior, permissions, and data refresh settings."
        />
        <FeatureCard
          icon={<Save className="h-5 w-5" />}
          title="Layout Persistence"
          description="Dashboard layouts are saved per user role. Export and import configurations."
        />
        <FeatureCard
          icon={<Activity className="h-5 w-5" />}
          title="Performance Optimized"
          description="Efficient caching, data synchronization, and optimistic UI updates for smooth experience."
        />
      </div>
    </CardContent>
  </Card>
)

const FeatureCard: React.FC<{
  icon: React.ReactNode
  title: string
  description: string
}> = ({ icon, title, description }) => (
  <div className="flex gap-3 p-3 border rounded-lg">
    <div className="text-primary">{icon}</div>
    <div>
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
)

export default DashboardDemo