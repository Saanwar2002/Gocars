/**
 * Load Balancing Service
 * Advanced load balancing and fleet optimization for intelligent dispatch
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
export interface LoadBalancingMetrics {
  driverId: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationRate: number;
  efficiency: number;
  location: LocationPoint;
  workingHours: WorkingHours;
  performance: DriverPerformanceData;
  lastUpdated: Date;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  geofenceId?: string;
}

export interface WorkingHours {
  start: string;
  end: string;
  timezone: string;
  breaks: BreakPeriod[];
}

export interface BreakPeriod {
  start: string;
  end: string;
  type: 'lunch' | 'rest' | 'maintenance';
}

export interface DriverPerformanceData {
  averageRideTime: number;
  completionRate: number;
  customerRating: number;
  responseTime: number;
  fuelEfficiency: number;
  safetyScore: number;
}

export interface GeofenceArea {
  id: string;
  name: string;
  coordinates: LocationPoint[];
  priority: number;
  demandMultiplier: number;
  minDrivers: number;
  maxDrivers: number;
  currentDrivers: number;
  averageWaitTime: number;
}

export interface LoadBalancingStrategy {
  id: string;
  name: string;
  description: string;
  algorithm: 'round_robin' | 'least_connections' | 'weighted_round_robin' | 'geographic' | 'ai_optimized';
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface RebalancingRecommendation {
  driverId: string;
  currentLocation: LocationPoint;
  recommendedLocation: LocationPoint;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: {
    waitTimeReduction: number;
    utilizationImprovement: number;
    revenueIncrease: number;
  };
  estimatedTravelTime: number;
  confidence: number;
}

export interface FleetOptimizationResult {
  totalDrivers: number;
  activeDrivers: number;
  averageUtilization: number;
  totalDemand: number;
  unmetDemand: number;
  recommendations: RebalancingRecommendation[];
  geofenceStatus: GeofenceArea[];
  optimizationScore: number;
}

class LoadBalancingService {
  private readonly DRIVERS_COLLECTION = 'drivers';
  private readonly GEOFENCES_COLLECTION = 'geofences';
  private readonly LOAD_METRICS_COLLECTION = 'load_metrics';
  private readonly STRATEGIES_COLLECTION = 'load_balancing_strategies';

  // Default configuration
  private readonly DEFAULT_CONFIG = {
    maxRidesPerDriver: 3,
    optimalUtilizationRate: 0.75,
    rebalancingThreshold: 0.2,
    emergencyCapacityReserve: 0.15,
    geofenceRebalancingInterval: 300000, // 5 minutes
    performanceWeights: {
      utilization: 0.3,
      waitTime: 0.25,
      efficiency: 0.2,
      satisfaction: 0.15,
      revenue: 0.1
    }
  };

  /**
   * Get current load balancing metrics for all drivers
   */
  async getLoadBalancingMetrics(): Promise<LoadBalancingMetrics[]> {
    try {
      const driversQuery = query(
        collection(db, this.DRIVERS_COLLECTION),
        where('status', 'in', ['available', 'busy'])
      );

      const snapshot = await getDocs(driversQuery);
      const metrics: LoadBalancingMetrics[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentLoad = await this.calculateCurrentLoad(doc.id);
        
        metrics.push({
          driverId: doc.id,
          currentLoad,
          maxCapacity: this.DEFAULT_CONFIG.maxRidesPerDriver,
          utilizationRate: currentLoad / this.DEFAULT_CONFIG.maxRidesPerDriver,
          efficiency: data.performance?.efficiency || 0.8,
          location: data.currentLocation || { latitude: 0, longitude: 0 },
          workingHours: data.workingHours || { start: '00:00', end: '23:59', timezone: 'UTC', breaks: [] },
          performance: {
            averageRideTime: data.performance?.averageRideTime || 20,
            completionRate: data.performance?.completionRate || 0.95,
            customerRating: data.performance?.rating || 4.5,
            responseTime: data.performance?.averageResponseTime || 60,
            fuelEfficiency: data.performance?.fuelEfficiency || 0.8,
            safetyScore: data.performance?.safetyScore || 0.9
          },
          lastUpdated: new Date()
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error getting load balancing metrics:', error);
      throw new Error('Failed to get load balancing metrics');
    }
  }

  /**
   * Calculate optimal driver distribution across geofences
   */
  async optimizeFleetDistribution(): Promise<FleetOptimizationResult> {
    try {
      const [metrics, geofences, demandData] = await Promise.all([
        this.getLoadBalancingMetrics(),
        this.getGeofenceAreas(),
        this.getCurrentDemandData()
      ]);

      // Calculate current distribution
      const currentDistribution = this.calculateCurrentDistribution(metrics, geofences);
      
      // Calculate optimal distribution based on demand
      const optimalDistribution = this.calculateOptimalDistribution(demandData, geofences);
      
      // Generate rebalancing recommendations
      const recommendations = this.generateRebalancingRecommendations(
        currentDistribution,
        optimalDistribution,
        metrics
      );

      // Calculate optimization score
      const optimizationScore = this.calculateOptimizationScore(
        currentDistribution,
        optimalDistribution,
        demandData
      );

      return {
        totalDrivers: metrics.length,
        activeDrivers: metrics.filter(m => m.utilizationRate > 0).length,
        averageUtilization: metrics.reduce((sum, m) => sum + m.utilizationRate, 0) / metrics.length,
        totalDemand: demandData.reduce((sum, d) => sum + d.demand, 0),
        unmetDemand: demandData.reduce((sum, d) => sum + Math.max(0, d.demand - d.supply), 0),
        recommendations,
        geofenceStatus: geofences.map(g => ({
          ...g,
          currentDrivers: currentDistribution.get(g.id) || 0
        })),
        optimizationScore
      };
    } catch (error) {
      console.error('Error optimizing fleet distribution:', error);
      throw new Error('Failed to optimize fleet distribution');
    }
  }

  /**
   * Apply load balancing strategy to driver selection
   */
  async applyLoadBalancing(
    availableDrivers: any[],
    rideRequest: any,
    strategy: LoadBalancingStrategy
  ): Promise<any[]> {
    try {
      const metrics = await this.getLoadBalancingMetrics();
      const driverMetrics = new Map(metrics.map(m => [m.driverId, m]));

      switch (strategy.algorithm) {
        case 'round_robin':
          return this.applyRoundRobin(availableDrivers, driverMetrics);
        
        case 'least_connections':
          return this.applyLeastConnections(availableDrivers, driverMetrics);
        
        case 'weighted_round_robin':
          return this.applyWeightedRoundRobin(availableDrivers, driverMetrics, strategy.parameters);
        
        case 'geographic':
          return this.applyGeographicBalancing(availableDrivers, rideRequest, driverMetrics);
        
        case 'ai_optimized':
          return this.applyAIOptimizedBalancing(availableDrivers, rideRequest, driverMetrics);
        
        default:
          return availableDrivers;
      }
    } catch (error) {
      console.error('Error applying load balancing:', error);
      return availableDrivers;
    }
  }

  /**
   * Monitor and trigger automatic rebalancing
   */
  async monitorAndRebalance(): Promise<void> {
    try {
      const optimizationResult = await this.optimizeFleetDistribution();
      
      // Check if rebalancing is needed
      const needsRebalancing = this.shouldTriggerRebalancing(optimizationResult);
      
      if (needsRebalancing) {
        // Execute high-priority recommendations
        const highPriorityRecommendations = optimizationResult.recommendations
          .filter(r => r.priority === 'high')
          .slice(0, 5); // Limit to top 5 recommendations
        
        for (const recommendation of highPriorityRecommendations) {
          await this.executeRebalancingRecommendation(recommendation);
        }
        
        // Log rebalancing action
        await this.logRebalancingAction(optimizationResult, highPriorityRecommendations);
      }
    } catch (error) {
      console.error('Error in monitoring and rebalancing:', error);
    }
  }

  /**
   * Get real-time fleet utilization metrics
   */
  async getFleetUtilizationMetrics(): Promise<{
    overall: number;
    byGeofence: Map<string, number>;
    byTimeOfDay: Map<string, number>;
    trends: { timestamp: Date; utilization: number }[];
  }> {
    try {
      const metrics = await this.getLoadBalancingMetrics();
      const geofences = await this.getGeofenceAreas();
      
      // Calculate overall utilization
      const overallUtilization = metrics.reduce((sum, m) => sum + m.utilizationRate, 0) / metrics.length;
      
      // Calculate utilization by geofence
      const byGeofence = new Map<string, number>();
      for (const geofence of geofences) {
        const geofenceDrivers = metrics.filter(m => 
          this.isLocationInGeofence(m.location, geofence)
        );
        const geofenceUtilization = geofenceDrivers.length > 0
          ? geofenceDrivers.reduce((sum, m) => sum + m.utilizationRate, 0) / geofenceDrivers.length
          : 0;
        byGeofence.set(geofence.id, geofenceUtilization);
      }
      
      // Calculate utilization by time of day (last 24 hours)
      const byTimeOfDay = await this.getUtilizationByTimeOfDay();
      
      // Get utilization trends (last 7 days)
      const trends = await this.getUtilizationTrends();
      
      return {
        overall: overallUtilization,
        byGeofence,
        byTimeOfDay,
        trends
      };
    } catch (error) {
      console.error('Error getting fleet utilization metrics:', error);
      throw new Error('Failed to get fleet utilization metrics');
    }
  }

  // Private helper methods

  private async calculateCurrentLoad(driverId: string): Promise<number> {
    try {
      const activeRidesQuery = query(
        collection(db, 'rides'),
        where('assignedDriverId', '==', driverId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress'])
      );
      
      const snapshot = await getDocs(activeRidesQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error calculating current load:', error);
      return 0;
    }
  }

  private async getGeofenceAreas(): Promise<GeofenceArea[]> {
    try {
      const snapshot = await getDocs(collection(db, this.GEOFENCES_COLLECTION));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        currentDrivers: 0,
        averageWaitTime: 0
      })) as GeofenceArea[];
    } catch (error) {
      console.error('Error getting geofence areas:', error);
      return [];
    }
  }

  private async getCurrentDemandData(): Promise<Array<{ geofenceId: string; demand: number; supply: number }>> {
    // Mock implementation - in real scenario, this would analyze current ride requests
    return [
      { geofenceId: 'downtown', demand: 25, supply: 20 },
      { geofenceId: 'airport', demand: 15, supply: 18 },
      { geofenceId: 'suburbs', demand: 10, supply: 12 }
    ];
  }

  private calculateCurrentDistribution(
    metrics: LoadBalancingMetrics[],
    geofences: GeofenceArea[]
  ): Map<string, number> {
    const distribution = new Map<string, number>();
    
    for (const geofence of geofences) {
      const driversInGeofence = metrics.filter(m => 
        this.isLocationInGeofence(m.location, geofence)
      ).length;
      distribution.set(geofence.id, driversInGeofence);
    }
    
    return distribution;
  }

  private calculateOptimalDistribution(
    demandData: Array<{ geofenceId: string; demand: number; supply: number }>,
    geofences: GeofenceArea[]
  ): Map<string, number> {
    const optimal = new Map<string, number>();
    const totalDemand = demandData.reduce((sum, d) => sum + d.demand, 0);
    const totalDrivers = demandData.reduce((sum, d) => sum + d.supply, 0);
    
    for (const demand of demandData) {
      const demandRatio = demand.demand / totalDemand;
      const optimalDrivers = Math.round(totalDrivers * demandRatio);
      optimal.set(demand.geofenceId, optimalDrivers);
    }
    
    return optimal;
  }

  private generateRebalancingRecommendations(
    current: Map<string, number>,
    optimal: Map<string, number>,
    metrics: LoadBalancingMetrics[]
  ): RebalancingRecommendation[] {
    const recommendations: RebalancingRecommendation[] = [];
    
    // Find areas that need more drivers
    const surplusAreas: string[] = [];
    const deficitAreas: string[] = [];
    
    for (const [geofenceId, currentCount] of current) {
      const optimalCount = optimal.get(geofenceId) || 0;
      const difference = currentCount - optimalCount;
      
      if (difference > 1) {
        surplusAreas.push(geofenceId);
      } else if (difference < -1) {
        deficitAreas.push(geofenceId);
      }
    }
    
    // Generate recommendations to move drivers from surplus to deficit areas
    for (const surplusArea of surplusAreas) {
      for (const deficitArea of deficitAreas) {
        const driversInSurplus = metrics.filter(m => 
          m.location.geofenceId === surplusArea && m.utilizationRate < 0.5
        );
        
        if (driversInSurplus.length > 0) {
          const driver = driversInSurplus[0];
          const deficitGeofence = this.getGeofenceById(deficitArea);
          
          if (deficitGeofence) {
            recommendations.push({
              driverId: driver.driverId,
              currentLocation: driver.location,
              recommendedLocation: this.getGeofenceCenter(deficitGeofence),
              reason: `Move from surplus area ${surplusArea} to high-demand area ${deficitArea}`,
              priority: 'medium',
              estimatedImpact: {
                waitTimeReduction: 2.5,
                utilizationImprovement: 0.15,
                revenueIncrease: 50
              },
              estimatedTravelTime: 10,
              confidence: 0.8
            });
          }
        }
      }
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private calculateOptimizationScore(
    current: Map<string, number>,
    optimal: Map<string, number>,
    demandData: Array<{ geofenceId: string; demand: number; supply: number }>
  ): number {
    let totalDeviation = 0;
    let maxPossibleDeviation = 0;
    
    for (const [geofenceId, currentCount] of current) {
      const optimalCount = optimal.get(geofenceId) || 0;
      const deviation = Math.abs(currentCount - optimalCount);
      totalDeviation += deviation;
      maxPossibleDeviation += Math.max(currentCount, optimalCount);
    }
    
    return maxPossibleDeviation > 0 ? (1 - totalDeviation / maxPossibleDeviation) * 100 : 100;
  }

  private applyRoundRobin(
    drivers: any[],
    metrics: Map<string, LoadBalancingMetrics>
  ): any[] {
    return drivers.sort((a, b) => {
      const aLoad = metrics.get(a.driverId)?.currentLoad || 0;
      const bLoad = metrics.get(b.driverId)?.currentLoad || 0;
      return aLoad - bLoad;
    });
  }

  private applyLeastConnections(
    drivers: any[],
    metrics: Map<string, LoadBalancingMetrics>
  ): any[] {
    return drivers.sort((a, b) => {
      const aUtilization = metrics.get(a.driverId)?.utilizationRate || 0;
      const bUtilization = metrics.get(b.driverId)?.utilizationRate || 0;
      return aUtilization - bUtilization;
    });
  }

  private applyWeightedRoundRobin(
    drivers: any[],
    metrics: Map<string, LoadBalancingMetrics>,
    parameters: Record<string, any>
  ): any[] {
    const weights = parameters.weights || {};
    
    return drivers.sort((a, b) => {
      const aMetric = metrics.get(a.driverId);
      const bMetric = metrics.get(b.driverId);
      
      if (!aMetric || !bMetric) return 0;
      
      const aScore = (
        (aMetric.utilizationRate * (weights.utilization || 0.4)) +
        (aMetric.efficiency * (weights.efficiency || 0.3)) +
        (aMetric.performance.customerRating / 5 * (weights.rating || 0.3))
      );
      
      const bScore = (
        (bMetric.utilizationRate * (weights.utilization || 0.4)) +
        (bMetric.efficiency * (weights.efficiency || 0.3)) +
        (bMetric.performance.customerRating / 5 * (weights.rating || 0.3))
      );
      
      return aScore - bScore; // Lower score = higher priority
    });
  }

  private applyGeographicBalancing(
    drivers: any[],
    rideRequest: any,
    metrics: Map<string, LoadBalancingMetrics>
  ): any[] {
    // Prioritize drivers in less congested areas
    return drivers.sort((a, b) => {
      const aMetric = metrics.get(a.driverId);
      const bMetric = metrics.get(b.driverId);
      
      if (!aMetric || !bMetric) return 0;
      
      // Calculate distance to pickup
      const aDistance = this.calculateDistance(aMetric.location, rideRequest.pickupLocation);
      const bDistance = this.calculateDistance(bMetric.location, rideRequest.pickupLocation);
      
      // Factor in utilization rate
      const aScore = aDistance * (1 + aMetric.utilizationRate);
      const bScore = bDistance * (1 + bMetric.utilizationRate);
      
      return aScore - bScore;
    });
  }

  private applyAIOptimizedBalancing(
    drivers: any[],
    rideRequest: any,
    metrics: Map<string, LoadBalancingMetrics>
  ): any[] {
    // Advanced AI-based balancing considering multiple factors
    return drivers.sort((a, b) => {
      const aMetric = metrics.get(a.driverId);
      const bMetric = metrics.get(b.driverId);
      
      if (!aMetric || !bMetric) return 0;
      
      const aScore = this.calculateAIScore(aMetric, rideRequest);
      const bScore = this.calculateAIScore(bMetric, rideRequest);
      
      return bScore - aScore; // Higher score = higher priority
    });
  }

  private calculateAIScore(metric: LoadBalancingMetrics, rideRequest: any): number {
    const weights = this.DEFAULT_CONFIG.performanceWeights;
    
    // Normalize utilization (lower is better for load balancing)
    const utilizationScore = 1 - metric.utilizationRate;
    
    // Distance score (closer is better)
    const distance = this.calculateDistance(metric.location, rideRequest.pickupLocation);
    const distanceScore = Math.max(0, 1 - distance / 10); // 10km max
    
    // Performance scores
    const efficiencyScore = metric.efficiency;
    const satisfactionScore = metric.performance.customerRating / 5;
    const responseScore = Math.max(0, 1 - metric.performance.responseTime / 300); // 5 min max
    
    return (
      utilizationScore * weights.utilization +
      distanceScore * weights.waitTime +
      efficiencyScore * weights.efficiency +
      satisfactionScore * weights.satisfaction +
      responseScore * weights.revenue
    );
  }

  private shouldTriggerRebalancing(result: FleetOptimizationResult): boolean {
    return (
      result.optimizationScore < 70 || // Low optimization score
      result.unmetDemand > result.totalDemand * 0.1 || // More than 10% unmet demand
      result.recommendations.filter(r => r.priority === 'high').length > 0 // High priority recommendations exist
    );
  }

  private async executeRebalancingRecommendation(recommendation: RebalancingRecommendation): Promise<void> {
    try {
      // Send rebalancing suggestion to driver
      await this.sendRebalancingNotification(recommendation);
      
      // Log the recommendation execution
      await setDoc(doc(db, 'rebalancing_actions', `${recommendation.driverId}_${Date.now()}`), {
        ...recommendation,
        executedAt: Timestamp.fromDate(new Date()),
        status: 'sent'
      });
    } catch (error) {
      console.error('Error executing rebalancing recommendation:', error);
    }
  }

  private async sendRebalancingNotification(recommendation: RebalancingRecommendation): Promise<void> {
    // Implementation would send notification to driver app
    console.log(`Sending rebalancing notification to driver ${recommendation.driverId}`);
  }

  private async logRebalancingAction(
    result: FleetOptimizationResult,
    executedRecommendations: RebalancingRecommendation[]
  ): Promise<void> {
    await setDoc(doc(db, 'rebalancing_logs', Date.now().toString()), {
      timestamp: Timestamp.fromDate(new Date()),
      optimizationScore: result.optimizationScore,
      totalRecommendations: result.recommendations.length,
      executedRecommendations: executedRecommendations.length,
      unmetDemand: result.unmetDemand,
      averageUtilization: result.averageUtilization
    });
  }

  private isLocationInGeofence(location: LocationPoint, geofence: GeofenceArea): boolean {
    // Simple point-in-polygon check (simplified for demo)
    // In production, use a proper geospatial library
    return location.geofenceId === geofence.id;
  }

  private getGeofenceById(id: string): GeofenceArea | null {
    // Mock implementation - would fetch from database
    return null;
  }

  private getGeofenceCenter(geofence: GeofenceArea): LocationPoint {
    // Calculate center of geofence polygon
    const avgLat = geofence.coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / geofence.coordinates.length;
    const avgLng = geofence.coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / geofence.coordinates.length;
    
    return {
      latitude: avgLat,
      longitude: avgLng,
      geofenceId: geofence.id
    };
  }

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

  private async getUtilizationByTimeOfDay(): Promise<Map<string, number>> {
    // Mock implementation - would analyze historical data
    const byTimeOfDay = new Map<string, number>();
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0') + ':00';
      byTimeOfDay.set(hourStr, Math.random() * 0.8 + 0.2); // Random between 0.2 and 1.0
    }
    return byTimeOfDay;
  }

  private async getUtilizationTrends(): Promise<{ timestamp: Date; utilization: number }[]> {
    // Mock implementation - would fetch from historical data
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        timestamp: date,
        utilization: Math.random() * 0.4 + 0.5 // Random between 0.5 and 0.9
      });
    }
    return trends;
  }
}

export const loadBalancingService = new LoadBalancingService();
export default loadBalancingService;