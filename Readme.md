# Secure Group Messaging System

A Node.js backend for a secure group messaging system with user authentication, group management, encrypted messaging, and real-time communication.

## Features

- User Authentication (Register/Login)
- Secure Group Management
    - Private and Open groups
    - Join request approval system
    - User banning
    - 48-hour cooldown for rejoining private groups
    - Ownership transfer
- Encrypted Messaging
    - AES-128 encryption for all messages
    - Real-time messaging with WebSocket
    - Message queuing with RabbitMQ
- API Documentation with Swagger
- Comprehensive Test Coverage
- Advanced Error Handling
    - Custom error classes
    - Error middleware
    - Request validation
- Structured Logging
    - Winston logger integration
    - Log levels (error, warn, info, debug)
    - Request logging
    - Error tracking

## Tech Stack

- Node.js + TypeScript
- Express.js
- MongoDB (with Mongoose)
- JSON Web Tokens (JWT)
- AES-128 Encryption
- Socket.IO for WebSocket
- RabbitMQ for Message Queuing
- Winston for Logging
- Jest for Testing
- Swagger UI for API documentation

## Error Handling & Logging

### Error Handling System

1. Custom Error Classes:
    - `ApplicationError` - Base error class
    - `ValidationError` - Input validation errors
    - `AuthenticationError` - Auth-related errors
    - `NotFoundError` - Resource not found
    - `ConflictError` - Resource conflicts

2. Error Middleware:
    ```typescript
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Error:', { error: err.message, stack: err.stack });
      // Error handling logic
    });
    ```

3. Request Validation:
    - Input schema validation
    - Parameter checking
    - Type verification

### Logging System

1. Winston Logger Configuration:
    ```typescript
    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
      ]
    });
    ```

2. Log Levels:
    - ERROR: System errors and exceptions
    - WARN: Important issues
    - INFO: General operations
    - DEBUG: Detailed information

3. Request Logging:
    - Request method and path
    - Response status and time
    - User identification
    - Error tracking

## Known Bottlenecks & Fixes

### Bottleneck Mitigation

1. Single WebSocket Server:
    - Use Socket.IO with Redis adapter for horizontal scaling
    - Deploy multiple pods on Kubernetes for load balancing

2. MongoDB Write Bottlenecks:
    - Use capped collections or write behind pattern
    - Implement MongoDB sharding in Kubernetes

3. Test Coverage Gaps:
    - Missing edge case scenarios in WebSocket connections
    - Insufficient load testing for concurrent users
    - Incomplete integration tests for group messaging
    - Limited stress testing for encrypted communication
    - Lacking performance benchmark tests

4. Logging and Monitoring:
    - Buffer logs in memory before bulk write to Mongo
    - Prometheus metrics collection:
        - Socket.IO connection metrics
        - Message throughput
        - Response times
        - Memory usage
    - Grafana dashboards:
        - Real-time system metrics
        - User activity monitoring
        - Resource utilization
        - Alert management

5. Infrastructure Scaling:
    - Kubernetes autoscaling based on CPU/Memory
    - Horizontal Pod Autoscaling (HPA)
    - Node pool management
    - Load balancer configuration

6. Performance Optimization:
    - Use gzip/deflate compression
    - Implement message caching
    - Set resource limits in Kubernetes
    - Configure pod affinity rules

