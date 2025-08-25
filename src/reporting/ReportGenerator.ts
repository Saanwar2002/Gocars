import { TestResult } from '../testing/core/TestResult';
import { ErrorEntry } from '../testing/core/ErrorAnalysisEngine';
import { DashboardMetrics } from '../monitoring/dashboard/MonitoringDashboard';
import fs from 'fs';
import path from 'path';

export interface ReportConfiguration {
    includeExecutiveSummary: boolean;
    includeTechnicalDetails: boolean;
    includeTrendAnalysis: boolean;
    includeRecommendations: boolean;
    format: 'json' | 'html' | 'pdf';
    outputPath?: string;
    timeRange?: {
        start: Date;
        end: Date;
    };
}

export interface ExecutiveSummary {
    overallHealthScore: number;
    systemStatus: 'healthy' | 'warning' | 'critical';
    totalTests: number;
    passRate: number;
    criticalIssues: number;
    performanceTrends: {
        responseTime: 'improving' | 'stable' | 'degrading';
        errorRate: 'improving' | 'stable' | 'degrading';
        throughput: 'improving' | 'stable' | 'degrading';
    };
    topRecommendations: string[];
    keyMetrics: {
        meanTimeToDetection: number;
        meanTimeToResolution: number;
        systemAvailability: number;
        userExperienceScore: number;
    };
}

export interface TechnicalReport {
    testResults: {
        summary: TestResultSummary;
        suiteResults: TestSuiteResult[];
        failedTests: TestResult[];
    };
    errorAnalysis: {
        totalErrors: number;
        errorsByCategory: Record<string, number>;
        errorsBySeverity: Record<string, number>;
        topErrors: ErrorEntry[];
        errorTrends: ErrorTrend[];
    };
    performanceMetrics: {
        current: PerformanceSnapshot;
        trends: PerformanceTrend[];
        benchmarks: PerformanceBenchmark[];
    };
    fixApplicationHistory: {
        totalFixes: number;
        successRate: number;
        fixesByType: Record<string, number>;
        recentFixes: FixApplicationRecord[];
    };
}

export interface TrendAnalysis {
    historicalData: {
        testPassRates: DataPoint[];
        performanceMetrics: DataPoint[];
        errorRates: DataPoint[];
        systemHealth: DataPoint[];
    };
    regressionDetection: {
        detectedRegressions: RegressionAlert[];
        qualityTrends: QualityTrend[];
    };
    qualityMetrics: {
        codeCoverage: DataPoint[];
        featureCompleteness: DataPoint[];
        securityVulnerabilities: DataPoint[];
        accessibilityCompliance: DataPoint[];
    };
    improvementRecommendations: RecommendationItem[];
}

export interface TestResultSummary {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    passRate: number;
    averageDuration: number;
    totalDuration: number;
}

export interface TestSuiteResult {
    suiteName: string;
    status: 'passed' | 'failed' | 'partial';
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    duration: number;
    coverage?: number;
}

export interface ErrorTrend {
    timestamp: Date;
    errorCount: number;
    severity: string;
    category: string;
}

export interface PerformanceSnapshot {
    timestamp: Date;
    responseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
}

export interface PerformanceTrend {
    metric: string;
    dataPoints: DataPoint[];
    trend: 'improving' | 'stable' | 'degrading';
    changePercentage: number;
}

export interface PerformanceBenchmark {
    metric: string;
    currentValue: number;
    benchmarkValue: number;
    status: 'above' | 'at' | 'below';
    deviation: number;
}

export interface FixApplicationRecord {
    id: string;
    timestamp: Date;
    errorId: string;
    fixType: string;
    success: boolean;
    description: string;
    validationResults?: string[];
}

export interface DataPoint {
    timestamp: Date;
    value: number;
    label?: string;
}

export interface RegressionAlert {
    id: string;
    timestamp: Date;
    metric: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    impactAssessment: string;
    recommendedActions: string[];
}

export interface QualityTrend {
    metric: string;
    currentValue: number;
    previousValue: number;
    trend: 'improving' | 'stable' | 'degrading';
    changePercentage: number;
}

export interface RecommendationItem {
    id: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'performance' | 'reliability' | 'security' | 'usability';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    actionItems: string[];
}

export interface ComprehensiveReport {
    metadata: {
        generatedAt: Date;
        reportId: string;
        version: string;
        timeRange: {
            start: Date;
            end: Date;
        };
        configuration: ReportConfiguration;
    };
    executiveSummary?: ExecutiveSummary;
    technicalReport?: TechnicalReport;
    trendAnalysis?: TrendAnalysis;
}

export class ReportGenerator {
    private historicalData: Map<string, DataPoint[]> = new Map();
    private benchmarks: Map<string, number> = new Map();

    constructor() {
        this.initializeBenchmarks();
    }

    private initializeBenchmarks(): void {
        // Set default performance benchmarks
        this.benchmarks.set('responseTime', 1000); // 1 second
        this.benchmarks.set('throughput', 100); // 100 req/s
        this.benchmarks.set('errorRate', 1); // 1%
        this.benchmarks.set('memoryUsage', 80); // 80%
        this.benchmarks.set('cpuUsage', 70); // 70%
        this.benchmarks.set('passRate', 95); // 95%
        this.benchmarks.set('availability', 99.9); // 99.9%
    }

