
import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Requisition } from '../types/Requisition';
import type { Transaction, TransactionStatus } from '../types/Transaction';
import type { Event } from '../types/Event';
import { generateRequisitionPDF } from '../utils/pdfGenerator';
import { FileText, Plus, Edit, Trash2, X, ArrowLeft, ChevronRight } from 'lucide-react';

interface RequisitionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    event?: Event | null; // Optional, to pass event context if available
    onUpdate?: () => void;
}

const RequisitionsModal = ({ isOpen, onClose, eventId, event, onUpdate }: RequisitionsModalProps) => {
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST');
    const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);

    // Item Form
    const [isItemFormOpen, setIsItemFormOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [itemDesc, setItemDesc] = useState('');
    const [itemAmount, setItemAmount] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemReqNum, setItemReqNum] = useState(''); // Legacy/Manual field
    const [itemSoNum, setItemSoNum] = useState('');
    const [itemStatus, setItemStatus] = useState<TransactionStatus>('QUOTATION');
    const [itemDeliveryDate, setItemDeliveryDate] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && eventId) {
            fetchRequisitions();
        }
    }, [isOpen, eventId]);

    const fetchRequisitions = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/requisitions?eventId=${eventId}`);
            setRequisitions(response.data);

            // Should refetch selected requisition if open?
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequisition = async () => {
        try {
            const res = await api.post('/requisitions', { eventId });
            const newReq = res.data;
            await fetchRequisitions(); // Refresh list
            handleOpenRequisition(newReq); // Open new requisition
        } catch (error) {
            console.error(error);
            alert('Erro ao criar requisição.');
        }
    };

    const handleOpenRequisition = async (req: Requisition) => {
        // Fetch full details including transactions
        try {
            const res = await api.get(`/requisitions/${req.id}`);
            setSelectedRequisition(res.data);
            setSelectedItemIds([]); // Reset selection
            setViewMode('DETAILS');
        } catch (error) {
            console.error(error);
        }
    };

    const handleBackToList = () => {
        setViewMode('LIST');
        setSelectedRequisition(null);
        fetchRequisitions(); // Refresh list to update totals if needed
    };

    const handleDeleteRequisition = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Excluir requisição e todos os seus itens?')) return;
        try {
            await api.delete(`/requisitions/${id}`);
            fetchRequisitions();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir requisição.');
        }
    };

    // --- Item Management (Transaction) ---

    const handleNewItem = () => {
        setEditingItemId(null);
        setItemDesc('');
        setItemAmount('');
        setItemQuantity(1);
        setItemReqNum(''); // Maybe default to requisition number?
        setItemSoNum('');
        setItemStatus('QUOTATION');
        setItemDeliveryDate('');
        setIsItemFormOpen(true);
    };

    const handleEditItem = (t: Transaction) => {
        setEditingItemId(t.id);
        setItemDesc(t.description);
        setItemAmount(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount));
        setItemQuantity(t.quantity || 1);
        setItemReqNum(t.requisitionNum || '');
        setItemSoNum(t.serviceOrderNum || '');
        setItemStatus(t.status);
        setItemDeliveryDate(t.deliveryDate ? new Date(t.deliveryDate).toISOString().split('T')[0] : '');
        setIsItemFormOpen(true);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value === "") {
            setItemAmount("");
            return;
        }
        const numberValue = Number(value) / 100;
        setItemAmount(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue));
    };

    const handleSaveItem = async () => {
        if (!selectedRequisition) return;
        if (!itemDesc) return alert('Descrição obrigatória');

        try {
            const numericAmount = itemAmount ? Number(itemAmount.replace(/\D/g, "")) / 100 : 0;
            const payload = {
                description: itemDesc,
                amount: numericAmount,
                quantity: Number(itemQuantity),
                status: itemStatus,
                requisitionNum: itemReqNum,
                serviceOrderNum: itemSoNum,
                eventId: eventId,
                requisitionId: selectedRequisition.id,
                type: 'EXPENSE', // Default type
                deliveryDate: itemDeliveryDate ? new Date(itemDeliveryDate).toISOString() : undefined,
            };

            if (editingItemId) {
                await api.put(`/transactions/${editingItemId}`, payload);
            } else {
                await api.post('/transactions', payload);
            }

            // Refresh selected requisition details
            const res = await api.get(`/requisitions/${selectedRequisition.id}`);
            setSelectedRequisition(res.data);
            setIsItemFormOpen(false);
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar item.');
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Excluir item?')) return;
        try {
            await api.delete(`/transactions/${id}`);
            if (selectedRequisition) {
                const res = await api.get(`/requisitions/${selectedRequisition.id}`);
                setSelectedRequisition(res.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleSelectItem = (id: string) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (!selectedRequisition?.transactions) return;
        if (selectedItemIds.length === selectedRequisition.transactions.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(selectedRequisition.transactions.map(t => t.id));
        }
    };

    const handleExportPDF = () => {
        if (!selectedRequisition || !event) return;
        const itemsToExport = selectedRequisition.transactions?.filter(t => selectedItemIds.includes(t.id)) || [];

        if (itemsToExport.length === 0) {
            return alert('Selecione pelo menos um item para exportar.');
        }

        generateRequisitionPDF(event, itemsToExport, selectedRequisition);
    };

    const getStatusBadge = (s: TransactionStatus) => {
        const styles: Record<string, string> = {
            'APPROVED': 'bg-green-100 text-green-800 border-green-200',
            'REJECTED': 'bg-red-100 text-red-800 border-red-200',
            'QUOTATION': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'PRODUCTION': 'bg-blue-100 text-blue-800 border-blue-200',
            'COMPLETED': 'bg-gray-100 text-gray-800 border-gray-200',
        };
        const labels: Record<string, string> = {
            'APPROVED': 'Aprovado',
            'REJECTED': 'Reprovado',
            'QUOTATION': 'Orçamento',
            'PRODUCTION': 'Produção',
            'COMPLETED': 'Concluído',
        };
        return (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${styles[s] || styles['QUOTATION']}`}>
                {labels[s] || s}
            </span>
        );
    };

    // Calculations for list view
    const getRequisitionTotal = (req: Requisition) => {
        return req.transactions?.reduce((acc, t) => acc + (t.amount * (t.quantity || 1)), 0) || 0;
    };

    const getRequisitionItemsCount = (req: Requisition) => {
        return req.transactions?.length || 0;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        {viewMode === 'DETAILS' && (
                            <button onClick={handleBackToList} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {viewMode === 'LIST' ? 'Módulo de Requisições' : `Requisição #${selectedRequisition?.number}`}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {viewMode === 'LIST' ? 'Gerencie as despesas e requisições deste evento' : `Detalhes da requisição e itens associados`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-900">

                    {viewMode === 'LIST' ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Requisições Cadastradas</h3>
                                <button onClick={handleCreateRequisition} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium shadow-sm">
                                    <Plus size={16} /> Nova Requisição
                                </button>
                            </div>

                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="p-4">Número</th>
                                        <th className="p-4">Data</th>
                                        <th className="p-4 text-center">Itens</th>
                                        <th className="p-4 text-right">Valor Total</th>
                                        <th className="p-4 text-center">Ações</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                                    ) : requisitions.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhuma requisição encontrada.</td></tr>
                                    ) : (
                                        requisitions.map(req => (
                                            <tr key={req.id} onClick={() => handleOpenRequisition(req)} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer group">
                                                <td className="p-4 font-bold text-gray-800 dark:text-white">#{req.number}</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4 text-center text-gray-700 dark:text-gray-300">{getRequisitionItemsCount(req)}</td>
                                                <td className="p-4 text-right font-medium text-gray-800 dark:text-white">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getRequisitionTotal(req))}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={(e) => handleDeleteRequisition(req.id, e)} className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                                <td className="p-4 text-gray-400">
                                                    <ChevronRight size={18} className="group-hover:text-blue-600 transition-colors" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // DETAILS VIEW
                        <div className="space-y-6">
                            {/* Actions Bar */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">Total da Requisição</span>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {selectedRequisition && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getRequisitionTotal(selectedRequisition))}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm font-medium">
                                        <FileText size={16} /> Exportar Selecionados
                                    </button>
                                    <button onClick={handleNewItem} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium shadow-sm">
                                        <Plus size={16} /> Adicionar Item
                                    </button>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                                        <tr>
                                            <th className="p-4 w-10">
                                                <input type="checkbox" checked={selectedRequisition?.transactions?.length === selectedItemIds.length && selectedItemIds.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            </th>
                                            <th className="p-4">Qtd</th>
                                            <th className="p-4">Descrição</th>
                                            <th className="p-4">Entrega</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Valor Unit.</th>
                                            <th className="p-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {selectedRequisition?.transactions?.map(t => (
                                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                                <td className="p-4"><input type="checkbox" checked={selectedItemIds.includes(t.id)} onChange={() => toggleSelectItem(t.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                                                <td className="p-4 font-medium text-gray-800 dark:text-white">{t.quantity || 1}</td>
                                                <td className="p-4 text-gray-800 dark:text-white">{t.description}</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{t.deliveryDate ? new Date(t.deliveryDate).toLocaleDateString() : '-'}</td>
                                                <td className="p-4">{getStatusBadge(t.status)}</td>
                                                <td className="p-4 text-right text-gray-600 dark:text-gray-400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                                </td>
                                                <td className="p-4 flex justify-center gap-2">
                                                    <button onClick={() => handleEditItem(t)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteItem(t.id)} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!selectedRequisition?.transactions || selectedRequisition.transactions.length === 0) && (
                                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum item nesta requisição. Adicione um novo item.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Item Modal (Overlay) */}
                {isItemFormOpen && (
                    <div className="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white border-b pb-2">
                                {editingItemId ? 'Editar Item' : 'Novo Item da Requisição'}
                            </h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descrição *</label>
                                    <input value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Quantidade</label>
                                        <input type="number" min="1" value={itemQuantity} onChange={e => setItemQuantity(parseInt(e.target.value) || 1)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Valor Unit. (R$)</label>
                                        <input value={itemAmount} onChange={handleAmountChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data de Entrega</label>
                                        <input type="date" value={itemDeliveryDate} onChange={e => setItemDeliveryDate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
                                        <select value={itemStatus} onChange={e => setItemStatus(e.target.value as TransactionStatus)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="QUOTATION">Orçamento</option>
                                            <option value="APPROVED">Aprovado</option>
                                            <option value="PRODUCTION">Produção</option>
                                            <option value="COMPLETED">Concluído</option>
                                            <option value="REJECTED">Reprovado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button onClick={() => setIsItemFormOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium">Cancelar</button>
                                    <button onClick={handleSaveItem} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm">Salvar Item</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default RequisitionsModal;
