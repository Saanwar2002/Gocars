/**
 * Virtual User Factory
 * Creates realistic user profiles and simulates user behavior
 */

import { UserProfile } from './TestingAgentController'

export interface VirtualUser {
  id: string
  profile: UserProfile
  session: UserSession
  currentState: UserState
  actionHistory: UserAction[]
}

export interface UserSession {
  id: string
  startTime: Date
  lastActivity: Date
  isActive: boolean
  authToken?: string
  deviceInfo: {
    userAgent: string
    screenSize: { width: number; height: number }
    platform: string
  }
}

export interface UserState {
  currentPage: string
  isLoggedIn: boolean
  hasActiveBooking: boolean
  currentBookingId?: string
  location?: { lat: number; lng: number }
  paymentMethodSelected?: string
}

export interface UserAction {
  id: string
  timestamp: Date
  type: 'click' | 'input' | 'navigation' | 'api_call' | 'wait'
  target: string
  data?: any
  duration: number
  success: boolean
  error?: string
}

export class VirtualUserFactory {
  private static userCounter = 0

  /**
   * Create a virtual passenger user
   */
  public static createPassengerUser(experience: 'new' | 'regular' | 'power' = 'regular'): VirtualUser {
    const userId = `passenger_${++this.userCounter}_${Date.now()}`
    
    const profile: UserProfile = {
      id: userId,
      role: 'passenger',
      demographics: {
        age: this.randomAge(),
        location: this.randomLocation(),
        deviceType: this.randomDeviceType(),
        experience
      },
      preferences: {
        paymentMethod: this.randomPaymentMethod(),
        notificationSettings: {
          push: true,
          email: experience !== 'new',
          sms: experience === 'power'
        },
        language: 'en'
      },
      behaviorPatterns: {
        bookingFrequency: this.getBookingFrequency(experience),
        averageRideDistance: this.getAverageRideDistance(experience),
        preferredTimes: this.getPreferredTimes(experience),
        cancellationRate: this.getCancellationRate(experience)
      }
    }

    const session: UserSession = {
      id: `session_${userId}`,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      deviceInfo: {
        userAgent: this.generateUserAgent(profile.demographics.deviceType),
        screenSize: this.getScreenSize(profile.demographics.deviceType),
        platform: profile.demographics.deviceType
      }
    }

    const currentState: UserState = {
      currentPage: '/',
      isLoggedIn: false,
      hasActiveBooking: false,
      location: this.generateRandomCoordinates(profile.demographics.location)
    }

    return {
      id: userId,
      profile,
      session,
      currentState,
      actionHistory: []
    }
  }

  /**
   * Create a virtual driver user
   */
  public static createDriverUser(): VirtualUser {
    const userId = `driver_${++this.userCounter}_${Date.now()}`
    
    const profile: UserProfile = {
      id: userId,
      role: 'driver',
      demographics: {
        age: this.randomAge(25, 55), // Drivers typically in this range
        location: this.randomLocation(),
        deviceType: 'mobile', // Drivers primarily use mobile
        experience: 'regular'
      },
      preferences: {
        paymentMethod: 'bank_transfer',
        notificationSettings: {
          push: true,
          email: true,
          sms: true
        },
        language: 'en'
      },
      behaviorPatterns: {
        bookingFrequency: 20, // Rides per day
        averageRideDistance: 8,
        preferredTimes: ['06:00', '07:00', '08:00', '17:00', '18:00', '19:00'],
        cancellationRate: 0.02
      }
    }

    const session: UserSession = {
      id: `session_${userId}`,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      deviceInfo: {
        userAgent: this.generateUserAgent('mobile'),
        screenSize: { width: 375, height: 812 },
        platform: 'mobile'
      }
    }

    const currentState: UserState = {
      currentPage: '/driver/dashboard',
      isLoggedIn: false,
      hasActiveBooking: false,
      location: this.generateRandomCoordinates(profile.demographics.location)
    }

    return {
      id: userId,
      profile,
      session,
      currentState,
      actionHistory: []
    }
  }

  /**
   * Generate random age
   */
  private static randomAge(min: number = 18, max: number = 65): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Generate random location
   */
  private static randomLocation(): string {
    const locations = [
      'London, UK',
      'Manchester, UK',
      'Birmingham, UK',
      'Leeds, UK',
      'Glasgow, UK',
      'Liverpool, UK',
      'Newcastle, UK',
      'Sheffield, UK'
    ]
    return locations[Math.floor(Math.random() * locations.length)]
  }

  /**
   * Generate random device type
   */
  private static randomDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const weights = { mobile: 0.7, desktop: 0.2, tablet: 0.1 }
    const rand = Math.random()
    
