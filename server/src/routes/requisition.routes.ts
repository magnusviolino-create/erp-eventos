
import { Router } from 'express';
import { getRequisitions, createRequisition, deleteRequisition, getRequisitionById } from '../controllers/RequisitionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate as any);

router.get('/', getRequisitions as any);
router.post('/', createRequisition as any);
router.delete('/:id', deleteRequisition as any);
router.get('/:id', getRequisitionById as any);

export default router;
