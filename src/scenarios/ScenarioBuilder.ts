import { EventEmitter } from 'events';

export interface ScenarioStep {
  id: string;
  name: string;
  type: 'action' | 'assertion' | 'condition' | 'loop' | 'delay' | 'data';
  description?: string;
  parameters: Record<string, any>;
  conditions?: StepCondition[];
  onSuccess?: string; // Next step ID on success
  onFailure?: string; // Next step ID on failure
  timeout?: number;
  retryAttempts?: number;
  enabled: boolean;
  tags?: string[];
}

export interface StepCondition {
  id: string;
  type: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'custom';
  field: string;
  value: any;
  operator?: 'and' | 'or';
}

export interface ScenarioVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  description?: string;
  required: boolean;
}

export interface ScenarioDataSet {
  id: string;
  name: string;
  description?: string;
  data: Record<string, any>[];
  variables: ScenarioVariable[];
}

export interface UserJourney {
  id: string;
  name: string;
  description?: string;
  userProfile: string; // Reference to user profile ID
  steps: ScenarioStep[];
  startStepId: string;
  variables: ScenarioVariable[];
  dataSets: ScenarioDataSet[];
  tags?: string[];
  estimatedDuration: number;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  category: 'functional' | 'performance' | 'security' | 'usability' | 'integration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  userJourneys: UserJourney[];
  globalVariables: ScenarioVariable[];
  globalDataSets: ScenarioDataSet[];
  executionSettings: {
    parallelExecution: boolean;
    maxConcurrentUsers: number;
    rampUpTime: number;
    sustainTime: number;
    rampDownTime: number;
  };
  validationRules: ValidationRule[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'step_dependency' | 'data_consistency' | 'performance_threshold' | 'custom';
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ScenarioValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  ruleId: string;
  stepId?: string;
  journeyId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  ruleId: string;
  stepId?: string;
  journeyId?: string;
  message: string;
  suggestion?: string;
}

export interface ValidationSuggestion {
  type: 'optimization' | 'best_practice' | 'enhancement';
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  scenario: Partial<TestScenario>;
  tags?: string[];
}

export interface ExecutionPlan {
  scenarioId: string;
  totalSteps: number;
  estimatedDuration: number;
  resourceRequirements: {
    memory: number;
    cpu: number;
    network: number;
  };
  dependencies: string[];
  executionOrder: ExecutionPhase[];
}

export interface ExecutionPhase {
  id: string;
  name: string;
  journeyIds: string[];
  parallelExecution: boolean;
  estimatedDuration: number;
  dependencies: string[];
}

export class ScenarioBuilder extends EventEmitter {
  private scenarios: Map<string, TestScenario> = new Map();
  private templates: Map<string, ScenarioTemplate> = new Map();
  private stepLibrary: Map<string, ScenarioStep> = new Map();

  constructor() {
    super();
    this.initializeStepLibrary();
    this.initializeTemplates();
  }

