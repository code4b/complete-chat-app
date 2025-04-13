import { Request, Response } from 'express';
import { Group } from '../models/Group';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
    user: any;
}

export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { name, isPrivate, maxMembers, initialMembers } = req.body;

        // Validate initial members
        if (!initialMembers || !Array.isArray(initialMembers) || initialMembers.length === 0) {
            return res.status(400).json({ 
                message: 'Please provide at least one additional member for the group' 
            });
        }

        // Convert member IDs to ObjectIds and remove duplicates
        const uniqueMembers = [...new Set([...initialMembers, req.user._id.toString()])];
        const memberObjectIds = uniqueMembers.map(id => new mongoose.Types.ObjectId(id));

        // Validate minimum members requirement
        if (memberObjectIds.length < 2) {
            return res.status(400).json({ 
                message: 'Group requires at least 2 members including the owner' 
            });
        }

        // Validate maxMembers if provided
        if (maxMembers !== undefined && maxMembers !== null) {
            if (maxMembers < 2) {
                return res.status(400).json({ 
                    message: 'Maximum members cannot be less than 2' 
                });
            }
            if (memberObjectIds.length > maxMembers) {
                return res.status(400).json({ 
                    message: 'Initial members exceed maximum members limit' 
                });
            }
        }

        const group = await Group.create({
            name,
            isPrivate,
            maxMembers,
            owner: req.user._id,
            members: memberObjectIds
        });
        res.status(201).json(group);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const listGroups = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const groups = await Group.find({})
        .skip(skip)
        .limit(limit);

        const total = await Group.countDocuments();

        res.json({
            groups,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalGroups: total
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.bannedUsers.includes(new mongoose.Types.ObjectId(req.user._id))) {
            return res.status(403).json({ message: 'You are banned from this group' });
        }

        // Check if group has reached its member limit
        if (group.maxMembers && group.members.length >= group.maxMembers) {
            return res.status(400).json({ message: 'Group has reached maximum member limit' });
        }

        // Check cooldown period for private groups
        const userHistory = group.membershipHistory.find(
            h => h.userId.toString() === req.user._id.toString()
        );
        if (userHistory) {
            const timeSinceLeaving = Date.now() - userHistory.leftAt.getTime();
            const hoursWaited = timeSinceLeaving / (1000 * 60 * 60);
            if (hoursWaited < 48) {
                return res.status(403).json({ 
                    message: 'You must wait 48 hours after leaving before rejoining' 
                });
            }
        }

        if (group.isPrivate) {
            const userId = new mongoose.Types.ObjectId(req.user._id);
            if (!group.joinRequests.some(id => id.equals(userId))) {
                group.joinRequests.push(userId);
                await group.save();
                return res.json({ message: 'Join request sent' });
            }
            return res.status(400).json({ message: 'Join request already sent' });
        }

        const memberId = new mongoose.Types.ObjectId(req.user._id);
        if (!group.members.some(id => id.equals(memberId))) {
            group.members.push(memberId);
            await group.save();
        }
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const approveJoinRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId, userId } = req.params;
        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if group has reached its member limit
        if (group.maxMembers && group.members.length >= group.maxMembers) {
            return res.status(400).json({ message: 'Group has reached maximum member limit' });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const requestIndex = group.joinRequests.findIndex(id => id.equals(userObjectId));
        if (requestIndex === -1) {
            return res.status(400).json({ message: 'No join request found' });
        }

        group.joinRequests.splice(requestIndex, 1);
        group.members.push(userObjectId);
        await group.save();

        res.json(group);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const leaveGroup = async (req: AuthRequest, res: Response) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.owner.toString() === req.user._id.toString()) {
            if (group.members.length > 1) {
                return res.status(400).json({ 
                    message: 'Transfer ownership before leaving' 
                });
            }
            await Group.deleteOne({ _id: group._id });
            return res.json({ message: 'Group deleted' });
        }

        const memberId = new mongoose.Types.ObjectId(req.user._id);
        const memberIndex = group.members.findIndex(id => id.equals(memberId));
        if (memberIndex > -1) {
            group.members.splice(memberIndex, 1);
            group.membershipHistory.push({
                userId: memberId,
                leftAt: new Date()
            });
            await group.save();
        }

        res.json({ message: 'Left group successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const banUser = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId, userId } = req.params;
        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (userId === group.owner.toString()) {
            return res.status(400).json({ message: 'Cannot ban the owner' });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const memberIndex = group.members.findIndex(id => id.equals(userObjectId));
        if (memberIndex > -1) {
            group.members.splice(memberIndex, 1);
        }

        if (!group.bannedUsers.some(id => id.equals(userObjectId))) {
            group.bannedUsers.push(userObjectId);
        }

        await group.save();
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const transferOwnership = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId, newOwnerId } = req.params;
        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const newOwnerObjectId = new mongoose.Types.ObjectId(newOwnerId);
        if (!group.members.some(id => id.equals(newOwnerObjectId))) {
            return res.status(400).json({ message: 'New owner must be a member' });
        }

        group.owner = newOwnerObjectId;
        await group.save();
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


