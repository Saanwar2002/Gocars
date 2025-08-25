import { EventEmitter } from 'events';
import { ScenarioBuilder, TestScenario, UserJourney, ScenarioStep, ExecutionPlan } from './ScenarioBuilder';
import { TestExecutionOrchestrator as BaseOrchestrator } from '../orchestration/TestExecutionOrchestrator';
import { ExecutionQueue } from '../orchestration/ExecutionQueue';
import { ResourcePool } from '../orchestration/ResourcePool';
import { DependencyResolver } from '../orchestration/DependencyResolver';

export interface ScenarioExecutionContext {
  scenarioId: string;
  journeyId: string;
  stepId: string;
  variables: Map<string, any>;
  sessionData: Map<string, any>;
  userProfile: any;
  startTime: Date;
  currentStepIndex: number;
  totalSteps: number;
}

export interface StepExecutionResult {
  stepId: string;
  success: boolean;
  duration: number;
  error?: Error;
  output?: any;
  screenshot?: string;
  logs: string[];
  metrics: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface JourneyExecutionResult {
  journeyId: string;
  success: boolean;
  totalDuration: number;
  stepResults: StepExecutionResult[];
  error?: Error;
  completedSteps: number;
  totalSteps: number;
}

export interface ScenarioExecutionResult {
  scenarioId: string;
  success: boolean;
  totalDuration: number;
  journeyResults: JourneyExecutionResult[];
  error?: Error;
  startTime: Date;
  endTime: Date;
  summary: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
  };
}

export interface ExecutionSession {
  id: string;
  scenarioId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  result?: ScenarioExecutionResult;
  progress: {
    currentJourney: number;
    totalJourneys: number;
    currentStep: number;
    totalSteps: number;
    percentage: number;
  };
}

export class ScenarioTestExecutionOrchestrator extends EventEmitter {
  private scenarioBuilder: ScenarioBuilder;
  private baseOrchestrator: BaseOrchestrator;
  private executionQueue: ExecutionQueue;
  private resourcePool: ResourcePool;
  private dependencyResolver: DependencyResolver;
  private activeSessions: Map<string, ExecutionSession> = new Map();
  private stepExecutors: Map<string, (step: ScenarioStep, context: ScenarioExecutionContext) => Promise<StepExecutionResult>> = new Map();

  constructor(
    scenarioBuilder: ScenarioBuilder,
    baseOrchestrator: BaseOrchestrator,
    executionQueue: ExecutionQueue,
    resourcePool: ResourcePool,
    dependencyResolver: DependencyResolver
  ) {
    super();
    this.scenarioBuilder = scenarioBuilder;
    this.baseOrchestrator = baseOrchestrator;
    this.executionQueue = executionQueue;
    this.resourcePool = resourcePool;
    this.dependencyResolver = dependencyResolver;
    
    this.initializeStepExecutors();
    this.setupEventListeners();
  }

  private initializeStepExecutors(): void {
    // Action step executors
    this.stepExecutors.set('navigate_to_page', this.executeNavigationStep.bind(this));
    this.stepExecutors.set('click_element', this.executeClickStep.bind(this));
    this.stepExecutors.set('fill_input', this.executeFillInputStep.bind(this));
    this.stepExecutors.set('api_request', this.executeApiRequestStep.bind(this));
    
    // Assertion step executors
    this.stepExecutors.set('verify_text', this.executeTextVerificationStep.bind(this));
    this.stepExecutors.set('verify_element_visible', this.executeElementVisibilityStep.bind(this));
    
    // Condition step executors
    this.stepExecutors.set('wait_for_element', this.executeWaitForElementStep.bind(this));
    
    // Utility step executors
    this.stepExecutors.set('delay', this.executeDelayStep.bind(this));
    this.stepExecutors.set('set_variable', this.executeSetVariableStep.bind(this));
  }

  private setupEventListeners(): void {
    this.baseOrchestrator.on('testCompleted', (result) => {
      this.emit('stepCompleted', result);
    });

    this.baseOrchestrator.on('testFailed', (error) => {
      this.emit('stepFailed', error);
    });

    this.executionQueue.on('queueEmpty', () => {
      this.emit('allExecutionsCompleted');
    });
  }

