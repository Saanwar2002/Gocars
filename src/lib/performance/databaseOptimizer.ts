// Database query optimization and performance monitoring

interface QueryPlan {
  query: string;
  estimatedCost: number;
  actualCost?: number;
  executionTime?: number;
  indexesUsed: string[];
  suggestedIndexes: string[];
  optimizations: QueryOptimization[];
}

interface QueryOptimization {
  type: 'index' | 'rewrite' | 'cache' | 'partition';
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedImprovement: number;
  implementation: string;
}

interface DatabaseMetrics {
  connectionPoolSize: number;
  activeConnections: number;
  averageQueryTime: number;
  slowQueries: SlowQuery[];
  cacheHitRate: number;
  indexEfficiency: number;
  deadlockCount: number;
  lockWaitTime: number;
}

interface SlowQuery {
  query: string;
  executionTime: number;
  frequency: number;
  lastExecuted: Date;
  affectedRows: number;
  suggestedOptimizations: QueryOptimization[];
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: number;
  priority: 'high' | 'medium' | 'low';
}

export class DatabaseOptimizer {
  private queryCache: Map<string, QueryPlan> = new Map();
  private metrics: DatabaseMetrics = {
    connectionPoolSize: 10,
    activeConnections: 0,
    averageQueryTime: 0,
    slowQueries: [],
    cacheHitRate: 0,
    indexEfficiency: 0,
    deadlockCount: 0,
    lockWaitTime: 0,
  };
  private queryHistory: Map<string, number[]> = new Map();

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor database performance metrics
    setInterval(() => {
      this.updateMetrics();
      this.analyzeSlowQueries();
      this.optimizeConnectionPool();
    }, 30000); // Every 30 seconds
  }

  // Query optimization
  public optimizeQuery(query: string): QueryPlan {
    const normalizedQuery = this.normalizeQuery(query);
    
    // Check cache first
    if (this.queryCache.has(normalizedQuery)) {
      return this.queryCache.get(normalizedQuery)!;
    }

    const plan = this.analyzeQuery(query);
    this.queryCache.set(normalizedQuery, plan);
    
    return plan;
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\$\d+/g, '?') // Replace parameterized queries
      .trim();
  }

  private analyzeQuery(query: string): QueryPlan {
    const optimizations: QueryOptimization[] = [];
    const suggestedIndexes: string[] = [];
    let estimatedCost = this.estimateQueryCost(query);

    // Analyze SELECT queries
    if (query.toLowerCase().includes('select')) {
      optimizations.push(...this.optimizeSelectQuery(query));
    }

    // Analyze JOIN operations
    if (query.toLowerCase().includes('join')) {
      optimizations.push(...this.optimizeJoinQuery(query));
    }

    // Analyze WHERE clauses
    if (query.toLowerCase().includes('where')) {
      const whereOptimizations = this.optimizeWhereClause(query);
      optimizations.push(...whereOptimizations);
      suggestedIndexes.push(...this.suggestIndexesForWhere(query));
    }

    // Analyze ORDER BY clauses
    if (query.toLowerCase().includes('order by')) {
      optimizations.push(...this.optimizeOrderBy(query));
      suggestedIndexes.push(...this.suggestIndexesForOrderBy(query));
    }

    // Analyze GROUP BY clauses
    if (query.toLowerCase().includes('group by')) {
      optimizations.push(...this.optimizeGroupBy(query));
    }

    return {
      query,
      estimatedCost,
      indexesUsed: this.findUsedIndexes(query),
      suggestedIndexes,
      optimizations: optimizations.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      }),
    };
  }

  private estimateQueryCost(query: string): number {
    // Simple cost estimation based on query complexity
    let cost = 1;
    
    // Base cost for different operations
    if (query.includes('SELECT')) cost += 1;
    if (query.includes('JOIN')) cost += 5;
    if (query.includes('SUBQUERY') || query.includes('(SELECT')) cost += 10;
    if (query.includes('ORDER BY')) cost += 3;
    if (query.includes('GROUP BY')) cost += 4;
    if (query.includes('DISTINCT')) cost += 2;
    
    // Count table references
    const tableMatches = query.match(/FROM\s+\w+/gi) || [];
    cost += tableMatches.length * 2;
    
    // Count WHERE conditions
    const whereMatches = query.match(/WHERE.*?(?=ORDER|GROUP|LIMIT|$)/gi) || [];
    if (whereMatches.length > 0) {
      const conditions = whereMatches[0].split(/AND|OR/i).length;
      cost += conditions;
    }
    
    return cost;
  }

  private optimizeSelectQuery(query: string): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];

    // Check for SELECT *
    if (query.includes('SELECT *')) {
      optimizations.push({
        type: 'rewrite',
        description: 'Replace SELECT * with specific column names',
        impact: 'medium',
        estimatedImprovement: 20,
        implementation: 'Specify only the columns you need to reduce data transfer and improve performance',
      });
    }

    // Check for unnecessary DISTINCT
    if (query.includes('DISTINCT') && !this.needsDistinct(query)) {
      optimizations.push({
        type: 'rewrite',
        description: 'Remove unnecessary DISTINCT clause',
        impact: 'low',
        estimatedImprovement: 10,
        implementation: 'Remove DISTINCT if the query naturally returns unique results',
      });
    }

    // Check for subqueries that can be converted to JOINs
    if (query.includes('IN (SELECT') || query.includes('EXISTS (SELECT')) {
      optimizations.push({
        type: 'rewrite',
        description: 'Convert subquery to JOIN for better performance',
        impact: 'high',
        estimatedImprovement: 40,
        implementation: 'Rewrite subquery as an INNER JOIN or LEFT JOIN',
      });
    }

    return optimizations;
  }

  private optimizeJoinQuery(query: string): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];

    // Check JOIN order
    const joinCount = (query.match(/JOIN/gi) || []).length;
    if (joinCount > 2) {
      optimizations.push({
        type: 'rewrite',
        description: 'Optimize JOIN order for better performance',
        impact: 'high',
        estimatedImprovement: 30,
        implementation: 'Order JOINs from smallest to largest table, or most selective to least selective',
      });
    }

    // Check for missing JOIN conditions
    if (this.hasMissingJoinConditions(query)) {
      optimizations.push({
        type: 'rewrite',
        description: 'Add missing JOIN conditions to prevent Cartesian products',
        impact: 'high',
        estimatedImprovement: 80,
        implementation: 'Ensure all JOINs have proper ON conditions',
      });
    }

    return optimizations;
  }

  private optimizeWhereClause(query: string): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];

    // Check for functions in WHERE clause
    if (query.match(/WHERE.*\w+\(/)) {
      optimizations.push({
        type: 'rewrite',
        description: 'Avoid functions in WHERE clause for better index usage',
        impact: 'medium',
        estimatedImprovement: 25,
        implementation: 'Move function calls out of WHERE clause or create functional indexes',
      });
    }

    // Check for leading wildcards in LIKE
    if (query.includes("LIKE '%")) {
      optimizations.push({
        type: 'index',
        description: 'Leading wildcards prevent index usage',
        impact: 'medium',
        estimatedImprovement: 35,
        implementation: 'Consider full-text search or reverse indexing for leading wildcard searches',
      });
    }

    // Check for OR conditions that could use UNION
    const orCount = (query.match(/\sOR\s/gi) || []).length;
    if (orCount > 2) {
      optimizations.push({
        type: 'rewrite',
        description: 'Consider using UNION instead of multiple OR conditions',
        impact: 'medium',
        estimatedImprovement: 20,
        implementation: 'Split OR conditions into separate queries with UNION',
      });
    }

    return optimizations;
  }

  private optimizeOrderBy(query: string): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];

    // Check if ORDER BY can use an index
    if (!this.canUseIndexForOrderBy(query)) {
      optimizations.push({
        type: 'index',
        description: 'Create index to support ORDER BY clause',
        impact: 'high',
        estimatedImprovement: 50,
        implementation: 'Create composite index on ORDER BY columns',
      });
    }

    // Check for ORDER BY with LIMIT
    if (query.includes('ORDER BY') && query.includes('LIMIT')) {
      optimizations.push({
        type: 'index',
        description: 'Optimize ORDER BY with LIMIT using covering index',
        impact: 'high',
        estimatedImprovement: 60,
        implementation: 'Create covering index that includes ORDER BY and SELECT columns',
      });
    }

    return optimizations;
  }

  private optimizeGroupBy(query: string): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];

    // Check if GROUP BY can use an index
    if (!this.canUseIndexForGroupBy(query)) {
      optimizations.push({
        type: 'index',
        description: 'Create index to support GROUP BY clause',
        impact: 'high',
        estimatedImprovement: 45,
        implementation: 'Create index on GROUP BY columns',
      });
    }

    // Check for HAVING clause that could be WHERE
    if (query.includes('HAVING') && !query.includes('COUNT') && !query.includes('SUM')) {
      optimizations.push({
        type: 'rewrite',
        description: 'Move HAVING conditions to WHERE clause when possible',
        impact: 'medium',
        estimatedImprovement: 15,
        implementation: 'Use WHERE instead of HAVING for non-aggregate conditions',
      });
    }

    return optimizations;
  }

  // Index analysis and recommendations
  public analyzeIndexUsage(tableName: string): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    
    // Analyze slow queries for this table
    const tableQueries = this.metrics.slowQueries.filter(q => 
      q.query.toLowerCase().includes(tableName.toLowerCase())
    );

    for (const slowQuery of tableQueries) {
      const queryRecommendations = this.getIndexRecommendationsForQuery(slowQuery.query, tableName);
      recommendations.push(...queryRecommendations);
    }

    // Remove duplicates and sort by priority
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
    return uniqueRecommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private getIndexRecommendationsForQuery(query: string, tableName: string): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    
    // Analyze WHERE clause columns
    const whereColumns = this.extractWhereColumns(query, tableName);
    if (whereColumns.length > 0) {
      recommendations.push({
        table: tableName,
        columns: whereColumns,
        type: 'btree',
        reason: 'Improve WHERE clause performance',
        estimatedImprovement: 40,
        priority: 'high',
      });
    }

    // Analyze JOIN columns
    const joinColumns = this.extractJoinColumns(query, tableName);
    if (joinColumns.length > 0) {
      recommendations.push({
        table: tableName,
        columns: joinColumns,
        type: 'btree',
        reason: 'Improve JOIN performance',
        estimatedImprovement: 50,
        priority: 'high',
      });
    }

    // Analyze ORDER BY columns
    const orderByColumns = this.extractOrderByColumns(query, tableName);
    if (orderByColumns.length > 0) {
      recommendations.push({
        table: tableName,
        columns: orderByColumns,
        type: 'btree',
        reason: 'Improve ORDER BY performance',
        estimatedImprovement: 35,
        priority: 'medium',
      });
    }

    return recommendations;
  }

  // Connection pool optimization
  private optimizeConnectionPool(): void {
    const { activeConnections, connectionPoolSize, averageQueryTime } = this.metrics;
    
    // Adjust pool size based on usage
    const utilizationRate = activeConnections / connectionPoolSize;
    
    if (utilizationRate > 0.8 && averageQueryTime > 1000) {
      // High utilization and slow queries - increase pool size
      this.metrics.connectionPoolSize = Math.min(connectionPoolSize + 2, 50);
    } else if (utilizationRate < 0.3 && connectionPoolSize > 5) {
      // Low utilization - decrease pool size
      this.metrics.connectionPoolSize = Math.max(connectionPoolSize - 1, 5);
    }
  }

  // Query caching
  public cacheQuery(query: string, result: any, ttl: number = 300000): void {
    // This would integrate with your caching system
    const cacheKey = `query:${this.hashQuery(query)}`;
    
    // Store in cache with TTL
    if (typeof localStorage !== 'undefined') {
      const cacheEntry = {
        result,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    }
  }

  public getCachedQuery(query: string): any | null {
    const cacheKey = `query:${this.hashQuery(query)}`;
    
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const entry = JSON.parse(cached);
        if (Date.now() - entry.timestamp < entry.ttl) {
          return entry.result;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    }
    
    return null;
  }

  private hashQuery(query: string): string {
    // Simple hash function for query caching
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Monitoring and metrics
  private updateMetrics(): void {
    // This would integrate with your database monitoring
    // For now, simulate metrics updates
    this.metrics.activeConnections = Math.floor(Math.random() * this.metrics.connectionPoolSize);
    this.metrics.averageQueryTime = 50 + Math.random() * 200;
    this.metrics.cacheHitRate = 0.7 + Math.random() * 0.3;
    this.metrics.indexEfficiency = 0.8 + Math.random() * 0.2;
  }

  private analyzeSlowQueries(): void {
    // Analyze query history for slow queries
    for (const [query, times] of this.queryHistory.entries()) {
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      if (averageTime > 1000 && times.length > 5) { // Slow and frequent
        const existingSlowQuery = this.metrics.slowQueries.find(sq => sq.query === query);
        
        if (existingSlowQuery) {
          existingSlowQuery.executionTime = averageTime;
          existingSlowQuery.frequency = times.length;
          existingSlowQuery.lastExecuted = new Date();
        } else {
          this.metrics.slowQueries.push({
            query,
            executionTime: averageTime,
            frequency: times.length,
            lastExecuted: new Date(),
            affectedRows: Math.floor(Math.random() * 1000),
            suggestedOptimizations: this.optimizeQuery(query).optimizations,
          });
        }
      }
    }

    // Keep only top 20 slow queries
    this.metrics.slowQueries = this.metrics.slowQueries
      .sort((a, b) => b.executionTime * b.frequency - a.executionTime * a.frequency)
      .slice(0, 20);
  }

  public recordQueryExecution(query: string, executionTime: number): void {
    const normalizedQuery = this.normalizeQuery(query);
    
    if (!this.queryHistory.has(normalizedQuery)) {
      this.queryHistory.set(normalizedQuery, []);
    }
    
    const times = this.queryHistory.get(normalizedQuery)!;
    times.push(executionTime);
    
    // Keep only last 100 executions
    if (times.length > 100) {
      times.splice(0, times.length - 100);
    }
  }

  // Utility methods
  private needsDistinct(query: string): boolean {
    // Simple heuristic - check if query has JOINs that might create duplicates
    return query.toLowerCase().includes('join') && 
           !query.toLowerCase().includes('group by');
  }

  private hasMissingJoinConditions(query: string): boolean {
    const joinCount = (query.match(/JOIN/gi) || []).length;
    const onCount = (query.match(/ON/gi) || []).length;
    return joinCount > onCount;
  }

  private canUseIndexForOrderBy(query: string): boolean {
    // Simplified check - in reality, this would be more complex
    return query.includes('ORDER BY id') || query.includes('ORDER BY created_at');
  }

  private canUseIndexForGroupBy(query: string): boolean {
    // Simplified check
    return query.includes('GROUP BY id') || query.includes('GROUP BY user_id');
  }

  private findUsedIndexes(query: string): string[] {
    // This would integrate with database EXPLAIN plans
    return ['idx_user_id', 'idx_created_at'];
  }

  private suggestIndexesForWhere(query: string): string[] {
    const suggestions: string[] = [];
    
    // Extract column names from WHERE clause
    const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columns = whereClause.match(/\b\w+\s*[=<>]/g) || [];
      
      columns.forEach(col => {
        const columnName = col.replace(/\s*[=<>].*/, '').trim();
        suggestions.push(`idx_${columnName}`);
      });
    }
    
    return suggestions;
  }

  private suggestIndexesForOrderBy(query: string): string[] {
    const suggestions: string[] = [];
    
    const orderByMatch = query.match(/ORDER BY\s+(.+?)(?:\s+LIMIT|$)/i);
    if (orderByMatch) {
      const orderByClause = orderByMatch[1];
      const columns = orderByClause.split(',').map(col => 
        col.trim().replace(/\s+(ASC|DESC)$/i, '')
      );
      
      if (columns.length === 1) {
        suggestions.push(`idx_${columns[0]}`);
      } else {
        suggestions.push(`idx_${columns.join('_')}`);
      }
    }
    
    return suggestions;
  }

  private extractWhereColumns(query: string, tableName: string): string[] {
    // Simplified extraction - would be more sophisticated in practice
    const columns: string[] = [];
    const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i);
    
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columnMatches = whereClause.match(/\b\w+\s*[=<>]/g) || [];
      
      columnMatches.forEach(match => {
        const column = match.replace(/\s*[=<>].*/, '').trim();
        if (!columns.includes(column)) {
          columns.push(column);
        }
      });
    }
    
    return columns;
  }

  private extractJoinColumns(query: string, tableName: string): string[] {
    const columns: string[] = [];
    const joinMatches = query.match(/JOIN\s+\w+\s+ON\s+(.+?)(?:\s+WHERE|\s+ORDER|\s+GROUP|$)/gi) || [];
    
    joinMatches.forEach(joinClause => {
      const onMatch = joinClause.match(/ON\s+(.+)/i);
      if (onMatch) {
        const condition = onMatch[1];
        const columnMatches = condition.match(/\b\w+\.\w+/g) || [];
        
        columnMatches.forEach(match => {
          const [table, column] = match.split('.');
          if (table === tableName && !columns.includes(column)) {
            columns.push(column);
          }
        });
      }
    });
    
    return columns;
  }

  private extractOrderByColumns(query: string, tableName: string): string[] {
    const columns: string[] = [];
    const orderByMatch = query.match(/ORDER BY\s+(.+?)(?:\s+LIMIT|$)/i);
    
    if (orderByMatch) {
      const orderByClause = orderByMatch[1];
      const columnMatches = orderByClause.split(',');
      
      columnMatches.forEach(match => {
        const column = match.trim().replace(/\s+(ASC|DESC)$/i, '');
        if (column.includes('.')) {
          const [table, col] = column.split('.');
          if (table === tableName && !columns.includes(col)) {
            columns.push(col);
          }
        } else if (!columns.includes(column)) {
          columns.push(column);
        }
      });
    }
    
    return columns;
  }

  private deduplicateRecommendations(recommendations: IndexRecommendation[]): IndexRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = `${rec.table}:${rec.columns.join(',')}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Public API
  public getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  public getSlowQueries(): SlowQuery[] {
    return [...this.metrics.slowQueries];
  }

  public generateOptimizationReport(): {
    metrics: DatabaseMetrics;
    slowQueries: SlowQuery[];
    indexRecommendations: IndexRecommendation[];
    queryOptimizations: QueryPlan[];
  } {
    const indexRecommendations: IndexRecommendation[] = [];
    const queryOptimizations: QueryPlan[] = [];

    // Generate recommendations for all slow queries
    this.metrics.slowQueries.forEach(slowQuery => {
      const plan = this.optimizeQuery(slowQuery.query);
      queryOptimizations.push(plan);
    });

    return {
      metrics: this.getMetrics(),
      slowQueries: this.getSlowQueries(),
      indexRecommendations,
      queryOptimizations,
    };
  }
}

// Singleton instance
export const databaseOptimizer = new DatabaseOptimizer();