    public async generateReport(
        testResults: TestResult[],
        errors: ErrorEntry[],
        metrics: DashboardMetrics,
        fixHistory: FixApplicationRecord[],
        config: ReportConfiguration
    ): Promise<ComprehensiveReport> {
        const reportId = this.generateReportId();
        const timeRange = config.timeRange || {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            end: new Date()
        };

        const report: ComprehensiveReport = {
            metadata: {
                generatedAt: new Date(),
                reportId,
                version: '1.0.0',
                timeRange,
                configuration: config
            }
        };

        if (config.includeExecutiveSummary) {
            report.executiveSummary = await this.generateExecutiveSummary(
                testResults,
                errors,
                metrics,
                fixHistory
            );
        }

        if (config.includeTechnicalDetails) {
            report.technicalReport = await this.generateTechnicalReport(
                testResults,
                errors,
                metrics,
                fixHistory
            );
        }

        if (config.includeTrendAnalysis) {
            report.trendAnalysis = await this.generateTrendAnalysis(
                testResults,
                errors,
                metrics,
                timeRange
            );
        }

        // Store historical data for future trend analysis
        this.storeHistoricalData(testResults, metrics);

        return report;
    }

    private async generateExecutiveSummary(
        testResults: TestResult[],
        errors: ErrorEntry[],
        metrics: DashboardMetrics,
        fixHistory: FixApplicationRecord[]
    ): Promise<ExecutiveSummary> {
        const totalTests = testResults.length;
        const passedTests = testResults.filter(t => t.status === 'passed').length;
        const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        const criticalErrors = errors.filter(e => e.severity === 'critical').length;

        // Calculate overall health score (0-100)
        const healthScore = this.calculateHealthScore(passRate, metrics, criticalErrors);

        // Determine system status
        const systemStatus = this.determineSystemStatus(healthScore, criticalErrors);

        // Analyze performance trends
        const performanceTrends = this.analyzePerformanceTrends(metrics);

        // Generate top recommendations
        const topRecommendations = this.generateTopRecommendations(
            testResults,
            errors,
            metrics,
            fixHistory
        );

        // Calculate key metrics
        const keyMetrics = this.calculateKeyMetrics(errors, fixHistory, metrics);

        return {
            overallHealthScore: healthScore,
            systemStatus,
            totalTests,
            passRate,
            criticalIssues: criticalErrors,
            performanceTrends,
            topRecommendations,
            keyMetrics
        };
    }

    private async generateTechnicalReport(
        testResults: TestResult[],
        errors: ErrorEntry[],
        metrics: DashboardMetrics,
        fixHistory: FixApplicationRecord[]
    ): Promise<TechnicalReport> {
        // Test results analysis
        const testResultSummary = this.analyzeTestResults(testResults);
        const suiteResults = this.analyzeSuiteResults(testResults);
        const failedTests = testResults.filter(t => t.status === 'failed');

        // Error analysis
        const errorAnalysis = this.analyzeErrors(errors);

        // Performance metrics analysis
        const performanceMetrics = this.analyzePerformanceMetrics(metrics);

        // Fix application history
        const fixApplicationHistory = this.analyzeFixHistory(fixHistory);

        return {
            testResults: {
                summary: testResultSummary,
                suiteResults,
                failedTests
            },
            errorAnalysis,
            performanceMetrics,
            fixApplicationHistory
        };
    }

    private async generateTrendAnalysis(
        testResults: TestResult[],
        errors: ErrorEntry[],
        metrics: DashboardMetrics,
        timeRange: { start: Date; end: Date }
    ): Promise<TrendAnalysis> {
        // Get historical data
        const historicalData = this.getHistoricalData(timeRange);

        // Detect regressions
        const regressionDetection = this.detectRegressions(historicalData);

        // Analyze quality metrics
        const qualityMetrics = this.analyzeQualityMetrics(historicalData);

        // Generate improvement recommendations
        const improvementRecommendations = this.generateImprovementRecommendations(
            testResults,
            errors,
            metrics,
            historicalData
        );

        return {
            historicalData,
            regressionDetection,
            qualityMetrics,
            improvementRecommendations
        };
    }

    private calculateHealthScore(
        passRate: number,
        metrics: DashboardMetrics,
        criticalErrors: number
    ): number {
        let score = 100;

        // Deduct points for test failures
        score -= (100 - passRate) * 0.4;

        // Deduct points for performance issues
        if (metrics.performance.errorRate > 5) {
            score -= (metrics.performance.errorRate - 5) * 2;
        }

        if (metrics.performance.averageResponseTime > 2000) {
            score -= ((metrics.performance.averageResponseTime - 2000) / 1000) * 5;
        }

        // Deduct points for critical errors
        score -= criticalErrors * 10;

        // Deduct points for system health issues
        if (metrics.systemHealth.overallStatus === 'warning') {
            score -= 15;
        } else if (metrics.systemHealth.overallStatus === 'critical') {
            score -= 30;
        }

        return Math.max(0, Math.min(100, score));
    }

