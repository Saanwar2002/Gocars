/**
 * AI Model Response Validator
 * 
 * This module validates AI model responses for accuracy, relevance, and consistency.
 * It tests various AI flows including taxi suggestions, booking parsing, and system diagnostics.
 * 
 * Requirements: 9.1, 9.2, 9.4
 */

import { TestResult, TestConfiguration } from '../core/types';
import { suggestTaxiOnDescription } from '@/ai/flows/suggest-taxi-on-description';
import { parseBookingRequest } from '@/ai/flows/parse-booking-request-flow';
import { runAiSystemDiagnostic } from '@/ai/flows/system-diagnostic-flow';

interface AITestCase {
  id: string;
  name: string;
  input: any;
  expectedOutput?: any;
  validationRules: ValidationRule[];
}

interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'format' | 'range' | 'custom';
  validator?: (value: any) => boolean;
  message: string;
}

export class AIModelResponseValidator {
  private testCases: AITestCase[] = [];

  constructor(private config: TestConfiguration) {
    this.initializeTestCases();
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing AI Model Response Validator...');
    // Initialize any required resources
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up AI Model Response Validator...');
    // Cleanup resources
  }

  private initializeTestCases(): void {
    // Taxi suggestion test cases
    this.testCases.push(
      {
        id: 'taxi-suggestion-luxury',
        name: 'Taxi Suggestion - Luxury Request',
        input: { taxiDescription: 'I need a luxury car for a business meeting, preferably with leather seats and air conditioning' },
        validationRules: [
          { field: 'suggestedTaxi', type: 'required', message: 'Suggested taxi is required' },
          { field: 'reason', type: 'required', message: 'Reason is required' },
          { field: 'suggestedTaxi', type: 'type', validator: (v) => typeof v === 'string' && v.length > 0, message: 'Suggested taxi must be a non-empty string' },
          { field: 'reason', type: 'type', validator: (v) => typeof v === 'string' && v.length > 10, message: 'Reason must be a descriptive string' }
        ]
      },
      {
        id: 'taxi-suggestion-budget',
        name: 'Taxi Suggestion - Budget Request',
        input: { taxiDescription: 'I need the cheapest option available, just basic transportation' },
        validationRules: [
          { field: 'suggestedTaxi', type: 'required', message: 'Suggested taxi is required' },
          { field: 'reason', type: 'required', message: 'Reason is required' },
          { field: 'suggestedTaxi', type: 'custom', validator: (v) => v.toLowerCase().includes('budget') || v.toLowerCase().includes('economy') || v.toLowerCase().includes('basic'), message: 'Should suggest budget-friendly option' }
        ]
      },
      {
        id: 'taxi-suggestion-accessibility',
        name: 'Taxi Suggestion - Accessibility Request',
        input: { taxiDescription: 'I need a wheelchair accessible vehicle with ramp access' },
        validationRules: [
          { field: 'suggestedTaxi', type: 'required', message: 'Suggested taxi is required' },
          { field: 'reason', type: 'required', message: 'Reason is required' },
          { field: 'suggestedTaxi', type: 'custom', validator: (v) => v.toLowerCase().includes('wheelchair') || v.toLowerCase().includes('accessible'), message: 'Should suggest wheelchair accessible option' }
        ]
      }
    );

    // Booking parsing test cases
    this.testCases.push(
      {
        id: 'booking-parse-complete',
        name: 'Booking Parse - Complete Request',
        input: { userRequestText: 'I need a taxi from 123 Main Street to Airport Terminal 2 tomorrow at 3 PM for 2 passengers with luggage' },
        validationRules: [
          { field: 'pickupAddress', type: 'custom', validator: (v) => v && v.includes('123 Main Street'), message: 'Should extract pickup address' },
          { field: 'dropoffAddress', type: 'custom', validator: (v) => v && v.toLowerCase().includes('airport'), message: 'Should extract dropoff address' },
          { field: 'numberOfPassengers', type: 'custom', validator: (v) => v === 2, message: 'Should extract number of passengers' },
          { field: 'requestedTime', type: 'custom', validator: (v) => v && v.toLowerCase().includes('tomorrow'), message: 'Should extract requested time' },
          { field: 'additionalNotes', type: 'custom', validator: (v) => v && v.toLowerCase().includes('luggage'), message: 'Should extract additional notes' }
        ]
      },
      {
        id: 'booking-parse-minimal',
        name: 'Booking Parse - Minimal Request',
        input: { userRequestText: 'Need a ride to downtown now' },
        validationRules: [
          { field: 'dropoffAddress', type: 'custom', validator: (v) => v && v.toLowerCase().includes('downtown'), message: 'Should extract dropoff address' },
          { field: 'requestedTime', type: 'custom', validator: (v) => !v || v.toLowerCase().includes('asap') || v.toLowerCase().includes('now'), message: 'Should handle immediate requests' }
        ]
      }
    );

    // System diagnostic test cases
    this.testCases.push(
      {
        id: 'system-diagnostic-quick',
        name: 'System Diagnostic - Quick Check',
        input: { checkLevel: 'quick_simulated' as const },
        validationRules: [
          { field: 'overallHealthStatus', type: 'required', message: 'Overall health status is required' },
          { field: 'summary', type: 'required', message: 'Summary is required' },
          { field: 'issues', type: 'type', validator: (v) => Array.isArray(v), message: 'Issues must be an array' },
          { field: 'recommendations', type: 'type', validator: (v) => Array.isArray(v), message: 'Recommendations must be an array' },
          { field: 'timestamp', type: 'format', validator: (v) => !isNaN(Date.parse(v)), message: 'Timestamp must be valid ISO date' },
          { field: 'issues', type: 'range', validator: (v) => v.length <= 1, message: 'Quick check should have 0-1 issues' },
          { field: 'recommendations', type: 'range', validator: (v) => v.length >= 1 && v.length <= 2, message: 'Quick check should have 1-2 recommendations' }
        ]
      },
      {
        id: 'system-diagnostic-deep',
        name: 'System Diagnostic - Deep Check',
        input: { checkLevel: 'deep_simulated' as const },
        validationRules: [
          { field: 'overallHealthStatus', type: 'required', message: 'Overall health status is required' },
          { field: 'summary', type: 'required', message: 'Summary is required' },
          { field: 'issues', type: 'type', validator: (v) => Array.isArray(v), message: 'Issues must be an array' },
          { field: 'recommendations', type: 'type', validator: (v) => Array.isArray(v), message: 'Recommendations must be an array' },
          { field: 'issues', type: 'range', validator: (v) => v.length >= 1 && v.length <= 3, message: 'Deep check should have 1-3 issues' },
          { field: 'recommendations', type: 'range', validator: (v) => v.length >= 2 && v.length <= 4, message: 'Deep check should have 2-4 recommendations' }
        ]
      }
    );
  }

