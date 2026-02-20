import winston, { Logger as WinstonLogger, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from '@shared/config';

/**
 * Categorías de logs especializados
 */
export enum LogCategory {
  APPLICATION = 'application',
  HTTP = 'http',
  S3 = 's3',
  UPLOAD = 'upload',
  VALIDATION = 'validation',
  SECURITY = 'security',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

/**
 * Interfaz para contexto adicional en los logs
 */
export interface LogContext {
  category?: LogCategory;
  userId?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  errorStack?: string;
  [key: string]: any;
}

/**
 * Servicio centralizado de logging usando Winston
 * con logs rotativos y categorizados
 */
class LoggerService {
  private logger: WinstonLogger;
  private isProduction: boolean;

  constructor() {
    this.isProduction = config.server.nodeEnv === 'production';
    this.logger = this.createLogger();
  }

  /**
   * Crea el logger de Winston con todos los transports configurados
   */
  private createLogger(): WinstonLogger {
    const logsDir = path.join(process.cwd(), 'logs');

    // Formato personalizado para archivos
    const fileFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
      format.json()
    );

    // Formato personalizado para consola (más legible)
    const consoleFormat = format.combine(
      format.colorize(),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ level, message, timestamp, category, ...meta }) => {
        const categoryStr = category ? `[${category}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} ${level} ${categoryStr}: ${message} ${metaStr}`;
      })
    );

    // Transport para errores (solo nivel error)
    const errorFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    });

    // Transport para todos los logs combinados
    const combinedFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    });

    // Transport para logs de HTTP
    const httpFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '7d',
      format: fileFormat,
    });

    // Transport para logs de S3/uploads
    const s3FileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 's3-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    });

    // Transport para logs de seguridad
    const securityFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d', // Mantener logs de seguridad por más tiempo
      format: fileFormat,
    });

    // Transport para logs de performance
    const performanceFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: fileFormat,
    });

    const transports: any[] = [
      errorFileTransport,
      combinedFileTransport,
      httpFileTransport,
      s3FileTransport,
      securityFileTransport,
      performanceFileTransport,
    ];

    // SIEMPRE mostrar en consola para PM2 logs
    // Esto permite ver los logs con: pm2 logs
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: this.isProduction ? 'info' : 'debug',
      })
    );

    return winston.createLogger({
      level: this.isProduction ? 'info' : 'debug',
      format: fileFormat,
      transports,
      // No salir en caso de error
      exitOnError: false,
    });
  }

  /**
   * Log de nivel INFO
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * Log de nivel DEBUG
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * Log de nivel WARNING
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  /**
   * Log de nivel ERROR
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = {
      ...context,
      category: context?.category || LogCategory.ERROR,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name,
    };

    this.logger.error(message, errorContext);
  }

  /**
   * Log de nivel HTTP
   */
  http(message: string, context?: LogContext): void {
    this.logger.http(message, {
      ...context,
      category: LogCategory.HTTP,
    });
  }

  /**
   * Log especializado para operaciones de S3
   */
  s3(message: string, context?: LogContext): void {
    this.logger.info(message, {
      ...context,
      category: LogCategory.S3,
    });
  }

  /**
   * Log especializado para uploads
   */
  upload(message: string, context?: LogContext): void {
    this.logger.info(message, {
      ...context,
      category: LogCategory.UPLOAD,
    });
  }

  /**
   * Log especializado para validaciones
   */
  validation(message: string, context?: LogContext): void {
    this.logger.info(message, {
      ...context,
      category: LogCategory.VALIDATION,
    });
  }

  /**
   * Log especializado para seguridad
   */
  security(message: string, context?: LogContext): void {
    this.logger.warn(message, {
      ...context,
      category: LogCategory.SECURITY,
    });
  }

  /**
   * Log especializado para performance
   */
  performance(message: string, context?: LogContext): void {
    this.logger.info(message, {
      ...context,
      category: LogCategory.PERFORMANCE,
    });
  }

  /**
   * Log del inicio de una operación (para medir performance)
   */
  startOperation(operationName: string, context?: LogContext): number {
    this.debug(`Starting operation: ${operationName}`, context);
    return Date.now();
  }

  /**
   * Log del fin de una operación (para medir performance)
   */
  endOperation(
    operationName: string,
    startTime: number,
    context?: LogContext
  ): void {
    const duration = Date.now() - startTime;
    this.performance(`Operation completed: ${operationName}`, {
      ...context,
      duration,
    });
  }
}

// Singleton del servicio de logging
export const logger = new LoggerService();
