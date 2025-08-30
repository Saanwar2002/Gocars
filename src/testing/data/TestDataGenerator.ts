/**
 * Test Data Generator
 * Generates realistic test data for all user types and scenarios
 */

export interface UserProfile {
  id: string
  type: 'passenger' | 'driver' | 'admin' | 'support'
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: 'male' | 'female' | 'other'
    profilePicture?: string
  }
  location: {
    address: string
    city: string
    state: string
    country: string
    zipCode: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  preferences: {
    language: string
    currency: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
    accessibility: {
      wheelchairAccessible: boolean
      visualImpairment: boolean
      hearingImpairment: boolean
    }
  }
  metadata: {
    createdAt: number
    lastLoginAt: number
    isActive: boolean
    verificationStatus: 'pending' | 'verified' | 'rejected'
    ratingAverage: number
    totalRides: number
  }
}

export interface VehicleData {
  id: string
  driverId: string
  make: string
  model: string
  year: number
  color: string
  licensePlate: string
  vin: string
  type: 'sedan' | 'suv' | 'hatchback' | 'luxury' | 'electric'
  capacity: number
  features: string[]
  insurance: {
    provider: string
    policyNumber: string
    expiryDate: string
  }
  inspection: {
    lastInspectionDate: string
    nextInspectionDate: string
    status: 'valid' | 'expired' | 'pending'
  }
  location: {
    latitude: number
    longitude: number
    address: string
  }
  status: 'available' | 'busy' | 'offline' | 'maintenance'
  metadata: {
    createdAt: number
    lastUpdated: number
    totalTrips: number
    averageRating: number
  }
}

export interface BookingData {
  id: string
  passengerId: string
  driverId?: string
  vehicleId?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  type: 'immediate' | 'scheduled'
  pickup: {
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
    scheduledTime?: number
  }
  destination: {
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  pricing: {
    baseFare: number
    distanceFare: number
    timeFare: number
    surgeMultiplier: number
    totalFare: number
    currency: string
  }
  trip: {
    startTime?: number
    endTime?: number
    distance?: number
    duration?: number
    route?: Array<{
      latitude: number
      longitude: number
      timestamp: number
    }>
  }
  payment: {
    method: 'cash' | 'card' | 'wallet' | 'upi'
    status: 'pending' | 'completed' | 'failed' | 'refunded'
    transactionId?: string
  }
  metadata: {
    createdAt: number
    updatedAt: number
    source: 'app' | 'web' | 'api'
  }
}

export interface PaymentData {
  id: string
  userId: string
  bookingId?: string
  type: 'ride_payment' | 'wallet_topup' | 'refund' | 'commission'
  amount: number
  currency: string
  method: 'cash' | 'credit_card' | 'debit_card' | 'wallet' | 'upi' | 'bank_transfer'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  gateway: {
    provider: string
    transactionId: string
    gatewayResponse?: any
  }
  metadata: {
    createdAt: number
    processedAt?: number
    failureReason?: string
    refundReason?: string
  }
}

export interface TestDataConfig {
  userProfiles: {
    passengers: number
    drivers: number
    admins: number
    support: number
  }
  vehicles: {
    perDriver: number
    types: Record<string, number>
  }
  bookings: {
    total: number
    statusDistribution: Record<string, number>
    timeRange: {
      startDate: string
      endDate: string
    }
  }
  payments: {
    perBooking: number
    methodDistribution: Record<string, number>
  }
  locations: {
    cities: string[]
    radiusKm: number
  }
  anonymization: {
    enabled: boolean
    preserveRelationships: boolean
    hashSensitiveData: boolean
  }
}

export class TestDataGenerator {
  private config: TestDataConfig
  private generatedData: {
    users: Map<string, UserProfile>
    vehicles: Map<string, VehicleData>
    bookings: Map<string, BookingData>
    payments: Map<string, PaymentData>
  }

