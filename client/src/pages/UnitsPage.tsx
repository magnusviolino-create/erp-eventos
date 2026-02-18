import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
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
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Unidades</h1>
                    <div className="flex gap-4 items-center">
                        <ThemeToggle />
                        <Link to="/dashboard" className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition">
                            Voltar
                        </Link>
                        <Link to="/units/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Nova Unidade
                        </Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden transition-colors duration-300">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                <th className="p-4 border-b dark:border-gray-600">Nome da Unidade</th>
                                <th className="p-4 border-b dark:border-gray-600">ID (UUID)</th>
                                <th className="p-4 border-b dark:border-gray-600">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => (
                                <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 last:border-0">
                                    <td className="p-4 font-semibold">{unit.name}</td>
                                    <td className="p-4 font-mono text-sm text-gray-500 dark:text-gray-400">{unit.id}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">
                                        {new Date(unit.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {units.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500 dark:text-gray-400">
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
