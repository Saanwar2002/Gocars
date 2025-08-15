/**
 * Natural Language Processing Accuracy Tester
 * 
 * This module tests the accuracy of natural language processing features,
 * including text parsing, intent recognition, and entity extraction.
 * 
 * Requirements: 9.4
 */

import { TestResult, TestConfiguration } from '../core/types';
import { parseBookingRequest } from '@/ai/flows/parse-booking-request-flow';

interface NLPTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: {
    pickupAddress?: string;
    dropoffAddress?: string;
    numberOfPassengers?: number;
    requestedTime?: string;
    additionalNotes?: string;
  };
  testType: 'entity_extraction' | 'intent_recognition' | 'context_understanding';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface NLPAccuracyMetrics {
  entityExtractionAccuracy: number;
  intentRecognitionAccuracy: number;
  contextUnderstandingAccuracy: number;
  overallAccuracy: number;
}

export class NLPAccuracyTester {
  private testCases: NLPTestCase[] = [];

  constructor(private config: TestConfiguration) {
    this.initializeTestCases();
  }

  async initialize(): Promise<void> {
    console.log('🗣️ Initializing NLP Accuracy Tester...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up NLP Accuracy Tester...');
  }

  private initializeTestCases(): void {
    // Easy entity extraction cases
    this.testCases.push(
      {
        id: 'nlp-easy-complete',
        name: 'Easy Complete Request',
        input: 'I need a taxi from 123 Main Street to 456 Oak Avenue at 3 PM for 2 people',
        expectedOutput: {
          pickupAddress: '123 Main Street',
          dropoffAddress: '456 Oak Avenue',
          numberOfPassengers: 2,
          requestedTime: '3 PM'
        },
        testType: 'entity_extraction',
        difficulty: 'easy'
      },
      {
        id: 'nlp-easy-minimal',
        name: 'Easy Minimal Request',
        input: 'Take me to the airport now',
        expectedOutput: {
          dropoffAddress: 'airport',
          requestedTime: 'now'
        },
        testType: 'entity_extraction',
        difficulty: 'easy'
      }
    );

    // Medium complexity cases
    this.testCases.push(
      {
        id: 'nlp-medium-time-parsing',
        name: 'Medium Time Parsing',
        input: 'Book me a ride tomorrow morning at 8:30 AM from downtown to the university',
        expectedOutput: {
          pickupAddress: 'downtown',
          dropoffAddress: 'university',
          requestedTime: 'tomorrow morning at 8:30 AM'
        },
        testType: 'entity_extraction',
        difficulty: 'medium'
      },
      {
        id: 'nlp-medium-implicit-info',
        name: 'Medium Implicit Information',
        input: 'We need a ride to the concert venue, there are four of us and we have instruments',
        expectedOutput: {
          dropoffAddress: 'concert venue',
          numberOfPassengers: 4,
          additionalNotes: 'instruments'
        },
        testType: 'context_understanding',
        difficulty: 'medium'
      },
      {
        id: 'nlp-medium-relative-time',
        name: 'Medium Relative Time',
        input: 'Pick me up in 30 minutes from the hotel lobby to catch my flight',
        expectedOutput: {
          pickupAddress: 'hotel lobby',
          requestedTime: 'in 30 minutes',
          additionalNotes: 'flight'
        },
        testType: 'entity_extraction',
        difficulty: 'medium'
      }
    );

    // Hard complexity cases
    this.testCases.push(
      {
        id: 'nlp-hard-ambiguous',
        name: 'Hard Ambiguous Request',
        input: 'Can you get me a car? I\'m at the place we talked about yesterday, going to see John at his office around lunchtime',
        expectedOutput: {
          requestedTime: 'lunchtime',
          additionalNotes: 'office'
        },
        testType: 'context_understanding',
        difficulty: 'hard'
      },
      {
        id: 'nlp-hard-multiple-stops',
        name: 'Hard Multiple Stops',
        input: 'I need to go from home to pick up my friend at 123 Elm Street, then to the mall, and finally to the restaurant on 5th Avenue by 7 PM',
        expectedOutput: {
          dropoffAddress: 'restaurant on 5th Avenue',
          requestedTime: 'by 7 PM',
          additionalNotes: 'pick up friend at 123 Elm Street, then mall'
        },
        testType: 'context_understanding',
        difficulty: 'hard'
      },
      {
        id: 'nlp-hard-colloquial',
        name: 'Hard Colloquial Language',
        input: 'Yo, can I get a ride ASAP? Gotta bounce from this party at Sarah\'s place to grab some grub downtown with the crew',
        expectedOutput: {
          dropoffAddress: 'downtown',
          requestedTime: 'ASAP',
          additionalNotes: 'food'
        },
        testType: 'intent_recognition',
        difficulty: 'hard'
      }
    );

    // Intent recognition cases
    this.testCases.push(
      {
        id: 'nlp-intent-urgent',
        name: 'Intent Recognition - Urgent',
        input: 'Emergency! I need a taxi right now to the hospital!',
        expectedOutput: {
          dropoffAddress: 'hospital',
          requestedTime: 'right now',
          additionalNotes: 'emergency'
        },
        testType: 'intent_recognition',
        difficulty: 'medium'
      },
      {
        id: 'nlp-intent-scheduled',
        name: 'Intent Recognition - Scheduled',
        input: 'I would like to schedule a pickup for next Friday at 2 PM from my office to the conference center',
        expectedOutput: {
          pickupAddress: 'office',
          dropoffAddress: 'conference center',
          requestedTime: 'next Friday at 2 PM'
        },
        testType: 'intent_recognition',
        difficulty: 'easy'
      }
    );

    // Context understanding cases
    this.testCases.push(
      {
        id: 'nlp-context-weather',
        name: 'Context Understanding - Weather',
        input: 'It\'s pouring rain and I\'m stuck at the bus stop on Main Street, need a ride home urgently',
        expectedOutput: {
          pickupAddress: 'bus stop on Main Street',
          dropoffAddress: 'home',
          requestedTime: 'urgently',
          additionalNotes: 'rain'
        },
        testType: 'context_understanding',
        difficulty: 'medium'
      },
      {
        id: 'nlp-context-accessibility',
        name: 'Context Understanding - Accessibility',
        input: 'I use a wheelchair and need transportation from the medical center to my apartment, please ensure the vehicle is accessible',
        expectedOutput: {
          pickupAddress: 'medical center',
          dropoffAddress: 'apartment',
          additionalNotes: 'wheelchair accessible'
        },
        testType: 'context_understanding',
        difficulty: 'medium'
      }
    );
  }

