import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  userId: string;
  preferences: UserPreferences;
  behaviorData: BehaviorData;
  rideHistory: RideHistoryItem[];
  locationPatterns: LocationPattern[];
  timePatterns: TimePattern[];
  driverPreferences: DriverPreference[];
  lastUpdated: Date;
}

export interface UserPreferences {
  preferredVehicleTypes: string[];
  preferredDriverGender?: 'male' | 'female' | 'no-preference';
  preferredDriverRating: number;
  musicPreference?: 'on' | 'off' | 'ask';
  temperaturePreference?: 'cool' | 'warm' | 'no-preference';
  conversationPreference?: 'chatty' | 'quiet' | 'no-preference';
  paymentMethods: string[];
  defaultPaymentMethod: string;
  maxWaitTime: number; // in minutes
  priceRange: { min: number; max: number };
  accessibilityNeeds: string[];
  languagePreference: string;
}

export interface BehaviorData {
  totalRides: number;
  averageRideDistance: number;
  averageRideTime: number;
  averageSpending: number;
  frequentLocations: Array<{ location: string; frequency: number }>;
  peakUsageHours: number[];
  cancellationRate: number;
  averageRating: number;
  tipFrequency: number;
  averageTipAmount: number;
  bookingLeadTime: number; // average time between booking and ride
  multiStopFrequency: number;
  groupBookingFrequency: number;
}

export interface RideHistoryItem {
  rideId: string;
  date: Date;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  driverId: string;
  driverRating: number;
  fare: number;
  duration: number;
  distance: number;
  userRating?: number;
  tip?: number;
  wasScheduled: boolean;
  hadMultipleStops: boolean;
  wasGroupBooking: boolean;
  weatherCondition?: string;
  trafficCondition?: string;
}

export interface LocationPattern {
  location: string;
  coordinates: { lat: number; lng: number };
  frequency: number;
  timeOfDay: string[];
  dayOfWeek: string[];
  purpose: 'work' | 'home' | 'leisure' | 'shopping' | 'medical' | 'other';
  confidence: number;
}

export interface TimePattern {
  dayOfWeek: string;
  timeSlot: string;
  frequency: number;
  averageDistance: number;
  commonDestinations: string[];
  confidence: number;
}

export interface DriverPreference {
  driverId: string;
  driverName: string;
  preferenceScore: number;
  rideCount: number;
  averageRating: number;
  reasons: string[];
  lastRideDate: Date;
}

export interface Recommendation {
  id: string;
  type: 'ride_suggestion' | 'driver_match' | 'route_optimization' | 'pricing_offer' | 'time_suggestion';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  data: any;
  validUntil: Date;
  isPersonalized: boolean;
  reasons: string[];
  estimatedSavings?: { time?: number; money?: number };
}

export interface PersonalizedOffer {
  id: string;
  userId: string;
  offerType: 'discount' | 'free_ride' | 'upgrade' | 'loyalty_bonus';
  title: string;
  description: string;
  discountPercentage?: number;
  discountAmount?: number;
  conditions: string[];
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  targetBehavior: string;
}

class PersonalizationService {
  // Main recommendation generation
  async generateRecommendations(userId: string, context?: {
    currentLocation?: { lat: number; lng: number };
    timeOfDay?: string;
    dayOfWeek?: string;
    weatherCondition?: string;
  }): Promise<Recommendation[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        return this.generateDefaultRecommendations(context);
      }

      const recommendations: Recommendation[] = [];

      // Generate different types of recommendations
      const rideRecommendations = await this.generateRideSuggestions(userProfile, context);
      const driverRecommendations = await this.generateDriverRecommendations(userProfile);
      const routeRecommendations = await this.generateRouteRecommendations(userProfile, context);
      const pricingRecommendations = await this.generatePricingOffers(userProfile);
      const timeRecommendations = await this.generateTimeRecommendations(userProfile, context);

      recommendations.push(
        ...rideRecommendations,
        ...driverRecommendations,
        ...routeRecommendations,
        ...pricingRecommendations,
        ...timeRecommendations
      );

