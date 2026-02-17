import { Router, type RequestHandler } from 'express';
import { getUsers, createUser, getUserById, updateUser, deleteUser, updateProfile } from '../controllers/UserController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate as RequestHandler);

// Initial routes for authenticated users
router.put('/profile', updateProfile as unknown as RequestHandler);

// Only MASTER can manage users
router.use(authorize(Role.MASTER) as RequestHandler);

router.get('/', getUsers as unknown as RequestHandler);
router.post('/', createUser as unknown as RequestHandler);
router.get('/:id', getUserById as unknown as RequestHandler);
router.put('/:id', updateUser as unknown as RequestHandler);
router.delete('/:id', deleteUser as unknown as RequestHandler);

export default router;
