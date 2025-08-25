import { EventEmitter } from 'events';
import { TestSession, ExecutionPlan } from './TestExecutionOrchestrator';

export interface QueueItem {
  session: TestSession;
  plan: ExecutionPlan;
  priority: number;
  estimatedDuration: number;
  queuedAt: Date;
  retryCount: number;
  maxRetries: number;
}

export interface QueueMetrics {
  totalItems: number;
  waitingItems: number;
  averageWaitTime: number;
  averagePriority: number;
  estimatedProcessingTime: number;
  throughput: number; // items per hour
}

export class ExecutionQueue extends EventEmitter {
  private queue: QueueItem[] = [];
  private processedItems: QueueItem[] = [];
  private maxQueueSize: number;
  private maxRetries: number;
  private priorityWeights: { [key: string]: number };

  constructor(options: {
    maxQueueSize?: number;
    maxRetries?: number;
    priorityWeights?: { [key: string]: number };
  } = {}) {
    super();
    
    this.maxQueueSize = options.maxQueueSize || 100;
    this.maxRetries = options.maxRetries || 3;
    this.priorityWeights = options.priorityWeights || {
      production: 100,
      staging: 50,
      development: 25,
      urgent: 200,
      normal: 100,
      low: 50
    };
  }

  public async enqueue(item: Omit<QueueItem, 'queuedAt' | 'retryCount' | 'maxRetries'>): Promise<void> {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error(`Queue is full. Maximum size: ${this.maxQueueSize}`);
    }

    const queueItem: QueueItem = {
      ...item,
      queuedAt: new Date(),
      retryCount: 0,
      maxRetries: this.maxRetries
    };

    // Insert item in priority order
    this.insertByPriority(queueItem);
    
