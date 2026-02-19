
import { Router, type RequestHandler } from 'express';
import { getCommunicationItems, createCommunicationItem, updateCommunicationItem, deleteCommunicationItem } from '../controllers/CommunicationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/', getCommunicationItems as unknown as RequestHandler);
router.post('/', createCommunicationItem as unknown as RequestHandler);
router.put('/:id', updateCommunicationItem as unknown as RequestHandler);
router.delete('/:id', deleteCommunicationItem as unknown as RequestHandler);

export default router;
