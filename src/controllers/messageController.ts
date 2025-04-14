import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Group } from '../models/Group';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import { rabbitmq } from '../services/rabbitmq';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
    user: { _id: string };
}

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { content } = req.body;
        const { groupId } = req.params;
        console.log(`Attempting to send message to group ${groupId}`);

        const group = await Group.findById(groupId);
        if (!group) {
            console.log('Group not found');
            return res.status(404).json({ message: 'Group not found' });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);
        if (!group.members.some(memberId => memberId.equals(userId))) {
            console.log('User is not a member of the group');
            return res.status(401).json({ message: 'Not authorized - Not a member of this group' });
        }

        console.log('User is a member, encrypting message');
        const encryptedContent = encryptMessage(content);
        const now = new Date();
        const message = await Message.create({
            content: encryptedContent,
            sender: userId,
            group: groupId,
            timestamp: now
        });

        // Publish to RabbitMQ
        const channel = rabbitmq.getChannel();
        channel.publish('chat_messages', '', Buffer.from(JSON.stringify({
            groupId,
            message: {
                _id: message._id,
                content: content, // Send decrypted content for real-time display
                sender: userId,
                timestamp: now
            }
        })));

        // Also publish group event
        channel.publish('group_events', `group.${groupId}.message`, Buffer.from(JSON.stringify({
            type: 'new_message',
            groupId,
            messageId: message._id
        })));

        console.log('Message created and published successfully');
        res.status(201).json({
            ...message.toJSON(),
            content: content // Return original content to sender
        });
    } catch (error: any) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const { limit = 50, before } = req.query;
        console.log(`Attempting to get messages for group ${groupId}`);

        const group = await Group.findById(groupId);
        if (!group) {
            console.log('Group not found');
            return res.status(404).json({ message: 'Group not found' });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);
        if (!group.members.some(memberId => memberId.equals(userId))) {
            console.log('User is not a member of the group');
            return res.status(401).json({ message: 'Not authorized - Not a member of this group' });
        }

        let query: any = { group: groupId };
        if (before) {
            query.timestamp = { $lt: new Date(before as string) };
        }

        const messages = await Message.find(query)
            .sort({ timestamp: -1 })
            .limit(Number(limit))
            .populate('sender', 'username email');

        // Decrypt messages for response
        const decryptedMessages = messages.map(msg => ({
            ...msg.toJSON(),
            content: decryptMessage(msg.content)
        }));

        res.json(decryptedMessages);
    } catch (error: any) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ message: error.message });
    }
};