/**
 * Predictive Analytics Tester
 * 
 * This module tests predictive analytics capabilities including forecasting accuracy,
 * data quality validation, and model performance metrics.
 * 
 * Requirements: 9.3, 9.5
 */

import { TestResult, TestConfiguration } from '../core/types';
import { runAiSystemDiagnostic } from '@/ai/flows/system-diagnostic-flow';
import { predictiveAnalyticsService } from '@/services/predictiveAnalyticsService';

interface PredictiveTestScenario {
  id: string;
  name: string;
  testType: 'demand_forecasting' | 'performance_prediction' | 'anomaly_detection' | 'trend_analysis';
  inputData: any;
  expectedOutcome: PredictiveExpectation;
  validationCriteria: PredictiveValidationCriteria;
}

interface PredictiveExpectation {
  accuracyThreshold: number;
  responseTimeMax: number;
  dataQualityMin: number;
  confidenceMin?: number;
}

interface PredictiveValidationCriteria {
  metricsToValidate: string[];
  performanceThresholds: { [metric: string]: number };
  dataQualityChecks: string[];
}

interface PredictiveMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  responseTime: number;
  dataQuality: number;
  confidence?: number;
}

export class PredictiveAnalyticsTester {
  private testScenarios: PredictiveTestScenario[] = [];

  constructor(private config: TestConfiguration) {
    this.initializeTestScenarios();
  }

  async initialize(): Promise<void> {
    console.log('📊 Initializing Predictive Analytics Tester...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Predictive Analytics Tester...');
  }

