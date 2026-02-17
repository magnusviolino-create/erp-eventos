export interface Event {
    id: string;
    name: string;
    startDate: string; // ISO string
    endDate: string; // ISO string
    imageUrl?: string;
    location?: string;
    description?: string;
    eventCode?: string;
    budget?: number; // Optional budget constraint
    status: 'OPEN' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELED';
    transactions?: Transaction[];
    unit?: { name: string };
    project?: string;
    action?: string;
    responsibleEmail?: string;
    responsiblePhone?: string;
    responsibleUnit?: string;
    cancellationReason?: string;
    createdAt?: string; // ISO string
}

import type { Transaction } from './Transaction';