    private determineSystemStatus(
        healthScore: number,
        criticalErrors: number
    ): 'healthy' | 'warning' | 'critical' {
        if (criticalErrors > 0 || healthScore < 60) {
            return 'critical';
        } else if (healthScore < 80) {
            return 'warning';
        } else {
            return 'healthy';
        }
    }

    private analyzePerformanceTrends(metrics: DashboardMetrics): ExecutiveSummary['performanceTrends'] {
        // This would typically compare with historical data
        // For now, we'll use simplified logic
        return {
            responseTime: metrics.performance.averageResponseTime < 1500 ? 'stable' : 'degrading',
            errorRate: metrics.performance.errorRate < 2 ? 'stable' : 'degrading',
            throughput: metrics.performance.throughput > 50 ? 'stable' : 'degrading'
        };
    }

    private generateTopRecommendations(
        testResults: TestResult[],
        errors: ErrorEntry[],
        metrics: DashboardMetrics,
        fixHistory: FixApplicationRecord[]
    ): string[] {
        const recommendations: string[] = [];

        // Test-based recommendations
        const failedTests = testResults.filter(t => t.status === 'failed');
        if (failedTests.length > 0) {
            recommendations.push(`Address ${failedTests.length} failing tests to improve system reliability`);
        }

        // Performance-based recommendations
        if (metrics.performance.averageResponseTime > 2000) {
            recommendations.push('Optimize response times - current average exceeds 2 seconds');
        }

        if (metrics.performance.errorRate > 5) {
            recommendations.push('Investigate high error rate - currently above 5% threshold');
        }

        // Error-based recommendations
        const criticalErrors = errors.filter(e => e.severity === 'critical');
        if (criticalErrors.length > 0) {
            recommendations.push(`Resolve ${criticalErrors.length} critical errors immediately`);
        }

        // System health recommendations
        const downServices = metrics.systemHealth.services.filter(s => s.status === 'down');
        if (downServices.length > 0) {
            recommendations.push(`Restore ${downServices.length} down services: ${downServices.map(s => s.name).join(', ')}`);
        }

        return recommendations.slice(0, 5); // Return top 5 recommendations
    }

    private calculateKeyMetrics(
        errors: ErrorEntry[],
        fixHistory: FixApplicationRecord[],
        metrics: DashboardMetrics
    ): ExecutiveSummary['keyMetrics'] {
        // Calculate MTTD (Mean Time To Detection)
        const detectionTimes = errors.map(e => {
            // Simplified calculation - in reality, this would be based on when the issue occurred vs when it was detected
            return Math.random() * 3600000; // Random value between 0-1 hour for demo
        });
        const meanTimeToDetection = detectionTimes.length > 0
            ? detectionTimes.reduce((a, b) => a + b, 0) / detectionTimes.length
            : 0;

        // Calculate MTTR (Mean Time To Resolution)
        const resolutionTimes = fixHistory
            .filter(f => f.success)
            .map(f => Math.random() * 7200000); // Random value between 0-2 hours for demo
        const meanTimeToResolution = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0;

        // Calculate system availability (simplified)
        const uptime = metrics.systemHealth.uptime;
        const totalTime = uptime + (errors.filter(e => e.severity === 'critical').length * 300000); // Assume 5 min downtime per critical error
        const systemAvailability = totalTime > 0 ? (uptime / totalTime) * 100 : 100;

        // Calculate user experience score (simplified)
        const responseTimeScore = Math.max(0, 100 - (metrics.performance.averageResponseTime / 50));
        const errorRateScore = Math.max(0, 100 - (metrics.performance.errorRate * 10));
        const userExperienceScore = (responseTimeScore + errorRateScore) / 2;

        return {
            meanTimeToDetection,
            meanTimeToResolution,
            systemAvailability,
            userExperienceScore
        };
    }

