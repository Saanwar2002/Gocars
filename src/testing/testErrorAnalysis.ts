#!/usr/bin/env node

/**
 * Simple test script to validate error analysis functionality
 * This can be run independently to test the error analysis system
 */

import { runErrorAnalysisTests } from './runErrorAnalysisTests';

async function main() {
    console.log('🔍 Testing Error Analysis and Categorization System...\n');

    try {
        // Run the tests
        const results = await runErrorAnalysisTests();

        // Display summary
        console.log('\n📊 Final Test Summary:');
        console.log('='.repeat(50));

        const summary = {
            total: results.length,
            passed: results.filter(r => r.status === 'passed').length,
            failed: results.filter(r => r.status === 'failed').length,
            errors: results.filter(r => r.status === 'error').length,
            successRate: results.length > 0 ? (results.filter(r => r.status === 'passed').length / results.length) * 100 : 0
        };

        console.log(`Total Tests: ${summary.total}`);
        console.log(`Passed: ${summary.passed} ✅`);
        console.log(`Failed: ${summary.failed} ❌`);
        console.log(`Errors: ${summary.errors} 🚨`);
        console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);

        // Display test breakdown
        console.log('\n📈 Test Breakdown:');
        const testTypes = {
            'Pattern Recognition': results.find(r => r.id === 'error-pattern-recognition'),
            'Categorization': results.find(r => r.id === 'error-categorization'),
            'Severity Assessment': results.find(r => r.id === 'severity-assessment'),
            'Correlation Analysis': results.find(r => r.id === 'correlation-analysis'),
            'Root Cause Analysis': results.find(r => r.id === 'root-cause-analysis'),
            'Impact Assessment': results.find(r => r.id === 'impact-assessment'),
            'Trend Analysis': results.find(r => r.id === 'trend-analysis'),
            'Batch Processing': results.find(r => r.id === 'batch-processing'),
            'Performance': results.find(r => r.id === 'performance-test'),
            'Edge Cases': results.find(r => r.id === 'edge-cases')
        };

        for (const [testName, result] of Object.entries(testTypes)) {
            if (result) {
                const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '🚨';
                console.log(`${icon} ${testName}: ${result.status} (${result.duration}ms)`);
                if (result.status !== 'passed' && result.message) {
                    console.log(`    ${result.message}`);
                }
            }
        }

        // Display detailed results for failed tests
        const failedTests = results.filter(r => r.status === 'failed' || r.status === 'error');
        if (failedTests.length > 0) {
            console.log('\n❌ Failed Test Details:');
            failedTests.forEach(test => {
                console.log(`\n  Test: ${test.name}`);
                console.log(`  Status: ${test.status}`);
                console.log(`  Message: ${test.message}`);
                if (test.details) {
                    console.log(`  Details: ${JSON.stringify(test.details, null, 2)}`);
                }
            });
        }

        // Display performance metrics
        const perfTest = results.find(r => r.id === 'performance-test');
        if (perfTest && perfTest.details) {
            console.log('\n⚡ Performance Metrics:');
            console.log(`  Errors Processed: ${perfTest.details.errorsProcessed}`);
            console.log(`  Total Processing Time: ${perfTest.details.totalProcessingTime}ms`);
            console.log(`  Avg Time Per Error: ${perfTest.details.avgProcessingTimePerError.toFixed(1)}ms`);
            console.log(`  Memory Usage: ${perfTest.details.memoryUsage.heapUsed}MB`);
        }

        // Save detailed report
        const fs = require('fs');
        const path = require('path');

        const reportDir = 'test-reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const reportPath = path.join(reportDir, `error-analysis-report-${Date.now()}.json`);
        const detailedReport = {
            timestamp: new Date().toISOString(),
            summary,
            testResults: results,
            testTypes,
            recommendations: generateRecommendations(results)
        };

        fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));

        console.log(`\n📄 Detailed report saved to: ${reportPath}`);

        // Exit with appropriate code
        if (summary.failed > 0 || summary.errors > 0) {
            console.log('\n❌ Some tests failed. Check the report for details.');
            process.exit(1);
        } else {
            console.log('\n✅ All error analysis tests passed!');
            process.exit(0);
        }

    } catch (error) {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results: any[]): string[] {
    const recommendations: string[] = [];
    const failedTests = results.filter(r => r.status === 'failed' || r.status === 'error');

    if (failedTests.length === 0) {
        recommendations.push('✅ All error analysis tests are passing. System is performing well.');
        return recommendations;
    }

    // Analyze failure patterns
    const patternRecognitionFailed = failedTests.some(t => t.id === 'error-pattern-recognition');
    if (patternRecognitionFailed) {
        recommendations.push('⚠️ Pattern recognition needs improvement. Consider expanding error pattern database.');
    }

    const categorizationFailed = failedTests.some(t => t.id === 'error-categorization');
    if (categorizationFailed) {
        recommendations.push('⚠️ Error categorization accuracy is low. Review categorization logic.');
    }

    const severityFailed = failedTests.some(t => t.id === 'severity-assessment');
    if (severityFailed) {
        recommendations.push('⚠️ Severity assessment needs calibration. Review impact calculation algorithms.');
    }

    const correlationFailed = failedTests.some(t => t.id === 'correlation-analysis');
    if (correlationFailed) {
        recommendations.push('⚠️ Correlation analysis not working properly. Check time window and correlation logic.');
    }

    const rootCauseFailed = failedTests.some(t => t.id === 'root-cause-analysis');
    if (rootCauseFailed) {
        recommendations.push('⚠️ Root cause analysis needs improvement. Enhance cause probability calculations.');
    }

    const performanceFailed = failedTests.some(t => t.id === 'performance-test');
    if (performanceFailed) {
        recommendations.push('⚠️ Performance is below expectations. Consider optimizing error processing algorithms.');
    }

    const errorRate = (failedTests.length / results.length) * 100;
    if (errorRate > 30) {
        recommendations.push('🚨 High failure rate detected. Conduct comprehensive system review.');
    } else if (errorRate > 15) {
        recommendations.push('⚠️ Moderate failure rate. Monitor error analysis system stability.');
    }

    return recommendations;
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { main as testErrorAnalysis };