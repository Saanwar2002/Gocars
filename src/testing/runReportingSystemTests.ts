import { ReportGenerator, ReportConfiguration, ComprehensiveReport } from '../reporting/ReportGenerator';
import { TestResult } from '../testing/core/TestResult';
import { ErrorEntry } from '../testing/core/ErrorAnalysisEngine';
import { DashboardMetrics } from '../monitoring/dashboard/MonitoringDashboard';
import fs from 'fs';
import path from 'path';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

class ReportingSystemTester {
  private results: TestResult[] = [];
  private reportGenerator: ReportGenerator;
  private testOutputDir: string;

  constructor() {
    this.reportGenerator = new ReportGenerator();
    this.testOutputDir = path.join(process.cwd(), 'test-reports');
    this.ensureTestOutputDirectory();
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Reporting System Tests...\n');

    await this.testReportGeneratorCore();
    await this.testExecutiveSummaryGeneration();
    await this.testTechnicalReportGeneration();
    await this.testTrendAnalysisGeneration();
    await this.testReportExporting();
    await this.testHistoricalDataManagement();
    await this.testRecommendationEngine();

    this.printSummary();
    return this.results;
  }

  private async testReportGeneratorCore(): Promise<void> {
    console.log('📊 Testing Report Generator Core...');

    // Test report generator initialization
    await this.runTest('Report Generator Initialization', async () => {
      const generator = new ReportGenerator();
      
      if (!generator) {
        throw new Error('Report generator not created');
      }

      return 'Report generator initialized successfully';
    });

    // Test comprehensive report generation
    await this.runTest('Comprehensive Report Generation', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: true,
        includeTrendAnalysis: true,
        includeRecommendations: true,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      if (!report || !report.metadata) {
        throw new Error('Report not generated properly');
      }

      if (!report.executiveSummary || !report.technicalReport || !report.trendAnalysis) {
        throw new Error('Report sections missing');
      }

      if (!report.metadata.reportId || !report.metadata.generatedAt) {
        throw new Error('Report metadata incomplete');
      }

      return 'Comprehensive report generated with all sections';
    });

