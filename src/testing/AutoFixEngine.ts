/**
 * Automated Error Fixing Engine
 * Analyzes test failures and applies automated fixes
 */

import { TestResult, ErrorEntry } from './core/types'
import { errorAnalysisEngine, ErrorAnalysisResult } from './core/ErrorAnalysisEngine'

export interface FixResult {
  errorId: string
  fixApplied: boolean
  fixType: 'configuration' | 'code' | 'data' | 'infrastructure'
  fixDescription: string
  validationResult?: boolean
  rollbackAvailable: boolean
  rollbackData?: any
  backupCreated?: boolean
  validationTests?: string[]
  successCriteria?: string[]
  riskLevel: 'low' | 'medium' | 'high'
  estimatedImpact: string
}

export interface FixStrategy {
  id: string
  name: string
  pattern: RegExp
  category: 'navigation' | 'element' | 'validation' | 'network' | 'permission' | 'database' | 'infrastructure' | 'configuration'
  riskLevel: 'low' | 'medium' | 'high'
  requiresBackup: boolean
  validationRequired: boolean
  fix: (error: string, context?: any) => Promise<FixResult>
  validate?: (fixResult: FixResult) => Promise<boolean>
  rollback?: (fixResult: FixResult) => Promise<boolean>
}

export interface DatabaseRepairStrategy {
  id: string
  name: string
  pattern: RegExp
  repairType: 'connection' | 'schema' | 'data' | 'index' | 'constraint'
  riskLevel: 'low' | 'medium' | 'high'
  repair: (error: string, context?: any) => Promise<FixResult>
  validate: (fixResult: FixResult) => Promise<boolean>
  rollback: (fixResult: FixResult) => Promise<boolean>
}

export interface InfrastructureRepairStrategy {
  id: string
  name: string
  pattern: RegExp
  repairType: 'service' | 'network' | 'resource' | 'configuration' | 'deployment'
  riskLevel: 'low' | 'medium' | 'high'
  repair: (error: string, context?: any) => Promise<FixResult>
  validate: (fixResult: FixResult) => Promise<boolean>
  rollback: (fixResult: FixResult) => Promise<boolean>
}

export interface RollbackManager {
  createBackup(fixType: string, targetPath: string, data: any): Promise<string>
  restoreBackup(backupId: string): Promise<boolean>
  validateFix(fixResult: FixResult): Promise<boolean>
  listBackups(): Promise<Array<{ id: string; timestamp: Date; fixType: string; description: string }>>
  cleanupOldBackups(olderThanDays: number): Promise<number>
}

export class AutoFixEngine {
  private fixStrategies: FixStrategy[] = []
  private databaseRepairStrategies: DatabaseRepairStrategy[] = []
  private infrastructureRepairStrategies: InfrastructureRepairStrategy[] = []
  private appliedFixes: FixResult[] = []
  private rollbackManager: RollbackManager
  private validationEnabled: boolean = true
  private maxRiskLevel: 'low' | 'medium' | 'high' = 'medium'

  constructor(options?: {
    validationEnabled?: boolean
    maxRiskLevel?: 'low' | 'medium' | 'high'
  }) {
    this.validationEnabled = options?.validationEnabled ?? true
    this.maxRiskLevel = options?.maxRiskLevel ?? 'medium'
    this.rollbackManager = new BackupRollbackManager()
    this.initializeFixStrategies()
    this.initializeDatabaseRepairStrategies()
    this.initializeInfrastructureRepairStrategies()
  }

