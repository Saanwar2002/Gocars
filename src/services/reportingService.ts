/**
 * Comprehensive Reporting Service
 * Advanced reporting system with customizable templates, automated generation, and multi-format export
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc,
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Reporting Types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'financial' | 'customer' | 'driver' | 'performance' | 'custom';
  type: 'dashboard' | 'table' | 'chart' | 'summary' | 'detailed';
  sections: ReportSection[];
  filters: ReportFilter[];
  parameters: ReportParameter[];
  layout: ReportLayout;
  styling: ReportStyling;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'metric' | 'image' | 'divider';
  order: number;
  config: {
    dataSource?: string;
    metrics?: string[];
    dimensions?: string[];
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    formatting?: 'currency' | 'percentage' | 'number' | 'date';
  };
  content?: string; // For text sections
  visible: boolean;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
  value: any;
  label: string;
  required: boolean;
}

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  label: string;
  defaultValue: any;
  options?: Array<{ label: string; value: any }>;
  required: boolean;
  description?: string;
}

export interface ReportLayout {
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  columns: number;
  spacing: number;
}

export interface ReportStyling {
  theme: 'default' | 'corporate' | 'modern' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  showLogo: boolean;
  showPageNumbers: boolean;
  showTimestamp: boolean;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  description?: string;
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  status: 'generating' | 'completed' | 'failed' | 'expired';
  parameters: Record<string, any>;
  filters: ReportFilter[];
  dateRange: {
    start: Date;
    end: Date;
  };
  generatedBy: string;
  generatedAt: Date;
  expiresAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  downloadCount: number;
  error?: string;
}

export interface ReportSchedule {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  schedule: {
    time: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    timezone: string;
  };
  parameters: Record<string, any>;
  filters: ReportFilter[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients: Array<{
    email: string;
    name: string;
    role?: string;
  }>;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSubscription {
  id: string;
  userId: string;
  userEmail: string;
  templateId?: string;
  scheduleId?: string;
  category?: string;
  preferences: {
    format: 'pdf' | 'excel' | 'csv' | 'json';
    frequency: 'daily' | 'weekly' | 'monthly';
    deliveryTime: string;
    includeCharts: boolean;
    includeRawData: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportAnalytics {
  templateId: string;
  totalGenerations: number;
  totalDownloads: number;
  averageGenerationTime: number;
  popularFormats: Array<{
    format: string;
    count: number;
    percentage: number;
  }>;
  usageByUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  usageTrends: Array<{
    date: Date;
    generations: number;
    downloads: number;
  }>;
}

class ReportingService {
  // Template Management
  async createReportTemplate(templateData: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'report_templates'), {
        ...templateData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        usageCount: 0
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating report template:', error);
      throw error;
    }
  }

  async getReportTemplates(category?: string, userId?: string): Promise<ReportTemplate[]> {
    try {
      let q = query(
        collection(db, 'report_templates'),
        orderBy('createdAt', 'desc')
      );

      if (category) {
        q = query(
          collection(db, 'report_templates'),
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        );
      }

      if (userId) {
        q = query(
          collection(db, 'report_templates'),
          where('createdBy', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as ReportTemplate));
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }

  async updateReportTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<void> {
    try {
      await updateDoc(doc(db, 'report_templates', templateId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating report template:', error);
      throw error;
    }
  }

  // Report Generation
  async generateReport(
    templateId: string, 
    parameters: Record<string, any>,
    filters: ReportFilter[],
    format: 'pdf' | 'excel' | 'csv' | 'json' | 'html',
    userId: string
  ): Promise<string> {
    try {
      const template = await this.getReportTemplate(templateId);
      if (!template) {
        throw new Error('Report template not found');
      }

      const reportData: Omit<GeneratedReport, 'id'> = {
        templateId,
        templateName: template.name,
        title: `${template.name} - ${new Date().toLocaleDateString()}`,
        format,
        status: 'generating',
        parameters,
        filters,
        dateRange: {
          start: parameters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: parameters.endDate || new Date()
        },
        generatedBy: userId,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        downloadCount: 0
      };

      const docRef = await addDoc(collection(db, 'generated_reports'), {
        ...reportData,
        generatedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(reportData.expiresAt!),
        dateRange: {
          start: Timestamp.fromDate(reportData.dateRange.start),
          end: Timestamp.fromDate(reportData.dateRange.end)
        }
      });

      // Simulate report generation (in real implementation, this would be async)
      setTimeout(async () => {
        try {
          const generatedFileUrl = await this.processReportGeneration(template, parameters, filters, format);
          
          await updateDoc(doc(db, 'generated_reports', docRef.id), {
            status: 'completed',
            fileUrl: generatedFileUrl,
            fileSize: Math.floor(Math.random() * 1000000) + 100000 // Mock file size
          });

          // Update template usage count
          await updateDoc(doc(db, 'report_templates', templateId), {
            usageCount: template.usageCount + 1
          });
        } catch (error) {
          await updateDoc(doc(db, 'generated_reports', docRef.id), {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }, 2000); // 2 second delay to simulate processing

      return docRef.id;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  private async processReportGeneration(
    template: ReportTemplate,
    parameters: Record<string, any>,
    filters: ReportFilter[],
    format: string
  ): Promise<string> {
    // Mock report generation process
    // In real implementation, this would:
    // 1. Fetch data based on template configuration
    // 2. Apply filters and parameters
    // 3. Generate the report in the specified format
    // 4. Upload to cloud storage
    // 5. Return the file URL
    
    return `https://storage.gocars.com/reports/${Date.now()}.${format}`;
  }

  async getGeneratedReports(userId?: string, templateId?: string): Promise<GeneratedReport[]> {
    try {
      let q = query(
        collection(db, 'generated_reports'),
        orderBy('generatedAt', 'desc'),
        limit(50)
      );

      if (userId) {
        q = query(
          collection(db, 'generated_reports'),
          where('generatedBy', '==', userId),
          orderBy('generatedAt', 'desc'),
          limit(50)
        );
      }

      if (templateId) {
        q = query(
          collection(db, 'generated_reports'),
          where('templateId', '==', templateId),
          orderBy('generatedAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        dateRange: {
          start: doc.data().dateRange.start.toDate(),
          end: doc.data().dateRange.end.toDate()
        }
      } as GeneratedReport));
    } catch (error) {
      console.error('Error fetching generated reports:', error);
      throw error;
    }
  }

  // Report Scheduling
  async createReportSchedule(scheduleData: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'report_schedules'), {
        ...scheduleData,
        nextRun: Timestamp.fromDate(scheduleData.nextRun),
        lastRun: scheduleData.lastRun ? Timestamp.fromDate(scheduleData.lastRun) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating report schedule:', error);
      throw error;
    }
  }

  async getReportSchedules(userId?: string): Promise<ReportSchedule[]> {
    try {
      let q = query(
        collection(db, 'report_schedules'),
        orderBy('createdAt', 'desc')
      );

      if (userId) {
        q = query(
          collection(db, 'report_schedules'),
          where('createdBy', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        nextRun: doc.data().nextRun.toDate(),
        lastRun: doc.data().lastRun?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as ReportSchedule));
    } catch (error) {
      console.error('Error fetching report schedules:', error);
      throw error;
    }
  }

  async updateReportSchedule(scheduleId: string, updates: Partial<ReportSchedule>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      if (updates.nextRun) {
        updateData.nextRun = Timestamp.fromDate(updates.nextRun);
      }
      if (updates.lastRun) {
        updateData.lastRun = Timestamp.fromDate(updates.lastRun);
      }

      await updateDoc(doc(db, 'report_schedules', scheduleId), updateData);
    } catch (error) {
      console.error('Error updating report schedule:', error);
      throw error;
    }
  }

  // Subscription Management
  async createReportSubscription(subscriptionData: Omit<ReportSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'report_subscriptions'), {
        ...subscriptionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating report subscription:', error);
      throw error;
    }
  }

  async getReportSubscriptions(userId?: string): Promise<ReportSubscription[]> {
    try {
      let q = query(
        collection(db, 'report_subscriptions'),
        orderBy('createdAt', 'desc')
      );

      if (userId) {
        q = query(
          collection(db, 'report_subscriptions'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as ReportSubscription));
    } catch (error) {
      console.error('Error fetching report subscriptions:', error);
      throw error;
    }
  }

  // Data Export
  async exportData(
    dataSource: string,
    filters: ReportFilter[],
    format: 'csv' | 'excel' | 'json',
    columns?: string[]
  ): Promise<Blob> {
    try {
      // Mock data export - in real implementation, this would fetch actual data
      const mockData = this.generateMockData(dataSource, filters);
      
      let content: string;
      let mimeType: string;

      switch (format) {
        case 'csv':
          content = this.convertToCSV(mockData, columns);
          mimeType = 'text/csv';
          break;
        case 'excel':
          content = JSON.stringify(mockData); // In real implementation, generate Excel file
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'json':
        default:
          content = JSON.stringify(mockData, null, 2);
          mimeType = 'application/json';
          break;
      }

      return new Blob([content], { type: mimeType });
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Analytics
  async getReportAnalytics(templateId?: string): Promise<ReportAnalytics> {
    try {
      // Mock analytics data
      return {
        templateId: templateId || 'all',
        totalGenerations: 1250,
        totalDownloads: 3420,
        averageGenerationTime: 3.2, // seconds
        popularFormats: [
          { format: 'PDF', count: 650, percentage: 52 },
          { format: 'Excel', count: 400, percentage: 32 },
          { format: 'CSV', count: 150, percentage: 12 },
          { format: 'JSON', count: 50, percentage: 4 }
        ],
        usageByUser: [
          { userId: 'user1', userName: 'John Smith', count: 45 },
          { userId: 'user2', userName: 'Sarah Johnson', count: 38 },
          { userId: 'user3', userName: 'Mike Chen', count: 32 }
        ],
        usageTrends: this.generateUsageTrends()
      };
    } catch (error) {
      console.error('Error fetching report analytics:', error);
      throw error;
    }
  }

  // Helper Methods
  private async getReportTemplate(templateId: string): Promise<ReportTemplate | null> {
    try {
      const templates = await this.getReportTemplates();
      return templates.find(t => t.id === templateId) || null;
    } catch (error) {
      console.error('Error fetching report template:', error);
      return null;
    }
  }

  private generateMockData(dataSource: string, filters: ReportFilter[]): any[] {
    // Generate mock data based on data source
    const mockData = [];
    const recordCount = Math.floor(Math.random() * 100) + 50;

    for (let i = 0; i < recordCount; i++) {
      switch (dataSource) {
        case 'rides':
          mockData.push({
            id: `ride_${i + 1}`,
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            passenger: `Passenger ${i + 1}`,
            driver: `Driver ${Math.floor(Math.random() * 50) + 1}`,
            fare: Math.random() * 50 + 10,
            distance: Math.random() * 20 + 2,
            duration: Math.random() * 30 + 5,
            status: ['completed', 'cancelled'][Math.floor(Math.random() * 2)]
          });
          break;
        case 'drivers':
          mockData.push({
            id: `driver_${i + 1}`,
            name: `Driver ${i + 1}`,
            email: `driver${i + 1}@example.com`,
            rating: Math.random() * 2 + 3,
            totalRides: Math.floor(Math.random() * 500) + 50,
            earnings: Math.random() * 5000 + 1000,
            joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
          });
          break;
        default:
          mockData.push({
            id: i + 1,
            value: Math.random() * 1000,
            category: `Category ${Math.floor(Math.random() * 5) + 1}`,
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          });
      }
    }

    return mockData;
  }

  private convertToCSV(data: any[], columns?: string[]): string {
    if (data.length === 0) return '';

    const headers = columns || Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  private generateUsageTrends(): Array<{ date: Date; generations: number; downloads: number }> {
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date,
        generations: Math.floor(Math.random() * 50) + 10,
        downloads: Math.floor(Math.random() * 100) + 20
      });
    }
    return trends;
  }

  // Predefined Templates
  async getDefaultTemplates(): Promise<Partial<ReportTemplate>[]> {
    return [
      {
        name: 'Daily Operations Summary',
        description: 'Daily overview of rides, revenue, and key metrics',
        category: 'operational',
        type: 'summary',
        sections: [
          {
            id: 'metrics',
            title: 'Key Metrics',
            type: 'metric',
            order: 1,
            config: {
              metrics: ['total_rides', 'total_revenue', 'active_drivers', 'completion_rate']
            },
            visible: true
          },
          {
            id: 'rides_chart',
            title: 'Rides Over Time',
            type: 'chart',
            order: 2,
            config: {
              dataSource: 'rides',
              chartType: 'line',
              metrics: ['ride_count'],
              dimensions: ['hour']
            },
            visible: true
          }
        ]
      },
      {
        name: 'Financial Performance Report',
        description: 'Comprehensive financial analysis and revenue breakdown',
        category: 'financial',
        type: 'detailed',
        sections: [
          {
            id: 'revenue_summary',
            title: 'Revenue Summary',
            type: 'table',
            order: 1,
            config: {
              dataSource: 'revenue',
              metrics: ['total_revenue', 'ride_revenue', 'commission'],
              formatting: 'currency'
            },
            visible: true
          }
        ]
      },
      {
        name: 'Driver Performance Analysis',
        description: 'Driver metrics, ratings, and performance indicators',
        category: 'driver',
        type: 'detailed',
        sections: [
          {
            id: 'driver_metrics',
            title: 'Driver Performance',
            type: 'table',
            order: 1,
            config: {
              dataSource: 'drivers',
              metrics: ['rating', 'total_rides', 'earnings', 'completion_rate']
            },
            visible: true
          }
        ]
      }
    ];
  }
}

export const reportingService = new ReportingService();