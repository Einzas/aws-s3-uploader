import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { logger } from '@shared/services';

export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many upload attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Log de intentos de rate limit
  handler: (req, res) => {
    logger.security('Rate limit exceeded for uploads', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many upload attempts, please try again later',
      },
    });
  },
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Log de intentos de rate limit
  handler: (req, res) => {
    logger.security('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    });
  },
});

/**
 * Middleware de logging de requests HTTP usando Morgan y Winston
 */
export const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
  }
);

/**
 * Middleware de logging detallado de requests
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, originalUrl, ip, headers } = req;

  // Log del inicio del request
  logger.http(`Incoming request: ${method} ${originalUrl}`, {
    method,
    path: originalUrl,
    ip,
    userAgent: headers['user-agent'],
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Log del request completado
    logger.http(`Request completed: ${method} ${originalUrl}`, {
      method,
      path: originalUrl,
      statusCode,
      duration,
      ip,
    });

    // Log de seguridad para requests fallidos
    if (statusCode >= 400) {
      logger.security(`Failed request: ${method} ${originalUrl}`, {
        method,
        path: originalUrl,
        statusCode,
        ip,
        userAgent: headers['user-agent'],
      });
    }

    // Log de performance para requests lentos (>1s)
    if (duration > 1000) {
      logger.performance(`Slow request detected: ${method} ${originalUrl}`, {
        method,
        path: originalUrl,
        duration,
        statusCode,
      });
    }
  });

  next();
}

