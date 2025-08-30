import { LogTransport, LogTransportConfig, LogEntry } from '../LogTransport';
import { LogLevel, LogLevelColors } from '../LogLevel';

export interface ConsoleTransportConfig extends LogTransportConfig {
  colorize?: boolean;
  timestamp?: boolean;
}

export class ConsoleTransport extends LogTransport {
  private config: ConsoleTransportConfig;

  constructor(config: ConsoleTransportConfig) {
    super(config);
    this.config = {
      colorize: true,
      timestamp: true,
      format: 'text',
      ...config
    };
  }

  public async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedMessage = this.formatForConsole(entry);
    
    // Use appropriate console method based on log level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  private formatForConsole(entry: LogEntry): string {
    const resetColor = '\x1b[0m';
    const timestamp = this.config.timestamp ? 
      `${entry.timestamp.toISOString()} ` : '';
    
    const levelName = LogLevel[entry.level].padEnd(5);
    const colorizedLevel = this.config.colorize ? 
      `${LogLevelColors[entry.level]}${levelName}${resetColor}` : levelName;
    
    const component = entry.component ? 
      `[${this.config.colorize ? '\x1b[34m' : ''}${entry.component}${this.config.colorize ? resetColor : ''}]` : '';
    
    const context = entry.context ? 
      `(${this.config.colorize ? '\x1b[90m' : ''}${entry.context}${this.config.colorize ? resetColor : ''})` : '';
    
    const requestId = entry.requestId ? 
      `{${this.config.colorize ? '\x1b[36m' : ''}${entry.requestId}${this.config.colorize ? resetColor : ''}}` : '';
    
    let message = `${timestamp}${colorizedLevel} ${component}${context}${requestId} ${entry.message}`;

    if (entry.metadata) {
      const metadataStr = JSON.stringify(entry.metadata, null, 2);
      message += `\n${this.config.colorize ? '\x1b[90m' : ''}metadata: ${metadataStr}${this.config.colorize ? resetColor : ''}`;
    }

    if (entry.error) {
      const errorColor = this.config.colorize ? '\x1b[31m' : '';
      message += `\n${errorColor}error: ${entry.error.name}: ${entry.error.message}${this.config.colorize ? resetColor : ''}`;
      
      if (this.config.includeStackTrace && entry.error.stack) {
        message += `\n${errorColor}${entry.error.stack}${this.config.colorize ? resetColor : ''}`;
      }
    }

    return message;
  }
}