      // Sort by priority and confidence
      return recommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.confidence - a.confidence;
        })
        .slice(0, 10); // Return top 10 recommendations

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.generateDefaultRecommendations(context);
    }
  }

  // Generate ride suggestions based on patterns
  private async generateRideSuggestions(
    userProfile: UserProfile, 
    context?: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    // Analyze time patterns for suggestions
    const relevantTimePatterns = userProfile.timePatterns.filter(pattern => 
      pattern.dayOfWeek === currentDay && 
      this.isTimeInSlot(currentHour, pattern.timeSlot)
    );

    for (const pattern of relevantTimePatterns) {
      if (pattern.confidence > 0.7 && pattern.frequency > 3) {
        recommendations.push({
          id: `ride_suggestion_${Date.now()}_${Math.random()}`,
          type: 'ride_suggestion',
          title: 'Your Usual Ride?',
          description: `You typically travel to ${pattern.commonDestinations[0]} around this time on ${pattern.dayOfWeek}s. Would you like to book a ride?`,
          confidence: pattern.confidence,
          priority: 'high',
          data: {
            destination: pattern.commonDestinations[0],
            estimatedDuration: pattern.averageDistance / 30 * 60, // rough estimate
            suggestedVehicleType: userProfile.preferences.preferredVehicleTypes[0]
          },
          validUntil: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
          isPersonalized: true,
          reasons: [`You've made ${pattern.frequency} similar trips`, `${Math.round(pattern.confidence * 100)}% confidence based on your patterns`]
        });
      }
    }

    // Location-based suggestions
    if (context?.currentLocation) {
      const nearbyPatterns = userProfile.locationPatterns.filter(pattern => 
        this.calculateDistance(context.currentLocation, pattern.coordinates) < 0.5 // within 500m
      );

      for (const pattern of nearbyPatterns) {
        if (pattern.frequency > 2 && pattern.confidence > 0.6) {
          recommendations.push({
            id: `location_suggestion_${Date.now()}_${Math.random()}`,
            type: 'ride_suggestion',
            title: 'Frequent Destination Nearby',
            description: `You often travel from this area to ${pattern.location}. Book a ride there?`,
            confidence: pattern.confidence,
            priority: 'medium',
            data: {
              destination: pattern.location,
              purpose: pattern.purpose,
              estimatedFare: this.estimateFare(context.currentLocation, pattern.coordinates)
            },
            validUntil: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours
            isPersonalized: true,
            reasons: [`You've visited ${pattern.location} ${pattern.frequency} times`, `Common ${pattern.purpose} destination`]
          });
        }
      }
    }

    return recommendations;
  }

  // Generate driver recommendations
  private async generateDriverRecommendations(userProfile: UserProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Find preferred drivers
    const topDrivers = userProfile.driverPreferences
      .filter(pref => pref.preferenceScore > 4.0 && pref.rideCount > 2)
      .sort((a, b) => b.preferenceScore - a.preferenceScore)
      .slice(0, 3);

    for (const driver of topDrivers) {
      recommendations.push({
        id: `driver_match_${driver.driverId}`,
        type: 'driver_match',
        title: 'Your Preferred Driver Available',
        description: `${driver.driverName} (${driver.averageRating}⭐) is nearby and available. You've had ${driver.rideCount} great rides together!`,
        confidence: Math.min(driver.preferenceScore / 5, 0.95),
        priority: driver.preferenceScore > 4.5 ? 'high' : 'medium',
        data: {
          driverId: driver.driverId,
          driverName: driver.driverName,
          rating: driver.averageRating,
          rideHistory: driver.rideCount,
          reasons: driver.reasons
        },
        validUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        isPersonalized: true,
        reasons: driver.reasons
      });
    }

    return recommendations;
  }

  // Generate route optimization recommendations
  private async generateRouteRecommendations(
    userProfile: UserProfile, 
    context?: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Multi-stop suggestions based on behavior
    if (userProfile.behaviorData.multiStopFrequency > 0.3) {
      const frequentLocations = userProfile.behaviorData.frequentLocations
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3);

      if (frequentLocations.length > 1) {
        recommendations.push({
          id: `route_optimization_${Date.now()}`,
          type: 'route_optimization',
          title: 'Optimize Your Route',
          description: `Combine trips to ${frequentLocations.map(l => l.location).join(' and ')} in one ride to save time and money.`,
          confidence: 0.8,
          priority: 'medium',
          data: {
            suggestedStops: frequentLocations.map(l => l.location),
            estimatedSavings: {
              time: 15, // minutes
              money: 8 // dollars
            }
          },
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isPersonalized: true,
          reasons: ['Based on your frequent destinations', 'You often make multiple trips'],
          estimatedSavings: { time: 15, money: 8 }
        });
      }
    }

    return recommendations;
  }

  // Generate personalized pricing offers
  private async generatePricingOffers(userProfile: UserProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Loyalty-based offers
    if (userProfile.behaviorData.totalRides > 50) {
      recommendations.push({
        id: `loyalty_offer_${Date.now()}`,
        type: 'pricing_offer',
        title: 'Loyal Customer Discount',
        description: `You've completed ${userProfile.behaviorData.totalRides} rides! Enjoy 15% off your next ride.`,
        confidence: 1.0,
        priority: 'high',
        data: {
          discountPercentage: 15,
          offerType: 'loyalty_discount',
          validRides: 1
        },
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isPersonalized: true,
        reasons: [`${userProfile.behaviorData.totalRides} completed rides`, 'Valued customer reward'],
        estimatedSavings: { money: userProfile.behaviorData.averageSpending * 0.15 }
      });
    }

    // Off-peak pricing suggestions
    const currentHour = new Date().getHours();
    if (currentHour >= 10 && currentHour <= 15) { // Off-peak hours
      recommendations.push({
        id: `offpeak_offer_${Date.now()}`,
        type: 'pricing_offer',
        title: 'Off-Peak Savings',
        description: 'Travel now and save 20% during off-peak hours!',
        confidence: 0.9,
        priority: 'medium',
        data: {
          discountPercentage: 20,
          offerType: 'off_peak_discount',
          validUntil: new Date().setHours(16, 0, 0, 0) // Until 4 PM
        },
        validUntil: new Date().setHours(16, 0, 0, 0),
        isPersonalized: false,
        reasons: ['Off-peak hours discount', 'Lower demand period'],
        estimatedSavings: { money: userProfile.behaviorData.averageSpending * 0.20 }
      });
    }

    return recommendations;
  }

  // Generate time-based recommendations
  private async generateTimeRecommendations(
    userProfile: UserProfile, 
    context?: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const now = new Date();

    // Suggest optimal booking times based on patterns
    const peakHours = userProfile.behaviorData.peakUsageHours;
    const currentHour = now.getHours();

    if (peakHours.includes(currentHour + 1)) {
      recommendations.push({
        id: `time_suggestion_${Date.now()}`,
        type: 'time_suggestion',
        title: 'Book Ahead for Peak Time',
        description: `You typically travel around ${currentHour + 1}:00. Book now to secure a ride and avoid surge pricing.`,
        confidence: 0.85,
        priority: 'medium',
        data: {
          suggestedBookingTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour ahead
          avoidSurge: true,
          estimatedWaitTime: 3 // minutes
        },
        validUntil: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        isPersonalized: true,
        reasons: ['Based on your travel patterns', 'Avoid peak hour surge pricing'],
        estimatedSavings: { money: 5, time: 10 }
      });
    }

    return recommendations;
  }

  // User profile management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!db) return null;

      const q = query(
        collection(db, 'userProfiles'),
        where('userId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return await this.createDefaultProfile(userId);
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        ...data,
        lastUpdated: data.lastUpdated.toDate(),
        rideHistory: data.rideHistory?.map((ride: any) => ({
          ...ride,
          date: ride.date.toDate()
        })) || []
      } as UserProfile;

    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      if (!db) return false;

      const q = query(
        collection(db, 'userProfiles'),
        where('userId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return false;
      }

      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...updates,
        lastUpdated: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Learn from user behavior
  async learnFromRide(userId: string, rideData: RideHistoryItem): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return;

      // Update ride history
      profile.rideHistory.unshift(rideData);
      if (profile.rideHistory.length > 100) {
        profile.rideHistory = profile.rideHistory.slice(0, 100); // Keep last 100 rides
      }

      // Update behavior data
      this.updateBehaviorData(profile, rideData);

      // Update location patterns
      this.updateLocationPatterns(profile, rideData);

      // Update time patterns
      this.updateTimePatterns(profile, rideData);

      // Update driver preferences
      this.updateDriverPreferences(profile, rideData);

      // Save updated profile
      await this.updateUserProfile(userId, profile);

    } catch (error) {
      console.error('Error learning from ride:', error);
    }
  }

  // Helper methods
  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    const defaultProfile: UserProfile = {
      userId,
      preferences: {
        preferredVehicleTypes: ['standard'],
        preferredDriverRating: 4.0,
        paymentMethods: ['card'],
        defaultPaymentMethod: 'card',
        maxWaitTime: 10,
        priceRange: { min: 0, max: 100 },
        accessibilityNeeds: [],
        languagePreference: 'en'
      },
      behaviorData: {
        totalRides: 0,
        averageRideDistance: 0,
        averageRideTime: 0,
        averageSpending: 0,
        frequentLocations: [],
        peakUsageHours: [],
        cancellationRate: 0,
        averageRating: 5,
        tipFrequency: 0,
        averageTipAmount: 0,
        bookingLeadTime: 0,
        multiStopFrequency: 0,
        groupBookingFrequency: 0
      },
      rideHistory: [],
      locationPatterns: [],
      timePatterns: [],
      driverPreferences: [],
      lastUpdated: new Date()
    };

    try {
      if (db) {
        await addDoc(collection(db, 'userProfiles'), defaultProfile);
      }
    } catch (error) {
      console.error('Error creating default profile:', error);
    }

    return defaultProfile;
  }

  private updateBehaviorData(profile: UserProfile, rideData: RideHistoryItem): void {
    const behavior = profile.behaviorData;
    const totalRides = behavior.totalRides + 1;

    // Update averages
    behavior.averageRideDistance = (behavior.averageRideDistance * behavior.totalRides + rideData.distance) / totalRides;
    behavior.averageRideTime = (behavior.averageRideTime * behavior.totalRides + rideData.duration) / totalRides;
    behavior.averageSpending = (behavior.averageSpending * behavior.totalRides + rideData.fare) / totalRides;

    behavior.totalRides = totalRides;

    // Update frequent locations
    this.updateFrequentLocations(behavior, rideData.pickupLocation);
    this.updateFrequentLocations(behavior, rideData.dropoffLocation);

    // Update peak usage hours
    const rideHour = rideData.date.getHours();
    if (!behavior.peakUsageHours.includes(rideHour)) {
      behavior.peakUsageHours.push(rideHour);
    }

    // Update other metrics
    if (rideData.tip) {
      behavior.tipFrequency = (behavior.tipFrequency * (totalRides - 1) + 1) / totalRides;
      behavior.averageTipAmount = (behavior.averageTipAmount * (totalRides - 1) + rideData.tip) / totalRides;
    }

    if (rideData.hadMultipleStops) {
      behavior.multiStopFrequency = (behavior.multiStopFrequency * (totalRides - 1) + 1) / totalRides;
    }

    if (rideData.wasGroupBooking) {
      behavior.groupBookingFrequency = (behavior.groupBookingFrequency * (totalRides - 1) + 1) / totalRides;
    }
  }

  private updateFrequentLocations(behavior: BehaviorData, location: string): void {
    const existing = behavior.frequentLocations.find(l => l.location === location);
    if (existing) {
      existing.frequency++;
    } else {
      behavior.frequentLocations.push({ location, frequency: 1 });
    }

    // Keep only top 10 frequent locations
    behavior.frequentLocations.sort((a, b) => b.frequency - a.frequency);
    behavior.frequentLocations = behavior.frequentLocations.slice(0, 10);
  }

  private updateLocationPatterns(profile: UserProfile, rideData: RideHistoryItem): void {
    // This would typically involve geocoding and pattern analysis
    // For now, we'll create a simplified version
    const pattern = profile.locationPatterns.find(p => p.location === rideData.dropoffLocation);
    
    if (pattern) {
      pattern.frequency++;
      pattern.confidence = Math.min(pattern.frequency / profile.behaviorData.totalRides, 1);
    } else {
      profile.locationPatterns.push({
        location: rideData.dropoffLocation,
        coordinates: { lat: 0, lng: 0 }, // Would be geocoded in real implementation
        frequency: 1,
        timeOfDay: [this.getTimeSlot(rideData.date.getHours())],
        dayOfWeek: [rideData.date.toLocaleDateString('en-US', { weekday: 'long' })],
        purpose: 'other',
        confidence: 1 / profile.behaviorData.totalRides
      });
    }
  }

  private updateTimePatterns(profile: UserProfile, rideData: RideHistoryItem): void {
    const dayOfWeek = rideData.date.toLocaleDateString('en-US', { weekday: 'long' });
    const timeSlot = this.getTimeSlot(rideData.date.getHours());
    
    const pattern = profile.timePatterns.find(p => 
      p.dayOfWeek === dayOfWeek && p.timeSlot === timeSlot
    );

    if (pattern) {
      pattern.frequency++;
      pattern.averageDistance = (pattern.averageDistance * (pattern.frequency - 1) + rideData.distance) / pattern.frequency;
      
      if (!pattern.commonDestinations.includes(rideData.dropoffLocation)) {
        pattern.commonDestinations.push(rideData.dropoffLocation);
      }
      
      pattern.confidence = Math.min(pattern.frequency / profile.behaviorData.totalRides, 1);
    } else {
      profile.timePatterns.push({
        dayOfWeek,
        timeSlot,
        frequency: 1,
        averageDistance: rideData.distance,
        commonDestinations: [rideData.dropoffLocation],
        confidence: 1 / profile.behaviorData.totalRides
      });
    }
  }

  private updateDriverPreferences(profile: UserProfile, rideData: RideHistoryItem): void {
    if (!rideData.userRating) return;

    const preference = profile.driverPreferences.find(p => p.driverId === rideData.driverId);
    
    if (preference) {
      preference.rideCount++;
      preference.averageRating = (preference.averageRating * (preference.rideCount - 1) + rideData.userRating) / preference.rideCount;
      preference.preferenceScore = this.calculateDriverPreferenceScore(preference, rideData);
      preference.lastRideDate = rideData.date;
    } else {
      profile.driverPreferences.push({
        driverId: rideData.driverId,
        driverName: `Driver ${rideData.driverId}`, // Would be fetched from driver data
        preferenceScore: rideData.userRating,
        rideCount: 1,
        averageRating: rideData.userRating,
        reasons: rideData.userRating >= 4 ? ['Good service'] : ['Needs improvement'],
        lastRideDate: rideData.date
      });
    }

    // Keep only top 20 driver preferences
    profile.driverPreferences.sort((a, b) => b.preferenceScore - a.preferenceScore);
    profile.driverPreferences = profile.driverPreferences.slice(0, 20);
  }

  private calculateDriverPreferenceScore(preference: DriverPreference, rideData: RideHistoryItem): number {
    let score = preference.averageRating;
    
    // Boost score for consistent good ratings
    if (preference.rideCount > 3 && preference.averageRating > 4.5) {
      score += 0.5;
    }
    
    // Consider tips as positive indicator
    if (rideData.tip && rideData.tip > 0) {
      score += 0.2;
    }
    
    return Math.min(score, 5);
  }

  private generateDefaultRecommendations(context?: any): Recommendation[] {
    return [
      {
        id: 'default_booking',
        type: 'ride_suggestion',
        title: 'Book Your First Ride',
        description: 'Welcome to GoCars! Book your first ride and experience our premium service.',
        confidence: 0.8,
        priority: 'medium',
        data: { isFirstRide: true },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isPersonalized: false,
        reasons: ['New user welcome']
      }
    ];
  }

  // Utility methods
  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private isTimeInSlot(hour: number, slot: string): boolean {
    switch (slot) {
      case 'morning': return hour >= 6 && hour < 12;
      case 'afternoon': return hour >= 12 && hour < 17;
      case 'evening': return hour >= 17 && hour < 21;
      case 'night': return hour >= 21 || hour < 6;
      default: return false;
    }
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    // Simplified distance calculation (would use proper geospatial calculation in production)
    const latDiff = point1.lat - point2.lat;
    const lngDiff = point1.lng - point2.lng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  private estimateFare(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
    const distance = this.calculateDistance(from, to);
    return Math.max(5, distance * 100 * 2.5); // Base fare + distance rate
  }
}

export const personalizationService = new PersonalizationService();