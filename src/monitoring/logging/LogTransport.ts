import { LogLevel } from './LogLevel';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: any;
  error?: Error;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
}

export interface LogTransportConfig {
  level: LogLevel;
  format?: 'json' | 'text' | 'structured';
  includeStackTrace?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export abstract class LogTransport {
  protected config: LogTransportConfig;

  constructor(config: LogTransportConfig) {
    this.config = {
      format: 'json',
      includeStackTrace: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  public shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  public abstract log(entry: LogEntry): Promise<void>;

  protected formatEntry(entry: LogEntry): string {
    switch (this.config.format) {
      case 'json':
        return this.formatAsJson(entry);
      case 'structured':
        return this.formatAsStructured(entry);
      case 'text':
      default:
        return this.formatAsText(entry);
    }
  }

  private formatAsJson(entry: LogEntry): string {
    const logObject: any = {
      timestamp: entry.timestamp.toISOString(),
      level: LogLevel[entry.level],
      message: entry.message,
      component: entry.component,
      context: entry.context,
      requestId: entry.requestId,
      userId: entry.userId,
      sessionId: entry.sessionId
    };

    if (entry.metadata) {
      logObject.metadata = entry.metadata;
    }

    if (entry.error) {
      logObject.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: this.config.includeStackTrace ? entry.error.stack : undefined
      };
    }

    return JSON.stringify(logObject);
  }

  private formatAsStructured(entry: LogEntry): string {
    const parts: string[] = [
      `timestamp=${entry.timestamp.toISOString()}`,
      `level=${LogLevel[entry.level]}`,
      `message="${entry.message}"`,
    ];

    if (entry.component) parts.push(`component=${entry.component}`);
    if (entry.context) parts.push(`context=${entry.context}`);
    if (entry.requestId) parts.push(`requestId=${entry.requestId}`);
    if (entry.userId) parts.push(`userId=${entry.userId}`);
    if (entry.sessionId) parts.push(`sessionId=${entry.sessionId}`);

    if (entry.error) {
      parts.push(`error.name=${entry.error.name}`);
      parts.push(`error.message="${entry.error.message}"`);
      if (this.config.includeStackTrace && entry.error.stack) {
        parts.push(`error.stack="${entry.error.stack.replace(/\n/g, '\\n')}"`);
      }
    }

    if (entry.metadata) {
      parts.push(`metadata=${JSON.stringify(entry.metadata)}`);
    }

    return parts.join(' ');
  }

  private formatAsText(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const component = entry.component ? `[${entry.component}]` : '';
    const context = entry.context ? `(${entry.context})` : '';
    const requestId = entry.requestId ? `{${entry.requestId}}` : '';
    
    let message = `${timestamp} ${level} ${component}${context}${requestId} ${entry.message}`;

    if (entry.metadata) {
      message += ` | metadata: ${JSON.stringify(entry.metadata)}`;
    }

    if (entry.error) {
      message += ` | error: ${entry.error.name}: ${entry.error.message}`;
      if (this.config.includeStackTrace && entry.error.stack) {
        message += `\n${entry.error.stack}`;
      }
    }

    return message;
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelay || 1000);
        }
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}