import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Search,
  Clock,
  Star,
  Filter,
  X,
  ArrowRight,
  FileText,
  Users,
  Car,
  MapPin,
  Settings,
  BarChart3,
  Calendar,
  CreditCard,
  Shield,
  Bell
} from "lucide-react"

// Search Types
export interface SearchResult {
  id: string
  title: string
  description?: string
  category: 'pages' | 'actions' | 'data' | 'settings'
  icon?: React.ReactNode
  href?: string
  action?: () => void
  keywords: string[]
  relevance: number
  userRoles: string[]
}

export interface SearchFilter {
  id: string
  label: string
  category: string
  active: boolean
}

export interface RecentSearch {
  id: string
  query: string
  timestamp: Date
  results: number
}

interface GlobalSearchProps {
  userRole: string
  onNavigate: (path: string) => void
  onAction: (actionId: string) => void
  className?: string
}

// Main Global Search Component
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  userRole,
  onNavigate,
  onAction,
  className,
}) => {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [filters, setFilters] = React.useState<SearchFilter[]>(getDefaultFilters())
  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>(getRecentSearches())
  const [isLoading, setIsLoading] = React.useState(false)

  // Search functionality
  React.useEffect(() => {
    if (query.trim()) {
      setIsLoading(true)
      const searchResults = performSearch(query, userRole, filters)
      setResults(searchResults)
      setIsLoading(false)
    } else {
      setResults([])
    }
  }, [query, userRole, filters])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.trim()) {
      // Add to recent searches
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        query: searchQuery,
        timestamp: new Date(),
        results: results.length,
      }
      setRecentSearches(prev => [newSearch, ...prev.slice(0, 4)])
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    if (result.href) {
      onNavigate(result.href)
    }
    if (result.action) {
      result.action()
    }
    onAction(result.id)
    setOpen(false)
    setQuery("")
  }

  const toggleFilter = (filterId: string) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId 
        ? { ...filter, active: !filter.active }
        : filter
    ))
  }

  const clearFilters = () => {
    setFilters(prev => prev.map(filter => ({ ...filter, active: false })))
  }

  const activeFilters = filters.filter(f => f.active)

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-muted-foreground"
          >
            <Search className="mr-2 h-4 w-4" />
            Search everything...
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search pages, actions, data..."
                value={query}
                onValueChange={handleSearch}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery("")}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Search Filters */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 p-3 border-b">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter.id}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => toggleFilter(filter.id)}
                    >
                      {filter.label}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}

            <CommandList className="max-h-[400px]">
              {!query && recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((search) => (
                    <CommandItem
                      key={search.id}
                      onSelect={() => handleSearch(search.query)}
                      className="cursor-pointer"
                    >
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{search.query}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {search.results} results
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!query && (
                <CommandGroup heading="Quick Actions">
                  {getQuickSearchActions(userRole).map((action) => (
                    <CommandItem
                      key={action.id}
                      onSelect={() => handleResultSelect(action)}
                      className="cursor-pointer"
                    >
                      {action.icon}
                      <span className="ml-2">{action.title}</span>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {query && isLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}

              {query && !isLoading && results.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-6">
                    <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No results found for "{query}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </CommandEmpty>
              )}

              {query && !isLoading && results.length > 0 && (
                <>
                  {/* Group results by category */}
                  {['pages', 'actions', 'data', 'settings'].map((category) => {
                    const categoryResults = results.filter(r => r.category === category)
                    if (categoryResults.length === 0) return null

                    return (
                      <CommandGroup key={category} heading={getCategoryLabel(category)}>
                        {categoryResults.slice(0, 5).map((result) => (
                          <CommandItem
                            key={result.id}
                            onSelect={() => handleResultSelect(result)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center w-full">
                              {result.icon}
                              <div className="ml-2 flex-1">
                                <div className="font-medium text-sm">{result.title}</div>
                                {result.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {result.description}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )
                  })}
                </>
              )}
            </CommandList>

            {/* Search Footer */}
            <div className="border-t p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SearchFilters
                    filters={filters}
                    onToggleFilter={toggleFilter}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {results.length > 0 && `${results.length} results`}
                </div>
              </div>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Keyboard Shortcut Handler */}
      <KeyboardShortcuts onOpenSearch={() => setOpen(true)} />
    </div>
  )
}

// Search Filters Component
interface SearchFiltersProps {
  filters: SearchFilter[]
  onToggleFilter: (filterId: string) => void
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onToggleFilter }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="h-6 text-xs">
        <Filter className="mr-1 h-3 w-3" />
        Filters
        {filters.some(f => f.active) && (
          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
            {filters.filter(f => f.active).length}
          </Badge>
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-56 p-3" align="start">
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Filter Results</h4>
        <div className="space-y-2">
          {filters.map((filter) => (
            <label
              key={filter.id}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filter.active}
                onChange={() => onToggleFilter(filter.id)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{filter.label}</span>
            </label>
          ))}
        </div>
      </div>
    </PopoverContent>
  </Popover>
)

// Keyboard Shortcuts Component
interface KeyboardShortcutsProps {
  onOpenSearch: () => void
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onOpenSearch }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onOpenSearch])

  return null
}

// Utility Functions
const performSearch = (query: string, userRole: string, filters: SearchFilter[]): SearchResult[] => {
  const allResults = getAllSearchableItems(userRole)
  const activeCategories = filters.filter(f => f.active).map(f => f.category)
  
  let filteredResults = allResults
  if (activeCategories.length > 0) {
    filteredResults = allResults.filter(item => activeCategories.includes(item.category))
  }

  const searchTerms = query.toLowerCase().split(' ')
  
  return filteredResults
    .map(item => {
      let relevance = 0
      const searchableText = `${item.title} ${item.description} ${item.keywords.join(' ')}`.toLowerCase()
      
      // Calculate relevance score
      searchTerms.forEach(term => {
        if (item.title.toLowerCase().includes(term)) relevance += 10
        if (item.description?.toLowerCase().includes(term)) relevance += 5
        if (item.keywords.some(keyword => keyword.toLowerCase().includes(term))) relevance += 3
        if (searchableText.includes(term)) relevance += 1
      })
      
      return { ...item, relevance }
    })
    .filter(item => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 20)
}

const getAllSearchableItems = (userRole: string): SearchResult[] => {
  const baseItems: SearchResult[] = [
    // Pages
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Main dashboard with overview and widgets',
      category: 'pages',
      icon: <BarChart3 className="h-4 w-4" />,
      href: '/dashboard',
      keywords: ['home', 'overview', 'main', 'widgets'],
      relevance: 0,
      userRoles: ['all'],
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Account and application settings',
      category: 'settings',
      icon: <Settings className="h-4 w-4" />,
      href: '/settings',
      keywords: ['preferences', 'configuration', 'account'],
      relevance: 0,
      userRoles: ['all'],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'View and manage notifications',
      category: 'pages',
      icon: <Bell className="h-4 w-4" />,
      href: '/notifications',
      keywords: ['alerts', 'messages', 'updates'],
      relevance: 0,
      userRoles: ['all'],
    },
  ]

  // Role-specific items
  const roleItems: Record<string, SearchResult[]> = {
    passenger: [
      {
        id: 'book-ride',
        title: 'Book a Ride',
        description: 'Book a new ride to your destination',
        category: 'actions',
        icon: <Car className="h-4 w-4" />,
        href: '/rides/book',
        keywords: ['book', 'ride', 'trip', 'travel', 'destination'],
        relevance: 0,
        userRoles: ['passenger'],
      },
      {
        id: 'ride-history',
        title: 'Ride History',
        description: 'View past rides and receipts',
        category: 'data',
        icon: <Clock className="h-4 w-4" />,
        href: '/rides/history',
        keywords: ['history', 'past', 'trips', 'receipts', 'previous'],
        relevance: 0,
        userRoles: ['passenger'],
      },
      {
        id: 'payments',
        title: 'Payment Methods',
        description: 'Manage payment methods and billing',
        category: 'settings',
        icon: <CreditCard className="h-4 w-4" />,
        href: '/payments',
        keywords: ['payment', 'billing', 'credit card', 'wallet'],
        relevance: 0,
        userRoles: ['passenger'],
      },
    ],
    driver: [
      {
        id: 'earnings',
        title: 'Earnings',
        description: 'View earnings and payment history',
        category: 'data',
        icon: <BarChart3 className="h-4 w-4" />,
        href: '/earnings',
        keywords: ['earnings', 'money', 'income', 'payments'],
        relevance: 0,
        userRoles: ['driver'],
      },
      {
        id: 'ride-requests',
        title: 'Ride Requests',
        description: 'View and accept ride requests',
        category: 'actions',
        icon: <Car className="h-4 w-4" />,
        href: '/rides/requests',
        keywords: ['requests', 'rides', 'accept', 'decline'],
        relevance: 0,
        userRoles: ['driver'],
      },
    ],
    operator: [
      {
        id: 'fleet-management',
        title: 'Fleet Management',
        description: 'Manage fleet and drivers',
        category: 'pages',
        icon: <Users className="h-4 w-4" />,
        href: '/fleet',
        keywords: ['fleet', 'drivers', 'vehicles', 'management'],
        relevance: 0,
        userRoles: ['operator'],
      },
      {
        id: 'dispatch',
        title: 'Dispatch Center',
        description: 'Manage ride assignments and dispatch',
        category: 'actions',
        icon: <MapPin className="h-4 w-4" />,
        href: '/fleet/dispatch',
        keywords: ['dispatch', 'assign', 'rides', 'queue'],
        relevance: 0,
        userRoles: ['operator'],
      },
    ],
    admin: [
      {
        id: 'user-management',
        title: 'User Management',
        description: 'Manage users, roles, and permissions',
        category: 'settings',
        icon: <Users className="h-4 w-4" />,
        href: '/admin/users',
        keywords: ['users', 'roles', 'permissions', 'accounts'],
        relevance: 0,
        userRoles: ['admin'],
      },
      {
        id: 'system-health',
        title: 'System Health',
        description: 'Monitor system performance and health',
        category: 'data',
        icon: <Shield className="h-4 w-4" />,
        href: '/admin/health',
        keywords: ['system', 'health', 'performance', 'monitoring'],
        relevance: 0,
        userRoles: ['admin'],
      },
    ],
  }

  const userItems = roleItems[userRole] || []
  return [...baseItems, ...userItems].filter(item => 
    item.userRoles.includes('all') || item.userRoles.includes(userRole)
  )
}

const getQuickSearchActions = (userRole: string): SearchResult[] => {
  const actions: Record<string, SearchResult[]> = {
    passenger: [
      {
        id: 'quick-book',
        title: 'Quick Book Ride',
        category: 'actions',
        icon: <Car className="h-4 w-4" />,
        href: '/rides/book',
        keywords: [],
        relevance: 0,
        userRoles: ['passenger'],
      },
      {
        id: 'view-favorites',
        title: 'Favorite Locations',
        category: 'data',
        icon: <Star className="h-4 w-4" />,
        href: '/rides/favorites',
        keywords: [],
        relevance: 0,
        userRoles: ['passenger'],
      },
    ],
    driver: [
      {
        id: 'go-online',
        title: 'Go Online',
        category: 'actions',
        icon: <Car className="h-4 w-4" />,
        action: () => console.log('Going online'),
        keywords: [],
        relevance: 0,
        userRoles: ['driver'],
      },
      {
        id: 'view-earnings',
        title: 'Today\'s Earnings',
        category: 'data',
        icon: <BarChart3 className="h-4 w-4" />,
        href: '/earnings',
        keywords: [],
        relevance: 0,
        userRoles: ['driver'],
      },
    ],
    operator: [
      {
        id: 'dispatch-center',
        title: 'Open Dispatch Center',
        category: 'actions',
        icon: <MapPin className="h-4 w-4" />,
        href: '/fleet/dispatch',
        keywords: [],
        relevance: 0,
        userRoles: ['operator'],
      },
    ],
    admin: [
      {
        id: 'system-overview',
        title: 'System Overview',
        category: 'data',
        icon: <BarChart3 className="h-4 w-4" />,
        href: '/admin/overview',
        keywords: [],
        relevance: 0,
        userRoles: ['admin'],
      },
    ],
  }

  return actions[userRole] || []
}

const getDefaultFilters = (): SearchFilter[] => [
  { id: 'pages', label: 'Pages', category: 'pages', active: false },
  { id: 'actions', label: 'Actions', category: 'actions', active: false },
  { id: 'data', label: 'Data', category: 'data', active: false },
  { id: 'settings', label: 'Settings', category: 'settings', active: false },
]

const getRecentSearches = (): RecentSearch[] => [
  {
    id: '1',
    query: 'book ride',
    timestamp: new Date(Date.now() - 3600000),
    results: 5,
  },
  {
    id: '2',
    query: 'earnings',
    timestamp: new Date(Date.now() - 7200000),
    results: 3,
  },
]

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    pages: 'Pages',
    actions: 'Actions',
    data: 'Data & Reports',
    settings: 'Settings',
  }
  return labels[category] || category
}

export default GlobalSearch