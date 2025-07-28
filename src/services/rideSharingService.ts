/**
 * Ride Sharing Service
 * Handles ride sharing matching, booking, and management
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
  Timestamp,
  GeoPoint
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Ensure db is not null
if (!db) {
  throw new Error('Firebase database not initialized')
}

export interface SharedRideRequest {
  id?: string
  passengerId: string
  passengerName: string
  passengerRating: number
  pickupLocation: {
    address: string
    coordinates: GeoPoint
  }
  dropoffLocation: {
    address: string
    coordinates: GeoPoint
  }
  requestedTime: Timestamp
  flexibilityMinutes: number // How flexible the passenger is with timing
  maxDetourMinutes: number // Maximum acceptable detour
  seatsNeeded: number
  preferences: {
    gender?: 'male' | 'female' | 'any'
    smokingAllowed: boolean
    petsAllowed: boolean
    musicPreference: 'none' | 'low' | 'any'
    conversationLevel: 'quiet' | 'friendly' | 'chatty'
  }
  priceRange: {
    min: number
    max: number
  }
  status: 'searching' | 'matched' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface SharedRideOffer {
  id?: string
  driverId: string
  driverName: string
  driverRating: number
  vehicleInfo: {
    make: string
    model: string
    color: string
    licensePlate: string
    capacity: number
  }
  route: {
    origin: {
      address: string
      coordinates: GeoPoint
    }
    destination: {
      address: string
      coordinates: GeoPoint
    }
    waypoints: Array<{
      address: string
      coordinates: GeoPoint
      type: 'pickup' | 'dropoff'
      passengerId?: string
    }>
  }
  departureTime: Timestamp
  availableSeats: number
  pricePerSeat: number
  preferences: {
    passengerGender?: 'male' | 'female' | 'any'
    smokingAllowed: boolean
    petsAllowed: boolean
    conversationLevel: 'quiet' | 'friendly' | 'chatty'
  }
  status: 'available' | 'full' | 'in_progress' | 'completed' | 'cancelled'
  passengers: Array<{
    passengerId: string
    passengerName: string
    pickupLocation: GeoPoint
    dropoffLocation: GeoPoint
    status: 'confirmed' | 'picked_up' | 'dropped_off'
    fare: number
  }>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface RideMatch {
  requestId: string
  offerId: string
  compatibilityScore: number
  estimatedFare: number
  estimatedDuration: number
  detourTime: number
  factors: {
    routeCompatibility: number
    timeCompatibility: number
    preferenceCompatibility: number
    priceCompatibility: number
    ratingCompatibility: number
  }
}

export interface SharedRideBooking {
  id?: string
  requestId: string
  offerId: string
  passengerId: string
  driverId: string
  pickupLocation: GeoPoint
  dropoffLocation: GeoPoint
  estimatedPickupTime: Timestamp
  estimatedDropoffTime: Timestamp
  actualPickupTime?: Timestamp
  actualDropoffTime?: Timestamp
  fare: number
  paymentStatus: 'pending' | 'paid' | 'refunded'
  status: 'confirmed' | 'driver_en_route' | 'passenger_picked_up' | 'completed' | 'cancelled'
  cancellationReason?: string
  rating?: {
    passengerRating: number
    driverRating: number
    feedback?: string
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

class RideSharingService {
  private readonly COLLECTION_REQUESTS = 'sharedRideRequests'
  private readonly COLLECTION_OFFERS = 'sharedRideOffers'
  private readonly COLLECTION_BOOKINGS = 'sharedRideBookings'

  /**
   * Create a new ride sharing request
   */
  async createRideRequest(request: Omit<SharedRideRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const requestData = {
        ...request,
        status: 'searching' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_REQUESTS), requestData)
      
      // Start matching process
      this.findMatches(docRef.id)
      
      return docRef.id
    } catch (error) {
      console.error('Error creating ride request:', error)
      throw new Error('Failed to create ride request')
    }
  }

  /**
   * Create a new ride sharing offer
   */
  async createRideOffer(offer: Omit<SharedRideOffer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const offerData = {
        ...offer,
        status: 'available' as const,
        passengers: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_OFFERS), offerData)
      return docRef.id
    } catch (error) {
      console.error('Error creating ride offer:', error)
      throw new Error('Failed to create ride offer')
    }
  }

  /**
   * Find matching rides for a request
   */
  async findMatches(requestId: string): Promise<RideMatch[]> {
    try {
      const requestDoc = await getDoc(doc(db, this.COLLECTION_REQUESTS, requestId))
      if (!requestDoc.exists()) {
        throw new Error('Request not found')
      }

      const request = { id: requestDoc.id, ...requestDoc.data() } as SharedRideRequest

      // Get available offers
      const offersQuery = query(
        collection(db, this.COLLECTION_OFFERS),
        where('status', '==', 'available'),
        where('availableSeats', '>=', request.seatsNeeded),
        orderBy('createdAt', 'desc'),
        limit(50)
      )

      const offersSnapshot = await getDocs(offersQuery)
      const offers = offersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SharedRideOffer[]

      // Calculate compatibility scores
      const matches: RideMatch[] = []

      for (const offer of offers) {
        const compatibilityScore = this.calculateCompatibilityScore(request, offer)
        
        if (compatibilityScore.total > 0.6) { // Minimum compatibility threshold
          const estimatedFare = this.calculateSharedFare(request, offer)
          const detourTime = this.calculateDetourTime(request, offer)
          
          if (detourTime <= request.maxDetourMinutes) {
            matches.push({
              requestId: request.id!,
              offerId: offer.id!,
              compatibilityScore: compatibilityScore.total,
              estimatedFare,
              estimatedDuration: this.calculateTripDuration(request, offer),
              detourTime,
              factors: compatibilityScore.factors
            })
          }
        }
      }

      // Sort by compatibility score
      matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore)

      return matches.slice(0, 10) // Return top 10 matches
    } catch (error) {
      console.error('Error finding matches:', error)
      throw new Error('Failed to find matches')
    }
  }

  /**
   * Calculate compatibility score between request and offer
   */
  private calculateCompatibilityScore(request: SharedRideRequest, offer: SharedRideOffer): {
    total: number
    factors: {
      routeCompatibility: number
      timeCompatibility: number
      preferenceCompatibility: number
      priceCompatibility: number
      ratingCompatibility: number
    }
  } {
    // Route compatibility (0-1)
    const routeCompatibility = this.calculateRouteCompatibility(request, offer)
    
    // Time compatibility (0-1)
    const timeCompatibility = this.calculateTimeCompatibility(request, offer)
    
    // Preference compatibility (0-1)
    const preferenceCompatibility = this.calculatePreferenceCompatibility(request, offer)
    
    // Price compatibility (0-1)
    const priceCompatibility = this.calculatePriceCompatibility(request, offer)
    
    // Rating compatibility (0-1)
    const ratingCompatibility = Math.min(request.passengerRating, offer.driverRating) / 5
    
    // Weighted total score
    const weights = {
      route: 0.35,
      time: 0.25,
      preference: 0.20,
      price: 0.15,
      rating: 0.05
    }
    
    const total = (
      routeCompatibility * weights.route +
      timeCompatibility * weights.time +
      preferenceCompatibility * weights.preference +
      priceCompatibility * weights.price +
      ratingCompatibility * weights.rating
    )
    
    return {
      total,
      factors: {
        routeCompatibility,
        timeCompatibility,
        preferenceCompatibility,
        priceCompatibility,
        ratingCompatibility
      }
    }
  }

  /**
   * Calculate route compatibility
   */
  private calculateRouteCompatibility(request: SharedRideRequest, offer: SharedRideOffer): number {
    // Simplified calculation - in real implementation, use proper routing algorithms
    const pickupDistance = this.calculateDistance(
      request.pickupLocation.coordinates,
      offer.route.origin.coordinates
    )
    
    const dropoffDistance = this.calculateDistance(
      request.dropoffLocation.coordinates,
      offer.route.destination.coordinates
    )
    
    // Normalize distances (assuming max acceptable distance is 5km)
    const maxDistance = 5000 // 5km in meters
    const pickupScore = Math.max(0, 1 - (pickupDistance / maxDistance))
    const dropoffScore = Math.max(0, 1 - (dropoffDistance / maxDistance))
    
    return (pickupScore + dropoffScore) / 2
  }

  /**
   * Calculate time compatibility
   */
  private calculateTimeCompatibility(request: SharedRideRequest, offer: SharedRideOffer): number {
    const requestTime = request.requestedTime.toMillis()
    const offerTime = offer.departureTime.toMillis()
    const timeDiff = Math.abs(requestTime - offerTime) / (1000 * 60) // minutes
    
    if (timeDiff <= request.flexibilityMinutes) {
      return 1 - (timeDiff / request.flexibilityMinutes)
    }
    
    return 0
  }

  /**
   * Calculate preference compatibility
   */
  private calculatePreferenceCompatibility(request: SharedRideRequest, offer: SharedRideOffer): number {
    let score = 0
    let factors = 0
    
    // Gender preference
    if (request.preferences.gender && offer.preferences.passengerGender) {
      factors++
      if (request.preferences.gender === offer.preferences.passengerGender || 
          request.preferences.gender === 'any' || 
          offer.preferences.passengerGender === 'any') {
        score++
      }
    }
    
    // Smoking preference
    factors++
    if (request.preferences.smokingAllowed === offer.preferences.smokingAllowed) {
      score++
    }
    
    // Pets preference
    factors++
    if (request.preferences.petsAllowed === offer.preferences.petsAllowed) {
      score++
    }
    
    // Conversation level
    factors++
    if (request.preferences.conversationLevel === offer.preferences.conversationLevel) {
      score++
    } else if (request.preferences.conversationLevel === 'friendly' || 
               offer.preferences.conversationLevel === 'friendly') {
      score += 0.5 // Partial match for friendly
    }
    
    return factors > 0 ? score / factors : 0.5 // Default neutral score
  }

  /**
   * Calculate price compatibility
   */
  private calculatePriceCompatibility(request: SharedRideRequest, offer: SharedRideOffer): number {
    if (offer.pricePerSeat >= request.priceRange.min && offer.pricePerSeat <= request.priceRange.max) {
      return 1
    }
    
    // Partial compatibility if close to range
    const midPrice = (request.priceRange.min + request.priceRange.max) / 2
    const priceRange = request.priceRange.max - request.priceRange.min
    const priceDiff = Math.abs(offer.pricePerSeat - midPrice)
    
    return Math.max(0, 1 - (priceDiff / priceRange))
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(coord1: GeoPoint, coord2: GeoPoint): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI / 180
    const φ2 = coord2.latitude * Math.PI / 180
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  /**
   * Calculate shared ride fare
   */
  private calculateSharedFare(request: SharedRideRequest, offer: SharedRideOffer): number {
    // Base fare calculation considering distance and time
    const distance = this.calculateDistance(
      request.pickupLocation.coordinates,
      request.dropoffLocation.coordinates
    )
    
    const baseFare = Math.max(5, distance / 1000 * 2) // £2 per km, minimum £5
    const sharedDiscount = 0.7 // 30% discount for sharing
    
    return Math.round(baseFare * sharedDiscount * 100) / 100
  }

  /**
   * Calculate detour time
   */
  private calculateDetourTime(request: SharedRideRequest, offer: SharedRideOffer): number {
    // Simplified calculation - in real implementation, use routing API
    const directDistance = this.calculateDistance(
      offer.route.origin.coordinates,
      offer.route.destination.coordinates
    )
    
    const withDetourDistance = 
      this.calculateDistance(offer.route.origin.coordinates, request.pickupLocation.coordinates) +
      this.calculateDistance(request.pickupLocation.coordinates, request.dropoffLocation.coordinates) +
      this.calculateDistance(request.dropoffLocation.coordinates, offer.route.destination.coordinates)
    
    const extraDistance = withDetourDistance - directDistance
    const averageSpeed = 30 // km/h in city
    
    return Math.round((extraDistance / 1000) / averageSpeed * 60) // minutes
  }

  /**
   * Calculate trip duration
   */
  private calculateTripDuration(request: SharedRideRequest, offer: SharedRideOffer): number {
    const distance = this.calculateDistance(
      request.pickupLocation.coordinates,
      request.dropoffLocation.coordinates
    )
    
    const averageSpeed = 30 // km/h
    return Math.round((distance / 1000) / averageSpeed * 60) // minutes
  }

  /**
   * Book a shared ride
   */
  async bookSharedRide(match: RideMatch): Promise<string> {
    try {
      const requestDoc = await getDoc(doc(db, this.COLLECTION_REQUESTS, match.requestId))
      const offerDoc = await getDoc(doc(db, this.COLLECTION_OFFERS, match.offerId))
      
      if (!requestDoc.exists() || !offerDoc.exists()) {
        throw new Error('Request or offer not found')
      }
      
      const request = requestDoc.data() as SharedRideRequest
      const offer = offerDoc.data() as SharedRideOffer
      
      // Check availability
      if (offer.availableSeats < request.seatsNeeded) {
        throw new Error('Not enough seats available')
      }
      
      // Create booking
      const booking: Omit<SharedRideBooking, 'id'> = {
        requestId: match.requestId,
        offerId: match.offerId,
        passengerId: request.passengerId,
        driverId: offer.driverId,
        pickupLocation: request.pickupLocation.coordinates,
        dropoffLocation: request.dropoffLocation.coordinates,
        estimatedPickupTime: offer.departureTime,
        estimatedDropoffTime: Timestamp.fromMillis(
          offer.departureTime.toMillis() + (match.estimatedDuration * 60 * 1000)
        ),
        fare: match.estimatedFare,
        paymentStatus: 'pending',
        status: 'confirmed',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      const bookingRef = await addDoc(collection(db, this.COLLECTION_BOOKINGS), booking)
      
      // Update offer
      const updatedPassengers = [
        ...offer.passengers,
        {
          passengerId: request.passengerId,
          passengerName: request.passengerName,
          pickupLocation: request.pickupLocation.coordinates,
          dropoffLocation: request.dropoffLocation.coordinates,
          status: 'confirmed' as const,
          fare: match.estimatedFare
        }
      ]
      
      await updateDoc(doc(db, this.COLLECTION_OFFERS, match.offerId), {
        passengers: updatedPassengers,
        availableSeats: offer.availableSeats - request.seatsNeeded,
        status: offer.availableSeats - request.seatsNeeded === 0 ? 'full' : 'available',
        updatedAt: Timestamp.now()
      })
      
      // Update request status
      await updateDoc(doc(db, this.COLLECTION_REQUESTS, match.requestId), {
        status: 'matched',
        updatedAt: Timestamp.now()
      })
      
      return bookingRef.id
    } catch (error) {
      console.error('Error booking shared ride:', error)
      throw new Error('Failed to book shared ride')
    }
  }

  /**
   * Cancel a shared ride booking
   */
  async cancelSharedRide(bookingId: string, reason: string): Promise<void> {
    try {
      const bookingDoc = await getDoc(doc(db, this.COLLECTION_BOOKINGS, bookingId))
      if (!bookingDoc.exists()) {
        throw new Error('Booking not found')
      }
      
      const booking = bookingDoc.data() as SharedRideBooking
      
      // Update booking status
      await updateDoc(doc(db, this.COLLECTION_BOOKINGS, bookingId), {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: Timestamp.now()
      })
      
      // Update offer - remove passenger and increase available seats
      const offerDoc = await getDoc(doc(db, this.COLLECTION_OFFERS, booking.offerId))
      if (offerDoc.exists()) {
        const offer = offerDoc.data() as SharedRideOffer
        const updatedPassengers = offer.passengers.filter(p => p.passengerId !== booking.passengerId)
        
        await updateDoc(doc(db, this.COLLECTION_OFFERS, booking.offerId), {
          passengers: updatedPassengers,
          availableSeats: offer.availableSeats + 1,
          status: 'available',
          updatedAt: Timestamp.now()
        })
      }
      
      // Update request status back to searching
      await updateDoc(doc(db, this.COLLECTION_REQUESTS, booking.requestId), {
        status: 'searching',
        updatedAt: Timestamp.now()
      })
      
    } catch (error) {
      console.error('Error cancelling shared ride:', error)
      throw new Error('Failed to cancel shared ride')
    }
  }

  /**
   * Get user's ride sharing history
   */
  async getUserRideHistory(userId: string, role: 'passenger' | 'driver'): Promise<SharedRideBooking[]> {
    try {
      const field = role === 'passenger' ? 'passengerId' : 'driverId'
      const bookingsQuery = query(
        collection(db, this.COLLECTION_BOOKINGS),
        where(field, '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      
      const snapshot = await getDocs(bookingsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SharedRideBooking[]
    } catch (error) {
      console.error('Error getting ride history:', error)
      throw new Error('Failed to get ride history')
    }
  }

  /**
   * Update ride status
   */
  async updateRideStatus(bookingId: string, status: SharedRideBooking['status']): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: Timestamp.now()
      }
      
      if (status === 'passenger_picked_up') {
        updates.actualPickupTime = Timestamp.now()
      } else if (status === 'completed') {
        updates.actualDropoffTime = Timestamp.now()
      }
      
      await updateDoc(doc(db, this.COLLECTION_BOOKINGS, bookingId), updates)
    } catch (error) {
      console.error('Error updating ride status:', error)
      throw new Error('Failed to update ride status')
    }
  }

  /**
   * Rate a shared ride
   */
  async rateSharedRide(bookingId: string, rating: {
    passengerRating?: number
    driverRating?: number
    feedback?: string
  }): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_BOOKINGS, bookingId), {
        rating,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error rating shared ride:', error)
      throw new Error('Failed to rate shared ride')
    }
  }
}

export const rideSharingService = new RideSharingService()