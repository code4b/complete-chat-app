# Secure Group Messaging System

A Node.js backend for a secure group messaging system with user authentication, group management, and encrypted messaging.

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
  - Real-time messaging support (simulated with timestamps)
- API Documentation with Swagger

## Tech Stack

- Node.js + TypeScript
- Express.js
- MongoDB (with Mongoose)
- JSON Web Tokens (JWT)
- AES-128 Encryption
- Swagger UI for API documentation

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   AES_SECRET_KEY=your_aes_secret_key
   PORT=3000
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Start the server:
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

## Real-time Support

The current implementation uses timestamps for message ordering. To implement real-time functionality:

1. Add WebSocket support using Socket.IO:
   ```typescript
   import { Server } from 'socket.io';
   
   const io = new Server(httpServer);
   io.on('connection', (socket) => {
     socket.on('joinGroup', (groupId) => {
       socket.join(groupId);
     });
     
     socket.on('message', async (data) => {
       // Handle real-time message broadcasting
     });
   });
   ```

2. Update the message controller to emit events:
   ```typescript
   io.to(groupId).emit('newMessage', message);
   ```

## Real-time Implementation with WebSockets

While the current implementation uses timestamps for message ordering, here's how to implement real-time messaging using WebSocket:

1. Install required dependencies:
```bash
npm install socket.io @types/socket.io
```

2. WebSocket Server Setup:
```typescript
// src/websocket/socket.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { decryptMessage } from '../utils/encryption';

export const setupWebSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    // Handle joining group channels
    socket.on('joinGroup', (groupId: string) => {
      socket.join(groupId);
    });

    // Handle leaving group channels
    socket.on('leaveGroup', (groupId: string) => {
      socket.leave(groupId);
    });

    // Handle new messages
    socket.on('sendMessage', async (data: { 
      groupId: string;
      content: string;
      senderId: string;
    }) => {
      // Broadcast to all members in the group
      io.to(data.groupId).emit('newMessage', {
        content: data.content,
        sender: data.senderId,
        timestamp: new Date()
      });
    });
  });

  return io;
};
```

3. Integration with Express:
```typescript
// src/index.ts
import { createServer } from 'http';
import { setupWebSocket } from './websocket/socket';

const httpServer = createServer(app);
const io = setupWebSocket(httpServer);

// Attach io to request for use in controllers
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

httpServer.listen(PORT);
```

4. Update Message Controller:
```typescript
// In messageController.ts sendMessage function
const message = await Message.create({...});
req.io.to(groupId).emit('newMessage', {
  content: messageContent,
  sender: req.user._id,
  timestamp: new Date()
});
```

5. Client Implementation Example:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join a group channel
socket.emit('joinGroup', groupId);

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('sendMessage', {
  groupId,
  content: 'Hello!',
  senderId: userId
});
```

### WebSocket Security Considerations

1. Authentication:
   - Implement token verification on WebSocket connection
   - Validate group membership before joining channels
   - Encrypt WebSocket messages

2. Rate Limiting:
   - Implement message rate limiting per user
   - Add connection limits per user

3. Connection Management:
   - Handle reconnection logic
   - Implement heartbeat mechanism
   - Clean up abandoned connections

4. Example WebSocket Authentication:
```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});
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