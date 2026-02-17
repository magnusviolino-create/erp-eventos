import { Router, type RequestHandler } from 'express';
import { getUnits, createUnit } from '../controllers/UnitController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/', getUnits as unknown as RequestHandler);
router.post('/', createUnit as unknown as RequestHandler);

export default router;
