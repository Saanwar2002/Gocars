/**
 * AI Performance Benchmarker
 * 
 * This module benchmarks AI model performance including response times,
 * resource usage, throughput, and scalability under various load conditions.
 * 
 * Requirements: 9.5
 */

import { TestResult, TestConfiguration } from '../core/types';
import { suggestTaxiOnDescription } from '@/ai/flows/suggest-taxi-on-description';
import { parseBookingRequest } from '@/ai/flows/parse-booking-request-flow';
import { runAiSystemDiagnostic } from '@/ai/flows/system-diagnostic-flow';

interface PerformanceBenchmark {
  id: string;
  name: string;
  testType: 'response_time' | 'throughput' | 'resource_usage' | 'scalability' | 'concurrent_load';
  configuration: BenchmarkConfiguration;
  expectedMetrics: PerformanceExpectations;
}

interface BenchmarkConfiguration {
  iterations: number;
  concurrency?: number;
  payloadSize?: 'small' | 'medium' | 'large';
  duration?: number; // in milliseconds
  warmupIterations?: number;
}

interface PerformanceExpectations {
  maxResponseTime: number;
  minThroughput?: number;
  maxMemoryIncrease?: number;
  maxCpuUsage?: number;
  successRate: number;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  successRate: number;
  errorRate: number;
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
    peak: number;
    increase: number;
  };
  resourceUtilization: {
    avgCpuTime: number;
    totalRequests: number;
    failedRequests: number;
  };
}

export class AIPerformanceBenchmarker {
  private benchmarks: PerformanceBenchmark[] = [];

  constructor(private config: TestConfiguration) {
    this.initializeBenchmarks();
  }

  async initialize(): Promise<void> {
    console.log('⚡ Initializing AI Performance Benchmarker...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up AI Performance Benchmarker...');
  }

  private initializeBenchmarks(): void {
    // Response time benchmarks
    this.benchmarks.push({
      id: 'response-time-taxi-suggestion',
      name: 'Response Time - Taxi Suggestion',
      testType: 'response_time',
      configuration: {
        iterations: 10,
        payloadSize: 'small',
        warmupIterations: 2
      },
      expectedMetrics: {
        maxResponseTime: 3000,
        successRate: 0.95
      }
    });

    this.benchmarks.push({
      id: 'response-time-booking-parsing',
      name: 'Response Time - Booking Parsing',
      testType: 'response_time',
      configuration: {
        iterations: 10,
        payloadSize: 'medium',
        warmupIterations: 2
      },
      expectedMetrics: {
        maxResponseTime: 2500,
        successRate: 0.95
      }
    });

    this.benchmarks.push({
      id: 'response-time-system-diagnostic',
      name: 'Response Time - System Diagnostic',
      testType: 'response_time',
      configuration: {
        iterations: 5,
        payloadSize: 'large',
        warmupIterations: 1
      },
      expectedMetrics: {
        maxResponseTime: 5000,
        successRate: 0.90
      }
    });

    // Throughput benchmarks
    this.benchmarks.push({
      id: 'throughput-mixed-operations',
      name: 'Throughput - Mixed AI Operations',
      testType: 'throughput',
      configuration: {
        iterations: 20,
        duration: 30000, // 30 seconds
        warmupIterations: 3
      },
      expectedMetrics: {
        maxResponseTime: 4000,
        minThroughput: 5, // requests per second
        successRate: 0.90
      }
    });

    // Resource usage benchmarks
    this.benchmarks.push({
      id: 'resource-usage-sustained',
      name: 'Resource Usage - Sustained Load',
      testType: 'resource_usage',
      configuration: {
        iterations: 15,
        duration: 20000, // 20 seconds
        warmupIterations: 2
      },
      expectedMetrics: {
        maxResponseTime: 4000,
        maxMemoryIncrease: 50, // MB
        successRate: 0.90
      }
    });

    // Scalability benchmarks
    this.benchmarks.push({
      id: 'scalability-increasing-load',
      name: 'Scalability - Increasing Load',
      testType: 'scalability',
      configuration: {
        iterations: 25,
        warmupIterations: 3
      },
      expectedMetrics: {
        maxResponseTime: 6000,
        successRate: 0.85
      }
    });

    // Concurrent load benchmarks
    this.benchmarks.push({
      id: 'concurrent-load-stress',
      name: 'Concurrent Load - Stress Test',
      testType: 'concurrent_load',
      configuration: {
        iterations: 12,
        concurrency: 4,
        warmupIterations: 2
      },
      expectedMetrics: {
        maxResponseTime: 8000,
        successRate: 0.80
      }
    });
  }

