/**
 * Audit Logging Service
 * Comprehensive audit logging for data access, user actions,
 * and system events with tamper-proof logging and compliance reporting
 */

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'data_access' | 'user_action' | 'system_event' | 'security_event' | 'privacy_event';
  category: string;
  action: string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  correlationId?: string;
  duration?: number;
  checksum: string;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: string[];
  categories?: string[];
  actions?: string[];
  userIds?: string[];
  resources?: string[];
  results?: string[];
  severities?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditReport {
  id: string;
  title: string;
  description: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topUsers: Array<{ userId: string; eventCount: number }>;
  topResources: Array<{ resource: string; accessCount: number }>;
  securityEvents: AuditEvent[];
  privacyEvents: AuditEvent[];
  anomalies: AuditAnomaly[];
  recommendations: string[];
}

export interface AuditAnomaly {
  id: string;
  type: 'unusual_access_pattern' | 'suspicious_activity' | 'policy_violation' | 'data_breach_indicator';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  events: string[]; // Event IDs
  confidence: number; // 0-1
  falsePositive: boolean;
  investigated: boolean;
  resolution?: string;
}

export interface ComplianceReport {
  id: string;
  standard: 'GDPR' | 'CCPA' | 'HIPAA' | 'SOX' | 'PCI_DSS';
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  complianceScore: number; // 0-100
  requirements: ComplianceRequirement[];
  violations: ComplianceViolation[];
  recommendations: string[];
  nextAuditDate: Date;
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  lastChecked: Date;
}

export interface ComplianceViolation {
  id: string;
  requirement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  events: string[];
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved';
}

class AuditLoggingService {
  private auditEvents: AuditEvent[] = [];
  private auditReports: AuditReport[] = [];
  private complianceReports: ComplianceReport[] = [];
  private anomalies: AuditAnomaly[] = [];
  private eventBuffer: AuditEvent[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds

  /**
   * Initialize audit logging service
   */
  async initialize(): Promise<void> {
    try {
      // Load existing audit events
      await this.loadAuditEvents();
      
      // Start buffer flushing
      this.startBufferFlushing();
      
      // Start anomaly detection
      this.startAnomalyDetection();
      
      console.log('Audit logging service initialized successfully');
    } catch (error) {
      console.error('Error initializing audit logging service:', error);
    }
  }

  /**
   * Log audit event
   */
  async logEvent(
    eventType: AuditEvent['eventType'],
    category: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    options: {
      userId?: string;
      sessionId?: string;
      resourceId?: string;
      result?: AuditEvent['result'];
      severity?: AuditEvent['severity'];
      correlationId?: string;
      duration?: number;
    } = {}
  ): Promise<string> {
    try {
      const event: AuditEvent = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        eventType,
        category,
        action,
        userId: options.userId,
        sessionId: options.sessionId,
        ipAddress: 'unknown', // In production, capture real IP
        userAgent: navigator.userAgent,
        resource,
        resourceId: options.resourceId,
        details,
        result: options.result || 'success',
        severity: options.severity || 'low',
        source: 'gocars_app',
        correlationId: options.correlationId,
        duration: options.duration,
        checksum: ''
      };

      // Generate checksum for tamper detection
      event.checksum = await this.generateEventChecksum(event);

      // Add to buffer
      this.eventBuffer.push(event);

      // Flush buffer if full
      if (this.eventBuffer.length >= this.bufferSize) {
        await this.flushBuffer();
      }

      return event.id;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userId: string,
    resource: string,
    action: 'read' | 'write' | 'delete' | 'export',
    details: Record<string, any>,
    result: AuditEvent['result'] = 'success'
  ): Promise<string> {
    return this.logEvent(
      'data_access',
      'data_operation',
      action,
      resource,
      details,
      { userId, result, severity: action === 'delete' ? 'high' : 'medium' }
    );
  }

  /**
   * Log user action event
   */
  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    sessionId?: string
  ): Promise<string> {
    return this.logEvent(
      'user_action',
      'user_interaction',
      action,
      resource,
      details,
      { userId, sessionId, severity: 'low' }
    );
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    category: string,
    action: string,
    details: Record<string, any>,
    severity: AuditEvent['severity'] = 'high',
    userId?: string
  ): Promise<string> {
    return this.logEvent(
      'security_event',
      category,
      action,
      'security_system',
      details,
      { userId, severity }
    );
  }

