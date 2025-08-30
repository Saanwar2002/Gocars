import { EventEmitter } from 'events';

export interface MetricValue {
  value: number;
  labels?: { [key: string]: string };
  timestamp?: Date;
}

export interface CounterMetric {
  name: string;
  help: string;
  labels?: string[];
  value: number;
}

export interface GaugeMetric {
  name: string;
  help: string;
  labels?: string[];
  value: number;
}

export interface HistogramMetric {
  name: string;
  help: string;
  labels?: string[];
  buckets: number[];
  values: { [key: string]: number };
}

export class PrometheusMetrics extends EventEmitter {
  private counters: Map<string, CounterMetric> = new Map();
  private gauges: Map<string, GaugeMetric> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();
  private labelValues: Map<string, Map<string, number>> = new Map();

  constructor() {
    super();
    this.setupDefaultMetrics();
  }

  private setupDefaultMetrics(): void {
    // Test execution metrics
    this.createCounter('test_executions_total', 'Total number of test executions', ['suite', 'status']);
    this.createCounter('test_successes_total', 'Total number of successful tests', ['suite']);
    this.createCounter('test_failures_total', 'Total number of failed tests', ['suite', 'error_type']);
    this.createCounter('test_errors_total', 'Total number of test errors', ['suite', 'category']);

    // Virtual user metrics
    this.createGauge('active_virtual_users', 'Number of active virtual users', ['profile_type']);
    this.createGauge('active_test_sessions', 'Number of active test sessions');

    // Performance metrics
    this.createHistogram('test_duration_seconds', 'Test execution duration in seconds', ['suite'], 
      [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300]);
    this.createHistogram('api_request_duration_seconds', 'API request duration in seconds', ['endpoint', 'method'],
      [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]);

    // System metrics
    this.createGauge('memory_usage_bytes', 'Memory usage in bytes', ['type']);
    this.createGauge('cpu_usage_percent', 'CPU usage percentage');
    this.createGauge('event_loop_lag_seconds', 'Event loop lag in seconds');

    // Error metrics
    this.createCounter('auto_fixes_applied_total', 'Total number of auto-fixes applied', ['fix_type']);
    this.createCounter('auto_fixes_failed_total', 'Total number of failed auto-fix attempts', ['fix_type', 'reason']);

    // Business metrics
    this.createGauge('test_coverage_percent', 'Test coverage percentage', ['component']);
    this.createGauge('system_health_score', 'Overall system health score');
  }

  public createCounter(name: string, help: string, labels: string[] = []): void {
    this.counters.set(name, {
      name,
      help,
      labels,
      value: 0
    });
  }

  public createGauge(name: string, help: string, labels: string[] = []): void {
    this.gauges.set(name, {
      name,
      help,
      labels,
      value: 0
    });
  }

  public createHistogram(name: string, help: string, labels: string[] = [], buckets: number[] = []): void {
    this.histograms.set(name, {
      name,
      help,
      labels,
      buckets,
      values: {}
    });
  }

  public incrementCounter(name: string, labels: { [key: string]: string } = {}, value: number = 1): void {
    const counter = this.counters.get(name);
    if (!counter) {
      console.warn(`Counter ${name} not found`);
      return;
    }

    const labelKey = this.getLabelKey(labels);
    const fullKey = `${name}${labelKey}`;
    
    const currentValue = this.labelValues.get(fullKey)?.get('value') || 0;
    
    if (!this.labelValues.has(fullKey)) {
      this.labelValues.set(fullKey, new Map());
    }
    
    this.labelValues.get(fullKey)!.set('value', currentValue + value);
    counter.value += value;

    this.emit('metricUpdated', { type: 'counter', name, labels, value: currentValue + value });
  }

