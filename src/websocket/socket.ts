import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { decryptMessage } from '../utils/encryption';
import { rabbitmq } from '../utils/rabbitmq';
import jwt from 'jsonwebtoken';
import { Group } from '../models/Group';
import mongoose from 'mongoose';
import { ConsumeMessage } from 'amqplib';

interface AuthSocket extends Socket {
    userId: string;
}

export const setupWebSocket = async (httpServer: HttpServer) => {
    const serverOptions = (process.env.NODE_ENV !== 'development') ? {cors: { origin: '*' } } : {}
    const io = new Server(httpServer, serverOptions);
    const channel = rabbitmq.getChannel();

    // Setup queue for this server instance
    const queueResult = await channel.assertQueue('', { exclusive: true });
    const queueName = queueResult.queue;

    // Bind to chat messages exchange
    await channel.bindQueue(queueName, 'chat_messages', '');

    // Listen for messages from RabbitMQ and broadcast to connected clients
    channel.consume(queueName, (msg: ConsumeMessage | null) => {
        if (msg) {
            const { groupId, message } = JSON.parse(msg.content.toString());
            io.to(groupId).emit('newMessage', message);
            channel.ack(msg);
        }
    });

    // Authentication middleware
    io.use(async (socket: Socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                throw new Error('Authentication token missing');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
            (socket as AuthSocket).userId = decoded.id;
            next();
        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const authSocket = socket as AuthSocket;
        console.log('Client connected:', authSocket.id);

        socket.on('listGroups', async () => {
            try {
                const groups = await Group.find({
                    members: new mongoose.Types.ObjectId(authSocket.userId)
                });
                const groupsList = groups.map(group => ({
                    id: group._id,
                    name: group.name,
                    memberCount: group.members.length
                }));

                socket.emit('groupsList', groupsList);
            } catch (error) {
                socket.emit('error', 'Failed to fetch groups');
            }
        });
        socket.on('joinGroup', async (groupId: string) => {
            try {
                const group = await Group.findById(groupId);
                if (!group || !group.members.some(memberId =>
                    memberId.equals(new mongoose.Types.ObjectId(authSocket.userId))
                )) {
                    socket.emit('error', 'Not authorized to join this group');
                    return;
                }

                socket.join(groupId);
                // Bind to group-specific events
                const routingKey = `group.${groupId}.*`;
                await channel.bindQueue(queueName, 'group_events', routingKey);

                socket.emit('joined', { groupId });
            } catch (error) {
                socket.emit('error', 'Failed to join group');
            }
        });

        socket.on('leaveGroup', async (groupId: string) => {
            socket.leave(groupId);
            // Unbind from group-specific events
            const routingKey = `group.${groupId}.*`;
            await channel.unbindQueue(queueName, 'group_events', routingKey);
        });

        socket.on('sendMessage', async (data: {
            groupId: string;
            content: string;
        }) => {
            try {
                // Publish message to RabbitMQ
                channel.publish('chat_messages', '', Buffer.from(JSON.stringify({
                    groupId: data.groupId,
                    message: {
                        content: data.content,
                        sender: authSocket.userId,
                        timestamp: new Date()
                    }
                })));
            } catch (error) {
                socket.emit('error', 'Failed to send message');
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};