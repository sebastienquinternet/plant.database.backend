// import { createLogger } from './path/to/logger-service/dist';

// const logger = createLogger({ service: 'my-service', environment: 'prod' });

// logger.info('Hello world', { userId: 123 });
// logger.error('Oops', { err: { message: 'boom' } });

// - `LOG_LEVEL` — minimum level to emit (fatal,error,warn,success,info,debug,trace). Default `info`.
// - `SERVICE_NAME` — optional service name to include in logs.
// - `DD_SOURCE` — optional datadog source.
// - `ENVIRONMENT` — environment tag used for `ddtags`, default `local`.


export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'success';

export interface LoggerOptions {
  level?: LogLevel | string;
  service?: string;
  ddsource?: string;
  environment?: string;
}

const DEFAULT_LEVEL = 'info';

function nowIso() {
  return new Date().toISOString();
}

function levelPriority(level: string) {
  const map: Record<string, number> = {
    fatal: 0,
    error: 1,
    warn: 2,
    success: 3,
    info: 4,
    debug: 5,
    trace: 6,
  };
  return map[level] ?? 4;
}

export function createLogger(opts: LoggerOptions = {}) {
  const level = (opts.level || process.env.LOG_LEVEL || DEFAULT_LEVEL).toLowerCase();
  const service = opts.service || process.env.SERVICE_NAME || undefined;
  const ddsource = opts.ddsource || process.env.DD_SOURCE || undefined;
  const env = opts.environment || process.env.ENVIRONMENT || 'local';

  function shouldLog(msgLevel: string) {
    return levelPriority(msgLevel) <= levelPriority(level);
  }

  // Safe stringify to avoid circular structure errors when logging complex objects (AWS SDK errors contain circular refs)
  function safeStringify(obj: unknown) {
    const seen = new WeakSet();
    return JSON.stringify(obj, function (key, value) {
      // Serialize Error objects with useful fields
      if (value instanceof Error) {
        const err: Record<string, unknown> = {
          name: value.name,
          message: value.message,
          stack: (value as any).stack,
        };
        // copy enumerable properties (e.g., $metadata)
        for (const k of Object.keys(value as any)) {
          try {
            err[k] = (value as any)[k];
          } catch (_) {
            err[k] = '[unserializable]';
          }
        }
        return err;
      }

      if (value && typeof value === 'object') {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    });
  }

  function formatOutput(msgLevel: string, message: unknown, meta?: Record<string, unknown>) {
    const out: Record<string, unknown> = {
      timestamp: nowIso(),
      level: msgLevel,
      message,
    };
    if (service) out.service = service;
    if (ddsource) out.ddsource = ddsource;
    // Datadog tags field convention
    out.ddtags = `env:${env}`;
    if (meta && Object.keys(meta).length) out.meta = meta;
    return safeStringify(out);
  }

  return {
    fatal: (message: unknown, meta?: Record<string, unknown>) => {
      if (!shouldLog('fatal')) return;
      // fatal -> stderr
      console.error(formatOutput('fatal', message, meta));
    },
    error: (message: unknown, meta?: Record<string, unknown>) => {
      if (!shouldLog('error')) return;
      console.error(formatOutput('error', message, meta));
    },
    warn: (message: unknown, meta?: Record<string, unknown>) => {
      if (!shouldLog('warn')) return;
      console.warn(formatOutput('warn', message, meta));
    },
    info: (message: unknown, meta?: Record<string, unknown>) => {
      if (!shouldLog('info')) return;
      console.log(formatOutput('info', message, meta));
    },
    success: (message: unknown, meta?: Record<string, unknown>) => {
      if (!shouldLog('success')) return;
      console.log(formatOutput('success', message, meta));
    },
    debug: (message: unknown, meta?: Record<string, unknown>) => {
      if (!shouldLog('debug')) return;
      console.log(formatOutput('debug', message, meta));
    },
    trace: (message: unknown, meta?: Record<string, unknown>) => {
      if (!shouldLog('trace')) return;
      console.log(formatOutput('trace', message, meta));
    },
  };
}

export default createLogger;
