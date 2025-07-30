/**
 * Data Transparency Service
 * Provides comprehensive transparency into data usage, access logs,
 * and user control features for data sharing and privacy management
 */

export interface DataAccessLog {
  id: string;
  userId: string;
  dataType: 'profile' | 'location' | 'payment' | 'ride_history' | 'communication' | 'analytics';
  accessType: 'read' | 'write' | 'delete' | 'export' | 'share';
  accessor: string; // Who accessed the data
  accessorType: 'user' | 'system' | 'admin' | 'third_party' | 'analytics';
  purpose: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  dataFields: string[];
  legalBasis: string;
  consentRequired: boolean;
  consentGiven: boolean;
  duration: number; // Access duration in milliseconds
  result: 'success' | 'denied' | 'error';
  reason?: string;
}

export interface DataSharingAgreement {
  id: string;
  userId: string;
  recipientName: string;
  recipientType: 'partner' | 'service_provider' | 'analytics' | 'marketing' | 'legal';
  dataTypes: string[];
  purpose: string;
  legalBasis: string;
  consentGiven: boolean;
  consentDate: Date;
  expiryDate?: Date;
  active: boolean;
  dataMinimization: boolean;
  encryptionRequired: boolean;
  retentionPeriod: number;
  deletionDate?: Date;
  userCanRevoke: boolean;
  lastShared?: Date;
  shareCount: number;
}

export interface PrivacyControl {
  id: string;
  userId: string;
  controlType: 'data_sharing' | 'analytics' | 'marketing' | 'location' | 'communication';
  setting: 'allow' | 'deny' | 'ask' | 'minimal';
  scope: 'all' | 'specific' | 'partners_only' | 'internal_only';
  conditions: PrivacyCondition[];
  lastUpdated: Date;
  effectiveFrom: Date;
  expiryDate?: Date;
  userDefined: boolean;
}

export interface PrivacyCondition {
  type: 'time_based' | 'location_based' | 'purpose_based' | 'recipient_based';
  condition: string;
  value: any;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
}

export interface DataUsageReport {
  userId: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  totalAccesses: number;
  accessesByType: Record<string, number>;
  accessesByPurpose: Record<string, number>;
  dataShared: {
    recipients: string[];
    dataTypes: string[];
    totalShares: number;
  };
  privacyViolations: PrivacyViolation[];
  recommendations: string[];
  generatedAt: Date;
}

export interface PrivacyViolation {
  id: string;
  type: 'unauthorized_access' | 'consent_violation' | 'retention_violation' | 'sharing_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  affectedData: string[];
  impact: string;
}

export interface TransparencyPreferences {
  userId: string;
  emailNotifications: boolean;
  realTimeAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  accessLogRetention: number; // days
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
  alertThresholds: {
    unusualAccess: boolean;
    newDataSharing: boolean;
    privacyViolations: boolean;
    consentExpiry: boolean;
  };
  lastUpdated: Date;
}

class DataTransparencyService {
  private accessLogs = new Map<string, DataAccessLog[]>();
  private sharingAgreements = new Map<string, DataSharingAgreement[]>();
  private privacyControls = new Map<string, PrivacyControl[]>();
  private privacyViolations = new Map<string, PrivacyViolation[]>();
  private transparencyPreferences = new Map<string, TransparencyPreferences>();

  /**
   * Initialize data transparency service
   */
  async initialize(): Promise<void> {
    try {
      // Load existing data
      await this.loadTransparencyData();
      
      // Start monitoring for privacy violations
      this.startPrivacyMonitoring();
      
      // Schedule regular reports
      this.scheduleTransparencyReports();
      
      console.log('Data transparency service initialized successfully');
    } catch (error) {
      console.error('Error initializing data transparency service:', error);
    }
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    dataType: DataAccessLog['dataType'],
    accessType: DataAccessLog['accessType'],
    accessor: string,
    accessorType: DataAccessLog['accessorType'],
    purpose: string,
    dataFields: string[],
    legalBasis: string,
    consentRequired: boolean = true,
    consentGiven: boolean = false
  ): Promise<DataAccessLog> {
    try {
      const accessLog: DataAccessLog = {
        id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        dataType,
        accessType,
        accessor,
        accessorType,
        purpose,
        timestamp: new Date(),
        ipAddress: 'unknown', // In production, capture real IP
        userAgent: navigator.userAgent,
        dataFields,
        legalBasis,
        consentRequired,
        consentGiven,
        duration: 0,
        result: consentRequired && !consentGiven ? 'denied' : 'success'
      };

      // Store access log
      const userLogs = this.accessLogs.get(userId) || [];
      userLogs.push(accessLog);
      this.accessLogs.set(userId, userLogs);

      // Persist to storage
      localStorage.setItem(`access_logs_${userId}`, JSON.stringify(userLogs.slice(-1000))); // Keep last 1000 logs

      // Check for privacy violations
      await this.checkForPrivacyViolations(userId, accessLog);

      // Send real-time alerts if enabled
      await this.sendTransparencyAlert(userId, 'data_access', accessLog);

      console.log(`Data access logged for user ${userId}: ${dataType} by ${accessor}`);
      return accessLog;
    } catch (error) {
      console.error('Error logging data access:', error);
      throw error;
    }
  }

