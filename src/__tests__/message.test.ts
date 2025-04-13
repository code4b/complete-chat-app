import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index';
import { User } from '../models/User';
import { Group } from '../models/Group';
import { Message } from '../models/Message';
import jwt from 'jsonwebtoken';
import { encryptMessage, decryptMessage } from '../utils/encryption';

describe('Message Management', () => {
    let userToken: string;
    let userId: mongoose.Types.ObjectId;
    let groupId: string;

    beforeEach(async () => {
        const user = await User.create({
            email: 'test@example.com',
            password: 'password123'
        });
        userId = user._id;
        userToken = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET!);

        const group = await Group.create({
            name: 'Test Group',
            isPrivate: false,
            owner: userId,
            members: [userId]
        });
        groupId = group._id.toString();
    });

    describe('POST /api/messages/:groupId', () => {
        it('should send an encrypted message to group', async () => {
            const messageContent = 'Hello, this is a test message!';
            
            const res = await request(app)
                .post(`/api/messages/${groupId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ content: messageContent });

            expect(res.status).toBe(201);
            expect(res.body.content).toBe(messageContent); // Original content returned to sender

            const message = await Message.findById(res.body._id);
            expect(message).toBeTruthy();
            expect(message!.content).not.toBe(messageContent); // Content should be encrypted
            expect(decryptMessage(message!.content)).toBe(messageContent); // Should decrypt correctly
        });

        it('should not allow non-members to send messages', async () => {
            const nonMemberId = new mongoose.Types.ObjectId();
            const nonMemberToken = jwt.sign(
                { id: nonMemberId.toString() },
                process.env.JWT_SECRET!
            );

            // Create the non-member user
            await User.create({
                _id: nonMemberId,
                email: 'nonmember@example.com',
                password: 'password123'
            });

            const res = await request(app)
                .post(`/api/messages/${groupId}`)
                .set('Authorization', `Bearer ${nonMemberToken}`)
                .send({ content: 'Test message' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Not authorized - Not a member of this group');
        });
    });

    describe('GET /api/messages/:groupId', () => {
        const testMessages = [
            'First test message',
            'Second test message',
            'Third test message'
        ];

        beforeEach(async () => {
            // Create test messages with proper encryption
            const messages = testMessages.map(content => ({
                content: encryptMessage(content), // Properly encrypt each message
                sender: userId,
                group: groupId,
                timestamp: new Date()
            }));

            await Message.insertMany(messages);
        });

        it('should retrieve and decrypt messages for group members', async () => {
            const res = await request(app)
                .get(`/api/messages/${groupId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(testMessages.length);

            // Sort the messages by content to ensure consistent comparison
            const receivedContents = res.body.map((m: any) => m.content).sort();
            const expectedContents = [...testMessages].sort();

            // Compare sorted arrays
            expect(receivedContents).toEqual(expectedContents);
        });

        it('should not allow non-members to retrieve messages', async () => {
            const nonMemberId = new mongoose.Types.ObjectId();
            const nonMemberToken = jwt.sign(
                { id: nonMemberId.toString() },
                process.env.JWT_SECRET!
            );

            // Create the non-member user
            await User.create({
                _id: nonMemberId,
                email: 'nonmember2@example.com',
                password: 'password123'
            });

            const res = await request(app)
                .get(`/api/messages/${groupId}`)
                .set('Authorization', `Bearer ${nonMemberToken}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Not authorized - Not a member of this group');
        });
    });
});