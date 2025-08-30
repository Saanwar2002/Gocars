import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { LogTransport, LogTransportConfig, LogEntry } from '../LogTransport';

export interface HttpTransportConfig extends LogTransportConfig {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: { [key: string]: string };
  timeout?: number;
  batchSize?: number;
  flushInterval?: number;
  auth?: {
    username: string;
    password: string;
  } | {
    token: string;
  };
}

export class HttpTransport extends LogTransport {
  private config: HttpTransportConfig;
  private httpClient: AxiosInstance;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: HttpTransportConfig) {
    super(config);
    this.config = {
      method: 'POST',
      timeout: 5000,
      batchSize: 10,
      flushInterval: 5000,
      format: 'json',
      ...config
    };

    this.httpClient = this.createHttpClient();
    this.startFlushTimer();
  }

  private createHttpClient(): AxiosInstance {
    const axiosConfig: AxiosRequestConfig = {
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      }
    };

    if (this.config.auth) {
      if ('username' in this.config.auth) {
        axiosConfig.auth = {
          username: this.config.auth.username,
          password: this.config.auth.password
        };
      } else {
        axiosConfig.headers!['Authorization'] = `Bearer ${this.config.auth.token}`;
      }
    }

    return axios.create(axiosConfig);
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
      await this.sendLogs(logsToSend);
    });
  }

  private async sendLogs(logs: LogEntry[]): Promise<void> {
    const payload = this.formatLogsForTransport(logs);

    try {
      await this.httpClient.request({
        method: this.config.method,
        url: this.config.url,
        data: payload
      });
    } catch (error) {
      // Re-add logs to buffer if sending failed
      this.logBuffer.unshift(...logs);
      throw error;
    }
  }

  private formatLogsForTransport(logs: LogEntry[]): any {
    if (this.config.format === 'json') {
      return {
        logs: logs.map(log => ({
          timestamp: log.timestamp.toISOString(),
          level: log.level,
          message: log.message,
          context: log.context,
          metadata: log.metadata,
          error: log.error ? {
            name: log.error.name,
            message: log.error.message,
            stack: this.config.includeStackTrace ? log.error.stack : undefined
          } : undefined,
          requestId: log.requestId,
          userId: log.userId,
          sessionId: log.sessionId,
          component: log.component
        }))
      };
    } else {
      return {
        logs: logs.map(log => this.formatEntry(log))
      };
    }
  }

  public async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    await this.flush();
  }
}