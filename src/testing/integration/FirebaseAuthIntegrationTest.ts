/**
 * Firebase Authentication Integration Test
 * Tests the integration between Firebase authentication testing and the testing framework
 */

import { FirebaseTestSuite } from '../firebase/FirebaseTestSuite'
import { FirebaseAuthenticationTester } from '../firebase/FirebaseAuthenticationTester'
import { TestSuite, TestResult, HealthStatus } from '../core/TestingAgentController'

export class FirebaseAuthIntegrationTest implements TestSuite {
    public readonly id = 'firebase_auth_integration'
    public readonly name = 'Firebase Authentication Integration Test'
    public readonly description = 'Tests the integration between Firebase authentication testing and the testing framework'
    public readonly dependencies: string[] = []

    private firebaseTestSuite: FirebaseTestSuite
    private authTester: FirebaseAuthenticationTester

    constructor() {
        this.firebaseTestSuite = new FirebaseTestSuite()
        this.authTester = new FirebaseAuthenticationTester()
    }

    /**
     * Setup test environment
     */
    public async setup(): Promise<void> {
        console.log('Setting up Firebase Authentication Integration Test...')
        try {
            await this.firebaseTestSuite.setup()
        } catch (error) {
            console.warn('Firebase Test Suite setup failed, continuing with limited functionality:', error)
        }
    }

    /**
     * Cleanup test environment
     */
    public async teardown(): Promise<void> {
        console.log('Tearing down Firebase Authentication Integration Test...')
        try {
            await this.firebaseTestSuite.teardown()
        } catch (error) {
            console.warn('Firebase Test Suite teardown failed:', error)
        }
    }

    /**
     * Run all integration tests
     */
    public async runTests(): Promise<TestResult[]> {
        const results: TestResult[] = []

        // Test 1: Firebase Service Availability
        results.push(await this.testFirebaseServiceAvailability())

        // Test 2: Authentication Tester Functionality
        results.push(await this.testAuthenticationTesterFunctionality())

        // Test 3: Test Suite Integration
        results.push(await this.testSuiteIntegration())

        // Test 4: Error Handling
        results.push(await this.testErrorHandling())

        // Test 5: Performance Validation
        results.push(await this.testPerformanceValidation())

        return results
    }

    /**
     * Get health status
     */
    public getHealthStatus(): HealthStatus {
        try {
            const firebaseHealth = this.firebaseTestSuite.getHealthStatus()
            const authHealth = this.authTester.getHealthStatus()

            if (firebaseHealth.status === 'unhealthy' || authHealth.status === 'unhealthy') {
                return {
                    status: 'unhealthy',
                    message: 'Firebase services not available for integration testing',
                    details: {
                        firebase: firebaseHealth.status,
                        auth: authHealth.status
                    }
                }
            }

            if (firebaseHealth.status === 'degraded' || authHealth.status === 'degraded') {
                return {
                    status: 'degraded',
                    message: 'Firebase services partially available',
                    details: {
                        firebase: firebaseHealth.status,
                        auth: authHealth.status
                    }
                }
            }

            return {
                status: 'healthy',
                message: 'Firebase integration ready for testing',
                details: {
                    firebase: firebaseHealth.status,
                    auth: authHealth.status
                }
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                message: `Integration health check failed: ${error}`
            }
        }
    }

    /**
     * Test Firebase service availability
     */
    private async testFirebaseServiceAvailability(): Promise<TestResult> {
        const startTime = Date.now()

        try {
            const healthStatus = this.getHealthStatus()

            if (healthStatus.status === 'unhealthy') {
                return {
                    id: 'firebase_service_availability',
                    name: 'Firebase Service Availability',
                    status: 'failed',
                    duration: Date.now() - startTime,
                    message: healthStatus.message,
                    details: healthStatus.details,
                    timestamp: Date.now()
                }
            }

            return {
                id: 'firebase_service_availability',
                name: 'Firebase Service Availability',
                status: 'passed',
                duration: Date.now() - startTime,
                message: 'Firebase services are available for testing',
                details: healthStatus.details,
                timestamp: Date.now()
            }
        } catch (error) {
            return {
                id: 'firebase_service_availability',
                name: 'Firebase Service Availability',
                status: 'error',
                duration: Date.now() - startTime,
                message: `Service availability check failed: ${error}`,
                timestamp: Date.now()
            }
        }
    }

