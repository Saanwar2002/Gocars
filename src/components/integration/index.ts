// Data Integration and API Access Components
export { APIDocumentationDashboard } from './api-documentation-dashboard';
export { WebhookDashboard } from './webhook-dashboard';
export { ThirdPartyIntegrationDashboard } from './third-party-integration-dashboard';
export { DataSyncDashboard } from './data-sync-dashboard';

// Re-export types from services
export type {
  APIEndpoint,
  APITestResult,
  SDKConfig
} from '@/services/apiDocumentationService';

export type {
  WebhookEndpoint,
  WebhookDelivery,
  EventStream,
  RealTimeEvent
} from '@/services/webhookService';

export type {
  Integration,
  IntegrationType,
  SyncOperation
} from '@/services/thirdPartyIntegrationService';

export type {
  SyncConfiguration,
  SyncSession,
  SyncConflict
} from '@/services/dataSynchronizationService';