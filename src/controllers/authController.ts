import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Otp, IOtp } from '../models/Otp';
const { sendOtpMail } = require('../services/mailer');


const generateToken = (id: string) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
};
export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        await Otp.updateOne(
            { email: email }, // filter
            { $set: {otp,sendStatus:0,  expiresAt: new Date(Date.now() + 10 * 60 * 1000) } }, // update fields
            { upsert: true } // create if not found
          ) ;
        const mailResponse = await sendOtpMail(email, otp);
        console.log('mailResponse', mailResponse?.data?.id);
        if (mailResponse?.data?.id) {
            const otpRecord = await Otp.findOne({email:email});
            if (!otpRecord) {
                return res.status(404).json({ message: 'Data not found' });
            }
            otpRecord.sendStatus = 1;
            await otpRecord.save();
            res.status(200).json({ message: 'OTP sent successfully' });
           
        } else {
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otpRecord = await Otp.findOne({
            email: email,
            otp: otp,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await User.findByIdAndUpdate(user._id, { isVerified: true });
        await Otp.deleteOne({ _id: otpRecord._id });
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            email,
            password,
        }) as IUser & { _id: mongoose.Types.ObjectId };

        res.status(201).json({
            _id: user._id.toString(),
            email: user.email
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }) as IUser & { _id: mongoose.Types.ObjectId };
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.isVerified) {
            return res.status(401).json({ message: 'User not verified' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: user._id.toString(),
            email: user.email,
            token: generateToken(user._id.toString()),
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};