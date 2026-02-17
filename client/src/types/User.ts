export type Role = 'MASTER' | 'MANAGER' | 'STANDARD' | 'OBSERVER';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    unitId?: string | null;
}