  /**
   * Create data sharing agreement
   */
  async createDataSharingAgreement(
    userId: string,
    recipientName: string,
    recipientType: DataSharingAgreement['recipientType'],
    dataTypes: string[],
    purpose: string,
    legalBasis: string,
    retentionPeriod: number,
    userCanRevoke: boolean = true
  ): Promise<DataSharingAgreement> {
    try {
      const agreement: DataSharingAgreement = {
        id: `sharing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        recipientName,
        recipientType,
        dataTypes,
        purpose,
        legalBasis,
        consentGiven: false, // Will be set when user consents
        consentDate: new Date(),
        active: false,
        dataMinimization: true,
        encryptionRequired: true,
        retentionPeriod,
        userCanRevoke,
        shareCount: 0
      };

      // Store agreement
      const userAgreements = this.sharingAgreements.get(userId) || [];
      userAgreements.push(agreement);
      this.sharingAgreements.set(userId, userAgreements);

      // Persist to storage
      localStorage.setItem(`sharing_agreements_${userId}`, JSON.stringify(userAgreements));

      console.log(`Data sharing agreement created for user ${userId} with ${recipientName}`);
      return agreement;
    } catch (error) {
      console.error('Error creating data sharing agreement:', error);
      throw error;
    }
  }

  /**
   * Update data sharing consent
   */
  async updateSharingConsent(
    userId: string,
    agreementId: string,
    consentGiven: boolean
  ): Promise<void> {
    try {
      const userAgreements = this.sharingAgreements.get(userId) || [];
      const agreement = userAgreements.find(a => a.id === agreementId);

      if (!agreement) {
        throw new Error('Data sharing agreement not found');
      }

      agreement.consentGiven = consentGiven;
      agreement.active = consentGiven;
      agreement.consentDate = new Date();

      if (!consentGiven) {
        agreement.deletionDate = new Date();
      }

      // Persist changes
      localStorage.setItem(`sharing_agreements_${userId}`, JSON.stringify(userAgreements));

      // Log the consent change
      await this.logDataAccess(
        userId,
        'profile',
        'write',
        'user',
        'user',
        `Data sharing consent ${consentGiven ? 'granted' : 'revoked'} for ${agreement.recipientName}`,
        ['consent'],
        'consent',
        false,
        true
      );

      console.log(`Data sharing consent ${consentGiven ? 'granted' : 'revoked'} for agreement ${agreementId}`);
    } catch (error) {
      console.error('Error updating sharing consent:', error);
      throw error;
    }
  }

  /**
   * Create privacy control
   */
  async createPrivacyControl(
    userId: string,
    controlType: PrivacyControl['controlType'],
    setting: PrivacyControl['setting'],
    scope: PrivacyControl['scope'],
    conditions: PrivacyCondition[] = [],
    expiryDate?: Date
  ): Promise<PrivacyControl> {
    try {
      const control: PrivacyControl = {
        id: `control_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        controlType,
        setting,
        scope,
        conditions,
        lastUpdated: new Date(),
        effectiveFrom: new Date(),
        expiryDate,
        userDefined: true
      };

      // Store control
      const userControls = this.privacyControls.get(userId) || [];
      userControls.push(control);
      this.privacyControls.set(userId, userControls);

      // Persist to storage
      localStorage.setItem(`privacy_controls_${userId}`, JSON.stringify(userControls));

      console.log(`Privacy control created for user ${userId}: ${controlType} = ${setting}`);
      return control;
    } catch (error) {
      console.error('Error creating privacy control:', error);
      throw error;
    }
  }

