import { EventEmitter } from 'events';
import { ResourceRequirements } from './TestExecutionOrchestrator';

export interface ResourceAllocation {
  sessionId: string;
  allocatedAt: Date;
  resources: ResourceRequirements;
}

export interface ResourceUsageMetrics {
  timestamp: Date;
  totalMemory: number;
  usedMemory: number;
  totalCpu: number;
  usedCpu: number;
  totalNetwork: number;
  usedNetwork: number;
  totalStorage: number;
  usedStorage: number;
  totalConcurrentUsers: number;
  usedConcurrentUsers: number;
  efficiency: number;
}

export class ResourcePool extends EventEmitter {
  private totalResources: ResourceRequirements;
  private allocations: Map<string, ResourceAllocation> = new Map();
  private usageHistory: ResourceUsageMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(limits?: ResourceRequirements) {
    super();
    
    // Set default resource limits based on system capabilities
    this.totalResources = limits || this.detectSystemResources();
    
    // Start resource monitoring
    this.startMonitoring();
  }

  public async reserveResources(sessionId: string, requirements: ResourceRequirements): Promise<void> {
    const available = this.getAvailableResources();
    
    // Check if resources are available
    if (!this.canAllocateResources(requirements, available)) {
      throw new Error(`Insufficient resources for session ${sessionId}: ${JSON.stringify({
        required: requirements,
        available
      })}`);
    }
    
    // Reserve the resources
    const allocation: ResourceAllocation = {
      sessionId,
      allocatedAt: new Date(),
      resources: requirements
    };
    
    this.allocations.set(sessionId, allocation);
    
    this.emit('resourcesReserved', { sessionId, allocation });
  }

  public async releaseResources(sessionId: string): Promise<void> {
    const allocation = this.allocations.get(sessionId);
    if (!allocation) {
      return; // Already released or never allocated
    }
    
    this.allocations.delete(sessionId);
    
    this.emit('resourcesReleased', { sessionId, allocation });
  }

  public getAvailableResources(): ResourceRequirements {
    const used = this.getUsedResources();
    
    return {
      memory: Math.max(0, this.totalResources.memory - used.memory),
      cpu: Math.max(0, this.totalResources.cpu - used.cpu),
      network: Math.max(0, this.totalResources.network - used.network),
      storage: Math.max(0, this.totalResources.storage - used.storage),
      concurrentUsers: Math.max(0, this.totalResources.concurrentUsers - used.concurrentUsers)
    };
  }

  public getUsedResources(): ResourceRequirements {
    const allocations = Array.from(this.allocations.values());
    
    return allocations.reduce((total, allocation) => ({
      memory: total.memory + allocation.resources.memory,
      cpu: total.cpu + allocation.resources.cpu,
      network: total.network + allocation.resources.network,
      storage: total.storage + allocation.resources.storage,
      concurrentUsers: total.concurrentUsers + allocation.resources.concurrentUsers
    }), { memory: 0, cpu: 0, network: 0, storage: 0, concurrentUsers: 0 });
  }

  public getTotalResources(): ResourceRequirements {
    return { ...this.totalResources };
  }

  public getResourceUtilization(): number {
    const used = this.getUsedResources();
    const total = this.totalResources;
    
    // Calculate weighted utilization
    const memoryUtil = (used.memory / total.memory) * 0.3;
    const cpuUtil = (used.cpu / total.cpu) * 0.3;
    const networkUtil = (used.network / total.network) * 0.2;
    const storageUtil = (used.storage / total.storage) * 0.1;
    const userUtil = (used.concurrentUsers / total.concurrentUsers) * 0.1;
    
    return Math.min(100, (memoryUtil + cpuUtil + networkUtil + storageUtil + userUtil) * 100);
  }

  public getAllocations(): ResourceAllocation[] {
    return Array.from(this.allocations.values());
  }

