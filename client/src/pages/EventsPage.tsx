import { useEffect, useState, useContext, type FC } from 'react';
import api from '../services/api';
import type { Event } from '../types/Event';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Clock, PlayCircle, CheckCircle, XCircle, PauseCircle } from 'lucide-react';

interface Unit {
    id: string;
    name: string;
}

const EventsPage: FC = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date-asc');
    const [minBudget, setMinBudget] = useState<number | ''>('');
    const [maxBudget, setMaxBudget] = useState<number | ''>('');
    const [maxBudgetLimit, setMaxBudgetLimit] = useState(0);

    useEffect(() => {
        fetchEvents();
        fetchUnits();
    }, []);

    useEffect(() => {
        // Recalculate max budget whenever events change (initially)
        if (events.length > 0) {
            const max = Math.max(...events.map(e => e.budget || 0));
            setMaxBudgetLimit(max > 0 ? max : 10000); // Default to 10k if no budgets
        }
    }, [events]);
    // We don't auto-filter on events change to avoid resetting user filters, but we need max limit. 
    // Actually, filterEvents depends on events, so if we add a new event, we might want to re-filter? 
    // User asked for manual triggers. Let's keep manual triggers for filters, but maybe auto-update max limit is fine.

    // Initial load filter
    useEffect(() => {
        if (events.length > 0) filterEvents();
    }, [events.length]); // Only on mount/data load

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            const data = response.data;
            setEvents(data);

            // Set initial max budget limit
            const max = Math.max(...data.map((e: Event) => e.budget || 0));
            setMaxBudgetLimit(max > 0 ? max : 10000);

        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await api.get('/units');
            setUnits(response.data);
        } catch (error) {
            console.error('Failed to fetch units', error);
        }
    };

    const handleApplyFilters = () => {
        filterEvents();
    };

    const handleSearch = () => {
        filterEvents();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };



    // Better Clear implementation directly modifying filtered list to match "Default" state expectation
    const [showFilters, setShowFilters] = useState(false);

    // Helper to format raw number to currency string for display (e.g. 1234.56 -> R$ 1.234,56)
    // But for input masking as requested "digitando o número e ele automaticamente vai adicionando os centavos":
    // We usually handle this by keeping a raw numeric state and formatting on render, or handling string input.
    // Let's use string state for inputs to handle the mask smoothly.
    const [minBudgetInput, setMinBudgetInput] = useState('');
    const [maxBudgetInput, setMaxBudgetInput] = useState('');

    const formatCurrencyInput = (value: string) => {
        // Remove non-digits
        const digits = value.replace(/\D/g, '');
        if (!digits) return '';
        // Treat as cents
        const amount = Number(digits) / 100;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
    };

    const parseCurrencyInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        return digits ? Number(digits) / 100 : '';
    };

    const handleMinBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrencyInput(e.target.value);
        setMinBudgetInput(formatted);
        const raw = parseCurrencyInput(e.target.value);
        setMinBudget(raw);
    };

    const handleMaxBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrencyInput(e.target.value);
        setMaxBudgetInput(formatted);
        const raw = parseCurrencyInput(e.target.value);
        setMaxBudget(raw);
    };

    const handleClear = () => {
        setSearchTerm('');
        setSelectedUnit('all');
        setSelectedStatus('all');
        setSelectedMonth('all');
        setSelectedYear('all');
        setSortBy('date-asc');
        setMinBudget('');
        setMaxBudget('');
        setMinBudgetInput('');
        setMaxBudgetInput('');

        // Manually apply the "Default" filter logic immediately (Show All)
        const filtered = [...events];
        // Reset sorting too (date-asc default)
        filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setFilteredEvents(filtered);
    }

    const filterEvents = () => {
        let filtered = [...events]; // Copy to avoid mutation issues

        // Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.name.toLowerCase().includes(lowerTerm) ||
                (e.eventCode && e.eventCode.toLowerCase().includes(lowerTerm)) ||
                (e.location && e.location.toLowerCase().includes(lowerTerm))
            );
        }

        // Filter by Unit (if selected)
        if (selectedUnit !== 'all') {
            filtered = filtered.filter(e => e.unit?.name === selectedUnit);
        }

        // Filter by Status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(e => e.status === selectedStatus);
        }

        // Filter by Year
        // Filter by Year
        if (selectedYear !== 'all') {
            filtered = filtered.filter(event => new Date(event.startDate).getFullYear() === Number(selectedYear));
        }

        // Filter by Month (if selected)
        if (selectedMonth !== 'all') {
            filtered = filtered.filter(event => new Date(event.startDate).getMonth() === Number(selectedMonth));
        }

        // Filter by Budget Range
        if (minBudget !== '') {
            filtered = filtered.filter(e => (e.budget || 0) >= Number(minBudget));
        }
        if (maxBudget !== '') {
            filtered = filtered.filter(e => (e.budget || 0) <= Number(maxBudget));
        }

        // Apply Sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'date-asc':
                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                case 'date-desc':
                    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                case 'created-asc':
                    return (a.createdAt && b.createdAt) ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : 0;
                case 'created-desc':
                    return (a.createdAt && b.createdAt) ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0;
                case 'budget-asc':
                    return (a.budget || 0) - (b.budget || 0);
                case 'budget-desc':
                    return (b.budget || 0) - (a.budget || 0);
                default:
                    return 0;
            }
        });

        setFilteredEvents(filtered);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            await api.delete(`/events/${id}`);
            // Update both lists
            const newEvents = events.filter(event => event.id !== id);
            setEvents(newEvents);
            // We should re-filter or just remove from filtered list too
            setFilteredEvents(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error(error);
            alert('Falha ao excluir evento');
        }
    };

    // Calculate Financial Summary
    const totalBudget = filteredEvents.reduce((acc, event) => acc + (event.budget || 0), 0);
    const totalSpent = filteredEvents.reduce((acc, event) => {
        const eventExpenses = (event.transactions || [])
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);
        return acc + eventExpenses;
    }, 0);
    const totalBalance = totalBudget - totalSpent;
    const spendingPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const months = [
        { value: 'all', label: 'Todos os Meses' },
        { value: '0', label: 'Janeiro' },
        { value: '1', label: 'Fevereiro' },
        { value: '2', label: 'Março' },
        { value: '3', label: 'Abril' },
        { value: '4', label: 'Maio' },
        { value: '5', label: 'Junho' },
        { value: '6', label: 'Julho' },
        { value: '7', label: 'Agosto' },
        { value: '8', label: 'Setembro' },
        { value: '9', label: 'Outubro' },
        { value: '10', label: 'Novembro' },
        { value: '11', label: 'Dezembro' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i)); // Last 2 years + next 2 years

    // Generate color based on Unit Name
    const getUnitColor = (unitName?: string) => {
        if (!unitName) return 'from-gray-500 to-gray-600';

        const colors = [
            'from-blue-500 to-blue-600',
            'from-green-500 to-green-600',
            'from-purple-500 to-purple-600',
            'from-indigo-500 to-indigo-600',
            'from-pink-500 to-pink-600',
            'from-teal-500 to-teal-600',
            'from-orange-500 to-orange-600',
            'from-cyan-500 to-cyan-600'
        ];

        // Simple hash to pick a color
        let hash = 0;
        for (let i = 0; i < unitName.length; i++) {
            hash = unitName.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    };

    const currentUnitColor = selectedUnit !== 'all' ? getUnitColor(selectedUnit) : 'from-blue-600 to-blue-800';

    if (loading) return <div className="p-8 text-center">Carregando eventos...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Meus Eventos</h1>
                    <div className="flex gap-4">
                        <Link to="/dashboard" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">
                            Voltar
                        </Link>
                        <Link to="/events/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Novo Evento
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters and Summary Section */}
            <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
                {/* Header Strip for Summary Section if specific unit selected */}
                {selectedUnit !== 'all' && (
                    <div className={`h-2 w-full bg-gradient-to-r ${currentUnitColor}`}></div>
                )}

                <div className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
                    {/* Filters */}
                    <div className="flex flex-col gap-4 w-full md:flex-1">
                        {/* Search and Clear Row */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar evento..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                            >
                                Buscar
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition whitespace-nowrap"
                                title="Limpar Filtros"
                            >
                                Limpar
                            </button>
                        </div>

                        {/* Dropdowns Row - Collapsible */}
                        <div className="w-full">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-blue-600 text-sm font-medium hover:underline mb-4 flex items-center gap-1"
                            >
                                {showFilters ? 'Ocultar Filtros' : 'Mais Filtros'}
                                <span className="text-xs">{showFilters ? '▲' : '▼'}</span>
                            </button>

                            {showFilters && (
                                <div className="flex flex-col gap-4 animate-fadeIn">
                                    <div className="flex flex-wrap gap-4 items-end">
                                        {/* Unit Filter (MASTER only) */}
                                        {user?.role === 'MASTER' && (
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium text-gray-600 mb-1">Unidade</label>
                                                <select
                                                    value={selectedUnit}
                                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5"
                                                >
                                                    <option value="all">Todas as Unidades</option>
                                                    {units.map((u) => (
                                                        <option key={u.id} value={u.name}>
                                                            {u.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                        )}
                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium text-gray-600 mb-1">Status</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
                                            >
                                                <option value="all">Todos</option>
                                                <option value="OPEN">Aberto</option>
                                                <option value="IN_PROGRESS">Em Atendimento</option>
                                                <option value="PAUSED">Pausado</option>
                                                <option value="COMPLETED">Concluído</option>
                                                <option value="CANCELED">Cancelado</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium text-gray-600 mb-1">Mês</label>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
                                            >
                                                {months.map((m) => (
                                                    <option key={m.value} value={m.value}>
                                                        {m.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium text-gray-600 mb-1">Ano</label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5"
                                            >
                                                <option value="all">Todos os Anos</option>
                                                {years.map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Advanced Filters Row */}
                                    <div className="flex flex-wrap gap-4 items-end pt-2 border-t border-gray-100 w-full">
                                        {/* Sort By */}
                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium text-gray-600 mb-1">Ordenar por</label>
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
                                            >
                                                <option value="name-asc">Nome (A-Z)</option>
                                                <option value="name-desc">Nome (Z-A)</option>
                                                <option value="date-asc">Data (Crescente)</option>
                                                <option value="date-desc">Data (Decrescente)</option>
                                                <option value="created-desc">Criação (Mais novo)</option>
                                                <option value="created-asc">Criação (Mais antigo)</option>
                                                <option value="budget-desc">Orçamento (Maior)</option>
                                                <option value="budget-asc">Orçamento (Menor)</option>
                                            </select>
                                        </div>

                                        {/* Budget Range */}
                                        <div className="flex flex-col flex-1 min-w-[300px]">
                                            <label className="text-sm font-medium text-gray-600 mb-1">Faixa de Orçamento</label>
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-full">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max={maxBudgetLimit}
                                                        value={maxBudget === '' ? maxBudgetLimit : maxBudget}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            setMaxBudget(val);
                                                            setMaxBudgetInput(val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
                                                        }}
                                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                        <span>0</span>
                                                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(maxBudgetLimit)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Mín"
                                                        value={minBudgetInput}
                                                        onChange={handleMinBudgetChange}
                                                        className="w-24 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                                                    />
                                                    <span className="text-gray-400">-</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Máx"
                                                        value={maxBudgetInput}
                                                        onChange={handleMaxBudgetChange}
                                                        className="w-28 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleApplyFilters}
                                            className="px-6 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition check-shadow shadow-md hover:shadow-lg mb-1"
                                        >
                                            APLICAR FILTROS
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Financial Summary Widget */}
                    <div className={`w-full md:w-auto bg-white rounded-xl shadow-lg border-2 border-white min-w-[340px] overflow-hidden transform transition hover:scale-105 duration-300`}>
                        <div className={`py-2 px-4 bg-gradient-to-r ${currentUnitColor} text-white`}>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-center shadow-sm">
                                Resumo Financeiro {selectedUnit !== 'all' ? `(${selectedUnit})` : ''}
                            </h3>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4 gap-8">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1 font-medium">Orçamento</p>
                                    <p className="text-lg font-bold text-gray-800">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBudget)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1 font-medium">Gasto</p>
                                    <p className="text-lg font-bold text-red-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500">Saldo Disponível</span>
                                    <span className={`text-xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${spendingPercentage > 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                                        style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-right mt-1">
                                    <span className="text-xs text-gray-400 font-medium">{spendingPercentage.toFixed(1)}% utilizado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {
                    filteredEvents.length === 0 ? (
                        <p className="text-center text-gray-500 bg-white p-8 rounded shadow">
                            Nenhum evento encontrado para o período selecionado.
                        </p>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredEvents.map((event) => {
                                const eventColor = getUnitColor(event.unit?.name);
                                const now = new Date();
                                const start = new Date(event.startDate);
                                const end = new Date(event.endDate);


                                // Workflow Status (Top Left)
                                let workflowStatusLabel = '';
                                let workflowStatusColor = '';
                                let WorkflowIcon = null;

                                if (event.status === 'IN_PROGRESS') {
                                    workflowStatusLabel = 'Em Atendimento';
                                    workflowStatusColor = 'bg-blue-600 text-white';
                                    WorkflowIcon = PlayCircle;
                                } else if (event.status === 'PAUSED') {
                                    workflowStatusLabel = 'Pausado';
                                    workflowStatusColor = 'bg-yellow-500 text-white';
                                    WorkflowIcon = PauseCircle;
                                } else if (event.status === 'COMPLETED') {
                                    workflowStatusLabel = 'Concluído';
                                    workflowStatusColor = 'bg-green-600 text-white';
                                    WorkflowIcon = CheckCircle;
                                } else if (event.status === 'CANCELED') {
                                    workflowStatusLabel = 'Cancelado';
                                    workflowStatusColor = 'bg-red-600 text-white';
                                    WorkflowIcon = XCircle;
                                }

                                // Time Status (Bottom Left)
                                let timeStatusLabel = '';
                                let timeStatusColor = '';
                                let TimeIcon = Clock;

                                if (now < start) {
                                    timeStatusLabel = 'Em breve';
                                    timeStatusColor = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                    TimeIcon = Clock;
                                } else if (now >= start && now <= end) {
                                    timeStatusLabel = 'Acontecendo';
                                    timeStatusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                    TimeIcon = PlayCircle;
                                } else {
                                    timeStatusLabel = 'Encerrado';
                                    timeStatusColor = 'bg-gray-100 text-gray-700 border-gray-200';
                                    TimeIcon = CheckCircle;
                                }

                                return (
                                    <div key={event.id} className="bg-white rounded-xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group border border-gray-100">
                                        {/* Full Colored Header */}
                                        <div className={`px-6 py-6 bg-gradient-to-r ${eventColor} relative flex flex-col items-center justify-center min-h-[120px]`}>
                                            {/* Status Badge - Top Left */}
                                            {/* Status Badge - Top Left (Workflow Status Only) */}
                                            {workflowStatusLabel && WorkflowIcon && (
                                                <span className={`absolute top-4 left-4 ${workflowStatusColor} text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide flex items-center gap-1`}>
                                                    <WorkflowIcon size={12} />
                                                    {workflowStatusLabel}
                                                </span>
                                            )}

                                            {/* Unit Badge */}
                                            {event.unit && (
                                                <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wider text-white">
                                                    {event.unit.name}
                                                </span>
                                            )}
                                            {/* Edit/Delete Actions (Optional restoration) could be here, but let's stick to clean card for now */}

                                            <h3 className="text-2xl font-bold text-white text-center drop-shadow-md leading-tight line-clamp-2 px-2">
                                                {event.name}
                                            </h3>
                                            {event.eventCode && (
                                                <p className="text-white/80 text-sm font-medium mt-1 tracking-wider">
                                                    #{event.eventCode}
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="space-y-1.5 mb-3">
                                                <div className="flex items-start text-gray-700 text-sm">
                                                    <span className="w-5 flex justify-center mr-2 text-base opacity-70">🗓️</span>
                                                    <span className="font-medium pt-0.5 text-gray-600">
                                                        {start.toLocaleDateString()}
                                                        {start.toLocaleDateString() !== end.toLocaleDateString() &&
                                                            ` - ${end.toLocaleDateString()}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-gray-700 text-sm">
                                                    <span className="w-5 flex justify-center mr-2 text-base opacity-70">⏰</span>
                                                    <span className="font-medium text-gray-600">
                                                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-start text-gray-700 text-sm">
                                                        <span className="w-5 flex justify-center mr-2 text-base opacity-70">📍</span>
                                                        <span className="font-medium pt-0.5 line-clamp-2 text-gray-600" title={event.location}>{event.location}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto">
                                                {event.budget !== undefined && event.budget > 0 && (
                                                    <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <p className="text-gray-400 font-semibold text-[10px] uppercase tracking-wide mb-0.5">Orçamento</p>
                                                            <p className="font-bold text-gray-700 text-base">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.budget)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-gray-400 font-semibold text-[10px] uppercase tracking-wide mb-0.5">Saldo</p>
                                                            <p className={`font-bold text-base ${(event.budget - (event.transactions || [])
                                                                .filter(t => t.type === 'EXPENSE')
                                                                .reduce((acc, t) => acc + t.amount, 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                                                                }`}>
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                                    event.budget - (event.transactions || [])
                                                                        .filter(t => t.type === 'EXPENSE')
                                                                        .reduce((acc, t) => acc + t.amount, 0)
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded border ${timeStatusColor} bg-opacity-50 uppercase tracking-wide flex items-center gap-1`}>
                                                        <TimeIcon size={12} />
                                                        {timeStatusLabel}
                                                    </span>

                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => handleDelete(event.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Excluir">
                                                            🗑️
                                                        </button>
                                                        <Link to={`/events/${event.id}`} className="text-blue-500 text-xs font-semibold hover:text-blue-700 flex items-center gap-1 transition-colors uppercase tracking-wide hover:underline">
                                                            Ver Detalhes <span>→</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                }
            </div>
        </div >

    );
};

export default EventsPage;
