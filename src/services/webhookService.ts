/**
 * Webhook Service
 * Real-time event streaming and webhook management system
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Webhook Types
export interface WebhookEndpoint {
  id: string;
  url: string;
  name: string;
  description?: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  retryPolicy: RetryPolicy;
  filters: WebhookFilter[];
  headers: { [key: string]: string };
  timeout: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

export interface WebhookEvent {
  type: string;
  description: string;
  schema: any;
  example: any;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  retryOn: number[]; // HTTP status codes to retry on
}

export interface WebhookFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  httpStatus?: number;
  responseBody?: string;
  responseHeaders?: { [key: string]: string };
  error?: string;
  attempts: WebhookAttempt[];
  createdAt: Date;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

export interface WebhookAttempt {
  attemptNumber: number;
  timestamp: Date;
  httpStatus?: number;
  responseTime: number;
  error?: string;
  responseBody?: string;
}

export interface WebhookSubscription {
  id: string;
  userId: string;
  webhookId: string;
  events: string[];
  filters: WebhookFilter[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventStream {
  id: string;
  name: string;
  description: string;
  events: string[];
  subscribers: StreamSubscriber[];
  isActive: boolean;
  retentionPeriod: number; // days
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamSubscriber {
  id: string;
  type: 'webhook' | 'websocket' | 'sse';
  endpoint: string;
  filters: WebhookFilter[];
  isActive: boolean;
  subscribedAt: Date;
}

export interface RealTimeEvent {
  id: string;
  type: string;
  source: string;
  data: any;
  metadata: {
    userId?: string;
    sessionId?: string;
    timestamp: Date;
    version: string;
  };
  streamId?: string;
}

class WebhookService {
  private eventQueue: RealTimeEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startEventProcessor();
  }

  // Webhook Endpoint Management
  async createWebhook(webhookData: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'successCount' | 'failureCount'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'webhook_endpoints'), {
        ...webhookData,
        secret: this.generateSecret(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        successCount: 0,
        failureCount: 0
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  async getWebhooks(userId?: string): Promise<WebhookEndpoint[]> {
    try {
      let q = query(
        collection(db, 'webhook_endpoints'),
        orderBy('createdAt', 'desc')
      );

      if (userId) {
        q = query(
          collection(db, 'webhook_endpoints'),
          where('createdBy', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastTriggered: doc.data().lastTriggered?.toDate()
      } as WebhookEndpoint));
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw error;
    }
  }

  async updateWebhook(webhookId: string, updates: Partial<WebhookEndpoint>): Promise<void> {
    try {
      await updateDoc(doc(db, 'webhook_endpoints', webhookId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'webhook_endpoints', webhookId));
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  // Event Publishing
  async publishEvent(event: Omit<RealTimeEvent, 'id' | 'metadata'>, metadata?: Partial<RealTimeEvent['metadata']>): Promise<void> {
    try {
      const realTimeEvent: RealTimeEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
          ...metadata
        }
      };

      // Add to processing queue
      this.eventQueue.push(realTimeEvent);

      // Store event for audit trail
      await addDoc(collection(db, 'webhook_events'), {
        ...realTimeEvent,
        metadata: {
          ...realTimeEvent.metadata,
          timestamp: Timestamp.now()
        }
      });

      console.log(`Event published: ${event.type}`, realTimeEvent.id);
    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  // Event Processing
  private startEventProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        const events = this.eventQueue.splice(0, 10); // Process up to 10 events at a time
        await Promise.all(events.map(event => this.processEvent(event)));
      }
    }, 1000); // Process every second
  }

  private async processEvent(event: RealTimeEvent): Promise<void> {
    try {
      const webhooks = await this.getWebhooks();
      const relevantWebhooks = webhooks.filter(webhook => 
        webhook.isActive && 
        webhook.events.some(e => e.type === event.type) &&
        this.matchesFilters(event, webhook.filters)
      );

      await Promise.all(relevantWebhooks.map(webhook => 
        this.deliverWebhook(webhook, event)
      ));

      // Also handle real-time streams
      await this.deliverToStreams(event);
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  private matchesFilters(event: RealTimeEvent, filters: WebhookFilter[]): boolean {
    return filters.every(filter => {
      const value = this.getNestedValue(event.data, filter.field);
      
      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'not_equals':
          return value !== filter.value;
        case 'contains':
          return typeof value === 'string' && value.includes(filter.value);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'greater_than':
          return typeof value === 'number' && value > filter.value;
        case 'less_than':
          return typeof value === 'number' && value < filter.value;
        default:
          return true;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Webhook Delivery
  private async deliverWebhook(webhook: WebhookEndpoint, event: RealTimeEvent): Promise<void> {
    const delivery: Omit<WebhookDelivery, 'id'> = {
      webhookId: webhook.id,
      eventType: event.type,
      payload: {
        id: event.id,
        type: event.type,
        source: event.source,
        data: event.data,
        timestamp: event.metadata.timestamp.toISOString()
      },
      status: 'pending',
      attempts: [],
      createdAt: new Date()
    };

    try {
      const docRef = await addDoc(collection(db, 'webhook_deliveries'), {
        ...delivery,
        createdAt: Timestamp.now()
      });

      await this.attemptDelivery(docRef.id, webhook, delivery);
    } catch (error) {
      console.error('Error creating webhook delivery:', error);
    }
  }

  private async attemptDelivery(deliveryId: string, webhook: WebhookEndpoint, delivery: Omit<WebhookDelivery, 'id'>): Promise<void> {
    const attempt: WebhookAttempt = {
      attemptNumber: delivery.attempts.length + 1,
      timestamp: new Date(),
      responseTime: 0
    };

    const startTime = Date.now();

    try {
      const signature = this.generateSignature(JSON.stringify(delivery.payload), webhook.secret);
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.eventType,
          'X-Webhook-Delivery': deliveryId,
          'User-Agent': 'GoCars-Webhooks/1.0',
          ...webhook.headers
        },
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(webhook.timeout)
      });

      attempt.responseTime = Date.now() - startTime;
      attempt.httpStatus = response.status;
      attempt.responseBody = await response.text();

      if (response.ok) {
        // Success
        await updateDoc(doc(db, 'webhook_deliveries', deliveryId), {
          status: 'success',
          httpStatus: response.status,
          responseBody: attempt.responseBody,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          attempts: [...delivery.attempts, attempt],
          deliveredAt: Timestamp.now()
        });

        await this.updateWebhookStats(webhook.id, true);
      } else {
        throw new Error(`HTTP ${response.status}: ${attempt.responseBody}`);
      }
    } catch (error) {
      attempt.error = error instanceof Error ? error.message : 'Unknown error';
      
      const shouldRetry = this.shouldRetry(webhook.retryPolicy, delivery.attempts.length + 1, attempt.httpStatus);
      
      if (shouldRetry) {
        const nextRetryAt = this.calculateNextRetry(webhook.retryPolicy, delivery.attempts.length + 1);
        
        await updateDoc(doc(db, 'webhook_deliveries', deliveryId), {
          status: 'retrying',
          error: attempt.error,
          attempts: [...delivery.attempts, attempt],
          nextRetryAt: Timestamp.fromDate(nextRetryAt)
        });

        // Schedule retry
        setTimeout(() => {
          this.retryDelivery(deliveryId, webhook);
        }, nextRetryAt.getTime() - Date.now());
      } else {
        await updateDoc(doc(db, 'webhook_deliveries', deliveryId), {
          status: 'failed',
          error: attempt.error,
          attempts: [...delivery.attempts, attempt]
        });

        await this.updateWebhookStats(webhook.id, false);
      }
    }
  }

  private async retryDelivery(deliveryId: string, webhook: WebhookEndpoint): Promise<void> {
    try {
      const deliveryDoc = await getDocs(query(
        collection(db, 'webhook_deliveries'),
        where('__name__', '==', deliveryId),
        limit(1)
      ));

      if (!deliveryDoc.empty) {
        const delivery = deliveryDoc.docs[0].data() as WebhookDelivery;
        await this.attemptDelivery(deliveryId, webhook, delivery);
      }
    } catch (error) {
      console.error('Error retrying webhook delivery:', error);
    }
  }

  private shouldRetry(retryPolicy: RetryPolicy, attemptNumber: number, httpStatus?: number): boolean {
    if (attemptNumber > retryPolicy.maxRetries) {
      return false;
    }

    if (httpStatus && !retryPolicy.retryOn.includes(httpStatus)) {
      return false;
    }

    return true;
  }

  private calculateNextRetry(retryPolicy: RetryPolicy, attemptNumber: number): Date {
    const delay = Math.min(
      retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attemptNumber - 1),
      retryPolicy.maxDelay
    );

    return new Date(Date.now() + delay);
  }

  private async updateWebhookStats(webhookId: string, success: boolean): Promise<void> {
    try {
      const webhookRef = doc(db, 'webhook_endpoints', webhookId);
      const updateData: any = {
        lastTriggered: Timestamp.now()
      };

      if (success) {
        updateData.successCount = (await getDocs(query(collection(db, 'webhook_endpoints'), where('__name__', '==', webhookId)))).docs[0]?.data()?.successCount + 1 || 1;
      } else {
        updateData.failureCount = (await getDocs(query(collection(db, 'webhook_endpoints'), where('__name__', '==', webhookId)))).docs[0]?.data()?.failureCount + 1 || 1;
      }

      await updateDoc(webhookRef, updateData);
    } catch (error) {
      console.error('Error updating webhook stats:', error);
    }
  }

  // Stream Management
  async createEventStream(streamData: Omit<EventStream, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'event_streams'), {
        ...streamData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating event stream:', error);
      throw error;
    }
  }

  async subscribeToStream(streamId: string, subscriber: Omit<StreamSubscriber, 'id' | 'subscribedAt'>): Promise<string> {
    try {
      const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const streamRef = doc(db, 'event_streams', streamId);
      const streamDoc = await getDocs(query(collection(db, 'event_streams'), where('__name__', '==', streamId)));
      
      if (!streamDoc.empty) {
        const stream = streamDoc.docs[0].data() as EventStream;
        const updatedSubscribers = [
          ...stream.subscribers,
          {
            ...subscriber,
            id: subscriberId,
            subscribedAt: new Date()
          }
        ];

        await updateDoc(streamRef, {
          subscribers: updatedSubscribers,
          updatedAt: Timestamp.now()
        });
      }

      return subscriberId;
    } catch (error) {
      console.error('Error subscribing to stream:', error);
      throw error;
    }
  }

  private async deliverToStreams(event: RealTimeEvent): Promise<void> {
    try {
      const streams = await this.getEventStreams();
      const relevantStreams = streams.filter(stream => 
        stream.isActive && stream.events.includes(event.type)
      );

      for (const stream of relevantStreams) {
        const relevantSubscribers = stream.subscribers.filter(sub => 
          sub.isActive && this.matchesFilters(event, sub.filters)
        );

        await Promise.all(relevantSubscribers.map(subscriber => 
          this.deliverToSubscriber(subscriber, event)
        ));
      }
    } catch (error) {
      console.error('Error delivering to streams:', error);
    }
  }

  private async deliverToSubscriber(subscriber: StreamSubscriber, event: RealTimeEvent): Promise<void> {
    try {
      switch (subscriber.type) {
        case 'webhook':
          // Deliver via HTTP POST
          await fetch(subscriber.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: event.id,
              type: event.type,
              data: event.data,
              timestamp: event.metadata.timestamp.toISOString()
            })
          });
          break;
        
        case 'websocket':
          // In a real implementation, this would send via WebSocket
          console.log(`WebSocket delivery to ${subscriber.endpoint}:`, event.type);
          break;
        
        case 'sse':
          // In a real implementation, this would send via Server-Sent Events
          console.log(`SSE delivery to ${subscriber.endpoint}:`, event.type);
          break;
      }
    } catch (error) {
      console.error(`Error delivering to ${subscriber.type} subscriber:`, error);
    }
  }

  async getEventStreams(): Promise<EventStream[]> {
    try {
      const snapshot = await getDocs(query(
        collection(db, 'event_streams'),
        orderBy('createdAt', 'desc')
      ));

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        subscribers: doc.data().subscribers.map((sub: any) => ({
          ...sub,
          subscribedAt: sub.subscribedAt.toDate()
        }))
      } as EventStream));
    } catch (error) {
      console.error('Error fetching event streams:', error);
      throw error;
    }
  }

  // Webhook Deliveries
  async getWebhookDeliveries(webhookId?: string, limit: number = 50): Promise<WebhookDelivery[]> {
    try {
      let q = query(
        collection(db, 'webhook_deliveries'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      if (webhookId) {
        q = query(
          collection(db, 'webhook_deliveries'),
          where('webhookId', '==', webhookId),
          orderBy('createdAt', 'desc'),
          limit(limit)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate(),
        nextRetryAt: doc.data().nextRetryAt?.toDate(),
        attempts: doc.data().attempts.map((attempt: any) => ({
          ...attempt,
          timestamp: attempt.timestamp.toDate()
        }))
      } as WebhookDelivery));
    } catch (error) {
      console.error('Error fetching webhook deliveries:', error);
      throw error;
    }
  }

  // Utility Methods
  private generateSecret(): string {
    return `whsec_${Math.random().toString(36).substr(2, 32)}`;
  }

  private generateSignature(payload: string, secret: string): string {
    // In a real implementation, use HMAC-SHA256
    const crypto = require('crypto');
    return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  }

  // Predefined Event Types
  getAvailableEvents(): WebhookEvent[] {
    return [
      {
        type: 'ride.created',
        description: 'A new ride has been created',
        schema: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
            passengerId: { type: 'string' },
            pickup: { type: 'object' },
            destination: { type: 'object' },
            status: { type: 'string' }
          }
        },
        example: {
          rideId: 'ride_123',
          passengerId: 'user_456',
          pickup: { latitude: 40.7128, longitude: -74.0060 },
          destination: { latitude: 40.7589, longitude: -73.9851 },
          status: 'requested'
        }
      },
      {
        type: 'ride.accepted',
        description: 'A ride has been accepted by a driver',
        schema: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
            driverId: { type: 'string' },
            estimatedArrival: { type: 'string' }
          }
        },
        example: {
          rideId: 'ride_123',
          driverId: 'driver_789',
          estimatedArrival: '2023-12-08T15:30:00Z'
        }
      },
      {
        type: 'ride.completed',
        description: 'A ride has been completed',
        schema: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
            fare: { type: 'number' },
            distance: { type: 'number' },
            duration: { type: 'number' }
          }
        },
        example: {
          rideId: 'ride_123',
          fare: 25.50,
          distance: 5.2,
          duration: 15
        }
      },
      {
        type: 'user.created',
        description: 'A new user has been registered',
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' }
          }
        },
        example: {
          userId: 'user_123',
          email: 'user@example.com',
          role: 'passenger'
        }
      },
      {
        type: 'payment.processed',
        description: 'A payment has been processed',
        schema: {
          type: 'object',
          properties: {
            paymentId: { type: 'string' },
            rideId: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string' }
          }
        },
        example: {
          paymentId: 'pay_123',
          rideId: 'ride_456',
          amount: 25.50,
          status: 'completed'
        }
      }
    ];
  }

  // Default Retry Policy
  getDefaultRetryPolicy(): RetryPolicy {
    return {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      retryOn: [408, 429, 500, 502, 503, 504] // Timeout, rate limit, server errors
    };
  }

  // Cleanup
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

export const webhookService = new WebhookService();