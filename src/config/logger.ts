// src/config/logger.ts
import winston from 'winston';
import 'winston-mongodb';
import dotenv from 'dotenv';

dotenv.config();

const { MONGODB_URI, LOG_LEVEL } = process.env;

const logger = winston.createLogger({
  level: LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.MongoDB({
      db: MONGODB_URI!,
      collection: 'application_logs',
      tryReconnect: true,
      options: { useUnifiedTopology: true },
      level: LOG_LEVEL || 'info',
    }),
  ],
});

export default logger;