    private analyzeTestResults(testResults: TestResult[]): TestResultSummary {
        const totalTests = testResults.length;
        const passedTests = testResults.filter(t => t.status === 'passed').length;
        const failedTests = testResults.filter(t => t.status === 'failed').length;
        const skippedTests = testResults.filter(t => t.status === 'skipped').length;
        const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        const durations = testResults.map(t => t.duration);
        const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        const totalDuration = durations.reduce((a, b) => a + b, 0);

        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            passRate,
            averageDuration,
            totalDuration
        };
    }

    private analyzeSuiteResults(testResults: TestResult[]): TestSuiteResult[] {
        const suiteMap = new Map<string, TestResult[]>();

        // Group tests by suite (assuming suite name is in test name or details)
        testResults.forEach(test => {
            const suiteName = this.extractSuiteName(test);
            if (!suiteMap.has(suiteName)) {
                suiteMap.set(suiteName, []);
            }
            suiteMap.get(suiteName)!.push(test);
        });

        return Array.from(suiteMap.entries()).map(([suiteName, tests]) => {
            const testsRun = tests.length;
            const testsPassed = tests.filter(t => t.status === 'passed').length;
            const testsFailed = tests.filter(t => t.status === 'failed').length;
            const duration = tests.reduce((sum, t) => sum + t.duration, 0);

            let status: 'passed' | 'failed' | 'partial';
            if (testsFailed === 0) {
                status = 'passed';
            } else if (testsPassed === 0) {
                status = 'failed';
            } else {
                status = 'partial';
            }

            return {
                suiteName,
                status,
                testsRun,
                testsPassed,
                testsFailed,
                duration
            };
        });
    }

    private extractSuiteName(test: TestResult): string {
        // Extract suite name from test name or use a default
        const parts = test.name.split(' - ');
        return parts.length > 1 ? parts[0] : 'Default Suite';
    }

    private analyzeErrors(errors: ErrorEntry[]): TechnicalReport['errorAnalysis'] {
        const totalErrors = errors.length;

        // Group by category
        const errorsByCategory: Record<string, number> = {};
        errors.forEach(error => {
            errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
        });

        // Group by severity
        const errorsBySeverity: Record<string, number> = {};
        errors.forEach(error => {
            errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
        });

        // Get top errors (most frequent)
        const errorCounts = new Map<string, { error: ErrorEntry; count: number }>();
        errors.forEach(error => {
            const key = `${error.component}-${error.description}`;
            if (errorCounts.has(key)) {
                errorCounts.get(key)!.count++;
            } else {
                errorCounts.set(key, { error, count: 1 });
            }
        });

        const topErrors = Array.from(errorCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(item => item.error);

        // Generate error trends (simplified)
        const errorTrends: ErrorTrend[] = this.generateErrorTrends(errors);

        return {
            totalErrors,
            errorsByCategory,
            errorsBySeverity,
            topErrors,
            errorTrends
        };
    }

    private generateErrorTrends(errors: ErrorEntry[]): ErrorTrend[] {
        // Group errors by hour for the last 24 hours
        const trends: ErrorTrend[] = [];
        const now = new Date();

        for (let i = 23; i >= 0; i--) {
            const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

            const hourErrors = errors.filter(e =>
                e.timestamp >= hourStart && e.timestamp < hourEnd
            );

            if (hourErrors.length > 0) {
                // Group by severity and category
                const severityGroups = new Map<string, number>();
                const categoryGroups = new Map<string, number>();

                hourErrors.forEach(error => {
                    severityGroups.set(error.severity, (severityGroups.get(error.severity) || 0) + 1);
                    categoryGroups.set(error.category, (categoryGroups.get(error.category) || 0) + 1);
                });

                // Create trend entries for each severity/category combination
                severityGroups.forEach((count, severity) => {
                    categoryGroups.forEach((catCount, category) => {
                        trends.push({
                            timestamp: hourStart,
                            errorCount: Math.floor(count * catCount / hourErrors.length),
                            severity,
                            category
                        });
                    });
                });
            }
        }

        return trends;
    }

    private analyzePerformanceMetrics(metrics: DashboardMetrics): TechnicalReport['performanceMetrics'] {
        const current: PerformanceSnapshot = {
            timestamp: new Date(),
            responseTime: metrics.performance.averageResponseTime,
            throughput: metrics.performance.throughput,
            errorRate: metrics.performance.errorRate,
            memoryUsage: metrics.performance.memoryUsage,
            cpuUsage: metrics.performance.cpuUsage
        };

        // Generate performance trends (simplified - would use historical data in reality)
        const trends: PerformanceTrend[] = [
            {
                metric: 'responseTime',
                dataPoints: this.generateTrendDataPoints('responseTime', current.responseTime),
                trend: 'stable',
                changePercentage: 0
            },
            {
                metric: 'throughput',
                dataPoints: this.generateTrendDataPoints('throughput', current.throughput),
                trend: 'stable',
                changePercentage: 0
            },
            {
                metric: 'errorRate',
                dataPoints: this.generateTrendDataPoints('errorRate', current.errorRate),
                trend: 'stable',
                changePercentage: 0
            }
        ];

        // Generate benchmarks
        const benchmarks: PerformanceBenchmark[] = [
            {
                metric: 'responseTime',
                currentValue: current.responseTime,
                benchmarkValue: this.benchmarks.get('responseTime') || 1000,
                status: current.responseTime <= (this.benchmarks.get('responseTime') || 1000) ? 'at' : 'above',
                deviation: current.responseTime - (this.benchmarks.get('responseTime') || 1000)
            },
            {
                metric: 'throughput',
                currentValue: current.throughput,
                benchmarkValue: this.benchmarks.get('throughput') || 100,
                status: current.throughput >= (this.benchmarks.get('throughput') || 100) ? 'at' : 'below',
                deviation: current.throughput - (this.benchmarks.get('throughput') || 100)
            },
            {
                metric: 'errorRate',
                currentValue: current.errorRate,
                benchmarkValue: this.benchmarks.get('errorRate') || 1,
                status: current.errorRate <= (this.benchmarks.get('errorRate') || 1) ? 'at' : 'above',
                deviation: current.errorRate - (this.benchmarks.get('errorRate') || 1)
            }
        ];

        return {
            current,
            trends,
            benchmarks
        };
    }

    private generateTrendDataPoints(metric: string, currentValue: number): DataPoint[] {
        const points: DataPoint[] = [];
        const now = new Date();

        // Generate 24 hours of data points
        for (let i = 23; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            // Add some variation to the current value
            const variation = (Math.random() - 0.5) * 0.2 * currentValue;
            const value = Math.max(0, currentValue + variation);

            points.push({
                timestamp,
                value,
                label: `${metric} at ${timestamp.getHours()}:00`
            });
        }

        return points;
    }

    private analyzeFixHistory(fixHistory: FixApplicationRecord[]): TechnicalReport['fixApplicationHistory'] {
        const totalFixes = fixHistory.length;
        const successfulFixes = fixHistory.filter(f => f.success).length;
        const successRate = totalFixes > 0 ? (successfulFixes / totalFixes) * 100 : 0;

        // Group by fix type
        const fixesByType: Record<string, number> = {};
        fixHistory.forEach(fix => {
            fixesByType[fix.fixType] = (fixesByType[fix.fixType] || 0) + 1;
        });

        // Get recent fixes (last 10)
        const recentFixes = fixHistory
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);

        return {
            totalFixes,
            successRate,
            fixesByType,
            recentFixes
        };
    }

    private getHistoricalData(timeRange: { start: Date; end: Date }): TrendAnalysis['historicalData'] {
        // In a real implementation, this would fetch from a database
        // For now, we'll generate mock historical data
        return {
            testPassRates: this.generateHistoricalDataPoints('passRate', 95, timeRange),
            performanceMetrics: this.generateHistoricalDataPoints('responseTime', 1200, timeRange),
            errorRates: this.generateHistoricalDataPoints('errorRate', 2.5, timeRange),
            systemHealth: this.generateHistoricalDataPoints('healthScore', 85, timeRange)
        };
    }

    private generateHistoricalDataPoints(
        metric: string,
        baseValue: number,
        timeRange: { start: Date; end: Date }
    ): DataPoint[] {
        const points: DataPoint[] = [];
        const duration = timeRange.end.getTime() - timeRange.start.getTime();
        const intervalMs = duration / 100; // 100 data points

        for (let i = 0; i < 100; i++) {
            const timestamp = new Date(timeRange.start.getTime() + i * intervalMs);
            const variation = (Math.random() - 0.5) * 0.3 * baseValue;
            const value = Math.max(0, baseValue + variation);

            points.push({
                timestamp,
                value,
                label: `${metric} at ${timestamp.toISOString()}`
            });
        }

        return points;
    }

    private detectRegressions(historicalData: TrendAnalysis['historicalData']): TrendAnalysis['regressionDetection'] {
        const detectedRegressions: RegressionAlert[] = [];
        const qualityTrends: QualityTrend[] = [];

        // Analyze each metric for regressions
        Object.entries(historicalData).forEach(([metricName, dataPoints]) => {
            if (dataPoints.length < 2) return;

            const recent = dataPoints.slice(-10); // Last 10 data points
            const previous = dataPoints.slice(-20, -10); // Previous 10 data points

            const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
            const previousAvg = previous.reduce((sum, p) => sum + p.value, 0) / previous.length;

            const changePercentage = ((recentAvg - previousAvg) / previousAvg) * 100;

            // Determine trend
            let trend: 'improving' | 'stable' | 'degrading';
            if (Math.abs(changePercentage) < 5) {
                trend = 'stable';
            } else if (metricName === 'testPassRates' || metricName === 'systemHealth') {
                trend = changePercentage > 0 ? 'improving' : 'degrading';
            } else {
                trend = changePercentage < 0 ? 'improving' : 'degrading';
            }

            qualityTrends.push({
                metric: metricName,
                currentValue: recentAvg,
                previousValue: previousAvg,
                trend,
                changePercentage
            });

            // Check for significant regressions
            if (trend === 'degrading' && Math.abs(changePercentage) > 15) {
                detectedRegressions.push({
                    id: `regression-${metricName}-${Date.now()}`,
                    timestamp: new Date(),
                    metric: metricName,
                    severity: Math.abs(changePercentage) > 30 ? 'high' : 'medium',
                    description: `${metricName} has degraded by ${Math.abs(changePercentage).toFixed(1)}%`,
                    impactAssessment: `This regression may impact system ${metricName === 'testPassRates' ? 'reliability' : 'performance'}`,
                    recommendedActions: [
                        `Investigate recent changes affecting ${metricName}`,
                        'Review deployment logs for potential causes',
                        'Consider rolling back recent changes if necessary'
                    ]
                });
            }
        });

        return {
            detectedRegressions,
            qualityTrends
        };
    }

    private analyzeQualityMetrics(historicalData: TrendAnalysis['historicalData']): TrendAnalysis['qualityMetrics'] {
        // Generate mock quality metrics data
        const timeRange = {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            end: new Date()
        };

        return {
            codeCoverage: this.generateHistoricalDataPoints('codeCoverage', 78, timeRange),
            featureCompleteness: this.generateHistoricalDataPoints('featureCompleteness', 92, timeRange),
            securityVulnerabilities: this.generateHistoricalDataPoints('securityVulnerabilities', 3, timeRange),
            accessibilityCompliance: this.generateHistoricalDataPoints('accessibilityCompliance', 88, timeRange)
        };
    }

    private generateImprovementRecommendations(
        testResults: TestResult[],
        errors: ErrorEntry[],
        metrics: DashboardMetrics,
        historicalData: TrendAnalysis['historicalData']
    ): RecommendationItem[] {
        const recommendations: RecommendationItem[] = [];

        // Test-based recommendations
        const failureRate = testResults.length > 0
            ? (testResults.filter(t => t.status === 'failed').length / testResults.length) * 100
            : 0;

        if (failureRate > 10) {
            recommendations.push({
                id: 'improve-test-reliability',
                priority: 'high',
                category: 'reliability',
                title: 'Improve Test Reliability',
                description: `Current test failure rate is ${failureRate.toFixed(1)}%, which is above the recommended 5% threshold.`,
                impact: 'Reducing test failures will improve system reliability and developer confidence',
                effort: 'medium',
                actionItems: [
                    'Analyze most frequently failing tests',
                    'Improve test data management and cleanup',
                    'Review test environment stability',
                    'Implement better error handling in tests'
                ]
            });
        }

        // Performance-based recommendations
        if (metrics.performance.averageResponseTime > 2000) {
            recommendations.push({
                id: 'optimize-performance',
                priority: 'high',
                category: 'performance',
                title: 'Optimize System Performance',
                description: `Average response time of ${metrics.performance.averageResponseTime}ms exceeds the 2-second threshold.`,
                impact: 'Improved response times will enhance user experience and system efficiency',
                effort: 'high',
                actionItems: [
                    'Profile application performance bottlenecks',
                    'Optimize database queries and indexing',
                    'Implement caching strategies',
                    'Review and optimize API endpoints'
                ]
            });
        }

        // Error-based recommendations
        const criticalErrors = errors.filter(e => e.severity === 'critical').length;
        if (criticalErrors > 0) {
            recommendations.push({
                id: 'resolve-critical-errors',
                priority: 'critical',
                category: 'reliability',
                title: 'Resolve Critical Errors',
                description: `${criticalErrors} critical errors detected that require immediate attention.`,
                impact: 'Resolving critical errors will prevent system outages and data loss',
                effort: 'high',
                actionItems: [
                    'Prioritize critical error resolution',
                    'Implement monitoring for early detection',
                    'Review error handling and recovery procedures',
                    'Establish incident response protocols'
                ]
            });
        }

        // Security recommendations
        const securityErrors = errors.filter(e => e.category === 'security').length;
        if (securityErrors > 0) {
            recommendations.push({
                id: 'enhance-security',
                priority: 'high',
                category: 'security',
                title: 'Enhance Security Measures',
                description: `${securityErrors} security-related issues identified that need attention.`,
                impact: 'Addressing security issues will protect user data and system integrity',
                effort: 'medium',
                actionItems: [
                    'Conduct security audit and penetration testing',
                    'Implement additional input validation',
                    'Review authentication and authorization mechanisms',
                    'Update security policies and procedures'
                ]
            });
        }

        // Usability recommendations
        const usabilityErrors = errors.filter(e => e.category === 'usability').length;
        if (usabilityErrors > 5) {
            recommendations.push({
                id: 'improve-usability',
                priority: 'medium',
                category: 'usability',
                title: 'Improve User Experience',
                description: `${usabilityErrors} usability issues detected that may impact user satisfaction.`,
                impact: 'Better usability will increase user engagement and satisfaction',
                effort: 'medium',
                actionItems: [
                    'Conduct user experience testing',
                    'Review and improve UI/UX design',
                    'Implement accessibility improvements',
                    'Gather and analyze user feedback'
                ]
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    private storeHistoricalData(testResults: TestResult[], metrics: DashboardMetrics): void {
        const timestamp = new Date();

        // Store test pass rate
        const passRate = testResults.length > 0
            ? (testResults.filter(t => t.status === 'passed').length / testResults.length) * 100
            : 0;
        this.addHistoricalDataPoint('testPassRates', { timestamp, value: passRate });

        // Store performance metrics
        this.addHistoricalDataPoint('responseTime', {
            timestamp,
            value: metrics.performance.averageResponseTime
        });
        this.addHistoricalDataPoint('errorRate', {
            timestamp,
            value: metrics.performance.errorRate
        });
        this.addHistoricalDataPoint('throughput', {
            timestamp,
            value: metrics.performance.throughput
        });

        // Store system health score (simplified calculation)
        const healthScore = this.calculateHealthScore(passRate, metrics, 0);
        this.addHistoricalDataPoint('systemHealth', { timestamp, value: healthScore });
    }

    private addHistoricalDataPoint(metric: string, dataPoint: DataPoint): void {
        if (!this.historicalData.has(metric)) {
            this.historicalData.set(metric, []);
        }

        const data = this.historicalData.get(metric)!;
        data.push(dataPoint);

        // Keep only the last 1000 data points
        if (data.length > 1000) {
            data.splice(0, data.length - 1000);
        }
    }

    private generateReportId(): string {
        return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    public async exportReport(
        report: ComprehensiveReport,
        format: 'json' | 'html' | 'pdf',
        outputPath?: string
    ): Promise<string> {
        const fileName = `${report.metadata.reportId}.${format}`;
        const filePath = outputPath ? path.join(outputPath, fileName) : fileName;

        switch (format) {
            case 'json':
                return this.exportToJSON(report, filePath);
            case 'html':
                return this.exportToHTML(report, filePath);
            case 'pdf':
                return this.exportToPDF(report, filePath);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    private async exportToJSON(report: ComprehensiveReport, filePath: string): Promise<string> {
        const jsonContent = JSON.stringify(report, null, 2);
        fs.writeFileSync(filePath, jsonContent, 'utf8');
        return filePath;
    }

    private async exportToHTML(report: ComprehensiveReport, filePath: string): Promise<string> {
        const htmlContent = this.generateHTMLReport(report);
        fs.writeFileSync(filePath, htmlContent, 'utf8');
        return filePath;
    }

    private async exportToPDF(report: ComprehensiveReport, filePath: string): Promise<string> {
        // For PDF generation, we would typically use a library like puppeteer or jsPDF
        // For now, we'll create an HTML version and note that PDF conversion is needed
        const htmlContent = this.generateHTMLReport(report);
        const htmlPath = filePath.replace('.pdf', '.html');
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');

        // Note: In a real implementation, you would convert HTML to PDF here
        console.log(`PDF generation not implemented. HTML version saved to: ${htmlPath}`);
        return htmlPath;
    }

    private generateHTMLReport(report: ComprehensiveReport): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Testing Report - ${report.metadata.reportId}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .section { background: white; margin-bottom: 30px; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #6c757d; font-size: 0.9em; }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .recommendation { padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; background: #f8f9fa; }
        .recommendation.critical { border-color: #dc3545; }
        .recommendation.high { border-color: #fd7e14; }
        .recommendation.medium { border-color: #ffc107; }
        .recommendation.low { border-color: #6c757d; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .error-critical { color: #dc3545; font-weight: bold; }
        .error-high { color: #fd7e14; font-weight: bold; }
        .error-medium { color: #ffc107; }
        .error-low { color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Comprehensive Testing Report</h1>
            <p><strong>Report ID:</strong> ${report.metadata.reportId}</p>
            <p><strong>Generated:</strong> ${report.metadata.generatedAt.toLocaleString()}</p>
            <p><strong>Time Range:</strong> ${report.metadata.timeRange.start.toLocaleString()} - ${report.metadata.timeRange.end.toLocaleString()}</p>
        </div>

        ${report.executiveSummary ? this.generateExecutiveSummaryHTML(report.executiveSummary) : ''}
        ${report.technicalReport ? this.generateTechnicalReportHTML(report.technicalReport) : ''}
        ${report.trendAnalysis ? this.generateTrendAnalysisHTML(report.trendAnalysis) : ''}
    </div>
</body>
</html>`;
    }

    private generateExecutiveSummaryHTML(summary: ExecutiveSummary): string {
        return `
        <div class="section">
            <h2>📊 Executive Summary</h2>
            
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value status-${summary.systemStatus}">${summary.overallHealthScore.toFixed(1)}</div>
                    <div class="metric-label">Overall Health Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-${summary.passRate > 90 ? 'healthy' : summary.passRate > 70 ? 'warning' : 'critical'}">${summary.passRate.toFixed(1)}%</div>
                    <div class="metric-label">Pass Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-${summary.criticalIssues === 0 ? 'healthy' : 'critical'}">${summary.criticalIssues}</div>
                    <div class="metric-label">Critical Issues</div>
                </div>
            </div>

            <h3>🎯 Top Recommendations</h3>
            ${summary.topRecommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}

            <h3>📈 Performance Trends</h3>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value status-${summary.performanceTrends.responseTime === 'improving' ? 'healthy' : summary.performanceTrends.responseTime === 'stable' ? 'warning' : 'critical'}">${summary.performanceTrends.responseTime}</div>
                    <div class="metric-label">Response Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-${summary.performanceTrends.errorRate === 'improving' ? 'healthy' : summary.performanceTrends.errorRate === 'stable' ? 'warning' : 'critical'}">${summary.performanceTrends.errorRate}</div>
                    <div class="metric-label">Error Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-${summary.performanceTrends.throughput === 'improving' ? 'healthy' : summary.performanceTrends.throughput === 'stable' ? 'warning' : 'critical'}">${summary.performanceTrends.throughput}</div>
                    <div class="metric-label">Throughput</div>
                </div>
            </div>

            <h3>🔑 Key Metrics</h3>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${(summary.keyMetrics.meanTimeToDetection / 60000).toFixed(1)}m</div>
                    <div class="metric-label">Mean Time to Detection</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(summary.keyMetrics.meanTimeToResolution / 60000).toFixed(1)}m</div>
                    <div class="metric-label">Mean Time to Resolution</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.keyMetrics.systemAvailability.toFixed(2)}%</div>
                    <div class="metric-label">System Availability</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.keyMetrics.userExperienceScore.toFixed(1)}</div>
                    <div class="metric-label">User Experience Score</div>
                </div>
            </div>
        </div>`;
    }

    private generateTechnicalReportHTML(technical: TechnicalReport): string {
        return `
        <div class="section">
            <h2>🔧 Technical Report</h2>
            
            <h3>Test Results Summary</h3>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${technical.testResults.summary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-healthy">${technical.testResults.summary.passedTests}</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-critical">${technical.testResults.summary.failedTests}</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(technical.testResults.summary.totalDuration / 1000).toFixed(1)}s</div>
                    <div class="metric-label">Total Duration</div>
                </div>
            </div>

            <h3>Test Suite Results</h3>
            <table>
                <thead>
                    <tr>
                        <th>Suite Name</th>
                        <th>Status</th>
                        <th>Tests Run</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${technical.testResults.suiteResults.map(suite => `
                        <tr>
                            <td>${suite.suiteName}</td>
                            <td class="status-${suite.status === 'passed' ? 'healthy' : suite.status === 'failed' ? 'critical' : 'warning'}">${suite.status}</td>
                            <td>${suite.testsRun}</td>
                            <td>${suite.testsPassed}</td>
                            <td>${suite.testsFailed}</td>
                            <td>${(suite.duration / 1000).toFixed(1)}s</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3>Error Analysis</h3>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${technical.errorAnalysis.totalErrors}</div>
                    <div class="metric-label">Total Errors</div>
                </div>
                ${Object.entries(technical.errorAnalysis.errorsBySeverity).map(([severity, count]) => `
                    <div class="metric-card">
                        <div class="metric-value error-${severity}">${count}</div>
                        <div class="metric-label">${severity.charAt(0).toUpperCase() + severity.slice(1)} Errors</div>
                    </div>
                `).join('')}
            </div>

            <h3>Top Errors</h3>
            <table>
                <thead>
                    <tr>
                        <th>Severity</th>
                        <th>Component</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${technical.errorAnalysis.topErrors.slice(0, 10).map(error => `
                        <tr>
                            <td class="error-${error.severity}">${error.severity}</td>
                            <td>${error.component}</td>
                            <td>${error.description}</td>
                            <td>${error.category}</td>
                            <td>${error.timestamp.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3>Performance Benchmarks</h3>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Current Value</th>
                        <th>Benchmark</th>
                        <th>Status</th>
                        <th>Deviation</th>
                    </tr>
                </thead>
                <tbody>
                    ${technical.performanceMetrics.benchmarks.map(benchmark => `
                        <tr>
                            <td>${benchmark.metric}</td>
                            <td>${benchmark.currentValue.toFixed(2)}</td>
                            <td>${benchmark.benchmarkValue.toFixed(2)}</td>
                            <td class="status-${benchmark.status === 'at' ? 'healthy' : 'warning'}">${benchmark.status}</td>
                            <td>${benchmark.deviation > 0 ? '+' : ''}${benchmark.deviation.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3>Fix Application History</h3>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${technical.fixApplicationHistory.totalFixes}</div>
                    <div class="metric-label">Total Fixes Applied</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-${technical.fixApplicationHistory.successRate > 80 ? 'healthy' : 'warning'}">${technical.fixApplicationHistory.successRate.toFixed(1)}%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
            </div>
        </div>`;
    }

    private generateTrendAnalysisHTML(trends: TrendAnalysis): string {
        return `
        <div class="section">
            <h2>📈 Trend Analysis</h2>
            
            <h3>Quality Trends</h3>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Current Value</th>
                        <th>Previous Value</th>
                        <th>Trend</th>
                        <th>Change %</th>
                    </tr>
                </thead>
                <tbody>
                    ${trends.regressionDetection.qualityTrends.map(trend => `
                        <tr>
                            <td>${trend.metric}</td>
                            <td>${trend.currentValue.toFixed(2)}</td>
                            <td>${trend.previousValue.toFixed(2)}</td>
                            <td class="status-${trend.trend === 'improving' ? 'healthy' : trend.trend === 'stable' ? 'warning' : 'critical'}">${trend.trend}</td>
                            <td>${trend.changePercentage > 0 ? '+' : ''}${trend.changePercentage.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            ${trends.regressionDetection.detectedRegressions.length > 0 ? `
                <h3>🚨 Detected Regressions</h3>
                ${trends.regressionDetection.detectedRegressions.map(regression => `
                    <div class="recommendation ${regression.severity}">
                        <h4>${regression.metric} - ${regression.severity.toUpperCase()}</h4>
                        <p>${regression.description}</p>
                        <p><strong>Impact:</strong> ${regression.impactAssessment}</p>
                        <p><strong>Recommended Actions:</strong></p>
                        <ul>
                            ${regression.recommendedActions.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            ` : '<p>✅ No significant regressions detected.</p>'}

            <h3>🎯 Improvement Recommendations</h3>
            ${trends.improvementRecommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <h4>${rec.title} (${rec.priority.toUpperCase()} Priority)</h4>
                    <p>${rec.description}</p>
                    <p><strong>Impact:</strong> ${rec.impact}</p>
                    <p><strong>Effort:</strong> ${rec.effort}</p>
                    <p><strong>Action Items:</strong></p>
                    <ul>
                        ${rec.actionItems.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>`;
    }
}