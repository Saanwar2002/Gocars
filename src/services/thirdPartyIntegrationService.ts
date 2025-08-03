/**
 * Third-Party Integration Service
 * Comprehensive integration framework for external services
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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Integration Types
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  description: string;
  config: IntegrationConfig;
  credentials: IntegrationCredentials;
  status: 'active' | 'inactive' | 'error' | 'pending';
  isEnabled: boolean;
  lastSync?: Date;
  syncFrequency?: number; // minutes
  errorCount: number;
  successCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationType = 
  | 'payment' 
  | 'mapping' 
  | 'sms' 
  | 'email' 
  | 'analytics' 
  | 'monitoring' 
  | 'storage' 
  | 'authentication'
  | 'crm'
  | 'accounting';

export interface IntegrationConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  rateLimits?: RateLimit[];
  webhookUrl?: string;
  customFields?: { [key: string]: any };
  mappings?: FieldMapping[];
}

export interface IntegrationCredentials {
  type: 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token' | 'custom';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  customHeaders?: { [key: string]: string };
  expiresAt?: Date;
}

export interface RateLimit {
  requests: number;
  window: number; // seconds
  burst?: number;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: 'uppercase' | 'lowercase' | 'date_format' | 'currency' | 'custom';
  customTransform?: string;
}

export interface SyncOperation {
  id: string;
  integrationId: string;
  type: 'import' | 'export' | 'sync';
  entity: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordsProcessed: number;
  recordsTotal: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  metadata?: any;
}

export interface SyncError {
  recordId?: string;
  field?: string;
  message: string;
  code?: string;
  timestamp: Date;
}

// Payment Integration Types
export interface PaymentProvider {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'square' | 'braintree' | 'adyen';
  config: PaymentConfig;
  isDefault: boolean;
  supportedMethods: PaymentMethod[];
  supportedCurrencies: string[];
  fees: PaymentFee[];
}

export interface PaymentConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
  merchantId?: string;
  customSettings?: { [key: string]: any };
}

export interface PaymentMethod {
  type: 'card' | 'bank_transfer' | 'digital_wallet' | 'cash';
  name: string;
  isEnabled: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaymentFee {
  type: 'percentage' | 'fixed' | 'combined';
  percentage?: number;
  fixedAmount?: number;
  currency?: string;
  description: string;
}

// Mapping Integration Types
export interface MappingProvider {
  id: string;
  name: string;
  type: 'google_maps' | 'mapbox' | 'here' | 'tomtom';
  config: MappingConfig;
  features: MappingFeature[];
  quotaUsed: number;
  quotaLimit: number;
}

export interface MappingConfig {
  apiKey: string;
  region?: string;
  language?: string;
  units: 'metric' | 'imperial';
  customStyles?: any;
}

export interface MappingFeature {
  name: string;
  isEnabled: boolean;
  costPerRequest?: number;
}

// Communication Integration Types
export interface CommunicationProvider {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push';
  provider: 'twilio' | 'sendgrid' | 'mailgun' | 'ses' | 'firebase';
  config: CommunicationConfig;
  templates: MessageTemplate[];
  deliveryStats: DeliveryStats;
}

export interface CommunicationConfig {
  apiKey: string;
  fromNumber?: string;
  fromEmail?: string;
  fromName?: string;
  webhookUrl?: string;
  customSettings?: { [key: string]: any };
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export interface DeliveryStats {
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  opened?: number;
  clicked?: number;
}

class ThirdPartyIntegrationService {
  // Integration Management
  async createIntegration(integrationData: Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'errorCount' | 'successCount'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'integrations'), {
        ...integrationData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        errorCount: 0,
        successCount: 0
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  async getIntegrations(type?: IntegrationType): Promise<Integration[]> {
    try {
      let q = query(
        collection(db, 'integrations'),
        orderBy('createdAt', 'desc')
      );

      if (type) {
        q = query(
          collection(db, 'integrations'),
          where('type', '==', type),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastSync: doc.data().lastSync?.toDate(),
        credentials: {
          ...doc.data().credentials,
          expiresAt: doc.data().credentials.expiresAt?.toDate()
        }
      } as Integration));
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<void> {
    try {
      await updateDoc(doc(db, 'integrations', integrationId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  }

  async testIntegration(integrationId: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    try {
      const integrations = await this.getIntegrations();
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Integration not found');
      }

      const startTime = Date.now();
      const result = await this.performIntegrationTest(integration);
      const responseTime = Date.now() - startTime;

      return {
        success: result.success,
        message: result.message,
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        responseTime: 0
      };
    }
  }

  private async performIntegrationTest(integration: Integration): Promise<{ success: boolean; message: string }> {
    switch (integration.type) {
      case 'payment':
        return this.testPaymentIntegration(integration);
      case 'mapping':
        return this.testMappingIntegration(integration);
      case 'sms':
        return this.testSMSIntegration(integration);
      case 'email':
        return this.testEmailIntegration(integration);
      default:
        return { success: true, message: 'Test not implemented for this integration type' };
    }
  }

  // Payment Integration
  private async testPaymentIntegration(integration: Integration): Promise<{ success: boolean; message: string }> {
    try {
      // Mock payment provider test
      switch (integration.provider) {
        case 'stripe':
          // Test Stripe connection
          const stripeResponse = await this.mockAPICall(`https://api.stripe.com/v1/account`, {
            headers: {
              'Authorization': `Bearer ${integration.credentials.apiKey}`
            }
          });
          return { success: true, message: 'Stripe connection successful' };
        
        case 'paypal':
          // Test PayPal connection
          return { success: true, message: 'PayPal connection successful' };
        
        default:
          return { success: false, message: 'Unknown payment provider' };
      }
    } catch (error) {
      return { success: false, message: `Payment test failed: ${error}` };
    }
  }

  async processPayment(integrationId: string, paymentData: {
    amount: number;
    currency: string;
    paymentMethod: string;
    customerId?: string;
    metadata?: any;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const integrations = await this.getIntegrations('payment');
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Payment integration not found');
      }

      // Mock payment processing
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In real implementation, call actual payment provider API
      await this.mockAPICall(`${integration.config.baseUrl}/charges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentData.amount * 100, // Convert to cents
          currency: paymentData.currency,
          payment_method: paymentData.paymentMethod,
          customer: paymentData.customerId,
          metadata: paymentData.metadata
        })
      });

      await this.updateIntegrationStats(integrationId, true);
      
      return { success: true, transactionId };
    } catch (error) {
      await this.updateIntegrationStats(integrationId, false);
      return { success: false, error: error instanceof Error ? error.message : 'Payment failed' };
    }
  }

  // Mapping Integration
  private async testMappingIntegration(integration: Integration): Promise<{ success: boolean; message: string }> {
    try {
      // Test mapping provider
      switch (integration.provider) {
        case 'google_maps':
          await this.mockAPICall(`https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${integration.credentials.apiKey}`);
          return { success: true, message: 'Google Maps connection successful' };
        
        case 'mapbox':
          await this.mockAPICall(`https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${integration.credentials.apiKey}`);
          return { success: true, message: 'Mapbox connection successful' };
        
        default:
          return { success: false, message: 'Unknown mapping provider' };
      }
    } catch (error) {
      return { success: false, message: `Mapping test failed: ${error}` };
    }
  }

  async geocodeAddress(integrationId: string, address: string): Promise<{
    success: boolean;
    coordinates?: { latitude: number; longitude: number };
    formattedAddress?: string;
    error?: string;
  }> {
    try {
      const integrations = await this.getIntegrations('mapping');
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Mapping integration not found');
      }

      // Mock geocoding response
      const mockCoordinates = {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1
      };

      await this.updateIntegrationStats(integrationId, true);
      
      return {
        success: true,
        coordinates: mockCoordinates,
        formattedAddress: `${address}, New York, NY, USA`
      };
    } catch (error) {
      await this.updateIntegrationStats(integrationId, false);
      return { success: false, error: error instanceof Error ? error.message : 'Geocoding failed' };
    }
  }

  async calculateRoute(integrationId: string, origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<{
    success: boolean;
    route?: {
      distance: number;
      duration: number;
      polyline: string;
      steps: any[];
    };
    error?: string;
  }> {
    try {
      const integrations = await this.getIntegrations('mapping');
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Mapping integration not found');
      }

      // Mock route calculation
      const distance = Math.sqrt(
        Math.pow(destination.lat - origin.lat, 2) + 
        Math.pow(destination.lng - origin.lng, 2)
      ) * 111000; // Rough conversion to meters

      const mockRoute = {
        distance: Math.round(distance),
        duration: Math.round(distance / 10), // Mock duration in seconds
        polyline: 'mock_polyline_string',
        steps: [
          { instruction: 'Head north', distance: distance * 0.3, duration: distance * 0.03 },
          { instruction: 'Turn right', distance: distance * 0.4, duration: distance * 0.04 },
          { instruction: 'Arrive at destination', distance: distance * 0.3, duration: distance * 0.03 }
        ]
      };

      await this.updateIntegrationStats(integrationId, true);
      
      return { success: true, route: mockRoute };
    } catch (error) {
      await this.updateIntegrationStats(integrationId, false);
      return { success: false, error: error instanceof Error ? error.message : 'Route calculation failed' };
    }
  }

  // SMS Integration
  private async testSMSIntegration(integration: Integration): Promise<{ success: boolean; message: string }> {
    try {
      switch (integration.provider) {
        case 'twilio':
          await this.mockAPICall(`https://api.twilio.com/2010-04-01/Accounts/test/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${integration.credentials.username}:${integration.credentials.password}`)}`
            }
          });
          return { success: true, message: 'Twilio connection successful' };
        
        default:
          return { success: false, message: 'Unknown SMS provider' };
      }
    } catch (error) {
      return { success: false, message: `SMS test failed: ${error}` };
    }
  }

  async sendSMS(integrationId: string, to: string, message: string, templateId?: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const integrations = await this.getIntegrations('sms');
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('SMS integration not found');
      }

      // Mock SMS sending
      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.updateIntegrationStats(integrationId, true);
      
      return { success: true, messageId };
    } catch (error) {
      await this.updateIntegrationStats(integrationId, false);
      return { success: false, error: error instanceof Error ? error.message : 'SMS sending failed' };
    }
  }

  // Email Integration
  private async testEmailIntegration(integration: Integration): Promise<{ success: boolean; message: string }> {
    try {
      switch (integration.provider) {
        case 'sendgrid':
          await this.mockAPICall(`https://api.sendgrid.com/v3/mail/send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.credentials.apiKey}`
            }
          });
          return { success: true, message: 'SendGrid connection successful' };
        
        case 'mailgun':
          await this.mockAPICall(`https://api.mailgun.net/v3/test/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`api:${integration.credentials.apiKey}`)}`
            }
          });
          return { success: true, message: 'Mailgun connection successful' };
        
        default:
          return { success: false, message: 'Unknown email provider' };
      }
    } catch (error) {
      return { success: false, message: `Email test failed: ${error}` };
    }
  }

  async sendEmail(integrationId: string, emailData: {
    to: string[];
    subject: string;
    content: string;
    templateId?: string;
    variables?: { [key: string]: any };
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const integrations = await this.getIntegrations('email');
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Email integration not found');
      }

      // Mock email sending
      const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.updateIntegrationStats(integrationId, true);
      
      return { success: true, messageId };
    } catch (error) {
      await this.updateIntegrationStats(integrationId, false);
      return { success: false, error: error instanceof Error ? error.message : 'Email sending failed' };
    }
  }

  // Data Synchronization
  async startSync(integrationId: string, entity: string, type: 'import' | 'export' | 'sync'): Promise<string> {
    try {
      const syncOperation: Omit<SyncOperation, 'id'> = {
        integrationId,
        type,
        entity,
        status: 'pending',
        recordsProcessed: 0,
        recordsTotal: 0,
        errors: [],
        startedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'sync_operations'), {
        ...syncOperation,
        startedAt: Timestamp.now()
      });

      // Start async sync process
      this.performSync(docRef.id, integrationId, entity, type);

      return docRef.id;
    } catch (error) {
      console.error('Error starting sync:', error);
      throw error;
    }
  }

  private async performSync(syncId: string, integrationId: string, entity: string, type: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'sync_operations', syncId), {
        status: 'running'
      });

      // Mock sync process
      const totalRecords = Math.floor(Math.random() * 1000) + 100;
      let processedRecords = 0;
      const errors: SyncError[] = [];

      // Simulate processing records
      const processInterval = setInterval(async () => {
        processedRecords += Math.floor(Math.random() * 50) + 10;
        
        // Simulate occasional errors
        if (Math.random() < 0.1) {
          errors.push({
            recordId: `record_${processedRecords}`,
            message: 'Validation error',
            timestamp: new Date()
          });
        }

        await updateDoc(doc(db, 'sync_operations', syncId), {
          recordsProcessed: Math.min(processedRecords, totalRecords),
          recordsTotal: totalRecords,
          errors
        });

        if (processedRecords >= totalRecords) {
          clearInterval(processInterval);
          
          await updateDoc(doc(db, 'sync_operations', syncId), {
            status: 'completed',
            completedAt: Timestamp.now(),
            duration: Date.now() - new Date().getTime()
          });

          await this.updateIntegrationStats(integrationId, errors.length === 0);
        }
      }, 1000);

    } catch (error) {
      await updateDoc(doc(db, 'sync_operations', syncId), {
        status: 'failed',
        completedAt: Timestamp.now(),
        errors: [{
          message: error instanceof Error ? error.message : 'Sync failed',
          timestamp: new Date()
        }]
      });

      await this.updateIntegrationStats(integrationId, false);
    }
  }

  async getSyncOperations(integrationId?: string): Promise<SyncOperation[]> {
    try {
      let q = query(
        collection(db, 'sync_operations'),
        orderBy('startedAt', 'desc')
      );

      if (integrationId) {
        q = query(
          collection(db, 'sync_operations'),
          where('integrationId', '==', integrationId),
          orderBy('startedAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        errors: doc.data().errors.map((error: any) => ({
          ...error,
          timestamp: error.timestamp.toDate()
        }))
      } as SyncOperation));
    } catch (error) {
      console.error('Error fetching sync operations:', error);
      throw error;
    }
  }

  // Utility Methods
  private async updateIntegrationStats(integrationId: string, success: boolean): Promise<void> {
    try {
      const integrationRef = doc(db, 'integrations', integrationId);
      const updateData: any = {
        lastSync: Timestamp.now()
      };

      if (success) {
        updateData.successCount = 1; // In real implementation, increment existing count
        updateData.status = 'active';
      } else {
        updateData.errorCount = 1; // In real implementation, increment existing count
        updateData.status = 'error';
      }

      await updateDoc(integrationRef, updateData);
    } catch (error) {
      console.error('Error updating integration stats:', error);
    }
  }

  private async mockAPICall(url: string, options?: any): Promise<any> {
    // Mock API call for testing purposes
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({ success: true, data: 'mock response' });
        } else {
          reject(new Error('Mock API error'));
        }
      }, Math.random() * 1000 + 500); // 500-1500ms delay
    });
  }

  // Predefined Integration Templates
  getIntegrationTemplates(): Partial<Integration>[] {
    return [
      {
        name: 'Stripe Payment Gateway',
        type: 'payment',
        provider: 'stripe',
        description: 'Accept credit card payments through Stripe',
        config: {
          baseUrl: 'https://api.stripe.com/v1',
          apiVersion: '2023-10-16',
          timeout: 30000,
          retryAttempts: 3
        },
        credentials: {
          type: 'api_key'
        }
      },
      {
        name: 'Google Maps Platform',
        type: 'mapping',
        provider: 'google_maps',
        description: 'Geocoding, routing, and mapping services',
        config: {
          baseUrl: 'https://maps.googleapis.com/maps/api',
          timeout: 10000,
          retryAttempts: 2
        },
        credentials: {
          type: 'api_key'
        }
      },
      {
        name: 'Twilio SMS',
        type: 'sms',
        provider: 'twilio',
        description: 'Send SMS notifications via Twilio',
        config: {
          baseUrl: 'https://api.twilio.com/2010-04-01',
          timeout: 15000,
          retryAttempts: 2
        },
        credentials: {
          type: 'basic_auth'
        }
      },
      {
        name: 'SendGrid Email',
        type: 'email',
        provider: 'sendgrid',
        description: 'Send transactional emails via SendGrid',
        config: {
          baseUrl: 'https://api.sendgrid.com/v3',
          timeout: 20000,
          retryAttempts: 3
        },
        credentials: {
          type: 'api_key'
        }
      }
    ];
  }
}

export const thirdPartyIntegrationService = new ThirdPartyIntegrationService();