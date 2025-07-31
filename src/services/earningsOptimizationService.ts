/**
 * Earnings Optimization Service
 * Driver earnings tracking and optimization tools with AI-powered recommendations
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
export interface EarningsData {
  driverId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalEarnings: number;
  totalRides: number;
  totalHours: number;
  averagePerRide: number;
  averagePerHour: number;
  breakdown: EarningsBreakdown;
  goals: EarningsGoals;
  trends: EarningsTrend[];
}

export interface EarningsBreakdown {
  baseFares: number;
  tips: number;
  bonuses: number;
  surgeEarnings: number;
  incentives: number;
  tolls: number;
  cancellationFees: number;
  other: number;
}

export interface EarningsGoals {
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  currentProgress: number;
  projectedEarnings: number;
  daysToTarget: number;
}

export interface EarningsTrend {
  date: Date;
  earnings: number;
  rides: number;
  hours: number;
  averagePerRide: number;
  averagePerHour: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'time_optimization' | 'location_optimization' | 'strategy_optimization' | 'efficiency_optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  potentialIncrease: number; // Percentage increase
  estimatedAdditionalEarnings: number;
  timeframe: string;
  actionItems: string[];
  priority: number;
}

export interface HotSpot {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  demandLevel: 'very_high' | 'high' | 'medium' | 'low';
  averageWaitTime: number;
  averageFare: number;
  surgeMultiplier: number;
  peakHours: string[];
  category: 'airport' | 'business' | 'entertainment' | 'residential' | 'transport_hub';
  distance: number; // Distance from driver's current location
}

export interface PeakTimeAnalysis {
  timeSlot: string;
  dayOfWeek: string;
  demandLevel: number;
  averageFare: number;
  surgeFrequency: number;
  competitionLevel: number;
  recommendationScore: number;
}

export interface EarningsInsight {
  id: string;
  category: 'performance' | 'opportunity' | 'warning' | 'achievement';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  trend: 'improving' | 'declining' | 'stable';
  actionable: boolean;
  recommendations: string[];
}

export interface DriverPerformanceMetrics {
  driverId: string;
  period: { start: Date; end: Date };
  efficiency: {
    ridesPerHour: number;
    earningsPerHour: number;
    earningsPerMile: number;
    utilizationRate: number;
  };
  quality: {
    averageRating: number;
    acceptanceRate: number;
    completionRate: number;
    cancellationRate: number;
  };
  consistency: {
    dailyVariance: number;
    weeklyVariance: number;
    reliabilityScore: number;
  };
  growth: {
    earningsGrowth: number;
    rideGrowth: number;
    efficiencyGrowth: number;
  };
}

class EarningsOptimizationService {
  private readonly EARNINGS_COLLECTION = 'driver_earnings';
  private readonly RECOMMENDATIONS_COLLECTION = 'earnings_recommendations';
  private readonly HOTSPOTS_COLLECTION = 'earnings_hotspots';
  private readonly INSIGHTS_COLLECTION = 'earnings_insights';
  private readonly METRICS_COLLECTION = 'driver_performance_metrics';

  /**
   * Get comprehensive earnings data for a driver
   */
  async getEarningsData(
    driverId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly'
  ): Promise<EarningsData> {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);

      // Get rides data for the period
      const ridesQuery = query(
        collection(db, 'rides'),
        where('driverId', '==', driverId),
        where('completedAt', '>=', Timestamp.fromDate(startDate)),
        where('completedAt', '<=', Timestamp.fromDate(endDate)),
        where('status', '==', 'completed')
      );

      const ridesSnapshot = await getDocs(ridesQuery);
      const rides = ridesSnapshot.docs.map(doc => doc.data());

      // Calculate earnings breakdown
      const breakdown: EarningsBreakdown = {
        baseFares: rides.reduce((sum, ride) => sum + (ride.baseFare || 0), 0),
        tips: rides.reduce((sum, ride) => sum + (ride.tip || 0), 0),
        bonuses: rides.reduce((sum, ride) => sum + (ride.bonus || 0), 0),
        surgeEarnings: rides.reduce((sum, ride) => sum + (ride.surgeAmount || 0), 0),
        incentives: rides.reduce((sum, ride) => sum + (ride.incentive || 0), 0),
        tolls: rides.reduce((sum, ride) => sum + (ride.tolls || 0), 0),
        cancellationFees: rides.reduce((sum, ride) => sum + (ride.cancellationFee || 0), 0),
        other: 0
      };

      const totalEarnings = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);
      const totalRides = rides.length;
      const totalHours = this.calculateTotalHours(rides);

      // Get driver goals
      const goals = await this.getDriverGoals(driverId);

      // Generate trends
      const trends = await this.generateEarningsTrends(driverId, startDate, endDate);

      const earningsData: EarningsData = {
        driverId,
        period,
        startDate,
        endDate,
        totalEarnings,
        totalRides,
        totalHours,
        averagePerRide: totalRides > 0 ? totalEarnings / totalRides : 0,
        averagePerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
        breakdown,
        goals,
        trends
      };

      // Save earnings data
      await this.saveEarningsData(earningsData);

      return earningsData;
    } catch (error) {
      console.error('Error getting earnings data:', error);
      throw new Error('Failed to get earnings data');
    }
  }

  /**
   * Generate AI-powered optimization recommendations
   */
  async generateOptimizationRecommendations(driverId: string): Promise<OptimizationRecommendation[]> {
    try {
      const [earningsData, performanceMetrics, hotSpots, peakTimes] = await Promise.all([
        this.getEarningsData(driverId, 'weekly'),
        this.getDriverPerformanceMetrics(driverId),
        this.getHotSpots(driverId),
        this.analyzePeakTimes(driverId)
      ]);

      const recommendations: OptimizationRecommendation[] = [];

      // Time optimization recommendations
      if (performanceMetrics.efficiency.utilizationRate < 0.7) {
        recommendations.push({
          id: 'time_opt_1',
          type: 'time_optimization',
          title: 'Optimize Your Working Hours',
          description: 'Your utilization rate is below average. Focus on peak demand hours to maximize earnings.',
          impact: 'high',
          effort: 'low',
          potentialIncrease: 25,
          estimatedAdditionalEarnings: earningsData.totalEarnings * 0.25,
          timeframe: '1-2 weeks',
          actionItems: [
            'Drive during peak hours (7-9 AM, 5-7 PM)',
            'Avoid low-demand periods (2-4 PM)',
            'Use surge notifications to identify busy times'
          ],
          priority: 1
        });
      }

      // Location optimization recommendations
      const topHotSpot = hotSpots[0];
      if (topHotSpot && topHotSpot.distance > 5) {
        recommendations.push({
          id: 'location_opt_1',
          type: 'location_optimization',
          title: 'Position Near High-Demand Areas',
          description: `${topHotSpot.name} shows high demand with ${topHotSpot.averageFare.toFixed(2)} average fare.`,
          impact: 'medium',
          effort: 'low',
          potentialIncrease: 15,
          estimatedAdditionalEarnings: earningsData.totalEarnings * 0.15,
          timeframe: 'Immediate',
          actionItems: [
            `Drive to ${topHotSpot.name} during peak hours`,
            'Monitor surge pricing in this area',
            'Consider starting your shift from this location'
          ],
          priority: 2
        });
      }

      // Strategy optimization recommendations
      if (performanceMetrics.quality.acceptanceRate < 0.85) {
        recommendations.push({
          id: 'strategy_opt_1',
          type: 'strategy_optimization',
          title: 'Improve Acceptance Rate',
          description: 'Higher acceptance rates lead to more ride opportunities and better platform positioning.',
          impact: 'medium',
          effort: 'medium',
          potentialIncrease: 12,
          estimatedAdditionalEarnings: earningsData.totalEarnings * 0.12,
          timeframe: '2-4 weeks',
          actionItems: [
            'Accept rides within reasonable distance',
            'Avoid canceling accepted rides',
            'Use destination filters strategically'
          ],
          priority: 3
        });
      }

      // Efficiency optimization recommendations
      if (performanceMetrics.efficiency.ridesPerHour < 2) {
        recommendations.push({
          id: 'efficiency_opt_1',
          type: 'efficiency_optimization',
          title: 'Increase Ride Frequency',
          description: 'You\'re completing fewer rides per hour than average. Focus on shorter, more frequent trips.',
          impact: 'high',
          effort: 'medium',
          potentialIncrease: 20,
          estimatedAdditionalEarnings: earningsData.totalEarnings * 0.20,
          timeframe: '1-3 weeks',
          actionItems: [
            'Accept shorter rides during busy periods',
            'Position near business districts for quick trips',
            'Minimize downtime between rides'
          ],
          priority: 1
        });
      }

      // Sort by priority and potential impact
      recommendations.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.potentialIncrease - a.potentialIncrease;
      });

      // Save recommendations
      await this.saveRecommendations(driverId, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      throw new Error('Failed to generate optimization recommendations');
    }
  }

  /**
   * Get hot spots for earnings optimization
   */
  async getHotSpots(driverId: string, limit: number = 10): Promise<HotSpot[]> {
    try {
      // Get driver's current location (mock for demo)
      const driverLocation = { latitude: 40.7128, longitude: -74.0060 };

      // Mock hot spots data (in production, this would be calculated from real data)
      const hotSpots: HotSpot[] = [
        {
          id: 'hotspot_1',
          name: 'JFK Airport',
          location: {
            latitude: 40.6413,
            longitude: -73.7781,
            address: 'JFK Airport, Queens, NY'
          },
          demandLevel: 'very_high',
          averageWaitTime: 8,
          averageFare: 45.50,
          surgeMultiplier: 1.8,
          peakHours: ['06:00-09:00', '17:00-20:00', '22:00-01:00'],
          category: 'airport',
          distance: this.calculateDistance(driverLocation, { latitude: 40.6413, longitude: -73.7781 })
        },
        {
          id: 'hotspot_2',
          name: 'Times Square',
          location: {
            latitude: 40.7580,
            longitude: -73.9855,
            address: 'Times Square, Manhattan, NY'
          },
          demandLevel: 'high',
          averageWaitTime: 5,
          averageFare: 28.75,
          surgeMultiplier: 1.5,
          peakHours: ['18:00-23:00', '12:00-14:00'],
          category: 'entertainment',
          distance: this.calculateDistance(driverLocation, { latitude: 40.7580, longitude: -73.9855 })
        },
        {
          id: 'hotspot_3',
          name: 'Financial District',
          location: {
            latitude: 40.7074,
            longitude: -74.0113,
            address: 'Financial District, Manhattan, NY'
          },
          demandLevel: 'high',
          averageWaitTime: 3,
          averageFare: 22.25,
          surgeMultiplier: 1.3,
          peakHours: ['07:00-09:00', '17:00-19:00'],
          category: 'business',
          distance: this.calculateDistance(driverLocation, { latitude: 40.7074, longitude: -74.0113 })
        }
      ];

      // Sort by recommendation score (combination of demand, fare, and distance)
      hotSpots.forEach(spot => {
        const demandScore = spot.demandLevel === 'very_high' ? 4 : spot.demandLevel === 'high' ? 3 : 2;
        const fareScore = spot.averageFare / 50; // Normalize to 0-1 scale
        const distanceScore = Math.max(0, 1 - spot.distance / 20); // Closer is better
        spot.distance = demandScore * 0.4 + fareScore * 0.4 + distanceScore * 0.2; // Reuse distance field for score
      });

      return hotSpots.sort((a, b) => b.distance - a.distance).slice(0, limit);
    } catch (error) {
      console.error('Error getting hot spots:', error);
      throw new Error('Failed to get hot spots');
    }
  }

  /**
   * Analyze peak times for earnings optimization
   */
  async analyzePeakTimes(driverId: string): Promise<PeakTimeAnalysis[]> {
    try {
      // Mock peak time analysis (in production, this would analyze historical data)
      const peakTimes: PeakTimeAnalysis[] = [
        {
          timeSlot: '07:00-09:00',
          dayOfWeek: 'Monday-Friday',
          demandLevel: 0.9,
          averageFare: 32.50,
          surgeFrequency: 0.7,
          competitionLevel: 0.8,
          recommendationScore: 0.85
        },
        {
          timeSlot: '17:00-19:00',
          dayOfWeek: 'Monday-Friday',
          demandLevel: 0.95,
          averageFare: 28.75,
          surgeFrequency: 0.8,
          competitionLevel: 0.9,
          recommendationScore: 0.82
        },
        {
          timeSlot: '22:00-02:00',
          dayOfWeek: 'Friday-Saturday',
          demandLevel: 0.8,
          averageFare: 35.25,
          surgeFrequency: 0.6,
          competitionLevel: 0.6,
          recommendationScore: 0.78
        }
      ];

      return peakTimes.sort((a, b) => b.recommendationScore - a.recommendationScore);
    } catch (error) {
      console.error('Error analyzing peak times:', error);
      throw new Error('Failed to analyze peak times');
    }
  }

  /**
   * Generate earnings insights
   */
  async generateEarningsInsights(driverId: string): Promise<EarningsInsight[]> {
    try {
      const [currentWeek, previousWeek, performanceMetrics] = await Promise.all([
        this.getEarningsData(driverId, 'weekly'),
        this.getEarningsData(driverId, 'weekly'), // Would get previous week in production
        this.getDriverPerformanceMetrics(driverId)
      ]);

      const insights: EarningsInsight[] = [];

      // Performance insights
      if (performanceMetrics.efficiency.earningsPerHour > 25) {
        insights.push({
          id: 'insight_1',
          category: 'achievement',
          title: 'Above Average Earnings',
          description: `You're earning $${performanceMetrics.efficiency.earningsPerHour.toFixed(2)}/hour, which is above the city average of $22/hour.`,
          metric: 'earnings_per_hour',
          currentValue: performanceMetrics.efficiency.earningsPerHour,
          benchmarkValue: 22,
          trend: 'improving',
          actionable: false,
          recommendations: ['Keep up the great work!', 'Share your strategies with other drivers']
        });
      }

      // Opportunity insights
      if (performanceMetrics.efficiency.utilizationRate < 0.7) {
        insights.push({
          id: 'insight_2',
          category: 'opportunity',
          title: 'Utilization Opportunity',
          description: 'You have room to increase your active driving time during peak hours.',
          metric: 'utilization_rate',
          currentValue: performanceMetrics.efficiency.utilizationRate,
          benchmarkValue: 0.75,
          trend: 'stable',
          actionable: true,
          recommendations: [
            'Drive during morning and evening rush hours',
            'Use surge notifications to identify busy periods',
            'Position yourself in high-demand areas'
          ]
        });
      }

      // Warning insights
      if (performanceMetrics.quality.acceptanceRate < 0.8) {
        insights.push({
          id: 'insight_3',
          category: 'warning',
          title: 'Low Acceptance Rate',
          description: 'Your acceptance rate may affect your access to ride requests.',
          metric: 'acceptance_rate',
          currentValue: performanceMetrics.quality.acceptanceRate,
          benchmarkValue: 0.85,
          trend: 'declining',
          actionable: true,
          recommendations: [
            'Accept rides within reasonable distance',
            'Avoid canceling after acceptance',
            'Use destination filters strategically'
          ]
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating earnings insights:', error);
      throw new Error('Failed to generate earnings insights');
    }
  }

  // Private helper methods

  private getPeriodDates(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  private calculateTotalHours(rides: any[]): number {
    // Calculate total active hours from ride data
    return rides.reduce((total, ride) => {
      const duration = ride.duration || 0; // Duration in minutes
      return total + (duration / 60); // Convert to hours
    }, 0);
  }

  private async getDriverGoals(driverId: string): Promise<EarningsGoals> {
    try {
      const goalsDoc = await getDoc(doc(db, 'driver_goals', driverId));
      
      if (goalsDoc.exists()) {
        return goalsDoc.data() as EarningsGoals;
      }

      // Return default goals
      return {
        dailyTarget: 200,
        weeklyTarget: 1200,
        monthlyTarget: 5000,
        currentProgress: 0,
        projectedEarnings: 0,
        daysToTarget: 0
      };
    } catch (error) {
      console.error('Error getting driver goals:', error);
      throw new Error('Failed to get driver goals');
    }
  }

  private async generateEarningsTrends(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EarningsTrend[]> {
    try {
      const trends: EarningsTrend[] = [];
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        // Mock trend data (in production, calculate from actual rides)
        trends.push({
          date,
          earnings: Math.random() * 300 + 100,
          rides: Math.floor(Math.random() * 15) + 5,
          hours: Math.random() * 8 + 4,
          averagePerRide: Math.random() * 10 + 20,
          averagePerHour: Math.random() * 10 + 20
        });
      }

      return trends;
    } catch (error) {
      console.error('Error generating earnings trends:', error);
      return [];
    }
  }

  private async getDriverPerformanceMetrics(driverId: string): Promise<DriverPerformanceMetrics> {
    try {
      const metricsDoc = await getDoc(doc(db, this.METRICS_COLLECTION, driverId));
      
      if (metricsDoc.exists()) {
        return metricsDoc.data() as DriverPerformanceMetrics;
      }

      // Return mock metrics
      return {
        driverId,
        period: { start: new Date(), end: new Date() },
        efficiency: {
          ridesPerHour: 2.5,
          earningsPerHour: 28.50,
          earningsPerMile: 1.85,
          utilizationRate: 0.72
        },
        quality: {
          averageRating: 4.8,
          acceptanceRate: 0.92,
          completionRate: 0.98,
          cancellationRate: 0.02
        },
        consistency: {
          dailyVariance: 0.15,
          weeklyVariance: 0.22,
          reliabilityScore: 0.88
        },
        growth: {
          earningsGrowth: 0.08,
          rideGrowth: 0.12,
          efficiencyGrowth: 0.05
        }
      };
    } catch (error) {
      console.error('Error getting driver performance metrics:', error);
      throw new Error('Failed to get driver performance metrics');
    }
  }

  private calculateDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
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

  private async saveEarningsData(earningsData: EarningsData): Promise<void> {
    const docId = `${earningsData.driverId}_${earningsData.period}_${earningsData.startDate.getTime()}`;
    await setDoc(doc(db, this.EARNINGS_COLLECTION, docId), {
      ...earningsData,
      startDate: Timestamp.fromDate(earningsData.startDate),
      endDate: Timestamp.fromDate(earningsData.endDate),
      trends: earningsData.trends.map(trend => ({
        ...trend,
        date: Timestamp.fromDate(trend.date)
      }))
    });
  }

  private async saveRecommendations(driverId: string, recommendations: OptimizationRecommendation[]): Promise<void> {
    const docId = `${driverId}_${Date.now()}`;
    await setDoc(doc(db, this.RECOMMENDATIONS_COLLECTION, docId), {
      driverId,
      recommendations,
      generatedAt: Timestamp.fromDate(new Date())
    });
  }
}

export const earningsOptimizationService = new EarningsOptimizationService();
export default earningsOptimizationService;