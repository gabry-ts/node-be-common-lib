import * as util from 'util';

// log levels enum
enum LogLevel {
  VERBOSE = 0,
  DEBUG = 1,
  LOG = 2,
  WARN = 3,
  ERROR = 4,
}

// colors for different log types - using brighter colors
const COLORS = {
  RESET: '\x1b[0m',
  TIMESTAMP: '\x1b[38;5;246m',
  LOG: '\x1b[38;5;46m', // bright green
  ERROR: '\x1b[38;5;196m', // bright red
  WARN: '\x1b[38;5;226m', // bright yellow
  DEBUG: '\x1b[38;5;213m', // bright magenta
  VERBOSE: '\x1b[38;5;51m', // bright cyan
  HTTP: '\x1b[38;5;226m', // bright yellow
};

// interface for logger config
interface LoggerConfig {
  level?: LogLevel;
  timestamp?: boolean;
}

/**
 * logger service class for creating formatted console logs with colors
 */
export class LoggerService {
  private context: string;
  private logLevel: LogLevel = LogLevel.VERBOSE;
  private showTimestamp: boolean = true;
  private isProduction: boolean = false;

  constructor(context: string, config: LoggerConfig = {}) {
    this.context = context;
    this.isProduction = process.env.NODE_ENV === 'production';

    const envLogLevel = this.getLogLevelFromEnv();

    if (this.isProduction && envLogLevel === undefined) {
      this.logLevel = LogLevel.ERROR;
    } else if (envLogLevel !== undefined) {
      this.logLevel = envLogLevel;
    } else if (config.level !== undefined) {
      this.logLevel = config.level;
    }

    if (config.timestamp !== undefined) {
      this.showTimestamp = config.timestamp;
    }
  }

  /**
   * get log level from environment variable
   */
  private getLogLevelFromEnv(): LogLevel | undefined {
    const envLevel = process.env.LOG_LEVEL;
    if (!envLevel) return undefined;

    switch (envLevel.toUpperCase()) {
      case 'VERBOSE':
        return LogLevel.VERBOSE;
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'LOG':
        return LogLevel.LOG;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return undefined;
    }
  }

  /**
   * set log level
   */
  setLogLevel(level: LogLevel): void {
    // only set if not overridden by env var
    if (this.getLogLevelFromEnv() === undefined) {
      this.logLevel = level;
    }
  }

  /**
   * log method for standard logs
   */
  log(...args: any[]): void {
    if (this.logLevel <= LogLevel.LOG) {
      this.printMessage(args, LogLevel.LOG);
    }
  }

  /**
   * error method for error logs
   */
  error(...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.printMessage(args, LogLevel.ERROR);
    }
  }

  /**
   * warn method for warning logs
   */
  warn(...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.printMessage(args, LogLevel.WARN);
    }
  }

  /**
   * debug method for debug logs
   */
  debug(...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.printMessage(args, LogLevel.DEBUG);
    }
  }

  /**
   * verbose method for verbose logs
   */
  verbose(...args: any[]): void {
    if (this.logLevel <= LogLevel.VERBOSE) {
      this.printMessage(args, LogLevel.VERBOSE);
    }
  }

  /**
   * http method for http logs
   */
  http(data: any): void {
    if (this.logLevel <= LogLevel.LOG) {
      this.printHttpMessage(data);
    }
  }

  /**
   * print formatted message with colors
   */
  private printMessage(args: any[], level: LogLevel): void {
    const color = this.getColorByLogLevel(level);

    let timestamp = '';
    if (this.showTimestamp) {
      timestamp = `${this.getTimestamp()} `;
    }

    const prefix = `${timestamp}[${this.context}]`;

    const formattedArgs = args
      .map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          return util.inspect(arg, { depth: null, colors: false });
        }
        return arg;
      })
      .join(' ');

    console.log(`${color}${prefix}${formattedArgs ? ' ' + formattedArgs : ''}${COLORS.RESET}`);
  }

  /**
   * print http message in json format
   */
  private printHttpMessage(data: any): void {
    // get timestamp if enabled
    let timestamp = '';
    if (this.showTimestamp) {
      timestamp = `${this.getTimestamp()} `;
    }

    const prefix = `${timestamp}[${this.context}] [HTTP]`;
    const jsonData = JSON.stringify(data);

    // entire line has same color
    console.log(`${COLORS.HTTP}${prefix} ${jsonData}${COLORS.RESET}`);
  }

  /**
   * get color code based on log level
   */
  private getColorByLogLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return COLORS.ERROR;
      case LogLevel.WARN:
        return COLORS.WARN;
      case LogLevel.DEBUG:
        return COLORS.DEBUG;
      case LogLevel.VERBOSE:
        return COLORS.VERBOSE;
      default:
        return COLORS.LOG;
    }
  }

  /**
   * get message type based on log level
   */
  private getMessageType(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return 'Error';
      case LogLevel.WARN:
        return 'Warn';
      case LogLevel.DEBUG:
        return 'Debug';
      case LogLevel.VERBOSE:
        return 'Verbose';
      default:
        return 'Normal';
    }
  }

  /**
   * get formatted timestamp in format HH:MM DD/MM/YY
   */
  private getTimestamp(): string {
    const now = new Date();

    // format: 23:59 DD/MM/YY
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  }
}

// export the enum for external use
export { LogLevel };