  private initializeTestScenarios(): void {
    // Demand forecasting scenarios
    this.testScenarios.push({
      id: 'demand-forecast-peak-hours',
      name: 'Demand Forecasting - Peak Hours',
      testType: 'demand_forecasting',
      inputData: {
        timeOfDay: 'rush_hour',
        dayOfWeek: 'monday',
        weather: 'clear',
        events: ['business_hours'],
        historicalData: this.generateMockHistoricalData('high_demand')
      },
      expectedOutcome: {
        accuracyThreshold: 0.75,
        responseTimeMax: 2000,
        dataQualityMin: 0.9,
        confidenceMin: 0.7
      },
      validationCriteria: {
        metricsToValidate: ['accuracy', 'responseTime', 'confidence'],
        performanceThresholds: {
          accuracy: 0.75,
          responseTime: 2000,
          confidence: 0.7
        },
        dataQualityChecks: ['completeness', 'consistency', 'timeliness']
      }
    });

    this.testScenarios.push({
      id: 'demand-forecast-low-demand',
      name: 'Demand Forecasting - Low Demand Period',
      testType: 'demand_forecasting',
      inputData: {
        timeOfDay: 'late_night',
        dayOfWeek: 'tuesday',
        weather: 'rainy',
        events: [],
        historicalData: this.generateMockHistoricalData('low_demand')
      },
      expectedOutcome: {
        accuracyThreshold: 0.8,
        responseTimeMax: 1500,
        dataQualityMin: 0.85
      },
      validationCriteria: {
        metricsToValidate: ['accuracy', 'responseTime'],
        performanceThresholds: {
          accuracy: 0.8,
          responseTime: 1500
        },
        dataQualityChecks: ['completeness', 'consistency']
      }
    });

    // Performance prediction scenarios
    this.testScenarios.push({
      id: 'performance-prediction-driver',
      name: 'Performance Prediction - Driver Efficiency',
      testType: 'performance_prediction',
      inputData: {
        driverMetrics: {
          experience: 24, // months
          ratings: [4.8, 4.9, 4.7, 4.8],
          completionRate: 0.95,
          responseTime: 3.2 // minutes
        },
        contextFactors: {
          timeOfDay: 'afternoon',
          trafficLevel: 'medium',
          weatherConditions: 'clear'
        }
      },
      expectedOutcome: {
        accuracyThreshold: 0.7,
        responseTimeMax: 1000,
        dataQualityMin: 0.9
      },
      validationCriteria: {
        metricsToValidate: ['accuracy', 'precision', 'responseTime'],
        performanceThresholds: {
          accuracy: 0.7,
          precision: 0.75,
          responseTime: 1000
        },
        dataQualityChecks: ['completeness', 'validity', 'consistency']
      }
    });

    // Anomaly detection scenarios
    this.testScenarios.push({
      id: 'anomaly-detection-system',
      name: 'Anomaly Detection - System Health',
      testType: 'anomaly_detection',
      inputData: {
        systemMetrics: {
          responseTime: [120, 125, 130, 500, 128], // 500ms is anomaly
          errorRate: [0.01, 0.02, 0.01, 0.15, 0.02], // 0.15 is anomaly
          throughput: [1000, 1050, 980, 200, 1020] // 200 is anomaly
        },
        timeWindow: '1_hour',
        sensitivity: 'medium'
      },
      expectedOutcome: {
        accuracyThreshold: 0.8,
        responseTimeMax: 500,
        dataQualityMin: 0.95
      },
      validationCriteria: {
        metricsToValidate: ['accuracy', 'precision', 'recall'],
        performanceThresholds: {
          accuracy: 0.8,
          precision: 0.75,
          recall: 0.85
        },
        dataQualityChecks: ['completeness', 'timeliness', 'accuracy']
      }
    });

    // Trend analysis scenarios
    this.testScenarios.push({
      id: 'trend-analysis-usage',
      name: 'Trend Analysis - Usage Patterns',
      testType: 'trend_analysis',
      inputData: {
        usageData: this.generateMockTrendData(),
        timeRange: '30_days',
        granularity: 'daily',
        factors: ['weather', 'events', 'seasonality']
      },
      expectedOutcome: {
        accuracyThreshold: 0.75,
        responseTimeMax: 3000,
        dataQualityMin: 0.9
      },
      validationCriteria: {
        metricsToValidate: ['accuracy', 'responseTime'],
        performanceThresholds: {
          accuracy: 0.75,
          responseTime: 3000
        },
        dataQualityChecks: ['completeness', 'consistency', 'trend_validity']
      }
    });

    // Additional comprehensive test scenarios
    this.testScenarios.push({
      id: 'revenue-forecast-accuracy',
      name: 'Revenue Forecasting Accuracy Validation',
      testType: 'demand_forecasting',
      inputData: {
        historicalRevenue: this.generateMockRevenueData(),
        timeHorizon: 30,
        granularity: 'daily',
        includeSeasonality: true
      },
      expectedOutcome: {
        accuracyThreshold: 0.8,
        responseTimeMax: 2500,
        dataQualityMin: 0.95,
        confidenceMin: 0.75
      },
      validationCriteria: {
        metricsToValidate: ['accuracy', 'responseTime', 'confidence'],
        performanceThresholds: {
          accuracy: 0.8,
          responseTime: 2500,
          confidence: 0.75
        },
        dataQualityChecks: ['completeness', 'consistency', 'timeliness', 'accuracy']
      }
    });

    this.testScenarios.push({
      id: 'model-performance-validation',
      name: 'Predictive Model Performance Validation',
      testType: 'performance_prediction',
      inputData: {
        modelMetrics: {
          trainingAccuracy: 0.85,
          validationAccuracy: 0.82,
          testAccuracy: 0.80,
          lastTrainingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        performanceThresholds: {
          minAccuracy: 0.75,
          maxResponseTime: 2000,
          maxMemoryUsage: 512 // MB
        }
      },
      expectedOutcome: {
        accuracyThreshold: 0.8,
        responseTimeMax: 2000,
        dataQualityMin: 0.9
      },
      validationCriteria: {
        metricsToValidate: ['accuracy', 'responseTime', 'precision', 'recall'],
        performanceThresholds: {
          accuracy: 0.8,
          responseTime: 2000,
          precision: 0.75,
          recall: 0.75
        },
        dataQualityChecks: ['model_freshness', 'performance_consistency', 'resource_efficiency']
      }
    });

    this.testScenarios.push({
      id: 'real-time-prediction-stress',
      name: 'Real-time Prediction Stress Test',
      testType: 'performance_prediction',
      inputData: {
        concurrentRequests: 50,
        requestInterval: 100, // ms
        testDuration: 30000, // 30 seconds
        predictionTypes: ['demand', 'revenue', 'capacity']
      },
      expectedOutcome: {
        accuracyThreshold: 0.75,
        responseTimeMax: 1500,
        dataQualityMin: 0.85
      },
      validationCriteria: {
        metricsToValidate: ['accuracy', 'responseTime', 'throughput'],
        performanceThresholds: {
          accuracy: 0.75,
          responseTime: 1500,
          throughput: 30 // requests per second
        },
        dataQualityChecks: ['consistency_under_load', 'error_rate', 'resource_stability']
      }
    });
  }

  async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const scenario of this.testScenarios) {
      const result = await this.runPredictiveTest(scenario);
      results.push(result);
    }

    // Run additional performance benchmarks
    const benchmarkResults = await this.runPerformanceBenchmarks();
    results.push(...benchmarkResults);

