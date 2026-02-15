const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  private shouldLog(level: string): boolean {
    const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
    return logLevels[level as keyof typeof logLevels] <= logLevels[LOG_LEVEL as keyof typeof logLevels];
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
