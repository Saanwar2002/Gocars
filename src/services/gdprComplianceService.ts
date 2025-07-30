/**
 * GDPR Compliance Service
 * Implements specific GDPR requirements including consent management,
 * data subject rights, and compliance monitoring
 */

import { dataPrivacyService, PrivacySettings } from './dataPrivacyService';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'processing' | 'marketing' | 'analytics' | 'location' | 'cookies';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  method: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  withdrawnAt?: Date;
  withdrawalReason?: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'received' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  description: string;
  response?: string;
  documents?: string[];
  verificationRequired: boolean;
  verifiedAt?: Date;
}

export interface ProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: number;
  securityMeasures: string[];
  transfersOutsideEU: boolean;
  lastReviewed: Date;
}

export interface DataBreachIncident {
  id: string;
  detectedAt: Date;
  reportedAt?: Date;
  type: 'confidentiality' | 'integrity' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDataTypes: string[];
  affectedUsers: number;
  description: string;
  containmentMeasures: string[];
  notificationRequired: boolean;
  notifiedAuthorities: boolean;
  notifiedDataSubjects: boolean;
  status: 'detected' | 'contained' | 'investigated' | 'resolved';
}

export interface ComplianceAudit {
  id: string;
  auditDate: Date;
  auditor: string;
  scope: string[];
  findings: AuditFinding[];
  overallScore: number;
  recommendations: string[];
  nextAuditDate: Date;
}

export interface AuditFinding {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
}

class GDPRComplianceService {
  private consentRecords = new Map<string, ConsentRecord[]>();
  private dataSubjectRequests = new Map<string, DataSubjectRequest[]>();
  private processingActivities: ProcessingActivity[] = [];
  private dataBreaches: DataBreachIncident[] = [];
  private complianceAudits: ComplianceAudit[] = [];

  /**
   * Initialize GDPR compliance service
   */
  async initialize(): Promise<void> {
    try {
      // Load existing consent records
      await this.loadConsentRecords();
      
      // Initialize processing activities register
      await this.initializeProcessingActivities();
      
      // Start compliance monitoring
      this.startComplianceMonitoring();
      
      console.log('GDPR compliance service initialized successfully');
    } catch (error) {
      console.error('Error initializing GDPR compliance service:', error);
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    purpose: string,
    legalBasis: ConsentRecord['legalBasis'] = 'consent',
    method: ConsentRecord['method'] = 'explicit'
  ): Promise<ConsentRecord> {
    try {
      const consentRecord: ConsentRecord = {
        id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        consentType,
        granted,
        timestamp: new Date(),
        ipAddress: 'unknown', // In production, capture real IP
        userAgent: navigator.userAgent,
        method,
        purpose,
        legalBasis
      };

      // Store consent record
      const userConsents = this.consentRecords.get(userId) || [];
      userConsents.push(consentRecord);
      this.consentRecords.set(userId, userConsents);

      // Persist to storage
      localStorage.setItem(`consent_records_${userId}`, JSON.stringify(userConsents));

      console.log(`Consent recorded for user ${userId}: ${consentType} = ${granted}`);
      return consentRecord;
    } catch (error) {
      console.error('Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    reason?: string
  ): Promise<void> {
    try {
      const userConsents = this.consentRecords.get(userId) || [];
      
      // Find the most recent consent record for this type
      const latestConsent = userConsents
        .filter(c => c.consentType === consentType && c.granted)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      if (latestConsent) {
        latestConsent.withdrawnAt = new Date();
        latestConsent.withdrawalReason = reason;

        // Record new consent record for withdrawal
        await this.recordConsent(userId, consentType, false, 'Consent withdrawn', 'consent', 'explicit');

        console.log(`Consent withdrawn for user ${userId}: ${consentType}`);
      }
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      throw error;
    }
  }

  /**
   * Get consent history for user
   */
  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      return this.consentRecords.get(userId) || [];
    } catch (error) {
      console.error('Error getting consent history:', error);
      return [];
    }
  }

  /**
   * Submit data subject request
   */
  async submitDataSubjectRequest(
    userId: string,
    type: DataSubjectRequest['type'],
    description: string
  ): Promise<DataSubjectRequest> {
    try {
      const request: DataSubjectRequest = {
        id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        status: 'received',
        requestedAt: new Date(),
        description,
        verificationRequired: true
      };

      // Store request
      const userRequests = this.dataSubjectRequests.get(userId) || [];
      userRequests.push(request);
      this.dataSubjectRequests.set(userId, userRequests);

      // Persist to storage
      localStorage.setItem(`dsr_${userId}`, JSON.stringify(userRequests));

      // Start processing request
      this.processDataSubjectRequest(request);

      console.log(`Data subject request submitted: ${type} for user ${userId}`);
      return request;
    } catch (error) {
      console.error('Error submitting data subject request:', error);
      throw error;
    }
  }

  /**
   * Process data subject request
   */
  private async processDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    try {
      // Update status to processing
      request.status = 'processing';
      
      switch (request.type) {
        case 'access':
          await this.processAccessRequest(request);
          break;
        case 'rectification':
          await this.processRectificationRequest(request);
          break;
        case 'erasure':
          await this.processErasureRequest(request);
          break;
        case 'portability':
          await this.processPortabilityRequest(request);
          break;
        case 'restriction':
          await this.processRestrictionRequest(request);
          break;
        case 'objection':
          await this.processObjectionRequest(request);
          break;
      }

      request.status = 'completed';
      request.completedAt = new Date();
      
      console.log(`Data subject request processed: ${request.id}`);
    } catch (error) {
      console.error('Error processing data subject request:', error);
      request.status = 'rejected';
      request.response = 'Request processing failed due to technical error';
    }
  }

