import { Router } from 'express';
import { createTransaction, deleteTransaction, updateTransaction } from '../controllers/TransactionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);
router.put('/:id', updateTransaction);

export default router;