  // Sample data pools for realistic generation
  private readonly sampleData = {
    firstNames: {
      male: ['John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher'],
      female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
      other: ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 'Phoenix']
    },
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
    vehicleMakes: ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai'],
    vehicleModels: {
      Toyota: ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander'],
      Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Fit'],
      Ford: ['Focus', 'Fusion', 'Escape', 'Explorer', 'F-150'],
      Chevrolet: ['Cruze', 'Malibu', 'Equinox', 'Tahoe', 'Silverado'],
      Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Titan']
    },
    colors: ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown'],
    streets: ['Main St', 'Oak Ave', 'Park Rd', 'First St', 'Second St', 'Third St', 'Elm St', 'Washington Ave', 'Lincoln Blvd', 'Madison Dr']
  }

  constructor(config: TestDataConfig) {
    this.config = config
    this.generatedData = {
      users: new Map(),
      vehicles: new Map(),
      bookings: new Map(),
      payments: new Map()
    }
  }

  /**
   * Generate complete test dataset
   */
  public async generateTestData(): Promise<void> {
    console.log('Starting test data generation...')

    try {
      // Generate users
      console.log('Generating user profiles...')
      await this.generateUserProfiles()

      // Generate vehicles
      console.log('Generating vehicle data...')
      await this.generateVehicleData()

      // Generate bookings
      console.log('Generating booking data...')
      await this.generateBookingData()

      // Generate payments
      console.log('Generating payment data...')
      await this.generatePaymentData()

      // Apply anonymization if enabled
      if (this.config.anonymization.enabled) {
        console.log('Applying data anonymization...')
        await this.anonymizeData()
      }

      console.log('Test data generation completed successfully')
      this.logGenerationSummary()

    } catch (error) {
      console.error('Test data generation failed:', error)
      throw error
    }
  }

  /**
   * Generate user profiles
   */
  private async generateUserProfiles(): Promise<void> {
    const { passengers, drivers, admins, support } = this.config.userProfiles

    // Generate passengers
    for (let i = 0; i < passengers; i++) {
      const user = this.generateUserProfile('passenger')
      this.generatedData.users.set(user.id, user)
    }

    // Generate drivers
    for (let i = 0; i < drivers; i++) {
      const user = this.generateUserProfile('driver')
      this.generatedData.users.set(user.id, user)
    }

    // Generate admins
    for (let i = 0; i < admins; i++) {
      const user = this.generateUserProfile('admin')
      this.generatedData.users.set(user.id, user)
    }

    // Generate support staff
    for (let i = 0; i < support; i++) {
      const user = this.generateUserProfile('support')
      this.generatedData.users.set(user.id, user)
    }
  }

  /**
   * Generate single user profile
   */
  private generateUserProfile(type: UserProfile['type']): UserProfile {
    const gender = this.randomChoice(['male', 'female', 'other']) as 'male' | 'female' | 'other'
    const firstName = this.randomChoice(this.sampleData.firstNames[gender])
    const lastName = this.randomChoice(this.sampleData.lastNames)
    const city = this.randomChoice(this.sampleData.cities)

    return {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      personalInfo: {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: this.generatePhoneNumber(),
        dateOfBirth: this.generateDateOfBirth(),
        gender,
        profilePicture: `https://example.com/avatars/${firstName.toLowerCase()}_${lastName.toLowerCase()}.jpg`
      },
      location: {
        address: `${Math.floor(Math.random() * 9999) + 1} ${this.randomChoice(this.sampleData.streets)}`,
        city,
        state: this.getCityState(city),
        country: 'United States',
        zipCode: this.generateZipCode(),
        coordinates: this.generateCityCoordinates(city)
      },
      preferences: {
        language: this.randomChoice(['en', 'es', 'fr', 'de', 'it']),
        currency: 'USD',
        notifications: {
          email: Math.random() > 0.3,
          sms: Math.random() > 0.5,
          push: Math.random() > 0.2
        },
        accessibility: {
          wheelchairAccessible: Math.random() > 0.9,
          visualImpairment: Math.random() > 0.95,
          hearingImpairment: Math.random() > 0.95
        }
      },
      metadata: {
        createdAt: this.generateRandomTimestamp(),
        lastLoginAt: this.generateRecentTimestamp(),
        isActive: Math.random() > 0.1,
        verificationStatus: this.randomChoice(['verified', 'pending', 'rejected'], [0.8, 0.15, 0.05]),
        ratingAverage: Math.random() * 2 + 3, // 3-5 rating
        totalRides: type === 'passenger' ? Math.floor(Math.random() * 100) : 
                   type === 'driver' ? Math.floor(Math.random() * 500) : 0
      }
    }
  }

