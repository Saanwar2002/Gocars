import axios, { AxiosInstance } from 'axios';
import { LogTransport, LogTransportConfig, LogEntry } from '../LogTransport';
import { LogLevel } from '../LogLevel';

export interface ElasticsearchTransportConfig extends LogTransportConfig {
  host: string;
  port?: number;
  index: string;
  type?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  batchSize?: number;
  flushInterval?: number;
  timeout?: number;
}

export class ElasticsearchTransport extends LogTransport {
  private config: ElasticsearchTransportConfig;
  private httpClient: AxiosInstance;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: ElasticsearchTransportConfig) {
    super(config);
    this.config = {
      port: 9200,
      type: '_doc',
      batchSize: 50,
      flushInterval: 5000,
      timeout: 10000,
      format: 'json',
      ...config
    };

    this.httpClient = this.createHttpClient();
    this.startFlushTimer();
  }

  private createHttpClient(): AxiosInstance {
    const baseURL = `http://${this.config.host}:${this.config.port}`;
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    // Authentication
    let auth: { username: string; password: string } | undefined;
    if (this.config.username && this.config.password) {
      auth = {
        username: this.config.username,
        password: this.config.password
      };
    } else if (this.config.apiKey) {
      headers['Authorization'] = `ApiKey ${this.config.apiKey}`;
    }

    return axios.create({
      baseURL,
      timeout: this.config.timeout,
      headers,
      auth
    });
  }

  public async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.config.batchSize!) {
      await this.flush();
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(async () => {
      if (this.logBuffer.length > 0) {
        await this.flush();
      }
    }, this.config.flushInterval);
  }

  public async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    await this.retryOperation(async () => {
      await this.sendToElasticsearch(logsToSend);
    });
  }

  private async sendToElasticsearch(logs: LogEntry[]): Promise<void> {
    const bulkBody = this.createBulkBody(logs);

    try {
      const response = await this.httpClient.post('/_bulk', bulkBody, {
        headers: {
          'Content-Type': 'application/x-ndjson'
        }
      });

      if (response.data.errors) {
        const errors = response.data.items
          .filter((item: any) => item.index && item.index.error)
          .map((item: any) => item.index.error);
        
        if (errors.length > 0) {
          throw new Error(`Elasticsearch bulk insert errors: ${JSON.stringify(errors)}`);
        }
      }
    } catch (error) {
      // Re-add logs to buffer if sending failed
      this.logBuffer.unshift(...logs);
      throw error;
    }
  }

  private createBulkBody(logs: LogEntry[]): string {
    const lines: string[] = [];

    for (const log of logs) {
      // Index action
      const indexAction = {
        index: {
          _index: this.getIndexName(log.timestamp),
          _type: this.config.type
        }
      };
      lines.push(JSON.stringify(indexAction));

      // Document
      const document = this.formatLogForElasticsearch(log);
      lines.push(JSON.stringify(document));
    }

    return lines.join('\n') + '\n';
  }

  private getIndexName(timestamp: Date): string {
    // Create daily indices: logs-2023-12-01
    const dateStr = timestamp.toISOString().split('T')[0];
    return `${this.config.index}-${dateStr}`;
  }

  private formatLogForElasticsearch(entry: LogEntry): any {
    const document: any = {
      '@timestamp': entry.timestamp.toISOString(),
      level: LogLevel[entry.level],
      level_value: entry.level,
      message: entry.message,
      component: entry.component,
      context: entry.context,
      request_id: entry.requestId,
      user_id: entry.userId,
      session_id: entry.sessionId,
      host: require('os').hostname(),
      service: 'gocars-testing-agent'
    };

    if (entry.metadata) {
      document.metadata = entry.metadata;
    }

    if (entry.error) {
      document.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: this.config.includeStackTrace ? entry.error.stack : undefined,
        type: entry.error.constructor.name
      };
    }

    // Add fields for better searching and filtering
    document.tags = [
      `level:${LogLevel[entry.level].toLowerCase()}`,
      entry.component ? `component:${entry.component}` : null,
      entry.context ? `context:${entry.context}` : null
    ].filter(Boolean);

    return document;
  }

  public async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    await this.flush();
  }

  public async createIndexTemplate(): Promise<void> {
    const template = {
      index_patterns: [`${this.config.index}-*`],
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        'index.lifecycle.name': 'logs-policy',
        'index.lifecycle.rollover_alias': this.config.index
      },
      mappings: {
        properties: {
          '@timestamp': { type: 'date' },
          level: { type: 'keyword' },
          level_value: { type: 'integer' },
          message: { type: 'text', analyzer: 'standard' },
          component: { type: 'keyword' },
          context: { type: 'keyword' },
          request_id: { type: 'keyword' },
          user_id: { type: 'keyword' },
          session_id: { type: 'keyword' },
          host: { type: 'keyword' },
          service: { type: 'keyword' },
          tags: { type: 'keyword' },
          metadata: { type: 'object', enabled: false },
          error: {
            properties: {
              name: { type: 'keyword' },
              message: { type: 'text' },
              stack: { type: 'text', index: false },
              type: { type: 'keyword' }
            }
          }
        }
      }
    };

    try {
      await this.httpClient.put(`/_index_template/${this.config.index}-template`, template);
    } catch (error) {
      console.warn('Failed to create Elasticsearch index template:', error);
    }
  }
}