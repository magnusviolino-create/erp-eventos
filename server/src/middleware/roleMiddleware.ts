import type { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import type { AuthRequest } from './authMiddleware.js';

export const authorize = (...allowedRoles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Access denied: insufficient permissions' });
            return;
        }
        next();
    };
};
