import { useContext, type FC, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import type { Event } from '../types/Event';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, PlusCircle, Users, Building2, PlayCircle, CheckCircle, XCircle, Clock, PauseCircle } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

interface Unit {
    id: string;
    name: string;
}

// Add Status type if not imported, or just use string
type StatusFilter = 'all' | 'OPEN' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELED';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Carousel Component extracted for better state management
const Carousel = ({ items }: { items: Event[] }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;
        setIsDown(true);
        setStartX(e.pageX - sliderRef.current.offsetLeft);
        setScrollLeft(sliderRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDown(false);
    };

    const handleMouseUp = () => {
        setIsDown(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown || !sliderRef.current) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX) * 1.5; // Ajust speed
        sliderRef.current.scrollLeft = scrollLeft - walk;
    };

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const scrollAmount = 350;
            sliderRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative">
            <div
                ref={sliderRef}
                className={`flex overflow-x-auto gap-4 p-4 cursor-grab ${isDown ? 'cursor-grabbing snap-none' : 'snap-x'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']`}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {items.map(event => {
                    // Logic replicated from EventsPage
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
                        let hash = 0;
                        for (let i = 0; i < unitName.length; i++) {
                            hash = unitName.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        return colors[Math.abs(hash) % colors.length];
                    };

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
                        <div key={event.id} className="min-w-[300px] md:min-w-[350px] bg-white rounded-xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 snap-start flex flex-col border border-gray-100 select-none overflow-hidden group">
                            {/* Full Colored Header */}
                            <div className={`px-6 py-6 bg-gradient-to-r ${eventColor} relative flex flex-col items-center justify-center min-h-[120px]`}>
                                {/* Status Badge - Top Left (Workflow Status Only) */}
                                {workflowStatusLabel && WorkflowIcon && (
                                    <span className={`absolute top-4 left-4 ${workflowStatusColor} text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide flex items-center gap-1`}>
                                        <WorkflowIcon size={12} />
                                        {workflowStatusLabel}
                                    </span>
                                )}

                                {/* Unit Badge */}
                                {event.unit && (
                                    <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wider">
                                        {event.unit.name}
                                    </span>
                                )}

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

                                        <Link to={`/events/${event.id}`} className="text-blue-500 text-xs font-semibold hover:text-blue-700 flex items-center gap-1 transition-colors uppercase tracking-wide hover:underline">
                                            Ver Detalhes <span>→</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 transition z-10 opacity-0 group-hover:opacity-100"
            >
                ◄
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 transition z-10 opacity-0 group-hover:opacity-100"
            >
                ►
            </button>

            {/* Dots (Static for now, dynamic requires scroll tracking) */}
            <div className="flex justify-center mt-4 gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
        </div>
    );
};

const Dashboard: FC = () => {
    const { user, signOut } = useContext(AuthContext);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
    const [sortBy, setSortBy] = useState('date-asc');
    const [minBudget, setMinBudget] = useState<number | ''>('');
    const [maxBudget, setMaxBudget] = useState<number | ''>('');
    const [minBudgetInput, setMinBudgetInput] = useState('');
    const [maxBudgetInput, setMaxBudgetInput] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [maxBudgetLimit, setMaxBudgetLimit] = useState(100000);

    // const sliderRef = useRef<HTMLDivElement>(null); // Removed unused ref

    useEffect(() => {
        fetchEvents();
        fetchUnits();
    }, []);

    // Update max budget limit dynamically based on events
    useEffect(() => {
        if (events.length > 0) {
            const max = Math.max(...events.map(e => e.budget || 0));
            // Round up to nearest 1000
            const limit = Math.ceil(max / 1000) * 1000 || 10000;
            setMaxBudgetLimit(limit);
        }
    }, [events]);

    useEffect(() => {
        filterEvents();
    }, [events]); // Only re-run when events list changes or manual trigger

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch events', error);
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

    const formatCurrencyInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '';
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            filterEvents();
        }
    };

    const handleSearch = () => {
        filterEvents();
    };

    const handleClear = () => {
        setSearchTerm('');
        setSelectedUnit('all');
        setSelectedStatus('all');
        setSelectedMonth('all');
        const currentYear = String(new Date().getFullYear());
        setSelectedYear(currentYear);
        setSortBy('date-asc');
        setMinBudget('');
        setMaxBudget('');
        setMinBudgetInput('');
        setMaxBudgetInput('');

        // Manually apply the "Default" filter logic immediately
        // Default: Current Year, All Months, All Units
        const filtered = events.filter(event => new Date(event.startDate).getFullYear() === Number(currentYear));

        // Reset sorting (date-asc)
        filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        setFilteredEvents(filtered);
    };

    const filterEvents = () => {
        let filtered = [...events];

        // Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.name.toLowerCase().includes(lowerTerm) ||
                (e.eventCode && e.eventCode.toLowerCase().includes(lowerTerm)) ||
                (e.location && e.location.toLowerCase().includes(lowerTerm))
            );
        }

        // Filter by Unit
        if (selectedUnit !== 'all') {
            filtered = filtered.filter(e => e.unit?.name === selectedUnit);
        }

        // Filter by Status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(e => e.status === selectedStatus);
        }

        // Filter by Year
        filtered = filtered.filter(event => new Date(event.startDate).getFullYear() === Number(selectedYear));

        // Filter by Month
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

        // Sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'date-asc': return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                case 'date-desc': return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                case 'created-asc': return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
                case 'created-desc': return (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                case 'budget-asc': return (a.budget || 0) - (b.budget || 0);
                case 'budget-desc': return (b.budget || 0) - (a.budget || 0);
                default: return 0;
            }
        });

        setFilteredEvents(filtered);
    };

    // Prepare Chart Data
    const eventsPerUnit = filteredEvents.reduce((acc, event) => {
        const unitName = event.unit?.name || 'Sem Unidade';
        acc[unitName] = (acc[unitName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const eventsChartData = Object.entries(eventsPerUnit).map(([name, value]) => ({ name, value }));

    const expensesPerUnit = filteredEvents.reduce((acc, event) => {
        const unitName = event.unit?.name || 'Sem Unidade';
        const eventExpenses = (event.transactions || [])
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);
        acc[unitName] = (acc[unitName] || 0) + eventExpenses;
        return acc;
    }, {} as Record<string, number>);

    const expensesChartData = Object.entries(expensesPerUnit).map(([name, value]) => ({ name, value }));
    const cleanExpensesChartData = expensesChartData.filter(d => d.value > 0);

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
    const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded shadow-md flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Painel Geral</h1>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <span className="text-gray-600 dark:text-gray-300">Olá, <strong>{user?.name}</strong></span>
                    <Link to="/profile" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mr-4">Meu Perfil</Link>
                    <button onClick={signOut} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200">
                        Sair
                    </button>
                </div>
            </div>

            {/* Advanced Dashboard Controls */}
            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm flex flex-col gap-4 transition-colors duration-300">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Filtros do Dashboard</h2>

                {/* Search and Clear Row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">🔍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar evento (Nome, Código ou Local)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
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
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition whitespace-nowrap"
                        title="Limpar Filtros"
                    >
                        Limpar
                    </button>
                </div>

                {/* Dropdowns Row - Collapsible */}
                <div className="w-full">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline mb-4 flex items-center gap-1"
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
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Unidade</label>
                                        <select
                                            value={selectedUnit}
                                            onChange={(e) => setSelectedUnit(e.target.value)}
                                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5"
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
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value as any)}
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
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
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Mês</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
                                    >
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Ano</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5"
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
                            <div className="flex flex-wrap gap-4 items-end pt-2 border-t border-gray-100 dark:border-gray-700 w-full">
                                {/* Sort By */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Ordenar por</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
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
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Faixa de Orçamento</label>
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
                                                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                                                className="w-24 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="text"
                                                placeholder="Máx"
                                                value={maxBudgetInput}
                                                onChange={handleMaxBudgetChange}
                                                className="w-28 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={filterEvents}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition check-shadow shadow-md hover:shadow-lg mb-1"
                                >
                                    APLICAR FILTROS
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Charts Section */}
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg p-4 flex items-center justify-center">
                            <h3 className="text-lg font-bold text-white text-center shadow-sm">Eventos Realizados</h3>
                        </div>
                        <div className="p-6 h-96 flex items-center justify-between relative">
                            {/* Chart with Central Label */}
                            <div className="relative w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={eventsChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="60%"
                                            outerRadius="80%"
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {eventsChartData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number | undefined) => [`${value ?? 0} Eventos`, 'Quantidade'] as [string, string]}
                                            contentStyle={{
                                                backgroundColor: isDark ? '#1f2937' : '#fff',
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                color: isDark ? '#f3f4f6' : '#1f2937'
                                            }}
                                            itemStyle={{ color: isDark ? '#f3f4f6' : '#1f2937' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Central Total */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-4xl font-bold text-gray-800 dark:text-white">{eventsChartData.reduce((acc, curr) => acc + curr.value, 0)}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</span>
                                </div>
                            </div>

// ... (Legend)
                            <div className="w-1/2 pl-4 flex flex-col justify-center gap-3">
                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 border-b dark:border-gray-700 pb-1">Unidades</h4>
                                <div className="max-h-56 overflow-y-auto custom-scrollbar pr-2">
                                    {eventsChartData.map((entry, index) => (
                                        <div key={`legend-${index}`} className="flex items-center justify-between text-sm py-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                <span className="text-gray-700 dark:text-gray-200 font-medium">{entry.name}</span>
                                            </div>
                                            <span className="text-gray-900 dark:text-white font-bold">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col">
                        <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-t-lg p-4 flex items-center justify-center">
                            <h3 className="text-lg font-bold text-white text-center shadow-sm">Despesas</h3>
                        </div>
                        <div className="p-6 h-96 flex items-center justify-between relative">
                            {/* Chart with Central Label */}
                            <div className="relative w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={cleanExpensesChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="60%"
                                            outerRadius="80%"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {cleanExpensesChartData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number | undefined) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0), 'Valor Gasto'] as [string, string]}
                                            contentStyle={{
                                                backgroundColor: isDark ? '#1f2937' : '#fff',
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                color: isDark ? '#f3f4f6' : '#1f2937'
                                            }}
                                            itemStyle={{ color: isDark ? '#f3f4f6' : '#1f2937' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Central Total */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-4xl font-bold text-gray-800">
                                        {(() => {
                                            const total = cleanExpensesChartData.reduce((acc, curr) => acc + curr.value, 0);
                                            if (total >= 1000000) return `${(total / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
                                            if (total >= 1000) return `${(total / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                                            return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(total);
                                        })()}
                                    </span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Total</span>
                                    <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded-full">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cleanExpensesChartData.reduce((acc, curr) => acc + curr.value, 0))}
                                    </span>
                                </div>
                            </div>

                            {/* Custom Legend */}
                            <div className="w-1/2 pl-4 flex flex-col justify-center gap-3">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1 border-b pb-1">Unidades</h4>
                                <div className="max-h-56 overflow-y-auto custom-scrollbar pr-2">
                                    {cleanExpensesChartData.map((entry, index) => (
                                        <div key={`legend-${index}`} className="flex items-center justify-between text-sm py-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                <span className="text-gray-700 font-medium">{entry.name}</span>
                                            </div>
                                            <span className="text-gray-900 font-bold">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(entry.value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agenda / Highlights Section */}
                <div className="mt-8 relative group" >
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-blue-600 pl-3">
                            Agenda de Destaques
                        </h2>
                    </div>

                    {
                        filteredEvents.length > 0 ? (
                            <div className="relative">
                                {/* Carousel Container */}
                                <Carousel items={filteredEvents} />
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded shadow-sm text-center text-gray-500 border border-dashed border-gray-300">
                                <p>Nenhum evento encontrado para o período selecionado.</p>
                                <Link to="/events/new" className="text-blue-500 hover:underline mt-2 inline-block">Cadastrar novo evento</Link>
                            </div>
                        )
                    }
                </div >

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 flex overflow-hidden">
                        <div className="bg-blue-600 w-24 flex items-center justify-center shrink-0">
                            <Calendar className="w-10 h-10 text-white" />
                        </div>
                        <div className="p-6 flex-1">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Eventos</h2>
                            <p className="text-gray-600 mb-4">Gerencie todos os seus eventos.</p>
                            <Link to="/events" className="inline-block text-blue-600 font-medium hover:text-blue-800 transition">Ver Eventos &rarr;</Link>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 flex overflow-hidden">
                        <div className="bg-green-600 w-24 flex items-center justify-center shrink-0">
                            <PlusCircle className="w-10 h-10 text-white" />
                        </div>
                        <div className="p-6 flex-1">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Novo Evento</h2>
                            <p className="text-gray-600 mb-4">Comece a organizar um novo evento agora.</p>
                            <Link to="/events/new" className="inline-block text-green-600 font-medium hover:text-green-800 transition">Criar Evento &rarr;</Link>
                        </div>
                    </div>

                    {user?.role === 'MASTER' && (
                        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 flex overflow-hidden">
                            <div className="bg-purple-600 w-24 flex items-center justify-center shrink-0">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                            <div className="p-6 flex-1">
                                <h2 className="text-xl font-semibold mb-2 text-gray-800">Usuários</h2>
                                <p className="text-gray-600 mb-4">Gerencie os usuários do sistema e suas unidades.</p>
                                <Link to="/users" className="inline-block text-purple-600 font-medium hover:text-purple-800 transition">Gerenciar Usuários &rarr;</Link>
                            </div>
                        </div>
                    )}

                    {user?.role === 'MASTER' && (
                        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 flex overflow-hidden">
                            <div className="bg-orange-600 w-24 flex items-center justify-center shrink-0">
                                <Building2 className="w-10 h-10 text-white" />
                            </div>
                            <div className="p-6 flex-1">
                                <h2 className="text-xl font-semibold mb-2 text-gray-800">Unidades</h2>
                                <p className="text-gray-600 mb-4">Gerencie as unidades (UMC, SEBRAE/SP, etc).</p>
                                <Link to="/units" className="inline-block text-orange-600 font-medium hover:text-orange-800 transition">Gerenciar Unidades &rarr;</Link>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div>
    );
};

export default Dashboard;
