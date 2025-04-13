// src/config/logger.ts
import winston from 'winston';
import 'winston-mongodb';
import dotenv from 'dotenv';

dotenv.config();

const { MONGODB_URI, LOG_LEVEL, CONSOLE_LOG } = process.env;
const console_format = CONSOLE_LOG === 'true' ? winston.format.simple() : winston.format.combine(
  winston.format.label({
    label: '[LOGGER]'
  }),
  winston.format.timestamp({
    format: "YY-MM-DD HH:mm:ss"
  }),
  winston.format.printf(
    info => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.url ?? ''} ${info.message }`
  ),
  winston.format.colorize({ all: true }),
)

const logger = winston.createLogger({
  level: LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: console_format }),
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
