import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Navigation,
  Smartphone,
  Monitor,
  Tablet,
  Search,
  Menu,
  ArrowRight,
  Zap,
  Star,
  Settings
} from "lucide-react"
import { ResponsiveNavigationLayout } from "./responsive-navigation-layout"

// Navigation Demo Component
export const NavigationDemo: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("passenger")
  const [currentPath, setCurrentPath] = React.useState("/dashboard")
  const [demoMode, setDemoMode] = React.useState<'responsive' | 'features'>('responsive')

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
    console.log('Navigating to:', path)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Navigation System</h1>
          <p className="text-muted-foreground">
            Experience the new responsive navigation with contextual actions and intelligent suggestions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 2 - Navigation Enhancement
          </Badge>
          <Button
            variant={demoMode === 'responsive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDemoMode('responsive')}
          >
            Live Demo
          </Button>
          <Button
            variant={demoMode === 'features' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDemoMode('features')}
          >
            Features
          </Button>
        </div>
      </div>

      {demoMode === 'responsive' ? (
        <div className="space-y-4">
          {/* Role Selector */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="passenger">Passenger</TabsTrigger>
              <TabsTrigger value="driver">Driver</TabsTrigger>
              <TabsTrigger value="operator">Operator</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="passenger" className="mt-4">
              <NavigationDemoLayout
                userRole="passenger"
                currentPath={currentPath}
                onNavigate={handleNavigate}
              />
            </TabsContent>

            <TabsContent value="driver" className="mt-4">
              <NavigationDemoLayout
                userRole="driver"
                currentPath={currentPath}
                onNavigate={handleNavigate}
              />
            </TabsContent>

            <TabsContent value="operator" className="mt-4">
              <NavigationDemoLayout
                userRole="operator"
                currentPath={currentPath}
                onNavigate={handleNavigate}
              />
            </TabsContent>

            <TabsContent value="admin" className="mt-4">
              <NavigationDemoLayout
                userRole="admin"
                currentPath={currentPath}
                onNavigate={handleNavigate}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <NavigationFeaturesShowcase />
      )}
    </div>
  )
}

// Navigation Demo Layout Component
interface NavigationDemoLayoutProps {
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  currentPath: string
  onNavigate: (path: string) => void
}

const NavigationDemoLayout: React.FC<NavigationDemoLayoutProps> = ({
  userRole,
  currentPath,
  onNavigate,
}) => (
  <div className="border rounded-lg overflow-hidden bg-background min-h-[600px]">
    <ResponsiveNavigationLayout
      userRole={userRole}
      currentPath={currentPath}
      onNavigate={onNavigate}
    >
      <DemoPageContent userRole={userRole} currentPath={currentPath} />
    </ResponsiveNavigationLayout>
  </div>
)

// Demo Page Content Component
interface DemoPageContentProps {
  userRole: string
  currentPath: string
}

