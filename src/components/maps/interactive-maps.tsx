import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  MapPin,
  Car,
  Users,
  Filter,
  Search,
  Layers,
  Maximize2,
  RefreshCw,
  Download,
  Navigation,
  Clock,
  Circle,
  X
} from "lucide-react"

// Map Data Types
export interface MapLocation {
  id: string
  lat: number
  lng: number
  type: 'driver' | 'passenger' | 'pickup' | 'dropoff' | 'hotspot'
  status: 'active' | 'idle' | 'busy' | 'offline'
  metadata: {
    name?: string
    rating?: number
    eta?: number
    rides?: number
    earnings?: number
    demand?: number
    [key: string]: unknown
  }
}

export interface MapCluster {
  id: string
  lat: number
  lng: number
  count: number
  locations: MapLocation[]
  type: string
}

export interface MapFilter {
  id: string
  label: string
  active: boolean
  color: string
}

export interface MapLayer {
  id: string
  label: string
  visible: boolean
  type: 'heatmap' | 'markers' | 'routes' | 'zones'
}

interface InteractiveMapsProps {
  userRole: string
  className?: string
}

// Main Interactive Maps Component
export const InteractiveMaps: React.FC<InteractiveMapsProps> = ({
  userRole,
  className,
}) => {
  const [mapCenter] = React.useState({ lat: 40.7128, lng: -74.0060 })
  const [zoomLevel, setZoomLevel] = React.useState(12)
  const [locations, setLocations] = React.useState<MapLocation[]>([])
  const [clusters, setClusters] = React.useState<MapCluster[]>([])
  const [filters, setFilters] = React.useState<MapFilter[]>(getDefaultFilters())
  const [layers, setLayers] = React.useState<MapLayer[]>(getDefaultLayers())
  const [selectedLocation, setSelectedLocation] = React.useState<MapLocation | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  // Load map data
  React.useEffect(() => {
    setIsLoading(true)
    const data = generateMapData(userRole, filters)
    setLocations(data)
    setClusters(generateClusters(data, zoomLevel))
    setIsLoading(false)
  }, [userRole, filters, zoomLevel])

  const handleFilterToggle = (filterId: string) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId 
        ? { ...filter, active: !filter.active }
        : filter
    ))
  }

  const handleLayerToggle = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ))
  }

  const handleLocationClick = (location: MapLocation) => {
    setSelectedLocation(location)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Implement search functionality
  }

  const activeFilters = filters.filter(f => f.active)
  const visibleLayers = layers.filter(l => l.visible)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          <MapFilters
            filters={filters}
            onToggleFilter={handleFilterToggle}
          />

          <MapLayers
            layers={layers}
            onToggleLayer={handleLayerToggle}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleFilterToggle(filter.id)}
            >
              {filter.label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Display */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Live Map View
                </CardTitle>
                <div className="flex items-center gap-2">
                  {visibleLayers.map((layer) => (
                    <Badge key={layer.id} variant="outline" className="text-xs">
                      {layer.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
                {isLoading ? (
                  <MapSkeleton />
                ) : (
                  <MapRenderer
                    center={mapCenter}
                    zoom={zoomLevel}
                    locations={locations}
                    clusters={clusters}
                    layers={visibleLayers}
                    onLocationClick={handleLocationClick}
                  />
                )}
                
                {/* Map Legend */}
                <MapLegend filters={filters} />
                
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setZoomLevel(prev => Math.min(prev + 1, 18))}
                  >
                    +
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setZoomLevel(prev => Math.max(prev - 1, 1))}
                  >
                    -
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Sidebar */}
        <div className="space-y-4">
          {/* Location Details */}
          {selectedLocation && (
            <LocationDetailsCard
              location={selectedLocation}
              onClose={() => setSelectedLocation(null)}
            />
          )}

          {/* Map Statistics */}
          <MapStatisticsCard
            locations={locations}
            userRole={userRole}
          />

          {/* Real-time Updates */}
          <RealTimeUpdatesCard userRole={userRole} />
        </div>
      </div>

      {/* Map Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MapMetricCard
          title="Active Drivers"
          value={locations.filter(l => l.type === 'driver' && l.status === 'active').length.toString()}
          icon={<Car className="h-4 w-4" />}
          change={5}
        />
        <MapMetricCard
          title="Pending Requests"
          value={locations.filter(l => l.type === 'passenger').length.toString()}
          icon={<Users className="h-4 w-4" />}
          change={-2}
        />
        <MapMetricCard
          title="Avg Response Time"
          value="4.2 min"
          icon={<Clock className="h-4 w-4" />}
          change={-8}
        />
        <MapMetricCard
          title="Coverage Area"
          value="95%"
          icon={<MapPin className="h-4 w-4" />}
          change={2}
        />
      </div>
    </div>
  )
}

// Map Renderer Component
interface MapRendererProps {
  center: { lat: number; lng: number }
  zoom: number
  locations: MapLocation[]
  clusters: MapCluster[]
  layers: MapLayer[]
  onLocationClick: (location: MapLocation) => void
}

const MapRenderer: React.FC<MapRendererProps> = ({
  center,
  zoom,
  locations,
  clusters,
  onLocationClick,
}) => {
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-green-50">
      {/* Simulated Map Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Render Clusters */}
      {zoom < 14 && clusters.map((cluster) => (
        <ClusterMarker
          key={cluster.id}
          cluster={cluster}
          center={center}
          zoom={zoom}
        />
      ))}

      {/* Render Individual Locations */}
      {zoom >= 14 && locations.map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          center={center}
          zoom={zoom}
          onClick={() => onLocationClick(location)}
        />
      ))}
    </div>
  )
}