  private initializeStepLibrary(): void {
    const commonSteps: ScenarioStep[] = [
      {
        id: 'navigate_to_page',
        name: 'Navigate to Page',
        type: 'action',
        description: 'Navigate to a specific page or URL',
        parameters: {
          url: '',
          waitForLoad: true,
          timeout: 30000
        },
        enabled: true,
        timeout: 30000,
        retryAttempts: 2
      },
      {
        id: 'click_element',
        name: 'Click Element',
        type: 'action',
        description: 'Click on a UI element',
        parameters: {
          selector: '',
          waitForElement: true,
          scrollIntoView: true
        },
        enabled: true,
        timeout: 10000,
        retryAttempts: 3
      },
      {
        id: 'fill_input',
        name: 'Fill Input Field',
        type: 'action',
        description: 'Fill an input field with text',
        parameters: {
          selector: '',
          value: '',
          clearFirst: true
        },
        enabled: true,
        timeout: 5000,
        retryAttempts: 2
      },
      {
        id: 'verify_text',
        name: 'Verify Text Content',
        type: 'assertion',
        description: 'Verify that an element contains expected text',
        parameters: {
          selector: '',
          expectedText: '',
          matchType: 'exact' // exact, contains, regex
        },
        enabled: true,
        timeout: 5000,
        retryAttempts: 1
      },
      {
        id: 'verify_element_visible',
        name: 'Verify Element Visible',
        type: 'assertion',
        description: 'Verify that an element is visible on the page',
        parameters: {
          selector: '',
          timeout: 10000
        },
        enabled: true,
        timeout: 10000,
        retryAttempts: 2
      },
      {
        id: 'wait_for_element',
        name: 'Wait for Element',
        type: 'condition',
        description: 'Wait for an element to appear or become visible',
        parameters: {
          selector: '',
          condition: 'visible', // visible, hidden, exists, not_exists
          timeout: 30000
        },
        enabled: true,
        timeout: 30000,
        retryAttempts: 1
      },
      {
        id: 'delay',
        name: 'Delay/Wait',
        type: 'delay',
        description: 'Wait for a specified amount of time',
        parameters: {
          duration: 1000, // milliseconds
          reason: 'Loading time'
        },
        enabled: true
      },
      {
        id: 'set_variable',
        name: 'Set Variable',
        type: 'data',
        description: 'Set a variable value for use in subsequent steps',
        parameters: {
          variableName: '',
          value: '',
          type: 'string' // string, number, boolean
        },
        enabled: true
      },
      {
        id: 'api_request',
        name: 'API Request',
        type: 'action',
        description: 'Make an HTTP API request',
        parameters: {
          method: 'GET',
          url: '',
          headers: {},
          body: {},
          expectedStatus: 200
        },
        enabled: true,
        timeout: 30000,
        retryAttempts: 2
      }
    ];

    commonSteps.forEach(step => {
      this.stepLibrary.set(step.id, step);
    });
  }

