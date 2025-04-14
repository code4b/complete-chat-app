import express, { RequestHandler } from 'express';
import { protect } from '../middlewares/auth';
import {
    createGroup,
    listGroups,
    joinGroup,
    approveJoinRequest,
    leaveGroup,
    banUser,
    transferOwnership
} from '../controllers/groupController';

const router = express.Router();

router.use(protect as RequestHandler); // All group routes require authentication

router.post('/', createGroup);
router.get('/', listGroups );
router.post('/:groupId/join', joinGroup );
router.post('/:groupId/approve/:userId', approveJoinRequest );
router.post('/:groupId/leave', leaveGroup);
router.post('/:groupId/ban/:userId', banUser);
router.post('/:groupId/transfer/:newOwnerId', transferOwnership);

export default router;