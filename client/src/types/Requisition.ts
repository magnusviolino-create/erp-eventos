
import { Transaction } from './Transaction';

export interface Requisition {
    id: string;
    number: number;
    eventId: string;
    transactions?: Transaction[];
    createdAt: string;
    updatedAt: string;
}
