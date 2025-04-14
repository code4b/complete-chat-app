import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import debugLib from 'debug';
import { connectDB } from './config/database';
import { createServer } from 'http';
import { setupWebSocket } from './websocket/socket';
import { rabbitmq } from './utils/rabbitmq';
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import messageRoutes from './routes/messageRoutes';
import { apiLimiter } from './middlewares/rateLimit';
import { requestLogger } from './middlewares/logHandler';
import { errorHandler } from './middlewares/errorHandler';
import logger from './config/logger';
import {apiDocument} from './swagger/apiDocument';
import {socketDocument} from './swagger/socketDocument';
dotenv.config();
const debug = debugLib('app:server');
export const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(requestLogger);
// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(socketDocument));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
app.use(errorHandler);
// Only connect to database and start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    connectDB().then(() => {
        startServer();
    });
}

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Connect to RabbitMQ first
        await rabbitmq.connect();
        
        // Setup WebSocket with RabbitMQ integration
        await setupWebSocket(httpServer);
        
        httpServer.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            debug(`Listening at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await rabbitmq.close();
    process.exit(0);
});