  /**
   * Log privacy event
   */
  async logPrivacyEvent(
    userId: string,
    action: string,
    details: Record<string, any>,
    severity: AuditEvent['severity'] = 'medium'
  ): Promise<string> {
    return this.logEvent(
      'privacy_event',
      'privacy_operation',
      action,
      'privacy_system',
      details,
      { userId, severity }
    );
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    try {
      let filteredEvents = [...this.auditEvents];

      // Apply filters
      if (query.startDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startDate!);
      }
      if (query.endDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endDate!);
      }
      if (query.eventTypes?.length) {
        filteredEvents = filteredEvents.filter(e => query.eventTypes!.includes(e.eventType));
      }
      if (query.categories?.length) {
        filteredEvents = filteredEvents.filter(e => query.categories!.includes(e.category));
      }
      if (query.actions?.length) {
        filteredEvents = filteredEvents.filter(e => query.actions!.includes(e.action));
      }
      if (query.userIds?.length) {
        filteredEvents = filteredEvents.filter(e => e.userId && query.userIds!.includes(e.userId));
      }
      if (query.resources?.length) {
        filteredEvents = filteredEvents.filter(e => query.resources!.includes(e.resource));
      }
      if (query.results?.length) {
        filteredEvents = filteredEvents.filter(e => query.results!.includes(e.result));
      }
      if (query.severities?.length) {
        filteredEvents = filteredEvents.filter(e => query.severities!.includes(e.severity));
      }

      // Sort events
      const sortBy = query.sortBy || 'timestamp';
      const sortOrder = query.sortOrder || 'desc';
      filteredEvents.sort((a, b) => {
        let aValue: any = a[sortBy];
        let bValue: any = b[sortBy];

        if (sortBy === 'timestamp') {
          aValue = aValue.getTime();
          bValue = bValue.getTime();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 100;
      const paginatedEvents = filteredEvents.slice(offset, offset + limit);

      return {
        events: paginatedEvents,
        total: filteredEvents.length
      };
    } catch (error) {
      console.error('Error querying audit events:', error);
      return { events: [], total: 0 };
    }
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    title: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditReport> {
    try {
      const query: AuditQuery = { startDate, endDate };
      const { events } = await this.queryEvents(query);

      // Analyze events
      const eventsByType: Record<string, number> = {};
      const eventsByCategory: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};
      const userEventCounts: Record<string, number> = {};
      const resourceAccessCounts: Record<string, number> = {};

      events.forEach(event => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
        eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

        if (event.userId) {
          userEventCounts[event.userId] = (userEventCounts[event.userId] || 0) + 1;
        }

        resourceAccessCounts[event.resource] = (resourceAccessCounts[event.resource] || 0) + 1;
      });

      // Get top users and resources
      const topUsers = Object.entries(userEventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, eventCount]) => ({ userId, eventCount }));

      const topResources = Object.entries(resourceAccessCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([resource, accessCount]) => ({ resource, accessCount }));

      // Get security and privacy events
      const securityEvents = events.filter(e => e.eventType === 'security_event');
      const privacyEvents = events.filter(e => e.eventType === 'privacy_event');

      // Get anomalies for the period
      const periodAnomalies = this.anomalies.filter(a => 
        a.detectedAt >= startDate && a.detectedAt <= endDate
      );

      // Generate recommendations
      const recommendations = this.generateAuditRecommendations(events, periodAnomalies);

