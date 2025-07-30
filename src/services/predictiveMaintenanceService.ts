/**
 * Predictive Maintenance Service
 * AI-powered vehicle maintenance prediction and fleet optimization for UK operations
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

export interface Vehicle {
  id: string
  registrationNumber: string // UK format: AB12 CDE
  make: string
  model: string
  year: number
  vehicleType: 'car' | 'van' | 'hgv' | 'motorbike'
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  mileage: number // in miles (UK standard)
  lastMOT: Date
  nextMOT: Date
  lastService: Date
  nextService: Date
  insuranceExpiry: Date
  roadTaxExpiry: Date
  driverId?: string
  status: 'active' | 'maintenance' | 'retired' | 'inspection'
  location: GeoPoint
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface MaintenancePrediction {
  id?: string
  vehicleId: string
  predictionType: 'routine_service' | 'brake_pads' | 'tyres' | 'battery' | 'engine' | 'transmission' | 'mot_failure'
  predictedDate: Date
  confidence: number // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost: number // in £
  description: string
  recommendations: string[]
  dataPoints: MaintenanceDataPoint[]
  createdAt: Timestamp
  lastUpdated: Timestamp
}

export interface MaintenanceDataPoint {
  timestamp: Date
  mileage: number
  fuelEfficiency: number // mpg
  engineTemperature: number
  brakeWear: number // percentage
  tyreDepth: number // mm
  batteryVoltage: number
  vibrationLevel: number
  oilPressure: number
  diagnosticCodes: string[]
}

export interface FleetOptimization {
  id?: string
  fleetId: string
  optimizationType: 'utilization' | 'maintenance_scheduling' | 'driver_assignment' | 'route_efficiency'
  recommendations: OptimizationRecommendation[]
  potentialSavings: number // £ per month
  implementationEffort: 'low' | 'medium' | 'high'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Timestamp
  validUntil: Date
}

export interface OptimizationRecommendation {
  id: string
  title: string
  description: string
  impact: string
  actionRequired: string
  estimatedSavings: number // £
  timeToImplement: number // days
  riskLevel: 'low' | 'medium' | 'high'
}

export interface DriverPerformanceMetrics {
  driverId: string
  period: 'daily' | 'weekly' | 'monthly'
  startDate: Date
  endDate: Date
  totalMiles: number
  totalTrips: number
  averageRating: number
  fuelEfficiency: number // mpg
  safetyScore: number // 0-100
  punctualityScore: number // 0-100
  vehicleWearScore: number // 0-100 (lower is better)
  maintenanceEvents: number
  earnings: number // £
  hoursWorked: number
  idleTime: number // minutes
  harshBraking: number
  harshAcceleration: number
  speedingIncidents: number
}

export interface FleetUtilizationMetrics {
  fleetId: string
  period: 'daily' | 'weekly' | 'monthly'
  totalVehicles: number
  activeVehicles: number
  utilizationRate: number // percentage
  averageMilesPerVehicle: number
  revenuePerVehicle: number // £
  maintenanceCostPerVehicle: number // £
  fuelCostPerVehicle: number // £
  profitPerVehicle: number // £
  downtime: number // hours
  peakUtilizationHours: string[]
  underutilizedVehicles: string[]
  overutilizedVehicles: string[]
}

class PredictiveMaintenanceService {
  private readonly COLLECTION_VEHICLES = 'vehicles'
  private readonly COLLECTION_PREDICTIONS = 'maintenancePredictions'
  private readonly COLLECTION_OPTIMIZATIONS = 'fleetOptimizations'
  private readonly COLLECTION_PERFORMANCE = 'driverPerformance'
  private readonly COLLECTION_UTILIZATION = 'fleetUtilization'

  /**
   * Predict vehicle maintenance needs using ML algorithms
   */
  async predictMaintenanceNeeds(vehicleId: string): Promise<MaintenancePrediction[]> {
    try {
      const vehicle = await this.getVehicle(vehicleId)
      if (!vehicle) {
        throw new Error('Vehicle not found')
      }

      const historicalData = await this.getVehicleHistoricalData(vehicleId)
      const predictions: MaintenancePrediction[] = []

      // Predict routine service based on mileage and time
      const serviceInterval = this.getServiceInterval(vehicle.vehicleType, vehicle.fuelType)
      const milesSinceLastService = vehicle.mileage - this.getMileageAtLastService(vehicleId)
      
      if (milesSinceLastService > serviceInterval * 0.8) {
        predictions.push({
          vehicleId,
          predictionType: 'routine_service',
          predictedDate: this.calculateServiceDate(vehicle, milesSinceLastService, serviceInterval),
          confidence: 0.95,
          severity: milesSinceLastService > serviceInterval ? 'high' : 'medium',
          estimatedCost: this.getServiceCost(vehicle.vehicleType),
          description: `Routine service due based on mileage (${milesSinceLastService.toLocaleString()} miles since last service)`,
          recommendations: [
            'Schedule service appointment',
            'Check oil and filters',
            'Inspect brakes and tyres',
            'Update service records'
          ],
          dataPoints: historicalData,
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now()
        })
      }

      // Predict brake pad replacement
      const brakeWearPrediction = this.predictBrakeWear(historicalData, vehicle)
      if (brakeWearPrediction.confidence > 0.7) {
        predictions.push(brakeWearPrediction)
      }

      // Predict tyre replacement
      const tyrePrediction = this.predictTyreReplacement(historicalData, vehicle)
      if (tyrePrediction.confidence > 0.6) {
        predictions.push(tyrePrediction)
      }

      // Predict MOT failure risk
      const motPrediction = this.predictMOTFailureRisk(vehicle, historicalData)
      if (motPrediction.confidence > 0.5) {
        predictions.push(motPrediction)
      }

      // Store predictions
      for (const prediction of predictions) {
        const docRef = await addDoc(collection(db, this.COLLECTION_PREDICTIONS), prediction)
        prediction.id = docRef.id
      }

      return predictions
    } catch (error) {
      console.error('Error predicting maintenance needs:', error)
      throw new Error('Failed to predict maintenance needs')
    }
  }

  /**
   * Optimize fleet utilization and performance
   */
  async optimizeFleetUtilization(fleetId: string): Promise<FleetOptimization> {
    try {
      const utilizationMetrics = await this.getFleetUtilizationMetrics(fleetId)
      const driverMetrics = await this.getFleetDriverMetrics(fleetId)
      const vehicles = await this.getFleetVehicles(fleetId)

      const recommendations: OptimizationRecommendation[] = []
      let totalPotentialSavings = 0

      // Analyze underutilized vehicles
      if (utilizationMetrics.underutilizedVehicles.length > 0) {
        const savings = utilizationMetrics.underutilizedVehicles.length * 150 // £150 per vehicle per month
        recommendations.push({
          id: 'underutilized_vehicles',
          title: 'Optimize Underutilized Vehicles',
          description: `${utilizationMetrics.underutilizedVehicles.length} vehicles are underutilized (< 60% capacity)`,
          impact: 'Reduce operational costs and improve ROI',
          actionRequired: 'Reassign vehicles to high-demand areas or consider fleet reduction',
          estimatedSavings: savings,
          timeToImplement: 7,
          riskLevel: 'low'
        })
        totalPotentialSavings += savings
      }

      // Analyze maintenance scheduling optimization
      const maintenanceOptimization = await this.optimizeMaintenanceScheduling(fleetId)
      if (maintenanceOptimization.estimatedSavings > 0) {
        recommendations.push(maintenanceOptimization)
        totalPotentialSavings += maintenanceOptimization.estimatedSavings
      }

      // Analyze driver performance optimization
      const driverOptimization = this.optimizeDriverPerformance(driverMetrics)
      if (driverOptimization.estimatedSavings > 0) {
        recommendations.push(driverOptimization)
        totalPotentialSavings += driverOptimization.estimatedSavings
      }

      // Analyze fuel efficiency optimization
      const fuelOptimization = this.optimizeFuelEfficiency(vehicles, driverMetrics)
      if (fuelOptimization.estimatedSavings > 0) {
        recommendations.push(fuelOptimization)
        totalPotentialSavings += fuelOptimization.estimatedSavings
      }

      const optimization: FleetOptimization = {
        fleetId,
        optimizationType: 'utilization',
        recommendations,
        potentialSavings: totalPotentialSavings,
        implementationEffort: this.calculateImplementationEffort(recommendations),
        priority: totalPotentialSavings > 1000 ? 'high' : totalPotentialSavings > 500 ? 'medium' : 'low',
        createdAt: Timestamp.now(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Valid for 30 days
      }

      // Store optimization
      const docRef = await addDoc(collection(db, this.COLLECTION_OPTIMIZATIONS), optimization)
      optimization.id = docRef.id

      return optimization
    } catch (error) {
      console.error('Error optimizing fleet utilization:', error)
      throw new Error('Failed to optimize fleet utilization')
    }
  }

  /**
   * Generate driver performance optimization suggestions
   */
  async generateDriverOptimizationSuggestions(driverId: string): Promise<OptimizationRecommendation[]> {
    try {
      const metrics = await this.getDriverPerformanceMetrics(driverId)
      const suggestions: OptimizationRecommendation[] = []

      // Fuel efficiency optimization
      if (metrics.fuelEfficiency < 35) { // Below 35 mpg
        suggestions.push({
          id: 'fuel_efficiency',
          title: 'Improve Fuel Efficiency',
          description: `Current fuel efficiency: ${metrics.fuelEfficiency.toFixed(1)} mpg (below target of 35 mpg)`,
          impact: 'Reduce fuel costs and environmental impact',
          actionRequired: 'Provide eco-driving training and monitor driving patterns',
          estimatedSavings: this.calculateFuelSavings(metrics.fuelEfficiency, metrics.totalMiles),
          timeToImplement: 14,
          riskLevel: 'low'
        })
      }

      // Safety score improvement
      if (metrics.safetyScore < 80) {
        suggestions.push({
          id: 'safety_improvement',
          title: 'Enhance Safety Performance',
          description: `Safety score: ${metrics.safetyScore}/100 (below target of 80)`,
          impact: 'Reduce insurance costs and improve passenger safety',
          actionRequired: 'Provide defensive driving training and monitor harsh driving events',
          estimatedSavings: 200, // £200 per month in reduced insurance premiums
          timeToImplement: 21,
          riskLevel: 'medium'
        })
      }

      // Punctuality improvement
      if (metrics.punctualityScore < 85) {
        suggestions.push({
          id: 'punctuality_improvement',
          title: 'Improve Punctuality',
          description: `Punctuality score: ${metrics.punctualityScore}/100 (below target of 85)`,
          impact: 'Increase customer satisfaction and reduce cancellations',
          actionRequired: 'Provide time management training and route optimization guidance',
          estimatedSavings: 150, // £150 per month in improved customer retention
          timeToImplement: 7,
          riskLevel: 'low'
        })
      }

      // Vehicle wear optimization
      if (metrics.vehicleWearScore > 70) {
        suggestions.push({
          id: 'vehicle_wear_reduction',
          title: 'Reduce Vehicle Wear',
          description: `Vehicle wear score: ${metrics.vehicleWearScore}/100 (above target of 70)`,
          impact: 'Reduce maintenance costs and extend vehicle lifespan',
          actionRequired: 'Provide gentle driving techniques training',
          estimatedSavings: this.calculateMaintenanceSavings(metrics.vehicleWearScore),
          timeToImplement: 14,
          riskLevel: 'low'
        })
      }

      return suggestions
    } catch (error) {
      console.error('Error generating driver optimization suggestions:', error)
      throw new Error('Failed to generate driver optimization suggestions')
    }
  }

  /**
   * Get comprehensive fleet analytics
   */
  async getFleetAnalytics(fleetId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<{
    utilization: FleetUtilizationMetrics
    predictions: MaintenancePrediction[]
    optimizations: FleetOptimization[]
    driverPerformance: DriverPerformanceMetrics[]
  }> {
    try {
      const [utilization, predictions, optimizations, driverPerformance] = await Promise.all([
        this.getFleetUtilizationMetrics(fleetId, period),
        this.getFleetMaintenancePredictions(fleetId),
        this.getFleetOptimizations(fleetId),
        this.getFleetDriverMetrics(fleetId, period)
      ])

      return {
        utilization,
        predictions,
        optimizations,
        driverPerformance
      }
    } catch (error) {
      console.error('Error getting fleet analytics:', error)
      throw new Error('Failed to get fleet analytics')
    }
  }

  /**
   * Private helper methods
   */
  private async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    try {
      const docRef = doc(db, this.COLLECTION_VEHICLES, vehicleId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Vehicle
      }
      return null
    } catch (error) {
      console.error('Error getting vehicle:', error)
      return null
    }
  }

  private async getVehicleHistoricalData(vehicleId: string): Promise<MaintenanceDataPoint[]> {
    // Mock historical data - in real implementation, this would come from vehicle telematics
    const now = new Date()
    const dataPoints: MaintenanceDataPoint[] = []
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dataPoints.push({
        timestamp: date,
        mileage: 45000 + (30 - i) * 50, // Increasing mileage
        fuelEfficiency: 32 + Math.random() * 6, // 32-38 mpg
        engineTemperature: 85 + Math.random() * 10, // 85-95°C
        brakeWear: 30 + Math.random() * 20, // 30-50% wear
        tyreDepth: 3.5 - Math.random() * 1.5, // 2-3.5mm
        batteryVoltage: 12.2 + Math.random() * 0.6, // 12.2-12.8V
        vibrationLevel: Math.random() * 5, // 0-5 units
        oilPressure: 25 + Math.random() * 10, // 25-35 psi
        diagnosticCodes: Math.random() > 0.9 ? ['P0171', 'P0174'] : []
      })
    }
    
    return dataPoints
  }

  private getServiceInterval(vehicleType: string, fuelType: string): number {
    // UK service intervals in miles
    const intervals = {
      car: { petrol: 10000, diesel: 12000, electric: 15000, hybrid: 10000 },
      van: { petrol: 8000, diesel: 10000, electric: 12000, hybrid: 8000 },
      hgv: { petrol: 6000, diesel: 8000, electric: 10000, hybrid: 6000 },
      motorbike: { petrol: 6000, diesel: 8000, electric: 8000, hybrid: 6000 }
    }
    
    return intervals[vehicleType as keyof typeof intervals]?.[fuelType as keyof typeof intervals.car] || 10000
  }

  private getMileageAtLastService(vehicleId: string): number {
    // Mock data - in real implementation, get from service records
    return 35000
  }

  private calculateServiceDate(vehicle: Vehicle, milesSinceService: number, serviceInterval: number): Date {
    const milesOverdue = milesSinceService - serviceInterval
    const averageMilesPerDay = 50 // UK average for taxi
    
    if (milesOverdue > 0) {
      return new Date() // Overdue - schedule immediately
    } else {
      const daysUntilService = (serviceInterval - milesSinceService) / averageMilesPerDay
      return new Date(Date.now() + daysUntilService * 24 * 60 * 60 * 1000)
    }
  }

  private getServiceCost(vehicleType: string): number {
    // UK service costs in £
    const costs = {
      car: 150,
      van: 200,
      hgv: 400,
      motorbike: 100
    }
    return costs[vehicleType as keyof typeof costs] || 150
  }

  private predictBrakeWear(historicalData: MaintenanceDataPoint[], vehicle: Vehicle): MaintenancePrediction {
    const latestData = historicalData[historicalData.length - 1]
    const averageWear = historicalData.reduce((sum, point) => sum + point.brakeWear, 0) / historicalData.length
    
    const daysUntilReplacement = Math.max(0, (80 - averageWear) * 2) // Estimate based on wear rate
    const predictedDate = new Date(Date.now() + daysUntilReplacement * 24 * 60 * 60 * 1000)
    
    return {
      vehicleId: vehicle.id,
      predictionType: 'brake_pads',
      predictedDate,
      confidence: averageWear > 60 ? 0.8 : 0.6,
      severity: averageWear > 70 ? 'high' : averageWear > 50 ? 'medium' : 'low',
      estimatedCost: vehicle.vehicleType === 'hgv' ? 300 : 120,
      description: `Brake pads showing ${averageWear.toFixed(1)}% wear`,
      recommendations: [
        'Schedule brake inspection',
        'Monitor braking performance',
        'Check brake fluid levels',
        'Consider replacement if wear exceeds 80%'
      ],
      dataPoints: historicalData,
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now()
    }
  }

  private predictTyreReplacement(historicalData: MaintenanceDataPoint[], vehicle: Vehicle): MaintenancePrediction {
    const latestData = historicalData[historicalData.length - 1]
    const averageDepth = historicalData.reduce((sum, point) => sum + point.tyreDepth, 0) / historicalData.length
    
    const daysUntilReplacement = Math.max(0, (averageDepth - 1.6) * 30) // UK legal limit is 1.6mm
    const predictedDate = new Date(Date.now() + daysUntilReplacement * 24 * 60 * 60 * 1000)
    
    return {
      vehicleId: vehicle.id,
      predictionType: 'tyres',
      predictedDate,
      confidence: averageDepth < 3 ? 0.9 : 0.6,
      severity: averageDepth < 2 ? 'critical' : averageDepth < 2.5 ? 'high' : 'medium',
      estimatedCost: vehicle.vehicleType === 'hgv' ? 800 : vehicle.vehicleType === 'van' ? 400 : 300,
      description: `Tyre depth averaging ${averageDepth.toFixed(1)}mm (legal limit: 1.6mm)`,
      recommendations: [
        'Check tyre pressures regularly',
        'Rotate tyres for even wear',
        'Schedule replacement before reaching legal limit',
        'Consider premium tyres for better longevity'
      ],
      dataPoints: historicalData,
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now()
    }
  }

  private predictMOTFailureRisk(vehicle: Vehicle, historicalData: MaintenanceDataPoint[]): MaintenancePrediction {
    const daysSinceMOT = Math.floor((Date.now() - vehicle.lastMOT.getTime()) / (24 * 60 * 60 * 1000))
    const daysUntilMOT = Math.floor((vehicle.nextMOT.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    
    // Calculate risk factors
    let riskScore = 0
    const latestData = historicalData[historicalData.length - 1]
    
    if (latestData.tyreDepth < 2.5) riskScore += 0.3
    if (latestData.brakeWear > 60) riskScore += 0.2
    if (latestData.diagnosticCodes.length > 0) riskScore += 0.3
    if (vehicle.year < 2015) riskScore += 0.2
    
    const confidence = Math.min(riskScore, 0.9)
    
    return {
      vehicleId: vehicle.id,
      predictionType: 'mot_failure',
      predictedDate: vehicle.nextMOT,
      confidence,
      severity: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
      estimatedCost: 200, // Average cost to fix MOT failures
      description: `MOT failure risk: ${Math.round(riskScore * 100)}% based on vehicle condition`,
      recommendations: [
        'Pre-MOT inspection recommended',
        'Address any diagnostic codes',
        'Check tyres and brakes',
        'Service vehicle before MOT if due'
      ],
      dataPoints: historicalData,
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now()
    }
  }

  private async getFleetUtilizationMetrics(fleetId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<FleetUtilizationMetrics> {
    // Mock data - in real implementation, calculate from actual fleet data
    return {
      fleetId,
      period,
      totalVehicles: 25,
      activeVehicles: 22,
      utilizationRate: 78.5,
      averageMilesPerVehicle: 1200,
      revenuePerVehicle: 2800,
      maintenanceCostPerVehicle: 180,
      fuelCostPerVehicle: 420,
      profitPerVehicle: 2200,
      downtime: 48,
      peakUtilizationHours: ['07:00-09:00', '17:00-19:00', '22:00-02:00'],
      underutilizedVehicles: ['VH001', 'VH007', 'VH015'],
      overutilizedVehicles: ['VH003', 'VH012', 'VH018']
    }
  }

  private async getFleetDriverMetrics(fleetId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<DriverPerformanceMetrics[]> {
    // Mock data - in real implementation, get from driver performance tracking
    return [
      {
        driverId: 'DR001',
        period,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        totalMiles: 1500,
        totalTrips: 180,
        averageRating: 4.7,
        fuelEfficiency: 34.2,
        safetyScore: 85,
        punctualityScore: 92,
        vehicleWearScore: 45,
        maintenanceEvents: 1,
        earnings: 3200,
        hoursWorked: 160,
        idleTime: 240,
        harshBraking: 12,
        harshAcceleration: 8,
        speedingIncidents: 2
      }
    ]
  }

  private async getFleetVehicles(fleetId: string): Promise<Vehicle[]> {
    // Mock data - in real implementation, query vehicles by fleet
    return []
  }

  private async optimizeMaintenanceScheduling(fleetId: string): Promise<OptimizationRecommendation> {
    return {
      id: 'maintenance_scheduling',
      title: 'Optimize Maintenance Scheduling',
      description: 'Coordinate maintenance schedules to minimize fleet downtime',
      impact: 'Reduce downtime by 25% through better scheduling',
      actionRequired: 'Implement predictive maintenance scheduling system',
      estimatedSavings: 800,
      timeToImplement: 14,
      riskLevel: 'low'
    }
  }

  private optimizeDriverPerformance(driverMetrics: DriverPerformanceMetrics[]): OptimizationRecommendation {
    const lowPerformers = driverMetrics.filter(d => d.safetyScore < 80 || d.fuelEfficiency < 30)
    
    return {
      id: 'driver_performance',
      title: 'Improve Driver Performance',
      description: `${lowPerformers.length} drivers below performance targets`,
      impact: 'Reduce costs and improve service quality',
      actionRequired: 'Provide targeted training and performance monitoring',
      estimatedSavings: lowPerformers.length * 200,
      timeToImplement: 21,
      riskLevel: 'medium'
    }
  }

  private optimizeFuelEfficiency(vehicles: Vehicle[], driverMetrics: DriverPerformanceMetrics[]): OptimizationRecommendation {
    const avgEfficiency = driverMetrics.reduce((sum, d) => sum + d.fuelEfficiency, 0) / driverMetrics.length
    const potentialImprovement = Math.max(0, 35 - avgEfficiency) // Target 35 mpg
    
    return {
      id: 'fuel_efficiency',
      title: 'Improve Fleet Fuel Efficiency',
      description: `Current average: ${avgEfficiency.toFixed(1)} mpg (target: 35 mpg)`,
      impact: 'Reduce fuel costs across entire fleet',
      actionRequired: 'Implement eco-driving training and vehicle maintenance',
      estimatedSavings: Math.round(potentialImprovement * 50 * vehicles.length), // £50 per mpg improvement per vehicle
      timeToImplement: 30,
      riskLevel: 'low'
    }
  }

  private calculateImplementationEffort(recommendations: OptimizationRecommendation[]): 'low' | 'medium' | 'high' {
    const avgTime = recommendations.reduce((sum, r) => sum + r.timeToImplement, 0) / recommendations.length
    
    if (avgTime <= 7) return 'low'
    if (avgTime <= 21) return 'medium'
    return 'high'
  }

  private async getDriverPerformanceMetrics(driverId: string): Promise<DriverPerformanceMetrics> {
    // Mock data - in real implementation, get from driver tracking
    return {
      driverId,
      period: 'monthly',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      totalMiles: 1200,
      totalTrips: 150,
      averageRating: 4.5,
      fuelEfficiency: 32.5,
      safetyScore: 75,
      punctualityScore: 82,
      vehicleWearScore: 65,
      maintenanceEvents: 2,
      earnings: 2800,
      hoursWorked: 140,
      idleTime: 180,
      harshBraking: 15,
      harshAcceleration: 10,
      speedingIncidents: 3
    }
  }

  private calculateFuelSavings(currentEfficiency: number, totalMiles: number): number {
    const targetEfficiency = 35 // mpg
    const improvement = targetEfficiency - currentEfficiency
    const fuelPricePerLitre = 1.50 // £
    const litresPerGallon = 4.546
    
    if (improvement <= 0) return 0
    
    const currentGallons = totalMiles / currentEfficiency
    const targetGallons = totalMiles / targetEfficiency
    const gallonsSaved = currentGallons - targetGallons
    
    return gallonsSaved * litresPerGallon * fuelPricePerLitre
  }

  private calculateMaintenanceSavings(wearScore: number): number {
    const excessWear = Math.max(0, wearScore - 70)
    return excessWear * 5 // £5 per point above target
  }

  private async getFleetMaintenancePredictions(fleetId: string): Promise<MaintenancePrediction[]> {
    // Mock data - in real implementation, get predictions for all fleet vehicles
    return []
  }

  private async getFleetOptimizations(fleetId: string): Promise<FleetOptimization[]> {
    // Mock data - in real implementation, get existing optimizations
    return []
  }
}

export const predictiveMaintenanceService = new PredictiveMaintenanceService()