import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  Zap
} from "lucide-react"

// Contextual Navigation Types
export interface ContextualAction {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  badge?: string | number
  disabled?: boolean
  loading?: boolean
}

export interface ContextualInfo {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  description?: string
  actions?: ContextualAction[]
  dismissible?: boolean
}

export interface NavigationContext {
  currentPage: string
  userRole: string
  userState?: {
    hasActiveRide?: boolean
    isOnline?: boolean
    pendingRequests?: number
    recentActivity?: string[]
  }
  pageContext?: Record<string, any>
}

interface ContextualNavigationProps {
  context: NavigationContext
  onNavigate: (path: string) => void
  onAction: (actionId: string) => void
  className?: string
}

// Main Contextual Navigation Component
export const ContextualNavigation: React.FC<ContextualNavigationProps> = ({
  context,
  onNavigate,
  onAction,
  className,
}) => {
  const quickActions = getQuickActionsForContext(context)
  const contextualInfo = getContextualInfoForContext(context)
  const suggestedNavigation = getSuggestedNavigationForContext(context)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Contextual Information */}
      {contextualInfo.length > 0 && (
        <div className="space-y-2">
          {contextualInfo.map((info) => (
            <ContextualInfoCard
              key={info.id}
              info={info}
              onAction={onAction}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  className="h-auto p-3 flex flex-col items-center gap-1"
                  disabled={action.disabled || action.loading}
                  onClick={() => {
                    if (action.onClick) {
                      action.onClick()
                    } else if (action.href) {
                      onNavigate(action.href)
                    }
                    onAction(action.id)
                  }}
                >
                  {action.loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    action.icon
                  )}
                  <span className="text-xs text-center">{action.label}</span>
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Navigation */}
      {suggestedNavigation.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Suggested for You
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {suggestedNavigation.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-md text-left"
                  onClick={() => {
                    if (suggestion.href) {
                      onNavigate(suggestion.href)
                    }
                    onAction(suggestion.id)
                  }}
                >
                  <div className="flex items-center gap-2">
                    {suggestion.icon}
                    <div>
                      <div className="text-sm font-medium">{suggestion.label}</div>
                      {suggestion.description && (
                        <div className="text-xs text-muted-foreground">
                          {suggestion.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Contextual Info Card Component
interface ContextualInfoCardProps {
  info: ContextualInfo
  onAction: (actionId: string) => void
}

const ContextualInfoCard: React.FC<ContextualInfoCardProps> = ({
  info,
  onAction,
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false)

  if (isDismissed) return null

  const getInfoIcon = () => {
    switch (info.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getCardVariant = () => {
    switch (info.type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <Card className={cn("relative", getCardVariant())}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getInfoIcon()}
          <div className="flex-1">
            <h4 className="font-medium text-sm">{info.title}</h4>
            {info.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {info.description}
              </p>
            )}
            {info.actions && info.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {info.actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => onAction(action.id)}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {info.dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
            >
              ×
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Context-based Action Generators
const getQuickActionsForContext = (context: NavigationContext): ContextualAction[] => {
  const { currentPage, userRole, userState } = context
  const actions: ContextualAction[] = []

  // Role-based quick actions
  switch (userRole) {
    case 'passenger':
      actions.push(
        {
          id: 'book-ride',
          label: 'Book Ride',
          icon: <MapPin className="h-4 w-4" />,
          href: '/rides/book',
          variant: 'default',
        },
        {
          id: 'ride-history',
          label: 'History',
          icon: <Clock className="h-4 w-4" />,
          href: '/rides/history',
        }
      )
      
      if (userState?.hasActiveRide) {
        actions.unshift({
          id: 'track-ride',
          label: 'Track Ride',
          icon: <MapPin className="h-4 w-4" />,
          href: '/rides/active',
          variant: 'default',
          badge: 'Live',
        })
      }
      break

    case 'driver':
      actions.push(
        {
          id: 'toggle-online',
          label: userState?.isOnline ? 'Go Offline' : 'Go Online',
          icon: <Zap className="h-4 w-4" />,
          variant: userState?.isOnline ? 'destructive' : 'default',
        },
        {
          id: 'view-requests',
          label: 'Requests',
          icon: <Clock className="h-4 w-4" />,
          href: '/rides/requests',
          badge: userState?.pendingRequests || 0,
        }
      )
      break

    case 'operator':
      actions.push(
        {
          id: 'dispatch-center',
          label: 'Dispatch',
          icon: <MapPin className="h-4 w-4" />,
          href: '/fleet/dispatch',
          badge: userState?.pendingRequests || 0,
        },
        {
          id: 'fleet-overview',
          label: 'Fleet',
          icon: <TrendingUp className="h-4 w-4" />,
          href: '/fleet/overview',
        }
      )
      break

    case 'admin':
      actions.push(
        {
          id: 'system-health',
          label: 'System',
          icon: <TrendingUp className="h-4 w-4" />,
          href: '/system/health',
        },
        {
          id: 'user-management',
          label: 'Users',
          icon: <Clock className="h-4 w-4" />,
          href: '/system/users',
        }
      )
      break
  }

  // Page-specific actions
  if (currentPage.includes('/rides/book')) {
    actions.push({
      id: 'saved-locations',
      label: 'Saved Places',
      icon: <Star className="h-4 w-4" />,
      href: '/rides/saved-locations',
    })
  }

  return actions
}

const getContextualInfoForContext = (context: NavigationContext): ContextualInfo[] => {
  const { userRole, userState, currentPage } = context
  const info: ContextualInfo[] = []

  // Active ride information
  if (userState?.hasActiveRide && userRole === 'passenger') {
    info.push({
      id: 'active-ride',
      type: 'info',
      title: 'You have an active ride',
      description: 'Track your ride progress and estimated arrival time',
      actions: [
        {
          id: 'track-ride',
          label: 'Track Ride',
          icon: <MapPin className="h-4 w-4" />,
          href: '/rides/active',
          variant: 'default',
        },
      ],
    })
  }

  // Driver online status
  if (userRole === 'driver' && !userState?.isOnline) {
    info.push({
      id: 'driver-offline',
      type: 'warning',
      title: 'You are currently offline',
      description: 'Go online to start receiving ride requests',
      actions: [
        {
          id: 'go-online',
          label: 'Go Online',
          variant: 'default',
        },
      ],
      dismissible: true,
    })
  }

  // Pending requests for operators
  if (userRole === 'operator' && userState?.pendingRequests && userState.pendingRequests > 5) {
    info.push({
      id: 'high-demand',
      type: 'warning',
      title: 'High demand detected',
      description: `${userState.pendingRequests} pending ride requests need attention`,
      actions: [
        {
          id: 'view-dispatch',
          label: 'View Dispatch',
          href: '/fleet/dispatch',
          variant: 'default',
        },
      ],
    })
  }

  // Welcome message for new users
  if (currentPage === '/dashboard' && !userState?.recentActivity?.length) {
    info.push({
      id: 'welcome',
      type: 'info',
      title: `Welcome to GoCars!`,
      description: 'Get started by exploring the features available to you',
      dismissible: true,
    })
  }

  return info
}

const getSuggestedNavigationForContext = (context: NavigationContext): ContextualAction[] => {
  const { userRole, currentPage, userState } = context
  const suggestions: ContextualAction[] = []

  // Role-based suggestions
  switch (userRole) {
    case 'passenger':
      if (!currentPage.includes('/rides')) {
        suggestions.push({
          id: 'explore-rides',
          label: 'Book Your First Ride',
          description: 'Quick and easy ride booking',
          icon: <MapPin className="h-4 w-4" />,
          href: '/rides/book',
        })
      }
      
      if (userState?.recentActivity?.length) {
        suggestions.push({
          id: 'view-history',
          label: 'View Ride History',
          description: 'See your past trips and receipts',
          icon: <Clock className="h-4 w-4" />,
          href: '/rides/history',
        })
      }
      break

    case 'driver':
      if (!userState?.isOnline) {
        suggestions.push({
          id: 'start-earning',
          label: 'Start Earning',
          description: 'Go online to receive ride requests',
          icon: <Zap className="h-4 w-4" />,
        })
      }
      
      suggestions.push({
        id: 'view-earnings',
        label: 'Check Earnings',
        description: 'View your daily and weekly earnings',
        icon: <TrendingUp className="h-4 w-4" />,
        href: '/earnings',
      })
      break

    case 'operator':
      suggestions.push({
        id: 'fleet-analytics',
        label: 'Fleet Analytics',
        description: 'Monitor fleet performance and efficiency',
        icon: <TrendingUp className="h-4 w-4" />,
        href: '/analytics/fleet',
      })
      break

    case 'admin':
      suggestions.push({
        id: 'business-insights',
        label: 'Business Insights',
        description: 'View platform analytics and reports',
        icon: <TrendingUp className="h-4 w-4" />,
        href: '/analytics/business',
      })
      break
  }

  return suggestions
}

// Hook for managing navigation context
export const useNavigationContext = (
  userRole: string,
  currentPath: string
): NavigationContext => {
  const [context, setContext] = React.useState<NavigationContext>({
    currentPage: currentPath,
    userRole,
    userState: {
      hasActiveRide: false,
      isOnline: userRole === 'driver' ? false : undefined,
      pendingRequests: 0,
      recentActivity: [],
    },
  })

  // Update context when path changes
  React.useEffect(() => {
    setContext(prev => ({
      ...prev,
      currentPage: currentPath,
    }))
  }, [currentPath])

  // Simulate real-time context updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setContext(prev => ({
        ...prev,
        userState: {
          ...prev.userState,
          pendingRequests: Math.floor(Math.random() * 10),
          hasActiveRide: userRole === 'passenger' ? Math.random() > 0.8 : false,
        },
      }))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [userRole])

  const updateContext = (updates: Partial<NavigationContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }

  return { ...context, updateContext } as NavigationContext & { updateContext: (updates: Partial<NavigationContext>) => void }
}

export default ContextualNavigation