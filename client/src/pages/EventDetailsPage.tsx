import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Event } from '../types/Event';
import type { Transaction, TransactionStatus } from '../types/Transaction'; // Helper import
import { useParams, Link } from 'react-router-dom';
import { generateRequisitionPDF } from '../utils/pdfGenerator';
import { FileText, Plus, Edit, Trash2, CheckSquare, Square, PlayCircle, CheckCircle, PauseCircle, XCircle } from 'lucide-react'; // Added icons
import { useAuth } from '../contexts/AuthContext';

const EventDetailsPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
    const [newDesc, setNewDesc] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [requisitionNum, setRequisitionNum] = useState('');
    const [serviceOrderNum, setServiceOrderNum] = useState('');
    const [newStatus, setNewStatus] = useState<TransactionStatus>('QUOTATION');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        value = value.replace(/\D/g, "");
        if (value === "") {
            setNewAmount("");
            return;
        }
        const numberValue = Number(value) / 100;
        setNewAmount(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue));
    };

    const openEditModal = (t: any) => {
        setEditingTransactionId(t.id);
        setNewDesc(t.description);
        setNewAmount(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount));
        setRequisitionNum(t.requisitionNum || '');
        setServiceOrderNum(t.serviceOrderNum || '');
        setNewStatus(t.status || 'QUOTATION');
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingTransactionId(null);
        setNewDesc('');
        setNewAmount('');
        setRequisitionNum('');
        setServiceOrderNum('');
        setNewStatus('QUOTATION'); // Default
        setShowModal(true);
    }

    const handleTransactionSubmit = async () => {
        if (!newDesc) return alert('Preencha a descrição (obrigatório)');
        try {
            const numericAmount = newAmount ? Number(newAmount.replace(/\D/g, "")) / 100 : 0;
            const payload = {
                description: newDesc,
                amount: numericAmount,
                requisitionNum: requisitionNum || undefined,
                serviceOrderNum: serviceOrderNum || undefined,
                status: newStatus,
            };

            if (editingTransactionId) {
                await api.put(`/transactions/${editingTransactionId}`, payload);
            } else {
                await api.post('/transactions', {
                    ...payload,
                    type: 'EXPENSE',
                    eventId: id,
                });
            }

            setShowModal(false);
            setEditingTransactionId(null);
            setNewDesc('');
            setNewAmount('');
            setRequisitionNum('');
            setServiceOrderNum('');
            setNewStatus('QUOTATION');
            fetchEvent(); // Refresh data
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.error || error.message || 'Erro ao salvar despesa';
            alert(`Erro: ${errorMessage}`);
        }
    };

    const handleDeleteTransaction = async (tid: string) => {
        if (!confirm('Excluir despesa?')) return;
        try {
            await api.delete(`/transactions/${tid}`);
            fetchEvent();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir');
        }
    };

    const handleUpdateStatus = async (newStatus: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELED' | 'OPEN', reason?: string) => {
        try {
            await api.put(`/events/${id}`, { status: newStatus, cancellationReason: reason });
            fetchEvent();
        } catch (error) {
            console.error('Erro ao atualizar status', error);
            alert('Erro ao atualizar status do evento');
        }
    };

    const handleCancelSubmit = async () => {
        if (!cancelReason.trim()) return alert('Por favor, informe o motivo do cancelamento.');
        await handleUpdateStatus('CANCELED', cancelReason);
        setShowCancelModal(false);
        setCancelReason('');
    };

    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

    const toggleSelectTransaction = (id: string) => {
        setSelectedTransactions(prev =>
            prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (event && event.transactions) {
            if (selectedTransactions.length === event.transactions.length) {
                setSelectedTransactions([]);
            } else {
                setSelectedTransactions(event.transactions.map(t => t.id));
            }
        }
    };

    const handleExportPDF = () => {
        if (!event || !event.transactions || selectedTransactions.length === 0) return;
        const transactionsToExport = event.transactions.filter(t => selectedTransactions.includes(t.id));
        generateRequisitionPDF(event, transactionsToExport);
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await api.get(`/events/${id}`);
            const eventData = response.data;
            // Sort Transactions: Most recent first
            if (eventData.transactions) {
                eventData.transactions.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
            }
            setEvent(eventData);
        } catch (error) {
            console.error('Erro ao buscar evento', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: TransactionStatus) => {
        const styles = {
            'APPROVED': 'bg-green-100 text-green-800 border-green-200',
            'REJECTED': 'bg-red-100 text-red-800 border-red-200',
            'QUOTATION': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'PRODUCTION': 'bg-blue-100 text-blue-800 border-blue-200',
            'COMPLETED': 'bg-gray-100 text-gray-800 border-gray-200', // Added COMPLETED style
        };
        const labels = {
            'APPROVED': 'Aprovado',
            'REJECTED': 'Reprovado',
            'QUOTATION': 'Orçamento',
            'PRODUCTION': 'Produção',
            'COMPLETED': 'Concluído', // Added COMPLETED label
        };
        return (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${styles[status] || styles['QUOTATION']}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center">Carregando detalhes...</div>;
    if (!event) return <div className="p-8 text-center text-red-500">Evento não encontrado.</div>;

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            {loading ? (
                <p className="text-center text-gray-500">Carregando detalhes do evento...</p>
            ) : !event ? (
                <p className="text-center text-red-500">Evento não encontrado.</p>
            ) : (
                <>
                    {/* Header */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.name}</h1>
                                <div className="flex flex-wrap gap-4 text-gray-500 text-sm">
                                    <p className="flex items-center gap-1">📅 {new Date(event.startDate).toLocaleString()}</p>
                                    <p className="flex items-center gap-1">🏁 {new Date(event.endDate).toLocaleString()}</p>
                                    <p className="flex items-center gap-1">📍 {event.location}</p>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    {event.description && <p className="text-gray-600">{event.description}</p>}
                                    {event.status === 'IN_PROGRESS' && (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                            <PlayCircle size={14} /> Em Atendimento
                                        </span>
                                    )}
                                    {event.status === 'PAUSED' && (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200 flex items-center gap-1">
                                            <PauseCircle size={14} /> Pausado
                                        </span>
                                    )}
                                    {event.status === 'COMPLETED' && (
                                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200 flex items-center gap-1">
                                            <CheckCircle size={14} /> Concluído
                                        </span>
                                    )}
                                    {event.status === 'CANCELED' && (
                                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-red-200 flex items-center gap-1">
                                            <XCircle size={14} /> Cancelado
                                        </span>
                                    )}
                                    {event.status === 'OPEN' && (
                                        <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-gray-200">
                                            Aberto
                                        </span>
                                    )}
                                </div>
                                {event.status === 'CANCELED' && event.cancellationReason && (
                                    <div className="mt-4 bg-red-50 border border-red-100 rounded-md p-3 text-sm text-red-800">
                                        <span className="font-bold block mb-1">Motivo do Cancelamento:</span>
                                        {event.cancellationReason}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                {(user?.role === 'MASTER' || user?.role === 'MANAGER') && (
                                    <>
                                        {event.status === 'OPEN' && (
                                            <button
                                                onClick={() => handleUpdateStatus('IN_PROGRESS')}
                                                className="flex items-center gap-2 px-4 py-2 rounded font-medium border border-blue-600 text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                <PlayCircle size={18} />
                                                Iniciar Atendimento
                                            </button>
                                        )}
                                        {event.status === 'IN_PROGRESS' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus('PAUSED')} className="flex items-center gap-2 px-3 py-2 rounded font-medium border border-yellow-500 text-yellow-600 hover:bg-yellow-50 transition-colors">
                                                    <PauseCircle size={18} /> Pausar
                                                </button>
                                                <button onClick={() => handleUpdateStatus('COMPLETED')} className="flex items-center gap-2 px-3 py-2 rounded font-medium border border-green-600 text-white bg-green-600 hover:bg-green-700 transition-colors">
                                                    <CheckCircle size={18} /> Finalizar
                                                </button>
                                                <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-2 px-3 py-2 rounded font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                                                    <XCircle size={18} /> Cancelar
                                                </button>
                                            </>
                                        )}
                                        {event.status === 'PAUSED' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="flex items-center gap-2 px-3 py-2 rounded font-medium border border-blue-600 text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                                                    <PlayCircle size={18} /> Retomar
                                                </button>
                                                <button onClick={() => handleUpdateStatus('COMPLETED')} className="flex items-center gap-2 px-3 py-2 rounded font-medium border border-green-600 text-white bg-green-600 hover:bg-green-700 transition-colors">
                                                    <CheckCircle size={18} /> Finalizar
                                                </button>
                                                <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-2 px-3 py-2 rounded font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                                                    <XCircle size={18} /> Cancelar
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                                {(user?.role === 'MASTER') && event.status === 'CANCELED' && (
                                    <button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="flex items-center gap-2 px-3 py-2 rounded font-medium border border-blue-600 text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                                        <PlayCircle size={18} /> Reabrir Evento
                                    </button>
                                )}
                                {event.status !== 'CANCELED' && (
                                    <Link to={`/events/edit/${id}`} className="flex items-center gap-2 px-4 py-2 rounded font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                                        <Edit size={18} />
                                        Editar Evento
                                    </Link>
                                )}
                                <button
                                    onClick={handleExportPDF}
                                    disabled={selectedTransactions.length === 0 || event.status === 'CANCELED'}
                                    className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors border ${selectedTransactions.length > 0 && event.status !== 'CANCELED'
                                        ? 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                        : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                        }`}
                                    title={event.status === 'CANCELED' ? "Evento cancelado" : selectedTransactions.length === 0 ? "Selecione itens na tabela para exportar" : "Gerar PDF dos itens selecionados"}
                                >
                                    <FileText size={18} />
                                    Exportar PDF ({selectedTransactions.length})
                                </button>
                                <Link to="/events" className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-bold py-2 px-4 rounded transition duration-200">
                                    Voltar
                                </Link>
                            </div>
                        </div>

                        {/* Key Details */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase">Código do Evento</h3>
                                <p className="text-gray-800">{event.eventCode || '-'}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase">Projeto</h3>
                                <p className="text-gray-800">{event.project || '-'}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase">Ação</h3>
                                <p className="text-gray-800">{event.action || '-'}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase">Unidade</h3>
                                <p className="text-gray-800">{event.responsibleUnit || '-'}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase">Responsável</h3>
                                <p className="text-gray-800">
                                    {event.responsibleEmail || '-'}
                                    {event.responsiblePhone && <span className="block text-sm text-gray-500">{event.responsiblePhone}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 rounded-lg border border-gray-100 shadow-sm bg-white text-center">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Orçamento</h3>
                                <p className="text-2xl font-bold text-gray-800">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.budget || 0)}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-100 shadow-sm bg-white text-center">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Gasto</h3>
                                <p className="text-2xl font-bold text-red-500">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                        event.transactions?.reduce((acc, t) => acc + t.amount, 0) || 0
                                    )}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-100 shadow-sm bg-white text-center">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Saldo</h3>
                                <p className="text-2xl font-bold text-green-500">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                        (event.budget || 0) - (event.transactions?.reduce((acc, t) => acc + t.amount, 0) || 0)
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Requisições</h3>
                            {event.status !== 'CANCELED' && (
                                <button
                                    onClick={openCreateModal}
                                    className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-md shadow-sm transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <Plus size={16} /> Nova Requisição
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-white text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                                    <tr>
                                        <th className="py-3 px-4 w-10">
                                            <button
                                                onClick={toggleSelectAll}
                                                className="hover:bg-gray-100 rounded p-1 transition-colors"
                                                title="Selecionar Todos"
                                            >
                                                {event.transactions && event.transactions.length > 0 && selectedTransactions.length === event.transactions.length ? (
                                                    <CheckSquare size={18} className="text-gray-800" />
                                                ) : (
                                                    <Square size={18} className="text-gray-400" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="py-3 px-4">Data</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Descrição</th>
                                        <th className="py-3 px-4">Nº Req.</th>
                                        <th className="py-3 px-4">Nº OC</th>
                                        <th className="py-3 px-4 text-right">Valor</th>
                                        <th className="py-3 px-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm">
                                    {!event.transactions || event.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-gray-400">
                                                Nenhuma despesa lançada ainda.
                                            </td>
                                        </tr>
                                    ) : (
                                        event.transactions.map((t) => (
                                            <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedTransactions.includes(t.id) ? 'bg-gray-50' : ''}`}>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => toggleSelectTransaction(t.id)}
                                                        className="hover:bg-gray-200 rounded p-1 transition-colors"
                                                    >
                                                        {selectedTransactions.includes(t.id) ? (
                                                            <CheckSquare size={18} className="text-gray-800" />
                                                        ) : (
                                                            <Square size={18} className="text-gray-400" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    {new Date(t.date).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    {getStatusBadge(t.status || 'QUOTATION')}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-gray-900">
                                                    {t.description}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400">
                                                    {t.requisitionNum || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400">
                                                    {t.serviceOrderNum || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-red-600 whitespace-nowrap">
                                                    - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                                </td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(t)}
                                                            className="text-gray-400 hover:text-blue-600 transition"
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTransaction(t.id)}
                                                            className="text-gray-400 hover:text-red-600 transition"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl text-gray-800">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Cancelar Evento</h2>
                        <p className="text-gray-600 mb-4">Por favor, informe o motivo do cancelamento deste evento.</p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-gray-900 mb-4 h-32"
                            placeholder="Motivo do cancelamento..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleCancelSubmit}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
                            >
                                Confirmar Cancelamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl text-gray-800">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{editingTransactionId ? 'Editar Despesa' : 'Nova Requisição'}</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1 text-gray-700">Descrição *</label>
                            <input
                                type="text"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                placeholder="Ex: Banner, Buffet..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Valor (R$)</label>
                                <input
                                    type="text"
                                    value={newAmount}
                                    onChange={handleAmountChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="R$ 0,00 (Opcional)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as TransactionStatus)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                >
                                    <option value="QUOTATION">Orçamento</option>
                                    <option value="APPROVED">Aprovado</option>
                                    <option value="PRODUCTION">Produção</option>
                                    <option value="COMPLETED">Concluído</option>
                                    <option value="REJECTED">Reprovado</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Nº Requisição</label>
                                <input
                                    type="text"
                                    value={requisitionNum}
                                    onChange={(e) => setRequisitionNum(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="Opcional"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Nº OC</label>
                                <input
                                    type="text"
                                    value={serviceOrderNum}
                                    onChange={(e) => setServiceOrderNum(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleTransactionSubmit}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetailsPage;
