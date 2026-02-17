import { Router } from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controllers/EventController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate as any); // Protect all event routes

router.post('/', createEvent as any);
router.get('/', getEvents as any);
router.get('/:id', getEventById as any);
router.put('/:id', updateEvent as any);
router.delete('/:id', deleteEvent as any);

export default router;