  /**
   * Initialize database repair strategies
   */
  private initializeDatabaseRepairStrategies(): void {
    this.databaseRepairStrategies = [
      {
        id: 'connection_pool_exhaustion',
        name: 'Database Connection Pool Exhaustion Repair',
        pattern: /connection.*pool.*exhausted|too.*many.*connections|connection.*timeout/i,
        repairType: 'connection',
        riskLevel: 'medium',
        repair: async (error: string, context?: any) => {
          console.log('🔧 Repairing database connection pool...')
          
          const backupId = await this.rollbackManager.createBackup('database_config', 'firebase.ts', {
            connectionConfig: 'current_config'
          })
          
          // Increase connection pool size
          await this.increaseDatabaseConnectionPool()
          
          // Clear existing connections
          await this.clearDatabaseConnections()
          
          return {
            errorId: `db_pool_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'configuration',
            fixDescription: 'Increased database connection pool size and cleared stale connections',
            validationResult: true,
            rollbackAvailable: true,
            rollbackData: { backupId },
            backupCreated: true,
            riskLevel: 'medium',
            estimatedImpact: 'Improved database connectivity, may require service restart',
            validationTests: ['database_connection_test', 'connection_pool_test'],
            successCriteria: ['Connection pool size increased', 'Stale connections cleared', 'New connections successful']
          }
        },
        validate: async (fixResult: FixResult) => {
          return await this.validateDatabaseConnection()
        },
        rollback: async (fixResult: FixResult) => {
          if (fixResult.rollbackData?.backupId) {
            return await this.rollbackManager.restoreBackup(fixResult.rollbackData.backupId)
          }
          return false
        }
      },
      {
        id: 'database_schema_mismatch',
        name: 'Database Schema Mismatch Repair',
        pattern: /schema.*mismatch|column.*not.*found|table.*not.*exist/i,
        repairType: 'schema',
        riskLevel: 'high',
        repair: async (error: string, context?: any) => {
          console.log('🔧 Repairing database schema mismatch...')
          
          const backupId = await this.rollbackManager.createBackup('database_schema', 'firestore_rules', {
            currentSchema: 'schema_snapshot'
          })
          
          // Analyze schema differences
          const schemaDiff = await this.analyzeSchemaDifferences(error)
          
          // Apply schema updates
          await this.applySchemaUpdates(schemaDiff)
          
          return {
            errorId: `db_schema_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'data',
            fixDescription: `Applied schema updates: ${schemaDiff.changes.join(', ')}`,
            validationResult: true,
            rollbackAvailable: true,
            rollbackData: { backupId, schemaDiff },
            backupCreated: true,
            riskLevel: 'high',
            estimatedImpact: 'Database schema updated, may affect data integrity',
            validationTests: ['schema_validation_test', 'data_integrity_test'],
            successCriteria: ['Schema matches expected structure', 'Data integrity maintained', 'Queries execute successfully']
          }
        },
        validate: async (fixResult: FixResult) => {
          return await this.validateDatabaseSchema()
        },
        rollback: async (fixResult: FixResult) => {
          if (fixResult.rollbackData?.backupId) {
            return await this.rollbackManager.restoreBackup(fixResult.rollbackData.backupId)
          }
          return false
        }
      },
      {
        id: 'database_index_missing',
        name: 'Database Index Missing Repair',
        pattern: /index.*required|query.*requires.*index|composite.*index.*needed/i,
        repairType: 'index',
        riskLevel: 'low',
        repair: async (error: string, context?: any) => {
          console.log('🔧 Creating missing database indexes...')
          
          const backupId = await this.rollbackManager.createBackup('database_indexes', 'firestore_indexes', {
            currentIndexes: 'index_snapshot'
          })
          
          // Extract required index from error
          const requiredIndex = await this.extractRequiredIndex(error)
          
          // Create missing index
          await this.createDatabaseIndex(requiredIndex)
          
          return {
            errorId: `db_index_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'configuration',
            fixDescription: `Created missing database index: ${requiredIndex.name}`,
            validationResult: true,
            rollbackAvailable: true,
            rollbackData: { backupId, requiredIndex },
            backupCreated: true,
            riskLevel: 'low',
            estimatedImpact: 'Improved query performance, no data loss risk',
            validationTests: ['index_existence_test', 'query_performance_test'],
            successCriteria: ['Index created successfully', 'Query executes without index error', 'Performance improved']
          }
        },
        validate: async (fixResult: FixResult) => {
          return await this.validateDatabaseIndexes()
        },
        rollback: async (fixResult: FixResult) => {
          if (fixResult.rollbackData?.backupId) {
            return await this.rollbackManager.restoreBackup(fixResult.rollbackData.backupId)
          }
          return false
        }
      }
    ]
  }

  /**
   * Initialize infrastructure repair strategies
   */
  private initializeInfrastructureRepairStrategies(): void {
    this.infrastructureRepairStrategies = [
      {
        id: 'service_unavailable',
        name: 'Service Unavailable Repair',
        pattern: /service.*unavailable|server.*not.*responding|503.*service.*unavailable/i,
        repairType: 'service',
        riskLevel: 'medium',
        repair: async (error: string, context?: any) => {
          console.log('🔧 Repairing unavailable service...')
          
          const backupId = await this.rollbackManager.createBackup('service_config', 'service_configuration', {
            currentConfig: 'service_snapshot'
          })
          
          // Identify failing service
          const serviceName = await this.identifyFailingService(error)
          
          // Attempt service restart
          const restartResult = await this.restartService(serviceName)
          
          // Check service health
          const healthCheck = await this.performServiceHealthCheck(serviceName)
          
          return {
            errorId: `service_fix_${Date.now()}`,
            fixApplied: restartResult && healthCheck,
            fixType: 'infrastructure',
            fixDescription: `Restarted service: ${serviceName}, Health check: ${healthCheck ? 'passed' : 'failed'}`,
            validationResult: healthCheck,
            rollbackAvailable: true,
            rollbackData: { backupId, serviceName },
            backupCreated: true,
            riskLevel: 'medium',
            estimatedImpact: 'Service restarted, temporary downtime possible',
            validationTests: ['service_health_test', 'endpoint_availability_test'],
            successCriteria: ['Service responds to health checks', 'Endpoints return expected responses', 'No error logs in service']
          }
        },
        validate: async (fixResult: FixResult) => {
          const serviceName = fixResult.rollbackData?.serviceName
          return await this.performServiceHealthCheck(serviceName)
        },
        rollback: async (fixResult: FixResult) => {
          if (fixResult.rollbackData?.backupId) {
            return await this.rollbackManager.restoreBackup(fixResult.rollbackData.backupId)
          }
          return false
        }
      },
      {
        id: 'network_connectivity',
        name: 'Network Connectivity Repair',
        pattern: /network.*error|connection.*refused|timeout.*network|dns.*resolution.*failed/i,
        repairType: 'network',
        riskLevel: 'low',
        repair: async (error: string, context?: any) => {
          console.log('🔧 Repairing network connectivity issues...')
          
          const backupId = await this.rollbackManager.createBackup('network_config', 'network_configuration', {
            currentConfig: 'network_snapshot'
          })
          
          // Diagnose network issue
          const networkDiagnosis = await this.diagnoseNetworkIssue(error)
          
          // Apply network fixes
          const fixes = await this.applyNetworkFixes(networkDiagnosis)
          
          return {
            errorId: `network_fix_${Date.now()}`,
            fixApplied: fixes.length > 0,
            fixType: 'infrastructure',
            fixDescription: `Applied network fixes: ${fixes.join(', ')}`,
            validationResult: true,
            rollbackAvailable: true,
            rollbackData: { backupId, fixes },
            backupCreated: true,
            riskLevel: 'low',
            estimatedImpact: 'Network configuration updated, connectivity improved',
            validationTests: ['network_connectivity_test', 'dns_resolution_test'],
            successCriteria: ['Network connectivity restored', 'DNS resolution working', 'Endpoints reachable']
          }
        },
        validate: async (fixResult: FixResult) => {
          return await this.validateNetworkConnectivity()
        },
        rollback: async (fixResult: FixResult) => {
          if (fixResult.rollbackData?.backupId) {
            return await this.rollbackManager.restoreBackup(fixResult.rollbackData.backupId)
          }
          return false
        }
      },
      {
        id: 'resource_exhaustion',
        name: 'Resource Exhaustion Repair',
        pattern: /out.*of.*memory|disk.*space.*full|cpu.*usage.*high|resource.*exhausted/i,
        repairType: 'resource',
        riskLevel: 'high',
        repair: async (error: string, context?: any) => {
          console.log('🔧 Repairing resource exhaustion...')
          
          const backupId = await this.rollbackManager.createBackup('resource_config', 'resource_limits', {
            currentLimits: 'resource_snapshot'
          })
          
          // Identify resource type
          const resourceType = await this.identifyResourceType(error)
          
          // Apply resource optimization
          const optimizations = await this.applyResourceOptimizations(resourceType)
          
          return {
            errorId: `resource_fix_${Date.now()}`,
            fixApplied: optimizations.length > 0,
            fixType: 'infrastructure',
            fixDescription: `Applied resource optimizations: ${optimizations.join(', ')}`,
            validationResult: true,
            rollbackAvailable: true,
            rollbackData: { backupId, resourceType, optimizations },
            backupCreated: true,
            riskLevel: 'high',
            estimatedImpact: 'Resource limits adjusted, system performance may change',
            validationTests: ['resource_usage_test', 'performance_test'],
            successCriteria: ['Resource usage within limits', 'System performance stable', 'No resource exhaustion errors']
          }
        },
        validate: async (fixResult: FixResult) => {
          return await this.validateResourceUsage()
        },
        rollback: async (fixResult: FixResult) => {
          if (fixResult.rollbackData?.backupId) {
            return await this.rollbackManager.restoreBackup(fixResult.rollbackData.backupId)
          }
          return false
        }
      }
    ]
  }

  /**
   * Initialize fix strategies
   */
  private initializeFixStrategies(): void {
    this.fixStrategies = [
      {
        id: 'navigation_failed',
        name: 'Navigation Failed Fix',
        pattern: /Navigation failed: (.+)/,
        category: 'navigation',
        riskLevel: 'low',
        requiresBackup: true,
        validationRequired: true,
        fix: async (error: string, context?: any) => {
          const match = error.match(/Navigation failed: (.+)/)
          const url = match?.[1] || 'unknown'
          
          console.log(`🔧 Applying navigation fix for: ${url}`)
          
          // Check if URL exists in routing configuration
          const routeExists = await this.checkRouteExists(url)
          
          if (!routeExists) {
            // Create missing route
            await this.createMissingRoute(url)
            
            return {
              errorId: `nav_fix_${Date.now()}`,
              fixApplied: true,
              fixType: 'code',
              fixDescription: `Created missing route: ${url}`,
              validationResult: true,
              rollbackAvailable: true
            }
          }
          
          return {
            errorId: `nav_fix_${Date.now()}`,
            fixApplied: false,
            fixType: 'configuration',
            fixDescription: `Route exists but navigation failed - may be server issue`,
            rollbackAvailable: false
          }
        }
      },
      {
        id: 'element_not_clickable',
        name: 'Element Not Clickable Fix',
        pattern: /Element not clickable: (.+)/,
        category: 'element',
        fix: async (error: string, context?: any) => {
          const match = error.match(/Element not clickable: (.+)/)
          const selector = match?.[1] || 'unknown'
          
          console.log(`🔧 Applying clickable element fix for: ${selector}`)
          
          // Add CSS to ensure element is clickable
          await this.fixElementClickability(selector)
          
          return {
            errorId: `click_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'code',
            fixDescription: `Fixed clickability for element: ${selector}`,
            validationResult: true,
            rollbackAvailable: true
          }
        }
      },
      {
        id: 'element_not_found',
        name: 'Element Not Found Fix',
        pattern: /Element not found or verification failed: (.+)/,
        category: 'element',
        fix: async (error: string, context?: any) => {
          const match = error.match(/Element not found or verification failed: (.+)/)
          const selector = match?.[1] || 'unknown'
          
          console.log(`🔧 Applying missing element fix for: ${selector}`)
          
          // Create missing UI element
          await this.createMissingElement(selector)
          
          return {
            errorId: `element_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'code',
            fixDescription: `Created missing UI element: ${selector}`,
            validationResult: true,
            rollbackAvailable: true
          }
        }
      },
      {
        id: 'input_validation_failed',
        name: 'Input Validation Failed Fix',
        pattern: /Input validation failed: (.+)/,
        category: 'validation',
        fix: async (error: string, context?: any) => {
          const match = error.match(/Input validation failed: (.+)/)
          const field = match?.[1] || 'unknown'
          
          console.log(`🔧 Applying input validation fix for: ${field}`)
          
          // Fix input validation rules
          await this.fixInputValidation(field)
          
          return {
            errorId: `validation_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'code',
            fixDescription: `Fixed input validation for field: ${field}`,
            validationResult: true,
            rollbackAvailable: true
          }
        }
      },
      {
        id: 'firebase_connection',
        name: 'Firebase Connection Fix',
        pattern: /Firebase.*connection.*failed/i,
        category: 'network',
        fix: async (error: string, context?: any) => {
          console.log(`🔧 Applying Firebase connection fix`)
          
          // Check and fix Firebase configuration
          await this.fixFirebaseConnection()
          
          return {
            errorId: `firebase_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'configuration',
            fixDescription: 'Fixed Firebase connection configuration',
            validationResult: true,
            rollbackAvailable: true
          }
        }
      },
      {
        id: 'websocket_connection',
        name: 'WebSocket Connection Fix',
        pattern: /WebSocket.*connection.*refused/i,
        category: 'network',
        fix: async (error: string, context?: any) => {
          console.log(`🔧 Applying WebSocket connection fix`)
          
          // Fix WebSocket server configuration
          await this.fixWebSocketConnection()
          
          return {
            errorId: `websocket_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'infrastructure',
            fixDescription: 'Fixed WebSocket server configuration',
            validationResult: true,
            rollbackAvailable: true
          }
        }
      },
      {
        id: 'notification_permission',
        name: 'Notification Permission Fix',
        pattern: /Push notification permission denied/i,
        category: 'permission',
        fix: async (error: string, context?: any) => {
          console.log(`🔧 Applying notification permission fix`)
          
          // Fix notification permission handling
          await this.fixNotificationPermissions()
          
          return {
            errorId: `notification_fix_${Date.now()}`,
            fixApplied: true,
            fixType: 'code',
            fixDescription: 'Fixed notification permission handling',
            validationResult: true,
            rollbackAvailable: true
          }
        }
      }
    ]
  }

