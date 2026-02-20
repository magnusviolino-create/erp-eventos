
import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Event } from '../types/Event';
import { useParams, Link } from 'react-router-dom';
import { Edit, PlayCircle, CheckCircle, PauseCircle, XCircle, DollarSign, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import RequisitionsModal from '../components/RequisitionsModal';
import CommunicationModal from '../components/CommunicationModal';

const EventDetailsPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isRequisitionsOpen, setIsRequisitionsOpen] = useState(false);
    const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await api.get(`/events/${id}`);
            const eventData = response.data;
            setEvent(eventData);
        } catch (error) {
            console.error('Erro ao buscar evento', error);
        } finally {
            setLoading(false);
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

    if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Carregando detalhes...</div>;
    if (!event) return <div className="p-8 text-center text-red-500">Evento não encontrado.</div>;

    const totalExpense = event.transactions?.reduce((acc, t) => {
        if (t.status === 'REJECTED') return acc;
        return acc + t.amount;
    }, 0) || 0;
    const balance = (event.budget || 0) - totalExpense;

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{event.name}</h1>
                        <div className="flex flex-wrap gap-4 text-gray-500 dark:text-gray-400 text-sm">
                            <p className="flex items-center gap-1">📅 {new Date(event.startDate).toLocaleString()}</p>
                            <p className="flex items-center gap-1">🏁 {new Date(event.endDate).toLocaleString()}</p>
                            <p className="flex items-center gap-1">📍 {event.location}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            {event.description && <p className="text-gray-600 dark:text-gray-300">{event.description}</p>}

                            {/* Status Badges */}
                            {event.status === 'IN_PROGRESS' && (
                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                    <PlayCircle size={14} /> Em Atendimento
                                </span>
                            )}
                            {event.status === 'PAUSED' && (
                                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-800 flex items-center gap-1">
                                    <PauseCircle size={14} /> Pausado
                                </span>
                            )}
                            {event.status === 'COMPLETED' && (
                                <span className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200 dark:border-green-800 flex items-center gap-1">
                                    <CheckCircle size={14} /> Concluído
                                </span>
                            )}
                            {event.status === 'CANCELED' && (
                                <span className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 text-xs font-semibold px-2.5 py-0.5 rounded border border-red-200 dark:border-red-800 flex items-center gap-1">
                                    <XCircle size={14} /> Cancelado
                                </span>
                            )}
                            {event.status === 'OPEN' && (
                                <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold px-2.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                    Aberto
                                </span>
                            )}
                        </div>
                        {event.status === 'CANCELED' && event.cancellationReason && (
                            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md p-3 text-sm text-red-800 dark:text-red-300">
                                <span className="font-bold block mb-1">Motivo do Cancelamento:</span>
                                {event.cancellationReason}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                        {(user?.role === 'MASTER' || user?.role === 'MANAGER') && (
                            <>
                                {event.status === 'OPEN' && (
                                    <button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="flex items-center gap-2 px-4 py-2 rounded font-medium border border-blue-600 text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
                                        <PlayCircle size={18} /> Iniciar Atendimento
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
                        {event.status !== 'CANCELED' && (event.status !== 'COMPLETED' || user?.role === 'MASTER') && (
                            <Link to={`/events/edit/${id}`} className="flex items-center gap-2 px-4 py-2 rounded font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                                <Edit size={18} /> Editorial
                            </Link>
                        )}
                        <Link to="/events" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-bold py-2 px-4 rounded transition duration-200">
                            Voltar
                        </Link>
                    </div>
                </div>

                {/* Key Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Código</h3>
                        <p className="text-gray-800 dark:text-white">{event.eventCode || '-'}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Unidade</h3>
                        <p className="text-gray-800 dark:text-white">{event.responsibleUnit || '-'}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Responsável</h3>
                        <p className="text-gray-800 dark:text-white">{event.responsibleEmail || '-'}</p>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-700 text-center">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Orçamento</h3>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.budget || 0)}
                        </p>
                    </div>
                    <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-700 text-center">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Gasto</h3>
                        <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                        </p>
                    </div>
                    <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-700 text-center">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Saldo</h3>
                        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Modules Buttons Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <button
                    onClick={() => setIsRequisitionsOpen(true)}
                    className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 group hover:-translate-y-1"
                >
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition">
                        <DollarSign className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Módulo de Requisições</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                        Gerenciar orçamentos, cotações e despesas financeiras.
                    </p>
                </button>

                <button
                    onClick={() => setIsCommunicationOpen(true)}
                    className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 group hover:-translate-y-1"
                >
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition">
                        <MessageSquare className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Módulo de Comunicação</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                        Solicitações de marketing, peças e comunicação visual.
                    </p>
                </button>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl text-gray-800 dark:text-white">
                        <h2 className="text-xl font-bold mb-4">Cancelar Evento</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Por favor, informe o motivo do cancelamento deste evento.</p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-red-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 h-32"
                            placeholder="Motivo do cancelamento..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded transition"
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

            {/* Lazy loaded Modals */}
            {isRequisitionsOpen && (
                <RequisitionsModal
                    isOpen={isRequisitionsOpen}
                    onClose={() => setIsRequisitionsOpen(false)}
                    eventId={id || ''}
                    event={event}
                    onUpdate={fetchEvent} // Refresh details on update (e.g. balance)
                />
            )}

            {isCommunicationOpen && (
                <CommunicationModal
                    isOpen={isCommunicationOpen}
                    onClose={() => setIsCommunicationOpen(false)}
                    eventId={id || ''}
                    event={event}
                />
            )}

        </div>
    );
};

export default EventDetailsPage;
