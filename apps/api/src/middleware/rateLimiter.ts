import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { AppError } from './errorHandler';

const authLimiter = new RateLimiterMemory({ points: 100, duration: 900 });
const apiLimiter = new RateLimiterMemory({ points: 1000, duration: 900 });

export const rateLimiter = (type: 'auth' | 'api' = 'api') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limiter = type === 'auth' ? authLimiter : apiLimiter;
      const key = req.ip || req.socket.remoteAddress || 'unknown';
      await limiter.consume(key);
      next();
    } catch (error) {
      if (error instanceof Error && 'msBeforeNext' in error) {
        const retryAfter = Math.ceil((error as any).msBeforeNext / 1000);
        res.setHeader('Retry-After', retryAfter);
      }
      throw new AppError(429, 'Too many requests. Please try again later.');
    }
  };
};

export const strictRateLimiter = () => {
  const limiter = new RateLimiterMemory({ points: 5, duration: 3600 });
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = req.ip || req.socket.remoteAddress || 'unknown';
      await limiter.consume(key);
      next();
    } catch (error) {
      throw new AppError(429, 'Rate limit exceeded. Please try again after some time.');
    }
  };
};
