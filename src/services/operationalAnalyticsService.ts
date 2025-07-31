/**
 * Operational Analytics Service
 * Comprehensive analytics and reporting system for operational intelligence,
 * performance metrics, cost analysis, and competitive insights
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
  startAfter,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types and Interfaces
export interface OperationalMetrics {
  timestamp: Date;
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  averageRideTime: number;
  averageWaitTime: number;
  averagePickupTime: number;
  totalRevenue: number;
  totalDriverEarnings: number;
  platformCommission: number;
  activeDrivers: number;
  totalDrivers: number;
  driverUtilization: number;
  passengerSatisfaction: number;
  driverSatisfaction: number;
  peakHourMultiplier: number;
  geographicCoverage: number;
}

export interface KPIMetrics {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  category: 'financial' | 'operational' | 'customer' | 'driver' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  lastUpdated: Date;
  historicalData: { date: Date; value: number }[];
}

export interface CostAnalysis {
  period: { start: Date; end: Date };
  totalCosts: number;
  costBreakdown: {
    driverPayments: number;
    platformOperations: number;
    technology: number;
    marketing: number;
    customerSupport: number;
    insurance: number;
    maintenance: number;
    other: number;
  };
  costPerRide: number;
  costPerDriver: number;
  costPerActiveUser: number;
  profitMargin: number;
  trends: CostTrend[];
}

export interface CostTrend {
  category: string;
  currentPeriod: number;
  previousPeriod: number;
  changePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ProfitabilityReport {
  period: { start: Date; end: Date };
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenueStreams: {
    rideCommissions: number;
    subscriptionFees: number;
    advertisingRevenue: number;
    partnershipRevenue: number;
    other: number;
  };
  profitabilityBySegment: {
    segment: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
  }[];
  projections: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
}

export interface CompetitiveAnalysis {
  lastUpdated: Date;
  marketPosition: {
    marketShare: number;
    ranking: number;
    totalMarketSize: number;
  };
  competitors: CompetitorData[];
  benchmarks: {
    averageWaitTime: number;
    averageFare: number;
    driverEarnings: number;
    customerSatisfaction: number;
    marketGrowthRate: number;
  };
  opportunities: MarketOpportunity[];
  threats: MarketThreat[];
}

export interface CompetitorData {
  name: string;
  marketShare: number;
  averageFare: number;
  averageWaitTime: number;
  driverCount: number;
  customerRating: number;
  strengths: string[];
  weaknesses: string[];
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeframe: string;
  potentialRevenue: number;
}

export interface MarketThreat {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  probability: 'high' | 'medium' | 'low';
  impact: number;
  mitigationStrategy: string;
}

export interface PerformanceDashboard {
  overview: {
    totalRides: number;
    totalRevenue: number;
    activeDrivers: number;
    customerSatisfaction: number;
  };
  trends: {
    ridesGrowth: number;
    revenueGrowth: number;
    driverGrowth: number;
    satisfactionTrend: number;
  };
  alerts: PerformanceAlert[];
  topMetrics: KPIMetrics[];
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'operational' | 'financial' | 'performance' | 'competitive';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  metrics: string[];
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  isActive: boolean;
  lastGenerated?: Date;
  nextScheduled?: Date;
}

class OperationalAnalyticsService {
  private readonly METRICS_COLLECTION = 'operational_metrics';
  private readonly KPI_COLLECTION = 'kpi_metrics';
  private readonly REPORTS_COLLECTION = 'analytics_reports';
  private readonly ALERTS_COLLECTION = 'performance_alerts';
  private readonly COMPETITIVE_COLLECTION = 'competitive_analysis';

  // KPI Definitions
  private readonly KPI_DEFINITIONS = [
    {
      id: 'ride_completion_rate',
      name: 'Ride Completion Rate',
      target: 95,
      unit: '%',
      category: 'operational' as const,
      priority: 'high' as const
    },
    {
      id: 'average_wait_time',
      name: 'Average Wait Time',
      target: 5,
      unit: 'minutes',
      category: 'customer' as const,
      priority: 'high' as const
    },
    {
      id: 'driver_utilization',
      name: 'Driver Utilization Rate',
      target: 75,
      unit: '%',
      category: 'efficiency' as const,
      priority: 'high' as const
    },
    {
      id: 'revenue_per_ride',
      name: 'Revenue per Ride',
      target: 25,
      unit: '$',
      category: 'financial' as const,
      priority: 'medium' as const
    },
    {
      id: 'customer_satisfaction',
      name: 'Customer Satisfaction',
      target: 4.5,
      unit: '/5',
      category: 'customer' as const,
      priority: 'high' as const
    },
    {
      id: 'driver_satisfaction',
      name: 'Driver Satisfaction',
      target: 4.2,
      unit: '/5',
      category: 'driver' as const,
      priority: 'medium' as const
    }
  ];

  /**
   * Get current operational metrics
   */
  async getCurrentOperationalMetrics(): Promise<OperationalMetrics> {
    try {
      // Get latest metrics from the last 24 hours
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const ridesQuery = query(
        collection(db, 'rides'),
        where('createdAt', '>=', Timestamp.fromDate(yesterday)),
        where('createdAt', '<=', Timestamp.fromDate(now))
      );

      const ridesSnapshot = await getDocs(ridesQuery);
      const rides = ridesSnapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const totalRides = rides.length;
      const completedRides = rides.filter(r => r.status === 'completed').length;
      const cancelledRides = rides.filter(r => r.status === 'cancelled').length;

      const completedRideData = rides.filter(r => r.status === 'completed');
      const averageRideTime = completedRideData.length > 0
        ? completedRideData.reduce((sum, r) => sum + (r.duration || 0), 0) / completedRideData.length
        : 0;

      const averageWaitTime = completedRideData.length > 0
        ? completedRideData.reduce((sum, r) => sum + (r.waitTime || 0), 0) / completedRideData.length
        : 0;

      const totalRevenue = completedRideData.reduce((sum, r) => sum + (r.fare || 0), 0);
      const platformCommission = totalRevenue * 0.2; // 20% commission
      const totalDriverEarnings = totalRevenue - platformCommission;

      // Get driver metrics
      const driversSnapshot = await getDocs(collection(db, 'drivers'));
      const totalDrivers = driversSnapshot.size;
      const activeDrivers = driversSnapshot.docs.filter(doc => 
        doc.data().status === 'active' || doc.data().status === 'busy'
      ).length;

      const driverUtilization = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;

      return {
        timestamp: now,
        totalRides,
        completedRides,
        cancelledRides,
        averageRideTime,
        averageWaitTime,
        averagePickupTime: averageWaitTime * 0.8, // Estimate
        totalRevenue,
        totalDriverEarnings,
        platformCommission,
        activeDrivers,
        totalDrivers,
        driverUtilization,
        passengerSatisfaction: 4.3, // Mock data
        driverSatisfaction: 4.1, // Mock data
        peakHourMultiplier: 1.2, // Mock data
        geographicCoverage: 85 // Mock data
      };
    } catch (error) {
      console.error('Error getting operational metrics:', error);
      throw new Error('Failed to get operational metrics');
    }
  }

  /**
   * Get KPI metrics with trends
   */
  async getKPIMetrics(): Promise<KPIMetrics[]> {
    try {
      const currentMetrics = await this.getCurrentOperationalMetrics();
      const kpiMetrics: KPIMetrics[] = [];

      for (const kpiDef of this.KPI_DEFINITIONS) {
        let currentValue = 0;
        
        // Map operational metrics to KPI values
        switch (kpiDef.id) {
          case 'ride_completion_rate':
            currentValue = currentMetrics.totalRides > 0 
              ? (currentMetrics.completedRides / currentMetrics.totalRides) * 100 
              : 0;
            break;
          case 'average_wait_time':
            currentValue = currentMetrics.averageWaitTime;
            break;
          case 'driver_utilization':
            currentValue = currentMetrics.driverUtilization;
            break;
          case 'revenue_per_ride':
            currentValue = currentMetrics.totalRides > 0 
              ? currentMetrics.totalRevenue / currentMetrics.totalRides 
              : 0;
            break;
          case 'customer_satisfaction':
            currentValue = currentMetrics.passengerSatisfaction;
            break;
          case 'driver_satisfaction':
            currentValue = currentMetrics.driverSatisfaction;
            break;
        }

        // Calculate trend (mock data for demo)
        const previousValue = currentValue * (0.9 + Math.random() * 0.2); // ±10% variation
        const changePercent = previousValue > 0 
          ? ((currentValue - previousValue) / previousValue) * 100 
          : 0;

        const trend = Math.abs(changePercent) < 2 ? 'stable' : 
                     changePercent > 0 ? 'up' : 'down';

        // Generate historical data (mock)
        const historicalData = this.generateHistoricalData(currentValue, 30);

        kpiMetrics.push({
          id: kpiDef.id,
          name: kpiDef.name,
          value: currentValue,
          target: kpiDef.target,
          unit: kpiDef.unit,
          trend,
          changePercent,
          category: kpiDef.category,
          priority: kpiDef.priority,
          lastUpdated: new Date(),
          historicalData
        });
      }

      return kpiMetrics;
    } catch (error) {
      console.error('Error getting KPI metrics:', error);
      throw new Error('Failed to get KPI metrics');
    }
  }

  /**
   * Generate cost analysis report
   */
  async generateCostAnalysis(period: { start: Date; end: Date }): Promise<CostAnalysis> {
    try {
      const metrics = await this.getCurrentOperationalMetrics();
      
      // Calculate costs (mock data based on realistic estimates)
      const driverPayments = metrics.totalDriverEarnings;
      const platformOperations = metrics.totalRevenue * 0.15; // 15% of revenue
      const technology = 50000; // Fixed monthly cost
      const marketing = metrics.totalRevenue * 0.08; // 8% of revenue
      const customerSupport = 25000; // Fixed monthly cost
      const insurance = metrics.totalRevenue * 0.03; // 3% of revenue
      const maintenance = 15000; // Fixed monthly cost
      const other = 10000; // Fixed monthly cost

      const totalCosts = driverPayments + platformOperations + technology + 
                        marketing + customerSupport + insurance + maintenance + other;

      const costBreakdown = {
        driverPayments,
        platformOperations,
        technology,
        marketing,
        customerSupport,
        insurance,
        maintenance,
        other
      };

      const costPerRide = metrics.totalRides > 0 ? totalCosts / metrics.totalRides : 0;
      const costPerDriver = metrics.totalDrivers > 0 ? totalCosts / metrics.totalDrivers : 0;
      const costPerActiveUser = metrics.totalRides > 0 ? totalCosts / metrics.totalRides : 0; // Simplified

      const profitMargin = metrics.totalRevenue > 0 
        ? ((metrics.totalRevenue - totalCosts) / metrics.totalRevenue) * 100 
        : 0;

      // Generate cost trends (mock data)
      const trends: CostTrend[] = Object.keys(costBreakdown).map(category => {
        const currentValue = costBreakdown[category as keyof typeof costBreakdown];
        const previousValue = currentValue * (0.85 + Math.random() * 0.3); // ±15% variation
        const changePercent = previousValue > 0 
          ? ((currentValue - previousValue) / previousValue) * 100 
          : 0;

        return {
          category,
          currentPeriod: currentValue,
          previousPeriod: previousValue,
          changePercent,
          trend: Math.abs(changePercent) < 5 ? 'stable' : 
                changePercent > 0 ? 'increasing' : 'decreasing'
        };
      });

      return {
        period,
        totalCosts,
        costBreakdown,
        costPerRide,
        costPerDriver,
        costPerActiveUser,
        profitMargin,
        trends
      };
    } catch (error) {
      console.error('Error generating cost analysis:', error);
      throw new Error('Failed to generate cost analysis');
    }
  }

  /**
   * Generate profitability report
   */
  async generateProfitabilityReport(period: { start: Date; end: Date }): Promise<ProfitabilityReport> {
    try {
      const metrics = await this.getCurrentOperationalMetrics();
      const costAnalysis = await this.generateCostAnalysis(period);

      const totalRevenue = metrics.totalRevenue;
      const totalCosts = costAnalysis.totalCosts;
      const grossProfit = totalRevenue - totalCosts;
      const netProfit = grossProfit * 0.85; // After taxes and other deductions
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Revenue streams breakdown
      const revenueStreams = {
        rideCommissions: totalRevenue * 0.85, // 85% from ride commissions
        subscriptionFees: totalRevenue * 0.08, // 8% from subscriptions
        advertisingRevenue: totalRevenue * 0.04, // 4% from advertising
        partnershipRevenue: totalRevenue * 0.02, // 2% from partnerships
        other: totalRevenue * 0.01 // 1% from other sources
      };

      // Profitability by segment (mock data)
      const profitabilityBySegment = [
        {
          segment: 'Standard Rides',
          revenue: totalRevenue * 0.6,
          costs: totalCosts * 0.55,
          profit: (totalRevenue * 0.6) - (totalCosts * 0.55),
          margin: 0
        },
        {
          segment: 'Premium Rides',
          revenue: totalRevenue * 0.25,
          costs: totalCosts * 0.2,
          profit: (totalRevenue * 0.25) - (totalCosts * 0.2),
          margin: 0
        },
        {
          segment: 'Shared Rides',
          revenue: totalRevenue * 0.15,
          costs: totalCosts * 0.25,
          profit: (totalRevenue * 0.15) - (totalCosts * 0.25),
          margin: 0
        }
      ];

      // Calculate margins for each segment
      profitabilityBySegment.forEach(segment => {
        segment.margin = segment.revenue > 0 ? (segment.profit / segment.revenue) * 100 : 0;
      });

      // Projections (mock data based on current trends)
      const projections = {
        nextMonth: netProfit * 1.05, // 5% growth
        nextQuarter: netProfit * 3.2, // Quarterly projection
        nextYear: netProfit * 13.5 // Annual projection with growth
      };

      return {
        period,
        totalRevenue,
        totalCosts,
        grossProfit,
        netProfit,
        profitMargin,
        revenueStreams,
        profitabilityBySegment,
        projections
      };
    } catch (error) {
      console.error('Error generating profitability report:', error);
      throw new Error('Failed to generate profitability report');
    }
  }

  /**
   * Get competitive analysis
   */
  async getCompetitiveAnalysis(): Promise<CompetitiveAnalysis> {
    try {
      // Mock competitive data (in real implementation, this would come from market research APIs)
      const competitors: CompetitorData[] = [
        {
          name: 'RideShare Pro',
          marketShare: 35,
          averageFare: 28.50,
          averageWaitTime: 4.2,
          driverCount: 15000,
          customerRating: 4.4,
          strengths: ['Large driver network', 'Fast pickup times', 'Premium service'],
          weaknesses: ['Higher prices', 'Limited coverage in suburbs']
        },
        {
          name: 'QuickCab',
          marketShare: 25,
          averageFare: 22.75,
          averageWaitTime: 6.1,
          driverCount: 8500,
          customerRating: 4.1,
          strengths: ['Competitive pricing', 'Good app interface'],
          weaknesses: ['Longer wait times', 'Inconsistent service quality']
        },
        {
          name: 'CityRide',
          marketShare: 20,
          averageFare: 24.25,
          averageWaitTime: 5.8,
          driverCount: 7200,
          customerRating: 4.0,
          strengths: ['Local market knowledge', 'Flexible payment options'],
          weaknesses: ['Limited technology features', 'Smaller fleet']
        }
      ];

      const marketPosition = {
        marketShare: 20, // GoCars market share
        ranking: 3,
        totalMarketSize: 2500000000 // $2.5B market
      };

      const benchmarks = {
        averageWaitTime: 5.4, // Industry average
        averageFare: 25.17, // Industry average
        driverEarnings: 18.50, // Industry average per hour
        customerSatisfaction: 4.2, // Industry average
        marketGrowthRate: 12.5 // Annual growth rate %
      };

      const opportunities: MarketOpportunity[] = [
        {
          id: 'suburban_expansion',
          title: 'Suburban Market Expansion',
          description: 'Expand service to underserved suburban areas with limited competition',
          impact: 'high',
          effort: 'medium',
          timeframe: '6-12 months',
          potentialRevenue: 5000000
        },
        {
          id: 'corporate_partnerships',
          title: 'Corporate Partnership Program',
          description: 'Develop B2B partnerships with corporations for employee transportation',
          impact: 'medium',
          effort: 'low',
          timeframe: '3-6 months',
          potentialRevenue: 2500000
        },
        {
          id: 'premium_service',
          title: 'Premium Service Tier',
          description: 'Launch luxury vehicle tier to compete with high-end services',
          impact: 'medium',
          effort: 'high',
          timeframe: '9-15 months',
          potentialRevenue: 3500000
        }
      ];

      const threats: MarketThreat[] = [
        {
          id: 'new_competitor',
          title: 'New Market Entrant',
          description: 'Well-funded startup entering market with aggressive pricing',
          severity: 'high',
          probability: 'medium',
          impact: -1500000,
          mitigationStrategy: 'Strengthen customer loyalty programs and improve service quality'
        },
        {
          id: 'regulation_changes',
          title: 'Regulatory Changes',
          description: 'Potential new regulations affecting ride-sharing operations',
          severity: 'medium',
          probability: 'high',
          impact: -800000,
          mitigationStrategy: 'Engage with regulators and ensure compliance readiness'
        }
      ];

      return {
        lastUpdated: new Date(),
        marketPosition,
        competitors,
        benchmarks,
        opportunities,
        threats
      };
    } catch (error) {
      console.error('Error getting competitive analysis:', error);
      throw new Error('Failed to get competitive analysis');
    }
  }

  /**
   * Get performance dashboard data
   */
  async getPerformanceDashboard(): Promise<PerformanceDashboard> {
    try {
      const [metrics, kpiMetrics] = await Promise.all([
        this.getCurrentOperationalMetrics(),
        this.getKPIMetrics()
      ]);

      const overview = {
        totalRides: metrics.totalRides,
        totalRevenue: metrics.totalRevenue,
        activeDrivers: metrics.activeDrivers,
        customerSatisfaction: metrics.passengerSatisfaction
      };

      // Calculate trends (mock data)
      const trends = {
        ridesGrowth: 8.5, // 8.5% growth
        revenueGrowth: 12.3, // 12.3% growth
        driverGrowth: 5.2, // 5.2% growth
        satisfactionTrend: 2.1 // 2.1% improvement
      };

      // Generate performance alerts
      const alerts: PerformanceAlert[] = [];
      
      for (const kpi of kpiMetrics) {
        if (kpi.priority === 'high') {
          const performanceRatio = kpi.value / kpi.target;
          
          if (performanceRatio < 0.9) { // Below 90% of target
            alerts.push({
              id: `alert_${kpi.id}_${Date.now()}`,
              type: 'critical',
              title: `${kpi.name} Below Target`,
              description: `Current value ${kpi.value}${kpi.unit} is ${((1 - performanceRatio) * 100).toFixed(1)}% below target of ${kpi.target}${kpi.unit}`,
              metric: kpi.id,
              currentValue: kpi.value,
              threshold: kpi.target,
              timestamp: new Date(),
              acknowledged: false
            });
          } else if (performanceRatio < 0.95) { // Below 95% of target
            alerts.push({
              id: `alert_${kpi.id}_${Date.now()}`,
              type: 'warning',
              title: `${kpi.name} Near Target Threshold`,
              description: `Current value ${kpi.value}${kpi.unit} is approaching target threshold of ${kpi.target}${kpi.unit}`,
              metric: kpi.id,
              currentValue: kpi.value,
              threshold: kpi.target,
              timestamp: new Date(),
              acknowledged: false
            });
          }
        }
      }

      // Get top performing metrics
      const topMetrics = kpiMetrics
        .filter(kpi => kpi.value / kpi.target >= 1.0) // Meeting or exceeding target
        .sort((a, b) => (b.value / b.target) - (a.value / a.target))
        .slice(0, 3);

      return {
        overview,
        trends,
        alerts,
        topMetrics
      };
    } catch (error) {
      console.error('Error getting performance dashboard:', error);
      throw new Error('Failed to get performance dashboard');
    }
  }

  /**
   * Generate automated report
   */
  async generateAutomatedReport(config: ReportConfig): Promise<string> {
    try {
      let reportData: any = {};

      switch (config.type) {
        case 'operational':
          reportData = await this.getCurrentOperationalMetrics();
          break;
        case 'financial':
          reportData = await this.generateProfitabilityReport({
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
          });
          break;
        case 'performance':
          reportData = await this.getPerformanceDashboard();
          break;
        case 'competitive':
          reportData = await this.getCompetitiveAnalysis();
          break;
      }

      // Generate report ID
      const reportId = `${config.type}_${Date.now()}`;

      // Save report
      await setDoc(doc(db, this.REPORTS_COLLECTION, reportId), {
        configId: config.id,
        type: config.type,
        data: reportData,
        generatedAt: Timestamp.fromDate(new Date()),
        format: config.format
      });

      // Update config with last generated timestamp
      await updateDoc(doc(db, 'report_configs', config.id), {
        lastGenerated: Timestamp.fromDate(new Date()),
        nextScheduled: this.calculateNextScheduledTime(config.frequency)
      });

      return reportId;
    } catch (error) {
      console.error('Error generating automated report:', error);
      throw new Error('Failed to generate automated report');
    }
  }

  /**
   * Get historical metrics for trend analysis
   */
  async getHistoricalMetrics(
    metricType: string,
    period: { start: Date; end: Date }
  ): Promise<{ date: Date; value: number }[]> {
    try {
      const metricsQuery = query(
        collection(db, this.METRICS_COLLECTION),
        where('type', '==', metricType),
        where('timestamp', '>=', Timestamp.fromDate(period.start)),
        where('timestamp', '<=', Timestamp.fromDate(period.end)),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(metricsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.timestamp.toDate(),
          value: data.value
        };
      });
    } catch (error) {
      console.error('Error getting historical metrics:', error);
      return [];
    }
  }

  // Helper Methods

  private generateHistoricalData(currentValue: number, days: number): { date: Date; value: number }[] {
    const data = [];
    const baseValue = currentValue;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic variation (±20% of base value)
      const variation = (Math.random() - 0.5) * 0.4;
      const value = baseValue * (1 + variation);
      
      data.push({ date, value: Math.max(0, value) });
    }
    
    return data;
  }

  private calculateNextScheduledTime(frequency: string): Timestamp {
    const now = new Date();
    let nextTime = new Date(now);

    switch (frequency) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + 1);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + 7);
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + 1);
        break;
      case 'quarterly':
        nextTime.setMonth(nextTime.getMonth() + 3);
        break;
    }

    return Timestamp.fromDate(nextTime);
  }

  /**
   * Save operational metrics to database
   */
  async saveOperationalMetrics(metrics: OperationalMetrics): Promise<void> {
    try {
      const docId = `metrics_${metrics.timestamp.getTime()}`;
      await setDoc(doc(db, this.METRICS_COLLECTION, docId), {
        ...metrics,
        timestamp: Timestamp.fromDate(metrics.timestamp)
      });
    } catch (error) {
      console.error('Error saving operational metrics:', error);
      throw new Error('Failed to save operational metrics');
    }
  }

  /**
   * Acknowledge performance alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.ALERTS_COLLECTION, alertId), {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error('Failed to acknowledge alert');
    }
  }
}

export const operationalAnalyticsService = new OperationalAnalyticsService();
export default operationalAnalyticsService;