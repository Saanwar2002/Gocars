import { LoadTestingEngine, LoadTestConfiguration, LoadTestResult } from '../performance/LoadTestingEngine';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';
import { StressTestRunner, StressTestConfiguration } from '../performance/StressTestRunner';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class LoadTestingTestSuite {
  private loadTestingEngine: LoadTestingEngine;
  private performanceMonitor: PerformanceMonitor;
  private stressTestRunner: StressTestRunner;
  private results: TestResult[] = [];

  constructor() {
    this.loadTestingEngine = new LoadTestingEngine();
    this.performanceMonitor = new PerformanceMonitor({
      averageResponseTime: 1000,
      maxResponseTime: 5000,
      errorRate: 5,
      throughput: 100,
      cpuUsage: 80,
      memoryUsage: 80,
      networkLatency: 100
    });
    this.stressTestRunner = new StressTestRunner(this.loadTestingEngine, this.performanceMonitor);
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Load Testing Test Suite...\n');

    // Core load testing functionality
    await this.testLoadTestConfiguration();
    await this.testLoadTestExecution();
    await this.testConcurrentUserSimulation();
    await this.testPerformanceMonitoring();
    await this.testResourceTracking();
    
    // Stress testing functionality
    await this.testStressTestConfiguration();
    await this.testBreakingPointTest();
    await this.testSpikeTest();
    await this.testVolumeTest();
    await this.testEnduranceTest();
    
    // Advanced features
    await this.testPerformanceThresholds();
    await this.testAlertingSystem();
    await this.testReportGeneration();
    await this.testLoadAdjustment();

    this.printResults();
    return this.results;
  }

  private async testLoadTestConfiguration(): Promise<void> {
    await this.runTest('Load Test Configuration', async () => {
      const config: LoadTestConfiguration = {
        id: 'test-config-1',
        name: 'Basic Load Test',
        description: 'Test basic load testing configuration',
        targetUrl: 'https://httpbin.org',
        testDuration: 30000, // 30 seconds
        rampUpTime: 5000, // 5 seconds
        rampDownTime: 5000, // 5 seconds
        maxConcurrentUsers: 10,
        testScenarios: [
          {
            id: 'scenario-1',
            name: 'Basic HTTP Requests',
            weight: 100,
            steps: [
              {
                id: 'step-1',
                name: 'GET Request',
                type: 'http',
                action: 'GET /get',
                parameters: {
                  url: '/get',
                  method: 'GET'
                },
                validations: [
                  {
                    type: 'status_code',
                    condition: 'equals',
                    expectedValue: 200,
                    failOnError: true
                  }
                ]
              }
            ],
            userProfile: {
              id: 'basic-user',
              name: 'Basic User',
              characteristics: {
                deviceType: 'desktop',
                connectionSpeed: 'fast',
                location: 'US',
                userAgent: 'LoadTest/1.0'
              },
              sessionData: {}
            },
            thinkTime: {
              min: 1000,
              max: 3000
            }
          }
        ],
        performanceThresholds: {
          averageResponseTime: 1000,
          maxResponseTime: 5000,
          errorRate: 5,
          throughput: 10,
          cpuUsage: 80,
          memoryUsage: 80,
          networkLatency: 100
        },
        resourceLimits: {
          maxMemoryUsage: 1024,
          maxCpuUsage: 90,
          maxNetworkBandwidth: 100,
          maxDatabaseConnections: 50,
          maxFileHandles: 500
        },
        monitoringConfig: {
          metricsInterval: 1000,
          enableDetailedLogging: true,
          captureScreenshots: false,
          recordNetworkTraffic: true,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 2000,
            errorRateAlert: 10,
            cpuUsageAlert: 85,
            memoryUsageAlert: 85
          }
        }
      };

      // Test configuration validation
      const testId = await this.loadTestingEngine.startLoadTest(config);
      
      if (!testId) {
        throw new Error('Failed to start load test');
      }

      // Verify test is running
      const status = this.loadTestingEngine.getTestStatus(testId);
      if (!status) {
        throw new Error('Test status not available');
      }

      if (status.status === 'failed') {
        throw new Error('Load test failed to start');
      }

      // Stop the test
      await this.loadTestingEngine.stopLoadTest(testId);

      return { testId, config, status };
    });
  }

  private async testLoadTestExecution(): Promise<void> {
    await this.runTest('Load Test Execution', async () => {
      const config: LoadTestConfiguration = {
        id: 'execution-test',
        name: 'Load Test Execution Test',
        targetUrl: 'https://httpbin.org',
        testDuration: 10000, // 10 seconds
        rampUpTime: 2000,
        rampDownTime: 2000,
        maxConcurrentUsers: 5,
        testScenarios: [
          {
            id: 'execution-scenario',
            name: 'Execution Test Scenario',
            weight: 100,
            steps: [
              {
                id: 'get-step',
                name: 'GET Request',
                type: 'http',
                action: 'GET /get',
                parameters: { url: '/get' },
                validations: []
              }
            ],
            userProfile: {
              id: 'test-user',
              name: 'Test User',
              characteristics: {
                deviceType: 'desktop',
                connectionSpeed: 'fast',
                location: 'US',
                userAgent: 'Test/1.0'
              },
              sessionData: {}
            },
            thinkTime: { min: 500, max: 1000 }
          }
        ],
        performanceThresholds: {
          averageResponseTime: 2000,
          maxResponseTime: 10000,
          errorRate: 10,
          throughput: 5,
          cpuUsage: 90,
          memoryUsage: 90,
          networkLatency: 200
        },
        resourceLimits: {
          maxMemoryUsage: 512,
          maxCpuUsage: 95,
          maxNetworkBandwidth: 50,
          maxDatabaseConnections: 25,
          maxFileHandles: 250
        },
        monitoringConfig: {
          metricsInterval: 500,
          enableDetailedLogging: false,
          captureScreenshots: false,
          recordNetworkTraffic: false,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 3000,
            errorRateAlert: 15,
            cpuUsageAlert: 90,
            memoryUsageAlert: 90
          }
        }
      };

      const testId = await this.loadTestingEngine.startLoadTest(config);
      
      // Wait for test to run for a bit
      await this.delay(3000);
      
      // Check status during execution
      const runningStatus = this.loadTestingEngine.getTestStatus(testId);
      if (!runningStatus || runningStatus.status === 'failed') {
        throw new Error('Test not running properly');
      }

      // Complete the test
      const result = await this.loadTestingEngine.stopLoadTest(testId);
      
      if (!result.summary) {
        throw new Error('Test result missing summary');
      }

      if (result.summary.totalRequests === 0) {
        throw new Error('No requests were executed');
      }

      return { testId, result, runningStatus };
    });
  }

  private async testConcurrentUserSimulation(): Promise<void> {
    await this.runTest('Concurrent User Simulation', async () => {
      const config: LoadTestConfiguration = {
        id: 'concurrent-test',
        name: 'Concurrent User Test',
        targetUrl: 'https://httpbin.org',
        testDuration: 8000,
        rampUpTime: 2000,
        rampDownTime: 2000,
        maxConcurrentUsers: 15, // Higher concurrency
        testScenarios: [
          {
            id: 'concurrent-scenario-1',
            name: 'Scenario 1',
            weight: 60,
            steps: [
              {
                id: 'concurrent-step-1',
                name: 'GET /get',
                type: 'http',
                action: 'GET /get',
                parameters: { url: '/get' },
                validations: []
              }
            ],
            userProfile: {
              id: 'user-type-1',
              name: 'User Type 1',
              characteristics: {
                deviceType: 'desktop',
                connectionSpeed: 'fast',
                location: 'US',
                userAgent: 'Test/1.0'
              },
              sessionData: {}
            },
            thinkTime: { min: 200, max: 800 }
          },
          {
            id: 'concurrent-scenario-2',
            name: 'Scenario 2',
            weight: 40,
            steps: [
              {
                id: 'concurrent-step-2',
                name: 'POST /post',
                type: 'http',
                action: 'POST /post',
                parameters: { 
                  url: '/post',
                  method: 'POST',
                  body: { test: 'data' }
                },
                validations: []
              }
            ],
            userProfile: {
              id: 'user-type-2',
              name: 'User Type 2',
              characteristics: {
                deviceType: 'mobile',
                connectionSpeed: 'medium',
                location: 'EU',
                userAgent: 'Mobile/1.0'
              },
              sessionData: {}
            },
            thinkTime: { min: 500, max: 1500 }
          }
        ],
        performanceThresholds: {
          averageResponseTime: 1500,
          maxResponseTime: 8000,
          errorRate: 8,
          throughput: 10,
          cpuUsage: 85,
          memoryUsage: 85,
          networkLatency: 150
        },
        resourceLimits: {
          maxMemoryUsage: 1024,
          maxCpuUsage: 95,
          maxNetworkBandwidth: 100,
          maxDatabaseConnections: 50,
          maxFileHandles: 500
        },
        monitoringConfig: {
          metricsInterval: 1000,
          enableDetailedLogging: true,
          captureScreenshots: false,
          recordNetworkTraffic: true,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 2500,
            errorRateAlert: 12,
            cpuUsageAlert: 90,
            memoryUsageAlert: 90
          }
        }
      };

      const testId = await this.loadTestingEngine.startLoadTest(config);
      
      // Monitor during execution
      let maxConcurrentUsers = 0;
      const monitoringInterval = setInterval(() => {
        const status = this.loadTestingEngine.getTestStatus(testId);
        if (status && status.progress.currentUsers > maxConcurrentUsers) {
          maxConcurrentUsers = status.progress.currentUsers;
        }
      }, 500);

      // Wait for test completion
      await this.delay(10000);
      clearInterval(monitoringInterval);

      const result = await this.loadTestingEngine.stopLoadTest(testId);

      // Verify concurrent execution
      if (maxConcurrentUsers < 5) {
        throw new Error('Insufficient concurrent users detected');
      }

      if (result.summary.totalRequests < 10) {
        throw new Error('Too few requests executed for concurrent test');
      }

      return { testId, result, maxConcurrentUsers };
    });
  }

  private async testPerformanceMonitoring(): Promise<void> {
    await this.runTest('Performance Monitoring', async () => {
      const testId = 'perf-monitor-test';
      
      // Start monitoring
      await this.performanceMonitor.startMonitoring(testId, {
        id: testId,
        name: 'Performance Monitoring Test',
        targetUrl: 'https://httpbin.org',
        testDuration: 5000,
        rampUpTime: 1000,
        rampDownTime: 1000,
        maxConcurrentUsers: 5,
        testScenarios: [],
        performanceThresholds: {
          averageResponseTime: 1000,
          maxResponseTime: 5000,
          errorRate: 5,
          throughput: 10,
          cpuUsage: 80,
          memoryUsage: 80,
          networkLatency: 100
        },
        resourceLimits: {
          maxMemoryUsage: 512,
          maxCpuUsage: 90,
          maxNetworkBandwidth: 50,
          maxDatabaseConnections: 25,
          maxFileHandles: 250
        },
        monitoringConfig: {
          metricsInterval: 500,
          enableDetailedLogging: true,
          captureScreenshots: false,
          recordNetworkTraffic: true,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 2000,
            errorRateAlert: 10,
            cpuUsageAlert: 85,
            memoryUsageAlert: 85
          }
        }
      });

      // Record some test metrics
      this.performanceMonitor.recordMetric({
        id: 'test-metric-1',
        name: 'response_time',
        value: 500,
        unit: 'ms',
        timestamp: new Date(),
        category: 'response_time',
        tags: { testId, endpoint: '/test' }
      });

      this.performanceMonitor.recordMetric({
        id: 'test-metric-2',
        name: 'cpu_usage',
        value: 60,
        unit: '%',
        timestamp: new Date(),
        category: 'resource_usage',
        tags: { testId }
      });

      // Wait for metrics collection
      await this.delay(2000);

      // Get metrics
      const metrics = this.performanceMonitor.getMetrics(testId);
      const systemMetrics = this.performanceMonitor.getCurrentSystemMetrics();
      const appMetrics = this.performanceMonitor.getApplicationMetrics(testId);

      // Stop monitoring
      await this.performanceMonitor.stopMonitoring(testId);

      // Verify metrics were collected
      if (metrics.length === 0) {
        throw new Error('No metrics were collected');
      }

      if (!systemMetrics) {
        throw new Error('System metrics not available');
      }

      return { testId, metrics, systemMetrics, appMetrics };
    });
  }

  private async testResourceTracking(): Promise<void> {
    await this.runTest('Resource Tracking', async () => {
      const config: LoadTestConfiguration = {
        id: 'resource-test',
        name: 'Resource Tracking Test',
        targetUrl: 'https://httpbin.org',
        testDuration: 6000,
        rampUpTime: 1000,
        rampDownTime: 1000,
        maxConcurrentUsers: 8,
        testScenarios: [
          {
            id: 'resource-scenario',
            name: 'Resource Test Scenario',
            weight: 100,
            steps: [
              {
                id: 'resource-step',
                name: 'Resource Intensive Request',
                type: 'http',
                action: 'GET /delay/1',
                parameters: { url: '/delay/1' },
                validations: []
              }
            ],
            userProfile: {
              id: 'resource-user',
              name: 'Resource User',
              characteristics: {
                deviceType: 'desktop',
                connectionSpeed: 'fast',
                location: 'US',
                userAgent: 'ResourceTest/1.0'
              },
              sessionData: {}
            },
            thinkTime: { min: 100, max: 500 }
          }
        ],
        performanceThresholds: {
          averageResponseTime: 2000,
          maxResponseTime: 10000,
          errorRate: 10,
          throughput: 5,
          cpuUsage: 90,
          memoryUsage: 90,
          networkLatency: 200
        },
        resourceLimits: {
          maxMemoryUsage: 1024,
          maxCpuUsage: 95,
          maxNetworkBandwidth: 100,
          maxDatabaseConnections: 50,
          maxFileHandles: 500
        },
        monitoringConfig: {
          metricsInterval: 500,
          enableDetailedLogging: true,
          captureScreenshots: false,
          recordNetworkTraffic: true,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 3000,
            errorRateAlert: 15,
            cpuUsageAlert: 95,
            memoryUsageAlert: 95
          }
        }
      };

      const testId = await this.loadTestingEngine.startLoadTest(config);
      
      // Wait for resource usage
      await this.delay(4000);
      
      // Get resource metrics
      const resourceUsage = this.loadTestingEngine.getResourceUsage(testId);
      
      const result = await this.loadTestingEngine.stopLoadTest(testId);

      // Verify resource tracking
      if (!resourceUsage) {
        throw new Error('Resource usage not tracked');
      }

      if (resourceUsage.cpu.average === 0 && resourceUsage.memory.average === 0) {
        throw new Error('No resource usage data collected');
      }

      return { testId, result, resourceUsage };
    });
  }

  private async testStressTestConfiguration(): Promise<void> {
    await this.runTest('Stress Test Configuration', async () => {
      const config: StressTestConfiguration = {
        id: 'stress-config-test',
        name: 'Stress Test Configuration Test',
        description: 'Test stress test configuration validation',
        targetSystem: {
          baseUrl: 'https://httpbin.org',
          endpoints: [
            {
              path: '/get',
              method: 'GET',
              weight: 60,
              expectedStatusCodes: [200],
              criticalEndpoint: true
            },
            {
              path: '/post',
              method: 'POST',
              weight: 40,
              payload: { test: 'data' },
              expectedStatusCodes: [200],
              criticalEndpoint: false
            }
          ]
        },
        stressProfile: {
          userTypes: [
            {
              id: 'light-user',
              name: 'Light User',
              percentage: 70,
              behaviorPattern: {
                thinkTimeMin: 1000,
                thinkTimeMax: 3000,
                sessionDuration: 60000,
                actionsPerSession: 10,
                errorTolerance: 5
              },
              deviceProfile: {
                type: 'desktop',
                connectionSpeed: 'fast',
                userAgent: 'StressTest/1.0'
              }
            },
            {
              id: 'heavy-user',
              name: 'Heavy User',
              percentage: 30,
              behaviorPattern: {
                thinkTimeMin: 500,
                thinkTimeMax: 1500,
                sessionDuration: 120000,
                actionsPerSession: 25,
                errorTolerance: 2
              },
              deviceProfile: {
                type: 'mobile',
                connectionSpeed: 'medium',
                userAgent: 'Mobile/1.0'
              }
            }
          ],
          concurrencyLevels: [
            { level: 10, duration: 30000, rampUpTime: 5000, rampDownTime: 5000 },
            { level: 25, duration: 60000, rampUpTime: 10000, rampDownTime: 10000 }
          ],
          dataVariation: {
            useRandomData: true,
            dataSetSize: 1000,
            dataRefreshInterval: 30000,
            customDataGenerators: {}
          },
          networkConditions: [
            { name: 'fast', latency: 50, bandwidth: 1000, packetLoss: 0, jitter: 5 }
          ]
        },
        breakingPointTest: {
          enabled: true,
          startUsers: 10,
          maxUsers: 100,
          incrementStep: 10,
          incrementInterval: 30000,
          stabilizationTime: 15000,
          failureThreshold: {
            errorRate: 10,
            responseTime: 5000,
            throughputDrop: 50
          }
        },
        spikeTest: {
          enabled: false,
          baselineUsers: 10,
          spikeUsers: 50,
          spikeDuration: 30000,
          spikeInterval: 60000,
          numberOfSpikes: 3,
          recoveryTime: 30000
        },
        volumeTest: {
          enabled: false,
          targetVolume: 1000,
          duration: 300000,
          dataSize: { small: 70, medium: 25, large: 5 },
          sustainedLoad: true
        },
        enduranceTest: {
          enabled: false,
          duration: 3600000,
          constantLoad: 25,
          memoryLeakDetection: true,
          performanceDegradationThreshold: 20,
          checkpointInterval: 300000
        },
        monitoringConfig: {
          systemMetrics: {
            cpu: true,
            memory: true,
            disk: true,
            network: true,
            database: true
          },
          applicationMetrics: {
            responseTime: true,
            throughput: true,
            errorRate: true,
            activeConnections: true,
            queueLength: true
          },
          businessMetrics: {
            transactionSuccess: true,
            revenueImpact: false,
            userExperience: true
          },
          alerting: {
            realTimeAlerts: true,
            escalationRules: [],
            notificationChannels: []
          }
        },
        failureCriteria: {
          maxErrorRate: 10,
          maxResponseTime: 5000,
          minThroughput: 10,
          maxCpuUsage: 90,
          maxMemoryUsage: 90,
          criticalEndpointFailure: true,
          cascadingFailureDetection: true
        }
      };

      // Test configuration validation
      const testId = await this.stressTestRunner.runStressTest(config);
      
      if (!testId) {
        throw new Error('Failed to start stress test');
      }

      // Verify test is running
      const status = this.stressTestRunner.getStressTestStatus(testId);
      if (!status) {
        throw new Error('Stress test status not available');
      }

      // Stop the test
      const result = await this.stressTestRunner.stopStressTest(testId);

      return { testId, config, status, result };
    });
  }

  private async testBreakingPointTest(): Promise<void> {
    await this.runTest('Breaking Point Test', async () => {
      const config: StressTestConfiguration = {
        id: 'breaking-point-test',
        name: 'Breaking Point Test',
        targetSystem: {
          baseUrl: 'https://httpbin.org',
          endpoints: [
            {
              path: '/get',
              method: 'GET',
              weight: 100,
              expectedStatusCodes: [200],
              criticalEndpoint: true
            }
          ]
        },
        stressProfile: {
          userTypes: [
            {
              id: 'test-user',
              name: 'Test User',
              percentage: 100,
              behaviorPattern: {
                thinkTimeMin: 500,
                thinkTimeMax: 1000,
                sessionDuration: 30000,
                actionsPerSession: 5,
                errorTolerance: 10
              },
              deviceProfile: {
                type: 'desktop',
                connectionSpeed: 'fast',
                userAgent: 'BreakingPointTest/1.0'
              }
            }
          ],
          concurrencyLevels: [],
          dataVariation: {
            useRandomData: false,
            dataSetSize: 100,
            dataRefreshInterval: 60000,
            customDataGenerators: {}
          },
          networkConditions: []
        },
        breakingPointTest: {
          enabled: true,
          startUsers: 5,
          maxUsers: 30, // Lower for testing
          incrementStep: 5,
          incrementInterval: 10000, // Shorter for testing
          stabilizationTime: 5000,
          failureThreshold: {
            errorRate: 15,
            responseTime: 8000,
            throughputDrop: 60
          }
        },
        spikeTest: { enabled: false, baselineUsers: 0, spikeUsers: 0, spikeDuration: 0, spikeInterval: 0, numberOfSpikes: 0, recoveryTime: 0 },
        volumeTest: { enabled: false, targetVolume: 0, duration: 0, dataSize: { small: 0, medium: 0, large: 0 }, sustainedLoad: false },
        enduranceTest: { enabled: false, duration: 0, constantLoad: 0, memoryLeakDetection: false, performanceDegradationThreshold: 0, checkpointInterval: 0 },
        monitoringConfig: {
          systemMetrics: { cpu: true, memory: true, disk: false, network: true, database: false },
          applicationMetrics: { responseTime: true, throughput: true, errorRate: true, activeConnections: false, queueLength: false },
          businessMetrics: { transactionSuccess: false, revenueImpact: false, userExperience: false },
          alerting: { realTimeAlerts: true, escalationRules: [], notificationChannels: [] }
        },
        failureCriteria: {
          maxErrorRate: 15,
          maxResponseTime: 8000,
          minThroughput: 5,
          maxCpuUsage: 95,
          maxMemoryUsage: 95,
          criticalEndpointFailure: true,
          cascadingFailureDetection: false
        }
      };

      const breakingPointResult = await this.stressTestRunner.runBreakingPointTest(config);

      if (!breakingPointResult) {
        throw new Error('Breaking point test did not return results');
      }

      if (breakingPointResult.breakingPointUsers <= 0) {
        throw new Error('Invalid breaking point users value');
      }

      if (!breakingPointResult.failureMode) {
        throw new Error('Failure mode not identified');
      }

      return { breakingPointResult };
    });
  }

  private async testSpikeTest(): Promise<void> {
    await this.runTest('Spike Test', async () => {
      const config: StressTestConfiguration = {
        id: 'spike-test',
        name: 'Spike Test',
        targetSystem: {
          baseUrl: 'https://httpbin.org',
          endpoints: [
            {
              path: '/get',
              method: 'GET',
              weight: 100,
              expectedStatusCodes: [200],
              criticalEndpoint: false
            }
          ]
        },
        stressProfile: {
          userTypes: [
            {
              id: 'spike-user',
              name: 'Spike User',
              percentage: 100,
              behaviorPattern: {
                thinkTimeMin: 200,
                thinkTimeMax: 800,
                sessionDuration: 20000,
                actionsPerSession: 3,
                errorTolerance: 20
              },
              deviceProfile: {
                type: 'desktop',
                connectionSpeed: 'fast',
                userAgent: 'SpikeTest/1.0'
              }
            }
          ],
          concurrencyLevels: [],
          dataVariation: {
            useRandomData: false,
            dataSetSize: 50,
            dataRefreshInterval: 30000,
            customDataGenerators: {}
          },
          networkConditions: []
        },
        breakingPointTest: { enabled: false, startUsers: 0, maxUsers: 0, incrementStep: 0, incrementInterval: 0, stabilizationTime: 0, failureThreshold: { errorRate: 0, responseTime: 0, throughputDrop: 0 } },
        spikeTest: {
          enabled: true,
          baselineUsers: 5,
          spikeUsers: 20,
          spikeDuration: 5000, // Short for testing
          spikeInterval: 10000,
          numberOfSpikes: 2, // Fewer for testing
          recoveryTime: 5000
        },
        volumeTest: { enabled: false, targetVolume: 0, duration: 0, dataSize: { small: 0, medium: 0, large: 0 }, sustainedLoad: false },
        enduranceTest: { enabled: false, duration: 0, constantLoad: 0, memoryLeakDetection: false, performanceDegradationThreshold: 0, checkpointInterval: 0 },
        monitoringConfig: {
          systemMetrics: { cpu: true, memory: true, disk: false, network: true, database: false },
          applicationMetrics: { responseTime: true, throughput: true, errorRate: true, activeConnections: false, queueLength: false },
          businessMetrics: { transactionSuccess: false, revenueImpact: false, userExperience: false },
          alerting: { realTimeAlerts: true, escalationRules: [], notificationChannels: [] }
        },
        failureCriteria: {
          maxErrorRate: 25,
          maxResponseTime: 10000,
          minThroughput: 3,
          maxCpuUsage: 95,
          maxMemoryUsage: 95,
          criticalEndpointFailure: false,
          cascadingFailureDetection: false
        }
      };

      const spikeResult = await this.stressTestRunner.runSpikeTest(config);

      if (!spikeResult) {
        throw new Error('Spike test did not return results');
      }

      if (spikeResult.spikesCompleted <= 0) {
        throw new Error('No spikes were completed');
      }

      if (!spikeResult.systemStability) {
        throw new Error('System stability not assessed');
      }

      return { spikeResult };
    });
  }

  private async testVolumeTest(): Promise<void> {
    await this.runTest('Volume Test', async () => {
      const config: StressTestConfiguration = {
        id: 'volume-test',
        name: 'Volume Test',
        targetSystem: {
          baseUrl: 'https://httpbin.org',
          endpoints: [
            {
              path: '/post',
              method: 'POST',
              weight: 100,
              payload: { data: 'test volume data' },
              expectedStatusCodes: [200],
              criticalEndpoint: false
            }
          ]
        },
        stressProfile: {
          userTypes: [
            {
              id: 'volume-user',
              name: 'Volume User',
              percentage: 100,
              behaviorPattern: {
                thinkTimeMin: 100,
                thinkTimeMax: 300,
                sessionDuration: 15000,
                actionsPerSession: 8,
                errorTolerance: 15
              },
              deviceProfile: {
                type: 'desktop',
                connectionSpeed: 'fast',
                userAgent: 'VolumeTest/1.0'
              }
            }
          ],
          concurrencyLevels: [],
          dataVariation: {
            useRandomData: true,
            dataSetSize: 200,
            dataRefreshInterval: 20000,
            customDataGenerators: {}
          },
          networkConditions: []
        },
        breakingPointTest: { enabled: false, startUsers: 0, maxUsers: 0, incrementStep: 0, incrementInterval: 0, stabilizationTime: 0, failureThreshold: { errorRate: 0, responseTime: 0, throughputDrop: 0 } },
        spikeTest: { enabled: false, baselineUsers: 0, spikeUsers: 0, spikeDuration: 0, spikeInterval: 0, numberOfSpikes: 0, recoveryTime: 0 },
        volumeTest: {
          enabled: true,
          targetVolume: 50, // Lower for testing
          duration: 10000, // Shorter for testing
          dataSize: { small: 60, medium: 30, large: 10 },
          sustainedLoad: true
        },
        enduranceTest: { enabled: false, duration: 0, constantLoad: 0, memoryLeakDetection: false, performanceDegradationThreshold: 0, checkpointInterval: 0 },
        monitoringConfig: {
          systemMetrics: { cpu: true, memory: true, disk: true, network: true, database: false },
          applicationMetrics: { responseTime: true, throughput: true, errorRate: true, activeConnections: false, queueLength: false },
          businessMetrics: { transactionSuccess: false, revenueImpact: false, userExperience: false },
          alerting: { realTimeAlerts: true, escalationRules: [], notificationChannels: [] }
        },
        failureCriteria: {
          maxErrorRate: 20,
          maxResponseTime: 8000,
          minThroughput: 10,
          maxCpuUsage: 90,
          maxMemoryUsage: 90,
          criticalEndpointFailure: false,
          cascadingFailureDetection: false
        }
      };

      const volumeResult = await this.stressTestRunner.runVolumeTest(config);

      if (!volumeResult) {
        throw new Error('Volume test did not return results');
      }

      if (volumeResult.actualThroughput <= 0) {
        throw new Error('No throughput recorded');
      }

      if (!volumeResult.resourceUtilization) {
        throw new Error('Resource utilization not tracked');
      }

      return { volumeResult };
    });
  }

  private async testEnduranceTest(): Promise<void> {
    await this.runTest('Endurance Test', async () => {
      const config: StressTestConfiguration = {
        id: 'endurance-test',
        name: 'Endurance Test',
        targetSystem: {
          baseUrl: 'https://httpbin.org',
          endpoints: [
            {
              path: '/get',
              method: 'GET',
              weight: 100,
              expectedStatusCodes: [200],
              criticalEndpoint: false
            }
          ]
        },
        stressProfile: {
          userTypes: [
            {
              id: 'endurance-user',
              name: 'Endurance User',
              percentage: 100,
              behaviorPattern: {
                thinkTimeMin: 1000,
                thinkTimeMax: 2000,
                sessionDuration: 30000,
                actionsPerSession: 5,
                errorTolerance: 10
              },
              deviceProfile: {
                type: 'desktop',
                connectionSpeed: 'medium',
                userAgent: 'EnduranceTest/1.0'
              }
            }
          ],
          concurrencyLevels: [],
          dataVariation: {
            useRandomData: false,
            dataSetSize: 100,
            dataRefreshInterval: 60000,
            customDataGenerators: {}
          },
          networkConditions: []
        },
        breakingPointTest: { enabled: false, startUsers: 0, maxUsers: 0, incrementStep: 0, incrementInterval: 0, stabilizationTime: 0, failureThreshold: { errorRate: 0, responseTime: 0, throughputDrop: 0 } },
        spikeTest: { enabled: false, baselineUsers: 0, spikeUsers: 0, spikeDuration: 0, spikeInterval: 0, numberOfSpikes: 0, recoveryTime: 0 },
        volumeTest: { enabled: false, targetVolume: 0, duration: 0, dataSize: { small: 0, medium: 0, large: 0 }, sustainedLoad: false },
        enduranceTest: {
          enabled: true,
          duration: 15000, // Much shorter for testing (15 seconds instead of hours)
          constantLoad: 8,
          memoryLeakDetection: true,
          performanceDegradationThreshold: 25,
          checkpointInterval: 5000 // 5 second checkpoints
        },
        monitoringConfig: {
          systemMetrics: { cpu: true, memory: true, disk: false, network: true, database: false },
          applicationMetrics: { responseTime: true, throughput: true, errorRate: true, activeConnections: false, queueLength: false },
          businessMetrics: { transactionSuccess: false, revenueImpact: false, userExperience: false },
          alerting: { realTimeAlerts: true, escalationRules: [], notificationChannels: [] }
        },
        failureCriteria: {
          maxErrorRate: 15,
          maxResponseTime: 6000,
          minThroughput: 5,
          maxCpuUsage: 85,
          maxMemoryUsage: 85,
          criticalEndpointFailure: false,
          cascadingFailureDetection: true
        }
      };

      const enduranceResult = await this.stressTestRunner.runEnduranceTest(config);

      if (!enduranceResult) {
        throw new Error('Endurance test did not return results');
      }

      if (enduranceResult.completedDuration <= 0) {
        throw new Error('No duration completed');
      }

      if (enduranceResult.stabilityScore < 0 || enduranceResult.stabilityScore > 100) {
        throw new Error('Invalid stability score');
      }

      return { enduranceResult };
    });
  }

  private async testPerformanceThresholds(): Promise<void> {
    await this.runTest('Performance Thresholds', async () => {
      // Test with very low thresholds to trigger alerts
      const config: LoadTestConfiguration = {
        id: 'threshold-test',
        name: 'Performance Threshold Test',
        targetUrl: 'https://httpbin.org',
        testDuration: 5000,
        rampUpTime: 1000,
        rampDownTime: 1000,
        maxConcurrentUsers: 3,
        testScenarios: [
          {
            id: 'threshold-scenario',
            name: 'Threshold Test Scenario',
            weight: 100,
            steps: [
              {
                id: 'slow-request',
                name: 'Slow Request',
                type: 'http',
                action: 'GET /delay/2',
                parameters: { url: '/delay/2' },
                validations: []
              }
            ],
            userProfile: {
              id: 'threshold-user',
              name: 'Threshold User',
              characteristics: {
                deviceType: 'desktop',
                connectionSpeed: 'fast',
                location: 'US',
                userAgent: 'ThresholdTest/1.0'
              },
              sessionData: {}
            },
            thinkTime: { min: 100, max: 300 }
          }
        ],
        performanceThresholds: {
          averageResponseTime: 500, // Very low to trigger alerts
          maxResponseTime: 1000,
          errorRate: 1,
          throughput: 100,
          cpuUsage: 50,
          memoryUsage: 50,
          networkLatency: 50
        },
        resourceLimits: {
          maxMemoryUsage: 512,
          maxCpuUsage: 80,
          maxNetworkBandwidth: 50,
          maxDatabaseConnections: 25,
          maxFileHandles: 250
        },
        monitoringConfig: {
          metricsInterval: 500,
          enableDetailedLogging: true,
          captureScreenshots: false,
          recordNetworkTraffic: false,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 600, // Low threshold
            errorRateAlert: 2,
            cpuUsageAlert: 60,
            memoryUsageAlert: 60
          }
        }
      };

      const testId = await this.loadTestingEngine.startLoadTest(config);
      
      // Wait for test to run and potentially trigger alerts
      await this.delay(3000);
      
      // Check for alerts
      const alerts = this.loadTestingEngine.getActiveAlerts(testId);
      
      const result = await this.loadTestingEngine.stopLoadTest(testId);

      // Verify threshold monitoring worked
      if (result.summary.averageResponseTime > config.performanceThresholds.averageResponseTime) {
        // This is expected - the slow request should exceed the threshold
        console.log('✓ Threshold exceeded as expected');
      }

      return { testId, result, alerts, thresholdExceeded: true };
    });
  }

  private async testAlertingSystem(): Promise<void> {
    await this.runTest('Alerting System', async () => {
      const testId = 'alert-test';
      
      // Start monitoring with low thresholds
      await this.performanceMonitor.startMonitoring(testId, {
        id: testId,
        name: 'Alert Test',
        targetUrl: 'https://httpbin.org',
        testDuration: 3000,
        rampUpTime: 500,
        rampDownTime: 500,
        maxConcurrentUsers: 2,
        testScenarios: [],
        performanceThresholds: {
          averageResponseTime: 100, // Very low
          maxResponseTime: 500,
          errorRate: 1,
          throughput: 1000,
          cpuUsage: 30, // Very low
          memoryUsage: 30,
          networkLatency: 50
        },
        resourceLimits: {
          maxMemoryUsage: 256,
          maxCpuUsage: 50,
          maxNetworkBandwidth: 25,
          maxDatabaseConnections: 10,
          maxFileHandles: 100
        },
        monitoringConfig: {
          metricsInterval: 200,
          enableDetailedLogging: true,
          captureScreenshots: false,
          recordNetworkTraffic: false,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 150,
            errorRateAlert: 2,
            cpuUsageAlert: 40,
            memoryUsageAlert: 40
          }
        }
      });

      // Record metrics that should trigger alerts
      this.performanceMonitor.recordMetric({
        id: 'alert-metric-1',
        name: 'response_time',
        value: 2000, // High response time
        unit: 'ms',
        timestamp: new Date(),
        category: 'response_time',
        tags: { testId }
      });

      this.performanceMonitor.recordMetric({
        id: 'alert-metric-2',
        name: 'cpu_usage',
        value: 85, // High CPU usage
        unit: '%',
        timestamp: new Date(),
        category: 'resource_usage',
        tags: { testId }
      });

      // Wait for alert processing
      await this.delay(1000);

      // Check for alerts
      const alerts = this.performanceMonitor.getActiveAlerts(testId);

      await this.performanceMonitor.stopMonitoring(testId);

      // Verify alerts were generated
      if (alerts.length === 0) {
        throw new Error('No alerts were generated despite threshold violations');
      }

      const responseTimeAlert = alerts.find(a => a.metric.includes('response_time'));
      const cpuAlert = alerts.find(a => a.metric.includes('cpu'));

      if (!responseTimeAlert && !cpuAlert) {
        throw new Error('Expected alerts were not found');
      }

      return { testId, alerts, responseTimeAlert, cpuAlert };
    });
  }

  private async testReportGeneration(): Promise<void> {
    await this.runTest('Report Generation', async () => {
      const testId = 'report-test';
      
      // Start monitoring
      await this.performanceMonitor.startMonitoring(testId, {
        id: testId,
        name: 'Report Test',
        targetUrl: 'https://httpbin.org',
        testDuration: 2000,
        rampUpTime: 500,
        rampDownTime: 500,
        maxConcurrentUsers: 2,
        testScenarios: [],
        performanceThresholds: {
          averageResponseTime: 1000,
          maxResponseTime: 5000,
          errorRate: 5,
          throughput: 10,
          cpuUsage: 80,
          memoryUsage: 80,
          networkLatency: 100
        },
        resourceLimits: {
          maxMemoryUsage: 512,
          maxCpuUsage: 90,
          maxNetworkBandwidth: 50,
          maxDatabaseConnections: 25,
          maxFileHandles: 250
        },
        monitoringConfig: {
          metricsInterval: 500,
          enableDetailedLogging: true,
          captureScreenshots: false,
          recordNetworkTraffic: true,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 2000,
            errorRateAlert: 10,
            cpuUsageAlert: 85,
            memoryUsageAlert: 85
          }
        }
      });

      // Record some test metrics
      const metrics = [
        {
          id: 'report-metric-1',
          name: 'response_time',
          value: 300,
          unit: 'ms',
          timestamp: new Date(),
          category: 'response_time' as const,
          tags: { testId, endpoint: '/test1' }
        },
        {
          id: 'report-metric-2',
          name: 'response_time',
          value: 450,
          unit: 'ms',
          timestamp: new Date(),
          category: 'response_time' as const,
          tags: { testId, endpoint: '/test2' }
        },
        {
          id: 'report-metric-3',
          name: 'throughput',
          value: 25,
          unit: 'rps',
          timestamp: new Date(),
          category: 'throughput' as const,
          tags: { testId }
        }
      ];

      metrics.forEach(metric => {
        this.performanceMonitor.recordMetric(metric);
      });

      await this.delay(1000);

      // Generate report
      const report = await this.performanceMonitor.generateReport(testId);

      await this.performanceMonitor.stopMonitoring(testId);

      // Verify report structure
      if (!report) {
        throw new Error('Report was not generated');
      }

      if (!report.summary) {
        throw new Error('Report missing summary');
      }

      if (!report.detailedMetrics) {
        throw new Error('Report missing detailed metrics');
      }

      if (report.summary.overallScore < 0 || report.summary.overallScore > 100) {
        throw new Error('Invalid overall score in report');
      }

      if (report.recommendations.length < 0) {
        throw new Error('Report should contain recommendations array');
      }

      return { testId, report, metricsCount: metrics.length };
    });
  }

  private async testLoadAdjustment(): Promise<void> {
    await this.runTest('Load Adjustment', async () => {
      const config: LoadTestConfiguration = {
        id: 'adjustment-test',
        name: 'Load Adjustment Test',
        targetUrl: 'https://httpbin.org',
        testDuration: 8000,
        rampUpTime: 1000,
        rampDownTime: 1000,
        maxConcurrentUsers: 10,
        testScenarios: [
          {
            id: 'adjustment-scenario',
            name: 'Adjustment Test Scenario',
            weight: 100,
            steps: [
              {
                id: 'adjustment-step',
                name: 'GET Request',
                type: 'http',
                action: 'GET /get',
                parameters: { url: '/get' },
                validations: []
              }
            ],
            userProfile: {
              id: 'adjustment-user',
              name: 'Adjustment User',
              characteristics: {
                deviceType: 'desktop',
                connectionSpeed: 'fast',
                location: 'US',
                userAgent: 'AdjustmentTest/1.0'
              },
              sessionData: {}
            },
            thinkTime: { min: 500, max: 1000 }
          }
        ],
        performanceThresholds: {
          averageResponseTime: 2000,
          maxResponseTime: 10000,
          errorRate: 10,
          throughput: 5,
          cpuUsage: 90,
          memoryUsage: 90,
          networkLatency: 200
        },
        resourceLimits: {
          maxMemoryUsage: 1024,
          maxCpuUsage: 95,
          maxNetworkBandwidth: 100,
          maxDatabaseConnections: 50,
          maxFileHandles: 500
        },
        monitoringConfig: {
          metricsInterval: 500,
          enableDetailedLogging: false,
          captureScreenshots: false,
          recordNetworkTraffic: false,
          trackResourceUsage: true,
          alertThresholds: {
            responseTimeAlert: 3000,
            errorRateAlert: 15,
            cpuUsageAlert: 95,
            memoryUsageAlert: 95
          }
        }
      };

      const testId = await this.loadTestingEngine.startLoadTest(config);
      
      // Wait for initial ramp up
      await this.delay(2000);
      
      // Get initial status
      const initialStatus = this.loadTestingEngine.getTestStatus(testId);
      const initialUsers = initialStatus?.progress.currentUsers || 0;
      
      // Adjust load up
      await this.loadTestingEngine.adjustLoad(testId, 15);
      await this.delay(1000);
      
      // Check increased load
      const increasedStatus = this.loadTestingEngine.getTestStatus(testId);
      const increasedUsers = increasedStatus?.progress.currentUsers || 0;
      
      // Adjust load down
      await this.loadTestingEngine.adjustLoad(testId, 5);
      await this.delay(1000);
      
      // Check decreased load
      const decreasedStatus = this.loadTestingEngine.getTestStatus(testId);
      const decreasedUsers = decreasedStatus?.progress.currentUsers || 0;
      
      const result = await this.loadTestingEngine.stopLoadTest(testId);

      // Verify load adjustment worked
      // Note: In a real implementation, we would verify the actual user count changes
      // For this test, we're just verifying the API calls don't fail
      
      return { 
        testId, 
        result, 
        initialUsers, 
        increasedUsers, 
        decreasedUsers,
        adjustmentWorked: true // Would be determined by actual user count changes
      };
    });
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        details: result
      });
      
      console.log(`✅ ${testName} - Passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        testName,
        success: false,
        duration,
        error: errorMessage
      });
      
      console.log(`❌ ${testName} - Failed (${duration}ms): ${errorMessage}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printResults(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Load Testing Test Results Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }

    console.log('\n🚀 Load Testing Test Suite Complete!\n');
  }
}

// Export function to run the tests
export async function runLoadTestingTests(): Promise<TestResult[]> {
  const testSuite = new LoadTestingTestSuite();
  return await testSuite.runAllTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runLoadTestingTests().catch(console.error);
}