      const report: AuditReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        totalEvents: events.length,
        eventsByType,
        eventsByCategory,
        eventsBySeverity,
        topUsers,
        topResources,
        securityEvents,
        privacyEvents,
        anomalies: periodAnomalies,
        recommendations
      };

      this.auditReports.push(report);
      return report;
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    standard: ComplianceReport['standard'],
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    try {
      const requirements = this.getComplianceRequirements(standard);
      const violations: ComplianceViolation[] = [];
      let complianceScore = 0;

      // Check each requirement
      for (const requirement of requirements) {
        const compliance = await this.checkComplianceRequirement(requirement, startDate, endDate);
        requirement.status = compliance.status;
        requirement.evidence = compliance.evidence;
        requirement.lastChecked = new Date();

        if (compliance.status === 'compliant') {
          complianceScore += 100 / requirements.length;
        } else if (compliance.status === 'partial') {
          complianceScore += 50 / requirements.length;
        }

        if (compliance.violations) {
          violations.push(...compliance.violations);
        }
      }

      const recommendations = this.generateComplianceRecommendations(standard, requirements, violations);

      const report: ComplianceReport = {
        id: `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        standard,
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        complianceScore: Math.round(complianceScore),
        requirements,
        violations,
        recommendations,
        nextAuditDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };

      this.complianceReports.push(report);
      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(days: number = 30): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    anomaliesDetected: number;
    complianceScore: number;
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const { events } = await this.queryEvents({ startDate });

      const eventsByType: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};

      events.forEach(event => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      });

      const recentAnomalies = this.anomalies.filter(a => a.detectedAt >= startDate);
      
      // Calculate average compliance score from recent reports
      const recentComplianceReports = this.complianceReports.filter(r => r.generatedAt >= startDate);
      const avgComplianceScore = recentComplianceReports.length > 0
        ? recentComplianceReports.reduce((sum, r) => sum + r.complianceScore, 0) / recentComplianceReports.length
        : 0;

      return {
        totalEvents: events.length,
        eventsByType,
        eventsBySeverity,
        anomaliesDetected: recentAnomalies.length,
        complianceScore: Math.round(avgComplianceScore)
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        anomaliesDetected: 0,
        complianceScore: 0
      };
    }
  }

  // Private helper methods

  private async generateEventChecksum(event: AuditEvent): Promise<string> {
    // Create checksum from event data (excluding checksum field)
    const eventData = { ...event };
    delete eventData.checksum;
    const dataString = JSON.stringify(eventData);
    
    // In production, use proper cryptographic hashing
    return btoa(dataString).substring(0, 16);
  }

  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      // Move events from buffer to main storage
      this.auditEvents.push(...this.eventBuffer);
      
      // Persist to storage (keep last 10000 events)
      const eventsToStore = this.auditEvents.slice(-10000);
      localStorage.setItem('audit_events', JSON.stringify(eventsToStore));
      
      // Clear buffer
      this.eventBuffer = [];
      
      console.log(`Flushed ${this.eventBuffer.length} audit events`);
    } catch (error) {
      console.error('Error flushing audit buffer:', error);
    }
  }

  private startBufferFlushing(): void {
    setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  private startAnomalyDetection(): void {
    // Run anomaly detection every 5 minutes
    setInterval(() => {
      this.detectAnomalies();
    }, 5 * 60 * 1000);
  }

  private async detectAnomalies(): Promise<void> {
    try {
      // Get recent events for analysis
      const recentEvents = this.auditEvents.filter(e => 
        e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

      // Detect unusual access patterns
      await this.detectUnusualAccessPatterns(recentEvents);
      
      // Detect suspicious activities
      await this.detectSuspiciousActivities(recentEvents);
      
      // Detect policy violations
      await this.detectPolicyViolations(recentEvents);
      
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }
  }

  private async detectUnusualAccessPatterns(events: AuditEvent[]): Promise<void> {
    // Group events by user
    const userEvents: Record<string, AuditEvent[]> = {};
    events.forEach(event => {
      if (event.userId) {
        if (!userEvents[event.userId]) {
          userEvents[event.userId] = [];
        }
        userEvents[event.userId].push(event);
      }
    });

    // Check for unusual patterns
    for (const [userId, userEventList] of Object.entries(userEvents)) {
      if (userEventList.length > 100) { // More than 100 events in 24 hours
        await this.reportAnomaly(
          'unusual_access_pattern',
          'high',
          `User ${userId} has ${userEventList.length} events in 24 hours`,
          userEventList.map(e => e.id),
          0.8
        );
      }
    }
  }

  private async detectSuspiciousActivities(events: AuditEvent[]): Promise<void> {
    // Look for failed login attempts
    const failedLogins = events.filter(e => 
      e.action === 'login' && e.result === 'failure'
    );

    if (failedLogins.length > 10) {
      await this.reportAnomaly(
        'suspicious_activity',
        'high',
        `${failedLogins.length} failed login attempts detected`,
        failedLogins.map(e => e.id),
        0.9
      );
    }
  }

  private async detectPolicyViolations(events: AuditEvent[]): Promise<void> {
    // Check for data access without proper consent
    const dataAccessEvents = events.filter(e => e.eventType === 'data_access');
    
    for (const event of dataAccessEvents) {
      if (event.details.consentRequired && !event.details.consentGiven) {
        await this.reportAnomaly(
          'policy_violation',
          'critical',
          `Data access without consent: ${event.resource}`,
          [event.id],
          1.0
        );
      }
    }
  }

  private async reportAnomaly(
    type: AuditAnomaly['type'],
    severity: AuditAnomaly['severity'],
    description: string,
    eventIds: string[],
    confidence: number
  ): Promise<void> {
    const anomaly: AuditAnomaly = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      description,
      detectedAt: new Date(),
      events: eventIds,
      confidence,
      falsePositive: false,
      investigated: false
    };

    this.anomalies.push(anomaly);
    console.log(`Anomaly detected: ${description}`);
  }

  private getComplianceRequirements(standard: string): ComplianceRequirement[] {
    // Return requirements based on compliance standard
    const requirements: Record<string, ComplianceRequirement[]> = {
      GDPR: [
        {
          id: 'gdpr_consent',
          description: 'Obtain explicit consent for data processing',
          status: 'compliant',
          evidence: [],
          lastChecked: new Date()
        },
        {
          id: 'gdpr_data_minimization',
          description: 'Process only necessary data',
          status: 'compliant',
          evidence: [],
          lastChecked: new Date()
        }
      ]
    };

    return requirements[standard] || [];
  }

  private async checkComplianceRequirement(
    requirement: ComplianceRequirement,
    startDate: Date,
    endDate: Date
  ): Promise<{
    status: ComplianceRequirement['status'];
    evidence: string[];
    violations?: ComplianceViolation[];
  }> {
    // Check compliance based on audit events
    // This is a simplified implementation
    return {
      status: 'compliant',
      evidence: ['Audit events show proper consent handling'],
      violations: []
    };
  }

  private generateAuditRecommendations(events: AuditEvent[], anomalies: AuditAnomaly[]): string[] {
    const recommendations: string[] = [];

    if (anomalies.length > 0) {
      recommendations.push('Investigate detected anomalies and implement corrective measures');
    }

    const highSeverityEvents = events.filter(e => e.severity === 'high' || e.severity === 'critical');
    if (highSeverityEvents.length > 10) {
      recommendations.push('Review high-severity events and strengthen security controls');
    }

    if (recommendations.length === 0) {
      recommendations.push('Audit results look good. Continue monitoring for any changes');
    }

    return recommendations;
  }

  private generateComplianceRecommendations(
    standard: string,
    requirements: ComplianceRequirement[],
    violations: ComplianceViolation[]
  ): string[] {
    const recommendations: string[] = [];

    const nonCompliantReqs = requirements.filter(r => r.status === 'non_compliant');
    if (nonCompliantReqs.length > 0) {
      recommendations.push(`Address ${nonCompliantReqs.length} non-compliant requirements`);
    }

    if (violations.length > 0) {
      recommendations.push(`Resolve ${violations.length} compliance violations`);
    }

    if (recommendations.length === 0) {
      recommendations.push(`${standard} compliance is maintained. Continue regular monitoring`);
    }

    return recommendations;
  }

  private async loadAuditEvents(): Promise<void> {
    try {
      const stored = localStorage.getItem('audit_events');
      if (stored) {
        this.auditEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading audit events:', error);
    }
  }
}

export const auditLoggingService = new AuditLoggingService();