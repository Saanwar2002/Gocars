// Comprehensive Reporting System Components
export { ReportingDashboard } from './reporting-dashboard';
export { ReportTemplateBuilder } from './report-template-builder';
export { ReportScheduler } from './report-scheduler';
export { ReportCharts } from './report-charts';
export { ReportExporter } from './report-exporter';
export { ReportPermissions } from './report-permissions';

// Re-export types from the service
export type {
  ReportTemplate,
  ReportSection,
  ReportFilter,
  ReportParameter,
  GeneratedReport,
  ReportSchedule,
  ReportSubscription,
  ReportAnalytics
} from '@/services/reportingService';