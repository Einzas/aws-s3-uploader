import { Request, Response, NextFunction } from 'express';
import {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  SecurityError,
} from '@application/common';
import { logger } from '@shared/services';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl;

  // Log del error
  logger.error('Request error', error, {
    path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    errorType: error.constructor.name,
  });

  if (error instanceof ValidationError) {
    logger.validation('Validation error', {
      path,
      message: error.message,
      code: error.code,
    });

    res.status(400).json({
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp,
      path,
    } as ErrorResponse);
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp,
      path,
    } as ErrorResponse);
    return;
  }

  if (error instanceof ConflictError) {
    res.status(409).json({
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp,
      path,
    } as ErrorResponse);
    return;
  }

  if (error instanceof SecurityError) {
    logger.security('Security error', {
      path,
      message: error.message,
      code: error.code,
      ip: req.ip,
    });

    res.status(403).json({
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp,
      path,
    } as ErrorResponse);
    return;
  }

  if (error instanceof DomainError) {
    res.status(400).json({
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp,
      path,
    } as ErrorResponse);
    return;
  }

  // Generic error - no exponer detalles en producción
  logger.error('Unhandled error', error, {
    path,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp,
    path,
  } as ErrorResponse);
}
