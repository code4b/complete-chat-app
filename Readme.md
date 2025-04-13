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

## Tech Stack

- Node.js + TypeScript
- Express.js
- MongoDB (with Mongoose)
- JSON Web Tokens (JWT)
- AES-128 Encryption
- Socket.IO for WebSocket
- RabbitMQ for Message Queuing
- Jest for Testing
- Swagger UI for API documentation

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start RabbitMQ server (make sure RabbitMQ is installed):
   ```bash
   # MacOS (using Homebrew)
   brew services start rabbitmq
   # Linux
   sudo service rabbitmq-server start
   ```

3. Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   AES_SECRET_KEY=your_aes_secret_key
   PORT=3000
   RABBITMQ_URL=amqp://localhost
   ```

4. Build the TypeScript code:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

## API Documentation

Access the Swagger documentation at `http://localhost:3000/api-docs` when the server is running.

### Key Endpoints

#### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

#### Groups
- POST `/api/groups` - Create a new group
- POST `/api/groups/:groupId/join` - Join/request to join a group
- POST `/api/groups/:groupId/approve/:userId` - Approve join request
- POST `/api/groups/:groupId/leave` - Leave group
- POST `/api/groups/:groupId/ban/:userId` - Ban user from group
- POST `/api/groups/:groupId/transfer/:newOwnerId` - Transfer group ownership

#### Messages
- POST `/api/messages/:groupId` - Send message to group
- GET `/api/messages/:groupId` - Get group messages
- WebSocket events documented below

## Security Features

1. User Authentication:
   - Password hashing with bcrypt
   - JWT for session management
   - Email validation

2. Group Security:
   - Private/Public group types
   - Approval system for private groups
   - Ban system with reapproval requirement
   - Cooldown period for rejoining private groups
   - Ownership transfer requirements

3. Message Security:
   - AES-128 encryption for all messages
   - Encrypted storage in database
   - Secure message retrieval only for group members

## Real-time Communication Architecture

The system uses a hybrid approach combining WebSocket and Message Queue:

1. WebSocket (Socket.IO):
   - Real-time client-server communication
   - Group-based message broadcasting
   - Connection state management
   - Client authentication

2. RabbitMQ Message Queue:
   - Reliable message delivery
   - Message persistence
   - Horizontal scaling support
   - Event-driven communication between services

### WebSocket Events

1. Client -> Server:
   - `joinGroup`: Join a group's real-time channel
   - `leaveGroup`: Leave a group's channel
   - `sendMessage`: Send a message to a group

2. Server -> Client:
   - `newMessage`: Receive new messages
   - `error`: Error notifications
   - `joined`: Group join confirmation

### Message Queue Topics

1. Exchanges:
   - `chat_messages` (fanout): Real-time message broadcasting
   - `group_events` (topic): Group-related events

2. Routing Keys:
   - `group.[groupId].*`: Group-specific events
   - `user.[userId].*`: User-specific notifications

## Testing

The project includes comprehensive test coverage:

1. Unit Tests:
   - Controllers
   - Models
   - Utilities
   - WebSocket handlers
   - Message queue operations

2. Integration Tests:
   - API endpoints
   - WebSocket communication
   - Message queue integration
   - Database operations

3. Run Tests:
   ```bash
   # Unit tests
   npm test
   # Coverage report
   npm run test:coverage
   ```

4. Test Environment:
   - Uses in-memory MongoDB
   - Mock WebSocket connections
   - Test RabbitMQ instance

### Example WebSocket Test:
```typescript
describe('WebSocket Integration', () => {
  it('should handle real-time message delivery', async () => {
    const socket = io('http://localhost:3000');
    socket.emit('joinGroup', groupId);
    
    await new Promise(resolve => {
      socket.on('newMessage', (message) => {
        expect(message.content).toBe('Hello');
        resolve(true);
      });
    });
  });
});
```

### Example RabbitMQ Test:
```typescript
describe('Message Queue Integration', () => {
  it('should handle message publication', async () => {
    const channel = await rabbitmq.getChannel();
    await channel.assertQueue(queueName);
    
    await channel.publish('chat_messages', '', 
      Buffer.from(JSON.stringify({ content: 'Hello' }))
    );
    
    const message = await new Promise(resolve => {
      channel.consume(queueName, (msg) => {
        channel.ack(msg!);
        resolve(JSON.parse(msg!.content.toString()));
      });
    });
    
    expect(message.content).toBe('Hello');
  });
});
```

## Swagger Documentation

The API is documented using OpenAPI (Swagger) specification. Key documentation sections:

1. Authentication:
   - Bearer token authentication
   - Request/response schemas
   - Error responses

2. WebSocket:
   - Event documentation
   - Message formats
   - Authentication process

3. Example Swagger WebSocket Documentation:
```yaml
components:
  schemas:
    WebSocketMessage:
      type: object
      properties:
        type: string
        groupId: string
        content: string
        timestamp: string
      required:
        - type
        - groupId
        - content
```

## AI Tool Usage

This project was developed with the assistance of GitHub Copilot, which helped with:
- Code structure and organization
- Security best practices implementation
- API endpoint design
- Documentation generation

## Error Handling

The application includes comprehensive error handling:
- Input validation
- Authentication/Authorization checks
- Database operation error handling
- Encrypted message handling errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request