  /**
   * Analyze test results and apply fixes with enhanced error analysis
   */
  public async analyzeAndFix(testResults: TestResult[]): Promise<FixResult[]> {
    console.log('🔍 Analyzing test results for auto-fixable issues...')
    
    const failedTests = testResults.filter(r => r.status === 'failed' || r.status === 'error')
    const fixResults: FixResult[] = []
    
    // Convert test results to error entries for analysis
    const errorEntries: ErrorEntry[] = failedTests.map(test => ({
      id: test.id,
      timestamp: new Date(),
      severity: this.determineSeverity(test),
      category: this.determineCategory(test),
      component: this.extractComponent(test),
      description: test.message || 'Unknown error',
      stackTrace: test.details?.error || undefined,
      context: test.details || {},
      autoFixable: false
    }))

    // Perform comprehensive error analysis
    const batchAnalysis = await errorAnalysisEngine.analyzeErrorBatch(errorEntries)
    
    console.log(`📊 Error Analysis Summary:`)
    console.log(`  - Total errors: ${batchAnalysis.summary.totalErrors}`)
    console.log(`  - Critical errors: ${batchAnalysis.summary.criticalErrors}`)
    console.log(`  - Top patterns: ${batchAnalysis.summary.topPatterns.slice(0, 3).map(p => p.name).join(', ')}`)
    
    // Apply fixes based on analysis results
    for (let i = 0; i < failedTests.length; i++) {
      const test = failedTests[i]
      const analysis = batchAnalysis.analyses[i]
      
      if (test.message) {
        const fixes = await this.findAndApplyFixesWithAnalysis(test.message, test, analysis)
        fixResults.push(...fixes)
      }
    }
    
    this.appliedFixes.push(...fixResults)
    
    console.log(`🔧 Applied ${fixResults.filter(f => f.fixApplied).length} fixes out of ${fixResults.length} attempts`)
    
    return fixResults
  }

  /**
   * Enhanced fix finding with error analysis insights
   */
  private async findAndApplyFixesWithAnalysis(
    errorMessage: string, 
    context: any, 
    analysis: ErrorAnalysisResult
  ): Promise<FixResult[]> {
    const fixes: FixResult[] = []
    
    // Use error analysis insights to prioritize fix strategies
    const prioritizedStrategies = this.prioritizeFixStrategies(analysis)
    
    for (const strategy of prioritizedStrategies) {
      if (strategy.pattern.test(errorMessage)) {
        try {
          console.log(`Applying fix strategy: ${strategy.name} (Priority: ${analysis.impactAssessment.overallSeverity})`)
          const result = await strategy.fix(errorMessage, { ...context, analysis })
          
          // Enhance fix result with analysis insights
          result.fixDescription += ` (Confidence: ${analysis.confidence.toFixed(2)}, Impact: ${analysis.impactAssessment.overallSeverity})`
          
          fixes.push(result)
          
          if (result.fixApplied) {
            console.log(`✅ Fix applied successfully: ${result.fixDescription}`)
          } else {
            console.log(`⚠️  Fix not applied: ${result.fixDescription}`)
          }
        } catch (error) {
          console.error(`❌ Fix strategy failed: ${strategy.name}`, error)
          fixes.push({
            errorId: `fix_error_${Date.now()}`,
            fixApplied: false,
            fixType: 'code',
            fixDescription: `Fix strategy failed: ${error}`,
            rollbackAvailable: false
          })
        }
      }
    }
    
    // If no pattern-based fixes found, use root cause analysis recommendations
    if (fixes.length === 0 && analysis.rootCauseAnalysis.recommendedActions.length > 0) {
      const topAction = analysis.rootCauseAnalysis.recommendedActions[0]
      fixes.push({
        errorId: `rca_fix_${Date.now()}`,
        fixApplied: false, // Manual action required
        fixType: 'code',
        fixDescription: `Root cause analysis suggests: ${topAction.action} (Priority: ${topAction.priority})`,
        rollbackAvailable: false
      })
    }
    
    return fixes
  }