  async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const accuracyMetrics: NLPAccuracyMetrics = {
      entityExtractionAccuracy: 0,
      intentRecognitionAccuracy: 0,
      contextUnderstandingAccuracy: 0,
      overallAccuracy: 0
    };

    let totalTests = 0;
    let passedTests = 0;
    const testsByType: { [key: string]: { total: number; passed: number } } = {
      entity_extraction: { total: 0, passed: 0 },
      intent_recognition: { total: 0, passed: 0 },
      context_understanding: { total: 0, passed: 0 }
    };

    for (const testCase of this.testCases) {
      const result = await this.runNLPTest(testCase);
      results.push(result);
      
      totalTests++;
      testsByType[testCase.testType].total++;
      
      if (result.status === 'passed') {
        passedTests++;
        testsByType[testCase.testType].passed++;
      }
    }

    // Calculate accuracy metrics
    accuracyMetrics.entityExtractionAccuracy = testsByType.entity_extraction.total > 0 
      ? testsByType.entity_extraction.passed / testsByType.entity_extraction.total 
      : 0;
    accuracyMetrics.intentRecognitionAccuracy = testsByType.intent_recognition.total > 0 
      ? testsByType.intent_recognition.passed / testsByType.intent_recognition.total 
      : 0;
    accuracyMetrics.contextUnderstandingAccuracy = testsByType.context_understanding.total > 0 
      ? testsByType.context_understanding.passed / testsByType.context_understanding.total 
      : 0;
    accuracyMetrics.overallAccuracy = totalTests > 0 ? passedTests / totalTests : 0;

    // Add accuracy summary result
    results.push({
      id: 'nlp-accuracy-summary',
      name: 'NLP Accuracy Summary',
      status: accuracyMetrics.overallAccuracy >= 0.8 ? 'passed' : 'failed',
      duration: 0,
      message: `Overall NLP accuracy: ${(accuracyMetrics.overallAccuracy * 100).toFixed(1)}%`,
      details: {
        accuracyMetrics,
        testsByType,
        totalTests,
        passedTests
      }
    });