    /**
     * Test authentication tester functionality
     */
    private async testAuthenticationTesterFunctionality(): Promise<TestResult> {
        const startTime = Date.now()

        try {
            const testConfig = {
                testEmail: `integration_test_${Date.now()}@example.com`,
                testPassword: 'IntegrationTest123!',
                newPassword: 'NewIntegrationTest456!',
                displayName: 'Integration Test User',
                timeout: 15000
            }

            // Run a subset of authentication tests
            const results = await this.authTester.runAuthenticationTests(testConfig)

            if (results.length === 0) {
                return {
                    id: 'auth_tester_functionality',
                    name: 'Authentication Tester Functionality',
                    status: 'failed',
                    duration: Date.now() - startTime,
                    message: 'No authentication test results returned',
                    timestamp: Date.now()
                }
            }

            // Analyze results
            const totalTests = results.length
            const passedTests = results.filter(r => r.status === 'passed').length
            const failedTests = results.filter(r => r.status === 'failed').length
            const errorTests = results.filter(r => r.status === 'error').length
            const skippedTests = results.filter(r => r.status === 'skipped').length

            // Check if critical tests passed
            const criticalTests = ['auth_service_availability', 'user_registration', 'user_login']
            const criticalTestResults = results.filter(r => criticalTests.includes(r.id))
            const criticalTestsPassed = criticalTestResults.filter(r => r.status === 'passed').length

            const isSuccessful = criticalTestsPassed >= Math.min(2, criticalTests.length) // At least 2 critical tests should pass

            return {
                id: 'auth_tester_functionality',
                name: 'Authentication Tester Functionality',
                status: isSuccessful ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                message: `Authentication tester executed ${totalTests} tests`,
                details: {
                    totalTests,
                    passedTests,
                    failedTests,
                    errorTests,
                    skippedTests,
                    criticalTestsPassed,
                    criticalTestsTotal: criticalTests.length
                },
                timestamp: Date.now()
            }
        } catch (error) {
            return {
                id: 'auth_tester_functionality',
                name: 'Authentication Tester Functionality',
                status: 'error',
                duration: Date.now() - startTime,
                message: `Authentication tester functionality test failed: ${error}`,
                timestamp: Date.now()
            }
        }
    }

    /**
     * Test suite integration
     */
    private async testSuiteIntegration(): Promise<TestResult> {
        const startTime = Date.now()

        try {
            // Test TestSuite interface implementation
            const suiteId = this.firebaseTestSuite.id
            const suiteName = this.firebaseTestSuite.name
            const suiteDescription = this.firebaseTestSuite.description
            const suiteDependencies = this.firebaseTestSuite.dependencies

            if (!suiteId || !suiteName || !suiteDescription || !Array.isArray(suiteDependencies)) {
                return {
                    id: 'test_suite_integration',
                    name: 'Test Suite Integration',
                    status: 'failed',
                    duration: Date.now() - startTime,
                    message: 'Firebase Test Suite missing required TestSuite interface properties',
                    timestamp: Date.now()
                }
            }

            // Test suite execution
            const suiteResults = await this.firebaseTestSuite.runTests()

            if (!Array.isArray(suiteResults)) {
                return {
                    id: 'test_suite_integration',
                    name: 'Test Suite Integration',
                    status: 'failed',
                    duration: Date.now() - startTime,
                    message: 'Firebase Test Suite runTests() did not return array',
                    timestamp: Date.now()
                }
            }

            // Validate result structure
            const validResults = suiteResults.every(result =>
                result.id &&
                result.name &&
                ['passed', 'failed', 'skipped', 'error'].includes(result.status) &&
                typeof result.duration === 'number' &&
                typeof result.timestamp === 'number'
            )

            if (!validResults) {
                return {
                    id: 'test_suite_integration',
                    name: 'Test Suite Integration',
                    status: 'failed',
                    duration: Date.now() - startTime,
                    message: 'Firebase Test Suite results have invalid structure',
                    timestamp: Date.now()
                }
            }

            return {
                id: 'test_suite_integration',
                name: 'Test Suite Integration',
                status: 'passed',
                duration: Date.now() - startTime,
                message: 'Firebase Test Suite integration working correctly',
                details: {
                    suiteId,
                    suiteName,
                    resultsCount: suiteResults.length,
                    validStructure: validResults
                },
                timestamp: Date.now()
            }
        } catch (error) {
            return {
                id: 'test_suite_integration',
                name: 'Test Suite Integration',
                status: 'error',
                duration: Date.now() - startTime,
                message: `Test suite integration test failed: ${error}`,
                timestamp: Date.now()
            }
        }
    }

