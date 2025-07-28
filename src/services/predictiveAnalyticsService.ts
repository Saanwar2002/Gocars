/**
 * Predictive Analytics Service
 * Handles demand forecasting, dynamic pricing, and driver positioning recommendations
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

export interface DemandPrediction {
  id?: string
  location: GeoPoint
  locationName: string
  timeSlot: {
    date: string
    hour: number
    dayOfWeek: number
  }
  predictedDemand: number
  confidence: number
  factors: {
    historical: number
    weather: number
    events: number
    seasonal: number
    trends: number
  }
  actualDemand?: number
  accuracy?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PricingRecommendation {
  id?: string
  location: GeoPoint
  timeSlot: {
    date: string
    hour: number
  }
  baseFare: number
  surgeMultiplier: number
  recommendedPrice: number
  demandLevel: 'low' | 'medium' | 'high' | 'surge'
  reasoning: string
  expectedRevenue: number
  competitorPricing?: number
  elasticity: number
  createdAt: Timestamp
}

export interface DriverPositioningRecommendation {
  id?: string
  driverId: string
  currentLocation: GeoPoint
  recommendedLocation: GeoPoint
  recommendedLocationName: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  expectedWaitTime: number
  expectedEarnings: number
  reasoning: string
  confidence: number
  validUntil: Timestamp
  createdAt: Timestamp
}ex
port interface MarketAnalytics {
  location: GeoPoint
  timeRange: {
    start: Timestamp
    end: Timestamp
  }
  metrics: {
    totalRides: number
    averageWaitTime: number
    averageFare: number
    driverUtilization: number
    customerSatisfaction: number
    cancellationRate: number
  }
  trends: {
    demandGrowth: number
    priceElasticity: number
    seasonalVariation: number
  }
  predictions: {
    nextHourDemand: number
    nextDayDemand: number
    nextWeekDemand: number
  }
}

export interface SurgePricingConfig {
  id?: string
  location: GeoPoint
  isActive: boolean
  thresholds: {
    lowDemand: number
    mediumDemand: number
    highDemand: number
    surgeDemand: number
  }
  multipliers: {
    low: number
    medium: number
    high: number
    surge: number
  }
  maxSurgeMultiplier: number
  cooldownPeriod: number // minutes
  lastSurgeTime?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

class PredictiveAnalyticsService {
  private readonly COLLECTION_PREDICTIONS = 'demandPredictions'
  private readonly COLLECTION_PRICING = 'pricingRecommendations'
  private readonly COLLECTION_POSITIONING = 'driverPositioning'
  private readonly COLLECTION_SURGE_CONFIG = 'surgePricingConfig'
  private readonly COLLECTION_ANALYTICS = 'marketAnalytics'

  /**
   * Generate demand predictions for specific location and time
   */
  async generateDemandPrediction(
    location: GeoPoint, 
    locationName: string, 
    targetTime: Date
  ): Promise<DemandPrediction> {
    try {
      const timeSlot = {
        date: targetTime.toISOString().split('T')[0],
        hour: targetTime.getHours(),
        dayOfWeek: targetTime.getDay()
      }

      // Get historical data for this location and time pattern
      const historicalData = await this.getHistoricalDemand(location, timeSlot)
      
      // Calculate prediction factors
      const factors = await this.calculatePredictionFactors(location, targetTime)
      
      // Apply machine learning model (simplified)
      const baseDemand = this.calculateBaseDemand(historicalData, timeSlot)
      const adjustedDemand = this.applyFactorAdjustments(baseDemand, factors)
      
      // Calculate confidence based on data quality
      const confidence = this.calculatePredictionConfidence(historicalData, factors)

      const prediction: DemandPrediction = {
        location,
        locationName,
        timeSlot,
        predictedDemand: Math.max(0, adjustedDemand),
        confidence,
        factors,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Store prediction
      const docRef = await addDoc(collection(db, this.COLLECTION_PREDICTIONS), prediction)
      return { ...prediction, id: docRef.id }
    } catch (error) {
      console.error('Error generating demand prediction:', error)
      throw new Error('Failed to generate demand prediction')
    }
  } 
 /**
   * Generate dynamic pricing recommendations
   */
  async generatePricingRecommendation(
    location: GeoPoint,
    targetTime: Date
  ): Promise<PricingRecommendation> {
    try {
      // Get demand prediction for this location and time
      const demandPrediction = await this.generateDemandPrediction(
        location, 
        'Location', 
        targetTime
      )

      // Get surge pricing configuration
      const surgeConfig = await this.getSurgePricingConfig(location)
      
      // Calculate base fare
      const baseFare = 3.50 // Base fare in GBP
      
      // Determine demand level and surge multiplier
      const { demandLevel, surgeMultiplier } = this.calculateSurgeMultiplier(
        demandPrediction.predictedDemand,
        surgeConfig
      )

      // Calculate recommended price
      const recommendedPrice = baseFare * surgeMultiplier
      
      // Get competitor pricing (mock data)
      const competitorPricing = await this.getCompetitorPricing(location)
      
      // Calculate price elasticity
      const elasticity = await this.calculatePriceElasticity(location, demandPrediction.predictedDemand)
      
      // Calculate expected revenue
      const expectedRevenue = this.calculateExpectedRevenue(
        recommendedPrice,
        demandPrediction.predictedDemand,
        elasticity
      )

      // Generate reasoning
      const reasoning = this.generatePricingReasoning(
        demandLevel,
        surgeMultiplier,
        demandPrediction,
        competitorPricing
      )

      const recommendation: PricingRecommendation = {
        location,
        timeSlot: {
          date: targetTime.toISOString().split('T')[0],
          hour: targetTime.getHours()
        },
        baseFare,
        surgeMultiplier,
        recommendedPrice,
        demandLevel,
        reasoning,
        expectedRevenue,
        competitorPricing,
        elasticity,
        createdAt: Timestamp.now()
      }

      // Store recommendation
      const docRef = await addDoc(collection(db, this.COLLECTION_PRICING), recommendation)
      return { ...recommendation, id: docRef.id }
    } catch (error) {
      console.error('Error generating pricing recommendation:', error)
      throw new Error('Failed to generate pricing recommendation')
    }
  }

  /**
   * Generate driver positioning recommendations
   */
  async generateDriverPositioningRecommendations(
    driverId: string,
    currentLocation: GeoPoint
  ): Promise<DriverPositioningRecommendation[]> {
    try {
      // Get nearby high-demand areas
      const highDemandAreas = await this.getHighDemandAreas(currentLocation, 10) // 10km radius
      
      const recommendations: DriverPositioningRecommendation[] = []

      for (const area of highDemandAreas) {
        // Calculate expected wait time and earnings
        const expectedWaitTime = await this.calculateExpectedWaitTime(area.location, area.demand)
        const expectedEarnings = await this.calculateExpectedEarnings(area.location, area.demand)
        
        // Calculate travel time to recommended location
        const travelTime = this.calculateTravelTime(currentLocation, area.location)
        
        // Determine priority based on earnings potential and travel time
        const priority = this.calculatePositioningPriority(
          expectedEarnings,
          expectedWaitTime,
          travelTime
        )

        // Calculate confidence based on prediction accuracy
        const confidence = area.confidence || 0.7

        // Generate reasoning
        const reasoning = this.generatePositioningReasoning(
          area,
          expectedWaitTime,
          expectedEarnings,
          travelTime
        )

        const recommendation: DriverPositioningRecommendation = {
          driverId,
          currentLocation,
          recommendedLocation: area.location,
          recommendedLocationName: area.name,
          priority,
          expectedWaitTime,
          expectedEarnings,
          reasoning,
          confidence,
          validUntil: Timestamp.fromMillis(Date.now() + 30 * 60 * 1000), // Valid for 30 minutes
          createdAt: Timestamp.now()
        }

        recommendations.push(recommendation)
      }

      // Sort by priority and expected earnings
      recommendations.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority]
        const bPriority = priorityOrder[b.priority]
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        return b.expectedEarnings - a.expectedEarnings
      })

      // Store recommendations
      for (const recommendation of recommendations.slice(0, 5)) { // Top 5 recommendations
        await addDoc(collection(db, this.COLLECTION_POSITIONING), recommendation)
      }

      return recommendations.slice(0, 5)
    } catch (error) {
      console.error('Error generating positioning recommendations:', error)
      throw new Error('Failed to generate positioning recommendations')
    }
  }  /**

   * Get market analytics for a specific area
   */
  async getMarketAnalytics(
    location: GeoPoint,
    timeRange: { start: Date; end: Date }
  ): Promise<MarketAnalytics> {
    try {
      // Get historical ride data for the area and time range
      const rideData = await this.getRideDataForArea(location, timeRange)
      
      // Calculate metrics
      const metrics = this.calculateMarketMetrics(rideData)
      
      // Calculate trends
      const trends = this.calculateMarketTrends(rideData)
      
      // Generate predictions
      const predictions = await this.generateMarketPredictions(location, rideData)

      return {
        location,
        timeRange: {
          start: Timestamp.fromDate(timeRange.start),
          end: Timestamp.fromDate(timeRange.end)
        },
        metrics,
        trends,
        predictions
      }
    } catch (error) {
      console.error('Error getting market analytics:', error)
      throw new Error('Failed to get market analytics')
    }
  }

  /**
   * Private helper methods
   */
  private async getHistoricalDemand(location: GeoPoint, timeSlot: any): Promise<any[]> {
    // Mock historical data - in real implementation, query actual ride data
    return [
      { demand: 15, date: '2024-01-01', hour: timeSlot.hour },
      { demand: 18, date: '2024-01-08', hour: timeSlot.hour },
      { demand: 12, date: '2024-01-15', hour: timeSlot.hour },
      { demand: 20, date: '2024-01-22', hour: timeSlot.hour }
    ]
  }

  private async calculatePredictionFactors(location: GeoPoint, targetTime: Date): Promise<any> {
    // Mock factor calculation - in real implementation, integrate with weather APIs, event APIs, etc.
    return {
      historical: 0.8,
      weather: 0.9, // Good weather = higher demand
      events: 1.2, // Local events increase demand
      seasonal: 1.0, // Normal seasonal factor
      trends: 1.1 // Slight upward trend
    }
  }

  private calculateBaseDemand(historicalData: any[], timeSlot: any): number {
    if (historicalData.length === 0) return 10 // Default base demand
    
    const avgDemand = historicalData.reduce((sum, data) => sum + data.demand, 0) / historicalData.length
    
    // Apply time-of-day adjustments
    const hourMultipliers: Record<number, number> = {
      6: 0.5, 7: 1.2, 8: 1.5, 9: 1.0, 10: 0.8, 11: 0.9,
      12: 1.1, 13: 1.0, 14: 0.9, 15: 1.0, 16: 1.2, 17: 1.8,
      18: 2.0, 19: 1.5, 20: 1.2, 21: 1.0, 22: 0.8, 23: 0.6
    }
    
    const multiplier = hourMultipliers[timeSlot.hour] || 1.0
    return avgDemand * multiplier
  }

  private applyFactorAdjustments(baseDemand: number, factors: any): number {
    return baseDemand * factors.historical * factors.weather * factors.events * factors.seasonal * factors.trends
  }

  private calculatePredictionConfidence(historicalData: any[], factors: any): number {
    let confidence = 0.5 // Base confidence
    
    // More historical data = higher confidence
    if (historicalData.length > 10) confidence += 0.2
    else if (historicalData.length > 5) confidence += 0.1
    
    // Factor reliability
    const factorReliability = Object.values(factors).reduce((sum: number, factor: any) => {
      return sum + (Math.abs(factor - 1.0) < 0.5 ? 0.1 : 0)
    }, 0)
    
    confidence += factorReliability
    
    return Math.min(confidence, 1.0)
  }

  private async getSurgePricingConfig(location: GeoPoint): Promise<SurgePricingConfig> {
    // Mock surge config - in real implementation, query from database
    return {
      location,
      isActive: true,
      thresholds: {
        lowDemand: 5,
        mediumDemand: 15,
        highDemand: 25,
        surgeDemand: 35
      },
      multipliers: {
        low: 0.9,
        medium: 1.0,
        high: 1.3,
        surge: 2.0
      },
      maxSurgeMultiplier: 3.0,
      cooldownPeriod: 15,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  }

  private calculateSurgeMultiplier(
    predictedDemand: number,
    config: SurgePricingConfig
  ): { demandLevel: 'low' | 'medium' | 'high' | 'surge'; surgeMultiplier: number } {
    if (predictedDemand >= config.thresholds.surgeDemand) {
      return { demandLevel: 'surge', surgeMultiplier: config.multipliers.surge }
    } else if (predictedDemand >= config.thresholds.highDemand) {
      return { demandLevel: 'high', surgeMultiplier: config.multipliers.high }
    } else if (predictedDemand >= config.thresholds.mediumDemand) {
      return { demandLevel: 'medium', surgeMultiplier: config.multipliers.medium }
    } else {
      return { demandLevel: 'low', surgeMultiplier: config.multipliers.low }
    }
  }

  private async getCompetitorPricing(location: GeoPoint): Promise<number> {
    // Mock competitor pricing - in real implementation, integrate with competitor APIs
    return 4.20
  }

  private async calculatePriceElasticity(location: GeoPoint, demand: number): Promise<number> {
    // Mock elasticity calculation - in real implementation, use historical price/demand data
    return -0.8 // Typical elasticity for ride-sharing
  }

  private calculateExpectedRevenue(price: number, demand: number, elasticity: number): number {
    // Simplified revenue calculation considering price elasticity
    const adjustedDemand = demand * Math.pow(price / 3.50, elasticity)
    return price * Math.max(0, adjustedDemand)
  }

  private generatePricingReasoning(
    demandLevel: string,
    surgeMultiplier: number,
    demandPrediction: DemandPrediction,
    competitorPricing?: number
  ): string {
    let reasoning = `${demandLevel.charAt(0).toUpperCase() + demandLevel.slice(1)} demand predicted (${demandPrediction.predictedDemand.toFixed(0)} rides). `
    
    if (surgeMultiplier > 1.0) {
      reasoning += `Surge pricing active with ${surgeMultiplier}x multiplier. `
    }
    
    if (competitorPricing && competitorPricing > 0) {
      const comparison = competitorPricing > (3.50 * surgeMultiplier) ? 'below' : 'above'
      reasoning += `Pricing ${comparison} competitor average of £${competitorPricing.toFixed(2)}. `
    }
    
    reasoning += `Confidence: ${(demandPrediction.confidence * 100).toFixed(0)}%.`
    
    return reasoning
  }  private as
ync getHighDemandAreas(
    currentLocation: GeoPoint,
    radiusKm: number
  ): Promise<Array<{ location: GeoPoint; name: string; demand: number; confidence: number }>> {
    // Mock high demand areas - in real implementation, query predictions database
    return [
      {
        location: new GeoPoint(currentLocation.latitude + 0.01, currentLocation.longitude + 0.01),
        name: 'City Center',
        demand: 25,
        confidence: 0.9
      },
      {
        location: new GeoPoint(currentLocation.latitude - 0.005, currentLocation.longitude + 0.015),
        name: 'Business District',
        demand: 20,
        confidence: 0.8
      },
      {
        location: new GeoPoint(currentLocation.latitude + 0.02, currentLocation.longitude - 0.01),
        name: 'Shopping Mall',
        demand: 18,
        confidence: 0.85
      }
    ]
  }

  private async calculateExpectedWaitTime(location: GeoPoint, demand: number): Promise<number> {
    // Simplified wait time calculation based on demand
    const baseWaitTime = 5 // minutes
    const demandFactor = Math.max(0.5, 1 - (demand / 50)) // Higher demand = lower wait time
    return Math.round(baseWaitTime * demandFactor)
  }

  private async calculateExpectedEarnings(location: GeoPoint, demand: number): Promise<number> {
    // Simplified earnings calculation
    const averageFare = 8.50
    const ridesPerHour = Math.min(demand / 10, 4) // Max 4 rides per hour
    return averageFare * ridesPerHour
  }

  private calculateTravelTime(from: GeoPoint, to: GeoPoint): number {
    // Simplified travel time calculation
    const distance = this.calculateDistance(from, to)
    const averageSpeed = 30 // km/h in city
    return Math.round((distance / 1000) / averageSpeed * 60) // minutes
  }

  private calculatePositioningPriority(
    expectedEarnings: number,
    expectedWaitTime: number,
    travelTime: number
  ): 'low' | 'medium' | 'high' | 'urgent' {
    const score = expectedEarnings / (expectedWaitTime + travelTime)
    
    if (score > 2.0) return 'urgent'
    if (score > 1.5) return 'high'
    if (score > 1.0) return 'medium'
    return 'low'
  }

  private generatePositioningReasoning(
    area: any,
    expectedWaitTime: number,
    expectedEarnings: number,
    travelTime: number
  ): string {
    return `High demand area (${area.demand} predicted rides) with £${expectedEarnings.toFixed(2)}/hour potential. ` +
           `${travelTime} min travel time, ${expectedWaitTime} min expected wait. ` +
           `Confidence: ${(area.confidence * 100).toFixed(0)}%.`
  }

  private async getRideDataForArea(
    location: GeoPoint,
    timeRange: { start: Date; end: Date }
  ): Promise<any[]> {
    // Mock ride data - in real implementation, query actual ride database
    return [
      { fare: 8.50, waitTime: 4, rating: 4.5, cancelled: false },
      { fare: 12.30, waitTime: 6, rating: 4.8, cancelled: false },
      { fare: 6.20, waitTime: 3, rating: 4.2, cancelled: true }
    ]
  }

  private calculateMarketMetrics(rideData: any[]): any {
    const totalRides = rideData.length
    const completedRides = rideData.filter(ride => !ride.cancelled)
    
    return {
      totalRides,
      averageWaitTime: completedRides.reduce((sum, ride) => sum + ride.waitTime, 0) / completedRides.length,
      averageFare: completedRides.reduce((sum, ride) => sum + ride.fare, 0) / completedRides.length,
      driverUtilization: 0.75, // Mock data
      customerSatisfaction: completedRides.reduce((sum, ride) => sum + ride.rating, 0) / completedRides.length,
      cancellationRate: rideData.filter(ride => ride.cancelled).length / totalRides
    }
  }

  private calculateMarketTrends(rideData: any[]): any {
    return {
      demandGrowth: 0.15, // 15% growth
      priceElasticity: -0.8,
      seasonalVariation: 0.2
    }
  }

  private async generateMarketPredictions(location: GeoPoint, rideData: any[]): Promise<any> {
    const currentHour = new Date().getHours()
    const baseDemand = rideData.length
    
    return {
      nextHourDemand: Math.round(baseDemand * 1.1),
      nextDayDemand: Math.round(baseDemand * 24 * 0.8),
      nextWeekDemand: Math.round(baseDemand * 24 * 7 * 0.85)
    }
  }

  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180
    const φ2 = point2.latitude * Math.PI / 180
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService()