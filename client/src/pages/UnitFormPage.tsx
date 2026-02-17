import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const UnitFormPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/units', { name });
            alert('Unidade criada com sucesso!');
            navigate('/units');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Erro ao criar unidade');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Nova Unidade</h1>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-700 mb-1">Nome da Unidade</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: UMC, SEBRAE/SP, etc."
                            className="w-full border rounded p-2 focus:outline-blue-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Criando...' : 'Criar Unidade'}
                    </button>

                    <Link to="/units" className="text-center text-gray-600 hover:underline mt-2">
                        Cancelar
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default UnitFormPage;
