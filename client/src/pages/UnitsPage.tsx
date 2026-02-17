import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Unit } from '../types/Unit';

const UnitsPage = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const response = await api.get('/units');
                setUnits(response.data);
            } catch (error) {
                console.error('Failed to fetch units', error);
                alert('Erro ao carregar unidades.');
            } finally {
                setLoading(false);
            }
        };

        fetchUnits();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Carregando unidades...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Gerenciar Unidades</h1>
                    <div className="flex gap-4">
                        <Link to="/dashboard" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">
                            Voltar
                        </Link>
                        <Link to="/units/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Nova Unidade
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="p-4 border-b">Nome da Unidade</th>
                                <th className="p-4 border-b">ID (UUID)</th>
                                <th className="p-4 border-b">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => (
                                <tr key={unit.id} className="hover:bg-gray-50 text-gray-800 border-b last:border-0">
                                    <td className="p-4 font-semibold">{unit.name}</td>
                                    <td className="p-4 font-mono text-sm text-gray-500">{unit.id}</td>
                                    <td className="p-4 text-gray-600">
                                        {new Date(unit.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {units.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        Nenhuma unidade encontrada.
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

export default UnitsPage;
