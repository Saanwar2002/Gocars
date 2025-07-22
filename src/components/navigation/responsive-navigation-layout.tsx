import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  User,
  Bell,
  Search
} from "lucide-react"
import { EnhancedNavigation } from "./enhanced-navigation"
import { ContextualNavigation, useNavigationContext } from "./contextual-navigation"

// Responsive Navigation Layout Types
interface ResponsiveNavigationLayoutProps {
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  currentPath: string
  onNavigate: (path: string) => void
  children: React.ReactNode
  className?: string
}

// Main Responsive Navigation Layout Component
export const ResponsiveNavigationLayout: React.FC<ResponsiveNavigationLayoutProps> = ({
  userRole,
  currentPath,
  onNavigate,
  children,
  className,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  
  const navigationContext = useNavigationContext(userRole, currentPath)

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile sidebar when navigating
  const handleNavigate = (path: string) => {
    onNavigate(path)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleAction = (actionId: string) => {
    console.log('Navigation action:', actionId)
    // Handle contextual actions
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full bg-background border-r transition-all duration-300",
        isMobile ? (
          sidebarOpen ? "w-80 translate-x-0" : "w-80 -translate-x-full"
        ) : (
          sidebarCollapsed ? "w-16" : "w-80"
        )
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">G</span>
                </div>
                <span className="font-bold text-lg">GoCars</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {!sidebarCollapsed && (
              <div className="p-4 space-y-4">
                {/* Contextual Navigation */}
                <ContextualNavigation
                  context={navigationContext}
                  onNavigate={handleNavigate}
                  onAction={handleAction}
                />
                
                {/* Quick Stats Card */}
                <QuickStatsCard userRole={userRole} />
              </div>
            )}
            
            {sidebarCollapsed && (
              <div className="p-2 space-y-2">
                <CollapsedSidebarIcons 
                  userRole={userRole}
                  onNavigate={handleNavigate}
                />
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t">
              <SidebarFooter userRole={userRole} />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "transition-all duration-300",
        isMobile ? "ml-0" : (sidebarCollapsed ? "ml-16" : "ml-80")
      )}>
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-background border-b">
          <EnhancedNavigation
            userRole={userRole}
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
          
          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <MobileBottomNavigation
            userRole={userRole}
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </div>
  )
}

// Quick Stats Card Component
interface QuickStatsCardProps {
  userRole: string
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ userRole }) => {
  const getStatsForRole = () => {
    switch (userRole) {
      case 'passenger':
        return [
          { label: 'Total Rides', value: '127' },
          { label: 'This Month', value: '8' },
        ]
      case 'driver':
        return [
          { label: 'Today\'s Earnings', value: '$247' },
          { label: 'Rides Completed', value: '23' },
        ]
      case 'operator':
        return [
          { label: 'Active Drivers', value: '156' },
          { label: 'Pending Requests', value: '12' },
        ]
      case 'admin':
        return [
          { label: 'Total Revenue', value: '$12.8K' },
          { label: 'Active Users', value: '2.3K' },
        ]
      default:
        return []
    }
  }

  const stats = getStatsForRole()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Quick Stats</h3>
          <div className="space-y-2">
            {stats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Collapsed Sidebar Icons Component
interface CollapsedSidebarIconsProps {
  userRole: string
  onNavigate: (path: string) => void
}

const CollapsedSidebarIcons: React.FC<CollapsedSidebarIconsProps> = ({
  userRole,
  onNavigate,
}) => {
  const getIconsForRole = () => {
    const baseIcons = [
      { icon: <Home className="h-4 w-4" />, href: '/dashboard', label: 'Dashboard' },
      { icon: <Bell className="h-4 w-4" />, href: '/notifications', label: 'Notifications' },
      { icon: <Settings className="h-4 w-4" />, href: '/settings', label: 'Settings' },
    ]

    switch (userRole) {
      case 'passenger':
        return [
          ...baseIcons,
          { icon: <Search className="h-4 w-4" />, href: '/rides/book', label: 'Book Ride' },
        ]
      case 'driver':
        return [
          ...baseIcons,
          { icon: <User className="h-4 w-4" />, href: '/profile', label: 'Profile' },
        ]
      default:
        return baseIcons
    }
  }

  const icons = getIconsForRole()

  return (
    <div className="space-y-2">
      {icons.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          size="icon"
          className="w-12 h-12"
          onClick={() => onNavigate(item.href)}
          title={item.label}
        >
          {item.icon}
        </Button>
      ))}
    </div>
  )
}

// Sidebar Footer Component
interface SidebarFooterProps {
  userRole: string
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ userRole }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
        <User className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)} User
        </div>
        <div className="text-xs text-muted-foreground">
          {userRole === 'driver' ? 'Online' : 'Active'}
        </div>
      </div>
    </div>
    
    <div className="text-xs text-center text-muted-foreground">
      GoCars v2.0 • Enhanced Dashboard
    </div>
  </div>
)

// Mobile Bottom Navigation Component
interface MobileBottomNavigationProps {
  userRole: string
  currentPath: string
  onNavigate: (path: string) => void
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  userRole,
  currentPath,
  onNavigate,
}) => {
  const getBottomNavItems = () => {
    const baseItems = [
      { icon: <Home className="h-4 w-4" />, href: '/dashboard', label: 'Home' },
      { icon: <Bell className="h-4 w-4" />, href: '/notifications', label: 'Alerts' },
      { icon: <User className="h-4 w-4" />, href: '/profile', label: 'Profile' },
    ]

    switch (userRole) {
      case 'passenger':
        return [
          baseItems[0],
          { icon: <Search className="h-4 w-4" />, href: '/rides/book', label: 'Book' },
          baseItems[1],
          baseItems[2],
        ]
      case 'driver':
        return [
          baseItems[0],
          { icon: <Search className="h-4 w-4" />, href: '/rides/requests', label: 'Requests' },
          baseItems[1],
          baseItems[2],
        ]
      default:
        return baseItems
    }
  }

  const items = getBottomNavItems()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-30">
      <div className="grid grid-cols-4 gap-1 p-2">
        {items.map((item, index) => (
          <Button
            key={index}
            variant={currentPath === item.href ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => onNavigate(item.href)}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export default ResponsiveNavigationLayout