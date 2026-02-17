import { createContext, useState, useEffect, type ReactNode, type FC, useContext } from 'react';
import api from '../services/api';
import type { User } from '../types/User';

interface AuthContextData {
    signed: boolean;
    user: User | null;
    signIn: (token: string, user: User) => void;
    signOut: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storagedUser = localStorage.getItem('user');
        const storagedToken = localStorage.getItem('token');

        if (storagedUser && storagedToken) {
            setUser(JSON.parse(storagedUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${storagedToken}`;
        }
        setLoading(false);
    }, []);

    const signIn = (token: string, user: User) => {
        setUser(user);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    };

    const signOut = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
