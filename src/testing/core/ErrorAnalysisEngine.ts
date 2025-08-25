/**
 * Error Analysis and Categorization Engine
 * 
 * This module provides comprehensive error analysis, pattern recognition,
 * severity assessment, impact analysis, and root cause analysis capabilities.
 * 
 * Requirements: 6.1, 6.2
 */

import { TestResult, ErrorEntry } from './types';

export interface ErrorPattern {
  id: string;
  name: string;
  pattern: RegExp;
  category: ErrorCategory;
  severity: ErrorSeverity;
  frequency: number;
  description: string;
  commonCauses: string[];
  suggestedFixes: string[];
  businessImpact: BusinessImpact;
}

export interface ErrorCorrelation {
  primaryErrorId: string;
  relatedErrorIds: string[];
  correlationStrength: number; // 0-1
  timeWindow: number; // milliseconds
  pattern: string;
  rootCause?: string;
}

export interface ErrorTrend {
  errorType: string;
  category: ErrorCategory;
  occurrences: Array<{
    timestamp: Date;
    count: number;
    severity: ErrorSeverity;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable' | 'spike';
  trendStrength: number; // 0-1
  projectedImpact: string;
}

export interface RootCauseAnalysis {
  errorId: string;
  possibleCauses: Array<{
    cause: string;
    probability: number; // 0-1
    evidence: string[];
    category: 'code' | 'configuration' | 'infrastructure' | 'data' | 'external';
  }>;
  recommendedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
  confidence: number; // 0-1
}

export interface ImpactAssessment {
  errorId: string;
  userImpact: {
    affectedUsers: number;
    userJourneyDisruption: 'none' | 'minor' | 'major' | 'blocking';
    affectedFeatures: string[];
  };
  businessImpact: {
    revenueImpact: number; // estimated loss
    reputationRisk: 'low' | 'medium' | 'high';
    complianceRisk: 'none' | 'low' | 'medium' | 'high';
  };
  technicalImpact: {
    systemStability: 'stable' | 'degraded' | 'unstable';
    performanceImpact: number; // percentage degradation
    cascadingFailures: string[];
  };
  overallSeverity: ErrorSeverity;
}

export type ErrorCategory = 
  | 'functional' 
  | 'performance' 
  | 'security' 
  | 'usability' 
  | 'integration' 
  | 'infrastructure' 
  | 'data_quality' 
  | 'business_logic';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type BusinessImpact = 'minimal' | 'low' | 'medium' | 'high' | 'critical';

export interface ErrorAnalysisResult {
  errorEntry: ErrorEntry;
  patterns: ErrorPattern[];
  correlations: ErrorCorrelation[];
  rootCauseAnalysis: RootCauseAnalysis;
  impactAssessment: ImpactAssessment;
  recommendations: string[];
  confidence: number;
}

export class ErrorAnalysisEngine {
  private errorPatterns: ErrorPattern[] = [];
  private errorHistory: ErrorEntry[] = [];
  private correlationCache: Map<string, ErrorCorrelation[]> = new Map();
  private trendAnalysisWindow = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeErrorPatterns();
  }

