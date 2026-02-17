import type { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const eventSchema = z.object({
    name: z.string().min(1),
    eventCode: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    location: z.string().optional(),
    description: z.string().optional(),
    budget: z.coerce.number().optional(),
    unitId: z.string().optional(), // MASTER can provide unitId
    status: z.enum(['OPEN', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELED']).optional(),
    cancellationReason: z.string().optional(),
    project: z.string().min(1, "Projeto é obrigatório"),
    action: z.string().min(1, "Ação é obrigatória"),
    responsibleUnit: z.string().min(1, "Unidade é obrigatória"),
    responsibleEmail: z.string().email("Email inválido"),
    responsiblePhone: z.string().min(1, "Telefone é obrigatório"),
});

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user.id;
        const userRole = authReq.user.role;
        const userUnitId = authReq.user.unitId;

        console.log('Create Event Payload:', req.body);

        const { name, eventCode, startDate, endDate, location, description, budget, unitId: providedUnitId, project, action, responsibleUnit, responsibleEmail, responsiblePhone } = eventSchema.parse(req.body);

        // Determine unitId for the event
        let targetUnitId = userUnitId;

        // If user has no unit (e.g. some MASTERs) but provides one, use it if allowed
        if (!targetUnitId && userRole === Role.MASTER && providedUnitId) {
            targetUnitId = providedUnitId;
        } else if (!targetUnitId && userRole !== Role.MASTER) {
            // Managers/Standards/Observers must have a unitId to create events
        }

        // Observers cannot create events
        if (userRole === Role.OBSERVER) {
            res.status(403).json({ error: 'Observers cannot create events' });
            return;
        }

        const event = await prisma.event.create({
            data: {
                name,
                eventCode: eventCode ?? null,
                startDate,
                endDate,
                location: location ?? null,
                description: description ?? null,
                budget: budget ?? 0,
                userId: userId,
                unitId: targetUnitId ?? null,
                project,
                action,
                responsibleUnit,
                responsibleEmail,
                responsiblePhone,
            },
        });

        res.status(201).json(event);
    } catch (error: any) {
        console.error('Error creating event:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation Error', details: (error as any).errors });
            return;
        }
        res.status(400).json({ error: 'Failed to create event', details: error.message || error });
    }
};

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, unitId } = req.user;

        const whereClause: any = {};

        // If not MASTER, restrict to user's unit
        if (role !== Role.MASTER) {
            if (unitId) {
                whereClause.unitId = unitId;
            } else {
                // If user has no unit and is not MASTER, maybe they only see their own events? 
                // Or nothing? Let's fallback to their own events for safety or empty if strictly unit-based.
                // Requirement: "MANAGER and STANDARD to view/create events for their unitId"
                // If no unitId, let's restrict to userId to be safe, or just return empty if strictly unit system.
                // Let's restrict to userId if no unitId found to avoid leaking data.
                whereClause.userId = req.user.id;
            }
        }
        // MASTER sees all events (whereClause remains empty or specific filters added)

        const events = await prisma.event.findMany({
            where: whereClause,
            orderBy: { startDate: 'asc' },
            include: {
                unit: { select: { name: true } },
                transactions: true
            }
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

export const getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, unitId } = req.user;
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ error: 'ID is required and must be a string' });
            return;
        }

        const event = await prisma.event.findUnique({
            where: { id },
            include: { transactions: true },
        });

        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        // Access Control
        if (role !== Role.MASTER) {
            // Check if event belongs to user's unit
            if (unitId && event.unitId !== unitId) {
                res.status(403).json({ error: 'Access denied: Event belongs to another unit' });
                return;
            }
            // If user has no unit and not MASTER, ensure they own the event
            if (!unitId && event.userId !== req.user.id) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};

const eventUpdateSchema = eventSchema.partial();

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, unitId, id: userId } = req.user;
        const { id } = req.params;

        if (role === Role.OBSERVER) {
            res.status(403).json({ error: 'Observers cannot update events' });
            return;
        }

        if (!id || typeof id !== 'string') {
            res.status(400).json({ error: 'ID is required and must be a string' });
            return;
        }

        console.log('Update Event Payload:', req.body);

        // Validate partial update
        const validatedData = eventUpdateSchema.parse(req.body);

        const event = await prisma.event.findUnique({ where: { id } });

        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        // Access Control for Update
        if (role !== Role.MASTER) {
            if (unitId && event.unitId !== unitId) {
                res.status(403).json({ error: 'Access denied: Cannot update event from another unit' });
                return;
            }
            if (!unitId && event.userId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
        }

        // Exclude unitId from update data to avoid type issues and unauthorized moves
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { unitId: _excludedUnitId, ...updateData } = validatedData;

        // Filter out undefined values to satisfy exactOptionalPropertyTypes
        const updateDataFiltered = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        const updatedEvent = await prisma.event.update({
            where: { id },
            data: updateDataFiltered,
        });

        res.json(updatedEvent);
    } catch (error: any) {
        console.error('Error updating event:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation Error', details: (error as any).errors });
            return;
        }
        res.status(400).json({ error: 'Failed to update event', details: error.message || error });
    }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, unitId, id: userId } = req.user;
        const { id } = req.params;

        if (role === Role.OBSERVER) {
            res.status(403).json({ error: 'Observers cannot delete events' });
            return;
        }

        if (!id || typeof id !== 'string') {
            res.status(400).json({ error: 'ID is required and must be a string' });
            return;
        }

        const event = await prisma.event.findUnique({ where: { id } });

        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        // Access Control for Delete
        if (role !== Role.MASTER) {
            if (unitId && event.unitId !== unitId) {
                res.status(403).json({ error: 'Access denied: Cannot delete event from another unit' });
                return;
            }
            if (!unitId && event.userId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
        }

        await prisma.event.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event' });
    }
};
