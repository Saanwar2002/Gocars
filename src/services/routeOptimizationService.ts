import { LocationPoint } from '@/types';

export interface RouteStop {
  id: string;
  location: LocationPoint;
  address: string;
  waitTime: number; // minutes
  priority: 'low' | 'medium' | 'high';
  instructions?: string;
  estimatedArrival?: Date;
  actualArrival?: Date;
}

export interface OptimizedRoute {
  optimizedOrder: number[];
  totalDistance: number; // miles
  totalDuration: number; // minutes
  estimatedFare: number;
  waypoints: LocationPoint[];
  savings: {
    timeSaved: number; // minutes
    distanceSaved: number; // miles
    costSaved: number; // dollars
  };
  routeSegments: RouteSegment[];
}

export interface RouteSegment {
  from: LocationPoint;
  to: LocationPoint;
  distance: number;
  duration: number;
  instructions: string[];
}

export interface RouteOptimizationOptions {
  prioritizeTime: boolean;
  prioritizeCost: boolean;
  respectPriorities: boolean;
  maxDetourTime: number; // minutes
  trafficAware: boolean;
}

class RouteOptimizationService {
  private readonly GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  private readonly BASE_FARE = 4.00;
  private readonly PER_MILE_RATE = 1.20;
  private readonly PER_MINUTE_RATE = 0.15;
  private readonly PER_STOP_SURCHARGE = 0.50;
  private readonly PRIORITY_MULTIPLIERS = {
    high: 1.5,
    medium: 1.0,
    low: 0.8,
  };

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLon = this.toRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate travel time based on distance and traffic conditions
   */
  private estimateTravelTime(distance: number, trafficMultiplier: number = 1.0): number {
    const averageSpeedMph = 25; // Average city driving speed
    const baseTime = (distance / averageSpeedMph) * 60; // Convert to minutes
    return baseTime * trafficMultiplier;
  }

  /**
   * Calculate fare for a route
   */
  private calculateFare(
    totalDistance: number,
    totalTime: number,
    stopCount: number,
    priorities: string[]
  ): number {
    let fare = this.BASE_FARE;
    fare += totalDistance * this.PER_MILE_RATE;
    fare += totalTime * this.PER_MINUTE_RATE;
    fare += stopCount * this.PER_STOP_SURCHARGE;

    // Apply priority multipliers
    const priorityMultiplier = priorities.reduce((acc, priority) => {
      return acc + (this.PRIORITY_MULTIPLIERS[priority as keyof typeof this.PRIORITY_MULTIPLIERS] || 1.0);
    }, 0) / priorities.length;

    return fare * priorityMultiplier;
  }

