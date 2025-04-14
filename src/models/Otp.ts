import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
    email: string;
    otp: string;
    sendStatus: number;//0 for pending, 1 for sent
    expiresAt: Date;

}

const otpSchema = new Schema({
    email: String,
    otp:String,
    sendStatus: {
        type: Number,
        default: 0,
    },
    expiresAt: Date
});

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
