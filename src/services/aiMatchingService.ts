/**
 * AI Matching Service
 * Advanced machine learning-based driver-passenger matching system
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

export interface MatchingRequest {
  id?: string
  passengerId: string
  pickupLocation: GeoPoint
  dropoffLocation: GeoPoint
  requestedTime: Timestamp
  vehicleType: string
  preferences: PassengerPreferences
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  accessibilityNeeds?: AccessibilityRequirements
  createdAt: Timestamp
}

export interface PassengerPreferences {
  driverGender?: 'male' | 'female' | 'any'
  conversationLevel: 'quiet' | 'friendly' | 'chatty' | 'any'
  musicPreference: 'none' | 'low' | 'medium' | 'high' | 'any'
  temperaturePreference?: number
  smokingTolerance: boolean
  petTolerance: boolean
  ratingThreshold: number
  languagePreference?: string[]
}

export interface AccessibilityRequirements {
  wheelchairAccessible: boolean
  serviceAnimal: boolean
  hearingImpaired: boolean
  visuallyImpaired: boolean
  cognitiveSupport: boolean
  childSeat: boolean
}

export interface DriverProfile {
  id: string
  driverId: string
  currentLocation: GeoPoint
  isAvailable: boolean
  vehicleType: string
  rating: number
  completedRides: number
  
  // Driver characteristics
  characteristics: {
    gender: 'male' | 'female' | 'other'
    age: number
    experienceYears: number
    conversationStyle: 'quiet' | 'friendly' | 'chatty'
    musicPreference: 'none' | 'low' | 'medium' | 'high'
    smokingPolicy: boolean
    petPolicy: boolean
    languagesSpoken: string[]
  }
  
  // Vehicle features
  vehicleFeatures: {
    airConditioning: boolean
    wifi: boolean
    phoneCharger: boolean
    wheelchairAccessible: boolean
    childSeatAvailable: boolean
    serviceAnimalFriendly: boolean
    audioSystem: boolean
    temperatureControl: boolean
  }
  
  // Performance metrics
  performance: {
    averageResponseTime: number // seconds
    cancellationRate: number
    lateArrivalRate: number
    customerSatisfactionScore: number
    safetyScore: number
    efficiencyScore: number
  }
  
  // Availability patterns
  availability: {
    preferredHours: string[]
    preferredAreas: GeoPoint[]
    workingDays: number[]
    maxRidesPerDay: number
    currentRideCount: number
  }
  
  lastUpdated: Timestamp
}

export interface MatchScore {
  driverId: string
  totalScore: number
  confidence: number
  explanation: string
  factors: {
    distance: { score: number; weight: number; explanation: string }
    availability: { score: number; weight: number; explanation: string }
    preferences: { score: number; weight: number; explanation: string }
    performance: { score: number; weight: number; explanation: string }
    experience: { score: number; weight: number; explanation: string }
    compatibility: { score: number; weight: number; explanation: string }
    accessibility: { score: number; weight: number; explanation: string }
  }
  estimatedArrivalTime: number // minutes
  estimatedFare: number
  riskScore: number // 0-1, lower is better
}

export interface MatchingFeedback {
  id?: string
  matchingRequestId: string
  selectedDriverId: string
  alternativeDriverIds: string[]
  passengerRating: number
  driverRating: number
  actualArrivalTime: number
  actualFare: number
  completionStatus: 'completed' | 'cancelled_passenger' | 'cancelled_driver' | 'no_show'
  feedbackComments?: string
  issuesReported: string[]
  createdAt: Timestamp
}

export interface ABTestVariant {
  id: string
  name: string
  description: string
  isActive: boolean
  trafficPercentage: number
  algorithm: 'standard' | 'ml_enhanced' | 'preference_weighted' | 'performance_optimized'
  parameters: Record<string, any>
  metrics: {
    matchSuccessRate: number
    averageWaitTime: number
    customerSatisfaction: number
    driverUtilization: number
    revenue: number
  }
  createdAt: Timestamp
}

class AIMatchingService {
  private readonly COLLECTION_REQUESTS = 'matchingRequests'
  private readonly COLLECTION_DRIVERS = 'driverProfiles'
  private readonly COLLECTION_FEEDBACK = 'matchingFeedback'
  private readonly COLLECTION_AB_TESTS = 'abTestVariants'

  /**
   * Find optimal driver matches using AI algorithm
   */
  async findOptimalMatches(request: MatchingRequest): Promise<MatchScore[]> {
    try {
      // Get available drivers in the area
      const availableDrivers = await this.getAvailableDrivers(request.pickupLocation, 10) // 10km radius
      
      if (availableDrivers.length === 0) {
        return []
      }

      // Calculate match scores for each driver
      const matchScores: MatchScore[] = []
      
      for (const driver of availableDrivers) {
        const score = await this.calculateMatchScore(request, driver)
        matchScores.push(score)
      }

      // Sort by total score (descending)
      matchScores.sort((a, b) => b.totalScore - a.totalScore)

      // Apply A/B testing variant if active
      const abTestVariant = await this.getActiveABTestVariant()
      if (abTestVariant) {
        return this.applyABTestLogic(matchScores, abTestVariant)
      }

      return matchScores.slice(0, 5) // Return top 5 matches
    } catch (error) {
      console.error('Error finding optimal matches:', error)
      throw new Error('Failed to find optimal matches')
    }
  }

  /**
   * Calculate comprehensive match score using ML-enhanced algorithm
   */
  private async calculateMatchScore(request: MatchingRequest, driver: DriverProfile): Promise<MatchScore> {
    const factors = {
      distance: this.calculateDistanceScore(request, driver),
      availability: this.calculateAvailabilityScore(request, driver),
      preferences: this.calculatePreferenceScore(request, driver),
      performance: this.calculatePerformanceScore(driver),
      experience: this.calculateExperienceScore(driver),
      compatibility: this.calculateCompatibilityScore(request, driver),
      accessibility: this.calculateAccessibilityScore(request, driver)
    }

    // Dynamic weights based on request urgency and historical data
    const weights = this.calculateDynamicWeights(request, driver)
    
    // Calculate weighted total score
    let totalScore = 0
    Object.entries(factors).forEach(([key, factor]) => {
      totalScore += factor.score * weights[key as keyof typeof weights]
    })

    // Apply ML enhancement based on historical success patterns
    const mlEnhancement = await this.applyMLEnhancement(request, driver, totalScore)
    totalScore = totalScore * mlEnhancement.multiplier

    // Calculate confidence based on data quality and historical accuracy
    const confidence = this.calculateConfidence(factors, driver)

    // Generate human-readable explanation
    const explanation = this.generateExplanation(factors, weights, mlEnhancement)

    // Calculate additional metrics
    const estimatedArrivalTime = this.calculateEstimatedArrivalTime(request, driver)
    const estimatedFare = this.calculateEstimatedFare(request, driver)
    const riskScore = this.calculateRiskScore(driver, request)

    return {
      driverId: driver.driverId,
      totalScore: Math.min(Math.max(totalScore, 0), 1), // Clamp between 0-1
      confidence,
      explanation,
      factors,
      estimatedArrivalTime,
      estimatedFare,
      riskScore
    }
  }

  /**
   * Calculate distance-based score
   */
  private calculateDistanceScore(request: MatchingRequest, driver: DriverProfile): {
    score: number
    weight: number
    explanation: string
  } {
    const distance = this.calculateDistance(request.pickupLocation, driver.currentLocation)
    const maxDistance = 10000 // 10km max
    const score = Math.max(0, 1 - (distance / maxDistance))
    
    return {
      score,
      weight: 0.25,
      explanation: `Driver is ${(distance / 1000).toFixed(1)}km away. ${
        distance < 2000 ? 'Very close' : distance < 5000 ? 'Nearby' : 'Within range'
      }.`
    }
  }

  /**
   * Calculate availability-based score
   */
  private calculateAvailabilityScore(request: MatchingRequest, driver: DriverProfile): {
    score: number
    weight: number
    explanation: string
  } {
    let score = 0
    let explanation = ''

    // Base availability
    if (driver.isAvailable) {
      score += 0.5
    }

    // Check if driver is within preferred working hours
    const requestHour = request.requestedTime.toDate().getHours()
    const isPreferredHour = driver.availability.preferredHours.includes(requestHour.toString())
    if (isPreferredHour) {
      score += 0.3
      explanation += 'Driver is in preferred working hours. '
    }

    // Check daily ride capacity
    const capacityUtilization = driver.availability.currentRideCount / driver.availability.maxRidesPerDay
    if (capacityUtilization < 0.8) {
      score += 0.2
      explanation += 'Driver has capacity for more rides. '
    }

    return {
      score: Math.min(score, 1),
      weight: 0.2,
      explanation: explanation || 'Driver availability assessed.'
    }
  }

  /**
   * Calculate preference compatibility score
   */
  private calculatePreferenceScore(request: MatchingRequest, driver: DriverProfile): {
    score: number
    weight: number
    explanation: string
  } {
    let score = 0
    let matches = 0
    let total = 0
    const explanations: string[] = []

    // Gender preference
    if (request.preferences.driverGender && request.preferences.driverGender !== 'any') {
      total++
      if (request.preferences.driverGender === driver.characteristics.gender) {
        score += 1
        matches++
        explanations.push('Gender preference matched')
      }
    }

    // Conversation level
    total++
    if (request.preferences.conversationLevel === driver.characteristics.conversationStyle ||
        request.preferences.conversationLevel === 'any') {
      score += 1
      matches++
      explanations.push('Conversation style compatible')
    }

    // Music preference
    total++
    if (request.preferences.musicPreference === driver.characteristics.musicPreference ||
        request.preferences.musicPreference === 'any') {
      score += 1
      matches++
      explanations.push('Music preference aligned')
    }

    // Language preference
    if (request.preferences.languagePreference && request.preferences.languagePreference.length > 0) {
      total++
      const hasCommonLanguage = request.preferences.languagePreference.some(lang =>
        driver.characteristics.languagesSpoken.includes(lang)
      )
      if (hasCommonLanguage) {
        score += 1
        matches++
        explanations.push('Common language available')
      }
    }

    // Rating threshold
    total++
    if (driver.rating >= request.preferences.ratingThreshold) {
      score += 1
      matches++
      explanations.push('Driver rating meets requirements')
    }

    const finalScore = total > 0 ? score / total : 0.5

    return {
      score: finalScore,
      weight: 0.2,
      explanation: `${matches}/${total} preferences matched. ${explanations.join(', ')}.`
    }
  }

  /**
   * Calculate performance-based score
   */
  private calculatePerformanceScore(driver: DriverProfile): {
    score: number
    weight: number
    explanation: string
  } {
    const performance = driver.performance
    
    // Weighted performance metrics
    const responseScore = Math.max(0, 1 - (performance.averageResponseTime / 300)) // 5 min max
    const reliabilityScore = 1 - performance.cancellationRate
    const punctualityScore = 1 - performance.lateArrivalRate
    const satisfactionScore = performance.customerSatisfactionScore / 5
    const safetyScore = performance.safetyScore
    const efficiencyScore = performance.efficiencyScore

    const totalScore = (
      responseScore * 0.2 +
      reliabilityScore * 0.2 +
      punctualityScore * 0.2 +
      satisfactionScore * 0.2 +
      safetyScore * 0.1 +
      efficiencyScore * 0.1
    )

    const strengths: string[] = []
    if (responseScore > 0.8) strengths.push('quick response')
    if (reliabilityScore > 0.9) strengths.push('highly reliable')
    if (punctualityScore > 0.9) strengths.push('always punctual')
    if (satisfactionScore > 0.8) strengths.push('high customer satisfaction')

    return {
      score: totalScore,
      weight: 0.15,
      explanation: `Strong performance with ${strengths.join(', ')}.`
    }
  }

  /**
   * Calculate experience-based score
   */
  private calculateExperienceScore(driver: DriverProfile): {
    score: number
    weight: number
    explanation: string
  } {
    const yearsScore = Math.min(driver.characteristics.experienceYears / 5, 1) // Max at 5 years
    const ridesScore = Math.min(driver.completedRides / 1000, 1) // Max at 1000 rides
    
    const totalScore = (yearsScore * 0.4 + ridesScore * 0.6)
    
    let experienceLevel = 'new'
    if (totalScore > 0.8) experienceLevel = 'highly experienced'
    else if (totalScore > 0.6) experienceLevel = 'experienced'
    else if (totalScore > 0.3) experienceLevel = 'moderately experienced'

    return {
      score: totalScore,
      weight: 0.1,
      explanation: `${experienceLevel} driver with ${driver.completedRides} completed rides.`
    }
  }

  /**
   * Calculate compatibility score
   */
  private calculateCompatibilityScore(request: MatchingRequest, driver: DriverProfile): {
    score: number
    weight: number
    explanation: string
  } {
    let score = 0
    const factors: string[] = []

    // Vehicle type compatibility
    if (request.vehicleType === driver.vehicleType || request.vehicleType === 'any') {
      score += 0.3
      factors.push('vehicle type match')
    }

    // Smoking tolerance
    if (request.preferences.smokingTolerance === driver.characteristics.smokingPolicy) {
      score += 0.2
      factors.push('smoking policy compatible')
    }

    // Pet tolerance
    if (request.preferences.petTolerance === driver.characteristics.petPolicy) {
      score += 0.2
      factors.push('pet policy compatible')
    }

    // Temperature preference (if specified)
    if (request.preferences.temperaturePreference && driver.vehicleFeatures.temperatureControl) {
      score += 0.3
      factors.push('temperature control available')
    }

    return {
      score: Math.min(score, 1),
      weight: 0.05,
      explanation: factors.length > 0 ? `Compatible: ${factors.join(', ')}.` : 'Basic compatibility.'
    }
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(request: MatchingRequest, driver: DriverProfile): {
    score: number
    weight: number
    explanation: string
  } {
    if (!request.accessibilityNeeds) {
      return { score: 1, weight: 0.05, explanation: 'No accessibility requirements.' }
    }

    let score = 0
    let total = 0
    const met: string[] = []
    const unmet: string[] = []

    // Check each accessibility requirement
    if (request.accessibilityNeeds.wheelchairAccessible) {
      total++
      if (driver.vehicleFeatures.wheelchairAccessible) {
        score++
        met.push('wheelchair accessible')
      } else {
        unmet.push('wheelchair accessible')
      }
    }

    if (request.accessibilityNeeds.serviceAnimal) {
      total++
      if (driver.vehicleFeatures.serviceAnimalFriendly) {
        score++
        met.push('service animal friendly')
      } else {
        unmet.push('service animal friendly')
      }
    }

    if (request.accessibilityNeeds.childSeat) {
      total++
      if (driver.vehicleFeatures.childSeatAvailable) {
        score++
        met.push('child seat available')
      } else {
        unmet.push('child seat available')
      }
    }

    const finalScore = total > 0 ? score / total : 1
    const explanation = total > 0 
      ? `Accessibility: ${met.length > 0 ? `✓ ${met.join(', ')}` : ''}${unmet.length > 0 ? ` ✗ ${unmet.join(', ')}` : ''}`
      : 'No accessibility requirements.'

    return {
      score: finalScore,
      weight: request.accessibilityNeeds ? 0.3 : 0.05, // Higher weight if accessibility needed
      explanation
    }
  }

  /**
   * Calculate dynamic weights based on context
   */
  private calculateDynamicWeights(request: MatchingRequest, driver: DriverProfile): Record<string, number> {
    const baseWeights = {
      distance: 0.25,
      availability: 0.2,
      preferences: 0.2,
      performance: 0.15,
      experience: 0.1,
      compatibility: 0.05,
      accessibility: 0.05
    }

    // Adjust weights based on urgency
    if (request.urgency === 'urgent') {
      baseWeights.distance = 0.4
      baseWeights.availability = 0.3
      baseWeights.performance = 0.2
      baseWeights.preferences = 0.05
      baseWeights.experience = 0.03
      baseWeights.compatibility = 0.01
      baseWeights.accessibility = 0.01
    }

    // Adjust weights based on accessibility needs
    if (request.accessibilityNeeds) {
      baseWeights.accessibility = 0.3
      baseWeights.distance = 0.2
      baseWeights.availability = 0.15
      baseWeights.preferences = 0.15
      baseWeights.performance = 0.1
      baseWeights.experience = 0.05
      baseWeights.compatibility = 0.05
    }

    return baseWeights
  }

  /**
   * Apply ML enhancement based on historical patterns
   */
  private async applyMLEnhancement(
    request: MatchingRequest, 
    driver: DriverProfile, 
    baseScore: number
  ): Promise<{ multiplier: number; explanation: string }> {
    try {
      // Get historical feedback for similar matches
      const historicalData = await this.getHistoricalMatchingData(request, driver)
      
      if (historicalData.length === 0) {
        return { multiplier: 1.0, explanation: 'No historical data available.' }
      }

      // Calculate success rate for similar matches
      const successfulMatches = historicalData.filter(data => 
        data.completionStatus === 'completed' && 
        data.passengerRating >= 4 && 
        data.driverRating >= 4
      )

      const successRate = successfulMatches.length / historicalData.length
      
      // Apply ML-based adjustment
      let multiplier = 1.0
      let explanation = ''

      if (successRate > 0.8) {
        multiplier = 1.1
        explanation = 'Historical data shows high success rate for similar matches.'
      } else if (successRate > 0.6) {
        multiplier = 1.05
        explanation = 'Historical data shows good success rate for similar matches.'
      } else if (successRate < 0.4) {
        multiplier = 0.9
        explanation = 'Historical data shows lower success rate for similar matches.'
      } else {
        explanation = 'Historical data shows average success rate for similar matches.'
      }

      return { multiplier, explanation }
    } catch (error) {
      console.error('Error applying ML enhancement:', error)
      return { multiplier: 1.0, explanation: 'ML enhancement unavailable.' }
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(factors: any, driver: DriverProfile): number {
    let confidence = 0.5 // Base confidence

    // Data quality factors
    if (driver.completedRides > 100) confidence += 0.2
    if (driver.performance.customerSatisfactionScore > 0) confidence += 0.1
    if (driver.characteristics.experienceYears > 1) confidence += 0.1

    // Factor reliability
    const factorScores = Object.values(factors).map((f: any) => f.score)
    const scoreVariance = this.calculateVariance(factorScores)
    if (scoreVariance < 0.1) confidence += 0.1 // Low variance = high confidence

    return Math.min(confidence, 1.0)
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(factors: any, weights: any, mlEnhancement: any): string {
    const topFactors = Object.entries(factors)
      .map(([key, factor]: [string, any]) => ({
        key,
        weightedScore: factor.score * weights[key],
        explanation: factor.explanation
      }))
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 3)

    const explanations = topFactors.map(f => f.explanation).join(' ')
    return `${explanations} ${mlEnhancement.explanation}`
  }

  /**
   * Record matching feedback for learning
   */
  async recordMatchingFeedback(feedback: Omit<MatchingFeedback, 'id' | 'createdAt'>): Promise<void> {
    try {
      await addDoc(collection(db, this.COLLECTION_FEEDBACK), {
        ...feedback,
        createdAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error recording matching feedback:', error)
      throw new Error('Failed to record matching feedback')
    }
  }

  /**
   * Get available drivers in area
   */
  private async getAvailableDrivers(location: GeoPoint, radiusKm: number): Promise<DriverProfile[]> {
    try {
      // In a real implementation, this would use geospatial queries
      const driversQuery = query(
        collection(db, this.COLLECTION_DRIVERS),
        where('isAvailable', '==', true),
        limit(50)
      )

      const snapshot = await getDocs(driversQuery)
      const drivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DriverProfile[]

      // Filter by distance (simplified)
      return drivers.filter(driver => {
        const distance = this.calculateDistance(location, driver.currentLocation)
        return distance <= radiusKm * 1000 // Convert km to meters
      })
    } catch (error) {
      console.error('Error getting available drivers:', error)
      return []
    }
  }

  /**
   * Get historical matching data
   */
  private async getHistoricalMatchingData(
    request: MatchingRequest, 
    driver: DriverProfile
  ): Promise<MatchingFeedback[]> {
    try {
      // Get feedback for this driver
      const feedbackQuery = query(
        collection(db, this.COLLECTION_FEEDBACK),
        where('selectedDriverId', '==', driver.driverId),
        orderBy('createdAt', 'desc'),
        limit(20)
      )

      const snapshot = await getDocs(feedbackQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MatchingFeedback[]
    } catch (error) {
      console.error('Error getting historical data:', error)
      return []
    }
  }

  /**
   * Get active A/B test variant
   */
  private async getActiveABTestVariant(): Promise<ABTestVariant | null> {
    try {
      const testsQuery = query(
        collection(db, this.COLLECTION_AB_TESTS),
        where('isActive', '==', true),
        limit(1)
      )

      const snapshot = await getDocs(testsQuery)
      if (snapshot.empty) return null

      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ABTestVariant
    } catch (error) {
      console.error('Error getting A/B test variant:', error)
      return null
    }
  }

  /**
   * Apply A/B test logic
   */
  private applyABTestLogic(matches: MatchScore[], variant: ABTestVariant): MatchScore[] {
    switch (variant.algorithm) {
      case 'preference_weighted':
        return matches.sort((a, b) => 
          (b.factors.preferences.score * 2 + b.totalScore) - 
          (a.factors.preferences.score * 2 + a.totalScore)
        )
      case 'performance_optimized':
        return matches.sort((a, b) => 
          (b.factors.performance.score * 2 + b.totalScore) - 
          (a.factors.performance.score * 2 + a.totalScore)
        )
      default:
        return matches
    }
  }

  /**
   * Utility functions
   */
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

  private calculateEstimatedArrivalTime(request: MatchingRequest, driver: DriverProfile): number {
    const distance = this.calculateDistance(request.pickupLocation, driver.currentLocation)
    const averageSpeed = 30 // km/h in city
    return Math.round((distance / 1000) / averageSpeed * 60) // minutes
  }

  private calculateEstimatedFare(request: MatchingRequest, driver: DriverProfile): number {
    const distance = this.calculateDistance(request.pickupLocation, request.dropoffLocation)
    const baseFare = 3.50
    const perKmRate = 2.00
    return baseFare + (distance / 1000) * perKmRate
  }

  private calculateRiskScore(driver: DriverProfile, request: MatchingRequest): number {
    let risk = 0
    
    // Performance-based risk
    risk += driver.performance.cancellationRate * 0.3
    risk += driver.performance.lateArrivalRate * 0.2
    risk += (1 - driver.performance.safetyScore) * 0.3
    
    // Experience-based risk
    if (driver.completedRides < 50) risk += 0.2
    
    return Math.min(risk, 1)
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }
}

export const aiMatchingService = new AIMatchingService()