  /**
   * Initialize predefined error patterns
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      // Functional Errors
      {
        id: 'navigation_failure',
        name: 'Navigation Failure',
        pattern: /navigation.*failed|route.*not.*found|page.*not.*found/i,
        category: 'functional',
        severity: 'medium',
        frequency: 0,
        description: 'User navigation or routing failures',
        commonCauses: ['Missing routes', 'Incorrect URL patterns', 'Server configuration'],
        suggestedFixes: ['Verify route configuration', 'Check URL patterns', 'Update routing table'],
        businessImpact: 'medium'
      },
      {
        id: 'authentication_failure',
        name: 'Authentication Failure',
        pattern: /auth.*failed|login.*failed|unauthorized|403|401/i,
        category: 'security',
        severity: 'high',
        frequency: 0,
        description: 'User authentication and authorization failures',
        commonCauses: ['Invalid credentials', 'Token expiration', 'Permission issues'],
        suggestedFixes: ['Check credential validation', 'Implement token refresh', 'Review permissions'],
        businessImpact: 'high'
      },
      {
        id: 'database_connection',
        name: 'Database Connection Error',
        pattern: /database.*connection|db.*error|connection.*refused|timeout.*database/i,
        category: 'infrastructure',
        severity: 'critical',
        frequency: 0,
        description: 'Database connectivity and query execution failures',
        commonCauses: ['Connection pool exhaustion', 'Network issues', 'Database overload'],
        suggestedFixes: ['Increase connection pool', 'Check network connectivity', 'Optimize queries'],
        businessImpact: 'critical'
      },
      {
        id: 'api_timeout',
        name: 'API Timeout',
        pattern: /timeout|request.*timeout|response.*timeout|timed.*out/i,
        category: 'performance',
        severity: 'medium',
        frequency: 0,
        description: 'API request timeouts and slow responses',
        commonCauses: ['Slow backend processing', 'Network latency', 'Resource contention'],
        suggestedFixes: ['Optimize API performance', 'Increase timeout limits', 'Implement caching'],
        businessImpact: 'medium'
      },
      {
        id: 'validation_error',
        name: 'Input Validation Error',
        pattern: /validation.*failed|invalid.*input|required.*field|format.*error/i,
        category: 'data_quality',
        severity: 'low',
        frequency: 0,
        description: 'Input validation and data format errors',
        commonCauses: ['Missing validation rules', 'Incorrect data format', 'Client-side validation bypass'],
        suggestedFixes: ['Implement server-side validation', 'Update validation rules', 'Improve error messages'],
        businessImpact: 'low'
      },
      {
        id: 'payment_processing',
        name: 'Payment Processing Error',
        pattern: /payment.*failed|transaction.*failed|card.*declined|payment.*error/i,
        category: 'business_logic',
        severity: 'high',
        frequency: 0,
        description: 'Payment processing and transaction failures',
        commonCauses: ['Payment gateway issues', 'Insufficient funds', 'Card validation errors'],
        suggestedFixes: ['Check payment gateway status', 'Implement retry logic', 'Improve error handling'],
        businessImpact: 'high'
      },
      {
        id: 'websocket_connection',
        name: 'WebSocket Connection Error',
        pattern: /websocket.*failed|ws.*connection|real.*time.*failed|socket.*error/i,
        category: 'integration',
        severity: 'medium',
        frequency: 0,
        description: 'Real-time communication failures',
        commonCauses: ['WebSocket server issues', 'Network connectivity', 'Firewall blocking'],
        suggestedFixes: ['Check WebSocket server', 'Implement fallback mechanisms', 'Configure firewall'],
        businessImpact: 'medium'
      },
      {
        id: 'memory_leak',
        name: 'Memory Leak',
        pattern: /memory.*leak|out.*of.*memory|heap.*overflow|memory.*exhausted/i,
        category: 'performance',
        severity: 'high',
        frequency: 0,
        description: 'Memory management and resource leak issues',
        commonCauses: ['Unreleased resources', 'Circular references', 'Large object retention'],
        suggestedFixes: ['Review resource cleanup', 'Implement proper disposal', 'Monitor memory usage'],
        businessImpact: 'high'
      },
      {
        id: 'ui_rendering',
        name: 'UI Rendering Error',
        pattern: /render.*error|component.*failed|ui.*error|display.*error/i,
        category: 'usability',
        severity: 'medium',
        frequency: 0,
        description: 'User interface rendering and display issues',
        commonCauses: ['Component lifecycle issues', 'State management problems', 'CSS conflicts'],
        suggestedFixes: ['Review component logic', 'Fix state management', 'Resolve CSS conflicts'],
        businessImpact: 'medium'
      },
      {
        id: 'external_service',
        name: 'External Service Error',
        pattern: /external.*service|third.*party.*error|api.*unavailable|service.*down/i,
        category: 'integration',
        severity: 'medium',
        frequency: 0,
        description: 'External service integration failures',
        commonCauses: ['Service downtime', 'API changes', 'Rate limiting'],
        suggestedFixes: ['Implement circuit breaker', 'Add fallback mechanisms', 'Monitor service status'],
        businessImpact: 'medium'
      }
    ];
  }

  /**
   * Analyze a single error and provide comprehensive analysis
   */
  public async analyzeError(error: ErrorEntry): Promise<ErrorAnalysisResult> {
    console.log(`🔍 Analyzing error: ${error.id}`);

    // Pattern recognition
    const matchedPatterns = this.recognizePatterns(error);
    
    // Find correlations with other errors
    const correlations = await this.findCorrelations(error);
    
    // Perform root cause analysis
    const rootCauseAnalysis = await this.performRootCauseAnalysis(error, matchedPatterns, correlations);
    
    // Assess impact
    const impactAssessment = await this.assessImpact(error, matchedPatterns);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(error, matchedPatterns, rootCauseAnalysis);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(matchedPatterns, correlations, rootCauseAnalysis);

    // Store error in history for future analysis
    this.errorHistory.push(error);

    return {
      errorEntry: error,
      patterns: matchedPatterns,
      correlations,
      rootCauseAnalysis,
      impactAssessment,
      recommendations,
      confidence
    };
  }

