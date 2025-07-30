/**
 * Vehicle Performance Analytics Service
 * Advanced analytics for vehicle and driver performance with scoring,
 * optimization recommendations, and predictive insights
 */

export interface PerformanceMetrics {
  vehicleId: string;
  driverId?: string;
  period: {
    start: Date;
    end: Date;
  };
  efficiency: {
    fuelConsumption: number; // mpg or kWh/100mi
    idleTime: number; // minutes
    averageSpeed: number; // mph
    routeOptimization: number; // percentage
  };
  safety: {
    hardBraking: number;
    rapidAcceleration: number;
    speeding: number;
    safetyScore: number; // 0-100
  };
  utilization: {
    activeTime: number; // hours
    rideCount: number;
    revenue: number;
    utilizationRate: number; // percentage
  };
  maintenance: {
    breakdownCount: number;
    maintenanceCost: number;
    downtimeHours: number;
    reliabilityScore: number; // 0-100
  };
}

export interface PerformanceComparison {
  vehicleId: string;
  currentPeriod: PerformanceMetrics;
  previousPeriod: PerformanceMetrics;
  fleetAverage: PerformanceMetrics;
  ranking: {
    efficiency: number;
    safety: number;
    utilization: number;
    overall: number;
  };
  improvements: PerformanceImprovement[];
}

export interface PerformanceImprovement {
  category: 'efficiency' | 'safety' | 'utilization' | 'maintenance';
  description: string;
  potentialSavings: number;
  implementationCost: number;
  priority: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface PerformanceTrend {
  metric: string;
  values: Array<{ date: Date; value: number }>;
  trend: 'improving' | 'declining' | 'stable';
  changeRate: number; // percentage change
  forecast: Array<{ date: Date; value: number; confidence: number }>;
}

export interface PerformanceAlert {
  id: string;
  vehicleId: string;
  type: 'efficiency_drop' | 'safety_violation' | 'utilization_low' | 'maintenance_due';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  detectedAt: Date;
  recommendations: string[];
}

class VehiclePerformanceService {
  private performanceData = new Map<string, PerformanceMetrics[]>();
  private performanceAlerts: PerformanceAlert[] = [];
  private benchmarks = {
    efficiency: {
      fuelConsumption: 25, // mpg
      idleTime: 60, // minutes per day
      averageSpeed: 25, // mph
      routeOptimization: 85 // percentage
    },
    safety: {
      hardBraking: 5, // per 100 miles
      rapidAcceleration: 3, // per 100 miles
      speeding: 2, // violations per 100 miles
      safetyScore: 80 // minimum score
    },
    utilization: {
      activeTime: 8, // hours per day
      utilizationRate: 70 // percentage
    },
    maintenance: {
      reliabilityScore: 85, // minimum score
      downtimeHours: 4 // hours per month
    }
  };

  /**
   * Initialize vehicle performance service
   */
  async initialize(): Promise<void> {
    try {
      // Load historical performance data
      await this.loadPerformanceData();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      console.log('Vehicle performance service initialized successfully');
    } catch (error) {
      console.error('Error initializing vehicle performance service:', error);
    }
  }

  /**
   * Calculate performance metrics for a vehicle
   */
  async calculatePerformanceMetrics(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    try {
      // In production, this would query actual vehicle data
      // This is mock data for demonstration
      const metrics: PerformanceMetrics = {
        vehicleId,
        period: { start: startDate, end: startDate },
        efficiency: {
          fuelConsumption: 28.5 + (Math.random() - 0.5) * 5,
          idleTime: 45 + Math.random() * 30,
          averageSpeed: 22 + Math.random() * 8,
          routeOptimization: 82 + Math.random() * 15
        },
        safety: {
          hardBraking: Math.floor(Math.random() * 8),
          rapidAcceleration: Math.floor(Math.random() * 5),
          speeding: Math.floor(Math.random() * 3),
          safetyScore: 75 + Math.random() * 20
        },
        utilization: {
          activeTime: 6 + Math.random() * 4,
          rideCount: Math.floor(20 + Math.random() * 30),
          revenue: 300 + Math.random() * 400,
          utilizationRate: 65 + Math.random() * 25
        },
        maintenance: {
          breakdownCount: Math.floor(Math.random() * 2),
          maintenanceCost: 50 + Math.random() * 200,
          downtimeHours: Math.random() * 8,
          reliabilityScore: 80 + Math.random() * 15
        }
      };

      // Store metrics
      const vehicleMetrics = this.performanceData.get(vehicleId) || [];
      vehicleMetrics.push(metrics);
      this.performanceData.set(vehicleId, vehicleMetrics);

      // Check for performance alerts
      await this.checkPerformanceAlerts(vehicleId, metrics);

      return metrics;
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw error;
    }
  }

