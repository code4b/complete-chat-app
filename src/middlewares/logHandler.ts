// src/middleware/loggerMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
  });

  const oldSend = res.send;
  res.send = function (body): Response {
    const duration = Date.now() - start;

    logger.info('Outgoing Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      responseBody: body,
    });

    // @ts-ignore
    res.send = oldSend;
    return res.send(body);
  };

  next();
};
