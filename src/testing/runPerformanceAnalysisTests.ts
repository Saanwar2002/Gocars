import { PerformanceAnalyzer, PerformanceMetricData, TrendAnalysisResult, BottleneckAnalysis, PerformanceRegression } from '../performance/PerformanceAnalyzer';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class PerformanceAnalysisTestSuite {
  private analyzer: PerformanceAnalyzer;
  private results: TestResult[] = [];

  constructor() {
    this.analyzer = new PerformanceAnalyzer();
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('📊 Starting Performance Analysis Test Suite...\n');

    // Core analysis functionality
    await this.testMetricDataIngestion();
    await this.testTrendAnalysis();
    await this.testBottleneckDetection();
    await this.testRegressionDetection();
    await this.testBaselineCreation();
    
    // Advanced analysis features
    await this.testAnomalyDetection();
    await this.testForecastGeneration();
    await this.testPerformanceReporting();
    await this.testStatisticalCalculations();
    await this.testRecommendationGeneration();
    
    // Integration and edge cases
    await this.testLargeDatasetHandling();
    await this.testMissingDataHandling();
    await this.testRealTimeAnalysis();

    this.printResults();
    return this.results;
  }

  private async testMetricDataIngestion(): Promise<void> {
    await this.runTest('Metric Data Ingestion', async () => {
      const testMetrics: PerformanceMetricData[] = [
        {
          id: 'metric-1',
          timestamp: new Date(Date.now() - 60000),
          value: 150,
          unit: 'ms',
          category: 'response_time',
          subcategory: 'api',
          tags: { endpoint: '/api/users', method: 'GET' }
        },
        {
          id: 'metric-2',
          timestamp: new Date(Date.now() - 30000),
          value: 180,
          unit: 'ms',
          category: 'response_time',
          subcategory: 'api',
          tags: { endpoint: '/api/users', method: 'GET' }
        },
        {
          id: 'metric-3',
          timestamp: new Date(),
          value: 200,
          unit: 'ms',
          category: 'response_time',
          subcategory: 'api',
          tags: { endpoint: '/api/users', method: 'GET' }
        }
      ];

      // Test adding metrics
      this.analyzer.addMetricData(testMetrics);

      // Verify metrics are available
      const availableMetrics = this.analyzer.getAvailableMetrics();
      
      if (availableMetrics.length === 0) {
        throw new Error('No metrics available after ingestion');
      }

      if (!availableMetrics.includes('response_time_api')) {
        throw new Error('Expected metric category not found');
      }

      return { 
        metricsAdded: testMetrics.length, 
        availableMetrics: availableMetrics.length,
        categories: availableMetrics
      };
    });
  }

  private async testTrendAnalysis(): Promise<void> {
    await this.runTest('Trend Analysis', async () => {
      // Generate test data with a clear trend
      const testMetrics: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
      
      for (let i = 0; i < 20; i++) {
        testMetrics.push({
          id: `trend-metric-${i}`,
          timestamp: new Date(baseTime + (i * 3 * 60 * 1000)), // 3-minute intervals
          value: 100 + (i * 5), // Increasing trend
          unit: 'ms',
          category: 'response_time',
          subcategory: 'trend_test',
          tags: { test: 'trend_analysis' }
        });
      }

      this.analyzer.addMetricData(testMetrics);

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (60 * 60 * 1000))
      };

      const trendResult = await this.analyzer.analyzeTrends('response_time_trend_test', timeRange, {
        includeForecasting: true,
        forecastHorizon: 2,
        detectSeasonality: true,
        anomalyDetection: true
      });

      // Verify trend analysis results
      if (!trendResult) {
        throw new Error('Trend analysis returned no results');
      }

      if (trendResult.trend.direction !== 'increasing') {
        throw new Error(`Expected increasing trend, got ${trendResult.trend.direction}`);
      }

      if (trendResult.statistics.mean <= 0) {
        throw new Error('Invalid statistics calculated');
      }

      if (trendResult.forecast.length === 0) {
        throw new Error('No forecast generated');
      }

      return {
        trend: trendResult.trend,
        statistics: trendResult.statistics,
        forecastPoints: trendResult.forecast.length,
        anomalies: trendResult.anomalies.length
      };
    });
  }

  private async testBottleneckDetection(): Promise<void> {
    await this.runTest('Bottleneck Detection', async () => {
      // Generate test data with bottleneck patterns
      const testMetrics: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (30 * 60 * 1000); // 30 minutes ago

      // Normal CPU usage
      for (let i = 0; i < 10; i++) {
        testMetrics.push({
          id: `cpu-normal-${i}`,
          timestamp: new Date(baseTime + (i * 60 * 1000)),
          value: 30 + Math.random() * 10, // 30-40% CPU
          unit: '%',
          category: 'resource_usage',
          subcategory: 'cpu',
          tags: { component: 'application_server' }
        });
      }

      // Bottleneck: High CPU usage
      for (let i = 10; i < 15; i++) {
        testMetrics.push({
          id: `cpu-high-${i}`,
          timestamp: new Date(baseTime + (i * 60 * 1000)),
          value: 85 + Math.random() * 10, // 85-95% CPU (bottleneck)
          unit: '%',
          category: 'resource_usage',
          subcategory: 'cpu',
          tags: { component: 'application_server' }
        });
      }

      this.analyzer.addMetricData(testMetrics);

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (20 * 60 * 1000))
      };

      const bottlenecks = await this.analyzer.detectBottlenecks(timeRange, {
        severityThreshold: 'medium'
      });

      // Verify bottleneck detection
      if (bottlenecks.length === 0) {
        throw new Error('No bottlenecks detected despite high CPU usage');
      }

      const cpuBottleneck = bottlenecks.find(b => b.component === 'resource_usage');
      if (!cpuBottleneck) {
        throw new Error('CPU bottleneck not detected');
      }

      if (cpuBottleneck.severity === 'low') {
        throw new Error('Bottleneck severity incorrectly classified as low');
      }

      if (cpuBottleneck.recommendations.length === 0) {
        throw new Error('No recommendations provided for bottleneck');
      }

      return {
        bottlenecksDetected: bottlenecks.length,
        cpuBottleneck: {
          severity: cpuBottleneck.severity,
          impact: cpuBottleneck.impact.performanceDegradation,
          recommendations: cpuBottleneck.recommendations.length
        }
      };
    });
  }

  private async testRegressionDetection(): Promise<void> {
    await this.runTest('Regression Detection', async () => {
      // Create baseline data (good performance)
      const baselineMetrics: PerformanceMetricData[] = [];
      const baselineTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

      for (let i = 0; i < 50; i++) {
        baselineMetrics.push({
          id: `baseline-${i}`,
          timestamp: new Date(baselineTime + (i * 10 * 60 * 1000)), // 10-minute intervals
          value: 100 + Math.random() * 20, // 100-120ms response time
          unit: 'ms',
          category: 'response_time',
          subcategory: 'regression_test',
          tags: { endpoint: '/api/test' }
        });
      }

      this.analyzer.addMetricData(baselineMetrics);

      // Create baseline
      const baselineId = this.analyzer.createBaseline(
        'Test Baseline',
        {
          start: new Date(baselineTime),
          end: new Date(baselineTime + (50 * 10 * 60 * 1000))
        },
        {
          environment: 'test',
          load: 'normal',
          configuration: { version: '1.0.0' }
        }
      );

      // Create current data with regression (worse performance)
      const currentMetrics: PerformanceMetricData[] = [];
      const currentTime = Date.now() - (60 * 60 * 1000); // 1 hour ago

      for (let i = 0; i < 30; i++) {
        currentMetrics.push({
          id: `current-${i}`,
          timestamp: new Date(currentTime + (i * 2 * 60 * 1000)), // 2-minute intervals
          value: 150 + Math.random() * 30, // 150-180ms response time (regression)
          unit: 'ms',
          category: 'response_time',
          subcategory: 'regression_test',
          tags: { endpoint: '/api/test' }
        });
      }

      this.analyzer.addMetricData(currentMetrics);

      const currentTimeRange = {
        start: new Date(currentTime),
        end: new Date(currentTime + (30 * 2 * 60 * 1000))
      };

      const regressionResult = await this.analyzer.detectRegressions(baselineId, currentTimeRange, {
        sensitivityLevel: 'medium',
        minSignificance: 0.5
      });

      // Verify regression detection
      if (!regressionResult.detected) {
        throw new Error('Regression not detected despite performance degradation');
      }

      if (regressionResult.regressions.length === 0) {
        throw new Error('No regressions found in results');
      }

      const regression = regressionResult.regressions[0];
      if (regression.degradation.percentage < 10) {
        throw new Error('Regression percentage too low for significant degradation');
      }

      if (regression.recommendations.length === 0) {
        throw new Error('No recommendations provided for regression');
      }

      return {
        regressionsDetected: regressionResult.regressions.length,
        degradationPercentage: regression.degradation.percentage,
        severity: regression.severity,
        recommendations: regression.recommendations.length
      };
    });
  }

  private async testBaselineCreation(): Promise<void> {
    await this.runTest('Baseline Creation', async () => {
      // Generate stable baseline data
      const baselineMetrics: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago

      for (let i = 0; i < 60; i++) {
        baselineMetrics.push({
          id: `baseline-stable-${i}`,
          timestamp: new Date(baseTime + (i * 2 * 60 * 1000)), // 2-minute intervals
          value: 200 + Math.random() * 10, // Stable around 200ms
          unit: 'ms',
          category: 'response_time',
          subcategory: 'baseline_test',
          tags: { service: 'api' }
        });
      }

      this.analyzer.addMetricData(baselineMetrics);

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (60 * 2 * 60 * 1000))
      };

      const baselineId = this.analyzer.createBaseline(
        'Stable Performance Baseline',
        timeRange,
        {
          environment: 'production',
          load: 'normal',
          configuration: { version: '2.0.0', instances: 3 }
        }
      );

      // Verify baseline creation
      if (!baselineId) {
        throw new Error('Baseline ID not returned');
      }

      const baseline = this.analyzer.getBaseline(baselineId);
      if (!baseline) {
        throw new Error('Baseline not found after creation');
      }

      if (baseline.metrics.length === 0) {
        throw new Error('No metrics in baseline');
      }

      if (baseline.quality.completeness <= 0) {
        throw new Error('Invalid baseline quality metrics');
      }

      const responseTimeMetric = baseline.metrics.find(m => m.name === 'response_time_baseline_test');
      if (!responseTimeMetric) {
        throw new Error('Expected metric not found in baseline');
      }

      if (responseTimeMetric.statistics.mean < 190 || responseTimeMetric.statistics.mean > 210) {
        throw new Error('Baseline statistics outside expected range');
      }

      return {
        baselineId,
        metricsCount: baseline.metrics.length,
        quality: baseline.quality,
        meanResponseTime: responseTimeMetric.statistics.mean
      };
    });
  }

  private async testAnomalyDetection(): Promise<void> {
    await this.runTest('Anomaly Detection', async () => {
      // Generate normal data with anomalies
      const testMetrics: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (60 * 60 * 1000); // 1 hour ago

      // Normal data points
      for (let i = 0; i < 30; i++) {
        testMetrics.push({
          id: `normal-${i}`,
          timestamp: new Date(baseTime + (i * 2 * 60 * 1000)),
          value: 100 + Math.random() * 10, // Normal: 100-110ms
          unit: 'ms',
          category: 'response_time',
          subcategory: 'anomaly_test',
          tags: { test: 'anomaly_detection' }
        });
      }

      // Add anomalies
      testMetrics.push({
        id: 'anomaly-spike',
        timestamp: new Date(baseTime + (15 * 2 * 60 * 1000)),
        value: 500, // Spike anomaly
        unit: 'ms',
        category: 'response_time',
        subcategory: 'anomaly_test',
        tags: { test: 'anomaly_detection' }
      });

      testMetrics.push({
        id: 'anomaly-drop',
        timestamp: new Date(baseTime + (25 * 2 * 60 * 1000)),
        value: 10, // Drop anomaly
        unit: 'ms',
        category: 'response_time',
        subcategory: 'anomaly_test',
        tags: { test: 'anomaly_detection' }
      });

      this.analyzer.addMetricData(testMetrics);

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (30 * 2 * 60 * 1000))
      };

      const trendResult = await this.analyzer.analyzeTrends('response_time_anomaly_test', timeRange, {
        anomalyDetection: true
      });

      // Verify anomaly detection
      if (trendResult.anomalies.length === 0) {
        throw new Error('No anomalies detected despite clear outliers');
      }

      if (trendResult.anomalies.length < 2) {
        throw new Error('Not all anomalies detected');
      }

      const spikeAnomaly = trendResult.anomalies.find(a => a.type === 'spike');
      const dropAnomaly = trendResult.anomalies.find(a => a.type === 'drop');

      if (!spikeAnomaly) {
        throw new Error('Spike anomaly not detected');
      }

      if (!dropAnomaly) {
        throw new Error('Drop anomaly not detected');
      }

      if (spikeAnomaly.severity === 'low') {
        throw new Error('Spike anomaly severity incorrectly classified');
      }

      return {
        anomaliesDetected: trendResult.anomalies.length,
        spikeAnomaly: {
          value: spikeAnomaly.value,
          severity: spikeAnomaly.severity,
          deviation: spikeAnomaly.deviation
        },
        dropAnomaly: {
          value: dropAnomaly.value,
          severity: dropAnomaly.severity,
          deviation: dropAnomaly.deviation
        }
      };
    });
  }

  private async testForecastGeneration(): Promise<void> {
    await this.runTest('Forecast Generation', async () => {
      // Generate trending data for forecasting
      const testMetrics: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (4 * 60 * 60 * 1000); // 4 hours ago

      for (let i = 0; i < 40; i++) {
        testMetrics.push({
          id: `forecast-${i}`,
          timestamp: new Date(baseTime + (i * 6 * 60 * 1000)), // 6-minute intervals
          value: 100 + (i * 2) + Math.random() * 5, // Linear trend with noise
          unit: 'ms',
          category: 'response_time',
          subcategory: 'forecast_test',
          tags: { test: 'forecasting' }
        });
      }

      this.analyzer.addMetricData(testMetrics);

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (40 * 6 * 60 * 1000))
      };

      const trendResult = await this.analyzer.analyzeTrends('response_time_forecast_test', timeRange, {
        includeForecasting: true,
        forecastHorizon: 6 // 6 hours
      });

      // Verify forecast generation
      if (trendResult.forecast.length === 0) {
        throw new Error('No forecast points generated');
      }

      if (trendResult.forecast.length !== 6) {
        throw new Error(`Expected 6 forecast points, got ${trendResult.forecast.length}`);
      }

      const firstForecast = trendResult.forecast[0];
      if (!firstForecast.confidenceInterval) {
        throw new Error('Forecast missing confidence interval');
      }

      if (firstForecast.confidence <= 0 || firstForecast.confidence > 1) {
        throw new Error('Invalid forecast confidence value');
      }

      // Verify forecast follows trend
      const lastActualValue = testMetrics[testMetrics.length - 1].value;
      if (firstForecast.predictedValue < lastActualValue) {
        throw new Error('Forecast does not follow increasing trend');
      }

      return {
        forecastPoints: trendResult.forecast.length,
        firstForecast: {
          value: firstForecast.predictedValue,
          confidence: firstForecast.confidence,
          interval: firstForecast.confidenceInterval
        },
        trendDirection: trendResult.trend.direction
      };
    });
  }

  private async testPerformanceReporting(): Promise<void> {
    await this.runTest('Performance Reporting', async () => {
      // Generate comprehensive test data
      const testMetrics: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago

      // Response time metrics
      for (let i = 0; i < 30; i++) {
        testMetrics.push({
          id: `report-rt-${i}`,
          timestamp: new Date(baseTime + (i * 4 * 60 * 1000)),
          value: 120 + Math.random() * 20,
          unit: 'ms',
          category: 'response_time',
          subcategory: 'api',
          tags: { endpoint: '/api/report' }
        });
      }

      // Throughput metrics
      for (let i = 0; i < 30; i++) {
        testMetrics.push({
          id: `report-tp-${i}`,
          timestamp: new Date(baseTime + (i * 4 * 60 * 1000)),
          value: 100 + Math.random() * 10,
          unit: 'rps',
          category: 'throughput',
          tags: { service: 'api' }
        });
      }

      // Error rate metrics
      for (let i = 0; i < 30; i++) {
        testMetrics.push({
          id: `report-er-${i}`,
          timestamp: new Date(baseTime + (i * 4 * 60 * 1000)),
          value: Math.random() * 2, // 0-2% error rate
          unit: '%',
          category: 'error_rate',
          tags: { service: 'api' }
        });
      }

      this.analyzer.addMetricData(testMetrics);

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (30 * 4 * 60 * 1000))
      };

      const report = await this.analyzer.generatePerformanceReport(timeRange, {
        includeComparisons: false,
        detailLevel: 'comprehensive'
      });

      // Verify report generation
      if (!report) {
        throw new Error('Performance report not generated');
      }

      if (!report.summary) {
        throw new Error('Report missing summary');
      }

      if (report.summary.healthScore < 0 || report.summary.healthScore > 100) {
        throw new Error('Invalid health score');
      }

      if (report.trendAnalysis.length === 0) {
        throw new Error('No trend analysis in report');
      }

      if (report.recommendations.length < 0) {
        throw new Error('Recommendations array missing');
      }

      if (report.summary.keyFindings.length === 0) {
        throw new Error('No key findings in report');
      }

      return {
        healthScore: report.summary.healthScore,
        overallHealth: report.summary.overallHealth,
        trendsAnalyzed: report.trendAnalysis.length,
        bottlenecksFound: report.bottlenecks.length,
        regressionsFound: report.regressions.length,
        recommendationsGenerated: report.recommendations.length,
        keyFindings: report.summary.keyFindings.length
      };
    });
  }

  private async testStatisticalCalculations(): Promise<void> {
    await this.runTest('Statistical Calculations', async () => {
      // Generate test data with known statistical properties
      const testValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const testMetrics: PerformanceMetricData[] = testValues.map((value, index) => ({
        id: `stats-${index}`,
        timestamp: new Date(Date.now() - ((testValues.length - index) * 60 * 1000)),
        value,
        unit: 'ms',
        category: 'response_time',
        subcategory: 'stats_test',
        tags: { test: 'statistics' }
      }));

      this.analyzer.addMetricData(testMetrics);

      const timeRange = {
        start: new Date(Date.now() - (testValues.length * 60 * 1000)),
        end: new Date()
      };

      const trendResult = await this.analyzer.analyzeTrends('response_time_stats_test', timeRange);

      // Verify statistical calculations
      const expectedMean = 55; // (10+20+...+100)/10
      const expectedMedian = 55; // (50+60)/2
      const expectedMin = 10;
      const expectedMax = 100;

      if (Math.abs(trendResult.statistics.mean - expectedMean) > 0.1) {
        throw new Error(`Mean calculation incorrect: expected ${expectedMean}, got ${trendResult.statistics.mean}`);
      }

      if (Math.abs(trendResult.statistics.median - expectedMedian) > 0.1) {
        throw new Error(`Median calculation incorrect: expected ${expectedMedian}, got ${trendResult.statistics.median}`);
      }

      if (trendResult.statistics.min !== expectedMin) {
        throw new Error(`Min calculation incorrect: expected ${expectedMin}, got ${trendResult.statistics.min}`);
      }

      if (trendResult.statistics.max !== expectedMax) {
        throw new Error(`Max calculation incorrect: expected ${expectedMax}, got ${trendResult.statistics.max}`);
      }

      if (trendResult.statistics.percentiles.p50 !== expectedMedian) {
        throw new Error(`P50 calculation incorrect: expected ${expectedMedian}, got ${trendResult.statistics.percentiles.p50}`);
      }

      return {
        mean: trendResult.statistics.mean,
        median: trendResult.statistics.median,
        min: trendResult.statistics.min,
        max: trendResult.statistics.max,
        standardDeviation: trendResult.statistics.standardDeviation,
        percentiles: trendResult.statistics.percentiles
      };
    });
  }

  private async testRecommendationGeneration(): Promise<void> {
    await this.runTest('Recommendation Generation', async () => {
      // Create scenario that should generate recommendations
      const testMetrics: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (60 * 60 * 1000);

      // High response times (should trigger performance recommendations)
      for (let i = 0; i < 20; i++) {
        testMetrics.push({
          id: `rec-rt-${i}`,
          timestamp: new Date(baseTime + (i * 3 * 60 * 1000)),
          value: 2000 + Math.random() * 500, // High response times
          unit: 'ms',
          category: 'response_time',
          subcategory: 'recommendation_test',
          tags: { endpoint: '/api/slow' }
        });
      }

      // High CPU usage (should trigger bottleneck recommendations)
      for (let i = 0; i < 20; i++) {
        testMetrics.push({
          id: `rec-cpu-${i}`,
          timestamp: new Date(baseTime + (i * 3 * 60 * 1000)),
          value: 90 + Math.random() * 5, // High CPU usage
          unit: '%',
          category: 'resource_usage',
          subcategory: 'cpu',
          tags: { component: 'application' }
        });
      }

      this.analyzer.addMetricData(testMetrics);

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (20 * 3 * 60 * 1000))
      };

      const report = await this.analyzer.generatePerformanceReport(timeRange, {
        detailLevel: 'comprehensive'
      });

      // Verify recommendation generation
      if (report.recommendations.length === 0) {
        throw new Error('No recommendations generated despite performance issues');
      }

      const performanceRec = report.recommendations.find(r => r.category === 'performance');
      if (!performanceRec) {
        throw new Error('No performance recommendations generated');
      }

      if (!performanceRec.title || performanceRec.title.length === 0) {
        throw new Error('Recommendation missing title');
      }

      if (!performanceRec.description || performanceRec.description.length === 0) {
        throw new Error('Recommendation missing description');
      }

      if (!performanceRec.implementation || performanceRec.implementation.steps.length === 0) {
        throw new Error('Recommendation missing implementation steps');
      }

      if (!performanceRec.expectedOutcome || !performanceRec.expectedOutcome.improvement) {
        throw new Error('Recommendation missing expected outcome');
      }

      // Check priority ordering
      const priorities = report.recommendations.map(r => r.priority);
      const criticalCount = priorities.filter(p => p === 'critical').length;
      const highCount = priorities.filter(p => p === 'high').length;

      return {
        totalRecommendations: report.recommendations.length,
        performanceRecommendations: report.recommendations.filter(r => r.category === 'performance').length,
        criticalPriority: criticalCount,
        highPriority: highCount,
        firstRecommendation: {
          title: performanceRec.title,
          priority: performanceRec.priority,
          category: performanceRec.category,
          implementationSteps: performanceRec.implementation.steps.length
        }
      };
    });
  }

  private async testLargeDatasetHandling(): Promise<void> {
    await this.runTest('Large Dataset Handling', async () => {
      // Generate large dataset
      const largeDataset: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          id: `large-${i}`,
          timestamp: new Date(baseTime + (i * 86400)), // 1-minute intervals
          value: 100 + Math.sin(i / 10) * 20 + Math.random() * 10,
          unit: 'ms',
          category: 'response_time',
          subcategory: 'large_test',
          tags: { test: 'large_dataset' }
        });
      }

      const startTime = Date.now();
      this.analyzer.addMetricData(largeDataset);
      const ingestionTime = Date.now() - startTime;

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (1000 * 86400))
      };

      const analysisStartTime = Date.now();
      const trendResult = await this.analyzer.analyzeTrends('response_time_large_test', timeRange, {
        includeForecasting: true,
        anomalyDetection: true
      });
      const analysisTime = Date.now() - analysisStartTime;

      // Verify large dataset handling
      if (!trendResult) {
        throw new Error('Failed to analyze large dataset');
      }

      if (trendResult.statistics.mean <= 0) {
        throw new Error('Invalid statistics for large dataset');
      }

      // Performance checks
      if (ingestionTime > 5000) { // 5 seconds
        throw new Error(`Data ingestion too slow: ${ingestionTime}ms`);
      }

      if (analysisTime > 10000) { // 10 seconds
        throw new Error(`Analysis too slow: ${analysisTime}ms`);
      }

      return {
        dataPoints: largeDataset.length,
        ingestionTime,
        analysisTime,
        statistics: trendResult.statistics,
        anomaliesDetected: trendResult.anomalies.length,
        forecastGenerated: trendResult.forecast.length > 0
      };
    });
  }

  private async testMissingDataHandling(): Promise<void> {
    await this.runTest('Missing Data Handling', async () => {
      // Test with empty dataset
      try {
        const emptyTimeRange = {
          start: new Date(Date.now() - 60000),
          end: new Date()
        };

        await this.analyzer.analyzeTrends('nonexistent_metric', emptyTimeRange);
        throw new Error('Should have thrown error for missing data');
      } catch (error) {
        if (!(error as Error).message.includes('No metrics found')) {
          throw new Error('Incorrect error message for missing data');
        }
      }

      // Test with insufficient data
      const sparseMetrics: PerformanceMetricData[] = [
        {
          id: 'sparse-1',
          timestamp: new Date(Date.now() - 60000),
          value: 100,
          unit: 'ms',
          category: 'response_time',
          subcategory: 'sparse_test',
          tags: { test: 'sparse' }
        }
      ];

      this.analyzer.addMetricData(sparseMetrics);

      const sparseTimeRange = {
        start: new Date(Date.now() - 120000),
        end: new Date()
      };

      const sparseResult = await this.analyzer.analyzeTrends('response_time_sparse_test', sparseTimeRange);

      // Verify handling of sparse data
      if (sparseResult.trend.confidence > 0.5) {
        throw new Error('Confidence too high for sparse data');
      }

      if (sparseResult.trend.direction !== 'stable') {
        throw new Error('Should classify single data point as stable');
      }

      return {
        sparseDataHandled: true,
        emptyDataErrorHandled: true,
        sparseConfidence: sparseResult.trend.confidence,
        sparseTrend: sparseResult.trend.direction
      };
    });
  }

  private async testRealTimeAnalysis(): Promise<void> {
    await this.runTest('Real-time Analysis', async () => {
      // Simulate real-time data ingestion and analysis
      const realTimeMetrics: PerformanceMetricData[] = [];
      const baseTime = Date.now() - (10 * 60 * 1000); // 10 minutes ago

      // Add initial data
      for (let i = 0; i < 10; i++) {
        realTimeMetrics.push({
          id: `realtime-${i}`,
          timestamp: new Date(baseTime + (i * 60 * 1000)),
          value: 100 + Math.random() * 20,
          unit: 'ms',
          category: 'response_time',
          subcategory: 'realtime_test',
          tags: { test: 'realtime' }
        });
      }

      this.analyzer.addMetricData(realTimeMetrics);

      // Simulate real-time updates
      const updates: PerformanceMetricData[] = [];
      for (let i = 10; i < 15; i++) {
        updates.push({
          id: `realtime-update-${i}`,
          timestamp: new Date(baseTime + (i * 60 * 1000)),
          value: 120 + Math.random() * 30, // Slightly higher values
          unit: 'ms',
          category: 'response_time',
          subcategory: 'realtime_test',
          tags: { test: 'realtime' }
        });
      }

      // Add updates and re-analyze
      this.analyzer.addMetricData(updates);

      const timeRange = {
        start: new Date(baseTime),
        end: new Date(baseTime + (15 * 60 * 1000))
      };

      const updatedResult = await this.analyzer.analyzeTrends('response_time_realtime_test', timeRange);

      // Verify real-time analysis
      if (!updatedResult) {
        throw new Error('Real-time analysis failed');
      }

      if (updatedResult.statistics.mean <= 100) {
        throw new Error('Real-time updates not reflected in analysis');
      }

      // Check that trend reflects the increase
      if (updatedResult.trend.direction === 'decreasing') {
        throw new Error('Trend analysis not updated with real-time data');
      }

      return {
        initialDataPoints: realTimeMetrics.length,
        updatedDataPoints: updates.length,
        finalMean: updatedResult.statistics.mean,
        trendDirection: updatedResult.trend.direction,
        trendStrength: updatedResult.trend.strength
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

  private printResults(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Performance Analysis Test Results Summary:');
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

    console.log('\n📊 Performance Analysis Test Suite Complete!\n');
  }
}

// Export function to run the tests
export async function runPerformanceAnalysisTests(): Promise<TestResult[]> {
  const testSuite = new PerformanceAnalysisTestSuite();
  return await testSuite.runAllTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPerformanceAnalysisTests().catch(console.error);
}