  /**
   * Compare vehicle performance
   */
  async comparePerformance(
    vehicleId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<PerformanceComparison> {
    try {
      const currentPeriod = await this.calculatePerformanceMetrics(vehicleId, currentStart, currentEnd);
      const previousPeriod = await this.calculatePerformanceMetrics(vehicleId, previousStart, previousEnd);
      const fleetAverage = await this.calculateFleetAverage(currentStart, currentEnd);

      // Calculate rankings
      const ranking = await this.calculateVehicleRanking(vehicleId, currentPeriod);

      // Generate improvement recommendations
      const improvements = this.generateImprovementRecommendations(currentPeriod, fleetAverage);

      const comparison: PerformanceComparison = {
        vehicleId,
        currentPeriod,
        previousPeriod,
        fleetAverage,
        ranking,
        improvements
      };

      return comparison;
    } catch (error) {
      console.error('Error comparing performance:', error);
      throw error;
    }
  }

  /**
   * Analyze performance trends
   */
  async analyzePerformanceTrends(
    vehicleId: string,
    metric: string,
    days: number = 30
  ): Promise<PerformanceTrend> {
    try {
      // Generate mock trend data
      const values: Array<{ date: Date; value: number }> = [];
      const baseValue = 100;
      const trendDirection = Math.random() > 0.5 ? 1 : -1;
      const changeRate = (Math.random() * 10 - 5) * trendDirection; // -5% to +5%

      for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const noise = (Math.random() - 0.5) * 10;
        const trendValue = baseValue + (days - i) * (changeRate / days) + noise;
        values.push({ date, value: Math.max(0, trendValue) });
      }

      // Generate forecast
      const forecast: Array<{ date: Date; value: number; confidence: number }> = [];
      const lastValue = values[values.length - 1].value;
      
      for (let i = 1; i <= 7; i++) {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        const forecastValue = lastValue + i * (changeRate / 7);
        const confidence = Math.max(0.3, 1 - (i * 0.1)); // Decreasing confidence
        forecast.push({ date, value: forecastValue, confidence });
      }

      const trend: PerformanceTrend = {
        metric,
        values,
        trend: changeRate > 1 ? 'improving' : changeRate < -1 ? 'declining' : 'stable',
        changeRate,
        forecast
      };

      return trend;
    } catch (error) {
      console.error('Error analyzing performance trends:', error);
      throw error;
    }
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts(vehicleId?: string): Promise<PerformanceAlert[]> {
    try {
      let alerts = this.performanceAlerts;
      
      if (vehicleId) {
        alerts = alerts.filter(alert => alert.vehicleId === vehicleId);
      }

      return alerts.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    } catch (error) {
      console.error('Error getting performance alerts:', error);
      return [];
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    vehicleIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: {
      totalVehicles: number;
      averageEfficiency: number;
      averageSafety: number;
      averageUtilization: number;
      totalRevenue: number;
    };
    topPerformers: string[];
    underPerformers: string[];
    recommendations: string[];
  }> {
    try {
      const vehicleMetrics: PerformanceMetrics[] = [];
      
      for (const vehicleId of vehicleIds) {
        const metrics = await this.calculatePerformanceMetrics(vehicleId, startDate, endDate);
        vehicleMetrics.push(metrics);
      }

      // Calculate summary
      const summary = {
        totalVehicles: vehicleMetrics.length,
        averageEfficiency: vehicleMetrics.reduce((sum, m) => sum + m.efficiency.fuelConsumption, 0) / vehicleMetrics.length,
        averageSafety: vehicleMetrics.reduce((sum, m) => sum + m.safety.safetyScore, 0) / vehicleMetrics.length,
        averageUtilization: vehicleMetrics.reduce((sum, m) => sum + m.utilization.utilizationRate, 0) / vehicleMetrics.length,
        totalRevenue: vehicleMetrics.reduce((sum, m) => sum + m.utilization.revenue, 0)
      };

      // Identify top and under performers
      const sortedByOverall = vehicleMetrics.sort((a, b) => {
        const scoreA = (a.efficiency.fuelConsumption + a.safety.safetyScore + a.utilization.utilizationRate) / 3;
        const scoreB = (b.efficiency.fuelConsumption + b.safety.safetyScore + b.utilization.utilizationRate) / 3;
        return scoreB - scoreA;
      });

      const topPerformers = sortedByOverall.slice(0, 3).map(m => m.vehicleId);
      const underPerformers = sortedByOverall.slice(-3).map(m => m.vehicleId);

      // Generate recommendations
      const recommendations = this.generateFleetRecommendations(vehicleMetrics);

      return {
        summary,
        topPerformers,
        underPerformers,
        recommendations
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  // Private helper methods

  private async loadPerformanceData(): Promise<void> {
    try {
      const stored = localStorage.getItem('vehicle_performance_data');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([vehicleId, metrics]) => {
          this.performanceData.set(vehicleId, metrics as PerformanceMetrics[]);
        });
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance every hour
    setInterval(async () => {
      await this.performPerformanceCheck();
    }, 60 * 60 * 1000);
  }

  private async performPerformanceCheck(): Promise<void> {
    // Check all vehicles for performance issues
    for (const vehicleId of this.performanceData.keys()) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      try {
        await this.calculatePerformanceMetrics(vehicleId, startDate, endDate);
      } catch (error) {
        console.error(`Error checking performance for vehicle ${vehicleId}:`, error);
      }
    }
  }

  private async checkPerformanceAlerts(vehicleId: string, metrics: PerformanceMetrics): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // Check efficiency alerts
    if (metrics.efficiency.fuelConsumption < this.benchmarks.efficiency.fuelConsumption * 0.8) {
      alerts.push({
        id: `alert_${Date.now()}_efficiency`,
        vehicleId,
        type: 'efficiency_drop',
        severity: 'medium',
        message: 'Fuel efficiency below expected levels',
        threshold: this.benchmarks.efficiency.fuelConsumption,
        currentValue: metrics.efficiency.fuelConsumption,
        detectedAt: new Date(),
        recommendations: [
          'Check tire pressure and alignment',
          'Schedule engine tune-up',
          'Review driving patterns'
        ]
      });
    }

    // Check safety alerts
    if (metrics.safety.safetyScore < this.benchmarks.safety.safetyScore) {
      alerts.push({
        id: `alert_${Date.now()}_safety`,
        vehicleId,
        type: 'safety_violation',
        severity: 'high',
        message: 'Safety score below acceptable threshold',
        threshold: this.benchmarks.safety.safetyScore,
        currentValue: metrics.safety.safetyScore,
        detectedAt: new Date(),
        recommendations: [
          'Provide additional driver training',
          'Review recent safety incidents',
          'Implement speed monitoring'
        ]
      });
    }

    // Check utilization alerts
    if (metrics.utilization.utilizationRate < this.benchmarks.utilization.utilizationRate) {
      alerts.push({
        id: `alert_${Date.now()}_utilization`,
        vehicleId,
        type: 'utilization_low',
        severity: 'medium',
        message: 'Vehicle utilization below target',
        threshold: this.benchmarks.utilization.utilizationRate,
        currentValue: metrics.utilization.utilizationRate,
        detectedAt: new Date(),
        recommendations: [
          'Reposition vehicle to high-demand area',
          'Adjust pricing strategy',
          'Review driver availability'
        ]
      });
    }

    // Add new alerts
    this.performanceAlerts.push(...alerts);
  }

  private async calculateFleetAverage(startDate: Date, endDate: Date): Promise<PerformanceMetrics> {
    // Calculate average metrics across all vehicles
    const allMetrics: PerformanceMetrics[] = [];
    
    for (const vehicleId of this.performanceData.keys()) {
      const metrics = await this.calculatePerformanceMetrics(vehicleId, startDate, endDate);
      allMetrics.push(metrics);
    }

    if (allMetrics.length === 0) {
      throw new Error('No performance data available');
    }

    // Calculate averages
    const fleetAverage: PerformanceMetrics = {
      vehicleId: 'fleet_average',
      period: { start: startDate, end: endDate },
      efficiency: {
        fuelConsumption: allMetrics.reduce((sum, m) => sum + m.efficiency.fuelConsumption, 0) / allMetrics.length,
        idleTime: allMetrics.reduce((sum, m) => sum + m.efficiency.idleTime, 0) / allMetrics.length,
        averageSpeed: allMetrics.reduce((sum, m) => sum + m.efficiency.averageSpeed, 0) / allMetrics.length,
        routeOptimization: allMetrics.reduce((sum, m) => sum + m.efficiency.routeOptimization, 0) / allMetrics.length
      },
      safety: {
        hardBraking: allMetrics.reduce((sum, m) => sum + m.safety.hardBraking, 0) / allMetrics.length,
        rapidAcceleration: allMetrics.reduce((sum, m) => sum + m.safety.rapidAcceleration, 0) / allMetrics.length,
        speeding: allMetrics.reduce((sum, m) => sum + m.safety.speeding, 0) / allMetrics.length,
        safetyScore: allMetrics.reduce((sum, m) => sum + m.safety.safetyScore, 0) / allMetrics.length
      },
      utilization: {
        activeTime: allMetrics.reduce((sum, m) => sum + m.utilization.activeTime, 0) / allMetrics.length,
        rideCount: allMetrics.reduce((sum, m) => sum + m.utilization.rideCount, 0) / allMetrics.length,
        revenue: allMetrics.reduce((sum, m) => sum + m.utilization.revenue, 0) / allMetrics.length,
        utilizationRate: allMetrics.reduce((sum, m) => sum + m.utilization.utilizationRate, 0) / allMetrics.length
      },
      maintenance: {
        breakdownCount: allMetrics.reduce((sum, m) => sum + m.maintenance.breakdownCount, 0) / allMetrics.length,
        maintenanceCost: allMetrics.reduce((sum, m) => sum + m.maintenance.maintenanceCost, 0) / allMetrics.length,
        downtimeHours: allMetrics.reduce((sum, m) => sum + m.maintenance.downtimeHours, 0) / allMetrics.length,
        reliabilityScore: allMetrics.reduce((sum, m) => sum + m.maintenance.reliabilityScore, 0) / allMetrics.length
      }
    };

    return fleetAverage;
  }

  private async calculateVehicleRanking(vehicleId: string, metrics: PerformanceMetrics): Promise<{
    efficiency: number;
    safety: number;
    utilization: number;
    overall: number;
  }> {
    // Mock ranking calculation
    return {
      efficiency: Math.floor(Math.random() * 100) + 1,
      safety: Math.floor(Math.random() * 100) + 1,
      utilization: Math.floor(Math.random() * 100) + 1,
      overall: Math.floor(Math.random() * 100) + 1
    };
  }

  private generateImprovementRecommendations(
    current: PerformanceMetrics,
    fleetAverage: PerformanceMetrics
  ): PerformanceImprovement[] {
    const improvements: PerformanceImprovement[] = [];

    // Efficiency improvements
    if (current.efficiency.fuelConsumption < fleetAverage.efficiency.fuelConsumption * 0.9) {
      improvements.push({
        category: 'efficiency',
        description: 'Improve fuel efficiency through regular maintenance and driver training',
        potentialSavings: 150,
        implementationCost: 50,
        priority: 'medium',
        timeframe: '2-4 weeks'
      });
    }

    // Safety improvements
    if (current.safety.safetyScore < fleetAverage.safety.safetyScore * 0.9) {
      improvements.push({
        category: 'safety',
        description: 'Implement advanced driver assistance systems and safety training',
        potentialSavings: 500,
        implementationCost: 200,
        priority: 'high',
        timeframe: '1-2 weeks'
      });
    }

    // Utilization improvements
    if (current.utilization.utilizationRate < fleetAverage.utilization.utilizationRate * 0.9) {
      improvements.push({
        category: 'utilization',
        description: 'Optimize vehicle positioning and scheduling',
        potentialSavings: 300,
        implementationCost: 25,
        priority: 'medium',
        timeframe: '1 week'
      });
    }

    return improvements;
  }

  private generateFleetRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];

    const avgEfficiency = metrics.reduce((sum, m) => sum + m.efficiency.fuelConsumption, 0) / metrics.length;
    const avgSafety = metrics.reduce((sum, m) => sum + m.safety.safetyScore, 0) / metrics.length;
    const avgUtilization = metrics.reduce((sum, m) => sum + m.utilization.utilizationRate, 0) / metrics.length;

    if (avgEfficiency < this.benchmarks.efficiency.fuelConsumption) {
      recommendations.push('Implement fleet-wide fuel efficiency program');
    }

    if (avgSafety < this.benchmarks.safety.safetyScore) {
      recommendations.push('Enhance driver safety training and monitoring');
    }

    if (avgUtilization < this.benchmarks.utilization.utilizationRate) {
      recommendations.push('Optimize fleet deployment and scheduling');
    }

    if (recommendations.length === 0) {
      recommendations.push('Fleet performance is meeting targets. Continue current practices.');
    }

    return recommendations;
  }
}

export const vehiclePerformanceService = new VehiclePerformanceService();