interface LogContext {
  [key: string]: any;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    return level === 'warn' || level === 'error';
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const finalContext = error ? { error: error.message || error, ...context } : context;
      console.info(this.formatMessage('info', message, finalContext));
    }
  }

  warn(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      const finalContext = error ? { error: error.message || error, ...context } : context;
      console.warn(this.formatMessage('warn', message, finalContext));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = error ? { 
        error: error.message || error,
        stack: error.stack,
        ...context 
      } : context;
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  // For tracking user actions and analytics
  track(event: string, properties?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', `TRACK: ${event}`, properties));
    }
    // In production, this would send to analytics service
  }
}

export const logger = new Logger();