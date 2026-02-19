
import { Router, type RequestHandler } from 'express';
import { getServices, createService, updateService, deleteService } from '../controllers/ServiceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/', getServices as unknown as RequestHandler);
router.post('/', createService as unknown as RequestHandler);
router.put('/:id', updateService as unknown as RequestHandler);
router.delete('/:id', deleteService as unknown as RequestHandler);

export default router;
