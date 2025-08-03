/**
 * Business Intelligence Service
 * Comprehensive analytics and reporting platform for GoCars business intelligence
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  endBefore,
  Timestamp,
  aggregateQuery,
  sum,
  average,
  count
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Core BI Types
export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  unit: string;
  category: 'financial' | 'operational' | 'customer' | 'driver';
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  lastUpdated: Timestamp;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  category?: string;
}

export interface RevenueMetrics {
  totalRevenue: number;
  rideRevenue: number;
  subscriptionRevenue: number;
  advertisingRevenue: number;
  partnershipRevenue: number;
  otherRevenue: number;
  revenueGrowth: number;
  averageRevenuePerRide: number;
  averageRevenuePerUser: number;
}

export interface OperationalMetrics {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  completionRate: number;
  averageWaitTime: number;
  averageRideTime: number;
  averageRideDistance: number;
  peakHourUtilization: number;
  driverUtilization: number;
  vehicleUtilization: number;
}

export interface CustomerMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  userRetentionRate: number;
  averageSessionDuration: number;
  customerSatisfactionScore: number;
  netPromoterScore: number;
  churnRate: number;
  lifetimeValue: number;
}

export interface DriverMetrics {
  totalDrivers: number;
  activeDrivers: number;
  newDrivers: number;
  driverRetentionRate: number;
  averageDriverRating: number;
  averageDriverEarnings: number;
  driverSatisfactionScore: number;
  driverUtilizationRate: number;
  averageOnlineHours: number;
  driverChurnRate: number;
}

export interface GeographicData {
  region: string;
  city: string;
  coordinates: { lat: number; lng: number };
  totalRides: number;
  revenue: number;
  activeUsers: number;
  activeDrivers: number;
  averageWaitTime: number;
  marketShare: number;
}

export interface TimeSeriesData {
  period: string;
  timestamp: Date;
  metrics: {
    revenue: number;
    rides: number;
    users: number;
    drivers: number;
    satisfaction: number;
  };
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'table' | 'chart' | 'export';
  metrics: string[];
  filters: ReportFilter[];
  dateRange: DateRange;
  schedule?: ReportSchedule;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients: string[];
  createdBy: string;
  createdAt: Timestamp;
  lastGenerated?: Timestamp;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
  value: any;
  label: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
  enabled: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';
}

export interface DrillDownData {
  level: number;
  dimension: string;
  value: string;
  metrics: { [key: string]: number };
  children?: DrillDownData[];
}

class BusinessIntelligenceService {
  // KPI Management
  async getKPIMetrics(category?: string, period: string = 'day'): Promise<KPIMetric[]> {
    try {
      // In a real implementation, this would fetch from aggregated data tables
      const mockKPIs: KPIMetric[] = [
        {
          id: 'total_revenue',
          name: 'Total Revenue',
          value: 125000,
          previousValue: 118000,
          change: 7000,
          changePercent: 5.93,
          trend: 'up',
          target: 130000,
          unit: 'USD',
          category: 'financial',
          period: period as any,
          lastUpdated: Timestamp.now()
        },
        {
          id: 'total_rides',
          name: 'Total Rides',
          value: 8500,
          previousValue: 8200,
          change: 300,
          changePercent: 3.66,
          trend: 'up',
          target: 9000,
          unit: 'count',
          category: 'operational',
          period: period as any,
          lastUpdated: Timestamp.now()
        },
        {
          id: 'active_users',
          name: 'Active Users',
          value: 15200,
          previousValue: 14800,
          change: 400,
          changePercent: 2.70,
          trend: 'up',
          target: 16000,
          unit: 'count',
          category: 'customer',
          period: period as any,
          lastUpdated: Timestamp.now()
        },
        {
          id: 'active_drivers',
          name: 'Active Drivers',
          value: 2100,
          previousValue: 2050,
          change: 50,
          changePercent: 2.44,
          trend: 'up',
          target: 2200,
          unit: 'count',
          category: 'driver',
          period: period as any,
          lastUpdated: Timestamp.now()
        },
        {
          id: 'completion_rate',
          name: 'Ride Completion Rate',
          value: 94.5,
          previousValue: 93.8,
          change: 0.7,
          changePercent: 0.75,
          trend: 'up',
          target: 95.0,
          unit: 'percent',
          category: 'operational',
          period: period as any,
          lastUpdated: Timestamp.now()
        },
        {
          id: 'customer_satisfaction',
          name: 'Customer Satisfaction',
          value: 4.6,
          previousValue: 4.5,
          change: 0.1,
          changePercent: 2.22,
          trend: 'up',
          target: 4.7,
          unit: 'rating',
          category: 'customer',
          period: period as any,
          lastUpdated: Timestamp.now()
        }
      ];

      return category ? mockKPIs.filter(kpi => kpi.category === category) : mockKPIs;
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      throw error;
    }
  }

  // Revenue Analytics
  async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    try {
      // Mock data - in real implementation, this would aggregate from transactions
      return {
        totalRevenue: 125000,
        rideRevenue: 110000,
        subscriptionRevenue: 8000,
        advertisingRevenue: 4500,
        partnershipRevenue: 2000,
        otherRevenue: 500,
        revenueGrowth: 5.93,
        averageRevenuePerRide: 14.71,
        averageRevenuePerUser: 8.22
      };
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      throw error;
    }
  }

  // Operational Analytics
  async getOperationalMetrics(dateRange: DateRange): Promise<OperationalMetrics> {
    try {
      return {
        totalRides: 8500,
        completedRides: 8033,
        cancelledRides: 467,
        completionRate: 94.5,
        averageWaitTime: 4.2,
        averageRideTime: 18.5,
        averageRideDistance: 8.3,
        peakHourUtilization: 78.5,
        driverUtilization: 65.2,
        vehicleUtilization: 72.8
      };
    } catch (error) {
      console.error('Error fetching operational metrics:', error);
      throw error;
    }
  }

  // Customer Analytics
  async getCustomerMetrics(dateRange: DateRange): Promise<CustomerMetrics> {
    try {
      return {
        totalUsers: 45000,
        activeUsers: 15200,
        newUsers: 1200,
        returningUsers: 14000,
        userRetentionRate: 82.5,
        averageSessionDuration: 12.5,
        customerSatisfactionScore: 4.6,
        netPromoterScore: 68,
        churnRate: 3.2,
        lifetimeValue: 285.50
      };
    } catch (error) {
      console.error('Error fetching customer metrics:', error);
      throw error;
    }
  }

  // Driver Analytics
  async getDriverMetrics(dateRange: DateRange): Promise<DriverMetrics> {
    try {
      return {
        totalDrivers: 3500,
        activeDrivers: 2100,
        newDrivers: 150,
        driverRetentionRate: 88.2,
        averageDriverRating: 4.7,
        averageDriverEarnings: 1250.75,
        driverSatisfactionScore: 4.3,
        driverUtilizationRate: 65.2,
        averageOnlineHours: 6.8,
        driverChurnRate: 2.8
      };
    } catch (error) {
      console.error('Error fetching driver metrics:', error);
      throw error;
    }
  }

  // Time Series Data
  async getTimeSeriesData(metric: string, dateRange: DateRange, granularity: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<TimeSeriesData[]> {
    try {
      // Generate mock time series data
      const data: TimeSeriesData[] = [];
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      
      let current = new Date(start);
      while (current <= end) {
        data.push({
          period: current.toISOString().split('T')[0],
          timestamp: new Date(current),
          metrics: {
            revenue: Math.random() * 5000 + 3000,
            rides: Math.floor(Math.random() * 200 + 250),
            users: Math.floor(Math.random() * 500 + 400),
            drivers: Math.floor(Math.random() * 50 + 60),
            satisfaction: Math.random() * 0.5 + 4.3
          }
        });
        
        // Increment based on granularity
        switch (granularity) {
          case 'hour':
            current.setHours(current.getHours() + 1);
            break;
          case 'day':
            current.setDate(current.getDate() + 1);
            break;
          case 'week':
            current.setDate(current.getDate() + 7);
            break;
          case 'month':
            current.setMonth(current.getMonth() + 1);
            break;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching time series data:', error);
      throw error;
    }
  }

  // Geographic Analytics
  async getGeographicData(dateRange: DateRange): Promise<GeographicData[]> {
    try {
      // Mock geographic data
      return [
        {
          region: 'North America',
          city: 'New York',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          totalRides: 2500,
          revenue: 37500,
          activeUsers: 4500,
          activeDrivers: 650,
          averageWaitTime: 3.8,
          marketShare: 28.5
        },
        {
          region: 'North America',
          city: 'Los Angeles',
          coordinates: { lat: 34.0522, lng: -118.2437 },
          totalRides: 2200,
          revenue: 33000,
          activeUsers: 4000,
          activeDrivers: 580,
          averageWaitTime: 4.2,
          marketShare: 25.2
        },
        {
          region: 'North America',
          city: 'Chicago',
          coordinates: { lat: 41.8781, lng: -87.6298 },
          totalRides: 1800,
          revenue: 27000,
          activeUsers: 3200,
          activeDrivers: 480,
          averageWaitTime: 4.5,
          marketShare: 22.8
        }
      ];
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      throw error;
    }
  }

  // Drill-down Analytics
  async getDrillDownData(dimension: string, filters: ReportFilter[] = []): Promise<DrillDownData[]> {
    try {
      // Mock drill-down data
      const mockData: DrillDownData[] = [
        {
          level: 0,
          dimension: 'region',
          value: 'North America',
          metrics: {
            revenue: 97500,
            rides: 6500,
            users: 11700,
            drivers: 1710
          },
          children: [
            {
              level: 1,
              dimension: 'city',
              value: 'New York',
              metrics: {
                revenue: 37500,
                rides: 2500,
                users: 4500,
                drivers: 650
              }
            },
            {
              level: 1,
              dimension: 'city',
              value: 'Los Angeles',
              metrics: {
                revenue: 33000,
                rides: 2200,
                users: 4000,
                drivers: 580
              }
            }
          ]
        }
      ];
      
      return mockData;
    } catch (error) {
      console.error('Error fetching drill-down data:', error);
      throw error;
    }
  }

  // Custom Reports
  async createCustomReport(reportData: Omit<CustomReport, 'id' | 'createdAt'>): Promise<string> {
    try {
      const reportId = `report_${Date.now()}`;
      // In real implementation, save to database
      console.log('Creating custom report:', reportId, reportData);
      return reportId;
    } catch (error) {
      console.error('Error creating custom report:', error);
      throw error;
    }
  }

  async getCustomReports(userId: string): Promise<CustomReport[]> {
    try {
      // Mock custom reports
      return [
        {
          id: 'report_1',
          name: 'Weekly Revenue Summary',
          description: 'Weekly breakdown of revenue by source',
          type: 'dashboard',
          metrics: ['total_revenue', 'ride_revenue', 'subscription_revenue'],
          filters: [],
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(),
            preset: 'last_7_days'
          },
          schedule: {
            frequency: 'weekly',
            time: '09:00',
            dayOfWeek: 1,
            timezone: 'UTC',
            enabled: true
          },
          format: 'pdf',
          recipients: ['admin@gocars.com'],
          createdBy: userId,
          createdAt: Timestamp.now()
        }
      ];
    } catch (error) {
      console.error('Error fetching custom reports:', error);
      throw error;
    }
  }

  async generateReport(reportId: string): Promise<Blob> {
    try {
      // Mock report generation
      const reportContent = JSON.stringify({
        reportId,
        generatedAt: new Date().toISOString(),
        data: 'Mock report data'
      });
      
      return new Blob([reportContent], { type: 'application/json' });
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Real-time Data Streaming
  subscribeToKPIUpdates(callback: (kpis: KPIMetric[]) => void): () => void {
    // Mock real-time updates
    const interval = setInterval(async () => {
      const kpis = await this.getKPIMetrics();
      // Simulate small changes
      const updatedKPIs = kpis.map(kpi => ({
        ...kpi,
        value: kpi.value + (Math.random() - 0.5) * kpi.value * 0.01,
        lastUpdated: Timestamp.now()
      }));
      callback(updatedKPIs);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }

  // Data Export
  async exportData(
    metrics: string[], 
    dateRange: DateRange, 
    format: 'csv' | 'excel' | 'json'
  ): Promise<Blob> {
    try {
      // Mock data export
      const data = {
        metrics,
        dateRange,
        exportedAt: new Date().toISOString(),
        data: 'Mock exported data'
      };

      let content: string;
      let mimeType: string;

      switch (format) {
        case 'csv':
          content = 'metric,value,date\nrevenue,125000,2025-08-03\nrides,8500,2025-08-03';
          mimeType = 'text/csv';
          break;
        case 'excel':
          content = JSON.stringify(data); // In real implementation, generate Excel file
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'json':
        default:
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          break;
      }

      return new Blob([content], { type: mimeType });
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Predictive Analytics (placeholder for future implementation)
  async getPredictiveInsights(metric: string, horizon: number = 30): Promise<{
    predictions: ChartDataPoint[];
    confidence: number;
    factors: string[];
  }> {
    try {
      // Mock predictive data
      const predictions: ChartDataPoint[] = [];
      const baseValue = 125000;
      
      for (let i = 1; i <= horizon; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        predictions.push({
          timestamp: date,
          value: baseValue * (1 + (Math.random() - 0.5) * 0.1),
          label: `Day ${i}`
        });
      }

      return {
        predictions,
        confidence: 0.85,
        factors: ['Seasonal trends', 'Historical growth', 'Market conditions', 'Promotional campaigns']
      };
    } catch (error) {
      console.error('Error fetching predictive insights:', error);
      throw error;
    }
  }

  // Anomaly Detection
  async detectAnomalies(metric: string, dateRange: DateRange): Promise<{
    anomalies: Array<{
      timestamp: Date;
      value: number;
      expectedValue: number;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  }> {
    try {
      // Mock anomaly detection
      return {
        anomalies: [
          {
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            value: 95000,
            expectedValue: 125000,
            severity: 'high',
            description: 'Revenue dropped 24% below expected value'
          }
        ]
      };
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }
}

export const businessIntelligenceService = new BusinessIntelligenceService();