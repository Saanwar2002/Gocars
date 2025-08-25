'use client';

import React, { useState, useEffect } from 'react';
import { ScenarioBuilder, TestScenario, UserJourney, ScenarioStep, ScenarioTemplate } from '../../scenarios/ScenarioBuilder';
import { ScenarioTestExecutionOrchestrator } from '../../scenarios/TestExecutionOrchestrator';

interface ScenarioManagerProps {
  scenarioBuilder: ScenarioBuilder;
  orchestrator: ScenarioTestExecutionOrchestrator;
}

interface ExecutionSession {
  id: string;
  scenarioId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    currentJourney: number;
    totalJourneys: number;
    currentStep: number;
    totalSteps: number;
    percentage: number;
  };
  startTime?: Date;
  endTime?: Date;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  scenarioBuilder,
  orchestrator
}) => {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [activeSessions, setActiveSessions] = useState<ExecutionSession[]>([]);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'templates' | 'execution'>('scenarios');
  const [isCreating, setIsCreating] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  useEffect(() => {
    loadData();
    setupEventListeners();
  }, []);

  const loadData = () => {
    setScenarios(scenarioBuilder.getAllScenarios());
    setTemplates(scenarioBuilder.getTemplates());
    setActiveSessions(orchestrator.getAllActiveSessions());
  };

  const setupEventListeners = () => {
    scenarioBuilder.on('scenarioCreated', loadData);
    scenarioBuilder.on('scenarioUpdated', loadData);
    scenarioBuilder.on('scenarioDeleted', loadData);
    
    orchestrator.on('sessionStarted', loadData);
    orchestrator.on('sessionCompleted', loadData);
    orchestrator.on('sessionFailed', loadData);
    orchestrator.on('sessionProgress', loadData);
  };

  const handleCreateScenario = async () => {
    if (!newScenarioName.trim()) return;

    try {
      const scenarioId = scenarioBuilder.createScenario({
        name: newScenarioName,
        category: 'functional',
        priority: 'medium'
      });
      
      setNewScenarioName('');
      setIsCreating(false);
      
      const newScenario = scenarioBuilder.getScenario(scenarioId);
      if (newScenario) {
        setSelectedScenario(newScenario);
      }
    } catch (error) {
      console.error('Failed to create scenario:', error);
      alert('Failed to create scenario: ' + (error as Error).message);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const scenarioId = scenarioBuilder.createFromTemplate(templateId, {
        name: `${template.name} - ${new Date().toLocaleDateString()}`
      });
      
      const newScenario = scenarioBuilder.getScenario(scenarioId);
      if (newScenario) {
        setSelectedScenario(newScenario);
        setActiveTab('scenarios');
      }
    } catch (error) {
      console.error('Failed to create scenario from template:', error);
      alert('Failed to create scenario from template: ' + (error as Error).message);
    }
  };

  const handleExecuteScenario = async (scenarioId: string) => {
    try {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) return;

      // Get variables from user (simplified - in real app would be a form)
      const variables: Record<string, any> = {};
      
      // Add some default variables based on scenario type
      if (scenario.name.toLowerCase().includes('registration')) {
        variables['user.email'] = 'test@example.com';
        variables['user.password'] = 'testpassword123';
      } else if (scenario.name.toLowerCase().includes('booking')) {
        variables['booking.pickupLocation'] = 'Test Pickup Location';
        variables['booking.destination'] = 'Test Destination';
      }

      await orchestrator.executeScenario(scenarioId, { variables });
      
    } catch (error) {
      console.error('Failed to execute scenario:', error);
      alert('Failed to execute scenario: ' + (error as Error).message);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    try {
      scenarioBuilder.deleteScenario(scenarioId);
      if (selectedScenario?.id === scenarioId) {
        setSelectedScenario(null);
      }
    } catch (error) {
      console.error('Failed to delete scenario:', error);
      alert('Failed to delete scenario: ' + (error as Error).message);
    }
  };

  const handleCloneScenario = async (scenarioId: string) => {
    try {
      const newScenarioId = scenarioBuilder.cloneScenario(scenarioId);
      const clonedScenario = scenarioBuilder.getScenario(newScenarioId);
      if (clonedScenario) {
        setSelectedScenario(clonedScenario);
      }
    } catch (error) {
      console.error('Failed to clone scenario:', error);
      alert('Failed to clone scenario: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎭 Scenario Manager</h1>
        <p className="text-gray-600">Create, manage, and execute test scenarios</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'scenarios', label: 'Scenarios', icon: '📋' },
            { id: 'templates', label: 'Templates', icon: '📄' },
            { id: 'execution', label: 'Execution', icon: '⚡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Scenarios</h2>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    + New
                  </button>
                </div>
              </div>
              
              {isCreating && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Scenario name..."
                    value={newScenarioName}
                    onChange={(e) => setNewScenarioName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateScenario()}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateScenario}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewScenarioName('');
                      }}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedScenario?.id === scenario.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{scenario.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{scenario.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(scenario.priority)}`}>
                            {scenario.priority}
                          </span>
                          <span className="text-xs text-gray-500">{scenario.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {scenarios.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No scenarios created yet.</p>
                    <p className="text-sm mt-1">Click "New" to create your first scenario.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scenario Details */}
          <div className="lg:col-span-2">
            {selectedScenario ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedScenario.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">{selectedScenario.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExecuteScenario(selectedScenario.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        ▶️ Execute
                      </button>
                      <button
                        onClick={() => handleCloneScenario(selectedScenario.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        📋 Clone
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(selectedScenario.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <p className="text-sm text-gray-900">{selectedScenario.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedScenario.priority)}`}>
                        {selectedScenario.priority}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">User Journeys ({selectedScenario.userJourneys.length})</h3>
                    <div className="space-y-2">
                      {selectedScenario.userJourneys.map((journey) => (
                        <div key={journey.id} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{journey.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{journey.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{journey.steps.length} steps</p>
                              <p className="text-xs text-gray-500">{Math.round(journey.estimatedDuration / 1000)}s</p>
                            </div>
                          </div>
                          
                          {journey.steps.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1">Steps:</p>
                              <div className="flex flex-wrap gap-1">
                                {journey.steps.slice(0, 5).map((step, index) => (
                                  <span key={step.id} className="px-2 py-1 bg-white text-xs rounded border">
                                    {index + 1}. {step.name}
                                  </span>
                                ))}
                                {journey.steps.length > 5 && (
                                  <span className="px-2 py-1 bg-white text-xs rounded border text-gray-500">
                                    +{journey.steps.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {selectedScenario.userJourneys.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No user journeys defined</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Execution Settings</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Parallel Execution:</span>
                        <span className="ml-2 font-medium">
                          {selectedScenario.executionSettings.parallelExecution ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Concurrent Users:</span>
                        <span className="ml-2 font-medium">{selectedScenario.executionSettings.maxConcurrentUsers}</span>
                      </div>
                    </div>
                  </div>

                  {selectedScenario.tags && selectedScenario.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedScenario.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Scenario Selected</h3>
                <p className="text-gray-500">Select a scenario from the list to view its details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  {template.category}
                </span>
              </div>
              
              {template.tags && template.tags.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => handleCreateFromTemplate(template.id)}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Create from Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Execution Tab */}
      {activeTab === 'execution' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Executions</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {scenarios.find(s => s.id === session.scenarioId)?.name || 'Unknown Scenario'}
                      </h3>
                      <p className="text-sm text-gray-500">Session: {session.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(session.progress.percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${session.progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span>Journey:</span>
                      <span className="ml-1 font-medium">
                        {session.progress.currentJourney}/{session.progress.totalJourneys}
                      </span>
                    </div>
                    <div>
                      <span>Step:</span>
                      <span className="ml-1 font-medium">
                        {session.progress.currentStep}/{session.progress.totalSteps}
                      </span>
                    </div>
                  </div>
                  
                  {session.startTime && (
                    <div className="text-xs text-gray-500 mt-2">
                      Started: {session.startTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
              
              {activeSessions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p>No active executions</p>
                  <p className="text-sm mt-1">Execute a scenario to see it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};