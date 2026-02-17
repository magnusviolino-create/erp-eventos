import { useState, useEffect, type FormEvent, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

const ProfilePage: FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // We'll calculate the ID from the token on the backend, 
                // but to display current info we can use the stored user info or fetch again.
                // Since we don't have a specific "me" endpoint that returns everything,
                // and we are already logged in, we might have the user in context.
                // However, it's safer to fetch fresh data if possible.
                // The current backend doesn't have a "get me" endpoint, but we can rely on 
                // the user knowing their current name/email, or...
                // Wait, I can't easily fetch "me" without an ID if I don't have a "get me" endpoint.
                // But I do have `req.user.id` in the backend. 
                // I should probably add a `GET /auth/me` or similar, OR just rely on LocalStorage user data for initial populate.
                // Let's rely on stored user data from localStorage for now to keep it simple, 
                // or if we really want to be correct, we should trust the backend.

                // Construct: We will assume the user knows who they are, OR we can fetch 
                // details if we have the ID. 
                // Actually, let's just render the form empty or with what we have.
                // Better: Let's fetch the user details using the ID from the auth context/local storage.
                const storedUser = localStorage.getItem('@App:user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    setName(user.name);
                    setEmail(user.email);
                    // Password left empty
                }
            } catch (err) {
                setError('Erro ao carregar dados do perfil.');
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (password && password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        try {
            const payload: any = {
                name,
                email,
            };

            if (password) {
                payload.password = password;
            }

            const response = await api.put('/users/profile', payload); // Use the new endpoint

            // Update local storage if successful
            const storedUser = localStorage.getItem('@App:user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const updatedUser = { ...user, name: response.data.name, email: response.data.email };
                localStorage.setItem('@App:user', JSON.stringify(updatedUser));
            }

            setSuccess('Perfil atualizado com sucesso!');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            setError('Erro ao atualizar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="Voltar"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600" />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                            <p className="font-medium">Erro</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r">
                            <p className="font-medium">Sucesso</p>
                            <p className="text-sm">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="border-t border-gray-100 pt-6 mt-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Alterar Senha</h3>
                            <p className="text-sm text-gray-500 mb-4">Deixe em branco para manter a senha atual.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Repita a nova senha"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all border border-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <Save size={20} />
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
