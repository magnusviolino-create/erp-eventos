
import { useState, useEffect } from 'react';
import api from '../services/api';
import type { CommunicationItem, CommunicationStatus } from '../types/CommunicationItem';
import type { Operator } from '../types/Operator';
import type { Service } from '../types/Service';
import type { Event } from '../types/Event';
import { Plus, Edit, Trash2, X, MessageSquare, Lock } from 'lucide-react'; // Added Lock icon
import { useAuth } from '../contexts/AuthContext';

interface CommunicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    event?: Event | null;
}

// Extend CommunicationItem type locally since we might not have updated the types file yet
interface ExtendedCommunicationItem extends Omit<CommunicationItem, 'date'> {
    deliveryDate: string | Date;
    createdAt: string | Date;
    quantity: number;
}

const CommunicationModal = ({ isOpen, onClose, eventId, event }: CommunicationModalProps) => {
    const { user } = useAuth();
    const isReadOnly = event?.status === 'COMPLETED' && user?.role !== 'MASTER';
    const [items, setItems] = useState<ExtendedCommunicationItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Aux Data
    const [operators, setOperators] = useState<Operator[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Form
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        serviceId: '',
        operatorId: '',
        deliveryDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        quantity: 1,
        status: 'AGUARDANDO' as CommunicationStatus
    });

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, opRes, servRes] = await Promise.all([
                api.get(`/communications?eventId=${eventId}`),
                api.get('/operators'),
                api.get('/services')
            ]);
            setItems(itemsRes.data);
            setOperators(opRes.data);
            setServices(servRes.data);
        } catch (error) {
            console.error('Failed to load communication data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingId(null);
        setFormData({
            serviceId: '',
            operatorId: '',
            deliveryDate: new Date().toISOString().split('T')[0],
            quantity: 1,
            status: 'AGUARDANDO'
        });
        setIsFormOpen(true);
    };

    const handleEdit = (item: ExtendedCommunicationItem) => {
        setEditingId(item.id);
        setFormData({
            serviceId: item.serviceId,
            operatorId: item.operatorId || '',
            deliveryDate: new Date(item.deliveryDate).toISOString().split('T')[0],
            quantity: item.quantity || 1,
            status: item.status
        });
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!formData.serviceId) return alert('Serviço é obrigatório');
        if (user?.role === 'MASTER' && !formData.operatorId) return alert('Operador é obrigatório para Master');
        if (formData.quantity < 1) return alert('Quantidade deve ser pelo menos 1');

        try {
            const payload = {
                eventId,
                ...formData,
                operatorId: formData.operatorId || undefined,
                deliveryDate: new Date(formData.deliveryDate).toISOString(),
                quantity: Number(formData.quantity)
            };

            // Clean up empty operatorId
            if (!payload.operatorId) delete (payload as any).operatorId;

            if (editingId) {
                await api.put(`/communications/${editingId}`, payload);
            } else {
                await api.post('/communications', payload);
            }

            // Refresh items only
            const res = await api.get(`/communications?eventId=${eventId}`);
            setItems(res.data);
            setIsFormOpen(false);
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar item.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir item?')) return;
        try {
            await api.delete(`/communications/${id}`);
            setItems(items.filter(i => i.id !== id));
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir.');
        }
    };

    const getStatusBadge = (status: CommunicationStatus) => {
        const styles = {
            'AGUARDANDO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'EM_ATENDIMENTO': 'bg-blue-100 text-blue-800 border-blue-200',
            'CRIACAO': 'bg-purple-100 text-purple-800 border-purple-200',
            'APROVADO': 'bg-green-100 text-green-800 border-green-200',
            'REPROVADO': 'bg-red-100 text-red-800 border-red-200',
        };
        const labels = {
            'AGUARDANDO': 'Aguardando',
            'EM_ATENDIMENTO': 'Em Atendimento',
            'CRIACAO': 'Criação',
            'APROVADO': 'Aprovado',
            'REPROVADO': 'Reprovado',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                            <MessageSquare className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Módulo de Comunicação</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie solicitações de comunicação e marketing</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-900">
                    {isFormOpen ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-white border-b pb-2 flex items-center gap-2">
                                {editingId ? <Edit size={20} /> : <Plus size={20} />}
                                {editingId ? 'Editar Item' : 'Novo Item'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Serviço/Item *</label>
                                    <select
                                        value={formData.serviceId}
                                        onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Selecione um serviço...</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                {user?.role === 'MASTER' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Operador *</label>
                                        <select
                                            value={formData.operatorId}
                                            onChange={e => setFormData({ ...formData, operatorId: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Selecione um operador...</option>
                                            {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Quantidade *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Data de Entrega</label>
                                    <input
                                        type="date"
                                        value={formData.deliveryDate}
                                        onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as CommunicationStatus })}
                                        className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="AGUARDANDO">Aguardando</option>
                                        <option value="EM_ATENDIMENTO">Em Atendimento</option>
                                        <option value="CRIACAO">Criação</option>
                                        <option value="APROVADO">Aprovado</option>
                                        <option value="REPROVADO">Reprovado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t dark:border-gray-700">
                                <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium transition">Cancelar</button>
                                <button onClick={handleSave} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-md transition transform active:scale-95">Salvar Item</button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Solicitações ({items.length})</h3>
                                {isReadOnly ? (
                                    <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium shadow-sm cursor-not-allowed">
                                        <Lock size={16} /> Somente Leitura
                                    </span>
                                ) : (
                                    <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium shadow-sm">
                                        <Plus size={18} /> Nova Solicitação
                                    </button>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                                        <tr>
                                            <th className="p-4">Data Criação</th>
                                            <th className="p-4">Data Entrega</th>
                                            <th className="p-4">Serviço/Item</th>
                                            <th className="p-4">Qtd</th>
                                            <th className="p-4">Operador</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {loading ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                                        ) : items.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhuma solicitação encontrada.</td></tr>
                                        ) : (
                                            items.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                                    <td className="p-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="p-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                        {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-800 dark:text-white">{item.service?.name}</td>
                                                    <td className="p-4 text-gray-700 dark:text-gray-300">{item.quantity}</td>
                                                    <td className="p-4 text-gray-700 dark:text-gray-300">{item.operator?.name || '-'}</td>
                                                    <td className="p-4">{getStatusBadge(item.status)}</td>
                                                    {isReadOnly ? (
                                                        <span className="text-gray-400 p-2"><Lock size={14} /></span>
                                                    ) : (
                                                        <td className="p-4 flex justify-center gap-2">
                                                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition" title="Editar"><Edit size={16} /></button>
                                                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition" title="Excluir"><Trash2 size={16} /></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunicationModal;