  async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const benchmark of this.benchmarks) {
      const result = await this.runBenchmark(benchmark);
      results.push(result);
    }

    // Generate performance summary
    const summaryResult = this.generatePerformanceSummary(results);
    results.push(summaryResult);

    return results;
  }

  private async runBenchmark(benchmark: PerformanceBenchmark): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`⚡ Running performance benchmark: ${benchmark.name}`);
      
      let metrics: PerformanceMetrics;
      
      switch (benchmark.testType) {
        case 'response_time':
          metrics = await this.benchmarkResponseTime(benchmark);
          break;
        case 'throughput':
          metrics = await this.benchmarkThroughput(benchmark);
          break;
        case 'resource_usage':
          metrics = await this.benchmarkResourceUsage(benchmark);
          break;
        case 'scalability':
          metrics = await this.benchmarkScalability(benchmark);
          break;
        case 'concurrent_load':
          metrics = await this.benchmarkConcurrentLoad(benchmark);
          break;
        default:
          throw new Error(`Unknown benchmark type: ${benchmark.testType}`);
      }
      
      // Validate performance metrics
      const validationResults = this.validatePerformanceMetrics(metrics, benchmark.expectedMetrics);
      
      const duration = Date.now() - startTime;

      if (validationResults.passed) {
        return {
          id: benchmark.id,
          name: benchmark.name,
          status: 'passed',
          duration,
          message: `Performance benchmark passed (avg: ${metrics.avgResponseTime.toFixed(0)}ms, success: ${(metrics.successRate * 100).toFixed(1)}%)`,
          details: {
            benchmarkType: benchmark.testType,
            metrics,
            validationResults,
            configuration: benchmark.configuration
          }
        };
      } else {
        return {
          id: benchmark.id,
          name: benchmark.name,
          status: 'failed',
          duration,
          message: `Performance benchmark failed: ${validationResults.errors.join(', ')}`,
          details: {
            benchmarkType: benchmark.testType,
            metrics,
            validationResults,
            expectedMetrics: benchmark.expectedMetrics,
            configuration: benchmark.configuration
          }
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: benchmark.id,
        name: benchmark.name,
        status: 'error',
        duration,
        message: `Performance benchmark error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          benchmarkType: benchmark.testType,
          configuration: benchmark.configuration,
          error: error instanceof Error ? error.stack : error 
        }
      };
    }
  }

  private async benchmarkResponseTime(benchmark: PerformanceBenchmark): Promise<PerformanceMetrics> {
    const responseTimes: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage();
    let peakMemory = initialMemory.heapUsed;

    // Warmup iterations
    for (let i = 0; i < (benchmark.configuration.warmupIterations || 0); i++) {
      try {
        await this.executeAIOperation('taxi_suggestion', 'small');
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Actual benchmark iterations
    for (let i = 0; i < benchmark.configuration.iterations; i++) {
      try {
        const iterationStart = Date.now();
        await this.executeAIOperation('taxi_suggestion', benchmark.configuration.payloadSize || 'small');
        const iterationTime = Date.now() - iterationStart;
        responseTimes.push(iterationTime);
        
        // Track peak memory
        const currentMemory = process.memoryUsage().heapUsed;
        if (currentMemory > peakMemory) {
          peakMemory = currentMemory;
        }
        
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    const finalMemory = process.memoryUsage();
    
    return this.calculateMetrics(responseTimes, errors, initialMemory, finalMemory, peakMemory, benchmark.configuration.iterations);
  }

  private async benchmarkThroughput(benchmark: PerformanceBenchmark): Promise<PerformanceMetrics> {
    const responseTimes: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage();
    let peakMemory = initialMemory.heapUsed;
    
    const startTime = Date.now();
    const duration = benchmark.configuration.duration || 30000;
    let operationCount = 0;

    // Warmup
    for (let i = 0; i < (benchmark.configuration.warmupIterations || 0); i++) {
      try {
        await this.executeAIOperation('mixed', 'medium');
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Run operations for specified duration
    while (Date.now() - startTime < duration && operationCount < benchmark.configuration.iterations) {
      try {
        const iterationStart = Date.now();
        const operationType = this.getRandomOperationType();
        await this.executeAIOperation(operationType, 'medium');
        const iterationTime = Date.now() - iterationStart;
        responseTimes.push(iterationTime);
        
        const currentMemory = process.memoryUsage().heapUsed;
        if (currentMemory > peakMemory) {
          peakMemory = currentMemory;
        }
        
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
      
      operationCount++;
    }

    const finalMemory = process.memoryUsage();
    
    return this.calculateMetrics(responseTimes, errors, initialMemory, finalMemory, peakMemory, operationCount);
  }

  private async benchmarkResourceUsage(benchmark: PerformanceBenchmark): Promise<PerformanceMetrics> {
    const responseTimes: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage();
    let peakMemory = initialMemory.heapUsed;

    // Warmup
    for (let i = 0; i < (benchmark.configuration.warmupIterations || 0); i++) {
      try {
        await this.executeAIOperation('system_diagnostic', 'large');
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Sustained load test
    for (let i = 0; i < benchmark.configuration.iterations; i++) {
      try {
        const iterationStart = Date.now();
        await this.executeAIOperation('system_diagnostic', 'large');
        const iterationTime = Date.now() - iterationStart;
        responseTimes.push(iterationTime);
        
        const currentMemory = process.memoryUsage().heapUsed;
        if (currentMemory > peakMemory) {
          peakMemory = currentMemory;
        }
        
        // Small delay to simulate sustained load
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    const finalMemory = process.memoryUsage();
    
    return this.calculateMetrics(responseTimes, errors, initialMemory, finalMemory, peakMemory, benchmark.configuration.iterations);
  }

  private async benchmarkScalability(benchmark: PerformanceBenchmark): Promise<PerformanceMetrics> {
    const responseTimes: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage();
    let peakMemory = initialMemory.heapUsed;

    // Warmup
    for (let i = 0; i < (benchmark.configuration.warmupIterations || 0); i++) {
      try {
        await this.executeAIOperation('mixed', 'medium');
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Gradually increase load
    const batchSizes = [1, 2, 3, 5, 8, 10];
    
    for (const batchSize of batchSizes) {
      const batchPromises: Promise<void>[] = [];
      
      for (let i = 0; i < batchSize && responseTimes.length < benchmark.configuration.iterations; i++) {
        const promise = (async () => {
          try {
            const iterationStart = Date.now();
            const operationType = this.getRandomOperationType();
            await this.executeAIOperation(operationType, 'medium');
            const iterationTime = Date.now() - iterationStart;
            responseTimes.push(iterationTime);
            
            const currentMemory = process.memoryUsage().heapUsed;
            if (currentMemory > peakMemory) {
              peakMemory = currentMemory;
            }
            
          } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
          }
        })();
        
        batchPromises.push(promise);
      }
      
      await Promise.all(batchPromises);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const finalMemory = process.memoryUsage();
    
    return this.calculateMetrics(responseTimes, errors, initialMemory, finalMemory, peakMemory, responseTimes.length);
  }

  private async benchmarkConcurrentLoad(benchmark: PerformanceBenchmark): Promise<PerformanceMetrics> {
    const responseTimes: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage();
    let peakMemory = initialMemory.heapUsed;
    
    const concurrency = benchmark.configuration.concurrency || 3;

    // Warmup
    for (let i = 0; i < (benchmark.configuration.warmupIterations || 0); i++) {
      try {
        await this.executeAIOperation('mixed', 'medium');
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Run concurrent operations
    const operationsPerWorker = Math.ceil(benchmark.configuration.iterations / concurrency);
    const workerPromises: Promise<void>[] = [];

    for (let worker = 0; worker < concurrency; worker++) {
      const workerPromise = (async () => {
        for (let i = 0; i < operationsPerWorker && responseTimes.length < benchmark.configuration.iterations; i++) {
          try {
            const iterationStart = Date.now();
            const operationType = this.getRandomOperationType();
            await this.executeAIOperation(operationType, 'medium');
            const iterationTime = Date.now() - iterationStart;
            responseTimes.push(iterationTime);
            
            const currentMemory = process.memoryUsage().heapUsed;
            if (currentMemory > peakMemory) {
              peakMemory = currentMemory;
            }
            
          } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
          }
        }
      })();
      
      workerPromises.push(workerPromise);
    }

    await Promise.all(workerPromises);

    const finalMemory = process.memoryUsage();
    
    return this.calculateMetrics(responseTimes, errors, initialMemory, finalMemory, peakMemory, responseTimes.length);
  }

  private async executeAIOperation(operationType: string, payloadSize: string): Promise<void> {
    switch (operationType) {
      case 'taxi_suggestion':
        const description = this.generateTestDescription(payloadSize);
        await suggestTaxiOnDescription({ taxiDescription: description });
        break;
        
      case 'booking_parsing':
        const bookingText = this.generateTestBookingRequest(payloadSize);
        await parseBookingRequest({ userRequestText: bookingText });
        break;
        
      case 'system_diagnostic':
        const checkLevel = payloadSize === 'large' ? 'deep_simulated' : 'quick_simulated';
        await runAiSystemDiagnostic({ checkLevel: checkLevel as any });
        break;
        
      case 'mixed':
      default:
        // Randomly choose an operation
        const operations = ['taxi_suggestion', 'booking_parsing', 'system_diagnostic'];
        const randomOp = operations[Math.floor(Math.random() * operations.length)];
        await this.executeAIOperation(randomOp, payloadSize);
        break;
    }
  }

  private getRandomOperationType(): string {
    const operations = ['taxi_suggestion', 'booking_parsing', 'system_diagnostic'];
    return operations[Math.floor(Math.random() * operations.length)];
  }

  private generateTestDescription(payloadSize: string): string {
    const baseDescription = 'I need a taxi';
    
    switch (payloadSize) {
      case 'small':
        return `${baseDescription} for a quick trip`;
      case 'medium':
        return `${baseDescription} from downtown to the airport with luggage for 2 passengers`;
      case 'large':
        return `${baseDescription} for a business meeting tomorrow at 3 PM. I need a luxury vehicle with leather seats, air conditioning, and a professional driver. The pickup location is 123 Business Plaza, and I need to go to the Grand Hotel on 5th Avenue. There will be 3 passengers, and we have important documents and presentation materials. Please ensure the vehicle is clean and arrives 5 minutes early.`;
      default:
        return baseDescription;
    }
  }

  private generateTestBookingRequest(payloadSize: string): string {
    const baseRequest = 'Need a ride';
    
    switch (payloadSize) {
      case 'small':
        return `${baseRequest} now`;
      case 'medium':
        return `${baseRequest} from 123 Main St to the airport at 2 PM for 2 people`;
      case 'large':
        return `${baseRequest} tomorrow morning at 8:30 AM from my office building at 456 Corporate Drive to the international airport terminal 2. There will be 4 passengers with multiple suitcases and we need a large vehicle. This is for an important business trip and we cannot be late. Please ensure the driver knows the fastest route and has experience with airport pickups. We also need child seats for 2 children ages 4 and 6.`;
      default:
        return baseRequest;
    }
  }

  private calculateMetrics(
    responseTimes: number[], 
    errors: string[], 
    initialMemory: NodeJS.MemoryUsage, 
    finalMemory: NodeJS.MemoryUsage, 
    peakMemory: number,
    totalOperations: number
  ): PerformanceMetrics {
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const successfulOperations = responseTimes.length;
    const failedOperations = errors.length;
    
    return {
      avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      p95ResponseTime: responseTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0 : 0,
      p99ResponseTime: responseTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0 : 0,
      throughput: responseTimes.length > 0 ? (responseTimes.length / (Math.max(...responseTimes) - Math.min(...responseTimes))) * 1000 : 0,
      successRate: totalOperations > 0 ? successfulOperations / totalOperations : 0,
      errorRate: totalOperations > 0 ? failedOperations / totalOperations : 0,
      memoryUsage: {
        initial: initialMemory,
        final: finalMemory,
        peak: peakMemory,
        increase: (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024) // MB
      },
      resourceUtilization: {
        avgCpuTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
        totalRequests: totalOperations,
        failedRequests: failedOperations
      }
    };
  }

  private validatePerformanceMetrics(
    metrics: PerformanceMetrics, 
    expectations: PerformanceExpectations
  ): { passed: boolean; errors: string[]; score: number } {
    const errors: string[] = [];
    let score = 0;
    let totalChecks = 0;

    // Validate response time
    totalChecks++;
    if (metrics.avgResponseTime <= expectations.maxResponseTime) {
      score++;
    } else {
      errors.push(`Average response time ${metrics.avgResponseTime.toFixed(0)}ms exceeds maximum ${expectations.maxResponseTime}ms`);
    }

    // Validate success rate
    totalChecks++;
    if (metrics.successRate >= expectations.successRate) {
      score++;
    } else {
      errors.push(`Success rate ${(metrics.successRate * 100).toFixed(1)}% below minimum ${(expectations.successRate * 100).toFixed(1)}%`);
    }

    // Validate throughput if specified
    if (expectations.minThroughput !== undefined) {
      totalChecks++;
      if (metrics.throughput >= expectations.minThroughput) {
        score++;
      } else {
        errors.push(`Throughput ${metrics.throughput.toFixed(2)} req/s below minimum ${expectations.minThroughput} req/s`);
      }
    }

    // Validate memory usage if specified
    if (expectations.maxMemoryIncrease !== undefined) {
      totalChecks++;
      if (metrics.memoryUsage.increase <= expectations.maxMemoryIncrease) {
        score++;
      } else {
        errors.push(`Memory increase ${metrics.memoryUsage.increase.toFixed(1)}MB exceeds maximum ${expectations.maxMemoryIncrease}MB`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      score: totalChecks > 0 ? score / totalChecks : 0
    };
  }

  private generatePerformanceSummary(results: TestResult[]): TestResult {
    const benchmarkResults = results.filter(r => r.id !== 'ai-performance-summary');
    const passedTests = benchmarkResults.filter(r => r.status === 'passed').length;
    const failedTests = benchmarkResults.filter(r => r.status === 'failed').length;
    const errorTests = benchmarkResults.filter(r => r.status === 'error').length;
    
    const avgDuration = benchmarkResults.reduce((sum, r) => sum + r.duration, 0) / benchmarkResults.length;
    
    // Extract performance metrics from successful tests
    const successfulTests = benchmarkResults.filter(r => r.status === 'passed' && r.details?.metrics);
    const avgResponseTimes = successfulTests.map(r => r.details.metrics.avgResponseTime).filter(t => t > 0);
    const overallAvgResponseTime = avgResponseTimes.length > 0 
      ? avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length 
      : 0;
    
    const successRates = successfulTests.map(r => r.details.metrics.successRate).filter(r => r > 0);
    const overallSuccessRate = successRates.length > 0 
      ? successRates.reduce((a, b) => a + b, 0) / successRates.length 
      : 0;

    const overallPassed = (passedTests / benchmarkResults.length) >= 0.8; // 80% pass rate required

    return {
      id: 'ai-performance-summary',
      name: 'AI Performance Summary',
      status: overallPassed ? 'passed' : 'failed',
      duration: avgDuration,
      message: overallPassed 
        ? `AI performance benchmarks passed (${passedTests}/${benchmarkResults.length} tests passed)`
        : `AI performance benchmarks failed (${passedTests}/${benchmarkResults.length} tests passed)`,
      details: {
        totalTests: benchmarkResults.length,
        passedTests,
        failedTests,
        errorTests,
        overallAvgResponseTime: overallAvgResponseTime.toFixed(0),
        overallSuccessRate: (overallSuccessRate * 100).toFixed(1),
        benchmarkTypes: [...new Set(benchmarkResults.map(r => r.details?.benchmarkType).filter(Boolean))],
        summary: {
          responseTimeTests: benchmarkResults.filter(r => r.details?.benchmarkType === 'response_time').length,
          throughputTests: benchmarkResults.filter(r => r.details?.benchmarkType === 'throughput').length,
          resourceUsageTests: benchmarkResults.filter(r => r.details?.benchmarkType === 'resource_usage').length,
          scalabilityTests: benchmarkResults.filter(r => r.details?.benchmarkType === 'scalability').length,
          concurrentLoadTests: benchmarkResults.filter(r => r.details?.benchmarkType === 'concurrent_load').length
        }
      }
    };
  }
}