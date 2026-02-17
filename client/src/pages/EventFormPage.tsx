import { useState, useEffect, type FormEvent, type FC } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';

const EventFormPage: FC = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [name, setName] = useState('');
    const [eventCode, setEventCode] = useState('');
    const [project, setProject] = useState('');
    const [action, setAction] = useState('');
    const [responsibleEmail, setResponsibleEmail] = useState('');
    const [responsiblePhone, setResponsiblePhone] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [responsibleUnit, setResponsibleUnit] = useState('');
    const [error, setError] = useState('');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const fetchEvent = async () => {
        try {
            const response = await api.get(`/events/${id}`);
            const event = response.data;
            setName(event.name);
            setEventCode(event.eventCode || '');
            setProject(event.project || '');
            setAction(event.action || '');
            setResponsibleUnit(event.responsibleUnit || '');
            setResponsibleEmail(event.responsibleEmail || '');
            setResponsiblePhone(event.responsiblePhone || '');
            setStartDate(new Date(event.startDate).toISOString().slice(0, 16));
            setEndDate(new Date(event.endDate).toISOString().slice(0, 16));
            setLocation(event.location || '');
            setDescription(event.description || '');
            setBudget(event.budget ? formatCurrency(event.budget) : '');
        } catch (error) {
            console.error('Failed to load event');
            navigate('/events');
        }
    };

    useEffect(() => {
        if (isEditing) {
            fetchEvent();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user?.role]);

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        value = value.replace(/\D/g, "");
        if (value === "") {
            setBudget("");
            return;
        }
        const numberValue = Number(value) / 100;
        setBudget(formatCurrency(numberValue));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            let numericBudget = 0;
            if (budget) {
                numericBudget = Number(budget.replace(/\D/g, "")) / 100;
            }

            const payload = {
                name,
                eventCode: eventCode || undefined,
                project,
                action,
                responsibleUnit,
                responsibleEmail,
                responsiblePhone,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                location: location || undefined,
                description: description || undefined,
                budget: numericBudget
            };

            if (isEditing) {
                await api.put(`/events/${id}`, payload);
            } else {
                await api.post('/events', payload);
            }
            navigate('/events');
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.error || err.response?.data?.details || 'Falha ao salvar evento. Verifique os dados.';
            const displayMessage = Array.isArray(message) ? message.map((m: any) => m.message).join(', ') : typeof message === 'object' ? JSON.stringify(message) : message;
            setError(displayMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex justify-center">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">{isEditing ? 'Editar Evento' : 'Novo Evento'}</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Nome do Evento</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Código do Evento</label>
                        <input
                            type="text"
                            value={eventCode}
                            onChange={e => setEventCode(e.target.value)}
                            placeholder="Código FOCO"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Projeto</label>
                        <input
                            type="text"
                            value={project}
                            onChange={e => setProject(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Ação</label>
                        <input
                            type="text"
                            value={action}
                            onChange={e => setAction(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Unidade</label>
                        <input
                            type="text"
                            value={responsibleUnit}
                            onChange={e => setResponsibleUnit(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Email do Responsável</label>
                            <input
                                type="email"
                                value={responsibleEmail}
                                onChange={e => setResponsibleEmail(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Telefone do Responsável</label>
                            <input
                                type="tel"
                                value={responsiblePhone}
                                onChange={e => setResponsiblePhone(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Início do Evento</label>
                            <input
                                type="datetime-local"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Término do Evento</label>
                            <input
                                type="datetime-local"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Local</label>
                        <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Descrição</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Orçamento (R$)</label>
                        <input
                            type="text"
                            placeholder="R$ 0,00"
                            value={budget}
                            onChange={handleBudgetChange}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                        >
                            Salvar
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/events')}
                            className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventFormPage;