  /**
   * Generate all possible permutations of stops
   */
  private generatePermutations<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];
    
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = this.generatePermutations(rest);
      for (const perm of perms) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  /**
   * Solve Traveling Salesman Problem using nearest neighbor heuristic
   */
  private solveTSP(
    pickup: LocationPoint,
    dropoff: LocationPoint,
    stops: RouteStop[]
  ): number[] {
    if (stops.length === 0) return [];
    if (stops.length === 1) return [0];

    const unvisited = new Set(stops.map((_, index) => index));
    const route: number[] = [];
    let currentLocation = pickup;

    while (unvisited.size > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      for (const index of unvisited) {
        const distance = this.calculateDistance(currentLocation, stops[index].location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      route.push(nearestIndex);
      unvisited.delete(nearestIndex);
      currentLocation = stops[nearestIndex].location;
    }

    return route;
  }

  /**
   * Apply priority-based optimization
   */
  private applyPriorityOptimization(
    route: number[],
    stops: RouteStop[],
    options: RouteOptimizationOptions
  ): number[] {
    if (!options.respectPriorities) return route;

    // Sort high priority stops to be visited earlier
    const highPriorityIndices = route.filter(i => stops[i].priority === 'high');
    const mediumPriorityIndices = route.filter(i => stops[i].priority === 'medium');
    const lowPriorityIndices = route.filter(i => stops[i].priority === 'low');

    // Reorder while trying to maintain geographical efficiency
    const optimizedRoute: number[] = [];
    const remaining = new Set(route);

    // Add high priority stops first, but consider geographical proximity
    while (highPriorityIndices.length > 0 && remaining.size > 0) {
      const nextIndex = highPriorityIndices.shift()!;
      if (remaining.has(nextIndex)) {
        optimizedRoute.push(nextIndex);
        remaining.delete(nextIndex);
      }
    }

    // Fill in with medium and low priority stops using nearest neighbor
    let currentLocation = optimizedRoute.length > 0 
      ? stops[optimizedRoute[optimizedRoute.length - 1]].location 
      : stops[route[0]].location;

    while (remaining.size > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      for (const index of remaining) {
        const distance = this.calculateDistance(currentLocation, stops[index].location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      optimizedRoute.push(nearestIndex);
      remaining.delete(nearestIndex);
      currentLocation = stops[nearestIndex].location;
    }

    return optimizedRoute;
  }

  /**
   * Calculate route segments with detailed information
   */
  private calculateRouteSegments(
    pickup: LocationPoint,
    dropoff: LocationPoint,
    stops: RouteStop[],
    optimizedOrder: number[]
  ): RouteSegment[] {
    const segments: RouteSegment[] = [];
    let currentLocation = pickup;

    // Pickup to first stop (or dropoff if no stops)
    if (optimizedOrder.length > 0) {
      const firstStop = stops[optimizedOrder[0]];
      const distance = this.calculateDistance(currentLocation, firstStop.location);
      const duration = this.estimateTravelTime(distance);

      segments.push({
        from: currentLocation,
        to: firstStop.location,
        distance,
        duration,
        instructions: [`Drive to ${firstStop.address}`],
      });

      currentLocation = firstStop.location;
    }

    // Between stops
    for (let i = 0; i < optimizedOrder.length - 1; i++) {
      const currentStop = stops[optimizedOrder[i]];
      const nextStop = stops[optimizedOrder[i + 1]];
      const distance = this.calculateDistance(currentStop.location, nextStop.location);
      const duration = this.estimateTravelTime(distance);

      segments.push({
        from: currentStop.location,
        to: nextStop.location,
        distance,
        duration: duration + currentStop.waitTime, // Include wait time
        instructions: [
          `Wait at ${currentStop.address} for ${currentStop.waitTime} minutes`,
          `Drive to ${nextStop.address}`,
        ],
      });
    }

    // Last stop to dropoff
    if (optimizedOrder.length > 0) {
      const lastStop = stops[optimizedOrder[optimizedOrder.length - 1]];
      const distance = this.calculateDistance(lastStop.location, dropoff);
      const duration = this.estimateTravelTime(distance);

      segments.push({
        from: lastStop.location,
        to: dropoff,
        distance,
        duration: duration + lastStop.waitTime, // Include wait time
        instructions: [
          `Wait at ${lastStop.address} for ${lastStop.waitTime} minutes`,
          `Drive to final destination`,
        ],
      });
    } else {
      // Direct route from pickup to dropoff
      const distance = this.calculateDistance(pickup, dropoff);
      const duration = this.estimateTravelTime(distance);

      segments.push({
        from: pickup,
        to: dropoff,
        distance,
        duration,
        instructions: ['Drive directly to destination'],
      });
    }

    return segments;
  }

  /**
   * Optimize route using multiple algorithms and return the best result
   */
  async optimizeRoute(
    pickup: LocationPoint,
    dropoff: LocationPoint,
    stops: RouteStop[],
    options: RouteOptimizationOptions = {
      prioritizeTime: true,
      prioritizeCost: false,
      respectPriorities: true,
      maxDetourTime: 30,
      trafficAware: true,
    }
  ): Promise<OptimizedRoute> {
    if (stops.length === 0) {
      // Direct route
      const distance = this.calculateDistance(pickup, dropoff);
      const duration = this.estimateTravelTime(distance);
      const fare = this.calculateFare(distance, duration, 0, []);

      return {
        optimizedOrder: [],
        totalDistance: distance,
        totalDuration: duration,
        estimatedFare: fare,
        waypoints: [pickup, dropoff],
        savings: { timeSaved: 0, distanceSaved: 0, costSaved: 0 },
        routeSegments: this.calculateRouteSegments(pickup, dropoff, stops, []),
      };
    }

    // Calculate original route (in order)
    const originalOrder = stops.map((_, index) => index);
    const originalSegments = this.calculateRouteSegments(pickup, dropoff, stops, originalOrder);
    const originalDistance = originalSegments.reduce((sum, seg) => sum + seg.distance, 0);
    const originalDuration = originalSegments.reduce((sum, seg) => sum + seg.duration, 0);
    const originalFare = this.calculateFare(
      originalDistance,
      originalDuration,
      stops.length,
      stops.map(s => s.priority)
    );

    // Try different optimization strategies
    const strategies: number[][] = [];

    // Strategy 1: Nearest neighbor (TSP approximation)
    strategies.push(this.solveTSP(pickup, dropoff, stops));

    // Strategy 2: Priority-based optimization
    if (options.respectPriorities) {
      strategies.push(this.applyPriorityOptimization(originalOrder, stops, options));
    }

    // Strategy 3: Brute force for small numbers of stops (≤ 8)
    if (stops.length <= 8) {
      const permutations = this.generatePermutations(originalOrder);
      strategies.push(...permutations.slice(0, 20)); // Limit to prevent performance issues
    }

    // Evaluate each strategy
    let bestRoute: OptimizedRoute | null = null;
    let bestScore = Infinity;

    for (const order of strategies) {
      const segments = this.calculateRouteSegments(pickup, dropoff, stops, order);
      const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
      const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
      const estimatedFare = this.calculateFare(
        totalDistance,
        totalDuration,
        stops.length,
        stops.map(s => s.priority)
      );

      // Calculate score based on priorities
      let score = 0;
      if (options.prioritizeTime) score += totalDuration * 0.6;
      if (options.prioritizeCost) score += estimatedFare * 0.4;
      if (!options.prioritizeTime && !options.prioritizeCost) {
        score = totalDistance * 0.5 + totalDuration * 0.3 + estimatedFare * 0.2;
      }

      if (score < bestScore) {
        bestScore = score;
        bestRoute = {
          optimizedOrder: order,
          totalDistance,
          totalDuration,
          estimatedFare,
          waypoints: [pickup, ...order.map(i => stops[i].location), dropoff],
          savings: {
            timeSaved: Math.max(0, originalDuration - totalDuration),
            distanceSaved: Math.max(0, originalDistance - totalDistance),
            costSaved: Math.max(0, originalFare - estimatedFare),
          },
          routeSegments: segments,
        };
      }
    }

    return bestRoute || {
      optimizedOrder: originalOrder,
      totalDistance: originalDistance,
      totalDuration: originalDuration,
      estimatedFare: originalFare,
      waypoints: [pickup, ...stops.map(s => s.location), dropoff],
      savings: { timeSaved: 0, distanceSaved: 0, costSaved: 0 },
      routeSegments: originalSegments,
    };
  }

  /**
   * Get real-time traffic information (mock implementation)
   */
  async getTrafficInfo(route: LocationPoint[]): Promise<{ multiplier: number; incidents: string[] }> {
    // Mock implementation - in real app, this would call Google Maps Traffic API
    const incidents: string[] = [];
    let multiplier = 1.0;

    // Simulate random traffic conditions
    const random = Math.random();
    if (random < 0.1) {
      multiplier = 1.5;
      incidents.push('Heavy traffic reported on main route');
    } else if (random < 0.3) {
      multiplier = 1.2;
      incidents.push('Moderate traffic conditions');
    }

    return { multiplier, incidents };
  }

  /**
   * Estimate arrival times for each stop
   */
  estimateArrivalTimes(
    startTime: Date,
    segments: RouteSegment[]
  ): Date[] {
    const arrivalTimes: Date[] = [];
    let currentTime = new Date(startTime);

    for (const segment of segments) {
      currentTime = new Date(currentTime.getTime() + segment.duration * 60000);
      arrivalTimes.push(new Date(currentTime));
    }

    return arrivalTimes;
  }

  /**
   * Validate route constraints
   */
  validateRoute(
    optimizedRoute: OptimizedRoute,
    options: RouteOptimizationOptions
  ): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check maximum detour time
    if (optimizedRoute.totalDuration > options.maxDetourTime * 60) {
      violations.push(`Route exceeds maximum detour time of ${options.maxDetourTime} minutes`);
    }

    // Check for unreasonable distances between consecutive stops
    for (let i = 0; i < optimizedRoute.routeSegments.length; i++) {
      const segment = optimizedRoute.routeSegments[i];
      if (segment.distance > 50) { // 50 miles
        violations.push(`Segment ${i + 1} has unusually long distance: ${segment.distance.toFixed(1)} miles`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }
}

export const routeOptimizationService = new RouteOptimizationService();
export default routeOptimizationService;