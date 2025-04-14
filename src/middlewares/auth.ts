import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({ message: 'Invalid authentication token' });
            }
            if (!user.isVerified) {
                return res.status(401).json({ message: 'User not verified' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during authentication' });
    }
};