  private initializeTemplates(): void {
    const defaultTemplates: ScenarioTemplate[] = [
      {
        id: 'user_registration',
        name: 'User Registration Flow',
        description: 'Complete user registration process',
        category: 'functional',
        scenario: {
          name: 'User Registration Scenario',
          category: 'functional',
          priority: 'high',
          userJourneys: [
            {
              id: 'registration_journey',
              name: 'New User Registration',
              description: 'Complete registration flow for new users',
              userProfile: 'new_user',
              startStepId: 'navigate_to_signup',
              steps: [
                {
                  id: 'navigate_to_signup',
                  name: 'Navigate to Sign Up Page',
                  type: 'action',
                  parameters: { url: '/signup' },
                  onSuccess: 'fill_email',
                  enabled: true
                },
                {
                  id: 'fill_email',
                  name: 'Fill Email Field',
                  type: 'action',
                  parameters: { selector: '#email', value: '{{user.email}}' },
                  onSuccess: 'fill_password',
                  enabled: true
                },
                {
                  id: 'fill_password',
                  name: 'Fill Password Field',
                  type: 'action',
                  parameters: { selector: '#password', value: '{{user.password}}' },
                  onSuccess: 'submit_form',
                  enabled: true
                },
                {
                  id: 'submit_form',
                  name: 'Submit Registration Form',
                  type: 'action',
                  parameters: { selector: '#submit-btn' },
                  onSuccess: 'verify_success',
                  enabled: true
                },
                {
                  id: 'verify_success',
                  name: 'Verify Registration Success',
                  type: 'assertion',
                  parameters: { selector: '.success-message', expectedText: 'Registration successful' },
                  enabled: true
                }
              ],
              variables: [
                { name: 'user.email', type: 'string', required: true, description: 'User email address' },
                { name: 'user.password', type: 'string', required: true, description: 'User password' }
              ],
              dataSets: [],
              estimatedDuration: 30000,
              complexity: 'simple'
            }
          ],
          globalVariables: [],
          globalDataSets: [],
          executionSettings: {
            parallelExecution: false,
            maxConcurrentUsers: 1,
            rampUpTime: 0,
            sustainTime: 0,
            rampDownTime: 0
          },
          validationRules: []
        },
        tags: ['registration', 'functional', 'user-flow']
      },
      {
        id: 'booking_flow',
        name: 'Car Booking Flow',
        description: 'Complete car booking process from search to confirmation',
        category: 'functional',
        scenario: {
          name: 'Car Booking Scenario',
          category: 'functional',
          priority: 'critical',
          userJourneys: [
            {
              id: 'booking_journey',
              name: 'Car Booking Journey',
              description: 'Search, select, and book a car',
              userProfile: 'regular_passenger',
              startStepId: 'navigate_to_booking',
              steps: [
                {
                  id: 'navigate_to_booking',
                  name: 'Navigate to Booking Page',
                  type: 'action',
                  parameters: { url: '/book' },
                  onSuccess: 'set_pickup_location',
                  enabled: true
                },
                {
                  id: 'set_pickup_location',
                  name: 'Set Pickup Location',
                  type: 'action',
                  parameters: { selector: '#pickup-location', value: '{{booking.pickupLocation}}' },
                  onSuccess: 'set_destination',
                  enabled: true
                },
                {
                  id: 'set_destination',
                  name: 'Set Destination',
                  type: 'action',
                  parameters: { selector: '#destination', value: '{{booking.destination}}' },
                  onSuccess: 'search_cars',
                  enabled: true
                },
                {
                  id: 'search_cars',
                  name: 'Search Available Cars',
                  type: 'action',
                  parameters: { selector: '#search-btn' },
                  onSuccess: 'select_car',
                  enabled: true
                },
                {
                  id: 'select_car',
                  name: 'Select Car',
                  type: 'action',
                  parameters: { selector: '.car-option:first-child .select-btn' },
                  onSuccess: 'confirm_booking',
                  enabled: true
                },
                {
                  id: 'confirm_booking',
                  name: 'Confirm Booking',
                  type: 'action',
                  parameters: { selector: '#confirm-booking-btn' },
                  onSuccess: 'verify_booking_success',
                  enabled: true
                },
                {
                  id: 'verify_booking_success',
                  name: 'Verify Booking Success',
                  type: 'assertion',
                  parameters: { selector: '.booking-confirmation', expectedText: 'Booking confirmed' },
                  enabled: true
                }
              ],
              variables: [
                { name: 'booking.pickupLocation', type: 'string', required: true, description: 'Pickup location' },
                { name: 'booking.destination', type: 'string', required: true, description: 'Destination location' }
              ],
              dataSets: [],
              estimatedDuration: 60000,
              complexity: 'medium'
            }
          ],
          globalVariables: [],
          globalDataSets: [],
          executionSettings: {
            parallelExecution: false,
            maxConcurrentUsers: 1,
            rampUpTime: 0,
            sustainTime: 0,
            rampDownTime: 0
          },
          validationRules: []
        },
        tags: ['booking', 'functional', 'critical-path']
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  public createScenario(scenarioData: Partial<TestScenario>): string {
    const id = scenarioData.id || this.generateId();
    const now = new Date();

    const scenario: TestScenario = {
      id,
      name: scenarioData.name || 'Untitled Scenario',
      description: scenarioData.description,
      category: scenarioData.category || 'functional',
      priority: scenarioData.priority || 'medium',
      userJourneys: scenarioData.userJourneys || [],
      globalVariables: scenarioData.globalVariables || [],
      globalDataSets: scenarioData.globalDataSets || [],
      executionSettings: scenarioData.executionSettings || {
        parallelExecution: false,
        maxConcurrentUsers: 1,
        rampUpTime: 0,
        sustainTime: 0,
        rampDownTime: 0
      },
      validationRules: scenarioData.validationRules || [],
      createdAt: now,
      updatedAt: now,
      createdBy: scenarioData.createdBy,
      tags: scenarioData.tags || []
    };

    // Validate scenario
    const validation = this.validateScenario(scenario);
    if (!validation.isValid) {
      throw new Error(`Scenario validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.scenarios.set(id, scenario);
    this.emit('scenarioCreated', scenario);
    return id;
  }

  public updateScenario(id: string, updates: Partial<TestScenario>): void {
    const existing = this.scenarios.get(id);
    if (!existing) {
      throw new Error(`Scenario with id ${id} not found`);
    }

    const updated: TestScenario = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date()
    };

    // Validate updated scenario
    const validation = this.validateScenario(updated);
    if (!validation.isValid) {
      throw new Error(`Scenario validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.scenarios.set(id, updated);
    this.emit('scenarioUpdated', updated);
  }

  public deleteScenario(id: string): void {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      throw new Error(`Scenario with id ${id} not found`);
    }

    this.scenarios.delete(id);
    this.emit('scenarioDeleted', scenario);
  }

  public getScenario(id: string): TestScenario | undefined {
    return this.scenarios.get(id);
  }

  public getAllScenarios(): TestScenario[] {
    return Array.from(this.scenarios.values());
  }

  public getScenariosByCategory(category: string): TestScenario[] {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.category === category);
  }

  public getScenariosByTag(tag: string): TestScenario[] {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.tags?.includes(tag));
  }

  public createUserJourney(scenarioId: string, journeyData: Partial<UserJourney>): string {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with id ${scenarioId} not found`);
    }

    const journeyId = journeyData.id || this.generateId();
    const journey: UserJourney = {
      id: journeyId,
      name: journeyData.name || 'Untitled Journey',
      description: journeyData.description,
      userProfile: journeyData.userProfile || 'default',
      steps: journeyData.steps || [],
      startStepId: journeyData.startStepId || '',
      variables: journeyData.variables || [],
      dataSets: journeyData.dataSets || [],
      tags: journeyData.tags || [],
      estimatedDuration: journeyData.estimatedDuration || 0,
      complexity: journeyData.complexity || 'simple'
    };

    scenario.userJourneys.push(journey);
    scenario.updatedAt = new Date();

    this.scenarios.set(scenarioId, scenario);
    this.emit('journeyCreated', { scenarioId, journey });
    return journeyId;
  }

  public addStepToJourney(scenarioId: string, journeyId: string, step: Partial<ScenarioStep>, position?: number): string {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with id ${scenarioId} not found`);
    }

    const journey = scenario.userJourneys.find(j => j.id === journeyId);
    if (!journey) {
      throw new Error(`Journey with id ${journeyId} not found`);
    }

    const stepId = step.id || this.generateId();
    const newStep: ScenarioStep = {
      id: stepId,
      name: step.name || 'Untitled Step',
      type: step.type || 'action',
      description: step.description,
      parameters: step.parameters || {},
      conditions: step.conditions || [],
      onSuccess: step.onSuccess,
      onFailure: step.onFailure,
      timeout: step.timeout,
      retryAttempts: step.retryAttempts,
      enabled: step.enabled !== false,
      tags: step.tags || []
    };

    if (position !== undefined && position >= 0 && position <= journey.steps.length) {
      journey.steps.splice(position, 0, newStep);
    } else {
      journey.steps.push(newStep);
    }

    // Update estimated duration
    journey.estimatedDuration = this.calculateJourneyDuration(journey);
    scenario.updatedAt = new Date();

    this.scenarios.set(scenarioId, scenario);
    this.emit('stepAdded', { scenarioId, journeyId, step: newStep });
    return stepId;
  }