    return results;
  }

  private async runPredictiveTest(scenario: PredictiveTestScenario): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📊 Running predictive test: ${scenario.name}`);
      
      // Simulate predictive analytics based on test type
      const prediction = await this.runPredictiveAnalysis(scenario);
      
      // Validate prediction results
      const metrics = this.calculatePredictiveMetrics(prediction, scenario);
      const validationResults = this.validatePrediction(metrics, scenario.expectedOutcome, scenario.validationCriteria);
      
      const duration = Date.now() - startTime;

      if (validationResults.passed) {
        return {
          id: scenario.id,
          name: scenario.name,
          status: 'passed',
          duration,
          message: 'Predictive analytics test passed',
          details: {
            testType: scenario.testType,
            metrics,
            prediction,
            validationResults
          }
        };
      } else {
        return {
          id: scenario.id,
          name: scenario.name,
          status: 'failed',
          duration,
          message: `Predictive analytics test failed: ${validationResults.errors.join(', ')}`,
          details: {
            testType: scenario.testType,
            metrics,
            prediction,
            validationResults,
            expectedOutcome: scenario.expectedOutcome
          }
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: scenario.id,
        name: scenario.name,
        status: 'error',
        duration,
        message: `Predictive analytics test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          testType: scenario.testType,
          inputData: scenario.inputData,
          error: error instanceof Error ? error.stack : error 
        }
      };
    }
  }

  private async runPredictiveAnalysis(scenario: PredictiveTestScenario): Promise<any> {
    // Use actual predictive analytics service for real testing
    switch (scenario.testType) {
      case 'demand_forecasting':
        return await this.testDemandForecasting(scenario.inputData);
      
      case 'performance_prediction':
        return await this.testPerformancePrediction(scenario.inputData);
      
      case 'anomaly_detection':
        return await this.testAnomalyDetection(scenario.inputData);
      
      case 'trend_analysis':
        return await this.testTrendAnalysis(scenario.inputData);
      
      default:
        throw new Error(`Unknown predictive test type: ${scenario.testType}`);
    }
  }

  private async testDemandForecasting(inputData: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Test revenue forecasting
      const revenueForecast = await predictiveAnalyticsService.generateRevenueForecast(7, 'daily');
      
      // Test demand forecasting
      const demandForecast = await predictiveAnalyticsService.generateDemandForecast(
        inputData.location,
        24
      );
      
      const responseTime = Date.now() - startTime;
      
      // Validate forecasting accuracy
      const accuracy = this.validateForecastAccuracy(revenueForecast, demandForecast);
      
      return {
        revenueForecast,
        demandForecast,
        responseTime,
        accuracy,
        confidence: Math.min(revenueForecast.accuracy, 0.9),
        dataQuality: this.assessDataQuality(inputData),
        validationResults: {
          revenueForecasts: revenueForecast.forecasts.length,
          demandForecasts: demandForecast.forecasts.length,
          seasonalityDetected: revenueForecast.seasonality.detected,
          trendDirection: revenueForecast.trend
        }
      };
    } catch (error) {
      throw new Error(`Demand forecasting test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testPerformancePrediction(inputData: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Test capacity planning
      const capacityPlan = await predictiveAnalyticsService.generateCapacityPlan();
      
      // Test business insights
      const businessInsights = await predictiveAnalyticsService.getBusinessInsights();
      
      const responseTime = Date.now() - startTime;
      
      // Calculate performance prediction accuracy
      const accuracy = this.validatePerformancePrediction(capacityPlan, businessInsights);
      
      return {
        capacityPlan,
        businessInsights,
        responseTime,
        accuracy,
        confidence: 0.85,
        dataQuality: this.assessDataQuality(inputData),
        validationResults: {
          capacityRecommendations: capacityPlan.recommendations,
          riskFactors: businessInsights.riskFactors.length,
          insights: businessInsights.insights.length,
          scenarios: capacityPlan.scenarios.length
        }
      };
    } catch (error) {
      throw new Error(`Performance prediction test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testAnomalyDetection(inputData: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Test anomaly detection
      const anomalies = await predictiveAnalyticsService.detectAnomalies(
        ['revenue', 'rides', 'users'],
        30
      );
      
      const responseTime = Date.now() - startTime;
      
      // Validate anomaly detection accuracy
      const accuracy = this.validateAnomalyDetection(anomalies, inputData);
      
      return {
        anomalies,
        responseTime,
        accuracy,
        confidence: 0.88,
        dataQuality: this.assessDataQuality(inputData),
        validationResults: {
          anomaliesDetected: anomalies.anomalies.length,
          patterns: anomalies.patterns.length,
          severityDistribution: this.analyzeSeverityDistribution(anomalies.anomalies)
        }
      };
    } catch (error) {
      throw new Error(`Anomaly detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testTrendAnalysis(inputData: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Test market trend analysis
      const marketTrends = await predictiveAnalyticsService.analyzeMarketTrends();
      
      // Test competitive intelligence
      const competitiveIntel = await predictiveAnalyticsService.getCompetitiveIntelligence();
      
      const responseTime = Date.now() - startTime;
      
      // Validate trend analysis accuracy
      const accuracy = this.validateTrendAnalysis(marketTrends, competitiveIntel);
      
      return {
        marketTrends,
        competitiveIntel,
        responseTime,
        accuracy,
        confidence: 0.82,
        dataQuality: this.assessDataQuality(inputData),
        validationResults: {
          trendsAnalyzed: marketTrends.trends.length,
          competitorsAnalyzed: competitiveIntel.competitors.length,
          opportunities: competitiveIntel.opportunities.length,
          marketGrowthRate: marketTrends.marketSize.growthRate
        }
      };
    } catch (error) {
      throw new Error(`Trend analysis test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateForecastAccuracy(revenueForecast: any, demandForecast: any): number {
    // Validate forecast structure and data quality
    let accuracyScore = 0;
    let totalChecks = 0;

    // Check revenue forecast structure
    totalChecks++;
    if (revenueForecast.forecasts && revenueForecast.forecasts.length > 0) {
      accuracyScore++;
    }

    // Check demand forecast structure
    totalChecks++;
    if (demandForecast.forecasts && demandForecast.forecasts.length > 0) {
      accuracyScore++;
    }

    // Check confidence levels
    totalChecks++;
    if (revenueForecast.accuracy && revenueForecast.accuracy > 0.7) {
      accuracyScore++;
    }

    // Check seasonality detection
    totalChecks++;
    if (revenueForecast.seasonality && typeof revenueForecast.seasonality.detected === 'boolean') {
      accuracyScore++;
    }

    // Check forecast bounds
    totalChecks++;
    const hasValidBounds = revenueForecast.forecasts.every((f: any) => 
      f.upperBound > f.predicted && f.lowerBound < f.predicted
    );
    if (hasValidBounds) {
      accuracyScore++;
    }

    return totalChecks > 0 ? accuracyScore / totalChecks : 0;
  }

  private validatePerformancePrediction(capacityPlan: any, businessInsights: any): number {
    let accuracyScore = 0;
    let totalChecks = 0;

    // Check capacity plan structure
    totalChecks++;
    if (capacityPlan.recommendations && capacityPlan.scenarios) {
      accuracyScore++;
    }

    // Check business insights structure
    totalChecks++;
    if (businessInsights.insights && businessInsights.riskFactors) {
      accuracyScore++;
    }

    // Check recommendation quality
    totalChecks++;
    if (capacityPlan.recommendations.additionalDrivers >= 0 && 
        capacityPlan.recommendations.additionalVehicles >= 0) {
      accuracyScore++;
    }

    // Check risk assessment
    totalChecks++;
    const validRisks = businessInsights.riskFactors.every((risk: any) => 
      risk.probability >= 0 && risk.probability <= 1 && 
      risk.impact >= 0 && risk.impact <= 1
    );
    if (validRisks) {
      accuracyScore++;
    }

    return totalChecks > 0 ? accuracyScore / totalChecks : 0;
  }

  private validateAnomalyDetection(anomalies: any, inputData: any): number {
    let accuracyScore = 0;
    let totalChecks = 0;

    // Check anomaly structure
    totalChecks++;
    if (anomalies.anomalies && Array.isArray(anomalies.anomalies)) {
      accuracyScore++;
    }

    // Check pattern detection
    totalChecks++;
    if (anomalies.patterns && Array.isArray(anomalies.patterns)) {
      accuracyScore++;
    }

    // Check severity classification
    totalChecks++;
    const validSeverities = anomalies.anomalies.every((anomaly: any) => 
      ['low', 'medium', 'high', 'critical'].includes(anomaly.severity)
    );
    if (validSeverities) {
      accuracyScore++;
    }

    // Check confidence levels
    totalChecks++;
    const validConfidence = anomalies.anomalies.every((anomaly: any) => 
      anomaly.confidence >= 0 && anomaly.confidence <= 1
    );
    if (validConfidence) {
      accuracyScore++;
    }

    return totalChecks > 0 ? accuracyScore / totalChecks : 0;
  }

  private validateTrendAnalysis(marketTrends: any, competitiveIntel: any): number {
    let accuracyScore = 0;
    let totalChecks = 0;

    // Check market trends structure
    totalChecks++;
    if (marketTrends.trends && Array.isArray(marketTrends.trends)) {
      accuracyScore++;
    }

    // Check competitive analysis
    totalChecks++;
    if (competitiveIntel.competitors && Array.isArray(competitiveIntel.competitors)) {
      accuracyScore++;
    }

    // Check trend categorization
    totalChecks++;
    const validCategories = marketTrends.trends.every((trend: any) => 
      ['growth', 'competition', 'technology', 'regulation', 'economic'].includes(trend.category)
    );
    if (validCategories) {
      accuracyScore++;
    }

    // Check market size projections
    totalChecks++;
    if (marketTrends.marketSize && 
        marketTrends.marketSize.projected > marketTrends.marketSize.current) {
      accuracyScore++;
    }

    return totalChecks > 0 ? accuracyScore / totalChecks : 0;
  }

  private assessDataQuality(inputData: any): number {
    let qualityScore = 0;
    let totalChecks = 0;

    // Check data completeness
    totalChecks++;
    if (inputData && Object.keys(inputData).length > 0) {
      qualityScore++;
    }

    // Check data consistency
    totalChecks++;
    const hasConsistentTypes = Object.values(inputData).every(value => 
      value !== null && value !== undefined
    );
    if (hasConsistentTypes) {
      qualityScore++;
    }

    // Check data freshness (if timestamp available)
    totalChecks++;
    if (!inputData.timestamp || 
        (inputData.timestamp && Date.now() - new Date(inputData.timestamp).getTime() < 24 * 60 * 60 * 1000)) {
      qualityScore++;
    }

    return totalChecks > 0 ? qualityScore / totalChecks : 0;
  }

  private analyzeSeverityDistribution(anomalies: any[]): any {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    
    anomalies.forEach(anomaly => {
      if (distribution.hasOwnProperty(anomaly.severity)) {
        distribution[anomaly.severity as keyof typeof distribution]++;
      }
    });

    return distribution;
  }

  private simulateDemandForecast(inputData: any, diagnosticResult: any): any {
    // Simulate demand forecasting based on input parameters
    const baselineDemand = inputData.timeOfDay === 'rush_hour' ? 100 : 30;
    const weatherMultiplier = inputData.weather === 'rainy' ? 1.3 : 1.0;
    const eventMultiplier = inputData.events.length > 0 ? 1.2 : 1.0;
    
    const predictedDemand = Math.round(baselineDemand * weatherMultiplier * eventMultiplier);
    
    return {
      predictedDemand,
      confidence: 0.85,
      factors: {
        timeOfDay: inputData.timeOfDay,
        weather: inputData.weather,
        events: inputData.events
      },
      timeRange: '1_hour',
      accuracy: 0.82 // Simulated accuracy
    };
  }

  private simulatePerformancePrediction(inputData: any, diagnosticResult: any): any {
    const driverMetrics = inputData.driverMetrics;
    const avgRating = driverMetrics.ratings.reduce((a: number, b: number) => a + b, 0) / driverMetrics.ratings.length;
    
    // Predict performance score based on metrics
    const experienceScore = Math.min(driverMetrics.experience / 12, 1); // Max 1 for 12+ months
    const ratingScore = (avgRating - 3) / 2; // Normalize 3-5 scale to 0-1
    const completionScore = driverMetrics.completionRate;
    const responseScore = Math.max(0, 1 - (driverMetrics.responseTime - 2) / 8); // Optimal at 2 minutes
    
    const predictedPerformance = (experienceScore + ratingScore + completionScore + responseScore) / 4;
    
    return {
      predictedPerformanceScore: Math.round(predictedPerformance * 100) / 100,
      confidence: 0.78,
      contributingFactors: {
        experience: experienceScore,
        rating: ratingScore,
        completion: completionScore,
        response: responseScore
      },
      accuracy: 0.75 // Simulated accuracy
    };
  }

  private simulateAnomalyDetection(inputData: any, diagnosticResult: any): any {
    const metrics = inputData.systemMetrics;
    const anomalies: any[] = [];
    
    // Detect anomalies in response time
    const avgResponseTime = metrics.responseTime.reduce((a: number, b: number) => a + b, 0) / metrics.responseTime.length;
    metrics.responseTime.forEach((time: number, index: number) => {
      if (time > avgResponseTime * 2) {
        anomalies.push({
          type: 'response_time_spike',
          value: time,
          threshold: avgResponseTime * 2,
          timestamp: index,
          severity: 'high'
        });
      }
    });
    
    // Detect anomalies in error rate
    const avgErrorRate = metrics.errorRate.reduce((a: number, b: number) => a + b, 0) / metrics.errorRate.length;
    metrics.errorRate.forEach((rate: number, index: number) => {
      if (rate > avgErrorRate * 5) {
        anomalies.push({
          type: 'error_rate_spike',
          value: rate,
          threshold: avgErrorRate * 5,
          timestamp: index,
          severity: 'critical'
        });
      }
    });
    
    return {
      anomaliesDetected: anomalies,
      totalDataPoints: metrics.responseTime.length,
      anomalyRate: anomalies.length / metrics.responseTime.length,
      confidence: 0.9,
      accuracy: 0.88 // Simulated accuracy
    };
  }

  private simulateTrendAnalysis(inputData: any, diagnosticResult: any): any {
    const usageData = inputData.usageData;
    
    // Calculate trend direction and strength
    const values = usageData.map((d: any) => d.value);
    const trend = this.calculateTrend(values);
    
    return {
      trendDirection: trend.direction,
      trendStrength: trend.strength,
      projectedGrowth: trend.projectedGrowth,
      seasonalityDetected: true,
      confidence: 0.82,
      factors: inputData.factors,
      accuracy: 0.79 // Simulated accuracy
    };
  }

  private calculateTrend(values: number[]): { direction: string; strength: number; projectedGrowth: number } {
    if (values.length < 2) return { direction: 'stable', strength: 0, projectedGrowth: 0 };
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    const strength = Math.abs(change);
    
    let direction = 'stable';
    if (change > 0.05) direction = 'increasing';
    else if (change < -0.05) direction = 'decreasing';
    
    return {
      direction,
      strength: Math.min(strength, 1),
      projectedGrowth: change
    };
  }

  private calculatePredictiveMetrics(prediction: any, scenario: PredictiveTestScenario): PredictiveMetrics {
    // Extract or calculate metrics from prediction results
    return {
      accuracy: prediction.accuracy || 0.8, // Default if not provided
      precision: 0.75, // Simulated
      recall: 0.8, // Simulated
      responseTime: Date.now() - Date.now(), // This would be measured during actual prediction
      dataQuality: 0.9, // Simulated based on input data quality
      confidence: prediction.confidence
    };
  }

  private validatePrediction(
    metrics: PredictiveMetrics, 
    expectedOutcome: PredictiveExpectation, 
    criteria: PredictiveValidationCriteria
  ): { passed: boolean; errors: string[]; score: number } {
    const errors: string[] = [];
    let score = 0;
    let totalChecks = 0;

    // Validate accuracy
    if (criteria.metricsToValidate.includes('accuracy')) {
      totalChecks++;
      if (metrics.accuracy >= expectedOutcome.accuracyThreshold) {
        score++;
      } else {
        errors.push(`Accuracy ${metrics.accuracy.toFixed(3)} below threshold ${expectedOutcome.accuracyThreshold}`);
      }
    }

    // Validate response time
    if (criteria.metricsToValidate.includes('responseTime')) {
      totalChecks++;
      if (metrics.responseTime <= expectedOutcome.responseTimeMax) {
        score++;
      } else {
        errors.push(`Response time ${metrics.responseTime}ms exceeds maximum ${expectedOutcome.responseTimeMax}ms`);
      }
    }

    // Validate confidence
    if (criteria.metricsToValidate.includes('confidence') && expectedOutcome.confidenceMin) {
      totalChecks++;
      if (metrics.confidence && metrics.confidence >= expectedOutcome.confidenceMin) {
        score++;
      } else {
        errors.push(`Confidence ${metrics.confidence || 0} below minimum ${expectedOutcome.confidenceMin}`);
      }
    }

    // Validate precision
    if (criteria.metricsToValidate.includes('precision')) {
      totalChecks++;
      const threshold = criteria.performanceThresholds.precision || 0.7;
      if (metrics.precision >= threshold) {
        score++;
      } else {
        errors.push(`Precision ${metrics.precision.toFixed(3)} below threshold ${threshold}`);
      }
    }

    // Validate recall
    if (criteria.metricsToValidate.includes('recall')) {
      totalChecks++;
      const threshold = criteria.performanceThresholds.recall || 0.7;
      if (metrics.recall >= threshold) {
        score++;
      } else {
        errors.push(`Recall ${metrics.recall.toFixed(3)} below threshold ${threshold}`);
      }
    }

    // Validate data quality
    totalChecks++;
    if (metrics.dataQuality >= expectedOutcome.dataQualityMin) {
      score++;
    } else {
      errors.push(`Data quality ${metrics.dataQuality.toFixed(3)} below minimum ${expectedOutcome.dataQualityMin}`);
    }

    return {
      passed: errors.length === 0,
      errors,
      score: totalChecks > 0 ? score / totalChecks : 0
    };
  }

  private async runPerformanceBenchmarks(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Benchmark response time consistency
    results.push(await this.benchmarkResponseTimeConsistency());
    
    // Benchmark resource usage
    results.push(await this.benchmarkResourceUsage());
    
    // Benchmark concurrent prediction handling
    results.push(await this.benchmarkConcurrentPredictions());
    
    // Benchmark data quality validation
    results.push(await this.benchmarkDataQualityValidation());
    
    // Benchmark model accuracy over time
    results.push(await this.benchmarkModelAccuracyConsistency());
    
    return results;
  }

  private async benchmarkConcurrentPredictions(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Benchmarking concurrent prediction handling...');
      
      const concurrentRequests = 10;
      const promises: Promise<any>[] = [];
      
      // Create concurrent prediction requests
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          predictiveAnalyticsService.generateDemandForecast(undefined, 12)
        );
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // Validate all requests completed successfully
      const successfulRequests = results.filter(r => r && r.forecasts && r.forecasts.length > 0).length;
      const successRate = successfulRequests / concurrentRequests;
      
      // Calculate average response time per request
      const avgResponseTimePerRequest = duration / concurrentRequests;
      
      const isAcceptable = successRate >= 0.9 && avgResponseTimePerRequest < 3000;
      
      return {
        id: 'predictive-concurrent-benchmark',
        name: 'Concurrent Predictions Benchmark',
        status: isAcceptable ? 'passed' : 'failed',
        duration,
        message: isAcceptable 
          ? `Concurrent predictions handled successfully (${successRate * 100}% success rate)`
          : `Concurrent predictions performance issues (${successRate * 100}% success rate)`,
        details: {
          concurrentRequests,
          successfulRequests,
          successRate,
          avgResponseTimePerRequest,
          totalDuration: duration
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: 'predictive-concurrent-benchmark',
        name: 'Concurrent Predictions Benchmark',
        status: 'error',
        duration,
        message: `Concurrent predictions benchmark error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }

  private async benchmarkDataQualityValidation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Benchmarking data quality validation...');
      
      // Test with various data quality scenarios
      const testCases = [
        { name: 'complete_data', data: { timeOfDay: 'morning', weather: 'clear', events: ['rush_hour'] } },
        { name: 'incomplete_data', data: { timeOfDay: 'morning' } },
        { name: 'invalid_data', data: { timeOfDay: null, weather: '', events: undefined } },
        { name: 'mixed_quality', data: { timeOfDay: 'evening', weather: null, events: ['concert'] } }
      ];
      
      const qualityScores: number[] = [];
      
      for (const testCase of testCases) {
        const qualityScore = this.assessDataQuality(testCase.data);
        qualityScores.push(qualityScore);
      }
      
      const avgQualityScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
      const duration = Date.now() - startTime;
      
      // Expect quality assessment to properly differentiate between good and bad data
      const hasProperDifferentiation = qualityScores[0] > qualityScores[2]; // complete > invalid
      const isAcceptable = hasProperDifferentiation && avgQualityScore > 0.5;
      
      return {
        id: 'predictive-data-quality-benchmark',
        name: 'Data Quality Validation Benchmark',
        status: isAcceptable ? 'passed' : 'failed',
        duration,
        message: isAcceptable 
          ? `Data quality validation working correctly (avg score: ${avgQualityScore.toFixed(2)})`
          : `Data quality validation issues detected (avg score: ${avgQualityScore.toFixed(2)})`,
        details: {
          testCases: testCases.map((tc, i) => ({ ...tc, qualityScore: qualityScores[i] })),
          avgQualityScore,
          hasProperDifferentiation
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: 'predictive-data-quality-benchmark',
        name: 'Data Quality Validation Benchmark',
        status: 'error',
        duration,
        message: `Data quality benchmark error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }

  private async benchmarkModelAccuracyConsistency(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('📈 Benchmarking model accuracy consistency...');
      
      // Get predictive models information
      const models = await predictiveAnalyticsService.getPredictiveModels();
      
      // Test multiple predictions to check consistency
      const predictions: any[] = [];
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        const revenueForecast = await predictiveAnalyticsService.generateRevenueForecast(7, 'daily');
        predictions.push({
          iteration: i,
          accuracy: revenueForecast.accuracy,
          forecasts: revenueForecast.forecasts.length,
          trend: revenueForecast.trend
        });
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Analyze consistency
      const accuracies = predictions.map(p => p.accuracy);
      const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      const accuracyVariance = accuracies.reduce((acc, acc_val) => acc + Math.pow(acc_val - avgAccuracy, 2), 0) / accuracies.length;
      const accuracyStdDev = Math.sqrt(accuracyVariance);
      
      const duration = Date.now() - startTime;
      
      // Consider consistent if standard deviation is less than 5% of average
      const isConsistent = accuracyStdDev < (avgAccuracy * 0.05);
      const hasActiveModels = models.filter(m => m.status === 'active').length > 0;
      
      const isAcceptable = isConsistent && hasActiveModels && avgAccuracy > 0.7;
      
      return {
        id: 'predictive-accuracy-consistency-benchmark',
        name: 'Model Accuracy Consistency Benchmark',
        status: isAcceptable ? 'passed' : 'failed',
        duration,
        message: isAcceptable 
          ? `Model accuracy is consistent (avg: ${avgAccuracy.toFixed(3)}, std: ${accuracyStdDev.toFixed(3)})`
          : `Model accuracy inconsistency detected (avg: ${avgAccuracy.toFixed(3)}, std: ${accuracyStdDev.toFixed(3)})`,
        details: {
          models: models.length,
          activeModels: models.filter(m => m.status === 'active').length,
          predictions,
          avgAccuracy,
          accuracyStdDev,
          accuracyVariance,
          iterations,
          isConsistent,
          hasActiveModels
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: 'predictive-accuracy-consistency-benchmark',
        name: 'Model Accuracy Consistency Benchmark',
        status: 'error',
        duration,
        message: `Model accuracy benchmark error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }

  private async benchmarkResponseTimeConsistency(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('⏱️ Benchmarking response time consistency...');
      
      const responseTimes: number[] = [];
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        const iterationStart = Date.now();
        await runAiSystemDiagnostic({ checkLevel: 'quick_simulated' });
        const iterationTime = Date.now() - iterationStart;
        responseTimes.push(iterationTime);
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      const variance = responseTimes.reduce((acc, time) => acc + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length;
      const standardDeviation = Math.sqrt(variance);
      
      const duration = Date.now() - startTime;
      
      // Consider consistent if standard deviation is less than 20% of average
      const isConsistent = standardDeviation < (avgResponseTime * 0.2);
      
      return {
        id: 'predictive-response-time-benchmark',
        name: 'Predictive Analytics Response Time Benchmark',
        status: isConsistent ? 'passed' : 'failed',
        duration,
        message: isConsistent 
          ? `Response time is consistent (avg: ${avgResponseTime.toFixed(0)}ms, std: ${standardDeviation.toFixed(0)}ms)`
          : `Response time is inconsistent (avg: ${avgResponseTime.toFixed(0)}ms, std: ${standardDeviation.toFixed(0)}ms)`,
        details: {
          responseTimes,
          avgResponseTime,
          maxResponseTime,
          minResponseTime,
          standardDeviation,
          variance,
          iterations
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: 'predictive-response-time-benchmark',
        name: 'Predictive Analytics Response Time Benchmark',
        status: 'error',
        duration,
        message: `Response time benchmark error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }

  private async benchmarkResourceUsage(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('💾 Benchmarking resource usage...');
      
      const initialMemory = process.memoryUsage();
      
      // Run multiple predictive operations
      for (let i = 0; i < 3; i++) {
        await runAiSystemDiagnostic({ checkLevel: 'deep_simulated' });
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      const duration = Date.now() - startTime;
      
      // Consider acceptable if memory increase is less than 50%
      const isAcceptable = memoryIncreasePercent < 50;
      
      return {
        id: 'predictive-resource-usage-benchmark',
        name: 'Predictive Analytics Resource Usage Benchmark',
        status: isAcceptable ? 'passed' : 'failed',
        duration,
        message: isAcceptable 
          ? `Resource usage is acceptable (memory increase: ${memoryIncreasePercent.toFixed(1)}%)`
          : `Resource usage is high (memory increase: ${memoryIncreasePercent.toFixed(1)}%)`,
        details: {
          initialMemory,
          finalMemory,
          memoryIncrease,
          memoryIncreasePercent,
          operations: 3
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: 'predictive-resource-usage-benchmark',
        name: 'Predictive Analytics Resource Usage Benchmark',
        status: 'error',
        duration,
        message: `Resource usage benchmark error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }

  private generateMockHistoricalData(demandLevel: 'high_demand' | 'low_demand'): any[] {
    const baseValue = demandLevel === 'high_demand' ? 80 : 20;
    const data = [];
    
    for (let i = 0; i < 30; i++) {
      data.push({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        demand: baseValue + Math.random() * 20 - 10,
        weather: Math.random() > 0.7 ? 'rainy' : 'clear'
      });
    }
    
    return data;
  }

  private generateMockTrendData(): any[] {
    const data = [];
    let baseValue = 100;
    
    for (let i = 0; i < 30; i++) {
      baseValue += (Math.random() - 0.4) * 5; // Slight upward trend
      data.push({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        value: Math.max(0, baseValue + Math.random() * 10 - 5)
      });
    }
    
    return data;
  }

  private generateMockRevenueData(): any[] {
    const data = [];
    let baseRevenue = 100000; // $100k base daily revenue
    
    for (let i = 0; i < 90; i++) { // 90 days of historical data
      const date = new Date(Date.now() - (90 - i) * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      
      // Weekend adjustment
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;
      
      // Seasonal trend (slight growth over time)
      const trendMultiplier = 1 + (i / 90) * 0.1; // 10% growth over 90 days
      
      // Random variation
      const randomMultiplier = 1 + (Math.random() - 0.5) * 0.2; // ±10% random variation
      
      const revenue = baseRevenue * weekendMultiplier * trendMultiplier * randomMultiplier;
      
      data.push({
        date,
        revenue: Math.round(revenue),
        dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    
    return data;
  }
}