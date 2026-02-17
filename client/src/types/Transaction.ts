export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionStatus = 'APPROVED' | 'REJECTED' | 'QUOTATION' | 'PRODUCTION' | 'COMPLETED';

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    date: string;
    eventId: string;
    requisitionNum?: string;
    serviceOrderNum?: string;
}