  /**
   * Check if data access is allowed based on privacy controls
   */
  async checkDataAccessPermission(
    userId: string,
    dataType: string,
    purpose: string,
    recipient: string
  ): Promise<{ allowed: boolean; reason?: string; conditions?: string[] }> {
    try {
      const userControls = this.privacyControls.get(userId) || [];
      const relevantControls = userControls.filter(control => 
        control.controlType === 'data_sharing' || 
        control.controlType === dataType as any
      );

      for (const control of relevantControls) {
        // Check if control is active
        const now = new Date();
        if (control.effectiveFrom > now || (control.expiryDate && control.expiryDate < now)) {
          continue;
        }

        // Check conditions
        const conditionsMet = await this.evaluatePrivacyConditions(control.conditions, {
          purpose,
          recipient,
          timestamp: now
        });

        if (!conditionsMet) {
          continue;
        }

        // Apply control setting
        switch (control.setting) {
          case 'deny':
            return {
              allowed: false,
              reason: `Access denied by user privacy control: ${control.controlType}`
            };
          case 'allow':
            return { allowed: true };
          case 'ask':
            return {
              allowed: false,
              reason: 'User consent required',
              conditions: ['user_consent_required']
            };
          case 'minimal':
            return {
              allowed: true,
              conditions: ['data_minimization_required']
            };
        }
      }

      // Default to allow if no specific controls
      return { allowed: true };
    } catch (error) {
      console.error('Error checking data access permission:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  /**
   * Generate data usage report
   */
  async generateDataUsageReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataUsageReport> {
    try {
      const userLogs = this.accessLogs.get(userId) || [];
      const periodLogs = userLogs.filter(log => 
        log.timestamp >= startDate && log.timestamp <= endDate
      );

      // Analyze access patterns
      const accessesByType: Record<string, number> = {};
      const accessesByPurpose: Record<string, number> = {};

      periodLogs.forEach(log => {
        accessesByType[log.dataType] = (accessesByType[log.dataType] || 0) + 1;
        accessesByPurpose[log.purpose] = (accessesByPurpose[log.purpose] || 0) + 1;
      });

      // Get data sharing information
      const userAgreements = this.sharingAgreements.get(userId) || [];
      const activeAgreements = userAgreements.filter(a => a.active);

      // Get privacy violations
      const userViolations = this.privacyViolations.get(userId) || [];
      const periodViolations = userViolations.filter(v => 
        v.detectedAt >= startDate && v.detectedAt <= endDate
      );

      // Generate recommendations
      const recommendations = this.generatePrivacyRecommendations(
        periodLogs,
        activeAgreements,
        periodViolations
      );

      const report: DataUsageReport = {
        userId,
        reportPeriod: { start: startDate, end: endDate },
        totalAccesses: periodLogs.length,
        accessesByType,
        accessesByPurpose,
        dataShared: {
          recipients: activeAgreements.map(a => a.recipientName),
          dataTypes: [...new Set(activeAgreements.flatMap(a => a.dataTypes))],
          totalShares: activeAgreements.reduce((sum, a) => sum + a.shareCount, 0)
        },
        privacyViolations: periodViolations,
        recommendations,
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      console.error('Error generating data usage report:', error);
      throw error;
    }
  }

  /**
   * Get user's data access logs
   */
  async getDataAccessLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0,
    filters?: {
      dataType?: string;
      accessType?: string;
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<{ logs: DataAccessLog[]; total: number }> {
    try {
      let userLogs = this.accessLogs.get(userId) || [];

      // Apply filters
      if (filters) {
        if (filters.dataType) {
          userLogs = userLogs.filter(log => log.dataType === filters.dataType);
        }
        if (filters.accessType) {
          userLogs = userLogs.filter(log => log.accessType === filters.accessType);
        }
        if (filters.dateRange) {
          userLogs = userLogs.filter(log => 
            log.timestamp >= filters.dateRange!.start && 
            log.timestamp <= filters.dateRange!.end
          );
        }
      }

      // Sort by timestamp (newest first)
      userLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const paginatedLogs = userLogs.slice(offset, offset + limit);

      return {
        logs: paginatedLogs,
        total: userLogs.length
      };
    } catch (error) {
      console.error('Error getting data access logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get user's data sharing agreements
   */
  async getDataSharingAgreements(userId: string): Promise<DataSharingAgreement[]> {
    try {
      return this.sharingAgreements.get(userId) || [];
    } catch (error) {
      console.error('Error getting data sharing agreements:', error);
      return [];
    }
  }

  /**
   * Get user's privacy controls
   */
  async getPrivacyControls(userId: string): Promise<PrivacyControl[]> {
    try {
      return this.privacyControls.get(userId) || [];
    } catch (error) {
      console.error('Error getting privacy controls:', error);
      return [];
    }
  }

  /**
   * Update transparency preferences
   */
  async updateTransparencyPreferences(
    userId: string,
    preferences: Partial<TransparencyPreferences>
  ): Promise<void> {
    try {
      const currentPrefs = this.transparencyPreferences.get(userId) || this.getDefaultTransparencyPreferences(userId);
      const updatedPrefs: TransparencyPreferences = {
        ...currentPrefs,
        ...preferences,
        lastUpdated: new Date()
      };

      this.transparencyPreferences.set(userId, updatedPrefs);
      localStorage.setItem(`transparency_prefs_${userId}`, JSON.stringify(updatedPrefs));

      console.log(`Transparency preferences updated for user ${userId}`);
    } catch (error) {
      console.error('Error updating transparency preferences:', error);
      throw error;
    }
  }

  /**
   * Get transparency preferences
   */
  async getTransparencyPreferences(userId: string): Promise<TransparencyPreferences> {
    try {
      return this.transparencyPreferences.get(userId) || this.getDefaultTransparencyPreferences(userId);
    } catch (error) {
      console.error('Error getting transparency preferences:', error);
      return this.getDefaultTransparencyPreferences(userId);
    }
  }

  // Private helper methods

  private async loadTransparencyData(): Promise<void> {
    // In production, load from database
    console.log('Loading transparency data...');
  }

  private startPrivacyMonitoring(): void {
    // In production, set up real-time privacy monitoring
    console.log('Privacy monitoring started');
  }

  private scheduleTransparencyReports(): void {
    // In production, schedule regular transparency reports
    console.log('Transparency reports scheduled');
  }

  private async checkForPrivacyViolations(userId: string, accessLog: DataAccessLog): Promise<void> {
    // Check for unusual access patterns, unauthorized access, etc.
    const userLogs = this.accessLogs.get(userId) || [];
    const recentLogs = userLogs.filter(log => 
      log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    // Example: Check for unusual access frequency
    if (recentLogs.length > 100) {
      await this.reportPrivacyViolation(
        userId,
        'unauthorized_access',
        'high',
        'Unusual access frequency detected',
        [accessLog.dataType]
      );
    }
  }

  private async reportPrivacyViolation(
    userId: string,
    type: PrivacyViolation['type'],
    severity: PrivacyViolation['severity'],
    description: string,
    affectedData: string[]
  ): Promise<void> {
    const violation: PrivacyViolation = {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      description,
      detectedAt: new Date(),
      affectedData,
      impact: `Potential ${severity} impact on user privacy`
    };

    const userViolations = this.privacyViolations.get(userId) || [];
    userViolations.push(violation);
    this.privacyViolations.set(userId, userViolations);

    console.log(`Privacy violation reported for user ${userId}: ${description}`);
  }

  private async sendTransparencyAlert(
    userId: string,
    alertType: string,
    data: any
  ): Promise<void> {
    const preferences = await this.getTransparencyPreferences(userId);
    
    if (preferences.realTimeAlerts) {
      // Send real-time alert
      console.log(`Transparency alert sent to user ${userId}: ${alertType}`);
    }
  }

  private async evaluatePrivacyConditions(
    conditions: PrivacyCondition[],
    context: any
  ): Promise<boolean> {
    // Evaluate all conditions
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(condition: PrivacyCondition, context: any): boolean {
    const contextValue = context[condition.type.replace('_based', '')];
    
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'contains':
        return contextValue && contextValue.includes(condition.value);
      case 'greater_than':
        return contextValue > condition.value;
      case 'less_than':
        return contextValue < condition.value;
      case 'in_range':
        return contextValue >= condition.value.min && contextValue <= condition.value.max;
      default:
        return true;
    }
  }

  private generatePrivacyRecommendations(
    logs: DataAccessLog[],
    agreements: DataSharingAgreement[],
    violations: PrivacyViolation[]
  ): string[] {
    const recommendations: string[] = [];

    if (violations.length > 0) {
      recommendations.push('Review recent privacy violations and consider updating your privacy controls');
    }

    if (agreements.length > 5) {
      recommendations.push('You have many active data sharing agreements. Consider reviewing and revoking unused ones');
    }

    if (logs.filter(l => l.accessorType === 'third_party').length > 50) {
      recommendations.push('High third-party data access detected. Review your data sharing preferences');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your privacy settings look good. Continue monitoring your data usage regularly');
    }

    return recommendations;
  }

  private getDefaultTransparencyPreferences(userId: string): TransparencyPreferences {
    return {
      userId,
      emailNotifications: true,
      realTimeAlerts: false,
      weeklyReports: true,
      monthlyReports: false,
      accessLogRetention: 365,
      detailLevel: 'detailed',
      alertThresholds: {
        unusualAccess: true,
        newDataSharing: true,
        privacyViolations: true,
        consentExpiry: true
      },
      lastUpdated: new Date()
    };
  }
}

export const dataTransparencyService = new DataTransparencyService();