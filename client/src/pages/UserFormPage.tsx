import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import api from '../services/api';
import type { Role } from '../types/User';
import type { Unit } from '../types/Unit';

const UserFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STANDARD' as Role,
        unitId: '',
    });
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch units
                const unitsResponse = await api.get('/units');
                setUnits(unitsResponse.data);

                // If editing, fetch user data
                if (isEditing) {
                    const userResponse = await api.get(`/users/${id}`);
                    const user = userResponse.data;
                    setFormData({
                        name: user.name,
                        email: user.email,
                        password: '', // Don't fill password
                        role: user.role,
                        unitId: user.unitId || '',
                    });
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setError('Erro ao carregar dados.');
            }
        };
        loadData();
    }, [id, isEditing]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isEditing) {
                // Remove password if empty to avoid overwriting with empty string
                const dataToUpdate: any = { ...formData };
                if (!dataToUpdate.password) {
                    delete dataToUpdate.password;
                }
                await api.put(`/users/${id}`, dataToUpdate);
                alert('Usuário atualizado com sucesso!');
            } else {
                await api.post('/users', formData);
                alert('Usuário criado com sucesso!');
            }
            navigate('/users');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Erro ao salvar usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                </h1>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-700 mb-1">Nome *</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded p-2 focus:outline-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            required
                            className="w-full border rounded p-2 focus:outline-blue-500"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">
                            Senha {isEditing ? '(Deixe em branco para manter)' : '*'}
                        </label>
                        <input
                            type="password"
                            required={!isEditing} // Required only for new users
                            minLength={6}
                            className="w-full border rounded p-2 focus:outline-blue-500"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">Função *</label>
                        <select
                            className="w-full border rounded p-2 focus:outline-blue-500"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                        >
                            <option value="STANDARD">Padrão (Standard)</option>
                            <option value="MANAGER">Gerente (Manager)</option>
                            <option value="OBSERVER">Observador (Observer)</option>
                            <option value="MASTER">Mestre (Master)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">Unidade (Opcional)</label>
                        <select
                            className="w-full border rounded p-2 focus:outline-blue-500"
                            value={formData.unitId}
                            onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                        >
                            <option value="">Selecione uma unidade (ou deixe em branco)</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {units.length === 0 ? 'Nenhuma unidade encontrada. Crie unidades primeiro.' : 'Vincule o usuário a uma unidade existente.'}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Salvando...' : (isEditing ? 'Atualizar Usuário' : 'Criar Usuário')}
                    </button>

                    <Link to="/users" className="text-center text-gray-600 hover:underline mt-2">
                        Cancelar
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default UserFormPage;
