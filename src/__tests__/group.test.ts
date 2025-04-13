import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index';
import { User } from '../models/User';
import { Group } from '../models/Group';
import jwt from 'jsonwebtoken';

describe('Group Management', () => {
    let userToken: string;
    let userId: string;

    beforeEach(async () => {
        const user = await User.create({
            email: 'test@example.com',
            password: 'password123'
        });
        userId = user._id.toString();
        userToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!);
    });

    describe('POST /api/groups', () => {
        it('should create a new group', async () => {
            const res = await request(app)
                .post('/api/groups')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Test Group',
                    isPrivate: true
                });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Test Group');
            expect(res.body.isPrivate).toBe(true);
            expect(res.body.owner.toString()).toBe(userId);
            expect(res.body.members).toContain(userId);
        });
    });

    describe('POST /api/groups/:groupId/join', () => {
        let groupId: string;

        beforeEach(async () => {
            const group = await Group.create({
                name: 'Test Group',
                isPrivate: true,
                owner: new mongoose.Types.ObjectId(),
                members: []
            });
            groupId = group._id.toString();
        });

        it('should send join request for private group', async () => {
            const res = await request(app)
                .post(`/api/groups/${groupId}/join`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Join request sent');

            const group = await Group.findById(groupId);
            expect(group!.joinRequests).toContainEqual(new mongoose.Types.ObjectId(userId));
        });

        it('should join public group immediately', async () => {
            await Group.findByIdAndUpdate(groupId, { isPrivate: false });

            const res = await request(app)
                .post(`/api/groups/${groupId}/join`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            
            const group = await Group.findById(groupId);
            expect(group!.members).toContainEqual(new mongoose.Types.ObjectId(userId));
        });
    });

    describe('POST /api/groups/:groupId/leave', () => {
        let groupId: string;

        beforeEach(async () => {
            const group = await Group.create({
                name: 'Test Group',
                isPrivate: true,
                owner: new mongoose.Types.ObjectId(),
                members: [new mongoose.Types.ObjectId(userId)]
            });
            groupId = group._id.toString();
        });

        it('should allow member to leave group', async () => {
            const res = await request(app)
                .post(`/api/groups/${groupId}/leave`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            
            const group = await Group.findById(groupId);
            expect(group!.members).not.toContainEqual(new mongoose.Types.ObjectId(userId));
            expect(group!.membershipHistory[0].userId.toString()).toBe(userId);
        });

        it('should prevent owner from leaving if not sole member', async () => {
            const group = await Group.findById(groupId);
            group!.owner = new mongoose.Types.ObjectId(userId);
            group!.members.push(new mongoose.Types.ObjectId());
            await group!.save();

            const res = await request(app)
                .post(`/api/groups/${groupId}/leave`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Transfer ownership before leaving');
        });
    });
});