    return results;
  }

  private async runNLPTest(testCase: NLPTestCase): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🗣️ Running NLP test: ${testCase.name}`);
      
      // Parse the booking request using AI
      const result = await parseBookingRequest({ userRequestText: testCase.input });
      
      // Calculate accuracy score
      const accuracyScore = this.calculateAccuracyScore(result, testCase.expectedOutput);
      
      const duration = Date.now() - startTime;

      // Determine pass/fail based on accuracy score and difficulty
      const passingThreshold = this.getPassingThreshold(testCase.difficulty);
      const passed = accuracyScore >= passingThreshold;

      return {
        id: testCase.id,
        name: testCase.name,
        status: passed ? 'passed' : 'failed',
        duration,
        message: passed 
          ? `NLP test passed with ${(accuracyScore * 100).toFixed(1)}% accuracy`
          : `NLP test failed with ${(accuracyScore * 100).toFixed(1)}% accuracy (threshold: ${(passingThreshold * 100).toFixed(1)}%)`,
        details: {
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: result,
          accuracyScore,
          passingThreshold,
          testType: testCase.testType,
          difficulty: testCase.difficulty,
          fieldScores: this.getFieldScores(result, testCase.expectedOutput)
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: testCase.id,
        name: testCase.name,
        status: 'error',
        duration,
        message: `NLP test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          input: testCase.input,
          expected: testCase.expectedOutput,
          error: error instanceof Error ? error.stack : error 
        }
      };
    }
  }

  private calculateAccuracyScore(actual: any, expected: any): number {
    const fields = ['pickupAddress', 'dropoffAddress', 'numberOfPassengers', 'requestedTime', 'additionalNotes'];
    let totalFields = 0;
    let correctFields = 0;

    for (const field of fields) {
      if (expected[field] !== undefined) {
        totalFields++;
        
        if (this.isFieldCorrect(actual[field], expected[field], field)) {
          correctFields++;
        }
      }
    }

    return totalFields > 0 ? correctFields / totalFields : 0;
  }

  private isFieldCorrect(actualValue: any, expectedValue: any, fieldName: string): boolean {
    if (actualValue === undefined || actualValue === null) {
      return false;
    }

    const actualStr = String(actualValue).toLowerCase();
    const expectedStr = String(expectedValue).toLowerCase();

    switch (fieldName) {
      case 'numberOfPassengers':
        return actualValue === expectedValue;
      
      case 'pickupAddress':
      case 'dropoffAddress':
        // Check if the actual address contains key terms from expected
        return expectedStr.split(' ').some(term => 
          term.length > 2 && actualStr.includes(term)
        );
      
      case 'requestedTime':
        // Check if time expressions match or are equivalent
        return this.isTimeExpressionMatch(actualStr, expectedStr);
      
      case 'additionalNotes':
        // Check if key concepts are captured
        return expectedStr.split(' ').some(term => 
          term.length > 3 && actualStr.includes(term)
        );
      
      default:
        return actualStr.includes(expectedStr) || expectedStr.includes(actualStr);
    }
  }

  private isTimeExpressionMatch(actual: string, expected: string): boolean {
    // Handle common time expression equivalencies
    const timeEquivalents: { [key: string]: string[] } = {
      'now': ['asap', 'immediately', 'right now'],
      'asap': ['now', 'immediately', 'right now'],
      'morning': ['am', 'a.m.'],
      'afternoon': ['pm', 'p.m.'],
      'evening': ['pm', 'p.m.', 'night']
    };

    // Direct match
    if (actual.includes(expected) || expected.includes(actual)) {
      return true;
    }

    // Check equivalents
    for (const [key, equivalents] of Object.entries(timeEquivalents)) {
      if (expected.includes(key) && equivalents.some(equiv => actual.includes(equiv))) {
        return true;
      }
    }

    return false;
  }

  private getFieldScores(actual: any, expected: any): { [field: string]: boolean } {
    const fields = ['pickupAddress', 'dropoffAddress', 'numberOfPassengers', 'requestedTime', 'additionalNotes'];
    const scores: { [field: string]: boolean } = {};

    for (const field of fields) {
      if (expected[field] !== undefined) {
        scores[field] = this.isFieldCorrect(actual[field], expected[field], field);
      }
    }

    return scores;
  }

  private getPassingThreshold(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 0.9;   // 90% accuracy required for easy tests
      case 'medium': return 0.7; // 70% accuracy required for medium tests
      case 'hard': return 0.5;   // 50% accuracy required for hard tests
      default: return 0.8;
    }
  }
}