// Custom Jest test results processor
const fs = require('fs');
const path = require('path');

class CustomTestReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
  }

  onRunComplete(contexts, results) {
    const {
      numTotalTests,
      numPassedTests,
      numFailedTests,
      numPendingTests,
      testResults,
      startTime,
      success,
    } = results;

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Generate comprehensive test report
    const report = {
      summary: {
        total: numTotalTests,
        passed: numPassedTests,
        failed: numFailedTests,
        pending: numPendingTests,
        success,
        duration,
        timestamp: new Date().toISOString(),
      },
      testSuites: testResults.map(testResult => ({
        name: testResult.testFilePath.replace(process.cwd(), ''),
        status: testResult.numFailingTests > 0 ? 'failed' : 'passed',
        duration: testResult.perfStats.end - testResult.perfStats.start,
        tests: {
          total: testResult.numTotalTests,
          passed: testResult.numPassingTests,
          failed: testResult.numFailingTests,
          pending: testResult.numPendingTests,
        },
        coverage: testResult.coverage ? {
          lines: testResult.coverage.lines,
          functions: testResult.coverage.functions,
          branches: testResult.coverage.branches,
          statements: testResult.coverage.statements,
        } : null,
        failureMessages: testResult.failureMessage ? [testResult.failureMessage] : [],
      })),
      performance: {
        slowestTests: this.getSlowTests(testResults, 10),
        averageTestDuration: this.getAverageTestDuration(testResults),
        memoryUsage: process.memoryUsage(),
      },
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: !!process.env.CI,
        timestamp: new Date().toISOString(),
      },
    };

    // Write detailed JSON report
    this.writeJsonReport(report);

    // Write HTML report
    this.writeHtmlReport(report);

    // Write JUnit XML report
    this.writeJunitReport(report);

    // Log summary to console
    this.logSummary(report);

    return results;
  }

  getSlowTests(testResults, limit = 10) {
    const allTests = [];
    
    testResults.forEach(testResult => {
      testResult.testResults.forEach(test => {
        allTests.push({
          name: test.fullName,
          file: testResult.testFilePath.replace(process.cwd(), ''),
          duration: test.duration || 0,
        });
      });
    });

    return allTests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getAverageTestDuration(testResults) {
    let totalDuration = 0;
    let totalTests = 0;

    testResults.forEach(testResult => {
      testResult.testResults.forEach(test => {
        if (test.duration) {
          totalDuration += test.duration;
          totalTests++;
        }
      });
    });

    return totalTests > 0 ? totalDuration / totalTests : 0;
  }

  writeJsonReport(report) {
    const reportPath = path.join('test-results', 'detailed-report.json');
    
    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Detailed JSON report written to: ${reportPath}`);
  }

  writeHtmlReport(report) {
    const htmlContent = this.generateHtmlReport(report);
    const reportPath = path.join('test-results', 'test-report.html');
    
    fs.writeFileSync(reportPath, htmlContent);
    console.log(`📄 HTML report written to: ${reportPath}`);
  }

  writeJunitReport(report) {
    const xmlContent = this.generateJunitXml(report);
    const reportPath = path.join('test-results', 'junit-report.xml');
    
    fs.writeFileSync(reportPath, xmlContent);
    console.log(`📋 JUnit XML report written to: ${reportPath}`);
  }

  generateHtmlReport(report) {
    const { summary, testSuites, performance } = report;
    const successRate = summary.total > 0 ? (summary.passed / summary.total * 100).toFixed(2) : 0;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${summary.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .pending { color: #ffc107; }
        .test-suites { margin-top: 30px; }
        .test-suite { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 6px; }
        .test-suite.failed { border-color: #dc3545; background-color: #fff5f5; }
        .test-suite.passed { border-color: #28a745; background-color: #f8fff8; }
        .suite-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .suite-name { font-weight: bold; }
        .suite-status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
        .status-passed { background-color: #28a745; }
        .status-failed { background-color: #dc3545; }
        .performance { margin-top: 30px; }
        .slow-tests { margin-top: 20px; }
        .slow-test { padding: 8px; border-bottom: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Report</h1>
            <p>Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
            <p>Duration: ${(summary.duration / 1000).toFixed(2)}s</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${summary.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Pending</h3>
                <div class="value pending">${summary.pending}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value">${successRate}%</div>
            </div>
        </div>

        <div class="test-suites">
            <h2>Test Suites</h2>
            ${testSuites.map(suite => `
                <div class="test-suite ${suite.status}">
                    <div class="suite-header">
                        <span class="suite-name">${suite.name}</span>
                        <span class="suite-status status-${suite.status}">${suite.status.toUpperCase()}</span>
                    </div>
                    <div>
                        Tests: ${suite.tests.total} | 
                        Passed: ${suite.tests.passed} | 
                        Failed: ${suite.tests.failed} | 
                        Duration: ${suite.duration}ms
                    </div>
                    ${suite.failureMessages.length > 0 ? `
                        <div style="margin-top: 10px; color: #dc3545;">
                            <strong>Failures:</strong>
                            <pre style="background: #f8f8f8; padding: 10px; border-radius: 4px; overflow-x: auto;">${suite.failureMessages.join('\\n\\n')}</pre>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="performance">
            <h2>Performance Metrics</h2>
            <p>Average test duration: ${performance.averageTestDuration.toFixed(2)}ms</p>
            
            <div class="slow-tests">
                <h3>Slowest Tests</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>File</th>
                            <th>Duration (ms)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${performance.slowestTests.map(test => `
                            <tr>
                                <td>${test.name}</td>
                                <td>${test.file}</td>
                                <td>${test.duration}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  generateJunitXml(report) {
    const { summary, testSuites } = report;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Jest Tests" tests="${summary.total}" failures="${summary.failed}" time="${(summary.duration / 1000).toFixed(3)}">`;

    testSuites.forEach(suite => {
      xml += `
  <testsuite name="${this.escapeXml(suite.name)}" tests="${suite.tests.total}" failures="${suite.tests.failed}" time="${(suite.duration / 1000).toFixed(3)}">`;
      
      // Add individual test cases (simplified for this example)
      for (let i = 0; i < suite.tests.passed; i++) {
        xml += `
    <testcase name="Test ${i + 1}" classname="${this.escapeXml(suite.name)}" time="0"/>`;
      }
      
      for (let i = 0; i < suite.tests.failed; i++) {
        xml += `
    <testcase name="Failed Test ${i + 1}" classname="${this.escapeXml(suite.name)}" time="0">
      <failure message="Test failed">${this.escapeXml(suite.failureMessages.join('\\n'))}</failure>
    </testcase>`;
      }
      
      xml += `
  </testsuite>`;
    });

    xml += `
</testsuites>`;

    return xml;
  }

  escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  logSummary(report) {
    const { summary } = report;
    const successRate = summary.total > 0 ? (summary.passed / summary.total * 100).toFixed(2) : 0;
    
    console.log('\\n' + '='.repeat(60));
    console.log('📊 CUSTOM TEST REPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⏭️  Pending: ${summary.pending}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    console.log(`📈 Reports generated in test-results/ directory`);
    console.log('='.repeat(60));
  }
}

module.exports = (results) => {
  const reporter = new CustomTestReporter();
  return reporter.onRunComplete(null, results);
};