/**
 * Accessibility Service
 * Manages accessibility features, special needs support, and inclusive booking options
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
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Ensure db is not null
if (!db) {
  throw new Error('Firebase database not initialized')
}

export interface AccessibilityProfile {
  id?: string
  userId: string
  profileName: string
  isActive: boolean
  
  // Mobility accessibility
  mobilityNeeds: {
    wheelchairUser: boolean
    wheelchairType: 'manual' | 'electric' | 'scooter' | 'none'
    requiresWheelchairAccessibleVehicle: boolean
    requiresRampAccess: boolean
    requiresLiftAccess: boolean
    mobilityAidType?: 'walker' | 'crutches' | 'cane' | 'prosthetic' | 'other'
    transferAssistanceNeeded: boolean
    preferredSeatingPosition: 'front' | 'back' | 'wheelchair_space' | 'any'
  }
  
  // Visual accessibility
  visualNeeds: {
    isBlind: boolean
    isPartiallyBlind: boolean
    requiresServiceAnimal: boolean
    serviceAnimalType?: 'guide_dog' | 'other'
    requiresAudioAnnouncements: boolean
    requiresLargeTextDisplay: boolean
    requiresHighContrast: boolean
    preferredFontSize: 'normal' | 'large' | 'extra_large'
  }
  
  // Hearing accessibility
  hearingNeeds: {
    isDeaf: boolean
    isHardOfHearing: boolean
    requiresSignLanguageInterpreter: boolean
    preferredSignLanguage?: string
    requiresVisualAlerts: boolean
    requiresTextCommunication: boolean
    hearingAidUser: boolean
    cochlearImplantUser: boolean
  }
  
  // Cognitive accessibility
  cognitiveNeeds: {
    requiresSimpleInstructions: boolean
    requiresExtraTime: boolean
    requiresRepeatInstructions: boolean
    preferredCommunicationStyle: 'simple' | 'detailed' | 'visual' | 'audio'
    requiresCompanionAssistance: boolean
    hasAutismSupport: boolean
    requiresQuietEnvironment: boolean
  }
  
  // Child and family needs
  childNeeds: {
    requiresChildSeat: boolean
    childSeatType?: 'infant' | 'convertible' | 'booster' | 'multiple'
    numberOfChildren: number
    childAges: number[]
    requiresStrollerSpace: boolean
    requiresFamilyFriendlyDriver: boolean
  }
  
  // Service animal and pet needs
  animalNeeds: {
    hasServiceAnimal: boolean
    serviceAnimalType?: 'guide_dog' | 'hearing_dog' | 'mobility_dog' | 'medical_alert' | 'psychiatric' | 'other'
    serviceAnimalCertified: boolean
    requiresAnimalSpace: boolean
    hasEmotionalSupportAnimal: boolean
    hasPet: boolean
    petType?: string
    requiresPetFriendlyVehicle: boolean
  }
  
  // Language and communication
  languageNeeds: {
    primaryLanguage: string
    requiresTranslation: boolean
    preferredLanguages: string[]
    requiresWrittenCommunication: boolean
    requiresVisualCommunication: boolean
    literacyLevel: 'basic' | 'intermediate' | 'advanced'
    requiresCulturalConsiderations: boolean
  }
  
  // Medical needs
  medicalNeeds: {
    requiresMedicalEquipment: boolean
    medicalEquipmentType?: string[]
    requiresOxygenTank: boolean
    requiresDialysisEquipment: boolean
    requiresTemperatureControl: boolean
    hasAllergies: boolean
    allergyTypes?: string[]
    requiresMedicationReminders: boolean
    requiresEmergencyMedicalInfo: boolean
  }
  
  // Emergency contacts and information
  emergencyInfo: {
    emergencyContacts: Array<{
      name: string
      relationship: string
      phone: string
      isCaregiver: boolean
    }>
    medicalConditions: string[]
    medications: string[]
    allergies: string[]
    specialInstructions: string
    preferredHospital?: string
  }
  
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AccessibilityRequest {
  id?: string
  userId: string
  bookingId?: string
  profileId: string
  requestType: 'booking' | 'modification' | 'emergency'
  
  // Requested accommodations
  accommodations: {
    vehicleType: 'wheelchair_accessible' | 'child_seat_equipped' | 'pet_friendly' | 'standard_with_accommodations'
    specificRequirements: string[]
    driverRequirements: string[]
    equipmentNeeded: string[]
    timeRequirements: {
      extraTime: number // minutes
      flexibleScheduling: boolean
      preferredTimeSlots: string[]
    }
  }
  
  status: 'pending' | 'approved' | 'fulfilled' | 'denied' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Fulfillment details
  fulfillment?: {
    assignedDriverId: string
    assignedVehicleId: string
    accommodationsProvided: string[]
    specialInstructions: string
    estimatedCost: number
    additionalFees: number
  }
  
  notes: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AccessibilityVehicle {
  id?: string
  vehicleId: string
  driverId: string
  
  // Accessibility features
  features: {
    wheelchairAccessible: boolean
    rampAccess: boolean
    liftAccess: boolean
    wheelchairSpaces: number
    childSeatCapacity: number
    childSeatTypes: string[]
    serviceAnimalFriendly: boolean
    petFriendly: boolean
    hearingLoopSystem: boolean
    visualDisplays: boolean
    audioAnnouncements: boolean
    temperatureControl: boolean
    medicalEquipmentSpace: boolean
  }
  
  // Driver capabilities
  driverCapabilities: {
    signLanguageCapable: boolean
    signLanguages: string[]
    disabilityAwarenessTraining: boolean
    firstAidCertified: boolean
    childSafetyTraining: boolean
    serviceAnimalTraining: boolean
    culturalSensitivityTraining: boolean
    languagesSpoken: string[]
  }
  
  // Equipment available
  equipment: {
    wheelchairSecurement: boolean
    transferBoard: boolean
    childSeats: string[]
    boosterSeats: number
    hearingAids: boolean
    visualAids: boolean
    communicationDevices: boolean
    medicalSupplies: boolean
  }
  
  isActive: boolean
  lastInspection: Timestamp
  certificationExpiry: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

class AccessibilityService {
  private readonly COLLECTION_PROFILES = 'accessibilityProfiles'
  private readonly COLLECTION_REQUESTS = 'accessibilityRequests'
  private readonly COLLECTION_VEHICLES = 'accessibilityVehicles'

  /**
   * Create accessibility profile
   */
  async createAccessibilityProfile(profile: Omit<AccessibilityProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const profileData = {
        ...profile,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_PROFILES), profileData)
      return docRef.id
    } catch (error) {
      console.error('Error creating accessibility profile:', error)
      throw new Error('Failed to create accessibility profile')
    }
  }

  /**
   * Get user's accessibility profiles
   */
  async getUserAccessibilityProfiles(userId: string): Promise<AccessibilityProfile[]> {
    try {
      const profilesQuery = query(
        collection(db, this.COLLECTION_PROFILES),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
      )

      const snapshot = await getDocs(profilesQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccessibilityProfile[]
    } catch (error) {
      console.error('Error getting accessibility profiles:', error)
      throw new Error('Failed to get accessibility profiles')
    }
  }

  /**
   * Update accessibility profile
   */
  async updateAccessibilityProfile(profileId: string, updates: Partial<AccessibilityProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_PROFILES, profileId), {
        ...updates,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error updating accessibility profile:', error)
      throw new Error('Failed to update accessibility profile')
    }
  }

  /**
   * Create accessibility request
   */
  async createAccessibilityRequest(request: Omit<AccessibilityRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const requestData = {
        ...request,
        status: 'pending' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_REQUESTS), requestData)
      return docRef.id
    } catch (error) {
      console.error('Error creating accessibility request:', error)
      throw new Error('Failed to create accessibility request')
    }
  }

  /**
   * Find accessible vehicles
   */
  async findAccessibleVehicles(requirements: {
    wheelchairAccessible?: boolean
    childSeatRequired?: boolean
    serviceAnimalFriendly?: boolean
    location: { lat: number; lng: number }
    radius?: number
  }): Promise<AccessibilityVehicle[]> {
    try {
      let vehiclesQuery = query(
        collection(db, this.COLLECTION_VEHICLES),
        where('isActive', '==', true)
      )

      const snapshot = await getDocs(vehiclesQuery)
      let vehicles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccessibilityVehicle[]

      // Filter based on requirements
      if (requirements.wheelchairAccessible) {
        vehicles = vehicles.filter(v => v.features.wheelchairAccessible)
      }

      if (requirements.childSeatRequired) {
        vehicles = vehicles.filter(v => v.features.childSeatCapacity > 0)
      }

      if (requirements.serviceAnimalFriendly) {
        vehicles = vehicles.filter(v => v.features.serviceAnimalFriendly)
      }

      // TODO: Add location-based filtering
      // This would require implementing geospatial queries

      return vehicles
    } catch (error) {
      console.error('Error finding accessible vehicles:', error)
      throw new Error('Failed to find accessible vehicles')
    }
  }

  /**
   * Get accessibility recommendations
   */
  async getAccessibilityRecommendations(userId: string, bookingContext: any): Promise<{
    recommendedAccommodations: string[]
    suggestedVehicleType: string
    estimatedAdditionalCost: number
    availabilityScore: number
  }> {
    try {
      const profiles = await this.getUserAccessibilityProfiles(userId)
      if (profiles.length === 0) {
        return {
          recommendedAccommodations: [],
          suggestedVehicleType: 'standard',
          estimatedAdditionalCost: 0,
          availabilityScore: 1.0
        }
      }

      const primaryProfile = profiles[0]
      const recommendations: string[] = []
      let suggestedVehicleType = 'standard'
      let estimatedCost = 0
      let availabilityScore = 1.0

      // Analyze mobility needs
      if (primaryProfile.mobilityNeeds.requiresWheelchairAccessibleVehicle) {
        recommendations.push('Wheelchair accessible vehicle')
        suggestedVehicleType = 'wheelchair_accessible'
        estimatedCost += 5 // Additional £5 for accessible vehicle
        availabilityScore *= 0.3 // Lower availability
      }

      // Analyze child needs
      if (primaryProfile.childNeeds.requiresChildSeat) {
        recommendations.push(`Child seat (${primaryProfile.childNeeds.childSeatType})`)
        estimatedCost += 2 // Additional £2 for child seat
        availabilityScore *= 0.7
      }

      // Analyze service animal needs
      if (primaryProfile.animalNeeds.hasServiceAnimal) {
        recommendations.push('Service animal accommodation')
        if (suggestedVehicleType === 'standard') {
          suggestedVehicleType = 'service_animal_friendly'
        }
        availabilityScore *= 0.8
      }

      // Analyze communication needs
      if (primaryProfile.hearingNeeds.requiresSignLanguageInterpreter) {
        recommendations.push('Sign language capable driver')
        estimatedCost += 10 // Premium for specialized driver
        availabilityScore *= 0.2
      }

      return {
        recommendedAccommodations: recommendations,
        suggestedVehicleType,
        estimatedAdditionalCost: estimatedCost,
        availabilityScore
      }
    } catch (error) {
      console.error('Error getting accessibility recommendations:', error)
      throw new Error('Failed to get accessibility recommendations')
    }
  }

  /**
   * Validate accessibility requirements
   */
  validateAccessibilityRequirements(profile: AccessibilityProfile): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate mobility needs
    if (profile.mobilityNeeds.wheelchairUser && !profile.mobilityNeeds.requiresWheelchairAccessibleVehicle) {
      warnings.push('Wheelchair user should consider requesting wheelchair accessible vehicle')
    }

    // Validate service animal requirements
    if (profile.animalNeeds.hasServiceAnimal && !profile.animalNeeds.serviceAnimalCertified) {
      errors.push('Service animal certification is required')
    }

    // Validate child safety requirements
    if (profile.childNeeds.numberOfChildren > 0 && !profile.childNeeds.requiresChildSeat) {
      const hasInfants = profile.childNeeds.childAges.some(age => age < 4)
      if (hasInfants) {
        errors.push('Child seats are required for children under 4 years old')
      }
    }

    // Validate emergency contacts
    if (profile.emergencyInfo.emergencyContacts.length === 0) {
      warnings.push('Consider adding emergency contacts for safety')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get accessibility statistics
   */
  async getAccessibilityStatistics(): Promise<{
    totalAccessibilityUsers: number
    wheelchairUsers: number
    serviceAnimalUsers: number
    childSeatUsers: number
    languageAssistanceUsers: number
    accessibleVehiclesAvailable: number
    averageWaitTime: number
    satisfactionScore: number
  }> {
    try {
      // This would typically involve complex aggregation queries
      // For now, returning mock data structure
      return {
        totalAccessibilityUsers: 0,
        wheelchairUsers: 0,
        serviceAnimalUsers: 0,
        childSeatUsers: 0,
        languageAssistanceUsers: 0,
        accessibleVehiclesAvailable: 0,
        averageWaitTime: 0,
        satisfactionScore: 0
      }
    } catch (error) {
      console.error('Error getting accessibility statistics:', error)
      throw new Error('Failed to get accessibility statistics')
    }
  }

  /**
   * Create default accessibility profile
   */
  createDefaultAccessibilityProfile(userId: string): Omit<AccessibilityProfile, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      userId,
      profileName: 'Default Accessibility Profile',
      isActive: true,
      mobilityNeeds: {
        wheelchairUser: false,
        wheelchairType: 'none',
        requiresWheelchairAccessibleVehicle: false,
        requiresRampAccess: false,
        requiresLiftAccess: false,
        transferAssistanceNeeded: false,
        preferredSeatingPosition: 'any'
      },
      visualNeeds: {
        isBlind: false,
        isPartiallyBlind: false,
        requiresServiceAnimal: false,
        requiresAudioAnnouncements: false,
        requiresLargeTextDisplay: false,
        requiresHighContrast: false,
        preferredFontSize: 'normal'
      },
      hearingNeeds: {
        isDeaf: false,
        isHardOfHearing: false,
        requiresSignLanguageInterpreter: false,
        requiresVisualAlerts: false,
        requiresTextCommunication: false,
        hearingAidUser: false,
        cochlearImplantUser: false
      },
      cognitiveNeeds: {
        requiresSimpleInstructions: false,
        requiresExtraTime: false,
        requiresRepeatInstructions: false,
        preferredCommunicationStyle: 'simple',
        requiresCompanionAssistance: false,
        hasAutismSupport: false,
        requiresQuietEnvironment: false
      },
      childNeeds: {
        requiresChildSeat: false,
        numberOfChildren: 0,
        childAges: [],
        requiresStrollerSpace: false,
        requiresFamilyFriendlyDriver: false
      },
      animalNeeds: {
        hasServiceAnimal: false,
        serviceAnimalCertified: false,
        requiresAnimalSpace: false,
        hasEmotionalSupportAnimal: false,
        hasPet: false,
        requiresPetFriendlyVehicle: false
      },
      languageNeeds: {
        primaryLanguage: 'en',
        requiresTranslation: false,
        preferredLanguages: ['en'],
        requiresWrittenCommunication: false,
        requiresVisualCommunication: false,
        literacyLevel: 'advanced',
        requiresCulturalConsiderations: false
      },
      medicalNeeds: {
        requiresMedicalEquipment: false,
        requiresOxygenTank: false,
        requiresDialysisEquipment: false,
        requiresTemperatureControl: false,
        hasAllergies: false,
        requiresMedicationReminders: false,
        requiresEmergencyMedicalInfo: false
      },
      emergencyInfo: {
        emergencyContacts: [],
        medicalConditions: [],
        medications: [],
        allergies: [],
        specialInstructions: ''
      }
    }
  }
}

export const accessibilityService = new AccessibilityService()