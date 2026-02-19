
import { Router, type RequestHandler } from 'express';
import { getOperators, createOperator, updateOperator, deleteOperator } from '../controllers/OperatorController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/', getOperators as unknown as RequestHandler);
router.post('/', createOperator as unknown as RequestHandler);
router.put('/:id', updateOperator as unknown as RequestHandler);
router.delete('/:id', deleteOperator as unknown as RequestHandler);

export default router;
