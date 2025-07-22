import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { 
  Home,
  Car,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  MapPin,
  CreditCard,
  Shield,
  HelpCircle,
  User,
  LogOut
} from "lucide-react"

// Navigation Types
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
  children?: NavigationItem[]
  roles: string[]
  description?: string
  isActive?: boolean
  isNew?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

interface EnhancedNavigationProps {
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  currentPath: string
  onNavigate: (path: string) => void
  className?: string
}

// Enhanced Navigation Component
export const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  userRole,
  currentPath,
  onNavigate,
  className,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<NavigationItem[]>([])

  const navigationItems = getNavigationItemsForRole(userRole)
  const breadcrumbs = generateBreadcrumbs(currentPath, navigationItems)

  // Search functionality
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchNavigationItems(navigationItems, searchQuery)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, navigationItems])

  return (
    <div className={cn("bg-background border-b", className)}>
      {/* Main Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">GoCars</span>
          </div>
          
          {/* Desktop Navigation Menu */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.id}>
                    {item.children ? (
                      <>
                        <NavigationMenuTrigger className="h-9">
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="grid gap-3 p-4 w-[400px]">
                            {item.children.map((child) => (
                              <NavigationMenuLink
                                key={child.id}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  child.isActive && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => onNavigate(child.href)}
                              >
                                <div className="flex items-center gap-2">
                                  {child.icon}
                                  <div className="text-sm font-medium leading-none">
                                    {child.label}
                                  </div>
                                  {child.isNew && (
                                    <Badge variant="default" className="text-xs">
                                      New
                                    </Badge>
                                  )}
                                  {child.badge && (
                                    <Badge variant="outline" className="text-xs">
                                      {child.badge}
                                    </Badge>
                                  )}
                                </div>
                                {child.description && (
                                  <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                    {child.description}
                                  </p>
                                )}
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink
                        className={cn(
                          "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                          item.isActive && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => onNavigate(item.href)}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50">
                <div className="p-2">
                  <div className="text-xs text-muted-foreground mb-2">
                    Search Results
                  </div>
                  {searchResults.slice(0, 5).map((result) => (
                    <button
                      key={result.id}
                      className="w-full text-left p-2 hover:bg-accent rounded-sm flex items-center gap-2"
                      onClick={() => {
                        onNavigate(result.href)
                        setSearchQuery("")
                      }}
                    >
                      {result.icon}
                      <span className="text-sm">{result.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 1 && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <BreadcrumbNavigation 
            items={breadcrumbs} 
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <MobileNavigationMenu
          items={navigationItems}
          onNavigate={(path) => {
            onNavigate(path)
            setIsMobileMenuOpen(false)
          }}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

// Breadcrumb Navigation Component
interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[]
  onNavigate: (path: string) => void
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  onNavigate,
}) => (
  <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
    {items.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && <ChevronRight className="h-4 w-4" />}
        {item.href && !item.isActive ? (
          <button
            onClick={() => onNavigate(item.href!)}
            className="hover:text-foreground transition-colors"
          >
            {item.label}
          </button>
        ) : (
          <span className={cn(item.isActive && "text-foreground font-medium")}>
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
)

// Mobile Navigation Menu Component
interface MobileNavigationMenuProps {
  items: NavigationItem[]
  onNavigate: (path: string) => void
  onClose: () => void
}

const MobileNavigationMenu: React.FC<MobileNavigationMenuProps> = ({
  items,
  onNavigate,
  onClose,
}) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="md:hidden border-t bg-background">
      <div className="p-4 space-y-2">
        {/* Mobile Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-8" />
        </div>

        {/* Navigation Items */}
        {items.map((item) => (
          <div key={item.id}>
            {item.children ? (
              <div>
                <button
                  className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-md"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedItems.has(item.id) && "rotate-180"
                    )}
                  />
                </button>
                {expandedItems.has(item.id) && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        className={cn(
                          "w-full flex items-center gap-2 p-2 text-left hover:bg-accent rounded-md",
                          child.isActive && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => onNavigate(child.href)}
                      >
                        {child.icon}
                        <span>{child.label}</span>
                        {child.badge && (
                          <Badge variant="outline" className="text-xs">
                            {child.badge}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                className={cn(
                  "w-full flex items-center gap-2 p-2 text-left hover:bg-accent rounded-md",
                  item.isActive && "bg-accent text-accent-foreground"
                )}
                onClick={() => onNavigate(item.href)}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility Functions
const getNavigationItemsForRole = (role: string): NavigationItem[] => {
  const baseItems: Record<string, NavigationItem[]> = {
    passenger: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: <Home className="h-4 w-4" />,
        roles: ['passenger'],
        isActive: true,
      },
      {
        id: 'rides',
        label: 'Rides',
        href: '/rides',
        icon: <Car className="h-4 w-4" />,
        roles: ['passenger'],
        children: [
          {
            id: 'book-ride',
            label: 'Book a Ride',
            href: '/rides/book',
            icon: <MapPin className="h-4 w-4" />,
            roles: ['passenger'],
            description: 'Book a new ride to your destination',
            isNew: true,
          },
          {
            id: 'ride-history',
            label: 'Ride History',
            href: '/rides/history',
            icon: <BarChart3 className="h-4 w-4" />,
            roles: ['passenger'],
            description: 'View your past rides and receipts',
          },
          {
            id: 'scheduled-rides',
            label: 'Scheduled Rides',
            href: '/rides/scheduled',
            icon: <Car className="h-4 w-4" />,
            roles: ['passenger'],
            description: 'Manage your upcoming scheduled rides',
            badge: '2',
          },
        ],
      },
      {
        id: 'payments',
        label: 'Payments',
        href: '/payments',
        icon: <CreditCard className="h-4 w-4" />,
        roles: ['passenger'],
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="h-4 w-4" />,
        roles: ['passenger'],
      },
    ],
    driver: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: <Home className="h-4 w-4" />,
        roles: ['driver'],
        isActive: true,
      },
      {
        id: 'rides',
        label: 'Rides',
        href: '/rides',
        icon: <Car className="h-4 w-4" />,
        roles: ['driver'],
        badge: '5',
        children: [
          {
            id: 'active-rides',
            label: 'Active Rides',
            href: '/rides/active',
            icon: <Car className="h-4 w-4" />,
            roles: ['driver'],
            description: 'Current and pending ride requests',
            badge: '3',
          },
          {
            id: 'ride-history',
            label: 'Ride History',
            href: '/rides/history',
            icon: <BarChart3 className="h-4 w-4" />,
            roles: ['driver'],
            description: 'View completed rides and earnings',
          },
        ],
      },
      {
        id: 'earnings',
        label: 'Earnings',
        href: '/earnings',
        icon: <BarChart3 className="h-4 w-4" />,
        roles: ['driver'],
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="h-4 w-4" />,
        roles: ['driver'],
      },
    ],
    operator: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: <Home className="h-4 w-4" />,
        roles: ['operator'],
        isActive: true,
      },
      {
        id: 'fleet',
        label: 'Fleet Management',
        href: '/fleet',
        icon: <Car className="h-4 w-4" />,
        roles: ['operator'],
        children: [
          {
            id: 'live-tracking',
            label: 'Live Tracking',
            href: '/fleet/tracking',
            icon: <MapPin className="h-4 w-4" />,
            roles: ['operator'],
            description: 'Real-time fleet location and status',
          },
          {
            id: 'driver-management',
            label: 'Driver Management',
            href: '/fleet/drivers',
            icon: <Users className="h-4 w-4" />,
            roles: ['operator'],
            description: 'Manage driver profiles and performance',
            badge: '12',
          },
          {
            id: 'dispatch',
            label: 'Dispatch Center',
            href: '/fleet/dispatch',
            icon: <Bell className="h-4 w-4" />,
            roles: ['operator'],
            description: 'Assign rides and manage dispatch queue',
            badge: '8',
          },
        ],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        roles: ['operator'],
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="h-4 w-4" />,
        roles: ['operator'],
      },
    ],
    admin: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: <Home className="h-4 w-4" />,
        roles: ['admin'],
        isActive: true,
      },
      {
        id: 'system',
        label: 'System Management',
        href: '/system',
        icon: <Settings className="h-4 w-4" />,
        roles: ['admin'],
        children: [
          {
            id: 'users',
            label: 'User Management',
            href: '/system/users',
            icon: <Users className="h-4 w-4" />,
            roles: ['admin'],
            description: 'Manage users, roles, and permissions',
          },
          {
            id: 'security',
            label: 'Security & Compliance',
            href: '/system/security',
            icon: <Shield className="h-4 w-4" />,
            roles: ['admin'],
            description: 'Security settings and compliance monitoring',
          },
          {
            id: 'system-health',
            label: 'System Health',
            href: '/system/health',
            icon: <Activity className="h-4 w-4" />,
            roles: ['admin'],
            description: 'Monitor system performance and health',
            badge: 'Alert',
          },
        ],
      },
      {
        id: 'analytics',
        label: 'Business Analytics',
        href: '/analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        roles: ['admin'],
      },
      {
        id: 'settings',
        label: 'Platform Settings',
        href: '/settings',
        icon: <Settings className="h-4 w-4" />,
        roles: ['admin'],
      },
    ],
  }

  return baseItems[role] || []
}

const generateBreadcrumbs = (currentPath: string, navigationItems: NavigationItem[]): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/dashboard' }]
  
  // Simple breadcrumb generation based on path segments
  const pathSegments = currentPath.split('/').filter(Boolean)
  
  pathSegments.forEach((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/')
    const item = findNavigationItem(navigationItems, path)
    
    if (item) {
      breadcrumbs.push({
        label: item.label,
        href: path,
        isActive: index === pathSegments.length - 1,
      })
    } else {
      // Fallback to segment name
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: path,
        isActive: index === pathSegments.length - 1,
      })
    }
  })
  
  return breadcrumbs
}

const findNavigationItem = (items: NavigationItem[], href: string): NavigationItem | null => {
  for (const item of items) {
    if (item.href === href) return item
    if (item.children) {
      const found = findNavigationItem(item.children, href)
      if (found) return found
    }
  }
  return null
}

const searchNavigationItems = (items: NavigationItem[], query: string): NavigationItem[] => {
  const results: NavigationItem[] = []
  const searchTerm = query.toLowerCase()
  
  const searchRecursive = (navItems: NavigationItem[]) => {
    navItems.forEach(item => {
      if (item.label.toLowerCase().includes(searchTerm) || 
          item.description?.toLowerCase().includes(searchTerm)) {
        results.push(item)
      }
      if (item.children) {
        searchRecursive(item.children)
      }
    })
  }
  
  searchRecursive(items)
  return results
}

export default EnhancedNavigation