  async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of this.testCases) {
      const result = await this.runSingleTest(testCase);
      results.push(result);
    }

    return results;
  }

  private async runSingleTest(testCase: AITestCase): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running AI test: ${testCase.name}`);
      
      let output: any;
      
      // Route to appropriate AI flow based on test case
      if (testCase.id.startsWith('taxi-suggestion')) {
        output = await suggestTaxiOnDescription(testCase.input);
      } else if (testCase.id.startsWith('booking-parse')) {
        output = await parseBookingRequest(testCase.input);
      } else if (testCase.id.startsWith('system-diagnostic')) {
        output = await runAiSystemDiagnostic(testCase.input);
      } else {
        throw new Error(`Unknown test case type: ${testCase.id}`);
      }

      // Validate the output
      const validationResults = this.validateOutput(output, testCase.validationRules);
      const duration = Date.now() - startTime;

      if (validationResults.length === 0) {
        return {
          id: testCase.id,
          name: testCase.name,
          status: 'passed',
          duration,
          message: 'AI model response validation passed',
          details: { input: testCase.input, output, validationsPassed: testCase.validationRules.length }
        };
      } else {
        return {
          id: testCase.id,
          name: testCase.name,
          status: 'failed',
          duration,
          message: `AI model response validation failed: ${validationResults.join(', ')}`,
          details: { input: testCase.input, output, validationErrors: validationResults }
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: testCase.id,
        name: testCase.name,
        status: 'error',
        duration,
        message: `AI model test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { input: testCase.input, error: error instanceof Error ? error.stack : error }
      };
    }
  }

  private validateOutput(output: any, rules: ValidationRule[]): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      const fieldValue = this.getFieldValue(output, rule.field);
      
      switch (rule.type) {
        case 'required':
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            errors.push(rule.message);
          }
          break;
          
        case 'type':
        case 'format':
        case 'range':
        case 'custom':
          if (rule.validator && !rule.validator(fieldValue)) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return errors;
  }

  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((current, key) => current?.[key], obj);
  }
}