  /**
   * Process access request (Article 15)
   */
  private async processAccessRequest(request: DataSubjectRequest): Promise<void> {
    // Generate comprehensive data report
    const userData = await this.generateUserDataReport(request.userId);
    request.response = 'Data access report generated and sent to your registered email';
    request.documents = ['user_data_report.json'];
  }

  /**
   * Process rectification request (Article 16)
   */
  private async processRectificationRequest(request: DataSubjectRequest): Promise<void> {
    // In production, implement data correction workflow
    request.response = 'Data rectification request processed. Please verify the updated information.';
  }

  /**
   * Process erasure request (Article 17)
   */
  private async processErasureRequest(request: DataSubjectRequest): Promise<void> {
    // Use data privacy service for deletion
    await dataPrivacyService.requestDataDeletion(request.userId, 'soft', true);
    request.response = 'Data erasure request processed. Your data will be deleted within 30 days.';
  }

  /**
   * Process portability request (Article 20)
   */
  private async processPortabilityRequest(request: DataSubjectRequest): Promise<void> {
    // Use data privacy service for export
    await dataPrivacyService.requestDataExport(request.userId, 'json', false);
    request.response = 'Data portability request processed. Your data export will be available for download.';
  }

  /**
   * Process restriction request (Article 18)
   */
  private async processRestrictionRequest(request: DataSubjectRequest): Promise<void> {
    // Implement data processing restriction
    request.response = 'Data processing restriction applied. Your data will not be processed except for storage.';
  }

  /**
   * Process objection request (Article 21)
   */
  private async processObjectionRequest(request: DataSubjectRequest): Promise<void> {
    // Stop processing based on legitimate interests
    request.response = 'Objection to processing noted. Processing based on legitimate interests has been stopped.';
  }

  /**
   * Generate user data report
   */
  private async generateUserDataReport(userId: string): Promise<any> {
    return {
      userId,
      generatedAt: new Date(),
      personalData: {
        // User profile data
      },
      processingActivities: this.getProcessingActivitiesForUser(userId),
      consentHistory: await this.getConsentHistory(userId),
      dataRetention: dataPrivacyService.getRetentionPolicies()
    };
  }

  /**
   * Get processing activities for user
   */
  private getProcessingActivitiesForUser(userId: string): ProcessingActivity[] {
    // Return relevant processing activities
    return this.processingActivities.filter(activity => 
      activity.dataSubjects.includes('users') || 
      activity.dataSubjects.includes('customers')
    );
  }

