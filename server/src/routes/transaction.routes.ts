import { Router } from 'express';
import { createTransaction, deleteTransaction, updateTransaction } from '../controllers/TransactionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createTransaction as any);
router.delete('/:id', deleteTransaction as any);
router.put('/:id', updateTransaction as any);

export default router;
