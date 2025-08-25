'use client';

import React, { useState, useEffect } from 'react';
import { PerformanceAnalyzer, PerformanceReport, TrendAnalysisResult, BottleneckAnalysis, PerformanceRegression } from '../../performance/PerformanceAnalyzer';

interface PerformanceDashboardProps {
  analyzer: PerformanceAnalyzer;
  refreshInterval?: number; // milliseconds
}

interface DashboardState {
  currentReport: PerformanceReport | null;
  selectedTimeRange: TimeRange;
  selectedMetrics: string[];
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;
}

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

const TIME_RANGES: TimeRange[] = [
  {
    start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    end: new Date(),
    label: 'Last Hour'
  },
  {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    end: new Date(),
    label: 'Last 24 Hours'
  },
  {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
    end: new Date(),
    label: 'Last Week'
  },
  {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last month
    end: new Date(),
    label: 'Last Month'
  }
];

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  analyzer,
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [state, setState] = useState<DashboardState>({
    currentReport: null,
    selectedTimeRange: TIME_RANGES[1], // Default to last 24 hours
    selectedMetrics: [],
    isLoading: false,
    error: null,
    autoRefresh: true
  });

  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableMetrics();
    generateReport();
  }, []);

  useEffect(() => {
    if (state.autoRefresh) {
      const interval = setInterval(() => {
        generateReport();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [state.autoRefresh, state.selectedTimeRange, refreshInterval]);

  const loadAvailableMetrics = () => {
    const metrics = analyzer.getAvailableMetrics();
    setAvailableMetrics(metrics);
    setState(prev => ({
      ...prev,
      selectedMetrics: metrics.slice(0, 5) // Select first 5 metrics by default
    }));
  };

  const generateReport = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const report = await analyzer.generatePerformanceReport(state.selectedTimeRange, {
        includeComparisons: true,
        previousPeriodDays: 7,
        detailLevel: 'comprehensive'
      });

      setState(prev => ({
        ...prev,
        currentReport: report,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate report',
        isLoading: false
      }));
    }
  };

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setState(prev => ({ ...prev, selectedTimeRange: timeRange }));
    generateReport();
  };

  const handleMetricToggle = (metric: string) => {
    setState(prev => ({
      ...prev,
      selectedMetrics: prev.selectedMetrics.includes(metric)
        ? prev.selectedMetrics.filter(m => m !== metric)
        : [...prev.selectedMetrics, metric]
    }));
  };

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Performance Dashboard</h1>
            <p className="text-gray-600">Real-time performance analysis and monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={state.autoRefresh}
                onChange={(e) => setState(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="auto-refresh" className="text-sm text-gray-700">Auto-refresh</label>
            </div>
            <button
              onClick={generateReport}
              disabled={state.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {state.isLoading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => handleTimeRangeChange(range)}
              className={`px-3 py-1 text-sm rounded-md ${
                state.selectedTimeRange.label === range.label
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <span className="mr-2">❌</span>
            <span>{state.error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {state.isLoading && !state.currentReport && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating performance report...</p>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {state.currentReport && (
        <div className="space-y-6">
          {/* Overall Health Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(state.currentReport.summary.overallHealth)}`}>
                  {state.currentReport.summary.overallHealth.toUpperCase()}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{state.currentReport.summary.healthScore}</p>
                <p className="text-sm text-gray-600">Health Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{state.currentReport.summary.criticalIssues}</p>
                <p className="text-sm text-gray-600">Critical Issues</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{state.currentReport.summary.regressions}</p>
                <p className="text-sm text-gray-600">Regressions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{state.currentReport.summary.improvements}</p>
                <p className="text-sm text-gray-600">Improvements</p>
              </div>
            </div>
            
            {/* Key Findings */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Key Findings</h3>
              <div className="space-y-2">
                {state.currentReport.summary.keyFindings.map((finding, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <span className="mr-2">•</span>
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {state.currentReport.trendAnalysis.slice(0, 4).map((trend, index) => (
                <TrendCard key={index} trend={trend} />
              ))}
            </div>
          </div>

          {/* Bottlenecks */}
          {state.currentReport.bottlenecks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Bottlenecks</h2>
              <div className="space-y-4">
                {state.currentReport.bottlenecks.slice(0, 5).map((bottleneck, index) => (
                  <BottleneckCard key={index} bottleneck={bottleneck} />
                ))}
              </div>
            </div>
          )}

          {/* Regressions */}
          {state.currentReport.regressions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Regressions</h2>
              <div className="space-y-4">
                {state.currentReport.regressions.slice(0, 5).map((regression, index) => (
                  <RegressionCard key={index} regression={regression} />
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
            <div className="space-y-4">
              {state.currentReport.recommendations.slice(0, 5).map((recommendation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(recommendation.priority)}`}>
                          {recommendation.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{recommendation.category}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">{recommendation.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="font-medium text-gray-700">Impact:</span>
                          <p className="text-gray-600 mt-1">{recommendation.impact.performance}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Effort:</span>
                          <p className="text-gray-600 mt-1">{recommendation.implementation.effort} effort, {recommendation.implementation.timeframe}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Expected Outcome:</span>
                          <p className="text-gray-600 mt-1">{recommendation.expectedOutcome.improvement}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metric Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableMetrics.map((metric) => (
                <label key={metric} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.selectedMetrics.includes(metric)}
                    onChange={() => handleMetricToggle(metric)}
                    className="rounded"
                  />
                  <span className="text-gray-700">{metric.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Supporting Components
const TrendCard: React.FC<{ trend: TrendAnalysisResult }> = ({ trend }) => {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      case 'volatile': return '📊';
      default: return '📊';
    }
  };

  const getTrendColor = (direction: string, metric: string) => {
    const isGoodIncrease = metric.includes('throughput') || metric.includes('success');
    const isBadIncrease = metric.includes('response_time') || metric.includes('error');
    
    if (direction === 'increasing') {
      return isGoodIncrease ? 'text-green-600' : isBadIncrease ? 'text-red-600' : 'text-blue-600';
    } else if (direction === 'decreasing') {
      return isGoodIncrease ? 'text-red-600' : isBadIncrease ? 'text-green-600' : 'text-blue-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{trend.metric.replace(/_/g, ' ')}</h3>
        <span className="text-2xl">{getTrendIcon(trend.trend.direction)}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Trend:</span>
          <span className={`font-medium ${getTrendColor(trend.trend.direction, trend.metric)}`}>
            {trend.trend.direction} ({trend.trend.changeRate.toFixed(1)}%)
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Confidence:</span>
          <span className="font-medium">{(trend.trend.confidence * 100).toFixed(0)}%</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Average:</span>
          <span className="font-medium">{trend.statistics.mean.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">P95:</span>
          <span className="font-medium">{trend.statistics.percentiles.p95.toFixed(2)}</span>
        </div>
      </div>
      
      {trend.anomalies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-sm text-orange-600">
            <span className="mr-1">⚠️</span>
            <span>{trend.anomalies.length} anomal{trend.anomalies.length === 1 ? 'y' : 'ies'} detected</span>
          </div>
        </div>
      )}
    </div>
  );
};

const BottleneckCard: React.FC<{ bottleneck: BottleneckAnalysis }> = ({ bottleneck }) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-gray-900">{bottleneck.component}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bottleneck.severity)}`}>
              {bottleneck.severity}
            </span>
          </div>
          <p className="text-sm text-gray-600">{bottleneck.rootCause.primary}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Priority: {bottleneck.priority}/10</p>
          <p className="text-xs text-gray-500">{bottleneck.estimatedResolutionTime}min to resolve</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-600">Performance Impact:</span>
          <p className="font-medium text-red-600">{bottleneck.impact.performanceDegradation.toFixed(1)}%</p>
        </div>
        <div>
          <span className="text-gray-600">User Impact:</span>
          <p className="font-medium">{bottleneck.impact.userImpact}</p>
        </div>
      </div>
      
      {bottleneck.recommendations.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">Top Recommendation:</p>
          <p className="text-sm text-gray-600">{bottleneck.recommendations[0].description}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>Effort: {bottleneck.recommendations[0].effort}</span>
            <span>Cost: {bottleneck.recommendations[0].cost}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const RegressionCard: React.FC<{ regression: PerformanceRegression }> = ({ regression }) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-gray-900">{regression.metric.replace(/_/g, ' ')}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(regression.severity)}`}>
              {regression.severity}
            </span>
          </div>
          <p className="text-sm text-gray-600">Performance degradation detected</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-red-600">-{regression.degradation.percentage.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">vs baseline</p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm mb-3">
        <div>
          <span className="text-gray-600">User Impact:</span>
          <p className="text-gray-900">{regression.userImpact}</p>
        </div>
        <div>
          <span className="text-gray-600">Business Impact:</span>
          <p className="text-gray-900">{regression.businessImpact}</p>
        </div>
      </div>
      
      {regression.possibleCauses.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">Most Likely Cause:</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{regression.possibleCauses[0].description}</p>
            <span className="text-xs text-gray-500">
              {(regression.possibleCauses[0].likelihood * 100).toFixed(0)}% likely
            </span>
          </div>
        </div>
      )}
    </div>
  );
};