// Supporting Components
const MapFilters: React.FC<{
  filters: MapFilter[]
  onToggleFilter: (filterId: string) => void
}> = ({ filters, onToggleFilter }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm">
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {filters.some(f => f.active) && (
          <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs">
            {filters.filter(f => f.active).length}
          </Badge>
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-64 p-3">
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Filter Map Data</h4>
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
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: filter.color }}
                />
                <span className="text-sm">{filter.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </PopoverContent>
  </Popover>
)

const MapLayers: React.FC<{
  layers: MapLayer[]
  onToggleLayer: (layerId: string) => void
}> = ({ layers, onToggleLayer }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm">
        <Layers className="h-4 w-4 mr-2" />
        Layers
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-56 p-3">
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Map Layers</h4>
        <div className="space-y-2">
          {layers.map((layer) => (
            <label
              key={layer.id}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => onToggleLayer(layer.id)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{layer.label}</span>
            </label>
          ))}
        </div>
      </div>
    </PopoverContent>
  </Popover>
)

const MapLegend: React.FC<{ filters: MapFilter[] }> = ({ filters }) => (
  <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3">
    <h4 className="font-medium text-sm mb-2">Legend</h4>
    <div className="space-y-1">
      {filters.map((filter) => (
        <div key={filter.id} className="flex items-center gap-2 text-xs">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: filter.color }}
          />
          <span>{filter.label}</span>
        </div>
      ))}
    </div>
  </div>
)

const ClusterMarker: React.FC<{
  cluster: MapCluster
  center: { lat: number; lng: number }
  zoom: number
}> = ({ cluster, center, zoom }) => {
  const position = latLngToPixel(cluster.lat, cluster.lng, center, zoom)
  
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: position.x, top: position.y }}
    >
      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform">
        {cluster.count}
      </div>
    </div>
  )
}

const LocationMarker: React.FC<{
  location: MapLocation
  center: { lat: number; lng: number }
  zoom: number
  onClick: () => void
}> = ({ location, center, zoom, onClick }) => {
  const position = latLngToPixel(location.lat, location.lng, center, zoom)
  const getMarkerIcon = () => {
    switch (location.type) {
      case 'driver':
        return <Car className="h-3 w-3" />
      case 'passenger':
        return <Users className="h-3 w-3" />
      case 'pickup':
        return <MapPin className="h-3 w-3" />
      case 'dropoff':
        return <Navigation className="h-3 w-3" />
      default:
        return <Circle className="h-3 w-3" />
    }
  }

  const getMarkerColor = () => {
    switch (location.status) {
      case 'active':
        return 'bg-green-500'
      case 'busy':
        return 'bg-yellow-500'
      case 'idle':
        return 'bg-blue-500'
      case 'offline':
        return 'bg-gray-500'
      default:
        return 'bg-primary'
    }
  }

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: position.x, top: position.y }}
      onClick={onClick}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform",
        getMarkerColor()
      )}>
        {getMarkerIcon()}
      </div>
      
      {location.metadata.eta && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          ETA: {location.metadata.eta}min
        </div>
      )}
    </div>
  )
}

const LocationDetailsCard: React.FC<{
  location: MapLocation
  onClose: () => void
}> = ({ location, onClose }) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm">Location Details</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Type:</span>
          <Badge variant="outline">{location.type}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
            {location.status}
          </Badge>
        </div>
        {location.metadata.name && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Name:</span>
            <span className="text-sm">{location.metadata.name}</span>
          </div>
        )}
        {location.metadata.rating && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Rating:</span>
            <span className="text-sm">{location.metadata.rating}/5</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)

