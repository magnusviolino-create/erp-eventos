import { Router } from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controllers/EventController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate); // Protect all event routes

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
