import { Request, Response, NextFunction } from 'express';
import {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  SecurityError,
} from '@application/common';

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

  if (error instanceof ValidationError) {
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

  // Generic error
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp,
    path,
  } as ErrorResponse);
}
