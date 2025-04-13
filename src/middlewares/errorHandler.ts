// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled Error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
  });

  res.status(500).json({ error: 'Internal Server Error' });
};