const MapStatisticsCard: React.FC<{
  locations: MapLocation[]
  userRole: string
}> = ({ locations }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">Map Statistics</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total Locations:</span>
          <span className="text-sm font-medium">{locations.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Active:</span>
          <span className="text-sm font-medium">
            {locations.filter(l => l.status === 'active').length}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Drivers:</span>
          <span className="text-sm font-medium">
            {locations.filter(l => l.type === 'driver').length}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
)

const RealTimeUpdatesCard: React.FC<{ userRole: string }> = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">Real-time Updates</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs">Driver #123 went online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs">New ride request in downtown</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-xs">High demand area detected</span>
        </div>
      </div>
    </CardContent>
  </Card>
)

const MapMetricCard: React.FC<{
  title: string
  value: string
  icon: React.ReactNode
  change: number
}> = ({ title, value, icon, change }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className={cn(
        "text-xs flex items-center gap-1 mt-1",
        change > 0 ? "text-green-600" : "text-red-600"
      )}>
        {change > 0 ? '+' : ''}{change}% from last hour
      </div>
    </CardContent>
  </Card>
)

const MapSkeleton: React.FC = () => (
  <div className="h-full w-full animate-pulse bg-muted rounded-md flex items-center justify-center">
    <div className="text-muted-foreground">Loading map...</div>
  </div>
)

// Utility Functions
const latLngToPixel = (
  lat: number, 
  lng: number, 
  center: { lat: number; lng: number }, 
  zoom: number,
  containerWidth: number = 400,
  containerHeight: number = 300
): { x: number; y: number } => {
  // Simple projection for demo purposes
  const scale = Math.pow(2, zoom) * 256
  const worldWidth = scale
  const worldHeight = scale
  
  const x = ((lng + 180) / 360) * worldWidth
  const y = ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * worldHeight
  
  const centerX = ((center.lng + 180) / 360) * worldWidth
  const centerY = ((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2) * worldHeight
  
  return {
    x: (x - centerX) + containerWidth / 2,
    y: (y - centerY) + containerHeight / 2
  }
}

const getDefaultFilters = (): MapFilter[] => [
  { id: 'drivers', label: 'Drivers', active: true, color: '#22c55e' },
  { id: 'passengers', label: 'Passengers', active: true, color: '#3b82f6' },
  { id: 'pickups', label: 'Pickups', active: false, color: '#f59e0b' },
  { id: 'dropoffs', label: 'Drop-offs', active: false, color: '#ef4444' },
  { id: 'hotspots', label: 'Hotspots', active: false, color: '#8b5cf6' },
]

const getDefaultLayers = (): MapLayer[] => [
  { id: 'markers', label: 'Markers', visible: true, type: 'markers' },
  { id: 'heatmap', label: 'Heatmap', visible: false, type: 'heatmap' },
  { id: 'routes', label: 'Routes', visible: false, type: 'routes' },
  { id: 'zones', label: 'Service Zones', visible: false, type: 'zones' },
]

const generateMapData = (userRole: string, filters: MapFilter[]): MapLocation[] => {
  const locations: MapLocation[] = []
  
  // Generate sample data based on active filters
  if (filters.find(f => f.id === 'drivers' && f.active)) {
    for (let i = 0; i < 15; i++) {
      locations.push({
        id: `driver-${i}`,
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
        type: 'driver',
        status: Math.random() > 0.3 ? 'active' : 'idle',
        metadata: {
          name: `Driver ${i + 1}`,
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          rides: Math.floor(Math.random() * 100) + 10,
        },
      })
    }
  }
  
  if (filters.find(f => f.id === 'passengers' && f.active)) {
    for (let i = 0; i < 8; i++) {
      locations.push({
        id: `passenger-${i}`,
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
        type: 'passenger',
        status: 'active',
        metadata: {
          eta: Math.floor(Math.random() * 15) + 2,
        },
      })
    }
  }
  
  return locations
}

const generateClusters = (locations: MapLocation[], zoom: number): MapCluster[] => {
  // Simple clustering logic for demo
  const clusters: MapCluster[] = []
  
  if (zoom < 12) {
    clusters.push({
      id: 'cluster-1',
      lat: 40.7128,
      lng: -74.0060,
      count: locations.length,
      locations,
      type: 'mixed',
    })
  }
  
  return clusters
}

export default InteractiveMaps