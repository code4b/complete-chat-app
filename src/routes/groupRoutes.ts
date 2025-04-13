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

router.post('/', createGroup as RequestHandler);
router.get('/', listGroups as RequestHandler);
router.post('/:groupId/join', joinGroup as RequestHandler);
router.post('/:groupId/approve/:userId', approveJoinRequest as RequestHandler);
router.post('/:groupId/leave', leaveGroup as RequestHandler);
router.post('/:groupId/ban/:userId', banUser as RequestHandler);
router.post('/:groupId/transfer/:newOwnerId', transferOwnership as RequestHandler);

export default router;