  public setGauge(name: string, value: number, labels: { [key: string]: string } = {}): void {
    const gauge = this.gauges.get(name);
    if (!gauge) {
      console.warn(`Gauge ${name} not found`);
      return;
    }

    const labelKey = this.getLabelKey(labels);
    const fullKey = `${name}${labelKey}`;
    
    if (!this.labelValues.has(fullKey)) {
      this.labelValues.set(fullKey, new Map());
    }
    
    this.labelValues.get(fullKey)!.set('value', value);
    gauge.value = value;

    this.emit('metricUpdated', { type: 'gauge', name, labels, value });
  }

  public observeHistogram(name: string, value: number, labels: { [key: string]: string } = {}): void {
    const histogram = this.histograms.get(name);
    if (!histogram) {
      console.warn(`Histogram ${name} not found`);
      return;
    }

    const labelKey = this.getLabelKey(labels);
    const fullKey = `${name}${labelKey}`;
    
    if (!this.labelValues.has(fullKey)) {
      this.labelValues.set(fullKey, new Map());
    }

    const labelMap = this.labelValues.get(fullKey)!;
    
    // Update bucket counts
    for (const bucket of histogram.buckets) {
      const bucketKey = `le_${bucket}`;
      if (value <= bucket) {
        const currentCount = labelMap.get(bucketKey) || 0;
        labelMap.set(bucketKey, currentCount + 1);
      }
    }

    // Update +Inf bucket
    const infCount = labelMap.get('le_+Inf') || 0;
    labelMap.set('le_+Inf', infCount + 1);

    // Update sum and count
    const currentSum = labelMap.get('sum') || 0;
    const currentCount = labelMap.get('count') || 0;
    labelMap.set('sum', currentSum + value);
    labelMap.set('count', currentCount + 1);

    this.emit('metricUpdated', { type: 'histogram', name, labels, value });
  }

  private getLabelKey(labels: { [key: string]: string }): string {
    if (Object.keys(labels).length === 0) {
      return '';
    }

    const sortedLabels = Object.keys(labels).sort().map(key => `${key}="${labels[key]}"`);
    return `{${sortedLabels.join(',')}}`;
  }

  public getMetricsText(): string {
    let output = '';

    // Export counters
    for (const [name, counter] of this.counters.entries()) {
      output += `# HELP ${name} ${counter.help}\n`;
      output += `# TYPE ${name} counter\n`;
      
      if (counter.labels && counter.labels.length > 0) {
        // Export labeled metrics
        for (const [fullKey, labelMap] of this.labelValues.entries()) {
          if (fullKey.startsWith(name)) {
            const labelPart = fullKey.substring(name.length);
            const value = labelMap.get('value') || 0;
            output += `${name}${labelPart} ${value}\n`;
          }
        }
      } else {
        // Export simple counter
        output += `${name} ${counter.value}\n`;
      }
      output += '\n';
    }

    // Export gauges
    for (const [name, gauge] of this.gauges.entries()) {
      output += `# HELP ${name} ${gauge.help}\n`;
      output += `# TYPE ${name} gauge\n`;
      
      if (gauge.labels && gauge.labels.length > 0) {
        // Export labeled metrics
        for (const [fullKey, labelMap] of this.labelValues.entries()) {
          if (fullKey.startsWith(name)) {
            const labelPart = fullKey.substring(name.length);
            const value = labelMap.get('value') || 0;
            output += `${name}${labelPart} ${value}\n`;
          }
        }
      } else {
        // Export simple gauge
        output += `${name} ${gauge.value}\n`;
      }
      output += '\n';
    }

    // Export histograms
    for (const [name, histogram] of this.histograms.entries()) {
      output += `# HELP ${name} ${histogram.help}\n`;
      output += `# TYPE ${name} histogram\n`;
      
      for (const [fullKey, labelMap] of this.labelValues.entries()) {
        if (fullKey.startsWith(name)) {
          const labelPart = fullKey.substring(name.length);
          
          // Export buckets
          for (const bucket of histogram.buckets) {
            const bucketCount = labelMap.get(`le_${bucket}`) || 0;
            const bucketLabel = labelPart ? `${labelPart.slice(0, -1)},le="${bucket}"}` : `{le="${bucket}"}`;
            output += `${name}_bucket${bucketLabel} ${bucketCount}\n`;
          }
          
          // Export +Inf bucket
          const infCount = labelMap.get('le_+Inf') || 0;
          const infLabel = labelPart ? `${labelPart.slice(0, -1)},le="+Inf"}` : `{le="+Inf"}`;
          output += `${name}_bucket${infLabel} ${infCount}\n`;
          
          // Export sum and count
          const sum = labelMap.get('sum') || 0;
          const count = labelMap.get('count') || 0;
          output += `${name}_sum${labelPart} ${sum}\n`;
          output += `${name}_count${labelPart} ${count}\n`;
        }
      }
      output += '\n';
    }

    return output;
  }

