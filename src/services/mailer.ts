import dotenv from 'dotenv';
import { Resend } from 'resend';
dotenv.config();
export const sendOtpMail = async (email: string, otp: string) => {

    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
        const mailResponse = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: process.env.EMAIL_USER || email,
            subject: 'OTP Verification',
            html: `<p>Your OTP is <strong>${otp}</strong></p>`
        });
        return mailResponse;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send OTP email');
    }
};
