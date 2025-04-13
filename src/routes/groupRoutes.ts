import express from 'express';
import { protect } from '../middlewares/auth';
import {
    createGroup,
    joinGroup,
    approveJoinRequest,
    leaveGroup,
    banUser,
    transferOwnership
} from '../controllers/groupController';

const router = express.Router();

router.use(protect); // All group routes require authentication

router.post('/', createGroup);
router.post('/:groupId/join', joinGroup);
router.post('/:groupId/approve/:userId', approveJoinRequest);
router.post('/:groupId/leave', leaveGroup);
router.post('/:groupId/ban/:userId', banUser);
router.post('/:groupId/transfer/:newOwnerId', transferOwnership);

export default router;