  public getUsageHistory(hours: number = 24): ResourceUsageMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.usageHistory.filter(metric => metric.timestamp >= cutoff);
  }

  public predictResourceAvailability(requirements: ResourceRequirements, timeHorizon: number = 3600000): number {
    // Simple prediction based on recent usage trends
    const recentHistory = this.getUsageHistory(1); // Last hour
    if (recentHistory.length < 2) {
      return this.canAllocateResources(requirements, this.getAvailableResources()) ? 1.0 : 0.0;
    }
    
    // Calculate trend
    const latest = recentHistory[recentHistory.length - 1];
    const earlier = recentHistory[0];
    const timeDiff = latest.timestamp.getTime() - earlier.timestamp.getTime();
    
    if (timeDiff === 0) {
      return this.canAllocateResources(requirements, this.getAvailableResources()) ? 1.0 : 0.0;
    }
    
    // Project resource usage into the future
    const memoryTrend = (latest.usedMemory - earlier.usedMemory) / timeDiff;
    const cpuTrend = (latest.usedCpu - earlier.usedCpu) / timeDiff;
    const networkTrend = (latest.usedNetwork - earlier.usedNetwork) / timeDiff;
    const storageTrend = (latest.usedStorage - earlier.usedStorage) / timeDiff;
    const userTrend = (latest.usedConcurrentUsers - earlier.usedConcurrentUsers) / timeDiff;
    
    const projectedUsed = {
      memory: Math.max(0, latest.usedMemory + memoryTrend * timeHorizon),
      cpu: Math.max(0, latest.usedCpu + cpuTrend * timeHorizon),
      network: Math.max(0, latest.usedNetwork + networkTrend * timeHorizon),
      storage: Math.max(0, latest.usedStorage + storageTrend * timeHorizon),
      concurrentUsers: Math.max(0, latest.usedConcurrentUsers + userTrend * timeHorizon)
    };
    
    const projectedAvailable = {
      memory: Math.max(0, this.totalResources.memory - projectedUsed.memory),
      cpu: Math.max(0, this.totalResources.cpu - projectedUsed.cpu),
      network: Math.max(0, this.totalResources.network - projectedUsed.network),
      storage: Math.max(0, this.totalResources.storage - projectedUsed.storage),
      concurrentUsers: Math.max(0, this.totalResources.concurrentUsers - projectedUsed.concurrentUsers)
    };
    
    // Calculate probability that resources will be available
    const memoryProb = projectedAvailable.memory >= requirements.memory ? 1.0 : 0.0;
    const cpuProb = projectedAvailable.cpu >= requirements.cpu ? 1.0 : 0.0;
    const networkProb = projectedAvailable.network >= requirements.network ? 1.0 : 0.0;
    const storageProb = projectedAvailable.storage >= requirements.storage ? 1.0 : 0.0;
    const userProb = projectedAvailable.concurrentUsers >= requirements.concurrentUsers ? 1.0 : 0.0;
    
    return Math.min(memoryProb, cpuProb, networkProb, storageProb, userProb);
  }

  public optimizeResourceAllocation(): void {
    // Analyze current allocations and suggest optimizations
    const allocations = Array.from(this.allocations.values());
    const totalUsed = this.getUsedResources();
    const utilization = this.getResourceUtilization();
    
    if (utilization > 90) {
      this.emit('resourcePressure', {
        utilization,
        totalUsed,
        totalAvailable: this.totalResources,
        activeAllocations: allocations.length,
        recommendations: this.generateOptimizationRecommendations(allocations, totalUsed)
      });
    }
  }

  public updateResourceLimits(newLimits: Partial<ResourceRequirements>): void {
    const oldLimits = { ...this.totalResources };
    this.totalResources = { ...this.totalResources, ...newLimits };
    
    // Validate that current allocations still fit
    const used = this.getUsedResources();
    if (!this.canAllocateResources(used, this.totalResources)) {
      // Rollback if current allocations exceed new limits
      this.totalResources = oldLimits;
      throw new Error('Cannot reduce resource limits below current usage');
    }
    
    this.emit('resourceLimitsUpdated', { oldLimits, newLimits: this.totalResources });
  }

  private canAllocateResources(requirements: ResourceRequirements, available: ResourceRequirements): boolean {
    return requirements.memory <= available.memory &&
           requirements.cpu <= available.cpu &&
           requirements.network <= available.network &&
           requirements.storage <= available.storage &&
           requirements.concurrentUsers <= available.concurrentUsers;
  }

  private detectSystemResources(): ResourceRequirements {
    // In a real implementation, this would detect actual system resources
    // For now, we'll use reasonable defaults
    
    const totalMemory = process.memoryUsage().heapTotal / (1024 * 1024); // Convert to MB
    const cpuCores = require('os').cpus().length;
    
    return {
      memory: Math.max(1000, totalMemory * 4), // 4x heap size or minimum 1GB
      cpu: cpuCores * 20, // 20% per core as percentage
      network: 1000, // 1 Gbps
      storage: 10000, // 10GB
      concurrentUsers: 500 // 500 concurrent users
    };
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.recordUsageMetrics();
      this.optimizeResourceAllocation();
    }, 30000); // Every 30 seconds
  }

  private recordUsageMetrics(): void {
    const used = this.getUsedResources();
    const total = this.totalResources;
    
    const metrics: ResourceUsageMetrics = {
      timestamp: new Date(),
      totalMemory: total.memory,
      usedMemory: used.memory,
      totalCpu: total.cpu,
      usedCpu: used.cpu,
      totalNetwork: total.network,
      usedNetwork: used.network,
      totalStorage: total.storage,
      usedStorage: used.storage,
      totalConcurrentUsers: total.concurrentUsers,
      usedConcurrentUsers: used.concurrentUsers,
      efficiency: this.calculateResourceEfficiency(used, total)
    };
    
    this.usageHistory.push(metrics);
    
    // Keep only last 24 hours of data
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.usageHistory = this.usageHistory.filter(m => m.timestamp >= cutoff);
    
    this.emit('metricsRecorded', metrics);
  }

  private calculateResourceEfficiency(used: ResourceRequirements, total: ResourceRequirements): number {
    if (this.allocations.size === 0) return 100; // Perfect efficiency when nothing is allocated
    
    // Calculate how well resources are being utilized
    const memoryEff = total.memory > 0 ? (used.memory / total.memory) : 0;
    const cpuEff = total.cpu > 0 ? (used.cpu / total.cpu) : 0;
    const networkEff = total.network > 0 ? (used.network / total.network) : 0;
    const storageEff = total.storage > 0 ? (used.storage / total.storage) : 0;
    const userEff = total.concurrentUsers > 0 ? (used.concurrentUsers / total.concurrentUsers) : 0;
    
    // Weighted average efficiency
    const efficiency = (memoryEff * 0.3 + cpuEff * 0.3 + networkEff * 0.2 + storageEff * 0.1 + userEff * 0.1) * 100;
    
    return Math.min(100, efficiency);
  }

  private generateOptimizationRecommendations(
    allocations: ResourceAllocation[], 
    totalUsed: ResourceRequirements
  ): string[] {
    const recommendations: string[] = [];
    const utilization = this.getResourceUtilization();
    
    if (utilization > 95) {
      recommendations.push('Critical: Resource utilization above 95%. Consider scaling up resources or reducing concurrent sessions.');
    } else if (utilization > 90) {
      recommendations.push('Warning: High resource utilization. Monitor closely and prepare for scaling.');
    }
    
    // Analyze resource bottlenecks
    const memoryUtil = (totalUsed.memory / this.totalResources.memory) * 100;
    const cpuUtil = (totalUsed.cpu / this.totalResources.cpu) * 100;
    const networkUtil = (totalUsed.network / this.totalResources.network) * 100;
    const storageUtil = (totalUsed.storage / this.totalResources.storage) * 100;
    const userUtil = (totalUsed.concurrentUsers / this.totalResources.concurrentUsers) * 100;
    
    if (memoryUtil > 85) {
      recommendations.push('Memory bottleneck detected. Consider increasing memory limits or optimizing memory usage.');
    }
    if (cpuUtil > 85) {
      recommendations.push('CPU bottleneck detected. Consider distributing load or increasing CPU capacity.');
    }
    if (networkUtil > 85) {
      recommendations.push('Network bottleneck detected. Consider optimizing network usage or increasing bandwidth.');
    }
    if (storageUtil > 85) {
      recommendations.push('Storage bottleneck detected. Consider cleanup procedures or increasing storage capacity.');
    }
    if (userUtil > 85) {
      recommendations.push('Concurrent user limit approaching. Consider increasing user capacity or implementing queuing.');
    }
    
    // Analyze allocation patterns
    if (allocations.length > 10) {
      recommendations.push('High number of concurrent allocations. Consider implementing resource pooling or batching.');
    }
    
    const avgAllocationAge = allocations.reduce((sum, alloc) => 
      sum + (Date.now() - alloc.allocatedAt.getTime()), 0) / allocations.length;
    
    if (avgAllocationAge > 3600000) { // 1 hour
      recommendations.push('Long-running allocations detected. Review session timeouts and cleanup procedures.');
    }
    
    return recommendations;
  }

  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Release all allocations
    this.allocations.clear();
    this.usageHistory.length = 0;
  }
}

export class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  public async acquire(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  public release(): void {
    this.permits++;
    
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }

  public availablePermits(): number {
    return this.permits;
  }

  public getQueueLength(): number {
    return this.waitQueue.length;
  }
}