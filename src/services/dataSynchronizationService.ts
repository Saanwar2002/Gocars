/**
 * Data Synchronization Service
 * Real-time data synchronization with external systems and conflict resolution
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
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Data Synchronization Types
export interface SyncConfiguration {
  id: string;
  name: string;
  description: string;
  sourceSystem: SyncEndpoint;
  targetSystem: SyncEndpoint;
  entities: EntityMapping[];
  schedule: SyncSchedule;
  conflictResolution: ConflictResolutionStrategy;
  transformations: DataTransformation[];
  filters: SyncFilter[];
  isActive: boolean;
  lastSync?: Date;
  nextSync?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncEndpoint {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'webhook' | 'queue';
  connectionConfig: ConnectionConfig;
  authentication: AuthenticationConfig;
  rateLimits?: RateLimit[];
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  baseUrl?: string;
  apiVersion?: string;
  timeout: number;
  retryAttempts: number;
  customHeaders?: { [key: string]: string };
  customParams?: { [key: string]: any };
}

export interface AuthenticationConfig {
  type: 'none' | 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token' | 'certificate';
  credentials: { [key: string]: string };
  tokenRefreshUrl?: string;
  expiresAt?: Date;
}

export interface EntityMapping {
  sourceEntity: string;
  targetEntity: string;
  fieldMappings: FieldMapping[];
  primaryKey: string;
  syncDirection: 'bidirectional' | 'source_to_target' | 'target_to_source';
  deleteStrategy: 'soft_delete' | 'hard_delete' | 'archive' | 'ignore';
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
  isRequired: boolean;
  defaultValue?: any;
  transformation?: DataTransformation;
  validation?: FieldValidation;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: 'format' | 'calculate' | 'lookup' | 'aggregate' | 'custom';
  config: TransformationConfig;
  inputFields: string[];
  outputField: string;
}

export interface TransformationConfig {
  format?: string; // For date/number formatting
  formula?: string; // For calculations
  lookupTable?: { [key: string]: any }; // For lookups
  aggregateFunction?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  customScript?: string; // For custom transformations
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minValue?: number;
  maxValue?: number;
  allowedValues?: any[];
}

export interface SyncSchedule {
  type: 'manual' | 'interval' | 'cron' | 'event_driven';
  interval?: number; // minutes
  cronExpression?: string;
  timezone?: string;
  eventTriggers?: string[];
}

export interface ConflictResolutionStrategy {
  strategy: 'source_wins' | 'target_wins' | 'latest_wins' | 'merge' | 'manual' | 'custom';
  customResolver?: string;
  conflictFields?: string[];
  notificationSettings?: ConflictNotificationSettings;
}

export interface ConflictNotificationSettings {
  enabled: boolean;
  recipients: string[];
  escalationLevel: 'info' | 'warning' | 'error' | 'critical';
}

export interface SyncFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between' | 'is_null' | 'is_not_null';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface SyncSession {
  id: string;
  configurationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  type: 'full' | 'incremental' | 'delta';
  direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  recordsSkipped: number;
  conflicts: SyncConflict[];
  errors: SyncError[];
  metadata: SyncMetadata;
}

export interface SyncConflict {
  id: string;
  recordId: string;
  entity: string;
  conflictType: 'field_mismatch' | 'concurrent_update' | 'delete_conflict' | 'validation_error';
  sourceValue: any;
  targetValue: any;
  conflictingFields: string[];
  resolution?: ConflictResolution;
  resolvedAt?: Date;
  resolvedBy?: string;
  timestamp: Date;
}

export interface ConflictResolution {
  strategy: 'accept_source' | 'accept_target' | 'merge' | 'custom';
  resolvedValue?: any;
  notes?: string;
}

export interface SyncError {
  id: string;
  recordId?: string;
  entity?: string;
  errorType: 'connection' | 'authentication' | 'validation' | 'transformation' | 'permission' | 'unknown';
  message: string;
  details?: any;
  stackTrace?: string;
  timestamp: Date;
  isRetryable: boolean;
}

export interface SyncMetadata {
  sourceChecksum?: string;
  targetChecksum?: string;
  lastModified?: Date;
  version?: string;
  customFields?: { [key: string]: any };
}

export interface RealTimeSyncEvent {
  id: string;
  configurationId: string;
  entity: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  source: string;
  processed: boolean;
}

export interface SyncMetrics {
  configurationId: string;
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  averageDuration: number;
  totalRecordsProcessed: number;
  totalConflicts: number;
  totalErrors: number;
  lastSyncTime?: Date;
  uptime: number; // percentage
  throughput: number; // records per minute
}

class DataSynchronizationService {
  private realtimeListeners: Map<string, Unsubscribe> = new Map();
  private syncQueue: RealTimeSyncEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startRealtimeProcessor();
  }

  // Sync Configuration Management
  async createSyncConfiguration(configData: Omit<SyncConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'sync_configurations'), {
        ...configData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastSync: configData.lastSync ? Timestamp.fromDate(configData.lastSync) : null,
        nextSync: configData.nextSync ? Timestamp.fromDate(configData.nextSync) : null
      });
      
      // Start real-time monitoring if active
      if (configData.isActive && configData.schedule.type === 'event_driven') {
        this.startRealtimeMonitoring(docRef.id);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating sync configuration:', error);
      throw error;
    }
  }

  async getSyncConfigurations(userId?: string): Promise<SyncConfiguration[]> {
    try {
      let q = query(
        collection(db, 'sync_configurations'),
        orderBy('createdAt', 'desc')
      );

      if (userId) {
        q = query(
          collection(db, 'sync_configurations'),
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
        lastSync: doc.data().lastSync?.toDate(),
        nextSync: doc.data().nextSync?.toDate()
      } as SyncConfiguration));
    } catch (error) {
      console.error('Error fetching sync configurations:', error);
      throw error;
    }
  }

  async updateSyncConfiguration(configId: string, updates: Partial<SyncConfiguration>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      if (updates.lastSync) {
        updateData.lastSync = Timestamp.fromDate(updates.lastSync);
      }
      if (updates.nextSync) {
        updateData.nextSync = Timestamp.fromDate(updates.nextSync);
      }

      await updateDoc(doc(db, 'sync_configurations', configId), updateData);

      // Update real-time monitoring
      if (updates.isActive !== undefined) {
        if (updates.isActive) {
          this.startRealtimeMonitoring(configId);
        } else {
          this.stopRealtimeMonitoring(configId);
        }
      }
    } catch (error) {
      console.error('Error updating sync configuration:', error);
      throw error;
    }
  }

  async deleteSyncConfiguration(configId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'sync_configurations', configId));
      this.stopRealtimeMonitoring(configId);
    } catch (error) {
      console.error('Error deleting sync configuration:', error);
      throw error;
    }
  }

  // Sync Execution
  async startSync(configId: string, type: 'full' | 'incremental' | 'delta' = 'incremental'): Promise<string> {
    try {
      const configurations = await this.getSyncConfigurations();
      const config = configurations.find(c => c.id === configId);
      
      if (!config) {
        throw new Error('Sync configuration not found');
      }

      if (!config.isActive) {
        throw new Error('Sync configuration is not active');
      }

      const session: Omit<SyncSession, 'id'> = {
        configurationId: configId,
        status: 'pending',
        type,
        direction: config.entities[0]?.syncDirection || 'bidirectional',
        startedAt: new Date(),
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        recordsSkipped: 0,
        conflicts: [],
        errors: [],
        metadata: {
          version: '1.0.0'
        }
      };

      const docRef = await addDoc(collection(db, 'sync_sessions'), {
        ...session,
        startedAt: Timestamp.now()
      });

      // Start async sync process
      this.executeSync(docRef.id, config, type);

      return docRef.id;
    } catch (error) {
      console.error('Error starting sync:', error);
      throw error;
    }
  }

  private async executeSync(sessionId: string, config: SyncConfiguration, type: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'sync_sessions', sessionId), {
        status: 'running'
      });

      const startTime = Date.now();
      let totalProcessed = 0;
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalDeleted = 0;
      let totalSkipped = 0;
      const conflicts: SyncConflict[] = [];
      const errors: SyncError[] = [];

      // Process each entity mapping
      for (const entityMapping of config.entities) {
        try {
          const result = await this.syncEntity(config, entityMapping, type);
          
          totalProcessed += result.processed;
          totalCreated += result.created;
          totalUpdated += result.updated;
          totalDeleted += result.deleted;
          totalSkipped += result.skipped;
          conflicts.push(...result.conflicts);
          errors.push(...result.errors);

          // Update progress
          await updateDoc(doc(db, 'sync_sessions', sessionId), {
            recordsProcessed: totalProcessed,
            recordsCreated: totalCreated,
            recordsUpdated: totalUpdated,
            recordsDeleted: totalDeleted,
            recordsSkipped: totalSkipped,
            conflicts,
            errors
          });

        } catch (error) {
          errors.push({
            id: `error_${Date.now()}`,
            entity: entityMapping.sourceEntity,
            errorType: 'unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            isRetryable: true
          });
        }
      }

      const duration = Date.now() - startTime;
      const status = errors.length > 0 ? 'failed' : 'completed';

      await updateDoc(doc(db, 'sync_sessions', sessionId), {
        status,
        completedAt: Timestamp.now(),
        duration,
        recordsProcessed: totalProcessed,
        recordsCreated: totalCreated,
        recordsUpdated: totalUpdated,
        recordsDeleted: totalDeleted,
        recordsSkipped: totalSkipped,
        conflicts,
        errors
      });

      // Update configuration last sync time
      await updateDoc(doc(db, 'sync_configurations', config.id), {
        lastSync: Timestamp.now(),
        nextSync: this.calculateNextSync(config.schedule)
      });

    } catch (error) {
      await updateDoc(doc(db, 'sync_sessions', sessionId), {
        status: 'failed',
        completedAt: Timestamp.now(),
        errors: [{
          id: `error_${Date.now()}`,
          errorType: 'unknown',
          message: error instanceof Error ? error.message : 'Sync execution failed',
          timestamp: new Date(),
          isRetryable: true
        }]
      });
    }
  }

  private async syncEntity(config: SyncConfiguration, entityMapping: EntityMapping, type: string): Promise<{
    processed: number;
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
    conflicts: SyncConflict[];
    errors: SyncError[];
  }> {
    // Mock entity synchronization
    const mockResult = {
      processed: Math.floor(Math.random() * 1000) + 100,
      created: Math.floor(Math.random() * 50) + 10,
      updated: Math.floor(Math.random() * 100) + 20,
      deleted: Math.floor(Math.random() * 10) + 1,
      skipped: Math.floor(Math.random() * 20) + 5,
      conflicts: [] as SyncConflict[],
      errors: [] as SyncError[]
    };

    // Simulate some conflicts
    if (Math.random() < 0.3) {
      mockResult.conflicts.push({
        id: `conflict_${Date.now()}`,
        recordId: `record_${Math.floor(Math.random() * 1000)}`,
        entity: entityMapping.sourceEntity,
        conflictType: 'field_mismatch',
        sourceValue: 'source_value',
        targetValue: 'target_value',
        conflictingFields: ['field1', 'field2'],
        timestamp: new Date()
      });
    }

    // Simulate some errors
    if (Math.random() < 0.2) {
      mockResult.errors.push({
        id: `error_${Date.now()}`,
        recordId: `record_${Math.floor(Math.random() * 1000)}`,
        entity: entityMapping.sourceEntity,
        errorType: 'validation',
        message: 'Validation failed for required field',
        timestamp: new Date(),
        isRetryable: true
      });
    }

    return mockResult;
  }

  private calculateNextSync(schedule: SyncSchedule): Timestamp | null {
    if (schedule.type === 'manual' || schedule.type === 'event_driven') {
      return null;
    }

    const now = new Date();
    let nextSync: Date;

    if (schedule.type === 'interval' && schedule.interval) {
      nextSync = new Date(now.getTime() + schedule.interval * 60 * 1000);
    } else if (schedule.type === 'cron' && schedule.cronExpression) {
      // In a real implementation, use a cron parser library
      nextSync = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Mock: next day
    } else {
      nextSync = new Date(now.getTime() + 60 * 60 * 1000); // Default: 1 hour
    }

    return Timestamp.fromDate(nextSync);
  }

  // Real-time Monitoring
  private startRealtimeMonitoring(configId: string): void {
    if (this.realtimeListeners.has(configId)) {
      return; // Already monitoring
    }

    // Mock real-time monitoring setup
    console.log(`Starting real-time monitoring for config: ${configId}`);
    
    // In a real implementation, this would set up database triggers or event listeners
    const mockListener = () => {
      // Mock cleanup function
      console.log(`Stopped monitoring config: ${configId}`);
    };

    this.realtimeListeners.set(configId, mockListener);
  }

  private stopRealtimeMonitoring(configId: string): void {
    const listener = this.realtimeListeners.get(configId);
    if (listener) {
      listener();
      this.realtimeListeners.delete(configId);
    }
  }

  private startRealtimeProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      if (this.syncQueue.length > 0) {
        const events = this.syncQueue.splice(0, 10); // Process up to 10 events at a time
        await Promise.all(events.map(event => this.processRealtimeEvent(event)));
      }
    }, 1000); // Process every second
  }

  private async processRealtimeEvent(event: RealTimeSyncEvent): Promise<void> {
    try {
      // Mark event as processed
      event.processed = true;

      // Store event for audit trail
      await addDoc(collection(db, 'realtime_sync_events'), {
        ...event,
        timestamp: Timestamp.now()
      });

      // Trigger sync if needed
      const configurations = await this.getSyncConfigurations();
      const relevantConfigs = configurations.filter(config => 
        config.isActive && 
        config.schedule.type === 'event_driven' &&
        config.schedule.eventTriggers?.includes(event.operation)
      );

      for (const config of relevantConfigs) {
        await this.startSync(config.id, 'delta');
      }

    } catch (error) {
      console.error('Error processing real-time event:', error);
    }
  }

  // Conflict Resolution
  async resolveConflict(conflictId: string, resolution: ConflictResolution, userId: string): Promise<void> {
    try {
      // Find and update the conflict
      const sessionsQuery = query(
        collection(db, 'sync_sessions'),
        where('conflicts', 'array-contains-any', [{ id: conflictId }])
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      for (const sessionDoc of sessionsSnapshot.docs) {
        const session = sessionDoc.data() as SyncSession;
        const updatedConflicts = session.conflicts.map(conflict => 
          conflict.id === conflictId 
            ? { 
                ...conflict, 
                resolution, 
                resolvedAt: new Date(), 
                resolvedBy: userId 
              }
            : conflict
        );

        await updateDoc(sessionDoc.ref, {
          conflicts: updatedConflicts
        });
      }

    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  async getUnresolvedConflicts(configId?: string): Promise<SyncConflict[]> {
    try {
      let q = query(
        collection(db, 'sync_sessions'),
        orderBy('startedAt', 'desc'),
        limit(100)
      );

      if (configId) {
        q = query(
          collection(db, 'sync_sessions'),
          where('configurationId', '==', configId),
          orderBy('startedAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      const allConflicts: SyncConflict[] = [];

      snapshot.docs.forEach(doc => {
        const session = doc.data() as SyncSession;
        const unresolvedConflicts = session.conflicts.filter(conflict => !conflict.resolution);
        allConflicts.push(...unresolvedConflicts);
      });

      return allConflicts;
    } catch (error) {
      console.error('Error fetching unresolved conflicts:', error);
      throw error;
    }
  }

  // Sync Sessions
  async getSyncSessions(configId?: string, limit: number = 50): Promise<SyncSession[]> {
    try {
      let q = query(
        collection(db, 'sync_sessions'),
        orderBy('startedAt', 'desc'),
        limit(limit)
      );

      if (configId) {
        q = query(
          collection(db, 'sync_sessions'),
          where('configurationId', '==', configId),
          orderBy('startedAt', 'desc'),
          limit(limit)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        conflicts: doc.data().conflicts.map((conflict: any) => ({
          ...conflict,
          timestamp: conflict.timestamp.toDate(),
          resolvedAt: conflict.resolvedAt?.toDate()
        })),
        errors: doc.data().errors.map((error: any) => ({
          ...error,
          timestamp: error.timestamp.toDate()
        }))
      } as SyncSession));
    } catch (error) {
      console.error('Error fetching sync sessions:', error);
      throw error;
    }
  }

  // Metrics and Analytics
  async getSyncMetrics(configId: string): Promise<SyncMetrics> {
    try {
      const sessions = await this.getSyncSessions(configId, 100);
      
      const totalSessions = sessions.length;
      const successfulSessions = sessions.filter(s => s.status === 'completed').length;
      const failedSessions = sessions.filter(s => s.status === 'failed').length;
      
      const completedSessions = sessions.filter(s => s.duration);
      const averageDuration = completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length
        : 0;

      const totalRecordsProcessed = sessions.reduce((sum, s) => sum + s.recordsProcessed, 0);
      const totalConflicts = sessions.reduce((sum, s) => sum + s.conflicts.length, 0);
      const totalErrors = sessions.reduce((sum, s) => sum + s.errors.length, 0);
      
      const lastSyncTime = sessions.length > 0 ? sessions[0].startedAt : undefined;
      const uptime = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0;
      const throughput = averageDuration > 0 ? (totalRecordsProcessed / (averageDuration / 60000)) : 0;

      return {
        configurationId: configId,
        totalSessions,
        successfulSessions,
        failedSessions,
        averageDuration,
        totalRecordsProcessed,
        totalConflicts,
        totalErrors,
        lastSyncTime,
        uptime,
        throughput
      };
    } catch (error) {
      console.error('Error calculating sync metrics:', error);
      throw error;
    }
  }

  // Data Transformation
  async applyTransformation(data: any, transformation: DataTransformation): Promise<any> {
    try {
      switch (transformation.type) {
        case 'format':
          return this.applyFormatTransformation(data, transformation);
        case 'calculate':
          return this.applyCalculationTransformation(data, transformation);
        case 'lookup':
          return this.applyLookupTransformation(data, transformation);
        case 'aggregate':
          return this.applyAggregateTransformation(data, transformation);
        case 'custom':
          return this.applyCustomTransformation(data, transformation);
        default:
          return data;
      }
    } catch (error) {
      console.error('Error applying transformation:', error);
      throw error;
    }
  }

  private applyFormatTransformation(data: any, transformation: DataTransformation): any {
    // Mock format transformation
    const value = this.getNestedValue(data, transformation.inputFields[0]);
    
    if (transformation.config.format === 'date') {
      return new Date(value).toISOString();
    } else if (transformation.config.format === 'currency') {
      return parseFloat(value).toFixed(2);
    }
    
    return value;
  }

  private applyCalculationTransformation(data: any, transformation: DataTransformation): any {
    // Mock calculation transformation
    const values = transformation.inputFields.map(field => 
      parseFloat(this.getNestedValue(data, field)) || 0
    );
    
    // Simple sum calculation as example
    return values.reduce((sum, val) => sum + val, 0);
  }

  private applyLookupTransformation(data: any, transformation: DataTransformation): any {
    // Mock lookup transformation
    const key = this.getNestedValue(data, transformation.inputFields[0]);
    return transformation.config.lookupTable?.[key] || key;
  }

  private applyAggregateTransformation(data: any, transformation: DataTransformation): any {
    // Mock aggregate transformation
    if (!Array.isArray(data)) return data;
    
    const values = data.map(item => 
      parseFloat(this.getNestedValue(item, transformation.inputFields[0])) || 0
    );
    
    switch (transformation.config.aggregateFunction) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'count':
        return values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return data;
    }
  }

  private applyCustomTransformation(data: any, transformation: DataTransformation): any {
    // Mock custom transformation
    // In a real implementation, this would execute the custom script safely
    return data;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Cleanup
  destroy(): void {
    // Stop all real-time listeners
    this.realtimeListeners.forEach(listener => listener());
    this.realtimeListeners.clear();

    // Stop processing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Predefined Templates
  getSyncTemplates(): Partial<SyncConfiguration>[] {
    return [
      {
        name: 'User Data Sync',
        description: 'Synchronize user data between systems',
        entities: [{
          sourceEntity: 'users',
          targetEntity: 'customers',
          fieldMappings: [
            { sourceField: 'id', targetField: 'customer_id', dataType: 'string', isRequired: true },
            { sourceField: 'email', targetField: 'email_address', dataType: 'string', isRequired: true },
            { sourceField: 'name', targetField: 'full_name', dataType: 'string', isRequired: true }
          ],
          primaryKey: 'id',
          syncDirection: 'bidirectional',
          deleteStrategy: 'soft_delete'
        }],
        schedule: {
          type: 'interval',
          interval: 60 // 1 hour
        },
        conflictResolution: {
          strategy: 'latest_wins'
        },
        transformations: [],
        filters: []
      },
      {
        name: 'Order Data Sync',
        description: 'Synchronize order/ride data',
        entities: [{
          sourceEntity: 'rides',
          targetEntity: 'orders',
          fieldMappings: [
            { sourceField: 'id', targetField: 'order_id', dataType: 'string', isRequired: true },
            { sourceField: 'passenger_id', targetField: 'customer_id', dataType: 'string', isRequired: true },
            { sourceField: 'fare', targetField: 'total_amount', dataType: 'number', isRequired: true },
            { sourceField: 'status', targetField: 'order_status', dataType: 'string', isRequired: true }
          ],
          primaryKey: 'id',
          syncDirection: 'source_to_target',
          deleteStrategy: 'archive'
        }],
        schedule: {
          type: 'event_driven',
          eventTriggers: ['create', 'update']
        },
        conflictResolution: {
          strategy: 'source_wins'
        },
        transformations: [],
        filters: []
      }
    ];
  }
}

export const dataSynchronizationService = new DataSynchronizationService();