const DemoPageContent: React.FC<DemoPageContentProps> = ({ userRole, currentPath }) => {
  const getPageTitle = () => {
    const pathSegments = currentPath.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1] || 'dashboard'
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace('-', ' ')
  }

  const getPageDescription = () => {
    switch (currentPath) {
      case '/dashboard':
        return `Welcome to your ${userRole} dashboard. Here you can see an overview of your activities and quick actions.`
      case '/rides/book':
        return 'Book a new ride by entering your pickup and destination locations.'
      case '/rides/history':
        return 'View your past rides, receipts, and trip details.'
      case '/fleet/dispatch':
        return 'Manage ride assignments and dispatch queue in real-time.'
      case '/analytics':
        return 'View comprehensive analytics and business intelligence reports.'
      default:
        return `This is the ${getPageTitle()} page for ${userRole} users.`
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{getPageTitle()}</h2>
        <p className="text-muted-foreground mt-2">{getPageDescription()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Path:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">{currentPath}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge variant="outline">{userRole}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Navigation Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Responsive Design</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Contextual Actions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Breadcrumb Navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Global Search</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getRoleSpecificActions(userRole).map((action, index) => (
                <Button key={index} variant="outline" size="sm" className="w-full justify-start">
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Navigation Demo Instructions</CardTitle>
          <CardDescription>
            Try these features to experience the enhanced navigation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Desktop Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Click the sidebar collapse button to minimize the sidebar</li>
                <li>• Use the global search in the top navigation</li>
                <li>• Hover over navigation items to see descriptions</li>
                <li>• Notice the breadcrumb navigation for complex workflows</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Mobile Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Resize your browser to see mobile layout</li>
                <li>• Use the hamburger menu to access the sidebar</li>
                <li>• Bottom navigation for quick access</li>
                <li>• Contextual actions adapt to screen size</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Navigation Features Showcase Component
const NavigationFeaturesShowcase: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Enhanced Navigation Features
        </CardTitle>
        <CardDescription>
          Comprehensive navigation system with responsive design and contextual intelligence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Monitor className="h-6 w-6" />}
            title="Responsive Design"
            description="Adapts seamlessly to desktop, tablet, and mobile devices with optimized layouts for each screen size."
            features={[
              "Collapsible sidebar for desktop",
              "Mobile-first bottom navigation",
              "Touch-optimized interactions",
              "Adaptive menu structures"
            ]}
          />
          
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Contextual Actions"
            description="Intelligent quick actions that adapt based on user role, current page, and user state."
            features={[
              "Role-based action suggestions",
              "Page-specific quick actions",
              "Real-time status indicators",
              "Smart recommendations"
            ]}
          />
          
          <FeatureCard
            icon={<Search className="h-6 w-6" />}
            title="Global Search"
            description="Powerful search functionality that finds navigation items, pages, and actions across the platform."
            features={[
              "Instant search results",
              "Keyboard shortcuts",
              "Search suggestions",
              "Recent searches"
            ]}
          />
          
          <FeatureCard
            icon={<ArrowRight className="h-6 w-6" />}
            title="Breadcrumb Navigation"
            description="Clear navigation hierarchy that shows users where they are and provides easy navigation back."
            features={[
              "Hierarchical path display",
              "Clickable navigation steps",
              "Context-aware breadcrumbs",
              "Mobile-optimized display"
            ]}
          />
          
          <FeatureCard
            icon={<Star className="h-6 w-6" />}
            title="Smart Suggestions"
            description="AI-powered navigation suggestions based on user behavior, role, and current context."
            features={[
              "Personalized recommendations",
              "Usage pattern analysis",
              "Context-aware suggestions",
              "Learning user preferences"
            ]}
          />
          
          <FeatureCard
            icon={<Settings className="h-6 w-6" />}
            title="Customizable Layout"
            description="Users can customize their navigation experience with collapsible sections and personalized shortcuts."
            features={[
              "Collapsible sidebar sections",
              "Custom quick actions",
              "Personalized menu order",
              "Theme customization"
            ]}
          />
        </div>
      </CardContent>
    </Card>

    {/* Device Compatibility */}
    <Card>
      <CardHeader>
        <CardTitle>Device Compatibility</CardTitle>
        <CardDescription>
          Optimized navigation experience across all devices and screen sizes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DeviceCard
            icon={<Monitor className="h-8 w-8" />}
            title="Desktop"
            description="Full-featured navigation with sidebar, breadcrumbs, and global search"
            features={[
              "Collapsible sidebar",
              "Hover interactions",
              "Keyboard shortcuts",
              "Multi-level menus"
            ]}
          />
          
          <DeviceCard
            icon={<Tablet className="h-8 w-8" />}
            title="Tablet"
            description="Adaptive layout that works great in both portrait and landscape modes"
            features={[
              "Touch-optimized controls",
              "Adaptive grid layouts",
              "Gesture navigation",
              "Orientation support"
            ]}
          />
          
          <DeviceCard
            icon={<Smartphone className="h-8 w-8" />}
            title="Mobile"
            description="Mobile-first design with bottom navigation and slide-out menu"
            features={[
              "Bottom tab navigation",
              "Slide-out sidebar",
              "Touch gestures",
              "Thumb-friendly design"
            ]}
          />
        </div>
      </CardContent>
    </Card>
  </div>
)

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, features }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
    <ul className="space-y-1">
      {features.map((feature, index) => (
        <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
          <div className="w-1 h-1 bg-primary rounded-full"></div>
          {feature}
        </li>
      ))}
    </ul>
  </div>
)

// Device Card Component
interface DeviceCardProps {
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
}

const DeviceCard: React.FC<DeviceCardProps> = ({ icon, title, description, features }) => (
  <Card>
    <CardHeader className="text-center">
      <div className="mx-auto text-primary mb-2">{icon}</div>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription className="text-sm">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)

// Utility Functions
const getRoleSpecificActions = (role: string) => {
  const actions = {
    passenger: [
      { icon: <Search className="h-4 w-4 mr-2" />, label: 'Book Ride' },
      { icon: <Star className="h-4 w-4 mr-2" />, label: 'Favorites' },
      { icon: <Settings className="h-4 w-4 mr-2" />, label: 'Settings' },
    ],
    driver: [
      { icon: <Zap className="h-4 w-4 mr-2" />, label: 'Go Online' },
      { icon: <Star className="h-4 w-4 mr-2" />, label: 'Earnings' },
      { icon: <Settings className="h-4 w-4 mr-2" />, label: 'Profile' },
    ],
    operator: [
      { icon: <Monitor className="h-4 w-4 mr-2" />, label: 'Dispatch' },
      { icon: <Star className="h-4 w-4 mr-2" />, label: 'Analytics' },
      { icon: <Settings className="h-4 w-4 mr-2" />, label: 'Fleet' },
    ],
    admin: [
      { icon: <Monitor className="h-4 w-4 mr-2" />, label: 'System Health' },
      { icon: <Star className="h-4 w-4 mr-2" />, label: 'Reports' },
      { icon: <Settings className="h-4 w-4 mr-2" />, label: 'Admin Panel' },
    ],
  }

  return actions[role as keyof typeof actions] || []
}

export default NavigationDemo