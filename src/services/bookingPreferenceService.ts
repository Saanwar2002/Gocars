/**
 * Booking Preference Service
 * Manages user booking preferences, AI-powered learning, and contextual suggestions
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Ensure db is not null
if (!db) {
  throw new Error('Firebase database not initialized')
}

export interface BookingPreference {
  id?: string
  userId: string
  profileName: string
  isDefault: boolean
  isActive: boolean
  
  // Vehicle preferences
  vehicleType: 'economy' | 'comfort' | 'premium' | 'luxury' | 'any'
  vehicleFeatures: {
    airConditioning: boolean
    wifi: boolean
    phoneCharger: boolean
    bottledWater: boolean
    newspapers: boolean
    childSeat: boolean
    wheelchairAccessible: boolean
    petFriendly: boolean
  }
  
  // Driver preferences
  driverPreferences: {
    gender?: 'male' | 'female' | 'any'
    ageRange?: { min: number; max: number }
    rating: { min: number; required: boolean }
    language?: string[]
    conversationLevel: 'quiet' | 'friendly' | 'chatty' | 'any'
  }
  
  // Route and timing preferences
  routePreferences: {
    avoidTolls: boolean
    avoidHighways: boolean
    preferScenicRoute: boolean
    allowDetours: boolean
    maxDetourMinutes: number
    preferFastestRoute: boolean
  }
  
  // Comfort preferences
  comfortPreferences: {
    temperature?: number
    musicVolume: 'off' | 'low' | 'medium' | 'high' | 'any'
    musicGenre?: string[]
    windowPreference: 'closed' | 'cracked' | 'open' | 'any'
    seatPosition?: 'front' | 'back' | 'any'
  }
  
  // Payment preferences
  paymentPreferences: {
    defaultMethod: string
    autoTip: boolean
    tipPercentage?: number
    splitPayment: boolean
    expenseCategory?: string
  }
  
  // Safety preferences
  safetyPreferences: {
    shareLocationWithContacts: boolean
    requireDriverPhoto: boolean
    requireVehiclePhoto: boolean
    emergencyContactNotification: boolean
    rideVerification: boolean
  }
  
  // Contextual settings
  contextualSettings: {
    workCommute?: Partial<BookingPreference>
    personalTrips?: Partial<BookingPreference>
    airportRides?: Partial<BookingPreference>
    nightRides?: Partial<BookingPreference>
    businessMeetings?: Partial<BookingPreference>
    socialEvents?: Partial<BookingPreference>
  }
  
  // AI learning data
  learningData: {
    bookingHistory: BookingHistoryEntry[]
    preferenceScore: number
    lastUpdated: Timestamp
    adaptationEnabled: boolean
  }
  
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface BookingHistoryEntry {
  bookingId: string
  timestamp: Timestamp
  context: 'work' | 'personal' | 'airport' | 'night' | 'business' | 'social' | 'other'
  preferences: Partial<BookingPreference>
  satisfaction: number // 1-5 rating
  feedback?: string
}

export interface PreferenceSuggestion {
  id: string
  type: 'vehicle' | 'driver' | 'route' | 'comfort' | 'payment' | 'safety'
  suggestion: string
  reasoning: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  context?: string
  data: any
}

export interface ContextualPreferences {
  context: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  dayOfWeek: 'weekday' | 'weekend'
  location: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  weather?: string
  traffic?: string
  purpose?: string
}

class BookingPreferenceService {
  private readonly COLLECTION_PREFERENCES = 'bookingPreferences'
  private readonly COLLECTION_SUGGESTIONS = 'preferenceSuggestions'

  /**
   * Create a new booking preference profile
   */
  async createPreferenceProfile(preference: Omit<BookingPreference, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const preferenceData = {
        ...preference,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_PREFERENCES), preferenceData)
      return docRef.id
    } catch (error) {
      console.error('Error creating preference profile:', error)
      throw new Error('Failed to create preference profile')
    }
  }

  /**
   * Get user's preference profiles
   */
  async getUserPreferences(userId: string): Promise<BookingPreference[]> {
    try {
      const preferencesQuery = query(
        collection(db, this.COLLECTION_PREFERENCES),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('isDefault', 'desc'),
        orderBy('updatedAt', 'desc')
      )

      const snapshot = await getDocs(preferencesQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingPreference[]
    } catch (error) {
      console.error('Error getting user preferences:', error)
      throw new Error('Failed to get user preferences')
    }
  }

  /**
   * Get default preference profile for user
   */
  async getDefaultPreference(userId: string): Promise<BookingPreference | null> {
    try {
      const preferencesQuery = query(
        collection(db, this.COLLECTION_PREFERENCES),
        where('userId', '==', userId),
        where('isDefault', '==', true),
        where('isActive', '==', true),
        limit(1)
      )

      const snapshot = await getDocs(preferencesQuery)
      if (snapshot.empty) return null

      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() } as BookingPreference
    } catch (error) {
      console.error('Error getting default preference:', error)
      throw new Error('Failed to get default preference')
    }
  }

  /**
   * Update preference profile
   */
  async updatePreferenceProfile(preferenceId: string, updates: Partial<BookingPreference>): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_PREFERENCES, preferenceId), {
        ...updates,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error updating preference profile:', error)
      throw new Error('Failed to update preference profile')
    }
  }

  /**
   * Delete preference profile
   */
  async deletePreferenceProfile(preferenceId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_PREFERENCES, preferenceId), {
        isActive: false,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error deleting preference profile:', error)
      throw new Error('Failed to delete preference profile')
    }
  }

  /**
   * Set default preference profile
   */
  async setDefaultPreference(userId: string, preferenceId: string): Promise<void> {
    try {
      // First, unset all current defaults
      const currentDefaults = await this.getUserPreferences(userId)
      for (const pref of currentDefaults.filter(p => p.isDefault)) {
        await updateDoc(doc(db, this.COLLECTION_PREFERENCES, pref.id!), {
          isDefault: false,
          updatedAt: Timestamp.now()
        })
      }

      // Set new default
      await updateDoc(doc(db, this.COLLECTION_PREFERENCES, preferenceId), {
        isDefault: true,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error setting default preference:', error)
      throw new Error('Failed to set default preference')
    }
  }

  /**
   * Get contextual preferences based on current context
   */
  async getContextualPreferences(userId: string, context: ContextualPreferences): Promise<BookingPreference | null> {
    try {
      const userPreferences = await this.getUserPreferences(userId)
      if (userPreferences.length === 0) return null

      // Find the most suitable preference profile based on context
      let bestMatch = userPreferences.find(p => p.isDefault) || userPreferences[0]

      // Check for contextual overrides
      const contextKey = this.determineContextKey(context)
      if (bestMatch.contextualSettings[contextKey as keyof typeof bestMatch.contextualSettings]) {
        const contextualOverrides = bestMatch.contextualSettings[contextKey as keyof typeof bestMatch.contextualSettings]
        bestMatch = { ...bestMatch, ...contextualOverrides }
      }

      return bestMatch
    } catch (error) {
      console.error('Error getting contextual preferences:', error)
      throw new Error('Failed to get contextual preferences')
    }
  }

  /**
   * Generate AI-powered preference suggestions
   */
  async generatePreferenceSuggestions(userId: string): Promise<PreferenceSuggestion[]> {
    try {
      const userPreferences = await this.getUserPreferences(userId)
      if (userPreferences.length === 0) return []

      const suggestions: PreferenceSuggestion[] = []
      const defaultPreference = userPreferences.find(p => p.isDefault) || userPreferences[0]

      // Analyze booking history for patterns
      const historyAnalysis = this.analyzeBookingHistory(defaultPreference.learningData.bookingHistory)

      // Generate vehicle preference suggestions
      if (historyAnalysis.vehiclePatterns.length > 0) {
        suggestions.push({
          id: `vehicle_${Date.now()}`,
          type: 'vehicle',
          suggestion: `Consider upgrading to ${historyAnalysis.vehiclePatterns[0].type} for better satisfaction`,
          reasoning: `Your satisfaction is ${historyAnalysis.vehiclePatterns[0].avgSatisfaction}% higher with ${historyAnalysis.vehiclePatterns[0].type} vehicles`,
          confidence: historyAnalysis.vehiclePatterns[0].confidence,
          impact: 'medium',
          data: historyAnalysis.vehiclePatterns[0]
        })
      }

      // Generate driver preference suggestions
      if (historyAnalysis.driverPatterns.length > 0) {
        suggestions.push({
          id: `driver_${Date.now()}`,
          type: 'driver',
          suggestion: `You prefer ${historyAnalysis.driverPatterns[0].conversationLevel} drivers`,
          reasoning: `Based on your ratings, you're more satisfied with ${historyAnalysis.driverPatterns[0].conversationLevel} conversation level`,
          confidence: historyAnalysis.driverPatterns[0].confidence,
          impact: 'low',
          data: historyAnalysis.driverPatterns[0]
        })
      }

      // Generate route preference suggestions
      if (historyAnalysis.routePatterns.length > 0) {
        suggestions.push({
          id: `route_${Date.now()}`,
          type: 'route',
          suggestion: `Enable scenic routes for leisure trips`,
          reasoning: `You rate scenic routes 20% higher during weekend trips`,
          confidence: 0.8,
          impact: 'low',
          data: historyAnalysis.routePatterns[0]
        })
      }

      // Generate contextual suggestions
      const contextualSuggestions = this.generateContextualSuggestions(defaultPreference, historyAnalysis)
      suggestions.push(...contextualSuggestions)

      return suggestions.sort((a, b) => b.confidence - a.confidence)
    } catch (error) {
      console.error('Error generating preference suggestions:', error)
      throw new Error('Failed to generate preference suggestions')
    }
  }

  /**
   * Apply preference suggestion
   */
  async applySuggestion(userId: string, suggestionId: string, preferenceId: string): Promise<void> {
    try {
      // This would apply the suggestion to the user's preference profile
      // Implementation would depend on the specific suggestion type and data
      console.log(`Applying suggestion ${suggestionId} to preference ${preferenceId}`)
      
      // Update preference profile with suggested changes
      // This is a simplified implementation - in reality, you'd parse the suggestion data
      // and apply specific changes to the preference profile
      
      await this.updatePreferenceProfile(preferenceId, {
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error applying suggestion:', error)
      throw new Error('Failed to apply suggestion')
    }
  }

  /**
   * Record booking feedback for learning
   */
  async recordBookingFeedback(
    userId: string, 
    bookingId: string, 
    satisfaction: number, 
    context: string,
    feedback?: string
  ): Promise<void> {
    try {
      const defaultPreference = await this.getDefaultPreference(userId)
      if (!defaultPreference) return

      const historyEntry: BookingHistoryEntry = {
        bookingId,
        timestamp: Timestamp.now(),
        context: context as any,
        preferences: {}, // Would be populated with actual booking preferences used
        satisfaction,
        feedback
      }

      const updatedHistory = [...defaultPreference.learningData.bookingHistory, historyEntry]
      
      // Keep only last 100 entries
      if (updatedHistory.length > 100) {
        updatedHistory.splice(0, updatedHistory.length - 100)
      }

      await this.updatePreferenceProfile(defaultPreference.id!, {
        learningData: {
          ...defaultPreference.learningData,
          bookingHistory: updatedHistory,
          lastUpdated: Timestamp.now(),
          preferenceScore: this.calculatePreferenceScore(updatedHistory)
        }
      })
    } catch (error) {
      console.error('Error recording booking feedback:', error)
      throw new Error('Failed to record booking feedback')
    }
  }

  /**
   * Create default preference profile for new user
   */
  async createDefaultProfile(userId: string): Promise<string> {
    const defaultPreference: Omit<BookingPreference, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      profileName: 'Default',
      isDefault: true,
      isActive: true,
      vehicleType: 'any',
      vehicleFeatures: {
        airConditioning: true,
        wifi: false,
        phoneCharger: true,
        bottledWater: false,
        newspapers: false,
        childSeat: false,
        wheelchairAccessible: false,
        petFriendly: false
      },
      driverPreferences: {
        rating: { min: 4.0, required: true },
        conversationLevel: 'friendly'
      },
      routePreferences: {
        avoidTolls: false,
        avoidHighways: false,
        preferScenicRoute: false,
        allowDetours: true,
        maxDetourMinutes: 10,
        preferFastestRoute: true
      },
      comfortPreferences: {
        musicVolume: 'low',
        windowPreference: 'any',
        seatPosition: 'any'
      },
      paymentPreferences: {
        defaultMethod: 'card',
        autoTip: true,
        tipPercentage: 15,
        splitPayment: false
      },
      safetyPreferences: {
        shareLocationWithContacts: true,
        requireDriverPhoto: true,
        requireVehiclePhoto: false,
        emergencyContactNotification: true,
        rideVerification: false
      },
      contextualSettings: {},
      learningData: {
        bookingHistory: [],
        preferenceScore: 0.5,
        lastUpdated: Timestamp.now(),
        adaptationEnabled: true
      }
    }

    return await this.createPreferenceProfile(defaultPreference)
  }

  /**
   * Private helper methods
   */
  private determineContextKey(context: ContextualPreferences): string {
    // Simple context determination logic
    if (context.purpose === 'work' || (context.timeOfDay === 'morning' && context.dayOfWeek === 'weekday')) {
      return 'workCommute'
    }
    if (context.timeOfDay === 'night') {
      return 'nightRides'
    }
    if (context.purpose === 'business') {
      return 'businessMeetings'
    }
    if (context.purpose === 'social' || (context.timeOfDay === 'evening' && context.dayOfWeek === 'weekend')) {
      return 'socialEvents'
    }
    if (context.purpose === 'airport') {
      return 'airportRides'
    }
    return 'personalTrips'
  }

  private analyzeBookingHistory(history: BookingHistoryEntry[]): any {
    // Simplified analysis - in reality, this would use more sophisticated ML algorithms
    const vehiclePatterns = this.analyzeVehiclePreferences(history)
    const driverPatterns = this.analyzeDriverPreferences(history)
    const routePatterns = this.analyzeRoutePreferences(history)

    return {
      vehiclePatterns,
      driverPatterns,
      routePatterns
    }
  }

  private analyzeVehiclePreferences(history: BookingHistoryEntry[]): any[] {
    // Simplified vehicle preference analysis
    return [
      {
        type: 'comfort',
        avgSatisfaction: 4.2,
        confidence: 0.8,
        frequency: 0.6
      }
    ]
  }

  private analyzeDriverPreferences(history: BookingHistoryEntry[]): any[] {
    // Simplified driver preference analysis
    return [
      {
        conversationLevel: 'friendly',
        avgSatisfaction: 4.5,
        confidence: 0.7,
        frequency: 0.8
      }
    ]
  }

  private analyzeRoutePreferences(history: BookingHistoryEntry[]): any[] {
    // Simplified route preference analysis
    return [
      {
        type: 'scenic',
        context: 'weekend',
        avgSatisfaction: 4.3,
        confidence: 0.6
      }
    ]
  }

  private generateContextualSuggestions(preference: BookingPreference, analysis: any): PreferenceSuggestion[] {
    const suggestions: PreferenceSuggestion[] = []

    // Generate suggestions based on analysis
    if (analysis.vehiclePatterns.length > 0) {
      suggestions.push({
        id: `contextual_${Date.now()}`,
        type: 'comfort',
        suggestion: 'Create separate profiles for work and personal trips',
        reasoning: 'Your preferences vary significantly between work and personal contexts',
        confidence: 0.7,
        impact: 'high',
        context: 'profile_management',
        data: { contexts: ['work', 'personal'] }
      })
    }

    return suggestions
  }

  private calculatePreferenceScore(history: BookingHistoryEntry[]): number {
    if (history.length === 0) return 0.5

    const avgSatisfaction = history.reduce((sum, entry) => sum + entry.satisfaction, 0) / history.length
    return avgSatisfaction / 5 // Normalize to 0-1 scale
  }
}

export const bookingPreferenceService = new BookingPreferenceService()