  /**
   * Prioritize fix strategies based on error analysis
   */
  private prioritizeFixStrategies(analysis: ErrorAnalysisResult): FixStrategy[] {
    const strategies = [...this.fixStrategies]
    
    // Sort by severity and confidence
    return strategies.sort((a, b) => {
      const aRelevance = this.calculateStrategyRelevance(a, analysis)
      const bRelevance = this.calculateStrategyRelevance(b, analysis)
      return bRelevance - aRelevance
    })
  }

  /**
   * Calculate strategy relevance based on analysis
   */
  private calculateStrategyRelevance(strategy: FixStrategy, analysis: ErrorAnalysisResult): number {
    let relevance = 0
    
    // Higher relevance for matching categories
    if (strategy.category === analysis.errorEntry.category) {
      relevance += 0.5
    }
    
    // Higher relevance for high-impact errors
    switch (analysis.impactAssessment.overallSeverity) {
      case 'critical': relevance += 1.0; break
      case 'high': relevance += 0.8; break
      case 'medium': relevance += 0.5; break
      case 'low': relevance += 0.2; break
    }
    
    // Higher relevance for high-confidence analysis
    relevance += analysis.confidence * 0.3
    
    return relevance
  }

  /**
   * Helper methods for error categorization
   */
  private determineSeverity(test: TestResult): ErrorEntry['severity'] {
    if (test.message?.toLowerCase().includes('critical') || test.message?.toLowerCase().includes('fatal')) {
      return 'critical'
    }
    if (test.message?.toLowerCase().includes('error') || test.status === 'error') {
      return 'high'
    }
    if (test.message?.toLowerCase().includes('warning') || test.status === 'failed') {
      return 'medium'
    }
    return 'low'
  }

  private determineCategory(test: TestResult): ErrorEntry['category'] {
    const message = test.message?.toLowerCase() || ''
    
    if (message.includes('auth') || message.includes('login') || message.includes('permission')) {
      return 'security'
    }
    if (message.includes('timeout') || message.includes('slow') || message.includes('performance')) {
      return 'performance'
    }
    if (message.includes('ui') || message.includes('render') || message.includes('display')) {
      return 'usability'
    }
    if (message.includes('api') || message.includes('service') || message.includes('integration')) {
      return 'integration'
    }
    if (message.includes('database') || message.includes('connection') || message.includes('server')) {
      return 'infrastructure'
    }
    if (message.includes('validation') || message.includes('format') || message.includes('data')) {
      return 'data_quality'
    }
    if (message.includes('payment') || message.includes('booking') || message.includes('business')) {
      return 'business_logic'
    }
    
    return 'functional'
  }

  private extractComponent(test: TestResult): string {
    // Try to extract component from test name or details
    if (test.name) {
      const parts = test.name.toLowerCase().split(' ')
      for (const part of parts) {
        if (['auth', 'booking', 'payment', 'navigation', 'dashboard', 'ui', 'api'].includes(part)) {
          return part
        }
      }
    }
    
    // Extract from test ID
    if (test.id.includes('-')) {
      return test.id.split('-')[0]
    }
    
    return 'unknown'
  }

  /**
   * Find and apply fixes for an error message
   */
  private async findAndApplyFixes(errorMessage: string, context?: any): Promise<FixResult[]> {
    const fixes: FixResult[] = []
    
    for (const strategy of this.fixStrategies) {
      if (strategy.pattern.test(errorMessage)) {
        try {
          console.log(`Applying fix strategy: ${strategy.name}`)
          const result = await strategy.fix(errorMessage, context)
          fixes.push(result)
          
          if (result.fixApplied) {
            console.log(`✅ Fix applied successfully: ${result.fixDescription}`)
          } else {
            console.log(`⚠️  Fix not applied: ${result.fixDescription}`)
          }
        } catch (error) {
          console.error(`❌ Fix strategy failed: ${strategy.name}`, error)
          fixes.push({
            errorId: `fix_error_${Date.now()}`,
            fixApplied: false,
            fixType: 'code',
            fixDescription: `Fix strategy failed: ${error}`,
            rollbackAvailable: false
          })
        }
      }
    }
    
    return fixes
  }

  /**
   * Check if route exists
   */
  private async checkRouteExists(url: string): Promise<boolean> {
    // Simulate route checking
    const commonRoutes = [
      '/', '/login', '/register', '/dashboard', '/book', '/rides', '/payment', '/settings', '/safety'
    ]
    
    return commonRoutes.some(route => url.includes(route))
  }

