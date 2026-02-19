
import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import api from '../services/api';
import type { Operator } from '../types/Operator';
import { Edit, Trash2, Plus, X } from 'lucide-react';

const OperatorsPage = () => {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchOperators();
    }, []);

    const fetchOperators = async () => {
        try {
            const response = await api.get('/operators');
            setOperators(response.data);
        } catch (error) {
            console.error('Failed to fetch operators', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (operator?: Operator) => {
        if (operator) {
            setEditingOperator(operator);
            setFormData({ name: operator.name });
        } else {
            setEditingOperator(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOperator(null);
        setFormData({ name: '' });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setSaving(true);
        try {
            if (editingOperator) {
                await api.put(`/operators/${editingOperator.id}`, formData);
            } else {
                await api.post('/operators', formData);
            }
            fetchOperators();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save operator', error);
            alert('Erro ao salvar operador.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este operador?')) return;
        try {
            await api.delete(`/operators/${id}`);
            setOperators(operators.filter(op => op.id !== id));
        } catch (error) {
            console.error('Failed to delete operator', error);
            alert('Erro ao excluir operador.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Operadores</h1>
                    <div className="flex gap-4 items-center">
                        <ThemeToggle />
                        <Link to="/dashboard" className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition">
                            Voltar
                        </Link>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Plus size={18} /> Novo Operador
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden transition-colors duration-300">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                <th className="p-4 border-b dark:border-gray-600">Nome</th>
                                <th className="p-4 border-b dark:border-gray-600 w-32 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={2} className="p-8 text-center text-gray-500">Carregando...</td>
                                </tr>
                            ) : operators.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="p-8 text-center text-gray-500 dark:text-gray-400">Nenhum operador cadastrado.</td>
                                </tr>
                            ) : (
                                operators.map((op) => (
                                    <tr key={op.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 last:border-0">
                                        <td className="p-4">{op.name}</td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(op)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(op.id)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {editingOperator ? 'Editar Operador' : 'Novo Operador'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Nome do Operador"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatorsPage;