  /**
   * Analyze multiple errors and find patterns
   */
  public async analyzeErrorBatch(errors: ErrorEntry[]): Promise<{
    analyses: ErrorAnalysisResult[];
    trends: ErrorTrend[];
    globalCorrelations: ErrorCorrelation[];
    summary: {
      totalErrors: number;
      criticalErrors: number;
      categoryCounts: Record<ErrorCategory, number>;
      severityCounts: Record<ErrorSeverity, number>;
      topPatterns: ErrorPattern[];
    };
  }> {
    console.log(`🔍 Analyzing batch of ${errors.length} errors...`);

    const analyses: ErrorAnalysisResult[] = [];
    
    // Analyze each error individually
    for (const error of errors) {
      const analysis = await this.analyzeError(error);
      analyses.push(analysis);
    }

    // Analyze trends
    const trends = this.analyzeTrends(errors);
    
    // Find global correlations
    const globalCorrelations = this.findGlobalCorrelations(errors);
    
    // Generate summary
    const summary = this.generateBatchSummary(analyses);

    return {
      analyses,
      trends,
      globalCorrelations,
      summary
    };
  }

  /**
   * Recognize error patterns
   */
  private recognizePatterns(error: ErrorEntry): ErrorPattern[] {
    const matchedPatterns: ErrorPattern[] = [];
    const errorText = `${error.description} ${error.stackTrace || ''}`.toLowerCase();

    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(errorText)) {
        // Update frequency
        pattern.frequency++;
        matchedPatterns.push({ ...pattern });
      }
    }

    // If no patterns match, create a generic pattern
    if (matchedPatterns.length === 0) {
      matchedPatterns.push({
        id: 'unknown_error',
        name: 'Unknown Error',
        pattern: /.*/,
        category: error.category,
        severity: error.severity,
        frequency: 1,
        description: 'Unrecognized error pattern',
        commonCauses: ['Unknown cause'],
        suggestedFixes: ['Manual investigation required'],
        businessImpact: 'low'
      });
    }

    return matchedPatterns;
  }

  /**
   * Find correlations with other errors
   */
  private async findCorrelations(error: ErrorEntry): Promise<ErrorCorrelation[]> {
    const correlations: ErrorCorrelation[] = [];
    const timeWindow = 5 * 60 * 1000; // 5 minutes

    // Check cache first
    const cacheKey = `${error.component}_${error.category}`;
    if (this.correlationCache.has(cacheKey)) {
      return this.correlationCache.get(cacheKey) || [];
    }

    // Find related errors within time window
    const relatedErrors = this.errorHistory.filter(e => 
      e.id !== error.id &&
      Math.abs(e.timestamp.getTime() - error.timestamp.getTime()) <= timeWindow
    );

    if (relatedErrors.length > 0) {
      // Group by component and category
      const componentCorrelations = relatedErrors.filter(e => e.component === error.component);
      const categoryCorrelations = relatedErrors.filter(e => e.category === error.category);

      if (componentCorrelations.length > 0) {
        correlations.push({
          primaryErrorId: error.id,
          relatedErrorIds: componentCorrelations.map(e => e.id),
          correlationStrength: Math.min(componentCorrelations.length / 5, 1),
          timeWindow,
          pattern: 'component_related',
          rootCause: `Multiple errors in component: ${error.component}`
        });
      }

      if (categoryCorrelations.length > 0) {
        correlations.push({
          primaryErrorId: error.id,
          relatedErrorIds: categoryCorrelations.map(e => e.id),
          correlationStrength: Math.min(categoryCorrelations.length / 3, 1),
          timeWindow,
          pattern: 'category_related',
          rootCause: `Multiple ${error.category} errors detected`
        });
      }
    }

    // Cache results
    this.correlationCache.set(cacheKey, correlations);

    return correlations;
  }

  /**
   * Perform root cause analysis
   */
  private async performRootCauseAnalysis(
    error: ErrorEntry,
    patterns: ErrorPattern[],
    correlations: ErrorCorrelation[]
  ): Promise<RootCauseAnalysis> {
    const possibleCauses: RootCauseAnalysis['possibleCauses'] = [];

    // Analyze based on patterns
    for (const pattern of patterns) {
      for (const cause of pattern.commonCauses) {
        possibleCauses.push({
          cause,
          probability: 0.7, // Base probability from pattern matching
          evidence: [`Matches pattern: ${pattern.name}`, `Error description: ${error.description}`],
          category: this.categorizeCause(cause)
        });
      }
    }

    // Analyze based on correlations
    for (const correlation of correlations) {
      if (correlation.rootCause) {
        possibleCauses.push({
          cause: correlation.rootCause,
          probability: correlation.correlationStrength,
          evidence: [`Correlated with ${correlation.relatedErrorIds.length} other errors`],
          category: 'infrastructure'
        });
      }
    }

    // Analyze based on error context
    if (error.context) {
      const contextCauses = this.analyzeErrorContext(error.context);
      possibleCauses.push(...contextCauses);
    }

    // Sort by probability and remove duplicates
    const uniqueCauses = this.deduplicateCauses(possibleCauses);
    uniqueCauses.sort((a, b) => b.probability - a.probability);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(uniqueCauses, error);

    // Calculate confidence based on evidence strength
    const confidence = this.calculateRootCauseConfidence(uniqueCauses, correlations);

    return {
      errorId: error.id,
      possibleCauses: uniqueCauses.slice(0, 5), // Top 5 causes
      recommendedActions,
      confidence
    };
  }

  /**
   * Assess error impact
   */
  private async assessImpact(error: ErrorEntry, patterns: ErrorPattern[]): Promise<ImpactAssessment> {
    // Estimate user impact
    const userImpact = this.assessUserImpact(error, patterns);
    
    // Estimate business impact
    const businessImpact = this.assessBusinessImpact(error, patterns);
    
    // Estimate technical impact
    const technicalImpact = this.assessTechnicalImpact(error, patterns);
    
    // Calculate overall severity
    const overallSeverity = this.calculateOverallSeverity(userImpact, businessImpact, technicalImpact);

    return {
      errorId: error.id,
      userImpact,
      businessImpact,
      technicalImpact,
      overallSeverity
    };
  }

  /**
   * Assess user impact
   */
  private assessUserImpact(error: ErrorEntry, patterns: ErrorPattern[]): ImpactAssessment['userImpact'] {
    let affectedUsers = 1; // Default to single user
    let userJourneyDisruption: ImpactAssessment['userImpact']['userJourneyDisruption'] = 'minor';
    const affectedFeatures: string[] = [];

    // Estimate based on error category and component
    switch (error.category) {
      case 'functional':
        userJourneyDisruption = 'major';
        affectedUsers = this.estimateAffectedUsers(error.component, 'functional');
        break;
      case 'security':
        userJourneyDisruption = 'blocking';
        affectedUsers = this.estimateAffectedUsers(error.component, 'security');
        break;
      case 'performance':
        userJourneyDisruption = 'minor';
        affectedUsers = this.estimateAffectedUsers(error.component, 'performance');
        break;
      case 'usability':
        userJourneyDisruption = 'minor';
        affectedUsers = this.estimateAffectedUsers(error.component, 'usability');
        break;
      default:
        userJourneyDisruption = 'minor';
    }

    // Determine affected features based on component
    affectedFeatures.push(error.component);
    if (patterns.length > 0) {
      affectedFeatures.push(...patterns.map(p => p.name));
    }

    return {
      affectedUsers,
      userJourneyDisruption,
      affectedFeatures: [...new Set(affectedFeatures)] // Remove duplicates
    };
  }

  /**
   * Assess business impact
   */
  private assessBusinessImpact(error: ErrorEntry, patterns: ErrorPattern[]): ImpactAssessment['businessImpact'] {
    let revenueImpact = 0;
    let reputationRisk: ImpactAssessment['businessImpact']['reputationRisk'] = 'low';
    let complianceRisk: ImpactAssessment['businessImpact']['complianceRisk'] = 'none';

    // Calculate based on error severity and business impact from patterns
    const maxBusinessImpact = Math.max(...patterns.map(p => this.businessImpactToNumber(p.businessImpact)));
    
    switch (error.severity) {
      case 'critical':
        revenueImpact = maxBusinessImpact * 10000; // $10k base for critical
        reputationRisk = 'high';
        complianceRisk = error.category === 'security' ? 'high' : 'medium';
        break;
      case 'high':
        revenueImpact = maxBusinessImpact * 5000; // $5k base for high
        reputationRisk = 'medium';
        complianceRisk = error.category === 'security' ? 'medium' : 'low';
        break;
      case 'medium':
        revenueImpact = maxBusinessImpact * 1000; // $1k base for medium
        reputationRisk = 'low';
        complianceRisk = 'low';
        break;
      case 'low':
        revenueImpact = maxBusinessImpact * 100; // $100 base for low
        reputationRisk = 'low';
        complianceRisk = 'none';
        break;
    }

    return {
      revenueImpact,
      reputationRisk,
      complianceRisk
    };
  }

  /**
   * Assess technical impact
   */
  private assessTechnicalImpact(error: ErrorEntry, patterns: ErrorPattern[]): ImpactAssessment['technicalImpact'] {
    let systemStability: ImpactAssessment['technicalImpact']['systemStability'] = 'stable';
    let performanceImpact = 0;
    const cascadingFailures: string[] = [];

    // Assess based on error category
    switch (error.category) {
      case 'infrastructure':
        systemStability = 'unstable';
        performanceImpact = 50; // 50% degradation
        cascadingFailures.push('Database connections', 'API responses');
        break;
      case 'performance':
        systemStability = 'degraded';
        performanceImpact = 25; // 25% degradation
        cascadingFailures.push('Response times', 'User experience');
        break;
      case 'integration':
        systemStability = 'degraded';
        performanceImpact = 15; // 15% degradation
        cascadingFailures.push('External services', 'Data synchronization');
        break;
      default:
        systemStability = 'stable';
        performanceImpact = 5; // 5% degradation
    }

    return {
      systemStability,
      performanceImpact,
      cascadingFailures
    };
  }

  /**
   * Calculate overall severity
   */
  private calculateOverallSeverity(
    userImpact: ImpactAssessment['userImpact'],
    businessImpact: ImpactAssessment['businessImpact'],
    technicalImpact: ImpactAssessment['technicalImpact']
  ): ErrorSeverity {
    let score = 0;

    // User impact scoring
    switch (userImpact.userJourneyDisruption) {
      case 'blocking': score += 4; break;
      case 'major': score += 3; break;
      case 'minor': score += 1; break;
      case 'none': score += 0; break;
    }

    // Business impact scoring
    if (businessImpact.revenueImpact > 5000) score += 3;
    else if (businessImpact.revenueImpact > 1000) score += 2;
    else if (businessImpact.revenueImpact > 100) score += 1;

    if (businessImpact.reputationRisk === 'high') score += 2;
    else if (businessImpact.reputationRisk === 'medium') score += 1;

    // Technical impact scoring
    if (technicalImpact.systemStability === 'unstable') score += 3;
    else if (technicalImpact.systemStability === 'degraded') score += 2;

    if (technicalImpact.performanceImpact > 30) score += 2;
    else if (technicalImpact.performanceImpact > 10) score += 1;

    // Convert score to severity
    if (score >= 8) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    error: ErrorEntry,
    patterns: ErrorPattern[],
    rootCauseAnalysis: RootCauseAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Add pattern-based recommendations
    for (const pattern of patterns) {
      recommendations.push(...pattern.suggestedFixes);
    }

    // Add root cause-based recommendations
    for (const action of rootCauseAnalysis.recommendedActions) {
      if (action.priority === 'high') {
        recommendations.push(`🔥 HIGH PRIORITY: ${action.action}`);
      } else {
        recommendations.push(action.action);
      }
    }

    // Add general recommendations based on error category
    switch (error.category) {
      case 'performance':
        recommendations.push('Monitor system performance metrics');
        recommendations.push('Implement performance optimization strategies');
        break;
      case 'security':
        recommendations.push('Conduct security audit');
        recommendations.push('Review access controls and permissions');
        break;
      case 'integration':
        recommendations.push('Test external service integrations');
        recommendations.push('Implement circuit breaker patterns');
        break;
    }

    // Remove duplicates and return top recommendations
    return [...new Set(recommendations)].slice(0, 10);
  }

  /**
   * Analyze error trends
   */
  private analyzeTrends(errors: ErrorEntry[]): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const now = new Date();
    const timeWindow = this.trendAnalysisWindow;

    // Group errors by type and category
    const errorGroups = new Map<string, ErrorEntry[]>();
    
    for (const error of errors) {
      const key = `${error.category}_${error.component}`;
      if (!errorGroups.has(key)) {
        errorGroups.set(key, []);
      }
      errorGroups.get(key)!.push(error);
    }

    // Analyze each group for trends
    for (const [key, groupErrors] of errorGroups) {
      if (groupErrors.length < 2) continue; // Need at least 2 points for trend

      const [category, component] = key.split('_');
      const occurrences = this.groupErrorsByTime(groupErrors, timeWindow);
      const trend = this.calculateTrend(occurrences);

      trends.push({
        errorType: component,
        category: category as ErrorCategory,
        occurrences,
        trend: trend.direction,
        trendStrength: trend.strength,
        projectedImpact: this.projectTrendImpact(trend, groupErrors)
      });
    }

    return trends.sort((a, b) => b.trendStrength - a.trendStrength);
  }

  /**
   * Find global correlations across all errors
   */
  private findGlobalCorrelations(errors: ErrorEntry[]): ErrorCorrelation[] {
    const correlations: ErrorCorrelation[] = [];
    const timeWindow = 10 * 60 * 1000; // 10 minutes

    // Sort errors by timestamp
    const sortedErrors = errors.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Find clusters of errors within time windows
    for (let i = 0; i < sortedErrors.length; i++) {
      const primaryError = sortedErrors[i];
      const relatedErrors: ErrorEntry[] = [];

      // Find errors within time window
      for (let j = i + 1; j < sortedErrors.length; j++) {
        const candidateError = sortedErrors[j];
        const timeDiff = candidateError.timestamp.getTime() - primaryError.timestamp.getTime();
        
        if (timeDiff > timeWindow) break; // Outside time window
        
        relatedErrors.push(candidateError);
      }

      if (relatedErrors.length >= 2) { // At least 2 related errors
        correlations.push({
          primaryErrorId: primaryError.id,
          relatedErrorIds: relatedErrors.map(e => e.id),
          correlationStrength: Math.min(relatedErrors.length / 5, 1),
          timeWindow,
          pattern: 'temporal_cluster',
          rootCause: 'Potential system-wide issue or cascading failure'
        });
      }
    }

    return correlations;
  }

  /**
   * Generate batch summary
   */
  private generateBatchSummary(analyses: ErrorAnalysisResult[]): {
    totalErrors: number;
    criticalErrors: number;
    categoryCounts: Record<ErrorCategory, number>;
    severityCounts: Record<ErrorSeverity, number>;
    topPatterns: ErrorPattern[];
  } {
    const categoryCounts: Record<ErrorCategory, number> = {
      functional: 0,
      performance: 0,
      security: 0,
      usability: 0,
      integration: 0,
      infrastructure: 0,
      data_quality: 0,
      business_logic: 0
    };

    const severityCounts: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const patternFrequency = new Map<string, ErrorPattern>();

    for (const analysis of analyses) {
      // Count categories
      categoryCounts[analysis.errorEntry.category]++;
      
      // Count severities
      severityCounts[analysis.impactAssessment.overallSeverity]++;
      
      // Count patterns
      for (const pattern of analysis.patterns) {
        if (patternFrequency.has(pattern.id)) {
          patternFrequency.get(pattern.id)!.frequency++;
        } else {
          patternFrequency.set(pattern.id, { ...pattern });
        }
      }
    }

    // Get top patterns by frequency
    const topPatterns = Array.from(patternFrequency.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      totalErrors: analyses.length,
      criticalErrors: severityCounts.critical + severityCounts.high,
      categoryCounts,
      severityCounts,
      topPatterns
    };
  }

  // Helper methods
  private categorizeCause(cause: string): RootCauseAnalysis['possibleCauses'][0]['category'] {
    if (cause.toLowerCase().includes('config')) return 'configuration';
    if (cause.toLowerCase().includes('code') || cause.toLowerCase().includes('bug')) return 'code';
    if (cause.toLowerCase().includes('server') || cause.toLowerCase().includes('network')) return 'infrastructure';
    if (cause.toLowerCase().includes('data') || cause.toLowerCase().includes('database')) return 'data';
    return 'external';
  }

  private analyzeErrorContext(context: any): RootCauseAnalysis['possibleCauses'] {
    const causes: RootCauseAnalysis['possibleCauses'] = [];
    
    if (context.userAgent && context.userAgent.includes('Mobile')) {
      causes.push({
        cause: 'Mobile-specific issue',
        probability: 0.6,
        evidence: [`User agent: ${context.userAgent}`],
        category: 'code'
      });
    }

    if (context.url && context.url.includes('localhost')) {
      causes.push({
        cause: 'Development environment issue',
        probability: 0.8,
        evidence: [`URL: ${context.url}`],
        category: 'configuration'
      });
    }

    return causes;
  }

  private deduplicateCauses(causes: RootCauseAnalysis['possibleCauses']): RootCauseAnalysis['possibleCauses'] {
    const seen = new Set<string>();
    return causes.filter(cause => {
      if (seen.has(cause.cause)) {
        return false;
      }
      seen.add(cause.cause);
      return true;
    });
  }

  private generateRecommendedActions(
    causes: RootCauseAnalysis['possibleCauses'],
    error: ErrorEntry
  ): RootCauseAnalysis['recommendedActions'] {
    const actions: RootCauseAnalysis['recommendedActions'] = [];

    for (const cause of causes.slice(0, 3)) { // Top 3 causes
      switch (cause.category) {
        case 'code':
          actions.push({
            action: `Review and fix code related to: ${cause.cause}`,
            priority: cause.probability > 0.7 ? 'high' : 'medium',
            effort: 'medium',
            impact: 'high'
          });
          break;
        case 'configuration':
          actions.push({
            action: `Update configuration for: ${cause.cause}`,
            priority: 'high',
            effort: 'low',
            impact: 'high'
          });
          break;
        case 'infrastructure':
          actions.push({
            action: `Check infrastructure components: ${cause.cause}`,
            priority: 'high',
            effort: 'high',
            impact: 'high'
          });
          break;
        case 'data':
          actions.push({
            action: `Validate and clean data: ${cause.cause}`,
            priority: 'medium',
            effort: 'medium',
            impact: 'medium'
          });
          break;
        case 'external':
          actions.push({
            action: `Monitor external dependencies: ${cause.cause}`,
            priority: 'low',
            effort: 'low',
            impact: 'medium'
          });
          break;
      }
    }

    return actions;
  }

  private calculateRootCauseConfidence(
    causes: RootCauseAnalysis['possibleCauses'],
    correlations: ErrorCorrelation[]
  ): number {
    if (causes.length === 0) return 0;

    const avgProbability = causes.reduce((sum, cause) => sum + cause.probability, 0) / causes.length;
    const correlationBoost = correlations.length > 0 ? 0.2 : 0;
    
    return Math.min(avgProbability + correlationBoost, 1);
  }

  private calculateConfidence(
    patterns: ErrorPattern[],
    correlations: ErrorCorrelation[],
    rootCauseAnalysis: RootCauseAnalysis
  ): number {
    let confidence = 0.5; // Base confidence

    // Pattern matching confidence
    if (patterns.length > 0) {
      confidence += 0.3;
    }

    // Correlation confidence
    if (correlations.length > 0) {
      confidence += 0.2;
    }

    // Root cause confidence
    confidence += rootCauseAnalysis.confidence * 0.3;

    return Math.min(confidence, 1);
  }

  private estimateAffectedUsers(component: string, category: string): number {
    // Simple estimation based on component and category
    const baseUsers = {
      'auth': 1000,
      'booking': 500,
      'payment': 200,
      'navigation': 800,
      'dashboard': 300
    };

    const multiplier = {
      'functional': 1.5,
      'security': 2.0,
      'performance': 1.2,
      'usability': 1.0
    };

    const base = baseUsers[component as keyof typeof baseUsers] || 100;
    const mult = multiplier[category as keyof typeof multiplier] || 1.0;

    return Math.round(base * mult);
  }

  private businessImpactToNumber(impact: BusinessImpact): number {
    switch (impact) {
      case 'critical': return 5;
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      case 'minimal': return 1;
      default: return 1;
    }
  }

  private groupErrorsByTime(errors: ErrorEntry[], timeWindow: number): ErrorTrend['occurrences'] {
    const groups = new Map<number, ErrorEntry[]>();
    const now = Date.now();

    for (const error of errors) {
      const timeSlot = Math.floor((now - error.timestamp.getTime()) / timeWindow);
      if (!groups.has(timeSlot)) {
        groups.set(timeSlot, []);
      }
      groups.get(timeSlot)!.push(error);
    }

    return Array.from(groups.entries()).map(([slot, slotErrors]) => ({
      timestamp: new Date(now - slot * timeWindow),
      count: slotErrors.length,
      severity: this.calculateAverageSeverity(slotErrors)
    }));
  }

  private calculateTrend(occurrences: ErrorTrend['occurrences']): { direction: ErrorTrend['trend']; strength: number } {
    if (occurrences.length < 2) {
      return { direction: 'stable', strength: 0 };
    }

    const counts = occurrences.map(o => o.count);
    const firstHalf = counts.slice(0, Math.floor(counts.length / 2));
    const secondHalf = counts.slice(Math.floor(counts.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;
    const strength = Math.abs(change);

    let direction: ErrorTrend['trend'] = 'stable';
    if (change > 0.2) direction = 'increasing';
    else if (change < -0.2) direction = 'decreasing';
    else if (strength > 2) direction = 'spike';

    return { direction, strength: Math.min(strength, 1) };
  }

  private projectTrendImpact(trend: { direction: ErrorTrend['trend']; strength: number }, errors: ErrorEntry[]): string {
    const avgSeverity = this.calculateAverageSeverity(errors);
    
    if (trend.direction === 'increasing' && trend.strength > 0.5) {
      return `High risk: ${trend.direction} trend with ${avgSeverity} severity errors`;
    } else if (trend.direction === 'spike') {
      return `Critical: Error spike detected with ${avgSeverity} severity`;
    } else if (trend.direction === 'decreasing') {
      return `Positive: Error trend decreasing`;
    }
    
    return `Stable: No significant trend detected`;
  }

  private calculateAverageSeverity(errors: ErrorEntry[]): ErrorSeverity {
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const avgScore = errors.reduce((sum, error) => sum + severityScores[error.severity], 0) / errors.length;
    
    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): {
    totalErrors: number;
    patternFrequencies: Map<string, number>;
    categoryDistribution: Record<ErrorCategory, number>;
    severityDistribution: Record<ErrorSeverity, number>;
  } {
    const categoryDistribution: Record<ErrorCategory, number> = {
      functional: 0, performance: 0, security: 0, usability: 0,
      integration: 0, infrastructure: 0, data_quality: 0, business_logic: 0
    };
    
    const severityDistribution: Record<ErrorSeverity, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };

    const patternFrequencies = new Map<string, number>();

    for (const error of this.errorHistory) {
      categoryDistribution[error.category]++;
      severityDistribution[error.severity]++;
    }

    for (const pattern of this.errorPatterns) {
      patternFrequencies.set(pattern.id, pattern.frequency);
    }

    return {
      totalErrors: this.errorHistory.length,
      patternFrequencies,
      categoryDistribution,
      severityDistribution
    };
  }

  /**
   * Clear error history (for testing or memory management)
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
    this.correlationCache.clear();
    
    // Reset pattern frequencies
    for (const pattern of this.errorPatterns) {
      pattern.frequency = 0;
    }
  }
}

// Export singleton instance
export const errorAnalysisEngine = new ErrorAnalysisEngine();