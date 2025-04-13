import mongoose, { Document } from 'mongoose';

export interface IGroup extends Document {
    name: string;
    isPrivate: boolean;
    owner: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    bannedUsers: mongoose.Types.ObjectId[];
    joinRequests: mongoose.Types.ObjectId[];
    maxMembers: number;
    membershipHistory: {
        userId: mongoose.Types.ObjectId;
        leftAt: Date;
    }[];
    isMember(userId: string | mongoose.Types.ObjectId): boolean;
}

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    maxMembers: {
        type: Number,
        default: null, // null means unlimited
        min: 2 // minimum 2 members required
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    bannedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    joinRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    membershipHistory: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        leftAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

groupSchema.methods.isMember = function(userId: string | mongoose.Types.ObjectId): boolean {
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    return this.members.some((memberId: mongoose.Types.ObjectId) => memberId.equals(userObjectId));
};

export const Group = mongoose.model<IGroup>('Group', groupSchema);