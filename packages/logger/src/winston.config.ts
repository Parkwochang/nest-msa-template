import * as winston from 'winston';
import type { LoggerOptions } from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');

import { customColors } from './winston.constants';
import { developmentFormat, enrichCommonFields } from './winston.format';

// ----------------------------------------------------------------------------

const { combine, timestamp, colorize, errors, json } = winston.format;
winston.addColors(customColors);

export interface WinstonConfigOptions {
  serviceName: string;
  level?: string;
  nodeEnv?: string;
  fileLog?: {
    enabled?: boolean;
    dir?: string;
    maxSize?: string;
    maxFiles?: string;
    errorMaxSize?: string;
    errorMaxFiles?: string;
  };
}

export const createWinstonConfig = (options: WinstonConfigOptions): LoggerOptions => {
  const { serviceName, level, nodeEnv = process.env.NODE_ENV, fileLog } = options;

  const isDevelopment = nodeEnv !== 'production';
  const isFileLogEnabled = fileLog?.enabled ?? false;
  const resolvedLogDir = fileLog?.dir ?? 'logs';
  const resolvedMaxSize = fileLog?.maxSize ?? '100m';
  const resolvedMaxFiles = fileLog?.maxFiles ?? '14d';
  const resolvedErrorMaxSize = fileLog?.errorMaxSize ?? '50m';
  const resolvedErrorMaxFiles = fileLog?.errorMaxFiles ?? '30d';

  const consoleTransport = new winston.transports.Console({
    format: isDevelopment
      ? combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          enrichCommonFields,
          colorize({ level: true }),
          developmentFormat,
        )
      : combine(timestamp(), errors({ stack: true }), enrichCommonFields, json()),
  });

  const transports: winston.transport[] = [consoleTransport];

  if (isFileLogEnabled) {
    transports.push(
      new DailyRotateFile({
        dirname: `${resolvedLogDir}/${serviceName}`,
        filename: `${serviceName}.%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: resolvedMaxSize,
        maxFiles: resolvedMaxFiles,
        level: 'info',
      }),
      new DailyRotateFile({
        dirname: `${resolvedLogDir}/${serviceName}`,
        filename: `${serviceName}.error.%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: resolvedErrorMaxSize,
        maxFiles: resolvedErrorMaxFiles,
        level: 'error',
      }),
    );
  }

  return {
    level,
    format: isFileLogEnabled ? combine(timestamp(), errors({ stack: true }), enrichCommonFields, json()) : undefined,
    defaultMeta: {
      service: serviceName,
      env: nodeEnv || 'development',
    },
    transports,
  };
};

export type WinstonLogger = winston.Logger;