    if (rand < weights.mobile) return 'mobile'
    if (rand < weights.mobile + weights.desktop) return 'desktop'
    return 'tablet'
  }

  /**
   * Generate random payment method
   */
  private static randomPaymentMethod(): string {
    const methods = ['card', 'paypal', 'apple_pay', 'google_pay', 'cash']
    return methods[Math.floor(Math.random() * methods.length)]
  }

  /**
   * Get booking frequency based on experience
   */
  private static getBookingFrequency(experience: string): number {
    switch (experience) {
      case 'new': return 1
      case 'regular': return 3
      case 'power': return 8
      default: return 3
    }
  }

  /**
   * Get average ride distance based on experience
   */
  private static getAverageRideDistance(experience: string): number {
    switch (experience) {
      case 'new': return 3
      case 'regular': return 5
      case 'power': return 7
      default: return 5
    }
  }

  /**
   * Get preferred booking times based on experience
   */
  private static getPreferredTimes(experience: string): string[] {
    const baseTimes = ['08:00', '18:00']
    
    switch (experience) {
      case 'new': return baseTimes
      case 'regular': return [...baseTimes, '12:00', '20:00']
      case 'power': return ['07:00', '08:00', '12:00', '17:00', '18:00', '20:00', '22:00']
      default: return baseTimes
    }
  }

  /**
   * Get cancellation rate based on experience
   */
  private static getCancellationRate(experience: string): number {
    switch (experience) {
      case 'new': return 0.15
      case 'regular': return 0.08
      case 'power': return 0.03
      default: return 0.08
    }
  }

  /**
   * Generate user agent string
   */
  private static generateUserAgent(deviceType: string): string {
    const userAgents = {
      mobile: [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      ],
      desktop: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ],
      tablet: [
        'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      ]
    }

    const agents = userAgents[deviceType as keyof typeof userAgents] || userAgents.desktop
    return agents[Math.floor(Math.random() * agents.length)]
  }

  /**
   * Get screen size based on device type
   */
  private static getScreenSize(deviceType: string): { width: number; height: number } {
    switch (deviceType) {
      case 'mobile':
        return { width: 375, height: 812 }
      case 'tablet':
        return { width: 768, height: 1024 }
      case 'desktop':
        return { width: 1920, height: 1080 }
      default:
        return { width: 1920, height: 1080 }
    }
  }

  /**
   * Generate random coordinates for a location
   */
  private static generateRandomCoordinates(location: string): { lat: number; lng: number } {
    // Simplified coordinate generation based on UK cities
    const coordinates: Record<string, { lat: number; lng: number; radius: number }> = {
      'London, UK': { lat: 51.5074, lng: -0.1278, radius: 0.1 },
      'Manchester, UK': { lat: 53.4808, lng: -2.2426, radius: 0.05 },
      'Birmingham, UK': { lat: 52.4862, lng: -1.8904, radius: 0.05 },
      'Leeds, UK': { lat: 53.8008, lng: -1.5491, radius: 0.05 },
      'Glasgow, UK': { lat: 55.8642, lng: -4.2518, radius: 0.05 },
      'Liverpool, UK': { lat: 53.4084, lng: -2.9916, radius: 0.05 },
      'Newcastle, UK': { lat: 54.9783, lng: -1.6178, radius: 0.05 },
      'Sheffield, UK': { lat: 53.3811, lng: -1.4701, radius: 0.05 }
    }

    const baseCoord = coordinates[location] || coordinates['London, UK']
    
    return {
      lat: baseCoord.lat + (Math.random() - 0.5) * baseCoord.radius,
      lng: baseCoord.lng + (Math.random() - 0.5) * baseCoord.radius
    }
  }

  /**
   * Record user action
   */
  public static recordAction(user: VirtualUser, action: Omit<UserAction, 'id' | 'timestamp'>): void {
    const userAction: UserAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...action
    }

    user.actionHistory.push(userAction)
    user.session.lastActivity = new Date()

    // Keep only last 100 actions to prevent memory issues
    if (user.actionHistory.length > 100) {
      user.actionHistory = user.actionHistory.slice(-100)
    }
  }

  /**
   * Update user state
   */
  public static updateState(user: VirtualUser, updates: Partial<UserState>): void {
    user.currentState = { ...user.currentState, ...updates }
    user.session.lastActivity = new Date()
  }

  /**
   * Simulate realistic delay based on user experience
   */
  public static getRealisticDelay(user: VirtualUser, actionType: string): number {
    const baseDelays = {
      click: 500,
      input: 1000,
      navigation: 2000,
      api_call: 100,
      wait: 3000
    }

    const experienceMultiplier = {
      new: 2.0,
      regular: 1.0,
      power: 0.7
    }

    const baseDelay = baseDelays[actionType as keyof typeof baseDelays] || 1000
    const multiplier = experienceMultiplier[user.profile.demographics.experience]
    
    // Add some randomness
    const randomFactor = 0.5 + Math.random()
    
    return Math.floor(baseDelay * multiplier * randomFactor)
  }
}