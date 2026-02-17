import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
                    <div className="flex gap-4">
                        <Link to="/dashboard" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">
                            Voltar
                        </Link>
                        <Link to="/users/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Novo Usuário
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="p-4 border-b">Nome</th>
                                <th className="p-4 border-b">Email</th>
                                <th className="p-4 border-b">Função</th>
                                <th className="p-4 border-b">Unidade</th>
                                <th className="p-4 border-b">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 text-gray-800 border-b last:border-0">
                                    <td className="p-4">{user.name}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4 font-mono text-sm bg-gray-50 rounded px-2 py-1 inline-block mt-2 md:mt-0 md:bg-transparent md:p-0">
                                        {user.role}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {(user as any).unit?.name || '-'}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <Link to={`/users/edit/${user.id}`} className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-semibold">
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
                                            className="text-red-600 hover:text-red-800 hover:underline text-sm font-semibold ml-2"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
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
