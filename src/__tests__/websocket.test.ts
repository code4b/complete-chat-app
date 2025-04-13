import { Socket } from 'socket.io-client';
import socketClient from 'socket.io-client';
import { createServer } from 'http';
import { app } from '../index';
import { setupWebSocket } from '../websocket/socket';
import { User } from '../models/User';
import { Group } from '../models/Group';
import jwt from 'jsonwebtoken';
import mongoose, { Document } from 'mongoose';
import { rabbitmq } from '../utils/rabbitmq';

interface TestUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
}

interface TestGroup extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    isPrivate: boolean;
    owner: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
}

describe('WebSocket Integration', () => {
    let httpServer: any;
    let clientSocket: any;
    let port: number;
    let userToken: string;
    let userId: mongoose.Types.ObjectId;
    let groupId: string;
    let isRabbitMQAvailable = false;

    beforeAll(async () => {
        try {
            // Setup RabbitMQ
            await rabbitmq.connect();
            isRabbitMQAvailable = true;
        } catch (error) {
            console.warn('RabbitMQ not available, some features will be limited');
            isRabbitMQAvailable = false;
        }

        // Setup server
        port = 3001;
        httpServer = createServer(app);
        await setupWebSocket(httpServer);
        httpServer.listen(port);

        // Create test user
        const user = await User.create({
            email: 'test@example.com',
            password: 'password123'
        }) as TestUser;
        userId = user._id;
        userToken = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET!);

        // Create test group
        const group = await Group.create({
            name: 'Test Group',
            isPrivate: false,
            owner: userId,
            members: [userId]
        }) as TestGroup;
        groupId = group._id.toString();
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Group.deleteMany({});
        if (isRabbitMQAvailable) {
            await rabbitmq.close();
        }
        await mongoose.connection.close();
        httpServer.close();
    });

    beforeEach((done) => {
        clientSocket = socketClient(`http://localhost:${port}`, {
            auth: { token: userToken }
        });
        clientSocket.on('connect', done);
    });

    afterEach(() => {
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
    });

    it('should authenticate socket connection', (done) => {
        clientSocket.on('connect', () => {
            expect(clientSocket.connected).toBe(true);
            done();
        });
    });

    it('should reject connection without token', (done) => {
        const unauthSocket = socketClient(`http://localhost:${port}`, {
            auth: { token: 'invalid_token' }
        });

        unauthSocket.on('connect_error', (err: Error) => {
            expect(err.message).toBe('Authentication failed');
            unauthSocket.close();
            done();
        });
    });

    it('should handle joining a group', (done) => {
        clientSocket.emit('joinGroup', groupId);

        clientSocket.on('joined', (data: { groupId: string }) => {
            expect(data.groupId).toBe(groupId);
            done();
        });
    });

    it('should handle real-time message delivery', (done) => {
        if (!isRabbitMQAvailable) {
            console.log('Skipping full message delivery test: RabbitMQ not available');
            done();
            return;
        }

        const testMessage = 'Hello, this is a test message!';
        
        clientSocket.emit('joinGroup', groupId);
        
        clientSocket.on('joined', () => {
            clientSocket.emit('sendMessage', {
                groupId,
                content: testMessage
            });
        });

        clientSocket.on('newMessage', (message: any) => {
            expect(message.content).toBe(testMessage);
            expect(message.sender).toBe(userId.toString());
            expect(message.timestamp).toBeDefined();
            done();
        });
    });

    it('should handle leaving a group', (done) => {
        clientSocket.emit('joinGroup', groupId);
        clientSocket.on('joined', () => {
            clientSocket.emit('leaveGroup', groupId);
            // If we reach here without errors, test passes
            done();
        });
    });

    it('should not allow joining unauthorized groups', (done) => {
        const unauthorizedGroupId = new mongoose.Types.ObjectId().toString();
        clientSocket.emit('joinGroup', unauthorizedGroupId);

        clientSocket.on('error', (error: string) => {
            expect(error).toBe('Not authorized to join this group');
            done();
        });
    });
});