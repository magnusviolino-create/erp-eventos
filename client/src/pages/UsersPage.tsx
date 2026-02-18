import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import api from '../services/api';
import type { User } from '../types/User';

const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch users', error);
                alert('Erro ao carregar usuários. Verifique suas permissões.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Carregando usuários...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Usuários</h1>
                    <div className="flex gap-4 items-center">
                        <ThemeToggle />
                        <Link to="/dashboard" className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition">
                            Voltar
                        </Link>
                        <Link to="/users/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Novo Usuário
                        </Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden transition-colors duration-300">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                <th className="p-4 border-b dark:border-gray-600">Nome</th>
                                <th className="p-4 border-b dark:border-gray-600">Email</th>
                                <th className="p-4 border-b dark:border-gray-600">Função</th>
                                <th className="p-4 border-b dark:border-gray-600">Unidade</th>
                                <th className="p-4 border-b dark:border-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 last:border-0">
                                    <td className="p-4">{user.name}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4 font-mono text-sm bg-gray-50 dark:bg-gray-600 rounded px-2 py-1 inline-block mt-2 md:mt-0 md:bg-transparent md:p-0">
                                        {user.role}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">
                                        {(user as any).unit?.name || '-'}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <Link to={`/users/edit/${user.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm font-semibold">
                                            Editar
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Tem certeza que deseja excluir este usuário?')) {
                                                    try {
                                                        await api.delete(`/users/${user.id}`);
                                                        setUsers(users.filter(u => u.id !== user.id));
                                                    } catch (error) {
                                                        alert('Erro ao excluir usuário.');
                                                    }
                                                }
                                            }}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline text-sm font-semibold ml-2"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
