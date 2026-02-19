
import type { Operator } from './Operator';
import type { Service } from './Service';

export interface Unit {
    id: string;
    name: string;
}

export type CommunicationStatus = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CRIACAO' | 'APROVADO' | 'REPROVADO';

export interface CommunicationItem {
    id: string;
    eventId: string;
    serviceId: string;
    service?: Service;
    operatorId: string;
    operator?: Operator;
    deliveryDate: string | Date;
    quantity: number;
    status: CommunicationStatus;
    date: string | Date; // Deprecated but might be in old types, good to remove or keep optional if needed temporarily. Let's keep it safe.
    createdAt: string | Date;
}
