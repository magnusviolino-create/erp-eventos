import { Router } from 'express';
import { login, register } from '../controllers/AuthController.js';

const router = Router();

router.post('/register', register as any);
router.post('/login', login as any);

export default router;
