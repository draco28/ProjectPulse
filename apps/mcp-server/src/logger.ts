type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

const formatContext = (context?: Record<string, unknown>) =>
  context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';

export const createLogger = (level: LogLevel = 'info'): Logger => {
  const currentWeight = levelWeights[level];

  const log = (logLevel: LogLevel, message: string, context?: Record<string, unknown>) => {
    if (levelWeights[logLevel] < currentWeight) {
      return;
    }

    const payload = `[mcp-server] [${logLevel.toUpperCase()}] ${message}${formatContext(context)}`;

    switch (logLevel) {
      case 'debug':
      case 'info':
        console.log(payload);
        break;
      case 'warn':
        console.warn(payload);
        break;
      case 'error':
        console.error(payload);
        break;
    }
  };

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
  };
};