  public getMetricsJSON(): any {
    const metrics: any = {
      counters: {},
      gauges: {},
      histograms: {}
    };

    // Export counters
    for (const [name, counter] of this.counters.entries()) {
      metrics.counters[name] = {
        help: counter.help,
        labels: counter.labels,
        value: counter.value,
        labelValues: {}
      };

      for (const [fullKey, labelMap] of this.labelValues.entries()) {
        if (fullKey.startsWith(name)) {
          const labelPart = fullKey.substring(name.length);
          metrics.counters[name].labelValues[labelPart] = labelMap.get('value') || 0;
        }
      }
    }

    // Export gauges
    for (const [name, gauge] of this.gauges.entries()) {
      metrics.gauges[name] = {
        help: gauge.help,
        labels: gauge.labels,
        value: gauge.value,
        labelValues: {}
      };

      for (const [fullKey, labelMap] of this.labelValues.entries()) {
        if (fullKey.startsWith(name)) {
          const labelPart = fullKey.substring(name.length);
          metrics.gauges[name].labelValues[labelPart] = labelMap.get('value') || 0;
        }
      }
    }

    // Export histograms
    for (const [name, histogram] of this.histograms.entries()) {
      metrics.histograms[name] = {
        help: histogram.help,
        labels: histogram.labels,
        buckets: histogram.buckets,
        labelValues: {}
      };

      for (const [fullKey, labelMap] of this.labelValues.entries()) {
        if (fullKey.startsWith(name)) {
          const labelPart = fullKey.substring(name.length);
          metrics.histograms[name].labelValues[labelPart] = Object.fromEntries(labelMap);
        }
      }
    }

    return metrics;
  }

  public reset(): void {
    // Reset all metric values
    for (const counter of this.counters.values()) {
      counter.value = 0;
    }
    
    for (const gauge of this.gauges.values()) {
      gauge.value = 0;
    }
    
    this.labelValues.clear();
  }

  public recordTestExecution(suite: string, status: 'success' | 'failure' | 'error', duration: number): void {
    this.incrementCounter('test_executions_total', { suite, status });
    
    if (status === 'success') {
      this.incrementCounter('test_successes_total', { suite });
    } else if (status === 'failure') {
      this.incrementCounter('test_failures_total', { suite, error_type: 'assertion' });
    } else {
      this.incrementCounter('test_errors_total', { suite, category: 'runtime' });
    }
    
    this.observeHistogram('test_duration_seconds', duration, { suite });
  }

  public recordAPIRequest(endpoint: string, method: string, duration: number): void {
    this.observeHistogram('api_request_duration_seconds', duration, { endpoint, method });
  }

  public updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.setGauge('memory_usage_bytes', memUsage.heapUsed, { type: 'heap_used' });
    this.setGauge('memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });
    this.setGauge('memory_usage_bytes', memUsage.rss, { type: 'rss' });
    this.setGauge('memory_usage_bytes', memUsage.external, { type: 'external' });

    // Measure event loop lag
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000000; // Convert to seconds
      this.setGauge('event_loop_lag_seconds', lag);
    });
  }

  public startSystemMetricsCollection(interval: number = 10000): NodeJS.Timeout {
    return setInterval(() => {
      this.updateSystemMetrics();
    }, interval);
  }
}