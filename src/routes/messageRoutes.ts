import express from 'express';
import { protect } from '../middlewares/auth';
import { sendMessage, getMessages } from '../controllers/messageController';

const router = express.Router();

router.use(protect); // All message routes require authentication

router.post('/:groupId', sendMessage);
router.get('/:groupId', getMessages);

export default router;