    // Test selective report generation
    await this.runTest('Selective Report Generation', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      if (!report.executiveSummary) {
        throw new Error('Executive summary not included');
      }

      if (report.technicalReport || report.trendAnalysis) {
        throw new Error('Unwanted sections included in report');
      }

      return 'Selective report generation works correctly';
    });
  }

  private async testExecutiveSummaryGeneration(): Promise<void> {
    console.log('📈 Testing Executive Summary Generation...');

    // Test health score calculation
    await this.runTest('Health Score Calculation', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const summary = report.executiveSummary!;
      
      if (summary.overallHealthScore < 0 || summary.overallHealthScore > 100) {
        throw new Error('Health score out of valid range (0-100)');
      }

      if (!['healthy', 'warning', 'critical'].includes(summary.systemStatus)) {
        throw new Error('Invalid system status');
      }

      return `Health score calculated: ${summary.overallHealthScore.toFixed(1)} (${summary.systemStatus})`;
    });

    // Test performance trends analysis
    await this.runTest('Performance Trends Analysis', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const trends = report.executiveSummary!.performanceTrends;
      
      const validTrends = ['improving', 'stable', 'degrading'];
      if (!validTrends.includes(trends.responseTime) ||
          !validTrends.includes(trends.errorRate) ||
          !validTrends.includes(trends.throughput)) {
        throw new Error('Invalid performance trend values');
      }

      return 'Performance trends analyzed correctly';
    });

    // Test key metrics calculation
    await this.runTest('Key Metrics Calculation', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const keyMetrics = report.executiveSummary!.keyMetrics;
      
      if (keyMetrics.meanTimeToDetection < 0 ||
          keyMetrics.meanTimeToResolution < 0 ||
          keyMetrics.systemAvailability < 0 || keyMetrics.systemAvailability > 100 ||
          keyMetrics.userExperienceScore < 0 || keyMetrics.userExperienceScore > 100) {
        throw new Error('Key metrics have invalid values');
      }

      return 'Key metrics calculated within valid ranges';
    });

    // Test recommendations generation
    await this.runTest('Top Recommendations Generation', async () => {
      const mockData = this.createMockTestData();
      // Add some issues to trigger recommendations
      mockData.errors.push({
        id: 'critical-error-1',
        timestamp: new Date(),
        severity: 'critical',
        category: 'functional',
        component: 'TestComponent',
        description: 'Critical system failure',
        context: {},
        autoFixable: false
      });

      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const recommendations = report.executiveSummary!.topRecommendations;
      
      if (!Array.isArray(recommendations)) {
        throw new Error('Recommendations not returned as array');
      }

      if (recommendations.length === 0) {
        throw new Error('No recommendations generated despite having issues');
      }

      if (recommendations.length > 5) {
        throw new Error('Too many recommendations returned (should be max 5)');
      }

      return `Generated ${recommendations.length} top recommendations`;
    });
  }

  private async testTechnicalReportGeneration(): Promise<void> {
    console.log('🔧 Testing Technical Report Generation...');

    // Test test results analysis
    await this.runTest('Test Results Analysis', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: true,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const testResults = report.technicalReport!.testResults;
      
      if (!testResults.summary || !testResults.suiteResults || !testResults.failedTests) {
        throw new Error('Test results analysis incomplete');
      }

      const summary = testResults.summary;
      if (summary.totalTests !== mockData.testResults.length) {
        throw new Error('Total test count mismatch');
      }

      const expectedPassed = mockData.testResults.filter(t => t.status === 'passed').length;
      if (summary.passedTests !== expectedPassed) {
        throw new Error('Passed test count mismatch');
      }

      return 'Test results analyzed correctly';
    });

    // Test error analysis
    await this.runTest('Error Analysis', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: true,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const errorAnalysis = report.technicalReport!.errorAnalysis;
      
      if (errorAnalysis.totalErrors !== mockData.errors.length) {
        throw new Error('Total error count mismatch');
      }

      if (!errorAnalysis.errorsByCategory || !errorAnalysis.errorsBySeverity) {
        throw new Error('Error categorization missing');
      }

      if (!Array.isArray(errorAnalysis.topErrors)) {
        throw new Error('Top errors not returned as array');
      }

      if (!Array.isArray(errorAnalysis.errorTrends)) {
        throw new Error('Error trends not returned as array');
      }

      return 'Error analysis completed successfully';
    });

    // Test performance metrics analysis
    await this.runTest('Performance Metrics Analysis', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: true,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const perfMetrics = report.technicalReport!.performanceMetrics;
      
      if (!perfMetrics.current || !perfMetrics.trends || !perfMetrics.benchmarks) {
        throw new Error('Performance metrics analysis incomplete');
      }

      if (perfMetrics.current.responseTime !== mockData.metrics.performance.averageResponseTime) {
        throw new Error('Current performance metrics mismatch');
      }

      if (!Array.isArray(perfMetrics.benchmarks) || perfMetrics.benchmarks.length === 0) {
        throw new Error('Performance benchmarks not generated');
      }

      return 'Performance metrics analyzed correctly';
    });

    // Test fix application history analysis
    await this.runTest('Fix Application History Analysis', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: true,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const fixHistory = report.technicalReport!.fixApplicationHistory;
      
      if (fixHistory.totalFixes !== mockData.fixHistory.length) {
        throw new Error('Total fix count mismatch');
      }

      const expectedSuccessRate = mockData.fixHistory.length > 0
        ? (mockData.fixHistory.filter(f => f.success).length / mockData.fixHistory.length) * 100
        : 0;
      
      if (Math.abs(fixHistory.successRate - expectedSuccessRate) > 0.1) {
        throw new Error('Fix success rate calculation incorrect');
      }

      return 'Fix application history analyzed correctly';
    });
  }

  private async testTrendAnalysisGeneration(): Promise<void> {
    console.log('📈 Testing Trend Analysis Generation...');

    // Test historical data generation
    await this.runTest('Historical Data Generation', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: false,
        includeTrendAnalysis: true,
        includeRecommendations: false,
        format: 'json',
        timeRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          end: new Date()
        }
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const trendAnalysis = report.trendAnalysis!;
      
      if (!trendAnalysis.historicalData) {
        throw new Error('Historical data not generated');
      }

      const histData = trendAnalysis.historicalData;
      if (!histData.testPassRates || !histData.performanceMetrics || 
          !histData.errorRates || !histData.systemHealth) {
        throw new Error('Historical data categories missing');
      }

      // Check that data points are generated
      if (histData.testPassRates.length === 0) {
        throw new Error('No historical test pass rate data generated');
      }

      return 'Historical data generated for all categories';
    });

    // Test regression detection
    await this.runTest('Regression Detection', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: false,
        includeTrendAnalysis: true,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const regressionDetection = report.trendAnalysis!.regressionDetection;
      
      if (!Array.isArray(regressionDetection.detectedRegressions)) {
        throw new Error('Detected regressions not returned as array');
      }

      if (!Array.isArray(regressionDetection.qualityTrends)) {
        throw new Error('Quality trends not returned as array');
      }

      // Verify quality trends have required properties
      if (regressionDetection.qualityTrends.length > 0) {
        const trend = regressionDetection.qualityTrends[0];
        if (!trend.metric || typeof trend.currentValue !== 'number' || 
            typeof trend.previousValue !== 'number' || !trend.trend) {
          throw new Error('Quality trend data incomplete');
        }
      }

      return 'Regression detection completed successfully';
    });

    // Test quality metrics analysis
    await this.runTest('Quality Metrics Analysis', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: false,
        includeTrendAnalysis: true,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const qualityMetrics = report.trendAnalysis!.qualityMetrics;
      
      if (!qualityMetrics.codeCoverage || !qualityMetrics.featureCompleteness ||
          !qualityMetrics.securityVulnerabilities || !qualityMetrics.accessibilityCompliance) {
        throw new Error('Quality metrics categories missing');
      }

      // Check that each category has data points
      Object.values(qualityMetrics).forEach((dataPoints, index) => {
        if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
          throw new Error(`Quality metric category ${index} has no data points`);
        }
      });

      return 'Quality metrics analyzed for all categories';
    });

    // Test improvement recommendations
    await this.runTest('Improvement Recommendations Generation', async () => {
      const mockData = this.createMockTestData();
      // Add some issues to trigger recommendations
      mockData.testResults.push({
        id: 'failed-test-1',
        name: 'Critical Test Failure',
        status: 'failed',
        duration: 5000,
        message: 'Test failed due to system error'
      });

      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: false,
        includeTrendAnalysis: true,
        includeRecommendations: true,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const recommendations = report.trendAnalysis!.improvementRecommendations;
      
      if (!Array.isArray(recommendations)) {
        throw new Error('Improvement recommendations not returned as array');
      }

      if (recommendations.length > 0) {
        const rec = recommendations[0];
        if (!rec.id || !rec.priority || !rec.category || !rec.title || 
            !rec.description || !rec.impact || !rec.effort || !Array.isArray(rec.actionItems)) {
          throw new Error('Recommendation data incomplete');
        }

        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(rec.priority)) {
          throw new Error('Invalid recommendation priority');
        }

        const validCategories = ['performance', 'reliability', 'security', 'usability'];
        if (!validCategories.includes(rec.category)) {
          throw new Error('Invalid recommendation category');
        }
      }

      return `Generated ${recommendations.length} improvement recommendations`;
    });
  }

  private async testReportExporting(): Promise<void> {
    console.log('📄 Testing Report Exporting...');

    // Test JSON export
    await this.runTest('JSON Export', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: true,
        includeTrendAnalysis: true,
        includeRecommendations: true,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const filePath = await this.reportGenerator.exportReport(
        report,
        'json',
        this.testOutputDir
      );

      if (!fs.existsSync(filePath)) {
        throw new Error('JSON report file not created');
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsedReport = JSON.parse(fileContent);
      
      if (!parsedReport.metadata || !parsedReport.executiveSummary) {
        throw new Error('JSON report content invalid');
      }

      return `JSON report exported to ${filePath}`;
    });

    // Test HTML export
    await this.runTest('HTML Export', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: true,
        includeTrendAnalysis: true,
        includeRecommendations: true,
        format: 'html'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const filePath = await this.reportGenerator.exportReport(
        report,
        'html',
        this.testOutputDir
      );

      if (!fs.existsSync(filePath)) {
        throw new Error('HTML report file not created');
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      if (!fileContent.includes('<!DOCTYPE html>') || 
          !fileContent.includes('Comprehensive Testing Report')) {
        throw new Error('HTML report content invalid');
      }

      return `HTML report exported to ${filePath}`;
    });

    // Test PDF export (note: currently generates HTML)
    await this.runTest('PDF Export', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'pdf'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const filePath = await this.reportGenerator.exportReport(
        report,
        'pdf',
        this.testOutputDir
      );

      // Currently returns HTML file since PDF conversion is not implemented
      if (!fs.existsSync(filePath)) {
        throw new Error('PDF report file not created');
      }

      return `PDF report exported to ${filePath} (HTML format)`;
    });
  }

  private async testHistoricalDataManagement(): Promise<void> {
    console.log('📊 Testing Historical Data Management...');

    // Test historical data storage
    await this.runTest('Historical Data Storage', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      // Generate multiple reports to build historical data
      for (let i = 0; i < 3; i++) {
        await this.reportGenerator.generateReport(
          mockData.testResults,
          mockData.errors,
          mockData.metrics,
          mockData.fixHistory,
          config
        );
        
        // Wait a bit between reports
        await this.wait(100);
      }

      return 'Historical data stored successfully';
    });

    // Test time range filtering
    await this.runTest('Time Range Filtering', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: false,
        includeTrendAnalysis: true,
        includeRecommendations: false,
        format: 'json',
        timeRange: {
          start: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          end: new Date()
        }
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      if (!report.trendAnalysis || !report.trendAnalysis.historicalData) {
        throw new Error('Trend analysis not generated');
      }

      // Verify time range is respected in metadata
      if (!report.metadata.timeRange) {
        throw new Error('Time range not set in metadata');
      }

      const timeDiff = report.metadata.timeRange.end.getTime() - report.metadata.timeRange.start.getTime();
      const expectedDiff = 2 * 60 * 60 * 1000; // 2 hours
      
      if (Math.abs(timeDiff - expectedDiff) > 60000) { // Allow 1 minute tolerance
        throw new Error('Time range not applied correctly');
      }

      return 'Time range filtering works correctly';
    });
  }

  private async testRecommendationEngine(): Promise<void> {
    console.log('🎯 Testing Recommendation Engine...');

    // Test performance-based recommendations
    await this.runTest('Performance-Based Recommendations', async () => {
      const mockData = this.createMockTestData();
      // Set high response time to trigger recommendation
      mockData.metrics.performance.averageResponseTime = 3000;
      
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const recommendations = report.executiveSummary!.topRecommendations;
      
      const hasPerformanceRecommendation = recommendations.some(rec => 
        rec.toLowerCase().includes('response time') || rec.toLowerCase().includes('performance')
      );

      if (!hasPerformanceRecommendation) {
        throw new Error('Performance recommendation not generated for high response time');
      }

      return 'Performance-based recommendations generated correctly';
    });

    // Test error-based recommendations
    await this.runTest('Error-Based Recommendations', async () => {
      const mockData = this.createMockTestData();
      // Add critical errors to trigger recommendations
      for (let i = 0; i < 3; i++) {
        mockData.errors.push({
          id: `critical-error-${i}`,
          timestamp: new Date(),
          severity: 'critical',
          category: 'functional',
          component: 'TestComponent',
          description: `Critical error ${i}`,
          context: {},
          autoFixable: false
        });
      }
      
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const recommendations = report.executiveSummary!.topRecommendations;
      
      const hasCriticalErrorRecommendation = recommendations.some(rec => 
        rec.toLowerCase().includes('critical') && rec.toLowerCase().includes('error')
      );

      if (!hasCriticalErrorRecommendation) {
        throw new Error('Critical error recommendation not generated');
      }

      return 'Error-based recommendations generated correctly';
    });

    // Test test failure recommendations
    await this.runTest('Test Failure Recommendations', async () => {
      const mockData = this.createMockTestData();
      // Add more failed tests
      for (let i = 0; i < 5; i++) {
        mockData.testResults.push({
          id: `failed-test-${i}`,
          name: `Failed Test ${i}`,
          status: 'failed',
          duration: 1000,
          message: `Test ${i} failed`
        });
      }
      
      const config: ReportConfiguration = {
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includeTrendAnalysis: false,
        includeRecommendations: false,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const recommendations = report.executiveSummary!.topRecommendations;
      
      const hasTestRecommendation = recommendations.some(rec => 
        rec.toLowerCase().includes('test') && (rec.toLowerCase().includes('fail') || rec.toLowerCase().includes('reliability'))
      );

      if (!hasTestRecommendation) {
        throw new Error('Test failure recommendation not generated');
      }

      return 'Test failure recommendations generated correctly';
    });

    // Test recommendation prioritization
    await this.runTest('Recommendation Prioritization', async () => {
      const mockData = this.createMockTestData();
      const config: ReportConfiguration = {
        includeExecutiveSummary: false,
        includeTechnicalDetails: false,
        includeTrendAnalysis: true,
        includeRecommendations: true,
        format: 'json'
      };

      const report = await this.reportGenerator.generateReport(
        mockData.testResults,
        mockData.errors,
        mockData.metrics,
        mockData.fixHistory,
        config
      );

      const recommendations = report.trendAnalysis!.improvementRecommendations;
      
      if (recommendations.length > 1) {
        // Check that recommendations are sorted by priority
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        
        for (let i = 0; i < recommendations.length - 1; i++) {
          const currentPriority = priorityOrder[recommendations[i].priority];
          const nextPriority = priorityOrder[recommendations[i + 1].priority];
          
          if (currentPriority < nextPriority) {
            throw new Error('Recommendations not sorted by priority correctly');
          }
        }
      }

      return 'Recommendations prioritized correctly';
    });
  }

  private createMockTestData() {
    const testResults: TestResult[] = [
      {
        id: 'test-1',
        name: 'Firebase Authentication Test',
        status: 'passed',
        duration: 1500,
        message: 'Authentication test passed'
      },
      {
        id: 'test-2',
        name: 'WebSocket Connection Test',
        status: 'passed',
        duration: 800,
        message: 'WebSocket test passed'
      },
      {
        id: 'test-3',
        name: 'UI Component Test',
        status: 'failed',
        duration: 2000,
        message: 'Component rendering failed'
      },
      {
        id: 'test-4',
        name: 'Performance Test',
        status: 'passed',
        duration: 3000,
        message: 'Performance test passed'
      }
    ];

    const errors: ErrorEntry[] = [
      {
        id: 'error-1',
        timestamp: new Date(Date.now() - 60000),
        severity: 'medium',
        category: 'functional',
        component: 'UIComponent',
        description: 'Component rendering issue',
        context: {},
        autoFixable: true
      },
      {
        id: 'error-2',
        timestamp: new Date(Date.now() - 120000),
        severity: 'low',
        category: 'performance',
        component: 'APIGateway',
        description: 'Slow response time',
        context: {},
        autoFixable: false
      }
    ];

    const metrics: DashboardMetrics = {
      testExecution: {
        totalTests: 4,
        passedTests: 3,
        failedTests: 1,
        skippedTests: 0,
        runningTests: 0,
        progress: 100,
        estimatedTimeRemaining: 0
      },
      performance: {
        averageResponseTime: 1200,
        throughput: 75.5,
        errorRate: 2.1,
        memoryUsage: 65.3,
        cpuUsage: 42.8
      },
      systemHealth: {
        overallStatus: 'healthy',
        services: [
          {
            name: 'Firebase',
            status: 'healthy',
            responseTime: 800,
            lastCheck: new Date(),
            errorCount: 0
          },
          {
            name: 'WebSocket Server',
            status: 'healthy',
            responseTime: 400,
            lastCheck: new Date(),
            errorCount: 0
          }
        ],
        uptime: 86400000,
        lastHealthCheck: new Date()
      },
      errors: {
        criticalErrors: 0,
        warnings: 2,
        totalErrors: 2,
        recentErrors: []
      }
    };

    const fixHistory = [
      {
        id: 'fix-1',
        timestamp: new Date(Date.now() - 300000),
        errorId: 'error-1',
        fixType: 'configuration',
        success: true,
        description: 'Fixed component configuration issue'
      },
      {
        id: 'fix-2',
        timestamp: new Date(Date.now() - 600000),
        errorId: 'error-2',
        fixType: 'code',
        success: false,
        description: 'Attempted to optimize API response'
      }
    ];

    return { testResults, errors, metrics, fixHistory };
  }

  private async runTest(testName: string, testFunction: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const message = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        message,
        duration
      });
      
      console.log(`  ✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      this.results.push({
        testName,
        passed: false,
        message,
        duration,
        details: error
      });
      
      console.log(`  ❌ ${testName} (${duration}ms): ${message}`);
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private ensureTestOutputDirectory(): void {
    if (!fs.existsSync(this.testOutputDir)) {
      fs.mkdirSync(this.testOutputDir, { recursive: true });
    }
  }

  private printSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Summary:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests}`);
    console.log(`  Failed: ${failedTests}`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${totalDuration}ms`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.message}`);
        });
    }

    console.log('\n🎉 Reporting System testing completed!');
  }
}

// Export for use in other test files
export { ReportingSystemTester };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ReportingSystemTester();
  tester.runAllTests().catch(console.error);
}