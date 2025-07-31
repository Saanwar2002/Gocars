/**
 * Intelligent Dispatch Service
 * AI-powered ride assignment and dispatch optimization system with load balancing
 * and emergency override capabilities
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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types and Interfaces
export interface RideRequest {
  id: string;
  passengerId: string;
  pickupLocation: LocationPoint;
  dropoffLocation: LocationPoint;
  requestedAt: Date;
  scheduledFor?: Date;
  vehicleType: VehicleType;
  priority: 'normal' | 'high' | 'emergency';
  specialRequirements?: string[];
  estimatedFare: number;
  estimatedDuration: number;
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  assignedDriverId?: string;
  assignmentScore?: number;
  assignmentReason?: string;
}

export interface DriverAvailability {
  driverId: string;
  currentLocation: LocationPoint;
  status: 'available' | 'busy' | 'offline' | 'break';
  vehicleType: VehicleType;
  rating: number;
  acceptanceRate: number;
  completedRides: number;
  currentRideId?: string;
  estimatedAvailableAt?: Date;
  workingHours: {
    start: string;
    end: string;
  };
  preferences: DriverPreferences;
  performance: DriverPerformanceMetrics;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: Date;
}

export interface DispatchAssignment {
  rideId: string;
  driverId: string;
  assignedAt: Date;
  score: number;
  factors: AssignmentFactors;
  estimatedPickupTime: number;
  estimatedArrivalTime: Date;
  confidence: number;
  alternativeDrivers: AlternativeDriver[];
}

export interface AssignmentFactors {
  distance: number;
  driverRating: number;
  acceptanceRate: number;
  vehicleMatch: number;
  availability: number;
  efficiency: number;
  passengerPreference: number;
  trafficConditions: number;
  surge: number;
  loyalty: number;
}

export interface AlternativeDriver {
  driverId: string;
  score: number;
  estimatedPickupTime: number;
  reason: string;
}

export interface DispatchMetrics {
  totalAssignments: number;
  successfulAssignments: number;
  averageAssignmentTime: number;
  averagePickupTime: number;
  driverUtilization: number;
  passengerSatisfaction: number;
  cancellationRate: number;
  emergencyResponseTime: number;
}

export interface LoadBalancingConfig {
  maxRidesPerDriver: number;
  optimalUtilizationRate: number;
  rebalancingThreshold: number;
  emergencyCapacityReserve: number;
  geofenceAreas: GeofenceArea[];
}

export interface GeofenceArea {
  id: string;
  name: string;
  coordinates: LocationPoint[];
  priority: number;
  demandMultiplier: number;
  minDrivers: number;
  maxDrivers: number;
}

export interface EmergencyOverride {
  id: string;
  rideId: string;
  originalDriverId?: string;
  newDriverId: string;
  reason: 'emergency' | 'breakdown' | 'medical' | 'safety' | 'manual';
  overriddenBy: string;
  overriddenAt: Date;
  notes?: string;
  status: 'active' | 'resolved' | 'cancelled';
}

export type VehicleType = 'sedan' | 'suv' | 'van' | 'luxury' | 'electric' | 'wheelchair';

export interface DriverPreferences {
  preferredAreas: string[];
  maxDistance: number;
  avoidTolls: boolean;
  acceptSharedRides: boolean;
  acceptLongDistance: boolean;
}

export interface DriverPerformanceMetrics {
  averageResponseTime: number;
  completionRate: number;
  customerRating: number;
  onTimePerformance: number;
  fuelEfficiency: number;
  safetyScore: number;
}

class IntelligentDispatchService {
  private readonly RIDES_COLLECTION = 'rides';
  private readonly DRIVERS_COLLECTION = 'drivers';
  private readonly ASSIGNMENTS_COLLECTION = 'dispatch_assignments';
  private readonly OVERRIDES_COLLECTION = 'emergency_overrides';
  private readonly METRICS_COLLECTION = 'dispatch_metrics';

  // AI Model Configuration
  private readonly AI_WEIGHTS = {
    distance: 0.25,
    driverRating: 0.15,
    acceptanceRate: 0.15,
    vehicleMatch: 0.10,
    availability: 0.10,
    efficiency: 0.10,
    passengerPreference: 0.05,
    trafficConditions: 0.05,
    surge: 0.03,
    loyalty: 0.02
  };

  private readonly LOAD_BALANCING_CONFIG: LoadBalancingConfig = {
    maxRidesPerDriver: 3,
    optimalUtilizationRate: 0.75,
    rebalancingThreshold: 0.2,
    emergencyCapacityReserve: 0.15,
    geofenceAreas: []
  };

  /**
   * Main dispatch method - assigns the best driver to a ride request
   */
  async dispatchRide(rideRequest: RideRequest): Promise<DispatchAssignment | null> {
    try {
      // Get available drivers
      const availableDrivers = await this.getAvailableDrivers(rideRequest);
      
      if (availableDrivers.length === 0) {
        console.warn('No available drivers for ride request:', rideRequest.id);
        return null;
      }

      // Calculate assignment scores for all drivers
      const scoredDrivers = await this.calculateAssignmentScores(rideRequest, availableDrivers);
      
      // Apply load balancing
      const balancedDrivers = await this.applyLoadBalancing(scoredDrivers, rideRequest);
      
      // Select the best driver
      const bestDriver = balancedDrivers[0];
      
      if (!bestDriver) {
        return null;
      }

      // Create assignment
      const assignment: DispatchAssignment = {
        rideId: rideRequest.id,
        driverId: bestDriver.driverId,
        assignedAt: new Date(),
        score: bestDriver.score,
        factors: bestDriver.factors,
        estimatedPickupTime: bestDriver.estimatedPickupTime,
        estimatedArrivalTime: new Date(Date.now() + bestDriver.estimatedPickupTime * 1000),
        confidence: this.calculateConfidence(bestDriver.score, balancedDrivers),
        alternativeDrivers: balancedDrivers.slice(1, 4).map(d => ({
          driverId: d.driverId,
          score: d.score,
          estimatedPickupTime: d.estimatedPickupTime,
          reason: this.getAssignmentReason(d.factors)
        }))
      };

      // Save assignment
      await this.saveAssignment(assignment);
      
      // Update ride status
      await this.updateRideAssignment(rideRequest.id, assignment);
      
      // Update driver status
      await this.updateDriverStatus(bestDriver.driverId, 'assigned', rideRequest.id);

      return assignment;
    } catch (error) {
      console.error('Error in dispatch process:', error);
      throw new Error('Failed to dispatch ride');
    }
  }

  /**
   * Get available drivers based on ride requirements
   */
  private async getAvailableDrivers(rideRequest: RideRequest): Promise<DriverAvailability[]> {
    try {
      const driversQuery = query(
        collection(db, this.DRIVERS_COLLECTION),
        where('status', '==', 'available'),
        where('vehicle.type', '==', rideRequest.vehicleType),
        limit(50)
      );

      const snapshot = await getDocs(driversQuery);
      const drivers: DriverAvailability[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check if driver meets basic requirements
        if (this.meetsBasicRequirements(data, rideRequest)) {
          drivers.push({
            driverId: doc.id,
            currentLocation: data.currentLocation,
            status: data.status,
            vehicleType: data.vehicle?.type || 'sedan',
            rating: data.performance?.rating || 0,
            acceptanceRate: data.performance?.acceptanceRate || 0,
            completedRides: data.performance?.totalRides || 0,
            workingHours: data.workingHours || { start: '00:00', end: '23:59' },
            preferences: data.preferences || {},
            performance: data.performance || {}
          });
        }
      });

      return drivers;
    } catch (error) {
      console.error('Error getting available drivers:', error);
      return [];
    }
  }

  /**
   * Check if driver meets basic requirements for the ride
   */
  private meetsBasicRequirements(driverData: any, rideRequest: RideRequest): boolean {
    // Check vehicle type match
    if (driverData.vehicle?.type !== rideRequest.vehicleType) {
      return false;
    }

    // Check special requirements
    if (rideRequest.specialRequirements) {
      const driverCapabilities = driverData.vehicle?.features || [];
      const hasRequiredFeatures = rideRequest.specialRequirements.every(req => 
        driverCapabilities.includes(req)
      );
      if (!hasRequiredFeatures) {
        return false;
      }
    }

    // Check working hours
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const workStart = this.timeToMinutes(driverData.workingHours?.start || '00:00');
    const workEnd = this.timeToMinutes(driverData.workingHours?.end || '23:59');
    
    if (currentTime < workStart || currentTime > workEnd) {
      return false;
    }

    return true;
  }

  /**
   * Calculate assignment scores for all available drivers
   */
  private async calculateAssignmentScores(
    rideRequest: RideRequest, 
    drivers: DriverAvailability[]
  ): Promise<Array<DriverAvailability & { score: number; factors: AssignmentFactors; estimatedPickupTime: number }>> {
    const scoredDrivers = [];

    for (const driver of drivers) {
      const factors = await this.calculateAssignmentFactors(rideRequest, driver);
      const score = this.calculateWeightedScore(factors);
      const estimatedPickupTime = this.calculatePickupTime(rideRequest.pickupLocation, driver.currentLocation);

      scoredDrivers.push({
        ...driver,
        score,
        factors,
        estimatedPickupTime
      });
    }

    // Sort by score (highest first)
    return scoredDrivers.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate individual assignment factors
   */
  private async calculateAssignmentFactors(
    rideRequest: RideRequest, 
    driver: DriverAvailability
  ): Promise<AssignmentFactors> {
    const distance = this.calculateDistance(rideRequest.pickupLocation, driver.currentLocation);
    const distanceScore = Math.max(0, 1 - (distance / 10)); // Normalize to 0-1, 10km max

    return {
      distance: distanceScore,
      driverRating: driver.rating / 5, // Normalize to 0-1
      acceptanceRate: driver.acceptanceRate / 100, // Normalize to 0-1
      vehicleMatch: rideRequest.vehicleType === driver.vehicleType ? 1 : 0,
      availability: driver.status === 'available' ? 1 : 0,
      efficiency: driver.performance.completionRate || 0.8,
      passengerPreference: await this.calculatePassengerPreference(rideRequest.passengerId, driver.driverId),
      trafficConditions: await this.getTrafficScore(rideRequest.pickupLocation, driver.currentLocation),
      surge: this.calculateSurgeMultiplier(rideRequest.pickupLocation),
      loyalty: this.calculateLoyaltyScore(driver.completedRides)
    };
  }

  /**
   * Calculate weighted score based on factors
   */
  private calculateWeightedScore(factors: AssignmentFactors): number {
    let score = 0;
    
    score += factors.distance * this.AI_WEIGHTS.distance;
    score += factors.driverRating * this.AI_WEIGHTS.driverRating;
    score += factors.acceptanceRate * this.AI_WEIGHTS.acceptanceRate;
    score += factors.vehicleMatch * this.AI_WEIGHTS.vehicleMatch;
    score += factors.availability * this.AI_WEIGHTS.availability;
    score += factors.efficiency * this.AI_WEIGHTS.efficiency;
    score += factors.passengerPreference * this.AI_WEIGHTS.passengerPreference;
    score += factors.trafficConditions * this.AI_WEIGHTS.trafficConditions;
    score += factors.surge * this.AI_WEIGHTS.surge;
    score += factors.loyalty * this.AI_WEIGHTS.loyalty;

    return Math.min(1, Math.max(0, score)); // Clamp to 0-1
  }

  /**
   * Apply load balancing to driver selection
   */
  private async applyLoadBalancing(
    scoredDrivers: Array<DriverAvailability & { score: number; factors: AssignmentFactors; estimatedPickupTime: number }>,
    rideRequest: RideRequest
  ): Promise<Array<DriverAvailability & { score: number; factors: AssignmentFactors; estimatedPickupTime: number }>> {
    // Get current driver workloads
    const driverWorkloads = await this.getDriverWorkloads();
    
    // Adjust scores based on current load
    const balancedDrivers = scoredDrivers.map(driver => {
      const currentLoad = driverWorkloads.get(driver.driverId) || 0;
      const maxLoad = this.LOAD_BALANCING_CONFIG.maxRidesPerDriver;
      
      // Reduce score if driver is overloaded
      let loadPenalty = 0;
      if (currentLoad >= maxLoad) {
        loadPenalty = 0.5; // Heavy penalty for overloaded drivers
      } else if (currentLoad / maxLoad > this.LOAD_BALANCING_CONFIG.optimalUtilizationRate) {
        loadPenalty = 0.2; // Light penalty for high utilization
      }
      
      return {
        ...driver,
        score: Math.max(0, driver.score - loadPenalty)
      };
    });

    // Re-sort after load balancing
    return balancedDrivers.sort((a, b) => b.score - a.score);
  }

  /**
   * Emergency override - manually assign or reassign a ride
   */
  async emergencyOverride(
    rideId: string,
    newDriverId: string,
    reason: EmergencyOverride['reason'],
    overriddenBy: string,
    notes?: string
  ): Promise<EmergencyOverride> {
    try {
      // Get current assignment
      const currentAssignment = await this.getAssignment(rideId);
      
      // Create override record
      const override: EmergencyOverride = {
        id: doc(collection(db, this.OVERRIDES_COLLECTION)).id,
        rideId,
        originalDriverId: currentAssignment?.driverId,
        newDriverId,
        reason,
        overriddenBy,
        overriddenAt: new Date(),
        notes,
        status: 'active'
      };

      // Save override
      await setDoc(doc(db, this.OVERRIDES_COLLECTION, override.id), {
        ...override,
        overriddenAt: Timestamp.fromDate(override.overriddenAt)
      });

      // Update ride assignment
      if (currentAssignment) {
        // Release original driver
        await this.updateDriverStatus(currentAssignment.driverId, 'available');
      }

      // Assign new driver
      await this.updateDriverStatus(newDriverId, 'assigned', rideId);
      
      // Update ride
      await updateDoc(doc(db, this.RIDES_COLLECTION, rideId), {
        assignedDriverId: newDriverId,
        assignmentOverride: true,
        overrideReason: reason,
        updatedAt: Timestamp.fromDate(new Date())
      });

      return override;
    } catch (error) {
      console.error('Error in emergency override:', error);
      throw new Error('Failed to execute emergency override');
    }
  }

  /**
   * Get dispatch metrics and performance data
   */
  async getDispatchMetrics(timeRange: { start: Date; end: Date }): Promise<DispatchMetrics> {
    try {
      const assignmentsQuery = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        where('assignedAt', '>=', Timestamp.fromDate(timeRange.start)),
        where('assignedAt', '<=', Timestamp.fromDate(timeRange.end))
      );

      const snapshot = await getDocs(assignmentsQuery);
      const assignments = snapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const totalAssignments = assignments.length;
      const successfulAssignments = assignments.filter(a => a.status === 'completed').length;
      
      const assignmentTimes = assignments.map(a => a.assignmentTime || 0);
      const averageAssignmentTime = assignmentTimes.reduce((sum, time) => sum + time, 0) / assignmentTimes.length || 0;
      
      const pickupTimes = assignments.map(a => a.estimatedPickupTime || 0);
      const averagePickupTime = pickupTimes.reduce((sum, time) => sum + time, 0) / pickupTimes.length || 0;

      return {
        totalAssignments,
        successfulAssignments,
        averageAssignmentTime,
        averagePickupTime,
        driverUtilization: await this.calculateDriverUtilization(),
        passengerSatisfaction: await this.calculatePassengerSatisfaction(timeRange),
        cancellationRate: await this.calculateCancellationRate(timeRange),
        emergencyResponseTime: await this.calculateEmergencyResponseTime(timeRange)
      };
    } catch (error) {
      console.error('Error getting dispatch metrics:', error);
      throw new Error('Failed to get dispatch metrics');
    }
  }

  /**
   * Optimize dispatch algorithm based on historical data
   */
  async optimizeDispatchAlgorithm(): Promise<void> {
    try {
      // Analyze historical performance
      const historicalData = await this.getHistoricalPerformanceData();
      
      // Use machine learning to optimize weights
      const optimizedWeights = await this.optimizeWeights(historicalData);
      
      // Update AI weights
      Object.assign(this.AI_WEIGHTS, optimizedWeights);
      
      // Save optimized configuration
      await this.saveOptimizedConfiguration(optimizedWeights);
    } catch (error) {
      console.error('Error optimizing dispatch algorithm:', error);
      throw new Error('Failed to optimize dispatch algorithm');
    }
  }

  // Helper Methods

  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculatePickupTime(pickup: LocationPoint, driverLocation: LocationPoint): number {
    const distance = this.calculateDistance(pickup, driverLocation);
    const averageSpeed = 30; // km/h in city traffic
    return (distance / averageSpeed) * 3600; // Convert to seconds
  }

  private async calculatePassengerPreference(passengerId: string, driverId: string): Promise<number> {
    // Implement passenger-driver preference calculation based on history
    // This would analyze past rides, ratings, and preferences
    return 0.5; // Default neutral preference
  }

  private async getTrafficScore(pickup: LocationPoint, driverLocation: LocationPoint): Promise<number> {
    // Implement traffic condition analysis
    // This would integrate with traffic APIs to get real-time conditions
    return 0.7; // Default good traffic score
  }

  private calculateSurgeMultiplier(location: LocationPoint): number {
    // Implement surge pricing calculation based on demand
    return 1.0; // Default no surge
  }

  private calculateLoyaltyScore(completedRides: number): number {
    // Reward experienced drivers
    return Math.min(1, completedRides / 1000);
  }

  private calculateConfidence(bestScore: number, allScores: any[]): number {
    if (allScores.length < 2) return 1.0;
    
    const secondBestScore = allScores[1].score;
    const scoreDifference = bestScore - secondBestScore;
    
    return Math.min(1, scoreDifference * 2); // Higher difference = higher confidence
  }

  private getAssignmentReason(factors: AssignmentFactors): string {
    const topFactor = Object.entries(factors)
      .sort(([,a], [,b]) => b - a)[0];
    
    const reasonMap: Record<string, string> = {
      distance: 'Closest driver',
      driverRating: 'Highest rated driver',
      acceptanceRate: 'Most reliable driver',
      vehicleMatch: 'Perfect vehicle match',
      availability: 'Immediately available',
      efficiency: 'Most efficient driver'
    };
    
    return reasonMap[topFactor[0]] || 'Best overall match';
  }

  private async getDriverWorkloads(): Promise<Map<string, number>> {
    // Get current active rides per driver
    const activeRidesQuery = query(
      collection(db, this.RIDES_COLLECTION),
      where('status', 'in', ['assigned', 'accepted', 'in_progress'])
    );

    const snapshot = await getDocs(activeRidesQuery);
    const workloads = new Map<string, number>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.assignedDriverId) {
        const current = workloads.get(data.assignedDriverId) || 0;
        workloads.set(data.assignedDriverId, current + 1);
      }
    });

    return workloads;
  }

  private async saveAssignment(assignment: DispatchAssignment): Promise<void> {
    await setDoc(doc(db, this.ASSIGNMENTS_COLLECTION, assignment.rideId), {
      ...assignment,
      assignedAt: Timestamp.fromDate(assignment.assignedAt),
      estimatedArrivalTime: Timestamp.fromDate(assignment.estimatedArrivalTime)
    });
  }

  private async updateRideAssignment(rideId: string, assignment: DispatchAssignment): Promise<void> {
    await updateDoc(doc(db, this.RIDES_COLLECTION, rideId), {
      assignedDriverId: assignment.driverId,
      assignmentScore: assignment.score,
      assignmentReason: this.getAssignmentReason(assignment.factors),
      estimatedPickupTime: assignment.estimatedPickupTime,
      estimatedArrivalTime: Timestamp.fromDate(assignment.estimatedArrivalTime),
      status: 'assigned',
      updatedAt: Timestamp.fromDate(new Date())
    });
  }

  private async updateDriverStatus(driverId: string, status: string, rideId?: string): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: Timestamp.fromDate(new Date())
    };

    if (rideId) {
      updateData.currentRideId = rideId;
    } else {
      updateData.currentRideId = null;
    }

    await updateDoc(doc(db, this.DRIVERS_COLLECTION, driverId), updateData);
  }

  private async getAssignment(rideId: string): Promise<DispatchAssignment | null> {
    const assignmentDoc = await getDoc(doc(db, this.ASSIGNMENTS_COLLECTION, rideId));
    
    if (!assignmentDoc.exists()) {
      return null;
    }

    const data = assignmentDoc.data();
    return {
      ...data,
      assignedAt: data.assignedAt.toDate(),
      estimatedArrivalTime: data.estimatedArrivalTime.toDate()
    } as DispatchAssignment;
  }

  private async calculateDriverUtilization(): Promise<number> {
    // Calculate overall driver utilization rate
    return 0.75; // Placeholder
  }

  private async calculatePassengerSatisfaction(timeRange: { start: Date; end: Date }): Promise<number> {
    // Calculate passenger satisfaction for the time range
    return 4.2; // Placeholder
  }

  private async calculateCancellationRate(timeRange: { start: Date; end: Date }): Promise<number> {
    // Calculate cancellation rate for the time range
    return 0.05; // Placeholder
  }

  private async calculateEmergencyResponseTime(timeRange: { start: Date; end: Date }): Promise<number> {
    // Calculate average emergency response time
    return 120; // Placeholder - 2 minutes
  }

  private async getHistoricalPerformanceData(): Promise<any[]> {
    // Get historical performance data for optimization
    return []; // Placeholder
  }

  private async optimizeWeights(historicalData: any[]): Promise<Partial<typeof this.AI_WEIGHTS>> {
    // Use machine learning to optimize weights based on historical performance
    return {}; // Placeholder
  }

  private async saveOptimizedConfiguration(weights: any): Promise<void> {
    // Save optimized configuration to database
    await setDoc(doc(db, 'system_config', 'dispatch_weights'), {
      weights,
      optimizedAt: Timestamp.fromDate(new Date())
    });
  }
}

export const intelligentDispatchService = new IntelligentDispatchService();
export default intelligentDispatchService;