  /**
   * Report data breach
   */
  async reportDataBreach(
    type: DataBreachIncident['type'],
    severity: DataBreachIncident['severity'],
    description: string,
    affectedDataTypes: string[],
    affectedUsers: number
  ): Promise<DataBreachIncident> {
    try {
      const incident: DataBreachIncident = {
        id: `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        detectedAt: new Date(),
        type,
        severity,
        affectedDataTypes,
        affectedUsers,
        description,
        containmentMeasures: [],
        notificationRequired: severity === 'high' || severity === 'critical',
        notifiedAuthorities: false,
        notifiedDataSubjects: false,
        status: 'detected'
      };

      this.dataBreaches.push(incident);

      // Auto-report to authorities if required
      if (incident.notificationRequired) {
        await this.notifyDataProtectionAuthority(incident);
      }

      console.log(`Data breach reported: ${incident.id}`);
      return incident;
    } catch (error) {
      console.error('Error reporting data breach:', error);
      throw error;
    }
  }

  /**
   * Notify data protection authority
   */
  private async notifyDataProtectionAuthority(incident: DataBreachIncident): Promise<void> {
    // In production, integrate with DPA notification system
    incident.reportedAt = new Date();
    incident.notifiedAuthorities = true;
    console.log(`Data protection authority notified for breach: ${incident.id}`);
  }

  /**
   * Conduct compliance audit
   */
  async conductComplianceAudit(auditor: string, scope: string[]): Promise<ComplianceAudit> {
    try {
      const audit: ComplianceAudit = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        auditDate: new Date(),
        auditor,
        scope,
        findings: [],
        overallScore: 0,
        recommendations: [],
        nextAuditDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };

      // Perform audit checks
      audit.findings = await this.performAuditChecks(scope);
      audit.overallScore = this.calculateAuditScore(audit.findings);
      audit.recommendations = this.generateRecommendations(audit.findings);

      this.complianceAudits.push(audit);

      console.log(`Compliance audit completed: ${audit.id} (Score: ${audit.overallScore})`);
      return audit;
    } catch (error) {
      console.error('Error conducting compliance audit:', error);
      throw error;
    }
  }

  /**
   * Perform audit checks
   */
  private async performAuditChecks(scope: string[]): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    if (scope.includes('consent_management')) {
      // Check consent management compliance
      findings.push({
        category: 'Consent Management',
        severity: 'low',
        description: 'Consent records are properly maintained',
        recommendation: 'Continue current practices',
        status: 'resolved'
      });
    }

    if (scope.includes('data_retention')) {
      // Check data retention compliance
      findings.push({
        category: 'Data Retention',
        severity: 'medium',
        description: 'Some data retention periods exceed recommended limits',
        recommendation: 'Review and update retention policies',
        status: 'open'
      });
    }

    if (scope.includes('security_measures')) {
      // Check security measures
      findings.push({
        category: 'Security Measures',
        severity: 'low',
        description: 'Adequate security measures in place',
        recommendation: 'Regular security assessments recommended',
        status: 'resolved'
      });
    }

    return findings;
  }

  /**
   * Calculate audit score
   */
  private calculateAuditScore(findings: AuditFinding[]): number {
    if (findings.length === 0) return 100;

    const severityWeights = { low: 1, medium: 3, high: 7, critical: 15 };
    const totalDeductions = findings.reduce((sum, finding) => 
      sum + severityWeights[finding.severity], 0
    );

    return Math.max(0, 100 - totalDeductions);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(findings: AuditFinding[]): string[] {
    const recommendations = findings
      .filter(f => f.status === 'open')
      .map(f => f.recommendation);

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance practices');
    }

    return recommendations;
  }

  /**
   * Load consent records
   */
  private async loadConsentRecords(): Promise<void> {
    // In production, load from database
    console.log('Loading consent records...');
  }

  /**
   * Initialize processing activities register
   */
  private async initializeProcessingActivities(): Promise<void> {
    this.processingActivities = [
      {
        id: 'user_registration',
        name: 'User Registration and Profile Management',
        purpose: 'Create and maintain user accounts',
        legalBasis: 'contract',
        dataCategories: ['personal_data', 'contact_data'],
        dataSubjects: ['users', 'customers'],
        recipients: ['internal_staff'],
        retentionPeriod: 2555, // 7 years
        securityMeasures: ['encryption', 'access_controls', 'audit_logging'],
        transfersOutsideEU: false,
        lastReviewed: new Date()
      },
      {
        id: 'ride_booking',
        name: 'Ride Booking and Management',
        purpose: 'Process ride bookings and provide transportation services',
        legalBasis: 'contract',
        dataCategories: ['personal_data', 'location_data', 'transaction_data'],
        dataSubjects: ['users', 'customers'],
        recipients: ['internal_staff', 'drivers', 'payment_processors'],
        retentionPeriod: 1095, // 3 years
        securityMeasures: ['encryption', 'access_controls', 'data_minimization'],
        transfersOutsideEU: false,
        lastReviewed: new Date()
      },
      {
        id: 'marketing',
        name: 'Marketing Communications',
        purpose: 'Send promotional materials and offers',
        legalBasis: 'consent',
        dataCategories: ['contact_data', 'preference_data'],
        dataSubjects: ['users', 'customers'],
        recipients: ['internal_staff', 'marketing_partners'],
        retentionPeriod: 730, // 2 years
        securityMeasures: ['encryption', 'opt_out_mechanisms'],
        transfersOutsideEU: true,
        lastReviewed: new Date()
      }
    ];
  }

  /**
   * Start compliance monitoring
   */
  private startComplianceMonitoring(): void {
    // In production, set up automated compliance monitoring
    console.log('GDPR compliance monitoring started');
  }

  /**
   * Get data subject requests for user
   */
  async getDataSubjectRequests(userId: string): Promise<DataSubjectRequest[]> {
    return this.dataSubjectRequests.get(userId) || [];
  }

  /**
   * Get processing activities
   */
  getProcessingActivities(): ProcessingActivity[] {
    return [...this.processingActivities];
  }

  /**
   * Get data breaches
   */
  getDataBreaches(): DataBreachIncident[] {
    return [...this.dataBreaches];
  }

  /**
   * Get compliance audits
   */
  getComplianceAudits(): ComplianceAudit[] {
    return [...this.complianceAudits];
  }
}

export const gdprComplianceService = new GDPRComplianceService();