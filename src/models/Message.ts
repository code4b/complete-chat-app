import mongoose, { Document } from 'mongoose';

export interface IMessage extends Document {
    content: string; // Encrypted content
    sender: mongoose.Types.ObjectId;
    group: mongoose.Types.ObjectId;
    timestamp: Date;
}

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export const Message = mongoose.model<IMessage>('Message', messageSchema);