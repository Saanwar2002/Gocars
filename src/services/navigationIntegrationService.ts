/**
 * Navigation Integration Service
 * Turn-by-turn navigation integration with real-time traffic updates,
 * route optimization, and driver assistance features
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types and Interfaces
export interface NavigationRoute {
  id: string;
  origin: LocationPoint;
  destination: LocationPoint;
  waypoints?: LocationPoint[];
  distance: number; // in meters
  duration: number; // in seconds
  trafficDuration: number; // in seconds with traffic
  steps: NavigationStep[];
  polyline: string;
  trafficConditions: TrafficCondition[];
  alternativeRoutes: AlternativeRoute[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  placeId?: string;
}

export interface NavigationStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  startLocation: LocationPoint;
  endLocation: LocationPoint;
  maneuver: ManeuverType;
  polyline: string;
  streetName?: string;
  exitNumber?: string;
}

export interface TrafficCondition {
  segmentId: string;
  severity: 'light' | 'moderate' | 'heavy' | 'severe';
  speed: number; // km/h
  delay: number; // seconds
  cause?: string;
  startLocation: LocationPoint;
  endLocation: LocationPoint;
  estimatedClearTime?: Date;
}

export interface AlternativeRoute {
  id: string;
  distance: number;
  duration: number;
  trafficDuration: number;
  description: string;
  polyline: string;
  tollInfo?: TollInfo;
  avoidanceReasons: string[];
}

export interface TollInfo {
  hasTolls: boolean;
  estimatedCost: number;
  currency: string;
  tollRoads: string[];
}

export interface NavigationSession {
  id: string;
  driverId: string;
  rideId?: string;
  route: NavigationRoute;
  currentLocation: LocationPoint;
  currentStepIndex: number;
  isActive: boolean;
  startedAt: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  deviations: RouteDeviation[];
  voiceGuidanceEnabled: boolean;
  mapStyle: 'standard' | 'satellite' | 'terrain' | 'night';
}

export interface RouteDeviation {
  id: string;
  timestamp: Date;
  originalLocation: LocationPoint;
  actualLocation: LocationPoint;
  distanceFromRoute: number;
  reason: 'traffic' | 'construction' | 'accident' | 'driver_choice' | 'passenger_request';
  rerouteTriggered: boolean;
}

export interface NavigationPreferences {
  driverId: string;
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidFerries: boolean;
  preferFastestRoute: boolean;
  voiceGuidanceEnabled: boolean;
  voiceLanguage: string;
  mapStyle: 'standard' | 'satellite' | 'terrain' | 'night';
  autoNightMode: boolean;
  speedLimitWarnings: boolean;
  trafficAlerts: boolean;
  alternativeRouteNotifications: boolean;
}

export interface NavigationMetrics {
  sessionId: string;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  idleTime: number;
  fuelEfficiency: number;
  routeDeviations: number;
  trafficDelays: number;
  navigationAccuracy: number;
  completionRate: number;
}

export type ManeuverType = 
  | 'turn-left' 
  | 'turn-right' 
  | 'turn-slight-left' 
  | 'turn-slight-right' 
  | 'turn-sharp-left' 
  | 'turn-sharp-right'
  | 'uturn-left' 
  | 'uturn-right' 
  | 'continue' 
  | 'merge' 
  | 'fork-left' 
  | 'fork-right'
  | 'roundabout-left' 
  | 'roundabout-right' 
  | 'exit-left' 
  | 'exit-right'
  | 'keep-left' 
  | 'keep-right' 
  | 'arrive';

class NavigationIntegrationService {
  private readonly ROUTES_COLLECTION = 'navigation_routes';
  private readonly SESSIONS_COLLECTION = 'navigation_sessions';
  private readonly PREFERENCES_COLLECTION = 'navigation_preferences';
  private readonly METRICS_COLLECTION = 'navigation_metrics';

  // Google Maps API configuration (in production, use environment variables)
  private readonly GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  private readonly DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';
  private readonly GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

  /**
   * Calculate route with turn-by-turn directions
   */
  async calculateRoute(
    origin: LocationPoint,
    destination: LocationPoint,
    waypoints?: LocationPoint[],
    preferences?: Partial<NavigationPreferences>
  ): Promise<NavigationRoute> {
    try {
      const routeParams = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        key: this.GOOGLE_MAPS_API_KEY,
        departure_time: 'now',
        traffic_model: 'best_guess',
        alternatives: 'true'
      });

      // Add waypoints if provided
      if (waypoints && waypoints.length > 0) {
        const waypointsStr = waypoints
          .map(wp => `${wp.latitude},${wp.longitude}`)
          .join('|');
        routeParams.append('waypoints', waypointsStr);
      }

      // Apply preferences
      if (preferences) {
        if (preferences.avoidTolls) routeParams.append('avoid', 'tolls');
        if (preferences.avoidHighways) routeParams.append('avoid', 'highways');
        if (preferences.avoidFerries) routeParams.append('avoid', 'ferries');
      }

      const response = await fetch(`${this.DIRECTIONS_API_URL}?${routeParams}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Directions API error: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      // Process navigation steps
      const steps: NavigationStep[] = leg.steps.map((step: any, index: number) => ({
        id: `step_${index}`,
        instruction: this.cleanInstruction(step.html_instructions),
        distance: step.distance.value,
        duration: step.duration.value,
        startLocation: {
          latitude: step.start_location.lat,
          longitude: step.start_location.lng
        },
        endLocation: {
          latitude: step.end_location.lat,
          longitude: step.end_location.lng
        },
        maneuver: this.parseManeuver(step.maneuver),
        polyline: step.polyline.points,
        streetName: this.extractStreetName(step.html_instructions)
      }));

      // Process alternative routes
      const alternativeRoutes: AlternativeRoute[] = data.routes.slice(1).map((altRoute: any, index: number) => ({
        id: `alt_${index}`,
        distance: altRoute.legs[0].distance.value,
        duration: altRoute.legs[0].duration.value,
        trafficDuration: altRoute.legs[0].duration_in_traffic?.value || altRoute.legs[0].duration.value,
        description: this.generateRouteDescription(altRoute),
        polyline: altRoute.overview_polyline.points,
        avoidanceReasons: []
      }));

      // Get traffic conditions
      const trafficConditions = await this.getTrafficConditions(route.overview_polyline.points);

      const navigationRoute: NavigationRoute = {
        id: `route_${Date.now()}`,
        origin,
        destination,
        waypoints,
        distance: leg.distance.value,
        duration: leg.duration.value,
        trafficDuration: leg.duration_in_traffic?.value || leg.duration.value,
        steps,
        polyline: route.overview_polyline.points,
        trafficConditions,
        alternativeRoutes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save route to database
      await this.saveRoute(navigationRoute);

      return navigationRoute;
    } catch (error) {
      console.error('Error calculating route:', error);
      throw new Error('Failed to calculate route');
    }
  }

  /**
   * Start navigation session
   */
  async startNavigation(
    driverId: string,
    route: NavigationRoute,
    rideId?: string
  ): Promise<NavigationSession> {
    try {
      const session: NavigationSession = {
        id: `session_${Date.now()}`,
        driverId,
        rideId,
        route,
        currentLocation: route.origin,
        currentStepIndex: 0,
        isActive: true,
        startedAt: new Date(),
        estimatedArrival: new Date(Date.now() + route.trafficDuration * 1000),
        deviations: [],
        voiceGuidanceEnabled: true,
        mapStyle: 'standard'
      };

      await setDoc(doc(db, this.SESSIONS_COLLECTION, session.id), {
        ...session,
        startedAt: Timestamp.fromDate(session.startedAt),
        estimatedArrival: Timestamp.fromDate(session.estimatedArrival),
        'route.createdAt': Timestamp.fromDate(session.route.createdAt),
        'route.updatedAt': Timestamp.fromDate(session.route.updatedAt)
      });

      return session;
    } catch (error) {
      console.error('Error starting navigation:', error);
      throw new Error('Failed to start navigation');
    }
  }

  /**
   * Update current location during navigation
   */
  async updateLocation(
    sessionId: string,
    currentLocation: LocationPoint
  ): Promise<{
    currentStep: NavigationStep | null;
    nextStep: NavigationStep | null;
    distanceToNextTurn: number;
    shouldReroute: boolean;
    voiceInstruction?: string;
  }> {
    try {
      const session = await this.getNavigationSession(sessionId);
      if (!session || !session.isActive) {
        throw new Error('Navigation session not found or inactive');
      }

      // Update current location
      await updateDoc(doc(db, this.SESSIONS_COLLECTION, sessionId), {
        currentLocation,
        updatedAt: Timestamp.fromDate(new Date())
      });

      // Check if driver is on route
      const distanceFromRoute = this.calculateDistanceFromRoute(
        currentLocation,
        session.route.polyline
      );

      // Determine current step
      const currentStep = session.route.steps[session.currentStepIndex] || null;
      const nextStep = session.route.steps[session.currentStepIndex + 1] || null;

      // Calculate distance to next turn
      const distanceToNextTurn = currentStep 
        ? this.calculateDistance(currentLocation, currentStep.endLocation)
        : 0;

      // Check if we need to advance to next step
      if (currentStep && distanceToNextTurn < 50) { // Within 50 meters
        await this.advanceToNextStep(sessionId);
      }

      // Check if rerouting is needed
      const shouldReroute = distanceFromRoute > 100; // More than 100 meters off route

      if (shouldReroute) {
        await this.handleRouteDeviation(sessionId, currentLocation, distanceFromRoute);
      }

      // Generate voice instruction if needed
      const voiceInstruction = this.generateVoiceInstruction(
        currentStep,
        distanceToNextTurn,
        session.voiceGuidanceEnabled
      );

      return {
        currentStep,
        nextStep,
        distanceToNextTurn,
        shouldReroute,
        voiceInstruction
      };
    } catch (error) {
      console.error('Error updating location:', error);
      throw new Error('Failed to update location');
    }
  }

  /**
   * Reroute navigation
   */
  async reroute(sessionId: string, currentLocation: LocationPoint): Promise<NavigationRoute> {
    try {
      const session = await this.getNavigationSession(sessionId);
      if (!session) {
        throw new Error('Navigation session not found');
      }

      // Get driver preferences
      const preferences = await this.getNavigationPreferences(session.driverId);

      // Calculate new route from current location to destination
      const newRoute = await this.calculateRoute(
        currentLocation,
        session.route.destination,
        undefined,
        preferences
      );

      // Update session with new route
      await updateDoc(doc(db, this.SESSIONS_COLLECTION, sessionId), {
        route: {
          ...newRoute,
          createdAt: Timestamp.fromDate(newRoute.createdAt),
          updatedAt: Timestamp.fromDate(newRoute.updatedAt)
        },
        currentStepIndex: 0,
        estimatedArrival: Timestamp.fromDate(new Date(Date.now() + newRoute.trafficDuration * 1000)),
        updatedAt: Timestamp.fromDate(new Date())
      });

      return newRoute;
    } catch (error) {
      console.error('Error rerouting:', error);
      throw new Error('Failed to reroute');
    }
  }

  /**
   * End navigation session
   */
  async endNavigation(sessionId: string, actualArrival?: Date): Promise<NavigationMetrics> {
    try {
      const session = await this.getNavigationSession(sessionId);
      if (!session) {
        throw new Error('Navigation session not found');
      }

      const endTime = actualArrival || new Date();
      const totalDuration = (endTime.getTime() - session.startedAt.getTime()) / 1000;

      // Calculate metrics
      const metrics: NavigationMetrics = {
        sessionId,
        totalDistance: session.route.distance,
        totalDuration,
        averageSpeed: (session.route.distance / 1000) / (totalDuration / 3600), // km/h
        maxSpeed: 0, // Would be calculated from GPS data
        idleTime: 0, // Would be calculated from speed data
        fuelEfficiency: this.estimateFuelEfficiency(session.route.distance, totalDuration),
        routeDeviations: session.deviations.length,
        trafficDelays: Math.max(0, totalDuration - session.route.duration),
        navigationAccuracy: this.calculateNavigationAccuracy(session),
        completionRate: 1.0 // Completed successfully
      };

      // Update session as completed
      await updateDoc(doc(db, this.SESSIONS_COLLECTION, sessionId), {
        isActive: false,
        actualArrival: Timestamp.fromDate(endTime),
        updatedAt: Timestamp.fromDate(new Date())
      });

      // Save metrics
      await setDoc(doc(db, this.METRICS_COLLECTION, `metrics_${sessionId}`), metrics);

      return metrics;
    } catch (error) {
      console.error('Error ending navigation:', error);
      throw new Error('Failed to end navigation');
    }
  }

  /**
   * Get navigation preferences for driver
   */
  async getNavigationPreferences(driverId: string): Promise<NavigationPreferences> {
    try {
      const preferencesDoc = await getDoc(doc(db, this.PREFERENCES_COLLECTION, driverId));
      
      if (preferencesDoc.exists()) {
        return preferencesDoc.data() as NavigationPreferences;
      }

      // Return default preferences
      const defaultPreferences: NavigationPreferences = {
        driverId,
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: true,
        preferFastestRoute: true,
        voiceGuidanceEnabled: true,
        voiceLanguage: 'en-US',
        mapStyle: 'standard',
        autoNightMode: true,
        speedLimitWarnings: true,
        trafficAlerts: true,
        alternativeRouteNotifications: true
      };

      // Save default preferences
      await setDoc(doc(db, this.PREFERENCES_COLLECTION, driverId), defaultPreferences);

      return defaultPreferences;
    } catch (error) {
      console.error('Error getting navigation preferences:', error);
      throw new Error('Failed to get navigation preferences');
    }
  }

  /**
   * Update navigation preferences
   */
  async updateNavigationPreferences(
    driverId: string,
    preferences: Partial<NavigationPreferences>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.PREFERENCES_COLLECTION, driverId), {
        ...preferences,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating navigation preferences:', error);
      throw new Error('Failed to update navigation preferences');
    }
  }

  /**
   * Get real-time traffic conditions
   */
  async getTrafficConditions(polyline: string): Promise<TrafficCondition[]> {
    try {
      // In a real implementation, this would call traffic APIs
      // For now, return mock data
      return [
        {
          segmentId: 'segment_1',
          severity: 'moderate',
          speed: 25,
          delay: 180,
          cause: 'Heavy traffic',
          startLocation: { latitude: 40.7128, longitude: -74.0060 },
          endLocation: { latitude: 40.7589, longitude: -73.9851 }
        }
      ];
    } catch (error) {
      console.error('Error getting traffic conditions:', error);
      return [];
    }
  }

  /**
   * Get nearby points of interest
   */
  async getNearbyPOIs(
    location: LocationPoint,
    type: 'gas_station' | 'parking' | 'restaurant' | 'hospital',
    radius: number = 5000
  ): Promise<Array<{
    id: string;
    name: string;
    location: LocationPoint;
    distance: number;
    rating?: number;
    isOpen?: boolean;
  }>> {
    try {
      const params = new URLSearchParams({
        location: `${location.latitude},${location.longitude}`,
        radius: radius.toString(),
        type,
        key: this.GOOGLE_MAPS_API_KEY
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results.slice(0, 10).map((place: any) => ({
        id: place.place_id,
        name: place.name,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          address: place.vicinity
        },
        distance: this.calculateDistance(location, {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        }),
        rating: place.rating,
        isOpen: place.opening_hours?.open_now
      }));
    } catch (error) {
      console.error('Error getting nearby POIs:', error);
      return [];
    }
  }

  // Private helper methods

  private async saveRoute(route: NavigationRoute): Promise<void> {
    await setDoc(doc(db, this.ROUTES_COLLECTION, route.id), {
      ...route,
      createdAt: Timestamp.fromDate(route.createdAt),
      updatedAt: Timestamp.fromDate(route.updatedAt)
    });
  }

  private async getNavigationSession(sessionId: string): Promise<NavigationSession | null> {
    const sessionDoc = await getDoc(doc(db, this.SESSIONS_COLLECTION, sessionId));
    
    if (!sessionDoc.exists()) {
      return null;
    }

    const data = sessionDoc.data();
    return {
      ...data,
      startedAt: data.startedAt.toDate(),
      estimatedArrival: data.estimatedArrival.toDate(),
      actualArrival: data.actualArrival?.toDate(),
      route: {
        ...data.route,
        createdAt: data.route.createdAt.toDate(),
        updatedAt: data.route.updatedAt.toDate()
      }
    } as NavigationSession;
  }

  private async advanceToNextStep(sessionId: string): Promise<void> {
    const session = await this.getNavigationSession(sessionId);
    if (session && session.currentStepIndex < session.route.steps.length - 1) {
      await updateDoc(doc(db, this.SESSIONS_COLLECTION, sessionId), {
        currentStepIndex: session.currentStepIndex + 1,
        updatedAt: Timestamp.fromDate(new Date())
      });
    }
  }

  private async handleRouteDeviation(
    sessionId: string,
    actualLocation: LocationPoint,
    distanceFromRoute: number
  ): Promise<void> {
    const session = await this.getNavigationSession(sessionId);
    if (!session) return;

    const deviation: RouteDeviation = {
      id: `deviation_${Date.now()}`,
      timestamp: new Date(),
      originalLocation: session.currentLocation,
      actualLocation,
      distanceFromRoute,
      reason: 'driver_choice',
      rerouteTriggered: distanceFromRoute > 200 // Trigger reroute if more than 200m off
    };

    const updatedDeviations = [...session.deviations, deviation];

    await updateDoc(doc(db, this.SESSIONS_COLLECTION, sessionId), {
      deviations: updatedDeviations,
      updatedAt: Timestamp.fromDate(new Date())
    });

    // Trigger reroute if needed
    if (deviation.rerouteTriggered) {
      await this.reroute(sessionId, actualLocation);
    }
  }

  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateDistanceFromRoute(location: LocationPoint, polyline: string): number {
    // Simplified implementation - in production, use proper polyline decoding
    // and point-to-line distance calculation
    return Math.random() * 50; // Mock distance for demo
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private cleanInstruction(htmlInstruction: string): string {
    return htmlInstruction.replace(/<[^>]*>/g, '').trim();
  }

  private parseManeuver(maneuver?: string): ManeuverType {
    if (!maneuver) return 'continue';
    
    const maneuverMap: Record<string, ManeuverType> = {
      'turn-left': 'turn-left',
      'turn-right': 'turn-right',
      'turn-slight-left': 'turn-slight-left',
      'turn-slight-right': 'turn-slight-right',
      'turn-sharp-left': 'turn-sharp-left',
      'turn-sharp-right': 'turn-sharp-right',
      'uturn-left': 'uturn-left',
      'uturn-right': 'uturn-right',
      'merge': 'merge',
      'fork-left': 'fork-left',
      'fork-right': 'fork-right',
      'roundabout-left': 'roundabout-left',
      'roundabout-right': 'roundabout-right'
    };

    return maneuverMap[maneuver] || 'continue';
  }

  private extractStreetName(instruction: string): string {
    // Simple regex to extract street name from instruction
    const match = instruction.match(/on\s+([^<]+)/i);
    return match ? match[1].trim() : '';
  }

  private generateRouteDescription(route: any): string {
    const distance = (route.legs[0].distance.value / 1000).toFixed(1);
    const duration = Math.round(route.legs[0].duration.value / 60);
    return `${distance} km, ${duration} min`;
  }

  private generateVoiceInstruction(
    step: NavigationStep | null,
    distanceToTurn: number,
    voiceEnabled: boolean
  ): string | undefined {
    if (!voiceEnabled || !step) return undefined;

    if (distanceToTurn > 500) {
      return `In ${Math.round(distanceToTurn)} meters, ${step.instruction}`;
    } else if (distanceToTurn > 100) {
      return `In ${Math.round(distanceToTurn)} meters, ${step.instruction}`;
    } else {
      return step.instruction;
    }
  }

  private estimateFuelEfficiency(distance: number, duration: number): number {
    // Simple fuel efficiency estimation (L/100km)
    const avgSpeed = (distance / 1000) / (duration / 3600);
    
    if (avgSpeed < 20) return 12; // City driving
    if (avgSpeed < 50) return 8;  // Mixed driving
    return 6; // Highway driving
  }

  private calculateNavigationAccuracy(session: NavigationSession): number {
    // Calculate accuracy based on deviations and successful completion
    const baseAccuracy = 0.95;
    const deviationPenalty = session.deviations.length * 0.02;
    return Math.max(0.5, baseAccuracy - deviationPenalty);
  }
}

export const navigationIntegrationService = new NavigationIntegrationService();
export default navigationIntegrationService;