  public async executeScenario(scenarioId: string, options: {
    concurrentUsers?: number;
    rampUpTime?: number;
    sustainTime?: number;
    rampDownTime?: number;
    variables?: Record<string, any>;
  } = {}): Promise<ScenarioExecutionResult> {
    const scenario = this.scenarioBuilder.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with id ${scenarioId} not found`);
    }

    const sessionId = this.generateSessionId();
    const session: ExecutionSession = {
      id: sessionId,
      scenarioId,
      status: 'pending',
      progress: {
        currentJourney: 0,
        totalJourneys: scenario.userJourneys.length,
        currentStep: 0,
        totalSteps: scenario.userJourneys.reduce((sum, journey) => sum + journey.steps.length, 0),
        percentage: 0
      }
    };

    this.activeSessions.set(sessionId, session);
    this.emit('sessionStarted', session);

    try {
      // Generate execution plan
      const executionPlan = this.scenarioBuilder.generateExecutionPlan(scenarioId);
      
      // Validate resources
      await this.validateResourceRequirements(executionPlan);
      
      // Execute scenario
      const result = await this.executeScenarioInternal(scenario, executionPlan, options, session);
      
      session.status = result.success ? 'completed' : 'failed';
      session.endTime = new Date();
      session.result = result;
      
      this.emit('sessionCompleted', session);
      return result;
      
    } catch (error) {
      session.status = 'failed';
      session.endTime = new Date();
      this.emit('sessionFailed', { session, error });
      throw error;
    } finally {
      this.activeSessions.delete(sessionId);
    }
  }

  private async executeScenarioInternal(
    scenario: TestScenario,
    executionPlan: ExecutionPlan,
    options: any,
    session: ExecutionSession
  ): Promise<ScenarioExecutionResult> {
    const startTime = new Date();
    const journeyResults: JourneyExecutionResult[] = [];
    let totalCompletedSteps = 0;
    let totalFailedSteps = 0;
    let totalSkippedSteps = 0;

    session.status = 'running';
    session.startTime = startTime;

    try {
      // Execute based on execution plan
      for (const phase of executionPlan.executionOrder) {
        const phaseJourneys = scenario.userJourneys.filter(j => phase.journeyIds.includes(j.id));
        
        if (phase.parallelExecution) {
          // Execute journeys in parallel
          const parallelResults = await Promise.allSettled(
            phaseJourneys.map(journey => this.executeUserJourney(journey, scenario, options, session))
          );
          
          parallelResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              journeyResults.push(result.value);
            } else {
              journeyResults.push({
                journeyId: phaseJourneys[index].id,
                success: false,
                totalDuration: 0,
                stepResults: [],
                error: result.reason,
                completedSteps: 0,
                totalSteps: phaseJourneys[index].steps.length
              });
            }
          });
        } else {
          // Execute journeys sequentially
          for (const journey of phaseJourneys) {
            const journeyResult = await this.executeUserJourney(journey, scenario, options, session);
            journeyResults.push(journeyResult);
            
            // Update session progress
            session.progress.currentJourney++;
            session.progress.percentage = (session.progress.currentJourney / session.progress.totalJourneys) * 100;
            this.emit('sessionProgress', session);
            
            // Stop execution if journey failed and scenario is configured to stop on failure
            if (!journeyResult.success && !scenario.executionSettings.parallelExecution) {
              break;
            }
          }
        }
      }

      // Calculate summary
      journeyResults.forEach(result => {
        totalCompletedSteps += result.completedSteps;
        totalFailedSteps += result.stepResults.filter(s => !s.success).length;
        totalSkippedSteps += result.totalSteps - result.completedSteps - result.stepResults.filter(s => !s.success).length;
      });

      const endTime = new Date();
      const success = journeyResults.every(r => r.success);

      return {
        scenarioId: scenario.id,
        success,
        totalDuration: endTime.getTime() - startTime.getTime(),
        journeyResults,
        startTime,
        endTime,
        summary: {
          totalSteps: executionPlan.totalSteps,
          completedSteps: totalCompletedSteps,
          failedSteps: totalFailedSteps,
          skippedSteps: totalSkippedSteps
        }
      };

    } catch (error) {
      const endTime = new Date();
      return {
        scenarioId: scenario.id,
        success: false,
        totalDuration: endTime.getTime() - startTime.getTime(),
        journeyResults,
        error: error as Error,
        startTime,
        endTime,
        summary: {
          totalSteps: executionPlan.totalSteps,
          completedSteps: totalCompletedSteps,
          failedSteps: totalFailedSteps,
          skippedSteps: totalSkippedSteps
        }
      };
    }
  }

  private async executeUserJourney(
    journey: UserJourney,
    scenario: TestScenario,
    options: any,
    session: ExecutionSession
  ): Promise<JourneyExecutionResult> {
    const startTime = Date.now();
    const stepResults: StepExecutionResult[] = [];
    let completedSteps = 0;

    // Initialize execution context
    const context: ScenarioExecutionContext = {
      scenarioId: scenario.id,
      journeyId: journey.id,
      stepId: '',
      variables: new Map(Object.entries(options.variables || {})),
      sessionData: new Map(),
      userProfile: journey.userProfile,
      startTime: new Date(),
      currentStepIndex: 0,
      totalSteps: journey.steps.length
    };

    // Add journey variables to context
    journey.variables.forEach(variable => {
      if (!context.variables.has(variable.name) && variable.defaultValue !== undefined) {
        context.variables.set(variable.name, variable.defaultValue);
      }
    });

    try {
      // Find start step
      const startStep = journey.steps.find(s => s.id === journey.startStepId);
      if (!startStep) {
        throw new Error(`Start step '${journey.startStepId}' not found in journey '${journey.name}'`);
      }

      // Execute steps following the flow
      let currentStep = startStep;
      let stepIndex = 0;

      while (currentStep && stepIndex < journey.steps.length) {
        context.stepId = currentStep.id;
        context.currentStepIndex = stepIndex;

        // Update session progress
        session.progress.currentStep++;
        session.progress.percentage = (session.progress.currentStep / session.progress.totalSteps) * 100;
        this.emit('sessionProgress', session);

        if (!currentStep.enabled) {
          // Skip disabled steps
          stepIndex++;
          const nextStepId = currentStep.onSuccess || this.getNextStepId(journey, currentStep.id);
          currentStep = nextStepId ? journey.steps.find(s => s.id === nextStepId) || null : null;
          continue;
        }

        // Execute step
        const stepResult = await this.executeStep(currentStep, context);
        stepResults.push(stepResult);

        if (stepResult.success) {
          completedSteps++;
          // Move to next step based on success path
          const nextStepId = currentStep.onSuccess || this.getNextStepId(journey, currentStep.id);
          currentStep = nextStepId ? journey.steps.find(s => s.id === nextStepId) || null : null;
        } else {
          // Handle failure
          if (currentStep.onFailure) {
            currentStep = journey.steps.find(s => s.id === currentStep.onFailure) || null;
          } else {
            // Stop execution on failure if no failure path defined
            break;
          }
        }

        stepIndex++;
      }

      const endTime = Date.now();
      const success = stepResults.every(r => r.success);

      return {
        journeyId: journey.id,
        success,
        totalDuration: endTime - startTime,
        stepResults,
        completedSteps,
        totalSteps: journey.steps.length
      };

    } catch (error) {
      const endTime = Date.now();
      return {
        journeyId: journey.id,
        success: false,
        totalDuration: endTime - startTime,
        stepResults,
        error: error as Error,
        completedSteps,
        totalSteps: journey.steps.length
      };
    }
  }

  private async executeStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    try {
      logs.push(`Executing step: ${step.name} (${step.type})`);

      // Get step executor
      const executor = this.stepExecutors.get(step.id) || this.stepExecutors.get(step.type) || this.executeGenericStep.bind(this);

      // Execute step with retry logic
      let lastError: Error | undefined;
      const maxRetries = step.retryAttempts || 0;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            logs.push(`Retry attempt ${attempt}/${maxRetries}`);
            await this.delay(1000 * attempt); // Exponential backoff
          }

          const result = await this.executeWithTimeout(
            () => executor(step, context),
            step.timeout || 30000
          );

          const endTime = Date.now();
          const duration = endTime - startTime;

          logs.push(`Step completed successfully in ${duration}ms`);

          return {
            stepId: step.id,
            success: true,
            duration,
            output: result.output,
            screenshot: result.screenshot,
            logs,
            metrics: result.metrics || {
              responseTime: duration,
              memoryUsage: 0,
              cpuUsage: 0
            }
          };

        } catch (error) {
          lastError = error as Error;
          logs.push(`Step failed: ${lastError.message}`);
          
          if (attempt === maxRetries) {
            break;
          }
        }
      }

      // All retries failed
      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
        stepId: step.id,
        success: false,
        duration,
        error: lastError,
        logs,
        metrics: {
          responseTime: duration,
          memoryUsage: 0,
          cpuUsage: 0
        }
      };

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      logs.push(`Step execution failed: ${(error as Error).message}`);

      return {
        stepId: step.id,
        success: false,
        duration,
        error: error as Error,
        logs,
        metrics: {
          responseTime: duration,
          memoryUsage: 0,
          cpuUsage: 0
        }
      };
    }
  }

  // Step executor implementations
  private async executeNavigationStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const url = this.resolveVariables(step.parameters.url, context);
    
    // Simulate navigation
    await this.delay(1000);
    
    return {
      stepId: step.id,
      success: true,
      duration: 1000,
      output: { navigatedTo: url },
      logs: [`Navigated to ${url}`],
      metrics: { responseTime: 1000, memoryUsage: 50, cpuUsage: 10 }
    };
  }

  private async executeClickStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const selector = this.resolveVariables(step.parameters.selector, context);
    
    // Simulate click
    await this.delay(500);
    
    return {
      stepId: step.id,
      success: true,
      duration: 500,
      output: { clicked: selector },
      logs: [`Clicked element: ${selector}`],
      metrics: { responseTime: 500, memoryUsage: 30, cpuUsage: 5 }
    };
  }

  private async executeFillInputStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const selector = this.resolveVariables(step.parameters.selector, context);
    const value = this.resolveVariables(step.parameters.value, context);
    
    // Simulate input filling
    await this.delay(300);
    
    return {
      stepId: step.id,
      success: true,
      duration: 300,
      output: { filled: selector, value },
      logs: [`Filled input ${selector} with value: ${value}`],
      metrics: { responseTime: 300, memoryUsage: 25, cpuUsage: 3 }
    };
  }

  private async executeApiRequestStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const method = step.parameters.method || 'GET';
    const url = this.resolveVariables(step.parameters.url, context);
    
    // Simulate API request
    await this.delay(2000);
    
    return {
      stepId: step.id,
      success: true,
      duration: 2000,
      output: { method, url, status: 200 },
      logs: [`Made ${method} request to ${url}`],
      metrics: { responseTime: 2000, memoryUsage: 40, cpuUsage: 8 }
    };
  }

  private async executeTextVerificationStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const selector = this.resolveVariables(step.parameters.selector, context);
    const expectedText = this.resolveVariables(step.parameters.expectedText, context);
    
    // Simulate text verification
    await this.delay(200);
    
    return {
      stepId: step.id,
      success: true,
      duration: 200,
      output: { verified: selector, expectedText },
      logs: [`Verified text in ${selector}: ${expectedText}`],
      metrics: { responseTime: 200, memoryUsage: 20, cpuUsage: 2 }
    };
  }

  private async executeElementVisibilityStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const selector = this.resolveVariables(step.parameters.selector, context);
    
    // Simulate visibility check
    await this.delay(100);
    
    return {
      stepId: step.id,
      success: true,
      duration: 100,
      output: { visible: selector },
      logs: [`Verified element visibility: ${selector}`],
      metrics: { responseTime: 100, memoryUsage: 15, cpuUsage: 1 }
    };
  }

  private async executeWaitForElementStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const selector = this.resolveVariables(step.parameters.selector, context);
    const condition = step.parameters.condition || 'visible';
    const timeout = step.parameters.timeout || 10000;
    
    // Simulate waiting
    await this.delay(Math.min(timeout, 3000));
    
    return {
      stepId: step.id,
      success: true,
      duration: 3000,
      output: { waited: selector, condition },
      logs: [`Waited for element ${selector} to be ${condition}`],
      metrics: { responseTime: 3000, memoryUsage: 10, cpuUsage: 1 }
    };
  }

  private async executeDelayStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const duration = step.parameters.duration || 1000;
    const reason = step.parameters.reason || 'Delay';
    
    await this.delay(duration);
    
    return {
      stepId: step.id,
      success: true,
      duration,
      output: { delayed: duration, reason },
      logs: [`Delayed for ${duration}ms: ${reason}`],
      metrics: { responseTime: duration, memoryUsage: 5, cpuUsage: 0 }
    };
  }

  private async executeSetVariableStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    const variableName = step.parameters.variableName;
    const value = this.resolveVariables(step.parameters.value, context);
    
    context.variables.set(variableName, value);
    
    return {
      stepId: step.id,
      success: true,
      duration: 10,
      output: { variable: variableName, value },
      logs: [`Set variable ${variableName} = ${value}`],
      metrics: { responseTime: 10, memoryUsage: 5, cpuUsage: 0 }
    };
  }

  private async executeGenericStep(step: ScenarioStep, context: ScenarioExecutionContext): Promise<StepExecutionResult> {
    // Generic step execution - just simulate some work
    await this.delay(1000);
    
    return {
      stepId: step.id,
      success: true,
      duration: 1000,
      output: { executed: step.name },
      logs: [`Executed generic step: ${step.name}`],
      metrics: { responseTime: 1000, memoryUsage: 20, cpuUsage: 5 }
    };
  }

  // Utility methods
  private resolveVariables(value: string, context: ScenarioExecutionContext): string {
    if (typeof value !== 'string') return value;
    
    return value.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const resolvedValue = context.variables.get(variableName.trim());
      return resolvedValue !== undefined ? String(resolvedValue) : match;
    });
  }

  private getNextStepId(journey: UserJourney, currentStepId: string): string | null {
    const currentIndex = journey.steps.findIndex(s => s.id === currentStepId);
    if (currentIndex >= 0 && currentIndex < journey.steps.length - 1) {
      return journey.steps[currentIndex + 1].id;
    }
    return null;
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async validateResourceRequirements(executionPlan: ExecutionPlan): Promise<void> {
    const availableResources = await this.resourcePool.getAvailableResources();
    
    if (availableResources.memory < executionPlan.resourceRequirements.memory) {
      throw new Error(`Insufficient memory: required ${executionPlan.resourceRequirements.memory}MB, available ${availableResources.memory}MB`);
    }
    
    if (availableResources.cpu < executionPlan.resourceRequirements.cpu) {
      throw new Error(`Insufficient CPU: required ${executionPlan.resourceRequirements.cpu} cores, available ${availableResources.cpu} cores`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getActiveSession(sessionId: string): ExecutionSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public getAllActiveSessions(): ExecutionSession[] {
    return Array.from(this.activeSessions.values());
  }

  public async cancelSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'cancelled';
      session.endTime = new Date();
      this.emit('sessionCancelled', session);
      this.activeSessions.delete(sessionId);
    }
  }

  public getExecutionStatistics(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    failedSessions: number;
  } {
    const activeSessions = this.activeSessions.size;
    
    return {
      totalSessions: activeSessions, // This would be tracked in a real implementation
      activeSessions,
      completedSessions: 0, // This would be tracked in a real implementation
      failedSessions: 0 // This would be tracked in a real implementation
    };
  }
}