    this.emit('itemEnqueued', queueItem);
    this.emit('queueUpdated', this.getMetrics());
  }

  public async dequeue(): Promise<QueueItem | null> {
    if (this.queue.length === 0) {
      return null;
    }

    const item = this.queue.shift()!;
    this.emit('itemDequeued', item);
    this.emit('queueUpdated', this.getMetrics());
    
    return item;
  }

  public async peek(): Promise<QueueItem | null> {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  public async requeue(item: QueueItem, reason: string): Promise<void> {
    if (item.retryCount >= item.maxRetries) {
      this.emit('itemFailed', { item, reason: `Max retries exceeded: ${reason}` });
      return;
    }

    item.retryCount++;
    item.queuedAt = new Date();
    
    // Reduce priority for retried items to prevent starvation
    item.priority = Math.max(1, item.priority - 10);
    
    this.insertByPriority(item);
    
    this.emit('itemRequeued', { item, reason, retryCount: item.retryCount });
    this.emit('queueUpdated', this.getMetrics());
  }

  public getQueue(): QueueItem[] {
    return [...this.queue];
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public getMetrics(): QueueMetrics {
    const now = new Date();
    const totalItems = this.queue.length + this.processedItems.length;
    const waitingItems = this.queue.length;
    
    // Calculate average wait time
    const waitTimes = this.queue.map(item => now.getTime() - item.queuedAt.getTime());
    const averageWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
      : 0;
    
    // Calculate average priority
    const averagePriority = this.queue.length > 0
      ? this.queue.reduce((sum, item) => sum + item.priority, 0) / this.queue.length
      : 0;
    
    // Estimate processing time
    const estimatedProcessingTime = this.queue.reduce((sum, item) => sum + item.estimatedDuration, 0);
    
    // Calculate throughput (items processed in last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentlyProcessed = this.processedItems.filter(item => 
      item.queuedAt >= oneHourAgo
    );
    const throughput = recentlyProcessed.length;

    return {
      totalItems,
      waitingItems,
      averageWaitTime,
      averagePriority,
      estimatedProcessingTime,
      throughput
    };
  }

  public findItemBySessionId(sessionId: string): QueueItem | null {
    return this.queue.find(item => item.session.id === sessionId) || null;
  }

  public removeItemBySessionId(sessionId: string): boolean {
    const index = this.queue.findIndex(item => item.session.id === sessionId);
    if (index !== -1) {
      const removedItem = this.queue.splice(index, 1)[0];
      this.emit('itemRemoved', removedItem);
      this.emit('queueUpdated', this.getMetrics());
      return true;
    }
    return false;
  }

  public updatePriority(sessionId: string, newPriority: number): boolean {
    const itemIndex = this.queue.findIndex(item => item.session.id === sessionId);
    if (itemIndex === -1) {
      return false;
    }

    const item = this.queue.splice(itemIndex, 1)[0];
    item.priority = newPriority;
    this.insertByPriority(item);
    
    this.emit('priorityUpdated', { sessionId, newPriority });
    this.emit('queueUpdated', this.getMetrics());
    
    return true;
  }

  public optimizeQueue(): void {
    // Reorder queue based on current conditions
    this.queue.sort((a, b) => {
      // Multi-criteria sorting
      const priorityDiff = b.priority - a.priority;
      if (Math.abs(priorityDiff) > 10) {
        return priorityDiff;
      }
      
      // If priorities are similar, consider wait time
      const waitTimeA = Date.now() - a.queuedAt.getTime();
      const waitTimeB = Date.now() - b.queuedAt.getTime();
      const waitTimeDiff = waitTimeB - waitTimeA;
      
      if (Math.abs(waitTimeDiff) > 300000) { // 5 minutes
        return waitTimeDiff;
      }
      
      // If wait times are similar, consider estimated duration (shorter first)
      return a.estimatedDuration - b.estimatedDuration;
    });
    
    this.emit('queueOptimized', this.getMetrics());
  }

  public getQueuePosition(sessionId: string): number {
    const index = this.queue.findIndex(item => item.session.id === sessionId);
    return index === -1 ? -1 : index + 1; // 1-based position
  }

  public getEstimatedWaitTime(sessionId: string): number {
    const position = this.getQueuePosition(sessionId);
    if (position === -1) {
      return 0; // Not in queue
    }
    
    // Sum estimated durations of items ahead in queue
    let estimatedWait = 0;
    for (let i = 0; i < position - 1; i++) {
      estimatedWait += this.queue[i].estimatedDuration;
    }
    
    return estimatedWait;
  }

  public getQueueHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check queue size
    if (metrics.waitingItems > this.maxQueueSize * 0.8) {
      issues.push('Queue is approaching capacity');
      recommendations.push('Consider increasing queue size or processing capacity');
      status = 'warning';
    }

    if (metrics.waitingItems >= this.maxQueueSize) {
      issues.push('Queue is at maximum capacity');
      recommendations.push('Immediate action required: increase processing capacity');
      status = 'critical';
    }

    // Check average wait time
    if (metrics.averageWaitTime > 1800000) { // 30 minutes
      issues.push('High average wait time detected');
      recommendations.push('Optimize queue processing or increase concurrent execution capacity');
      if (status === 'healthy') status = 'warning';
    }

    if (metrics.averageWaitTime > 3600000) { // 1 hour
      issues.push('Critical wait time detected');
      recommendations.push('Urgent: Review queue processing bottlenecks');
      status = 'critical';
    }

    // Check throughput
    if (metrics.throughput < 5 && metrics.waitingItems > 0) {
      issues.push('Low throughput detected');
      recommendations.push('Investigate processing bottlenecks and optimize execution');
      if (status === 'healthy') status = 'warning';
    }

    // Check for stale items
    const now = new Date();
    const staleItems = this.queue.filter(item => 
      now.getTime() - item.queuedAt.getTime() > 7200000 // 2 hours
    );

    if (staleItems.length > 0) {
      issues.push(`${staleItems.length} items have been waiting over 2 hours`);
      recommendations.push('Review long-waiting items for potential issues');
      if (status === 'healthy') status = 'warning';
    }

    return { status, issues, recommendations };
  }

  public clear(): void {
    const clearedItems = [...this.queue];
    this.queue.length = 0;
    
    this.emit('queueCleared', { clearedItems: clearedItems.length });
    this.emit('queueUpdated', this.getMetrics());
  }

  public getItemsByPriority(minPriority: number): QueueItem[] {
    return this.queue.filter(item => item.priority >= minPriority);
  }

  public getItemsByEnvironment(environment: string): QueueItem[] {
    return this.queue.filter(item => item.session.configuration.environment === environment);
  }

  public markItemProcessed(item: QueueItem): void {
    this.processedItems.push({
      ...item,
      queuedAt: new Date() // Mark when processing completed
    });
    
    // Keep only recent processed items (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.processedItems = this.processedItems.filter(processedItem => 
      processedItem.queuedAt >= cutoff
    );
    
    this.emit('itemProcessed', item);
  }

  private insertByPriority(item: QueueItem): void {
    // Find the correct position to insert the item
    let insertIndex = 0;
    
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < item.priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    
    this.queue.splice(insertIndex, 0, item);
  }

  private calculateDynamicPriority(item: QueueItem): number {
    let priority = item.priority;
    
    // Increase priority based on wait time (aging)
    const waitTime = Date.now() - item.queuedAt.getTime();
    const agingBonus = Math.floor(waitTime / 300000) * 5; // +5 priority per 5 minutes
    priority += agingBonus;
    
    // Adjust based on environment
    const envWeight = this.priorityWeights[item.session.configuration.environment] || 100;
    priority = (priority * envWeight) / 100;
    
    // Adjust based on retry count (lower priority for retries)
    priority -= item.retryCount * 10;
    
    return Math.max(1, priority);
  }

  public startPeriodicOptimization(intervalMs: number = 300000): void {
    setInterval(() => {
      this.optimizeQueue();
      
      // Update dynamic priorities
      this.queue.forEach(item => {
        item.priority = this.calculateDynamicPriority(item);
      });
      
      // Re-sort after priority updates
      this.queue.sort((a, b) => b.priority - a.priority);
      
    }, intervalMs);
  }

  public getStatistics(): {
    totalProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    retryRate: number;
    queueHealth: ReturnType<ExecutionQueue['getQueueHealth']>;
  } {
    const totalProcessed = this.processedItems.length;
    const averageProcessingTime = totalProcessed > 0
      ? this.processedItems.reduce((sum, item) => sum + item.estimatedDuration, 0) / totalProcessed
      : 0;
    
    const retriedItems = this.processedItems.filter(item => item.retryCount > 0);
    const retryRate = totalProcessed > 0 ? (retriedItems.length / totalProcessed) * 100 : 0;
    
    // Assume success rate based on completed items (simplified)
    const successRate = totalProcessed > 0 ? ((totalProcessed - retriedItems.length) / totalProcessed) * 100 : 100;
    
    return {
      totalProcessed,
      averageProcessingTime,
      successRate,
      retryRate,
      queueHealth: this.getQueueHealth()
    };
  }
}