  public validateScenario(scenario: TestScenario): ScenarioValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Basic validation
    if (!scenario.name || scenario.name.trim().length === 0) {
      errors.push({
        ruleId: 'required_name',
        message: 'Scenario name is required',
        severity: 'error'
      });
    }

    if (!scenario.userJourneys || scenario.userJourneys.length === 0) {
      warnings.push({
        ruleId: 'no_journeys',
        message: 'Scenario has no user journeys',
        suggestion: 'Add at least one user journey to make the scenario executable'
      });
    }

    // Validate each user journey
    scenario.userJourneys.forEach(journey => {
      this.validateUserJourney(journey, errors, warnings, suggestions);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private validateUserJourney(
    journey: UserJourney,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[]
  ): void {
    // Check if journey has steps
    if (!journey.steps || journey.steps.length === 0) {
      warnings.push({
        ruleId: 'empty_journey',
        journeyId: journey.id,
        message: `Journey '${journey.name}' has no steps`,
        suggestion: 'Add steps to make the journey executable'
      });
      return;
    }

    // Check start step
    if (!journey.startStepId) {
      errors.push({
        ruleId: 'no_start_step',
        journeyId: journey.id,
        message: `Journey '${journey.name}' has no start step defined`,
        severity: 'error'
      });
    } else {
      const startStep = journey.steps.find(s => s.id === journey.startStepId);
      if (!startStep) {
        errors.push({
          ruleId: 'invalid_start_step',
          journeyId: journey.id,
          message: `Journey '${journey.name}' start step '${journey.startStepId}' not found`,
          severity: 'error'
        });
      }
    }
  }

  private calculateJourneyDuration(journey: UserJourney): number {
    return journey.steps.reduce((total, step) => {
      let stepDuration = 0;
      
      switch (step.type) {
        case 'delay':
          stepDuration = step.parameters.duration || 0;
          break;
        case 'action':
          stepDuration = step.timeout || 5000;
          break;
        case 'assertion':
          stepDuration = step.timeout || 3000;
          break;
        case 'condition':
          stepDuration = step.timeout || 10000;
          break;
        default:
          stepDuration = 2000; // Default step duration
      }
      
      return total + stepDuration;
    }, 0);
  }

  public generateExecutionPlan(scenarioId: string): ExecutionPlan {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with id ${scenarioId} not found`);
    }

    const totalSteps = scenario.userJourneys.reduce((sum, journey) => sum + journey.steps.length, 0);
    const estimatedDuration = scenario.userJourneys.reduce((sum, journey) => sum + journey.estimatedDuration, 0);

    // Calculate resource requirements (simplified)
    const resourceRequirements = {
      memory: totalSteps * 10, // MB per step
      cpu: scenario.executionSettings.maxConcurrentUsers * 0.1, // CPU cores
      network: scenario.userJourneys.length * 5 // Mbps
    };

    // Create execution phases
    const executionOrder: ExecutionPhase[] = [];
    
    if (scenario.executionSettings.parallelExecution) {
      // All journeys in parallel
      executionOrder.push({
        id: 'parallel_phase',
        name: 'Parallel Execution',
        journeyIds: scenario.userJourneys.map(j => j.id),
        parallelExecution: true,
        estimatedDuration: Math.max(...scenario.userJourneys.map(j => j.estimatedDuration)),
        dependencies: []
      });
    } else {
      // Sequential execution
      scenario.userJourneys.forEach((journey, index) => {
        executionOrder.push({
          id: `sequential_phase_${index}`,
          name: `Execute ${journey.name}`,
          journeyIds: [journey.id],
          parallelExecution: false,
          estimatedDuration: journey.estimatedDuration,
          dependencies: index > 0 ? [`sequential_phase_${index - 1}`] : []
        });
      });
    }

    return {
      scenarioId,
      totalSteps,
      estimatedDuration,
      resourceRequirements,
      dependencies: [], // Could be populated based on scenario dependencies
      executionOrder
    };
  }

  public getStepLibrary(): ScenarioStep[] {
    return Array.from(this.stepLibrary.values());
  }

  public getTemplates(): ScenarioTemplate[] {
    return Array.from(this.templates.values());
  }

  public createFromTemplate(templateId: string, overrides: Partial<TestScenario> = {}): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    const scenarioData = {
      ...template.scenario,
      ...overrides
    };

    return this.createScenario(scenarioData);
  }

  public cloneScenario(id: string, newName?: string): string {
    const original = this.scenarios.get(id);
    if (!original) {
      throw new Error(`Scenario with id ${id} not found`);
    }

    const cloned = {
      ...original,
      id: undefined, // Will be generated
      name: newName || `${original.name} (Copy)`,
      createdAt: undefined, // Will be set to now
      updatedAt: undefined // Will be set to now
    };

    return this.createScenario(cloned);
  }

  private generateId(): string {
    return `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}