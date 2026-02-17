import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        role: Role;
        unitId?: string | null;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access denied, token missing' });
        return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(403).json({ error: 'Invalid token' });
        return;
    }

    req.user = decoded;
    next();
};
