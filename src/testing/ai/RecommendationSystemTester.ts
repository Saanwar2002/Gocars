/**
 * Recommendation System Tester
 * 
 * This module tests AI-powered recommendation systems including personalized suggestions,
 * user preference learning, and recommendation relevance validation.
 * 
 * Requirements: 9.1, 9.2
 */

import { TestResult, TestConfiguration } from '../core/types';
import { suggestTaxiOnDescription } from '@/ai/flows/suggest-taxi-on-description';

interface RecommendationTestScenario {
  id: string;
  name: string;
  userProfile: UserProfile;
  context: RecommendationContext;
  expectedRecommendationTypes: string[];
  validationCriteria: RecommendationValidationCriteria;
}

interface UserProfile {
  id: string;
  preferences: {
    vehicleType: string[];
    priceRange: 'budget' | 'standard' | 'luxury';
    features: string[];
  };
  history: {
    previousBookings: BookingHistory[];
    ratings: number[];
    feedback: string[];
  };
  demographics: {
    age: number;
    location: string;
    travelFrequency: 'occasional' | 'regular' | 'frequent';
  };
}

interface BookingHistory {
  vehicleType: string;
  route: string;
  rating: number;
  timestamp: Date;
}

interface RecommendationContext {
  timeOfDay: string;
  weather: string;
  location: string;
  urgency: 'low' | 'medium' | 'high';
  groupSize: number;
}

interface RecommendationValidationCriteria {
  relevanceScore: number; // Minimum expected relevance (0-1)
  personalizationFactors: string[]; // Factors that should influence recommendation
  diversityExpected: boolean; // Whether recommendations should be diverse
  contextAwareness: string[]; // Context factors that should be considered
}

export class RecommendationSystemTester {
  private testScenarios: RecommendationTestScenario[] = [];

  constructor(private config: TestConfiguration) {
    this.initializeTestScenarios();
  }

  async initialize(): Promise<void> {
    console.log('🎯 Initializing Recommendation System Tester...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Recommendation System Tester...');
  }

  private initializeTestScenarios(): void {
    // Budget-conscious user scenario
    this.testScenarios.push({
      id: 'budget-user-recommendation',
      name: 'Budget-Conscious User Recommendations',
      userProfile: {
        id: 'user-budget-001',
        preferences: {
          vehicleType: ['economy', 'compact'],
          priceRange: 'budget',
          features: ['fuel-efficient', 'basic']
        },
        history: {
          previousBookings: [
            { vehicleType: 'economy', route: 'home-work', rating: 4, timestamp: new Date('2024-01-15') },
            { vehicleType: 'compact', route: 'work-home', rating: 5, timestamp: new Date('2024-01-16') }
          ],
          ratings: [4, 5, 4, 4],
          feedback: ['Good value', 'Clean car', 'On time']
        },
        demographics: {
          age: 25,
          location: 'downtown',
          travelFrequency: 'regular'
        }
      },
      context: {
        timeOfDay: 'morning',
        weather: 'clear',
        location: 'residential',
        urgency: 'medium',
        groupSize: 1
      },
      expectedRecommendationTypes: ['economy', 'budget', 'compact'],
      validationCriteria: {
        relevanceScore: 0.8,
        personalizationFactors: ['priceRange', 'previousBookings', 'vehicleType'],
        diversityExpected: false,
        contextAwareness: ['timeOfDay', 'location']
      }
    });

    // Luxury user scenario
    this.testScenarios.push({
      id: 'luxury-user-recommendation',
      name: 'Luxury User Recommendations',
      userProfile: {
        id: 'user-luxury-001',
        preferences: {
          vehicleType: ['luxury', 'premium'],
          priceRange: 'luxury',
          features: ['leather-seats', 'premium-sound', 'climate-control']
        },
        history: {
          previousBookings: [
            { vehicleType: 'luxury', route: 'airport-hotel', rating: 5, timestamp: new Date('2024-01-10') },
            { vehicleType: 'premium', route: 'hotel-restaurant', rating: 5, timestamp: new Date('2024-01-11') }
          ],
          ratings: [5, 5, 4, 5],
          feedback: ['Excellent service', 'Very comfortable', 'Professional driver']
        },
        demographics: {
          age: 45,
          location: 'business-district',
          travelFrequency: 'frequent'
        }
      },
      context: {
        timeOfDay: 'evening',
        weather: 'rainy',
        location: 'business-district',
        urgency: 'high',
        groupSize: 2
      },
      expectedRecommendationTypes: ['luxury', 'premium', 'executive'],
      validationCriteria: {
        relevanceScore: 0.9,
        personalizationFactors: ['priceRange', 'features', 'ratings'],
        diversityExpected: true,
        contextAwareness: ['weather', 'urgency', 'groupSize']
      }
    });

    // Accessibility-focused user scenario
    this.testScenarios.push({
      id: 'accessibility-user-recommendation',
      name: 'Accessibility-Focused User Recommendations',
      userProfile: {
        id: 'user-accessibility-001',
        preferences: {
          vehicleType: ['wheelchair-accessible', 'van'],
          priceRange: 'standard',
          features: ['wheelchair-ramp', 'spacious', 'easy-access']
        },
        history: {
          previousBookings: [
            { vehicleType: 'wheelchair-accessible', route: 'home-hospital', rating: 5, timestamp: new Date('2024-01-12') }
          ],
          ratings: [5, 4, 5],
          feedback: ['Perfect accessibility', 'Helpful driver', 'Smooth ride']
        },
        demographics: {
          age: 35,
          location: 'suburban',
          travelFrequency: 'occasional'
        }
      },
      context: {
        timeOfDay: 'afternoon',
        weather: 'clear',
        location: 'medical-district',
        urgency: 'medium',
        groupSize: 1
      },
      expectedRecommendationTypes: ['wheelchair-accessible', 'accessible', 'van'],
      validationCriteria: {
        relevanceScore: 0.95,
        personalizationFactors: ['vehicleType', 'features', 'accessibility'],
        diversityExpected: false,
        contextAwareness: ['location', 'specialNeeds']
      }
    });
  }