  /**
   * Generate vehicle data
   */
  private async generateVehicleData(): Promise<void> {
    const drivers = Array.from(this.generatedData.users.values()).filter(u => u.type === 'driver')

    for (const driver of drivers) {
      const vehicleCount = this.config.vehicles.perDriver
      
      for (let i = 0; i < vehicleCount; i++) {
        const vehicle = this.generateVehicle(driver.id, driver.location.coordinates)
        this.generatedData.vehicles.set(vehicle.id, vehicle)
      }
    }
  }

  /**
   * Generate single vehicle
   */
  private generateVehicle(driverId: string, driverLocation: { latitude: number; longitude: number }): VehicleData {
    const make = this.randomChoice(this.sampleData.vehicleMakes)
    const models = this.sampleData.vehicleModels[make as keyof typeof this.sampleData.vehicleModels] || ['Model1', 'Model2', 'Model3']
    const model = this.randomChoice(models)
    const year = Math.floor(Math.random() * 10) + 2015 // 2015-2024
    const color = this.randomChoice(this.sampleData.colors)

    return {
      id: `vehicle_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      driverId,
      make,
      model,
      year,
      color,
      licensePlate: this.generateLicensePlate(),
      vin: this.generateVIN(),
      type: this.randomChoice(['sedan', 'suv', 'hatchback', 'luxury', 'electric'], [0.4, 0.3, 0.15, 0.1, 0.05]),
      capacity: Math.floor(Math.random() * 3) + 4, // 4-6 passengers
      features: this.generateVehicleFeatures(),
      insurance: {
        provider: this.randomChoice(['State Farm', 'Geico', 'Progressive', 'Allstate', 'USAA']),
        policyNumber: `POL${Math.random().toString().substr(2, 10)}`,
        expiryDate: this.generateFutureDate()
      },
      inspection: {
        lastInspectionDate: this.generatePastDate(),
        nextInspectionDate: this.generateFutureDate(),
        status: this.randomChoice(['valid', 'expired', 'pending'], [0.8, 0.1, 0.1])
      },
      location: {
        latitude: driverLocation.latitude + (Math.random() - 0.5) * 0.1,
        longitude: driverLocation.longitude + (Math.random() - 0.5) * 0.1,
        address: `${Math.floor(Math.random() * 9999) + 1} ${this.randomChoice(this.sampleData.streets)}`
      },
      status: this.randomChoice(['available', 'busy', 'offline', 'maintenance'], [0.6, 0.2, 0.15, 0.05]),
      metadata: {
        createdAt: this.generateRandomTimestamp(),
        lastUpdated: this.generateRecentTimestamp(),
        totalTrips: Math.floor(Math.random() * 1000),
        averageRating: Math.random() * 2 + 3 // 3-5 rating
      }
    }
  }

  /**
   * Generate booking data
   */
  private async generateBookingData(): Promise<void> {
    const passengers = Array.from(this.generatedData.users.values()).filter(u => u.type === 'passenger')
    const drivers = Array.from(this.generatedData.users.values()).filter(u => u.type === 'driver')
    const vehicles = Array.from(this.generatedData.vehicles.values())

    for (let i = 0; i < this.config.bookings.total; i++) {
      const passenger = this.randomChoice(passengers)
      const driver = Math.random() > 0.1 ? this.randomChoice(drivers) : undefined
      const vehicle = driver ? this.randomChoice(vehicles.filter(v => v.driverId === driver.id)) : undefined

      const booking = this.generateBooking(passenger, driver, vehicle)
      this.generatedData.bookings.set(booking.id, booking)
    }
  }

  /**
   * Generate single booking
   */
  private generateBooking(passenger: UserProfile, driver?: UserProfile, vehicle?: VehicleData): BookingData {
    const status = this.randomChoice(
      ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      [0.05, 0.1, 0.05, 0.7, 0.1]
    ) as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

    const pickup = {
      address: `${Math.floor(Math.random() * 9999) + 1} ${this.randomChoice(this.sampleData.streets)}, ${passenger.location.city}`,
      coordinates: {
        latitude: passenger.location.coordinates.latitude + (Math.random() - 0.5) * 0.05,
        longitude: passenger.location.coordinates.longitude + (Math.random() - 0.5) * 0.05
      }
    }

    const destination = {
      address: `${Math.floor(Math.random() * 9999) + 1} ${this.randomChoice(this.sampleData.streets)}, ${passenger.location.city}`,
      coordinates: {
        latitude: pickup.coordinates.latitude + (Math.random() - 0.5) * 0.1,
        longitude: pickup.coordinates.longitude + (Math.random() - 0.5) * 0.1
      }
    }

    const distance = this.calculateDistance(pickup.coordinates, destination.coordinates)
    const baseFare = 2.50
    const distanceFare = distance * 1.20
    const timeFare = Math.random() * 5
    const surgeMultiplier = Math.random() > 0.8 ? Math.random() * 2 + 1 : 1
    const totalFare = (baseFare + distanceFare + timeFare) * surgeMultiplier

    return {
      id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      passengerId: passenger.id,
      driverId: driver?.id,
      vehicleId: vehicle?.id,
      status,
      type: this.randomChoice(['immediate', 'scheduled'], [0.8, 0.2]),
      pickup,
      destination,
      pricing: {
        baseFare,
        distanceFare,
        timeFare,
        surgeMultiplier,
        totalFare: Math.round(totalFare * 100) / 100,
        currency: 'USD'
      },
      trip: status === 'completed' ? {
        startTime: this.generateRandomTimestamp(),
        endTime: this.generateRandomTimestamp() + Math.random() * 3600000, // Up to 1 hour
        distance,
        duration: Math.floor(distance * 2 + Math.random() * 1800), // Rough duration in seconds
        route: this.generateRoute(pickup.coordinates, destination.coordinates)
      } : {},
      payment: {
        method: this.randomChoice(['cash', 'wallet', 'upi'], [0.4, 0.4, 0.2]) as 'cash' | 'wallet' | 'upi',
        status: status === 'completed' ? 'completed' : 'pending'
      },
      metadata: {
        createdAt: this.generateRandomTimestamp(),
        updatedAt: this.generateRecentTimestamp(),
        source: this.randomChoice(['app', 'web', 'api'], [0.8, 0.15, 0.05])
      }
    }
  }

  /**
   * Generate payment data
   */
  private async generatePaymentData(): Promise<void> {
    const bookings = Array.from(this.generatedData.bookings.values())

    for (const booking of bookings) {
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        const payment = this.generatePayment(booking)
        this.generatedData.payments.set(payment.id, payment)
      }
    }

    // Generate additional wallet top-ups and other payment types
    const users = Array.from(this.generatedData.users.values())
    for (let i = 0; i < Math.floor(users.length * 0.3); i++) {
      const user = this.randomChoice(users)
      const payment = this.generateWalletTopup(user)
      this.generatedData.payments.set(payment.id, payment)
    }
  }

  /**
   * Generate single payment
   */
  private generatePayment(booking: BookingData): PaymentData {
    return {
      id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId: booking.passengerId,
      bookingId: booking.id,
      type: 'ride_payment',
      amount: booking.pricing.totalFare,
      currency: booking.pricing.currency,
      method: booking.payment.method,
      status: booking.status === 'completed' ? 'completed' : 'failed',
      gateway: {
        provider: this.randomChoice(['Stripe', 'PayPal', 'Square', 'Razorpay']),
        transactionId: `txn_${Math.random().toString(36).substring(2, 18)}`
      },
      metadata: {
        createdAt: booking.metadata.createdAt,
        processedAt: booking.metadata.updatedAt
      }
    }
  }

  /**
   * Generate wallet top-up payment
   */
  private generateWalletTopup(user: UserProfile): PaymentData {
    return {
      id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId: user.id,
      type: 'wallet_topup',
      amount: Math.floor(Math.random() * 100) + 10, // $10-$110
      currency: 'USD',
      method: this.randomChoice(['credit_card', 'debit_card', 'bank_transfer'], [0.5, 0.3, 0.2]),
      status: this.randomChoice(['completed', 'failed'], [0.9, 0.1]),
      gateway: {
        provider: this.randomChoice(['Stripe', 'PayPal', 'Square']),
        transactionId: `txn_${Math.random().toString(36).substring(2, 18)}`
      },
      metadata: {
        createdAt: this.generateRandomTimestamp(),
        processedAt: this.generateRecentTimestamp()
      }
    }
  }

  /**
   * Apply data anonymization
   */
  private async anonymizeData(): Promise<void> {
    if (this.config.anonymization.hashSensitiveData) {
      // Anonymize user data
      for (const [id, user] of this.generatedData.users) {
        user.personalInfo.email = this.hashString(user.personalInfo.email)
        user.personalInfo.phone = this.hashString(user.personalInfo.phone)
        
        if (!this.config.anonymization.preserveRelationships) {
          user.personalInfo.firstName = `User${this.hashString(user.personalInfo.firstName).substring(0, 6)}`
          user.personalInfo.lastName = `Last${this.hashString(user.personalInfo.lastName).substring(0, 6)}`
        }
      }

      // Anonymize vehicle data
      for (const [, vehicle] of this.generatedData.vehicles) {
        vehicle.licensePlate = this.hashString(vehicle.licensePlate).substring(0, 8).toUpperCase()
        vehicle.vin = this.hashString(vehicle.vin)
      }
    }
  }

  // Utility methods

  private randomChoice<T>(array: T[], weights?: number[]): T {
    if (!weights) {
      return array[Math.floor(Math.random() * array.length)]
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < array.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return array[i]
      }
    }
    
    return array[array.length - 1]
  }

  private generatePhoneNumber(): string {
    return `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 9000 + 1000)}`
  }

  private generateDateOfBirth(): string {
    const year = Math.floor(Math.random() * 50) + 1960 // 1960-2010
    const month = Math.floor(Math.random() * 12) + 1
    const day = Math.floor(Math.random() * 28) + 1
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  private generateZipCode(): string {
    return Math.floor(Math.random() * 90000 + 10000).toString()
  }

  private generateCityCoordinates(city: string): { latitude: number; longitude: number } {
    // Simplified city coordinates (in real implementation, use actual coordinates)
    const cityCoords: Record<string, { latitude: number; longitude: number }> = {
      'New York': { latitude: 40.7128, longitude: -74.0060 },
      'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
      'Chicago': { latitude: 41.8781, longitude: -87.6298 },
      'Houston': { latitude: 29.7604, longitude: -95.3698 },
      'Phoenix': { latitude: 33.4484, longitude: -112.0740 }
    }
    
    return cityCoords[city] || { latitude: 40.7128, longitude: -74.0060 }
  }

  private getCityState(city: string): string {
    const cityStates: Record<string, string> = {
      'New York': 'NY',
      'Los Angeles': 'CA',
      'Chicago': 'IL',
      'Houston': 'TX',
      'Phoenix': 'AZ'
    }
    
    return cityStates[city] || 'NY'
  }

  private generateRandomTimestamp(): number {
    const start = new Date(this.config.bookings.timeRange.startDate).getTime()
    const end = new Date(this.config.bookings.timeRange.endDate).getTime()
    return Math.floor(Math.random() * (end - start) + start)
  }

  private generateRecentTimestamp(): number {
    const now = Date.now()
    const dayAgo = now - (24 * 60 * 60 * 1000)
    return Math.floor(Math.random() * (now - dayAgo) + dayAgo)
  }

  private generateLicensePlate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    
    return `${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}-${numbers[Math.floor(Math.random() * numbers.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}`
  }

  private generateVIN(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let vin = ''
    for (let i = 0; i < 17; i++) {
      vin += chars[Math.floor(Math.random() * chars.length)]
    }
    return vin
  }

  private generateVehicleFeatures(): string[] {
    const allFeatures = ['GPS', 'Bluetooth', 'AC', 'Heating', 'USB Charging', 'WiFi', 'Leather Seats', 'Sunroof', 'Backup Camera', 'Parking Sensors']
    const featureCount = Math.floor(Math.random() * 5) + 3 // 3-7 features
    
    const shuffled = allFeatures.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, featureCount)
  }

  private generatePastDate(): string {
    const now = new Date()
    const pastDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Up to 1 year ago
    return pastDate.toISOString().split('T')[0]
  }

  private generateFutureDate(): string {
    const now = new Date()
    const futureDate = new Date(now.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000) // Up to 1 year from now
    return futureDate.toISOString().split('T')[0]
  }

  private calculateDistance(coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private generateRoute(start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }): Array<{ latitude: number; longitude: number; timestamp: number }> {
    const route = []
    const steps = Math.floor(Math.random() * 10) + 5 // 5-15 route points
    const startTime = Date.now()
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      route.push({
        latitude: start.latitude + (end.latitude - start.latitude) * progress + (Math.random() - 0.5) * 0.001,
        longitude: start.longitude + (end.longitude - start.longitude) * progress + (Math.random() - 0.5) * 0.001,
        timestamp: startTime + (i * 60000) // 1 minute intervals
      })
    }
    
    return route
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private logGenerationSummary(): void {
    console.log('\n=== Test Data Generation Summary ===')
    console.log(`Users: ${this.generatedData.users.size}`)
    console.log(`  - Passengers: ${Array.from(this.generatedData.users.values()).filter(u => u.type === 'passenger').length}`)
    console.log(`  - Drivers: ${Array.from(this.generatedData.users.values()).filter(u => u.type === 'driver').length}`)
    console.log(`  - Admins: ${Array.from(this.generatedData.users.values()).filter(u => u.type === 'admin').length}`)
    console.log(`  - Support: ${Array.from(this.generatedData.users.values()).filter(u => u.type === 'support').length}`)
    console.log(`Vehicles: ${this.generatedData.vehicles.size}`)
    console.log(`Bookings: ${this.generatedData.bookings.size}`)
    console.log(`Payments: ${this.generatedData.payments.size}`)
    console.log(`Anonymization: ${this.config.anonymization.enabled ? 'Enabled' : 'Disabled'}`)
  }

  /**
   * Get generated data
   */
  public getGeneratedData() {
    return {
      users: Array.from(this.generatedData.users.values()),
      vehicles: Array.from(this.generatedData.vehicles.values()),
      bookings: Array.from(this.generatedData.bookings.values()),
      payments: Array.from(this.generatedData.payments.values())
    }
  }

  /**
   * Export data to JSON
   */
  public exportToJSON(): string {
    return JSON.stringify(this.getGeneratedData(), null, 2)
  }

  /**
   * Clear generated data
   */
  public clearData(): void {
    this.generatedData.users.clear()
    this.generatedData.vehicles.clear()
    this.generatedData.bookings.clear()
    this.generatedData.payments.clear()
  }
}