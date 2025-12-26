import { Response } from 'express';
import { ApiResponse } from '@paperless/shared';

/**
 * Send Success Response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return res.status(statusCode).json(response);
};

/**
 * Send Paginated Response
 */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): Response => {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    meta: {
      page,
      limit,
      total,
    },
  };

  return res.status(200).json(response);
};

/**
 * Calculate Pagination Offset
 */
export const getPaginationParams = (
  page: number = 1,
  limit: number = 20
): { skip: number; take: number } => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};