    /**
     * Test error handling
     */
    private async testErrorHandling(): Promise<TestResult> {
        const startTime = Date.now()

        try {
            // Test with invalid configuration
            const invalidConfig = {
                testEmail: 'invalid-email-format',
                testPassword: '', // Empty password
                newPassword: '123', // Weak password
                displayName: '',
                timeout: -1 // Invalid timeout
            }

            const results = await this.authTester.runAuthenticationTests(invalidConfig)

            // Check if errors were properly handled
            const errorResults = results.filter(r => r.status === 'failed' || r.status === 'error')
            const hasProperErrorHandling = errorResults.length > 0

            if (!hasProperErrorHandling) {
                return {
                    id: 'error_handling',
                    name: 'Error Handling',
                    status: 'failed',
                    duration: Date.now() - startTime,
                    message: 'Invalid configuration should have produced errors',
                    timestamp: Date.now()
                }
            }

            // Check if error messages are informative
            const hasInformativeErrors = errorResults.every(r =>
                r.message && r.message.length > 0
            )

            return {
                id: 'error_handling',
                name: 'Error Handling',
                status: hasInformativeErrors ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                message: hasInformativeErrors ?
                    'Error handling working correctly with informative messages' :
                    'Error handling lacks informative messages',
                details: {
                    totalResults: results.length,
                    errorResults: errorResults.length,
                    informativeErrors: hasInformativeErrors
                },
                timestamp: Date.now()
            }
        } catch (error) {
            return {
                id: 'error_handling',
                name: 'Error Handling',
                status: 'error',
                duration: Date.now() - startTime,
                message: `Error handling test failed: ${error}`,
                timestamp: Date.now()
            }
        }
    }

    /**
     * Test performance validation
     */
    private async testPerformanceValidation(): Promise<TestResult> {
        const startTime = Date.now()

        try {
            const performanceThreshold = 30000 // 30 seconds

            // Run a quick authentication test and measure performance
            const quickTestStart = Date.now()

            const quickConfig = {
                testEmail: `perf_test_${Date.now()}@example.com`,
                testPassword: 'PerfTest123!',
                newPassword: 'NewPerfTest456!',
                displayName: 'Performance Test User',
                timeout: 10000
            }

            const results = await this.authTester.runAuthenticationTests(quickConfig)
            const quickTestDuration = Date.now() - quickTestStart

            // Check if performance is within acceptable limits
            const isPerformant = quickTestDuration < performanceThreshold

            // Analyze individual test performance
            const slowTests = results.filter(r => r.duration > 5000) // Tests taking more than 5 seconds

            return {
                id: 'performance_validation',
                name: 'Performance Validation',
                status: isPerformant ? 'passed' : 'failed',
                duration: Date.now() - startTime,
                message: `Authentication tests completed in ${quickTestDuration}ms`,
                details: {
                    totalDuration: quickTestDuration,
                    threshold: performanceThreshold,
                    isPerformant,
                    slowTestsCount: slowTests.length,
                    averageTestDuration: results.length > 0 ?
                        results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0
                },
                timestamp: Date.now()
            }
        } catch (error) {
            return {
                id: 'performance_validation',
                name: 'Performance Validation',
                status: 'error',
                duration: Date.now() - startTime,
                message: `Performance validation test failed: ${error}`,
                timestamp: Date.now()
            }
        }
    }
}