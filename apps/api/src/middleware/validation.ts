import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Validation Error Handler
 * Processes express-validator errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors: Record<string, string[]> = {};

    errors.array().forEach((err) => {
      if (err.type === 'field') {
        const field = err.path;
        if (!extractedErrors[field]) {
          extractedErrors[field] = [];
        }
        extractedErrors[field].push(err.msg);
      }
    });

    throw new AppError(400, 'Validation failed', true);
  };
};

/**
 * Pagination Validation
 */
export const validatePagination = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (page < 1) {
    throw new AppError(400, 'Page must be greater than 0');
  }

  if (limit < 1 || limit > 100) {
    throw new AppError(400, 'Limit must be between 1 and 100');
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};
