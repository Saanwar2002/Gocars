/**
 * Route Optimization Service
 * Advanced routing algorithms with traffic awareness, multi-stop planning, and eco-friendly options
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  GeoPoint
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Ensure db is not null
if (!db) {
  throw new Error('Firebase database not initialized')
}

export interface RoutePoint {
  id: string
  coordinates: GeoPoint
  address: string
  type: 'pickup' | 'dropoff' | 'waypoint'
  timeWindow?: {
    earliest: Date
    latest: Date
  }
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedDuration: number // minutes to spend at this point
  specialInstructions?: string
}

export interface RouteOptimizationRequest {
  id?: string
  requesterId: string
  startLocation: GeoPoint
  endLocation?: GeoPoint
  waypoints: RoutePoint[]
  preferences: {
    routeType: 'fastest' | 'shortest' | 'eco_friendly' | 'scenic' | 'balanced'
    avoidTolls: boolean
    avoidHighways: boolean
    avoidTraffic: boolean
    maxDetourTime: number // minutes
    fuelEfficiency: boolean
    carbonOptimized: boolean
  }
  constraints: {
    maxTotalTime: number // minutes
    maxTotalDistance: number // kilometers
    vehicleType: 'car' | 'van' | 'truck' | 'motorcycle' // truck = HGV/Lorry, motorcycle = motorbike in UK
    driverBreakRequired: boolean
    timeWindows: boolean
  }
  createdAt: Timestamp
}

export interface OptimizedRoute {
  id?: string
  requestId: string
  routePoints: RoutePoint[]
  segments: RouteSegment[]
  totalDistance: number // kilometers
  totalDuration: number // minutes
  totalFuelConsumption: number // liters
  carbonEmissions: number // kg CO2
  estimatedCost: number
  trafficDelay: number // minutes
  optimizationScore: number // 0-1
  alternativeRoutes: AlternativeRoute[]
  realTimeUpdates: RouteUpdate[]
  createdAt: Timestamp
  lastUpdated: Timestamp
}

export interface RouteSegment {
  id: string
  fromPoint: RoutePoint
  toPoint: RoutePoint
  distance: number // kilometers
  duration: number // minutes
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'severe'
  roadType: 'motorway' | 'a_road' | 'b_road' | 'residential'
  tollRequired: boolean
  fuelConsumption: number // liters
  carbonEmissions: number // kg CO2
  instructions: string[]
  coordinates: GeoPoint[]
}

export interface AlternativeRoute {
  id: string
  description: string
  totalDistance: number
  totalDuration: number
  fuelSavings: number
  carbonSavings: number
  costDifference: number
  trafficAvoidance: boolean
  routePoints: RoutePoint[]
}

export interface RouteUpdate {
  id: string
  timestamp: Timestamp
  updateType: 'traffic' | 'road_closure' | 'accident' | 'weather' | 'construction'
  affectedSegments: string[]
  newEstimatedTime: number
  detourRequired: boolean
  alternativeRoute?: AlternativeRoute
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface TrafficData {
  segmentId: string
  currentSpeed: number // km/h
  averageSpeed: number // km/h
  congestionLevel: number // 0-1
  incidents: TrafficIncident[]
  predictedConditions: {
    nextHour: number
    nextTwoHours: number
    nextFourHours: number
  }
}

export interface TrafficIncident {
  id: string
  type: 'accident' | 'construction' | 'road_closure' | 'weather' | 'event'
  location: GeoPoint
  severity: 'minor' | 'moderate' | 'major' | 'severe'
  estimatedClearTime?: Date
  description: string
  affectedLanes: number
  detourRecommended: boolean
}

class RouteOptimizationService {
  private readonly COLLECTION_REQUESTS = 'routeOptimizationRequests'
  private readonly COLLECTION_ROUTES = 'optimizedRoutes'
  private readonly COLLECTION_TRAFFIC = 'trafficData'
  private readonly COLLECTION_UPDATES = 'routeUpdates'

  /**
   * Optimize route with advanced algorithms
   */
  async optimizeRoute(request: RouteOptimizationRequest): Promise<OptimizedRoute> {
    try {
      // Store the request
      const requestDoc = await addDoc(collection(db, this.COLLECTION_REQUESTS), {
        ...request,
        createdAt: Timestamp.now()
      })

      // Get current traffic data
      const trafficData = await this.getCurrentTrafficData(request)
      
      // Apply route optimization algorithm based on preferences
      const optimizedRoute = await this.calculateOptimalRoute(request, trafficData)
      
      // Generate alternative routes
      const alternatives = await this.generateAlternativeRoutes(request, optimizedRoute)
      
      // Calculate optimization metrics
      const optimizationScore = this.calculateOptimizationScore(optimizedRoute, request)

      const result: OptimizedRoute = {
        requestId: requestDoc.id,
        routePoints: optimizedRoute.routePoints,
        segments: optimizedRoute.segments,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: optimizedRoute.totalDuration,
        totalFuelConsumption: optimizedRoute.totalFuelConsumption,
        carbonEmissions: optimizedRoute.carbonEmissions,
        estimatedCost: optimizedRoute.estimatedCost,
        trafficDelay: optimizedRoute.trafficDelay,
        optimizationScore,
        alternativeRoutes: alternatives,
        realTimeUpdates: [],
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      }

      // Store the optimized route
      const routeDoc = await addDoc(collection(db, this.COLLECTION_ROUTES), result)
      return { ...result, id: routeDoc.id }
    } catch (error) {
      console.error('Error optimizing route:', error)
      throw new Error('Failed to optimize route')
    }
  }  /**
   
* Get real-time route updates
   */
  async getRouteUpdates(routeId: string): Promise<RouteUpdate[]> {
    try {
      const updatesQuery = query(
        collection(db, this.COLLECTION_UPDATES),
        where('routeId', '==', routeId),
        orderBy('timestamp', 'desc'),
        limit(10)
      )

      const snapshot = await getDocs(updatesQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RouteUpdate[]
    } catch (error) {
      console.error('Error getting route updates:', error)
      return []
    }
  }

  /**
   * Update route based on real-time conditions
   */
  async updateRouteRealTime(routeId: string): Promise<OptimizedRoute> {
    try {
      const routeDoc = await getDoc(doc(db, this.COLLECTION_ROUTES, routeId))
      if (!routeDoc.exists()) {
        throw new Error('Route not found')
      }

      const currentRoute = { id: routeDoc.id, ...routeDoc.data() } as OptimizedRoute
      
      // Get latest traffic data
      const trafficData = await this.getCurrentTrafficData({
        startLocation: currentRoute.routePoints[0].coordinates,
        waypoints: currentRoute.routePoints.slice(1, -1),
        preferences: { routeType: 'fastest', avoidTolls: false, avoidHighways: false, avoidTraffic: true, maxDetourTime: 15, fuelEfficiency: false, carbonOptimized: false },
        constraints: { maxTotalTime: 120, maxTotalDistance: 100, vehicleType: 'car', driverBreakRequired: false, timeWindows: false }
      } as RouteOptimizationRequest)

      // Check if route needs updating
      const needsUpdate = this.checkIfRouteNeedsUpdate(currentRoute, trafficData)
      
      if (needsUpdate) {
        // Recalculate route with current conditions
        const updatedRoute = await this.calculateOptimalRoute({
          startLocation: currentRoute.routePoints[0].coordinates,
          waypoints: currentRoute.routePoints.slice(1, -1),
          preferences: { routeType: 'fastest', avoidTolls: false, avoidHighways: false, avoidTraffic: true, maxDetourTime: 15, fuelEfficiency: false, carbonOptimized: false },
          constraints: { maxTotalTime: 120, maxTotalDistance: 100, vehicleType: 'car', driverBreakRequired: false, timeWindows: false }
        } as RouteOptimizationRequest, trafficData)

        // Update the stored route
        await updateDoc(doc(db, this.COLLECTION_ROUTES, routeId), {
          ...updatedRoute,
          lastUpdated: Timestamp.now()
        })

        return { ...updatedRoute, id: routeId }
      }

      return currentRoute
    } catch (error) {
      console.error('Error updating route:', error)
      throw new Error('Failed to update route')
    }
  }

  /**
   * Calculate multi-stop route with time windows
   */
  async calculateMultiStopRoute(
    startLocation: GeoPoint,
    stops: RoutePoint[],
    preferences: any
  ): Promise<RoutePoint[]> {
    try {
      // Sort stops by priority and time windows
      const sortedStops = this.sortStopsByPriorityAndTime(stops)
      
      // Apply Traveling Salesman Problem (TSP) optimization
      const optimizedOrder = await this.solveTSP(startLocation, sortedStops, preferences)
      
      // Validate time windows
      const validatedRoute = this.validateTimeWindows(optimizedOrder)
      
      return validatedRoute
    } catch (error) {
      console.error('Error calculating multi-stop route:', error)
      throw new Error('Failed to calculate multi-stop route')
    }
  }

  /**
   * Private helper methods
   */
  private async getCurrentTrafficData(request: RouteOptimizationRequest): Promise<TrafficData[]> {
    // Mock traffic data - in real implementation, integrate with traffic APIs
    return [
      {
        segmentId: 'segment_1',
        currentSpeed: 45,
        averageSpeed: 60,
        congestionLevel: 0.3,
        incidents: [],
        predictedConditions: {
          nextHour: 0.4,
          nextTwoHours: 0.2,
          nextFourHours: 0.1
        }
      }
    ]
  }

  private async calculateOptimalRoute(
    request: RouteOptimizationRequest,
    trafficData: TrafficData[]
  ): Promise<OptimizedRoute> {
    // Simplified route calculation - in real implementation, use advanced routing algorithms
    const routePoints = [
      {
        id: 'start',
        coordinates: request.startLocation,
        address: 'Start Location',
        type: 'pickup' as const,
        priority: 'high' as const,
        estimatedDuration: 0
      },
      ...request.waypoints,
      ...(request.endLocation ? [{
        id: 'end',
        coordinates: request.endLocation,
        address: 'End Location',
        type: 'dropoff' as const,
        priority: 'high' as const,
        estimatedDuration: 0
      }] : [])
    ]

    // Calculate route segments
    const segments: RouteSegment[] = []
    let totalDistance = 0
    let totalDuration = 0
    let totalFuelConsumption = 0
    let carbonEmissions = 0
    let trafficDelay = 0

    for (let i = 0; i < routePoints.length - 1; i++) {
      const fromPoint = routePoints[i]
      const toPoint = routePoints[i + 1]
      
      const distance = this.calculateDistance(fromPoint.coordinates, toPoint.coordinates)
      const baseDuration = (distance / 50) * 60 // Assume 50 km/h average speed
      
      // Apply traffic adjustments
      const trafficMultiplier = this.getTrafficMultiplier(trafficData, i)
      const duration = baseDuration * trafficMultiplier
      
      // Calculate fuel consumption based on vehicle type and route preferences
      const fuelConsumption = this.calculateFuelConsumption(
        distance, 
        request.constraints.vehicleType,
        request.preferences.fuelEfficiency
      )
      
      // Calculate carbon emissions
      const segmentEmissions = this.calculateCarbonEmissions(fuelConsumption, request.constraints.vehicleType)

      const segment: RouteSegment = {
        id: `segment_${i}`,
        fromPoint,
        toPoint,
        distance,
        duration,
        trafficCondition: this.getTrafficCondition(trafficMultiplier),
        roadType: 'a_road',
        tollRequired: false,
        fuelConsumption,
        carbonEmissions: segmentEmissions,
        instructions: [`Drive ${distance.toFixed(1)}km from ${fromPoint.address} to ${toPoint.address}`],
        coordinates: [fromPoint.coordinates, toPoint.coordinates]
      }

      segments.push(segment)
      totalDistance += distance
      totalDuration += duration
      totalFuelConsumption += fuelConsumption
      carbonEmissions += segmentEmissions
      trafficDelay += duration - baseDuration
    }

    // Apply route type optimizations
    if (request.preferences.routeType === 'eco_friendly') {
      totalFuelConsumption *= 0.85 // 15% fuel savings
      carbonEmissions *= 0.85
      totalDuration *= 1.1 // 10% longer time
    } else if (request.preferences.routeType === 'fastest') {
      totalDuration *= 0.9 // 10% faster
      totalFuelConsumption *= 1.1 // 10% more fuel
    }

    const estimatedCost = this.calculateRouteCost(totalDistance, totalDuration, totalFuelConsumption)

    return {
      routePoints,
      segments,
      totalDistance,
      totalDuration,
      totalFuelConsumption,
      carbonEmissions,
      estimatedCost,
      trafficDelay,
      optimizationScore: 0,
      alternativeRoutes: [],
      realTimeUpdates: [],
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now()
    } as OptimizedRoute
  }

  private async generateAlternativeRoutes(
    request: RouteOptimizationRequest,
    primaryRoute: OptimizedRoute
  ): Promise<AlternativeRoute[]> {
    const alternatives: AlternativeRoute[] = []

    // Generate eco-friendly alternative
    if (request.preferences.routeType !== 'eco_friendly') {
      alternatives.push({
        id: 'eco_alternative',
        description: 'Eco-friendly route with lower emissions',
        totalDistance: primaryRoute.totalDistance * 1.05,
        totalDuration: primaryRoute.totalDuration * 1.1,
        fuelSavings: primaryRoute.totalFuelConsumption * 0.15,
        carbonSavings: primaryRoute.carbonEmissions * 0.15,
        costDifference: -2.50,
        trafficAvoidance: false,
        routePoints: primaryRoute.routePoints
      })
    }

    // Generate fastest alternative
    if (request.preferences.routeType !== 'fastest') {
      alternatives.push({
        id: 'fastest_alternative',
        description: 'Fastest route avoiding traffic',
        totalDistance: primaryRoute.totalDistance * 0.95,
        totalDuration: primaryRoute.totalDuration * 0.85,
        fuelSavings: -primaryRoute.totalFuelConsumption * 0.1,
        carbonSavings: -primaryRoute.carbonEmissions * 0.1,
        costDifference: 1.80,
        trafficAvoidance: true,
        routePoints: primaryRoute.routePoints
      })
    }

    return alternatives
  }

  private calculateOptimizationScore(route: OptimizedRoute, request: RouteOptimizationRequest): number {
    let score = 0.5 // Base score

    // Time efficiency
    const timeEfficiency = Math.max(0, 1 - (route.trafficDelay / route.totalDuration))
    score += timeEfficiency * 0.3

    // Fuel efficiency
    const expectedFuelConsumption = route.totalDistance * 0.08 // 8L/100km baseline
    const fuelEfficiency = Math.max(0, 1 - (route.totalFuelConsumption / expectedFuelConsumption))
    score += fuelEfficiency * 0.2

    // Route preference alignment
    if (request.preferences.routeType === 'eco_friendly' && route.carbonEmissions < expectedFuelConsumption * 2.3) {
      score += 0.2
    } else if (request.preferences.routeType === 'fastest' && route.trafficDelay < route.totalDuration * 0.1) {
      score += 0.2
    }

    // Constraint satisfaction
    if (route.totalDuration <= request.constraints.maxTotalTime) {
      score += 0.1
    }
    if (route.totalDistance <= request.constraints.maxTotalDistance) {
      score += 0.1
    }

    return Math.min(Math.max(score, 0), 1)
  }  p
rivate checkIfRouteNeedsUpdate(route: OptimizedRoute, trafficData: TrafficData[]): boolean {
    // Check if traffic conditions have significantly changed
    for (const segment of route.segments) {
      const trafficInfo = trafficData.find(t => t.segmentId === segment.id)
      if (trafficInfo && trafficInfo.congestionLevel > 0.7) {
        return true
      }
    }
    return false
  }

  private sortStopsByPriorityAndTime(stops: RoutePoint[]): RoutePoint[] {
    return stops.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      // Then sort by time window if available
      if (a.timeWindow && b.timeWindow) {
        return a.timeWindow.earliest.getTime() - b.timeWindow.earliest.getTime()
      }
      
      return 0
    })
  }

  private async solveTSP(
    startLocation: GeoPoint,
    stops: RoutePoint[],
    preferences: any
  ): Promise<RoutePoint[]> {
    // Simplified TSP solution using nearest neighbor heuristic
    const unvisited = [...stops]
    const route: RoutePoint[] = []
    let currentLocation = startLocation

    while (unvisited.length > 0) {
      let nearestIndex = 0
      let nearestDistance = Infinity

      for (let i = 0; i < unvisited.length; i++) {
        const distance = this.calculateDistance(currentLocation, unvisited[i].coordinates)
        
        // Apply priority weighting
        const priorityWeight = unvisited[i].priority === 'critical' ? 0.5 : 
                              unvisited[i].priority === 'high' ? 0.7 :
                              unvisited[i].priority === 'medium' ? 0.9 : 1.0
        
        const weightedDistance = distance * priorityWeight
        
        if (weightedDistance < nearestDistance) {
          nearestDistance = weightedDistance
          nearestIndex = i
        }
      }

      const nextStop = unvisited.splice(nearestIndex, 1)[0]
      route.push(nextStop)
      currentLocation = nextStop.coordinates
    }

    return route
  }

  private validateTimeWindows(route: RoutePoint[]): RoutePoint[] {
    // Validate and adjust route to respect time windows
    let currentTime = new Date()
    
    for (const stop of route) {
      if (stop.timeWindow) {
        if (currentTime < stop.timeWindow.earliest) {
          // Wait until earliest time
          currentTime = new Date(stop.timeWindow.earliest)
        } else if (currentTime > stop.timeWindow.latest) {
          // Time window violation - would need to reschedule or skip
          console.warn(`Time window violation for stop ${stop.id}`)
        }
      }
      
      // Add estimated duration at stop
      currentTime = new Date(currentTime.getTime() + stop.estimatedDuration * 60 * 1000)
    }
    
    return route
  }

  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371 // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180
    const dLng = (point2.longitude - point1.longitude) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private getTrafficMultiplier(trafficData: TrafficData[], segmentIndex: number): number {
    // Simplified traffic multiplier calculation
    const baseMultiplier = 1.0
    const trafficInfo = trafficData[segmentIndex % trafficData.length]
    
    if (trafficInfo) {
      return 1 + trafficInfo.congestionLevel * 0.5 // Up to 50% delay
    }
    
    return baseMultiplier
  }

  private getTrafficCondition(multiplier: number): 'light' | 'moderate' | 'heavy' | 'severe' {
    if (multiplier >= 1.4) return 'severe'
    if (multiplier >= 1.25) return 'heavy'
    if (multiplier >= 1.1) return 'moderate'
    return 'light'
  }

  private calculateFuelConsumption(
    distance: number,
    vehicleType: string,
    fuelEfficient: boolean
  ): number {
    // Base fuel consumption rates (litres/100km) - UK standards
    const baseRates = {
      car: 7.5, // UK average for petrol cars
      van: 11.5, // UK commercial van average
      truck: 28.0, // UK HGV average
      motorcycle: 4.2 // UK motorcycle average
    }
    
    let rate = baseRates[vehicleType as keyof typeof baseRates] || 7.5
    
    if (fuelEfficient) {
      rate *= 0.85 // 15% improvement with eco-driving
    }
    
    return (distance / 100) * rate
  }

  private calculateCarbonEmissions(fuelConsumption: number, vehicleType: string): number {
    // CO2 emissions per liter of fuel (kg CO2/L)
    const emissionFactors = {
      car: 2.31,
      van: 2.31,
      truck: 2.68,
      motorcycle: 2.31
    }
    
    const factor = emissionFactors[vehicleType as keyof typeof emissionFactors] || 2.31
    return fuelConsumption * factor
  }

  private calculateRouteCost(distance: number, duration: number, fuelConsumption: number): number {
    const baseFare = 2.80 // UK base fare in £
    const perKmRate = 1.20 // UK rate per km in £
    const perMinuteRate = 0.20 // UK rate per minute in £
    const fuelCostPerLitre = 1.50 // UK petrol price per litre in £
    
    return baseFare + (distance * perKmRate) + (duration * perMinuteRate) + (fuelConsumption * fuelCostPerLitre)
  }

  /**
   * Get eco-friendly route recommendations
   */
  async getEcoFriendlyRoute(
    startLocation: GeoPoint,
    endLocation: GeoPoint,
    vehicleType: string
  ): Promise<{
    route: OptimizedRoute
    carbonSavings: number
    fuelSavings: number
    costSavings: number
  }> {
    try {
      const ecoRequest: RouteOptimizationRequest = {
        requesterId: 'eco-system',
        startLocation,
        endLocation,
        waypoints: [],
        preferences: {
          routeType: 'eco_friendly',
          avoidTolls: false,
          avoidHighways: false,
          avoidTraffic: true,
          maxDetourTime: 20,
          fuelEfficiency: true,
          carbonOptimized: true
        },
        constraints: {
          maxTotalTime: 180,
          maxTotalDistance: 200,
          vehicleType: vehicleType as any,
          driverBreakRequired: false,
          timeWindows: false
        },
        createdAt: Timestamp.now()
      }

      const ecoRoute = await this.optimizeRoute(ecoRequest)
      
      // Calculate savings compared to standard route
      const standardRequest = { ...ecoRequest, preferences: { ...ecoRequest.preferences, routeType: 'fastest' as const, fuelEfficiency: false, carbonOptimized: false } }
      const standardRoute = await this.optimizeRoute(standardRequest)
      
      const carbonSavings = standardRoute.carbonEmissions - ecoRoute.carbonEmissions
      const fuelSavings = standardRoute.totalFuelConsumption - ecoRoute.totalFuelConsumption
      const costSavings = standardRoute.estimatedCost - ecoRoute.estimatedCost

      return {
        route: ecoRoute,
        carbonSavings,
        fuelSavings,
        costSavings
      }
    } catch (error) {
      console.error('Error getting eco-friendly route:', error)
      throw new Error('Failed to get eco-friendly route')
    }
  }

  /**
   * Get traffic-aware route with real-time adjustments
   */
  async getTrafficAwareRoute(routeId: string): Promise<OptimizedRoute> {
    try {
      return await this.updateRouteRealTime(routeId)
    } catch (error) {
      console.error('Error getting traffic-aware route:', error)
      throw new Error('Failed to get traffic-aware route')
    }
  }
}

export const routeOptimizationService = new RouteOptimizationService()