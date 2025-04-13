import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const secretKey = process.env.AES_SECRET_KEY!;

export const encryptMessage = (message: string): string => {
    return CryptoJS.AES.encrypt(message, secretKey).toString();
};

export const decryptMessage = (encryptedMessage: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};