import express from 'express';
import { register, login,sendOtp,verifyOtp } from '../controllers/authController';

const router = express.Router();

router.post('/register', register as express.RequestHandler);
router.post('/login', login as express.RequestHandler);
router.post('/sendotp', sendOtp as express.RequestHandler);
router.post('/verifyotp', verifyOtp as express.RequestHandler);


export default router;