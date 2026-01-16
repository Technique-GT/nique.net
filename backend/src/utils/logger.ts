import pino from 'pino';

const baseOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
};

export const logger =
  process.env.NODE_ENV === 'production'
    ? pino(baseOptions)
    : pino(baseOptions, pino.transport({ target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }));