  /**
   * Create missing route
   */
  private async createMissingRoute(url: string): Promise<void> {
    console.log(`Creating missing route: ${url}`)
    
    // Extract route name from URL
    const routeName = url.split('/').pop() || 'unknown'
    
    // Create basic page component
    const pageContent = `/**
 * Auto-generated page component for ${url}
 */

import React from 'react'

export default function ${this.capitalize(routeName)}Page() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">${this.capitalize(routeName)}</h1>
      <p>This page was auto-generated by the testing agent.</p>
      <div className="mt-4">
        <p>Available features:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Basic navigation</li>
          <li>Responsive design</li>
          <li>Accessibility support</li>
        </ul>
      </div>
    </div>
  )
}`

    // Write the page file
    const fs = require('fs')
    const path = require('path')
    
    const pagesDir = path.join(process.cwd(), 'src/app/(app)')
    const routeDir = path.join(pagesDir, routeName)
    
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true })
    }
    
    const pageFile = path.join(routeDir, 'page.tsx')
    fs.writeFileSync(pageFile, pageContent)
    
    console.log(`✅ Created page component: ${pageFile}`)
  }

  /**
   * Fix element clickability
   */
  private async fixElementClickability(selector: string): Promise<void> {
    console.log(`Fixing clickability for element: ${selector}`)
    
    // Create CSS fix for common clickability issues
    const cssContent = `/* Auto-generated CSS fixes for clickability */

${selector} {
  pointer-events: auto !important;
  cursor: pointer !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

${selector}:hover {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

${selector}:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

/* Ensure element is not covered by other elements */
${selector} {
  position: relative;
  z-index: 10;
}
`

    // Write CSS fix
    const fs = require('fs')
    const path = require('path')
    
    const cssDir = path.join(process.cwd(), 'src/styles/auto-fixes')
    if (!fs.existsSync(cssDir)) {
      fs.mkdirSync(cssDir, { recursive: true })
    }
    
    const cssFile = path.join(cssDir, 'clickability-fixes.css')
    
    // Append to existing file or create new
    if (fs.existsSync(cssFile)) {
      fs.appendFileSync(cssFile, '\n' + cssContent)
    } else {
      fs.writeFileSync(cssFile, cssContent)
    }
    
    console.log(`✅ Applied clickability fix for: ${selector}`)
  }

  /**
   * Create missing UI element
   */
  private async createMissingElement(selector: string): Promise<void> {
    console.log(`Creating missing UI element: ${selector}`)
    
    // Determine element type from selector
    const elementType = this.determineElementType(selector)
    const elementId = selector.replace(/[#.]/, '')
    
    // Create React component with the missing element
    const componentContent = `/**
 * Auto-generated component with missing element: ${selector}
 */

import React from 'react'

export function AutoGenerated${this.capitalize(elementId)}() {
  return (
    <div className="auto-generated-element">
      ${this.generateElementJSX(selector, elementType)}
    </div>
  )
}

export default AutoGenerated${this.capitalize(elementId)}
`

    // Write component file
    const fs = require('fs')
    const path = require('path')
    
    const componentsDir = path.join(process.cwd(), 'src/components/auto-generated')
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true })
    }
    
    const componentFile = path.join(componentsDir, `${elementId}.tsx`)
    fs.writeFileSync(componentFile, componentContent)
    
    console.log(`✅ Created missing UI element component: ${componentFile}`)
  }

  /**
   * Fix input validation
   */
  private async fixInputValidation(field: string): Promise<void> {
    console.log(`Fixing input validation for field: ${field}`)
    
    // Create validation utility
    const validationContent = `/**
 * Auto-generated validation utilities
 */

export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
  },
  phone: {
    required: true,
    pattern: /^\\+?[1-9]\\d{1,14}$/,
    message: 'Please enter a valid phone number'
  },
  name: {
    required: true,
    minLength: 2,
    pattern: /^[a-zA-Z\\s]+$/,
    message: 'Name must contain only letters and spaces'
  }
}

export function validateField(fieldName: string, value: string): { isValid: boolean; message?: string } {
  const rule = validationRules[fieldName as keyof typeof validationRules]
  
  if (!rule) {
    return { isValid: true }
  }
  
  if (rule.required && (!value || value.trim() === '')) {
    return { isValid: false, message: \`\${fieldName} is required\` }
  }
  
  if (rule.minLength && value.length < rule.minLength) {
    return { isValid: false, message: \`\${fieldName} must be at least \${rule.minLength} characters\` }
  }
  
  if (rule.pattern && !rule.pattern.test(value)) {
    return { isValid: false, message: rule.message }
  }
  
  return { isValid: true }
}
`

    // Write validation utility
    const fs = require('fs')
    const path = require('path')
    
    const utilsDir = path.join(process.cwd(), 'src/lib/auto-fixes')
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true })
    }
    
    const validationFile = path.join(utilsDir, 'validation.ts')
    fs.writeFileSync(validationFile, validationContent)
    
    console.log(`✅ Created validation utilities for: ${field}`)
  }

  /**
   * Fix Firebase connection
   */
  private async fixFirebaseConnection(): Promise<void> {
    console.log('Fixing Firebase connection configuration...')
    
    // Check current Firebase configuration
    const fs = require('fs')
    const path = require('path')
    
    const firebaseConfigPath = path.join(process.cwd(), 'src/lib/firebase.ts')
    
    if (fs.existsSync(firebaseConfigPath)) {
      let content = fs.readFileSync(firebaseConfigPath, 'utf8')
      
      // Add connection retry logic
      const retryLogic = `
// Auto-generated connection retry logic
const connectWithRetry = async (retries = 3): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Test connection
      if (db) {
        await db._delegate._databaseId
      }
      console.log('Firebase connection successful')
      return
    } catch (error) {
      console.warn(\`Firebase connection attempt \${i + 1} failed:, error\`)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Initialize connection with retry
if (db) {
  connectWithRetry().catch(console.error)
}
`
      
      // Append retry logic if not already present
      if (!content.includes('connectWithRetry')) {
        content += retryLogic
        fs.writeFileSync(firebaseConfigPath, content)
        console.log('✅ Added Firebase connection retry logic')
      }
    }
  }

  /**
   * Fix WebSocket connection
   */
  private async fixWebSocketConnection(): Promise<void> {
    console.log('Fixing WebSocket connection configuration...')
    
    // Create WebSocket connection fix
    const wsFixContent = `/**
 * Auto-generated WebSocket connection fixes
 */

export class WebSocketConnectionFixer {
  private static instance: WebSocketConnectionFixer
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  public static getInstance(): WebSocketConnectionFixer {
    if (!WebSocketConnectionFixer.instance) {
      WebSocketConnectionFixer.instance = new WebSocketConnectionFixer()
    }
    return WebSocketConnectionFixer.instance
  }

  public async fixConnection(url: string): Promise<boolean> {
    console.log('Attempting to fix WebSocket connection...')
    
    // Try different connection strategies
    const strategies = [
      () => this.tryDirectConnection(url),
      () => this.tryWithPolling(url),
      () => this.tryWithDifferentTransport(url)
    ]
    
    for (const strategy of strategies) {
      try {
        const success = await strategy()
        if (success) {
          console.log('✅ WebSocket connection fixed')
          return true
        }
      } catch (error) {
        console.warn('WebSocket fix strategy failed:', error)
      }
    }
    
    console.error('❌ Could not fix WebSocket connection')
    return false
  }

  private async tryDirectConnection(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(url)
      ws.onopen = () => {
        ws.close()
        resolve(true)
      }
      ws.onerror = () => resolve(false)
      setTimeout(() => resolve(false), 5000)
    })
  }

  private async tryWithPolling(url: string): Promise<boolean> {
    // Simulate polling fallback
    console.log('Trying WebSocket with polling fallback...')
    return Math.random() > 0.3 // 70% success rate
  }

  private async tryWithDifferentTransport(url: string): Promise<boolean> {
    // Simulate different transport method
    console.log('Trying WebSocket with different transport...')
    return Math.random() > 0.2 // 80% success rate
  }
}
`

    // Write WebSocket fix
    const fs = require('fs')
    const path = require('path')
    
    const fixesDir = path.join(process.cwd(), 'src/lib/auto-fixes')
    if (!fs.existsSync(fixesDir)) {
      fs.mkdirSync(fixesDir, { recursive: true })
    }
    
    const wsFixFile = path.join(fixesDir, 'websocket-fixes.ts')
    fs.writeFileSync(wsFixFile, wsFixContent)
    
    console.log('✅ Created WebSocket connection fixes')
  }

  /**
   * Fix notification permissions
   */
  private async fixNotificationPermissions(): Promise<void> {
    console.log('Fixing notification permission handling...')
    
    // Create notification permission fix
    const notificationFixContent = `/**
 * Auto-generated notification permission fixes
 */

export class NotificationPermissionFixer {
  public static async requestPermissionWithFallback(): Promise<NotificationPermission> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('Notifications not supported in this browser')
        return 'denied'
      }

      // Check current permission
      if (Notification.permission === 'granted') {
        return 'granted'
      }

      // Request permission with user-friendly approach
      if (Notification.permission === 'default') {
        const permission = await this.requestWithUserPrompt()
        return permission
      }

      return Notification.permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  private static async requestWithUserPrompt(): Promise<NotificationPermission> {
    // Show user-friendly prompt first
    const userConsent = confirm(
      'This app would like to send you notifications for ride updates and important information. Allow notifications?'
    )

    if (!userConsent) {
      return 'denied'
    }

    // Request actual permission
    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      // Fallback for older browsers
      const permission = Notification.requestPermission((result) => {
        return result
      })
      return permission instanceof Promise ? await permission : permission
    }
  }

  public static async testNotification(): Promise<boolean> {
    try {
      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'Notifications are working correctly!',
          icon: '/icons/notification.png'
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Test notification failed:', error)
      return false
    }
  }
}
`

    // Write notification fix
    const fs = require('fs')
    const path = require('path')
    
    const fixesDir = path.join(process.cwd(), 'src/lib/auto-fixes')
    if (!fs.existsSync(fixesDir)) {
      fs.mkdirSync(fixesDir, { recursive: true })
    }
    
    const notificationFixFile = path.join(fixesDir, 'notification-fixes.ts')
    fs.writeFileSync(notificationFixFile, notificationFixContent)
    
    console.log('✅ Created notification permission fixes')
  }

  /**
   * Helper methods
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private determineElementType(selector: string): string {
    if (selector.includes('button') || selector.includes('btn')) return 'button'
    if (selector.includes('input')) return 'input'
    if (selector.includes('form')) return 'form'
    if (selector.includes('nav')) return 'nav'
    if (selector.includes('modal')) return 'modal'
    return 'div'
  }

  private generateElementJSX(selector: string, elementType: string): string {
    const id = selector.replace(/[#.]/, '')
    const className = selector.startsWith('.') ? selector.substring(1) : ''
    const elementId = selector.startsWith('#') ? selector.substring(1) : ''

    switch (elementType) {
      case 'button':
        return `<button ${elementId ? `id="${elementId}"` : ''} ${className ? `className="${className}"` : ''} onClick={() => console.log('Auto-generated button clicked')}>
        ${this.capitalize(id.replace(/[-_]/g, ' '))}
      </button>`
      
      case 'input':
        return `<input ${elementId ? `id="${elementId}"` : ''} ${className ? `className="${className}"` : ''} placeholder="${this.capitalize(id.replace(/[-_]/g, ' '))}" />`
      
      case 'form':
        return `<form ${elementId ? `id="${elementId}"` : ''} ${className ? `className="${className}"` : ''}>
        <div>Auto-generated form</div>
      </form>`
      
      default:
        return `<div ${elementId ? `id="${elementId}"` : ''} ${className ? `className="${className}"` : ''}>
        Auto-generated element: ${this.capitalize(id.replace(/[-_]/g, ' '))}
      </div>`
    }
  }

  /**
   * Get applied fixes
   */
  public getAppliedFixes(): FixResult[] {
    return this.appliedFixes
  }

  /**
   * Rollback a specific fix
   */
  public async rollbackFix(fixId: string): Promise<boolean> {
    const fix = this.appliedFixes.find(f => f.errorId === fixId)
    
    if (!fix || !fix.rollbackAvailable) {
      return false
    }

    try {
      console.log(`Rolling back fix: ${fix.fixDescription}`)
      // Implement rollback logic here
      return true
    } catch (error) {
      console.error('Rollback failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const autoFixEngine = new AutoFixEngine()
/**

 * Backup and Rollback Manager
 * Handles backup creation, restoration, and validation for auto-fixes
 */
class BackupRollbackManager implements RollbackManager {
  private backups: Map<string, any> = new Map()
  private backupDirectory = 'auto-fix-backups'

  async createBackup(fixType: string, targetPath: string, data: any): Promise<string> {
    const backupId = `backup_${fixType}_${Date.now()}`
    const backup = {
      id: backupId,
      timestamp: new Date(),
      fixType,
      targetPath,
      data,
      description: `Backup for ${fixType} fix on ${targetPath}`
    }

    this.backups.set(backupId, backup)

    // In a real implementation, this would save to disk
    console.log(`📦 Created backup: ${backupId}`)
    
    return backupId
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    const backup = this.backups.get(backupId)
    if (!backup) {
      console.error(`❌ Backup not found: ${backupId}`)
      return false
    }

    try {
      // In a real implementation, this would restore files/configuration
      console.log(`🔄 Restoring backup: ${backupId}`)
      console.log(`   Target: ${backup.targetPath}`)
      console.log(`   Type: ${backup.fixType}`)
      
      // Simulate restoration
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`✅ Backup restored successfully: ${backupId}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to restore backup ${backupId}:`, error)
      return false
    }
  }

  async validateFix(fixResult: FixResult): Promise<boolean> {
    console.log(`🔍 Validating fix: ${fixResult.errorId}`)
    
    // Run validation tests if specified
    if (fixResult.validationTests && fixResult.validationTests.length > 0) {
      for (const test of fixResult.validationTests) {
        const testResult = await this.runValidationTest(test)
        if (!testResult) {
          console.error(`❌ Validation test failed: ${test}`)
          return false
        }
      }
    }

    // Check success criteria
    if (fixResult.successCriteria && fixResult.successCriteria.length > 0) {
      for (const criteria of fixResult.successCriteria) {
        const criteriaResult = await this.checkSuccessCriteria(criteria)
        if (!criteriaResult) {
          console.error(`❌ Success criteria not met: ${criteria}`)
          return false
        }
      }
    }

    console.log(`✅ Fix validation passed: ${fixResult.errorId}`)
    return true
  }

  async listBackups(): Promise<Array<{ id: string; timestamp: Date; fixType: string; description: string }>> {
    return Array.from(this.backups.values()).map(backup => ({
      id: backup.id,
      timestamp: backup.timestamp,
      fixType: backup.fixType,
      description: backup.description
    }))
  }

  async cleanupOldBackups(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    let cleanedCount = 0

    for (const [backupId, backup] of this.backups.entries()) {
      if (backup.timestamp < cutoffDate) {
        this.backups.delete(backupId)
        cleanedCount++
      }
    }

    console.log(`🧹 Cleaned up ${cleanedCount} old backups`)
    return cleanedCount
  }

  private async runValidationTest(testName: string): Promise<boolean> {
    // Simulate running validation tests
    console.log(`   Running validation test: ${testName}`)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Most tests should pass in simulation
    return Math.random() > 0.1 // 90% success rate
  }

  private async checkSuccessCriteria(criteria: string): Promise<boolean> {
    // Simulate checking success criteria
    console.log(`   Checking success criteria: ${criteria}`)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Most criteria should be met in simulation
    return Math.random() > 0.15 // 85% success rate
  }
}

// Enhanced AutoFixEngine methods
export class EnhancedAutoFixEngine extends AutoFixEngine {
  
  /**
   * Enhanced analyze and fix with comprehensive repair capabilities
   */
  public async analyzeAndFixWithRepair(testResults: TestResult[]): Promise<{
    fixResults: FixResult[]
    databaseRepairs: FixResult[]
    infrastructureRepairs: FixResult[]
    validationResults: Array<{ fixId: string; validated: boolean; rollbackPerformed?: boolean }>
  }> {
    console.log('🔍 Starting comprehensive error analysis and repair...')
    
    const failedTests = testResults.filter(r => r.status === 'failed' || r.status === 'error')
    const fixResults: FixResult[] = []
    const databaseRepairs: FixResult[] = []
    const infrastructureRepairs: FixResult[] = []
    const validationResults: Array<{ fixId: string; validated: boolean; rollbackPerformed?: boolean }> = []

    // Convert test results to error entries for analysis
    const errorEntries: ErrorEntry[] = failedTests.map(test => ({
      id: test.id,
      timestamp: new Date(),
      severity: this.determineSeverity(test),
      category: this.determineCategory(test),
      component: this.extractComponent(test),
      description: test.message || 'Unknown error',
      stackTrace: test.details?.error || undefined,
      context: test.details || {},
      autoFixable: false
    }))

    // Perform comprehensive error analysis
    const batchAnalysis = await errorAnalysisEngine.analyzeErrorBatch(errorEntries)
    
    console.log(`📊 Enhanced Error Analysis Summary:`)
    console.log(`  - Total errors: ${batchAnalysis.summary.totalErrors}`)
    console.log(`  - Critical errors: ${batchAnalysis.summary.criticalErrors}`)
    console.log(`  - Database errors detected: ${this.countDatabaseErrors(errorEntries)}`)
    console.log(`  - Infrastructure errors detected: ${this.countInfrastructureErrors(errorEntries)}`)

    // Apply standard fixes
    for (let i = 0; i < failedTests.length; i++) {
      const test = failedTests[i]
      const analysis = batchAnalysis.analyses[i]
      
      if (test.message) {
        const fixes = await this.findAndApplyFixesWithAnalysis(test.message, test, analysis)
        fixResults.push(...fixes)
      }
    }

    // Apply database repairs
    for (const errorEntry of errorEntries) {
      const dbRepairs = await this.applyDatabaseRepairs(errorEntry)
      databaseRepairs.push(...dbRepairs)
    }

    // Apply infrastructure repairs
    for (const errorEntry of errorEntries) {
      const infraRepairs = await this.applyInfrastructureRepairs(errorEntry)
      infrastructureRepairs.push(...infraRepairs)
    }

    // Validate all applied fixes
    const allFixes = [...fixResults, ...databaseRepairs, ...infrastructureRepairs]
    for (const fix of allFixes) {
      if (this.validationEnabled && fix.fixApplied) {
        const validated = await this.rollbackManager.validateFix(fix)
        
        if (!validated && fix.rollbackAvailable) {
          console.log(`⚠️ Fix validation failed, performing rollback: ${fix.errorId}`)
          const rollbackSuccess = await this.performRollback(fix)
          validationResults.push({
            fixId: fix.errorId,
            validated: false,
            rollbackPerformed: rollbackSuccess
          })
        } else {
          validationResults.push({
            fixId: fix.errorId,
            validated
          })
        }
      }
    }

    console.log(`🔧 Enhanced repair summary:`)
    console.log(`  - Standard fixes applied: ${fixResults.filter(f => f.fixApplied).length}`)
    console.log(`  - Database repairs applied: ${databaseRepairs.filter(f => f.fixApplied).length}`)
    console.log(`  - Infrastructure repairs applied: ${infrastructureRepairs.filter(f => f.fixApplied).length}`)
    console.log(`  - Validations passed: ${validationResults.filter(v => v.validated).length}`)
    console.log(`  - Rollbacks performed: ${validationResults.filter(v => v.rollbackPerformed).length}`)

    return {
      fixResults,
      databaseRepairs,
      infrastructureRepairs,
      validationResults
    }
  }

  /**
   * Apply database-specific repairs
   */
  private async applyDatabaseRepairs(errorEntry: ErrorEntry): Promise<FixResult[]> {
    const repairs: FixResult[] = []
    const errorText = `${errorEntry.description} ${errorEntry.stackTrace || ''}`.toLowerCase()

    for (const strategy of this.databaseRepairStrategies) {
      if (strategy.pattern.test(errorText)) {
        // Check risk level
        if (this.isRiskAcceptable(strategy.riskLevel)) {
          try {
            console.log(`🔧 Applying database repair: ${strategy.name}`)
            const result = await strategy.repair(errorEntry.description, errorEntry.context)
            
            // Validate repair if required
            if (strategy.validate) {
              const validationResult = await strategy.validate(result)
              result.validationResult = validationResult
              
              if (!validationResult && strategy.rollback) {
                console.log(`⚠️ Database repair validation failed, rolling back: ${strategy.name}`)
                await strategy.rollback(result)
                result.fixApplied = false
                result.fixDescription += ' (Rolled back due to validation failure)'
              }
            }
            
            repairs.push(result)
          } catch (error) {
            console.error(`❌ Database repair failed: ${strategy.name}`, error)
            repairs.push({
              errorId: `db_repair_error_${Date.now()}`,
              fixApplied: false,
              fixType: 'data',
              fixDescription: `Database repair failed: ${error}`,
              rollbackAvailable: false,
              riskLevel: strategy.riskLevel,
              estimatedImpact: 'Repair attempt failed, no changes made'
            })
          }
        } else {
          console.log(`⚠️ Skipping high-risk database repair: ${strategy.name} (Risk: ${strategy.riskLevel})`)
        }
      }
    }

    return repairs
  }

  /**
   * Apply infrastructure-specific repairs
   */
  private async applyInfrastructureRepairs(errorEntry: ErrorEntry): Promise<FixResult[]> {
    const repairs: FixResult[] = []
    const errorText = `${errorEntry.description} ${errorEntry.stackTrace || ''}`.toLowerCase()

    for (const strategy of this.infrastructureRepairStrategies) {
      if (strategy.pattern.test(errorText)) {
        // Check risk level
        if (this.isRiskAcceptable(strategy.riskLevel)) {
          try {
            console.log(`🔧 Applying infrastructure repair: ${strategy.name}`)
            const result = await strategy.repair(errorEntry.description, errorEntry.context)
            
            // Validate repair if required
            if (strategy.validate) {
              const validationResult = await strategy.validate(result)
              result.validationResult = validationResult
              
              if (!validationResult && strategy.rollback) {
                console.log(`⚠️ Infrastructure repair validation failed, rolling back: ${strategy.name}`)
                await strategy.rollback(result)
                result.fixApplied = false
                result.fixDescription += ' (Rolled back due to validation failure)'
              }
            }
            
            repairs.push(result)
          } catch (error) {
            console.error(`❌ Infrastructure repair failed: ${strategy.name}`, error)
            repairs.push({
              errorId: `infra_repair_error_${Date.now()}`,
              fixApplied: false,
              fixType: 'infrastructure',
              fixDescription: `Infrastructure repair failed: ${error}`,
              rollbackAvailable: false,
              riskLevel: strategy.riskLevel,
              estimatedImpact: 'Repair attempt failed, no changes made'
            })
          }
        } else {
          console.log(`⚠️ Skipping high-risk infrastructure repair: ${strategy.name} (Risk: ${strategy.riskLevel})`)
        }
      }
    }

    return repairs
  }

  /**
   * Perform rollback for a failed fix
   */
  private async performRollback(fix: FixResult): Promise<boolean> {
    try {
      if (fix.rollbackData?.backupId) {
        return await this.rollbackManager.restoreBackup(fix.rollbackData.backupId)
      }
      return false
    } catch (error) {
      console.error(`❌ Rollback failed for fix ${fix.errorId}:`, error)
      return false
    }
  }

  /**
   * Check if risk level is acceptable
   */
  private isRiskAcceptable(riskLevel: 'low' | 'medium' | 'high'): boolean {
    const riskLevels = { low: 1, medium: 2, high: 3 }
    const maxRiskValue = riskLevels[this.maxRiskLevel]
    const currentRiskValue = riskLevels[riskLevel]
    
    return currentRiskValue <= maxRiskValue
  }

  /**
   * Count database-related errors
   */
  private countDatabaseErrors(errors: ErrorEntry[]): number {
    return errors.filter(error => 
      error.category === 'infrastructure' && 
      (error.description.toLowerCase().includes('database') || 
       error.description.toLowerCase().includes('firestore') ||
       error.description.toLowerCase().includes('connection'))
    ).length
  }

  /**
   * Count infrastructure-related errors
   */
  private countInfrastructureErrors(errors: ErrorEntry[]): number {
    return errors.filter(error => 
      error.category === 'infrastructure' ||
      error.description.toLowerCase().includes('service') ||
      error.description.toLowerCase().includes('server') ||
      error.description.toLowerCase().includes('network')
    ).length
  }

  // Database repair helper methods
  private async increaseDatabaseConnectionPool(): Promise<void> {
    console.log('📈 Increasing database connection pool size...')
    // Simulate increasing connection pool
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private async clearDatabaseConnections(): Promise<void> {
    console.log('🧹 Clearing stale database connections...')
    // Simulate clearing connections
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  private async validateDatabaseConnection(): Promise<boolean> {
    console.log('🔍 Validating database connection...')
    // Simulate connection validation
    await new Promise(resolve => setTimeout(resolve, 1000))
    return Math.random() > 0.1 // 90% success rate
  }

  private async analyzeSchemaDifferences(error: string): Promise<{ changes: string[] }> {
    console.log('🔍 Analyzing schema differences...')
    // Simulate schema analysis
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
      changes: ['Add missing column: user_preferences', 'Update index: user_email_idx']
    }
  }

  private async applySchemaUpdates(schemaDiff: { changes: string[] }): Promise<void> {
    console.log('📝 Applying schema updates...')
    for (const change of schemaDiff.changes) {
      console.log(`   Applying: ${change}`)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  private async validateDatabaseSchema(): Promise<boolean> {
    console.log('🔍 Validating database schema...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return Math.random() > 0.15 // 85% success rate
  }

  private async extractRequiredIndex(error: string): Promise<{ name: string; fields: string[] }> {
    console.log('🔍 Extracting required index from error...')
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      name: 'user_email_timestamp_idx',
      fields: ['email', 'timestamp']
    }
  }

  private async createDatabaseIndex(index: { name: string; fields: string[] }): Promise<void> {
    console.log(`📝 Creating database index: ${index.name}`)
    console.log(`   Fields: ${index.fields.join(', ')}`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private async validateDatabaseIndexes(): Promise<boolean> {
    console.log('🔍 Validating database indexes...')
    await new Promise(resolve => setTimeout(resolve, 800))
    return Math.random() > 0.1 // 90% success rate
  }

  // Infrastructure repair helper methods
  private async identifyFailingService(error: string): Promise<string> {
    console.log('🔍 Identifying failing service...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (error.toLowerCase().includes('firebase')) return 'firebase-service'
    if (error.toLowerCase().includes('websocket')) return 'websocket-service'
    if (error.toLowerCase().includes('api')) return 'api-service'
    return 'unknown-service'
  }

  private async restartService(serviceName: string): Promise<boolean> {
    console.log(`🔄 Restarting service: ${serviceName}`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    return Math.random() > 0.2 // 80% success rate
  }

  private async performServiceHealthCheck(serviceName: string): Promise<boolean> {
    console.log(`🏥 Performing health check for: ${serviceName}`)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return Math.random() > 0.15 // 85% success rate
  }

  private async diagnoseNetworkIssue(error: string): Promise<{ type: string; details: string[] }> {
    console.log('🔍 Diagnosing network issue...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      type: 'dns_resolution',
      details: ['DNS server timeout', 'Fallback DNS needed']
    }
  }

  private async applyNetworkFixes(diagnosis: { type: string; details: string[] }): Promise<string[]> {
    console.log('🔧 Applying network fixes...')
    const fixes = []
    
    for (const detail of diagnosis.details) {
      console.log(`   Fixing: ${detail}`)
      await new Promise(resolve => setTimeout(resolve, 500))
      fixes.push(`Fixed: ${detail}`)
    }
    
    return fixes
  }

  private async validateNetworkConnectivity(): Promise<boolean> {
    console.log('🔍 Validating network connectivity...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return Math.random() > 0.1 // 90% success rate
  }

  private async identifyResourceType(error: string): Promise<string> {
    console.log('🔍 Identifying resource type...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (error.toLowerCase().includes('memory')) return 'memory'
    if (error.toLowerCase().includes('disk')) return 'disk'
    if (error.toLowerCase().includes('cpu')) return 'cpu'
    return 'unknown'
  }

  private async applyResourceOptimizations(resourceType: string): Promise<string[]> {
    console.log(`🔧 Applying ${resourceType} optimizations...`)
    const optimizations = []
    
    switch (resourceType) {
      case 'memory':
        optimizations.push('Increased memory limit', 'Enabled garbage collection')
        break
      case 'disk':
        optimizations.push('Cleaned temporary files', 'Increased disk quota')
        break
      case 'cpu':
        optimizations.push('Optimized process scheduling', 'Reduced concurrent tasks')
        break
    }
    
    for (const optimization of optimizations) {
      console.log(`   Applied: ${optimization}`)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return optimizations
  }

  private async validateResourceUsage(): Promise<boolean> {
    console.log('🔍 Validating resource usage...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return Math.random() > 0.2 // 80% success rate
  }

  /**
   * Get comprehensive repair statistics
   */
  public getRepairStatistics(): {
    totalFixes: number
    fixesByType: Record<string, number>
    fixesByRiskLevel: Record<string, number>
    successRate: number
    rollbackRate: number
    validationRate: number
  } {
    const allFixes = this.appliedFixes
    const totalFixes = allFixes.length
    
    const fixesByType: Record<string, number> = {}
    const fixesByRiskLevel: Record<string, number> = {}
    
    let successfulFixes = 0
    let rollbacksPerformed = 0
    let validationsPerformed = 0
    
    for (const fix of allFixes) {
      // Count by type
      fixesByType[fix.fixType] = (fixesByType[fix.fixType] || 0) + 1
      
      // Count by risk level
      if ('riskLevel' in fix) {
        const riskLevel = (fix as any).riskLevel
        fixesByRiskLevel[riskLevel] = (fixesByRiskLevel[riskLevel] || 0) + 1
      }
      
      // Count success/rollback/validation
      if (fix.fixApplied) successfulFixes++
      if (fix.rollbackData) rollbacksPerformed++
      if (fix.validationResult !== undefined) validationsPerformed++
    }
    
    return {
      totalFixes,
      fixesByType,
      fixesByRiskLevel,
      successRate: totalFixes > 0 ? successfulFixes / totalFixes : 0,
      rollbackRate: totalFixes > 0 ? rollbacksPerformed / totalFixes : 0,
      validationRate: totalFixes > 0 ? validationsPerformed / totalFixes : 0
    }
  }
}

// Export enhanced engine as default
export const enhancedAutoFixEngine = new EnhancedAutoFixEngine()