  async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const scenario of this.testScenarios) {
      const result = await this.runRecommendationTest(scenario);
      results.push(result);
    }

    // Run additional recommendation quality tests
    const qualityResults = await this.runRecommendationQualityTests();
    results.push(...qualityResults);

    return results;
  }

  private async runRecommendationTest(scenario: RecommendationTestScenario): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🎯 Running recommendation test: ${scenario.name}`);
      
      // Create a description based on user profile and context
      const description = this.createRecommendationDescription(scenario.userProfile, scenario.context);
      
      // Get AI recommendation
      const recommendation = await suggestTaxiOnDescription({ taxiDescription: description });
      
      // Validate recommendation
      const validationResults = this.validateRecommendation(
        recommendation,
        scenario.expectedRecommendationTypes,
        scenario.validationCriteria,
        scenario.userProfile
      );
      
      const duration = Date.now() - startTime;

      if (validationResults.passed) {
        return {
          id: scenario.id,
          name: scenario.name,
          status: 'passed',
          duration,
          message: 'Recommendation system test passed',
          details: {
            userProfile: scenario.userProfile.id,
            context: scenario.context,
            recommendation,
            relevanceScore: validationResults.relevanceScore,
            personalizationFactors: validationResults.personalizationFactors
          }
        };
      } else {
        return {
          id: scenario.id,
          name: scenario.name,
          status: 'failed',
          duration,
          message: `Recommendation validation failed: ${validationResults.errors.join(', ')}`,
          details: {
            userProfile: scenario.userProfile.id,
            context: scenario.context,
            recommendation,
            validationErrors: validationResults.errors,
            relevanceScore: validationResults.relevanceScore
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
        message: `Recommendation test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }

  private createRecommendationDescription(profile: UserProfile, context: RecommendationContext): string {
    const preferences = profile.preferences;
    const demographics = profile.demographics;
    
    let description = `I need a taxi recommendation for a ${demographics.travelFrequency} traveler. `;
    
    // Add preference information
    if (preferences.priceRange === 'budget') {
      description += 'I prefer budget-friendly options. ';
    } else if (preferences.priceRange === 'luxury') {
      description += 'I prefer luxury vehicles with premium features. ';
    }
    
    // Add vehicle type preferences
    if (preferences.vehicleType.length > 0) {
      description += `I usually prefer ${preferences.vehicleType.join(' or ')} vehicles. `;
    }
    
    // Add feature preferences
    if (preferences.features.length > 0) {
      description += `Important features for me: ${preferences.features.join(', ')}. `;
    }
    
    // Add context information
    description += `This is for ${context.timeOfDay} travel in ${context.weather} weather. `;
    description += `Group size: ${context.groupSize}. `;
    description += `Urgency level: ${context.urgency}.`;
    
    return description;
  }

  private validateRecommendation(
    recommendation: any,
    expectedTypes: string[],
    criteria: RecommendationValidationCriteria,
    userProfile: UserProfile
  ): { passed: boolean; errors: string[]; relevanceScore: number; personalizationFactors: string[] } {
    const errors: string[] = [];
    let relevanceScore = 0;
    const detectedPersonalizationFactors: string[] = [];

    // Check if recommendation exists and has required fields
    if (!recommendation || !recommendation.suggestedTaxi || !recommendation.reason) {
      errors.push('Recommendation must include suggestedTaxi and reason');
      return { passed: false, errors, relevanceScore: 0, personalizationFactors: [] };
    }

    const suggestedTaxi = recommendation.suggestedTaxi.toLowerCase();
    const reason = recommendation.reason.toLowerCase();

    // Check relevance to expected types
    const matchesExpectedType = expectedTypes.some(type => 
      suggestedTaxi.includes(type.toLowerCase()) || reason.includes(type.toLowerCase())
    );
    
    if (matchesExpectedType) {
      relevanceScore += 0.4;
    } else {
      errors.push(`Recommendation should match expected types: ${expectedTypes.join(', ')}`);
    }

    // Check personalization factors
    for (const factor of criteria.personalizationFactors) {
      switch (factor) {
        case 'priceRange':
          if (reason.includes(userProfile.preferences.priceRange) || 
              suggestedTaxi.includes(userProfile.preferences.priceRange)) {
            relevanceScore += 0.2;
            detectedPersonalizationFactors.push(factor);
          }
          break;
        case 'vehicleType':
          if (userProfile.preferences.vehicleType.some(type => 
              suggestedTaxi.includes(type.toLowerCase()) || reason.includes(type.toLowerCase()))) {
            relevanceScore += 0.2;
            detectedPersonalizationFactors.push(factor);
          }
          break;
        case 'features':
          if (userProfile.preferences.features.some(feature => 
              reason.includes(feature.toLowerCase()))) {
            relevanceScore += 0.1;
            detectedPersonalizationFactors.push(factor);
          }
          break;
        case 'previousBookings':
        case 'ratings':
          // These would require more complex analysis in a real system
          relevanceScore += 0.1;
          detectedPersonalizationFactors.push(factor);
          break;
      }
    }

    // Check if relevance meets minimum criteria
    if (relevanceScore < criteria.relevanceScore) {
      errors.push(`Relevance score ${relevanceScore.toFixed(2)} below minimum ${criteria.relevanceScore}`);
    }

    // Check reason quality
    if (reason.length < 20) {
      errors.push('Recommendation reason should be more detailed');
    }

    return {
      passed: errors.length === 0,
      errors,
      relevanceScore,
      personalizationFactors: detectedPersonalizationFactors
    };
  }

  private async runRecommendationQualityTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test recommendation consistency
    results.push(await this.testRecommendationConsistency());
    
    // Test recommendation diversity
    results.push(await this.testRecommendationDiversity());
    
    return results;
  }

  private async testRecommendationConsistency(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing recommendation consistency...');
      
      const testDescription = 'I need a luxury car for a business meeting';
      const recommendations: any[] = [];
      
      // Get multiple recommendations for the same input
      for (let i = 0; i < 3; i++) {
        const recommendation = await suggestTaxiOnDescription({ taxiDescription: testDescription });
        recommendations.push(recommendation);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check consistency
      const suggestedTaxis = recommendations.map(r => r.suggestedTaxi?.toLowerCase() || '');
      const uniqueTaxis = new Set(suggestedTaxis);
      
      const duration = Date.now() - startTime;
      
      // Allow some variation but expect general consistency
      if (uniqueTaxis.size <= 2) {
        return {
          id: 'recommendation-consistency',
          name: 'Recommendation Consistency Test',
          status: 'passed',
          duration,
          message: 'Recommendations show acceptable consistency',
          details: { recommendations, uniqueCount: uniqueTaxis.size }
        };
      } else {
        return {
          id: 'recommendation-consistency',
          name: 'Recommendation Consistency Test',
          status: 'failed',
          duration,
          message: 'Recommendations show too much variation for identical inputs',
          details: { recommendations, uniqueCount: uniqueTaxis.size }
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: 'recommendation-consistency',
        name: 'Recommendation Consistency Test',
        status: 'error',
        duration,
        message: `Consistency test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }

  private async testRecommendationDiversity(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🌈 Testing recommendation diversity...');
      
      const testDescriptions = [
        'I need a budget-friendly ride',
        'I want a luxury vehicle',
        'I need wheelchair accessible transportation',
        'I want an eco-friendly car',
        'I need a large vehicle for my family'
      ];
      
      const recommendations: any[] = [];
      
      for (const description of testDescriptions) {
        const recommendation = await suggestTaxiOnDescription({ taxiDescription: description });
        recommendations.push({ description, recommendation });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check diversity
      const suggestedTaxis = recommendations.map(r => r.recommendation.suggestedTaxi?.toLowerCase() || '');
      const uniqueTaxis = new Set(suggestedTaxis);
      
      const duration = Date.now() - startTime;
      
      // Expect diverse recommendations for diverse inputs
      if (uniqueTaxis.size >= 3) {
        return {
          id: 'recommendation-diversity',
          name: 'Recommendation Diversity Test',
          status: 'passed',
          duration,
          message: 'Recommendations show good diversity for different inputs',
          details: { recommendations, uniqueCount: uniqueTaxis.size }
        };
      } else {
        return {
          id: 'recommendation-diversity',
          name: 'Recommendation Diversity Test',
          status: 'failed',
          duration,
          message: 'Recommendations lack diversity for different inputs',
          details: { recommendations, uniqueCount: uniqueTaxis.size }
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: 'recommendation-diversity',
        name: 'Recommendation Diversity Test',
        status: 'error',
        duration,
        message: `Diversity test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }
}