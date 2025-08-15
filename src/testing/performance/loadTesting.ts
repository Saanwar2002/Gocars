// Performance and load testing utilities
import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  customMetrics?: Record<string, number>;
}

export interface LoadTestConfig {
  concurrent: number;
  duration: number; // in milliseconds
  rampUp: number; // in milliseconds
  target: string | (() => Promise<void>);
  warmup?: number; // number of warmup requests
  timeout?: number;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  errors: Array<{
    error: string;
    count: number;
  }>;
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
  };
}

export class PerformanceTester {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  public async measurePerformance<T>(
    fn: () => Promise<T> | T,
    label: string = 'Performance Test'
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    console.log(`🔍 Starting performance measurement: ${label}`);
    
    const initialMemory = process.memoryUsage();
    const initialCpu = process.cpuUsage();
    const startTime = performance.now();

    try {
      const result = await Promise.resolve(fn());
      const endTime = performance.now();
      
      const finalMemory = process.memoryUsage();
      const finalCpu = process.cpuUsage(initialCpu);
      
      const metrics: PerformanceMetrics = {
        duration: endTime - startTime,
        memoryUsage: {
          rss: finalMemory.rss - initialMemory.rss,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          external: finalMemory.external - initialMemory.external,
          arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers,
        },
        cpuUsage: finalCpu,
      };

      this.metrics.push(metrics);
      
      console.log(`✅ Performance measurement completed: ${label}`);
      console.log(`   Duration: ${metrics.duration.toFixed(2)}ms`);
      console.log(`   Memory Delta: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      
      return { result, metrics };
    } catch (error) {
      console.error(`❌ Performance measurement failed: ${label}`, error);
      throw error;
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalMemory = this.metrics.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0);

    return {
      duration: totalDuration / this.metrics.length,
      memoryUsage: {
        rss: totalMemory / this.metrics.length,
        heapTotal: totalMemory / this.metrics.length,
        heapUsed: totalMemory / this.metrics.length,
        external: 0,
        arrayBuffers: 0,
      },
    };
  }

  public reset(): void {
    this.metrics = [];
  }
}

export class LoadTester {
  private results: number[] = [];
  private errors: Map<string, number> = new Map();
  private memorySnapshots: NodeJS.MemoryUsage[] = [];

  public async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('🚀 Starting load test...');
    console.log(`   Concurrent users: ${config.concurrent}`);
    console.log(`   Duration: ${config.duration}ms`);
    console.log(`   Ramp-up: ${config.rampUp}ms`);

    this.reset();
    
    const initialMemory = process.memoryUsage();
    this.memorySnapshots.push(initialMemory);

    // Warmup phase
    if (config.warmup) {
      console.log(`🔥 Running ${config.warmup} warmup requests...`);
      await this.runWarmup(config);
    }

    const startTime = performance.now();
    const endTime = startTime + config.duration;
    const rampUpInterval = config.rampUp / config.concurrent;

    const workers: Promise<void>[] = [];

    // Start workers with ramp-up
    for (let i = 0; i < config.concurrent; i++) {
      const delay = i * rampUpInterval;
      workers.push(this.startWorker(config, delay, endTime));
    }

    // Monitor memory usage during test
    const memoryMonitor = this.startMemoryMonitoring();

    // Wait for all workers to complete
    await Promise.all(workers);
    clearInterval(memoryMonitor);

    const finalMemory = process.memoryUsage();
    this.memorySnapshots.push(finalMemory);

    const result = this.calculateResults(startTime, endTime, initialMemory, finalMemory);
    this.logResults(result);

    return result;
  }

  private async runWarmup(config: LoadTestConfig): Promise<void> {
    const warmupPromises: Promise<void>[] = [];
    
    for (let i = 0; i < config.warmup!; i++) {
      warmupPromises.push(this.executeRequest(config.target, config.timeout));
    }

    await Promise.allSettled(warmupPromises);
    console.log('✅ Warmup completed');
  }

  private async startWorker(
    config: LoadTestConfig,
    delay: number,
    endTime: number
  ): Promise<void> {
    // Wait for ramp-up delay
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Execute requests until end time
    while (performance.now() < endTime) {
      const requestStart = performance.now();
      
      try {
        await this.executeRequest(config.target, config.timeout);
        const requestEnd = performance.now();
        this.results.push(requestEnd - requestStart);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.errors.set(errorMessage, (this.errors.get(errorMessage) || 0) + 1);
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  private async executeRequest(
    target: string | (() => Promise<void>),
    timeout: number = 5000
  ): Promise<void> {
    if (typeof target === 'string') {
      // HTTP request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(target, {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      // Function execution
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      await Promise.race([target(), timeoutPromise]);
    }
  }

  private startMemoryMonitoring(): NodeJS.Timeout {
    return setInterval(() => {
      this.memorySnapshots.push(process.memoryUsage());
    }, 1000);
  }

  private calculateResults(
    startTime: number,
    endTime: number,
    initialMemory: NodeJS.MemoryUsage,
    finalMemory: NodeJS.MemoryUsage
  ): LoadTestResult {
    const totalRequests = this.results.length;
    const failedRequests = Array.from(this.errors.values()).reduce((sum, count) => sum + count, 0);
    const successfulRequests = totalRequests;
    const testDuration = endTime - startTime;

    // Calculate response time statistics
    const sortedResults = [...this.results].sort((a, b) => a - b);
    const averageResponseTime = this.results.reduce((sum, time) => sum + time, 0) / totalRequests;
    const minResponseTime = Math.min(...this.results);
    const maxResponseTime = Math.max(...this.results);

    // Calculate percentiles
    const p50 = this.calculatePercentile(sortedResults, 50);
    const p90 = this.calculatePercentile(sortedResults, 90);
    const p95 = this.calculatePercentile(sortedResults, 95);
    const p99 = this.calculatePercentile(sortedResults, 99);

    // Calculate requests per second
    const requestsPerSecond = (totalRequests / testDuration) * 1000;

    // Find peak memory usage
    const peakMemory = this.memorySnapshots.reduce((peak, current) => 
      current.heapUsed > peak.heapUsed ? current : peak
    );

    return {
      totalRequests: totalRequests + failedRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      percentiles: { p50, p90, p95, p99 },
      errors: Array.from(this.errors.entries()).map(([error, count]) => ({ error, count })),
      memoryUsage: {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory,
      },
    };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private logResults(result: LoadTestResult): void {
    console.log('\\n' + '='.repeat(60));
    console.log('📊 LOAD TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Requests: ${result.totalRequests}`);
    console.log(`Successful: ${result.successfulRequests}`);
    console.log(`Failed: ${result.failedRequests}`);
    console.log(`Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
    console.log(`\\nResponse Times:`);
    console.log(`  Average: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`  Min: ${result.minResponseTime.toFixed(2)}ms`);
    console.log(`  Max: ${result.maxResponseTime.toFixed(2)}ms`);
    console.log(`\\nPercentiles:`);
    console.log(`  50th: ${result.percentiles.p50.toFixed(2)}ms`);
    console.log(`  90th: ${result.percentiles.p90.toFixed(2)}ms`);
    console.log(`  95th: ${result.percentiles.p95.toFixed(2)}ms`);
    console.log(`  99th: ${result.percentiles.p99.toFixed(2)}ms`);
    console.log(`\\nThroughput: ${result.requestsPerSecond.toFixed(2)} requests/second`);
    
    if (result.errors.length > 0) {
      console.log(`\\n❌ Errors:`);
      result.errors.forEach(({ error, count }) => {
        console.log(`  ${error}: ${count}`);
      });
    }

    const memoryDelta = result.memoryUsage.final.heapUsed - result.memoryUsage.initial.heapUsed;
    console.log(`\\n💾 Memory Usage:`);
    console.log(`  Initial: ${(result.memoryUsage.initial.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Peak: ${(result.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Final: ${(result.memoryUsage.final.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log('='.repeat(60));
  }

  private reset(): void {
    this.results = [];
    this.errors.clear();
    this.memorySnapshots = [];
  }
}

// Utility functions for common performance tests
export const performanceUtils = {
  // Test component rendering performance
  async testComponentRender<T>(
    renderFn: () => T,
    iterations: number = 100
  ): Promise<PerformanceMetrics> {
    const tester = new PerformanceTester();
    const results: PerformanceMetrics[] = [];

    for (let i = 0; i < iterations; i++) {
      const { metrics } = await tester.measurePerformance(renderFn, `Render ${i + 1}`);
      results.push(metrics);
    }

    const avgDuration = results.reduce((sum, m) => sum + m.duration, 0) / iterations;
    const avgMemory = results.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / iterations;

    return {
      duration: avgDuration,
      memoryUsage: {
        rss: avgMemory,
        heapTotal: avgMemory,
        heapUsed: avgMemory,
        external: 0,
        arrayBuffers: 0,
      },
      customMetrics: {
        iterations,
        minDuration: Math.min(...results.map(r => r.duration)),
        maxDuration: Math.max(...results.map(r => r.duration)),
      },
    };
  },

  // Test API endpoint performance
  async testApiEndpoint(
    url: string,
    options: {
      concurrent?: number;
      duration?: number;
      timeout?: number;
    } = {}
  ): Promise<LoadTestResult> {
    const loadTester = new LoadTester();
    
    return loadTester.runLoadTest({
      concurrent: options.concurrent || 10,
      duration: options.duration || 30000, // 30 seconds
      rampUp: 5000, // 5 seconds
      target: url,
      timeout: options.timeout || 5000,
      warmup: 5,
    });
  },

  // Test memory leaks
  async testMemoryLeak(
    fn: () => Promise<void> | void,
    iterations: number = 1000
  ): Promise<{
    initialMemory: number;
    finalMemory: number;
    peakMemory: number;
    memoryGrowth: number;
    potentialLeak: boolean;
  }> {
    const initialMemory = process.memoryUsage().heapUsed;
    let peakMemory = initialMemory;

    for (let i = 0; i < iterations; i++) {
      await Promise.resolve(fn());
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const currentMemory = process.memoryUsage().heapUsed;
      peakMemory = Math.max(peakMemory, currentMemory);
      
      // Log progress every 100 iterations
      if ((i + 1) % 100 === 0) {
        console.log(`Memory leak test progress: ${i + 1}/${iterations}`);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    const growthPercentage = (memoryGrowth / initialMemory) * 100;
    
    // Consider it a potential leak if memory grew by more than 50%
    const potentialLeak = growthPercentage > 50;

    return {
      initialMemory: initialMemory / 1024 / 1024, // Convert to MB
      finalMemory: finalMemory / 1024 / 1024,
      peakMemory: peakMemory / 1024 / 1024,
      memoryGrowth: memoryGrowth / 1024 / 1024,
      potentialLeak,
    };
  },
};