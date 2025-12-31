import React, { useState } from 'react';
import { safeJSONParse } from '../utils/storage';
import type { Trip, Expense } from '../utils/fare';
import { IndianRupee, Globe, TrendingUp, StickyNote, Plus, Trash2, FileText } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';


interface DashboardProps {
    trips: Trip[];
}

interface Note {
    id: string;
    content: string;
    createdAt: string;
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
    const { settings, currentVehicle } = useSettings();
    const { user } = useAuth();
    const [range, setRange] = useState<TimeRange>('today');
    const [notes, setNotes] = useState<Note[]>(() => {
        const saved = safeJSONParse<Note[]>('driver-quick-notes', []);
        if (saved.length === 0) {
            return [{
                id: Date.now().toString(),
                content: '',
                createdAt: new Date().toISOString()
            }];
        }
        return saved;
    });
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    React.useEffect(() => {
        localStorage.setItem('driver-quick-notes', JSON.stringify(notes));
    }, [notes]);

    const addNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            content: '',
            createdAt: new Date().toISOString()
        };
        setNotes(prev => [newNote, ...prev]);
    };

    const updateNote = (id: string, content: string) => {
        setNotes(prev => prev.map(note =>
            note.id === id ? { ...note, content } : note
        ));
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(note => note.id !== id));
    };

    const isThisWeek = (dateStr: string) => {
        const d = new Date(dateStr);
        const diff = now.getTime() - d.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
    };
    const isThisMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    const isThisYear = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getFullYear() === now.getFullYear();
    };

    const expenses = safeJSONParse<Expense[]>('cab-expenses', []);

    const getStats = () => {
        let income = 0;
        let spending = 0;
        let label = '';

        switch (range) {
            case 'today':
                income = trips.filter(t => t.date.startsWith(today)).reduce((sum, t) => sum + t.totalFare, 0);
                spending = expenses.filter(e => e.date.startsWith(today)).reduce((sum, e) => sum + e.amount, 0);
                label = 'CASH FLOW TODAY';
                break;
            case 'week':
                income = trips.filter(t => isThisWeek(t.date)).reduce((sum, t) => sum + t.totalFare, 0);
                spending = expenses.filter(e => isThisWeek(e.date)).reduce((sum, e) => sum + e.amount, 0);
                label = 'CASH FLOW THIS WEEK';
                break;
            case 'month':
                income = trips.filter(t => isThisMonth(t.date)).reduce((sum, t) => sum + t.totalFare, 0);
                spending = expenses.filter(e => isThisMonth(e.date)).reduce((sum, e) => sum + e.amount, 0);
                label = 'CASH FLOW THIS MONTH';
                break;
            case 'year':
                income = trips.filter(t => isThisYear(t.date)).reduce((sum, t) => sum + t.totalFare, 0);
                spending = expenses.filter(e => isThisYear(e.date)).reduce((sum, e) => sum + e.amount, 0);
                label = 'CASH FLOW THIS YEAR';
                break;
        }
        return { income, spending, profit: income - spending, label };
    };

    const stats = getStats();

    // Handle Report Download
    const handleDownloadReport = async () => {
        let filteredTrips = trips;
        let filteredExpenses = expenses;
        let periodLabel = 'All Time';

        switch (range) {
            case 'today':
                filteredTrips = trips.filter(t => t.date.startsWith(today));
                filteredExpenses = expenses.filter(e => e.date.startsWith(today));
                periodLabel = `Today (${new Date().toLocaleDateString('en-IN')})`;
                break;
            case 'week':
                filteredTrips = trips.filter(t => isThisWeek(t.date));
                filteredExpenses = expenses.filter(e => isThisWeek(e.date));
                periodLabel = 'This Week';
                break;
            case 'month':
                filteredTrips = trips.filter(t => isThisMonth(t.date));
                filteredExpenses = expenses.filter(e => isThisMonth(e.date));
                periodLabel = 'This Month';
                break;
            case 'year':
                filteredTrips = trips.filter(t => isThisYear(t.date));
                filteredExpenses = expenses.filter(e => isThisYear(e.date));
                periodLabel = 'This Year';
                break;
        }

        const pdfSettings = {
            ...settings,
            vehicleNumber: currentVehicle?.number || 'N/A',
            userId: user?.id
        };

        const pdfModule = await import('../utils/pdf');
        await pdfModule.shareFinancialReport(filteredTrips, filteredExpenses, pdfSettings, periodLabel);
    };

    return (
        <div className="space-y-4 pb-24">
            {/* Main Dynamic Card - Compact Black Theme */}
            <div className="rounded-2xl p-4 text-white shadow-xl relative overflow-hidden transition-all duration-500 bg-[#0F172A] border border-slate-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#0047AB]/10 rounded-full -mr-12 -mt-12"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 text-slate-300">
                            <TrendingUp size={12} aria-hidden="true" /> {stats.label}
                        </p>
                        <h2 className={`text-3xl font-black mt-2 tabular-nums transition-colors duration-500 ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ₹{stats.profit.toLocaleString()}
                        </h2>
                    </div>
                    <div className="bg-[#0047AB]/20 p-2.5 rounded-xl backdrop-blur-md border border-[#0047AB]/30">
                        <IndianRupee size={20} strokeWidth={2.5} className="text-[#0047AB]" />
                    </div>
                </div>

                <div className="mt-5 flex gap-3">
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">TOTAL INCOME</p>
                        <p className="text-sm font-black mt-1">₹{stats.income.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">TOTAL SPENT</p>
                        <p className="text-sm font-black mt-1">₹{stats.spending.toLocaleString()}</p>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center relative z-10">
                    <div className="text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">PROFIT MARGIN</p>
                        <p className={`text-base font-black mt-0.5 ${stats.income > 0 && stats.profit >= 0 ? 'text-green-400' : stats.profit < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                            {stats.income > 0 ? Math.round((stats.profit / stats.income) * 100) : 0}%
                        </p>
                    </div>
                    <div className="w-1/2 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${stats.profit >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.max(0, Math.min(100, stats.income > 0 ? Math.abs((stats.profit / stats.income) * 100) : 0))}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* GST Report Banner - Connected */}
            <div
                onClick={handleDownloadReport}
                className="p-4 bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl shadow-lg relative overflow-hidden group cursor-pointer active:scale-98 transition-all"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1">
                            Download {range === 'today' ? 'Daily' : range === 'year' ? 'Annual' : range === 'week' ? 'Weekly' : 'Monthly'} Report
                        </h4>
                        <p className="text-blue-200 text-[10px] font-medium max-w-[200px]">
                            Get {range}ly P&L statement for income tax & loan applications.
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                        <FileText className="text-white" size={20} />
                    </div>
                </div>
            </div>

            {/* Range Toggle - Clean Pill Style */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1">
                {(['today', 'week', 'month', 'year'] as const).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        aria-label={`Show stats for ${r}`}
                        aria-pressed={range === r}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${range === r
                            ? 'bg-[#0047AB] text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Analysis Guide Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                        <Globe size={14} />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Financial Insights Guide</h3>
                </div>
                <div className="space-y-2">
                    <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1"></div>
                        <p className="text-[10px] font-bold text-slate-700 uppercase leading-relaxed">
                            <span className="text-slate-900">INCOME:</span> Money from all saved <span className="text-green-600">Invoices</span>.
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1"></div>
                        <p className="text-[10px] font-bold text-slate-700 uppercase leading-relaxed">
                            <span className="text-slate-900">SPENT:</span> Money logged in the <span className="text-red-500">Expenses</span> page.
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0047AB] mt-1"></div>
                        <p className="text-[10px] font-bold text-slate-700 uppercase leading-relaxed">
                            <span className="text-slate-900">CASH FLOW:</span> Remaining profit (<span className="text-[#0047AB]">Income - Spent</span>).
                        </p>
                    </div>
                </div>
            </div>

            {/* Official Booking Portal - Coming Soon */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400">
                        <Globe size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-tight">OFFICIAL BOOKING PORTAL</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight">Coming Soon</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full">
                    <span className="text-[8px] font-black text-yellow-700 uppercase tracking-wider">Soon</span>
                </div>
            </div>

            {/* Quick Notes - Google Keep Style */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-200 text-yellow-700 rounded-md">
                            <StickyNote size={16} />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Quick Notes</h3>
                    </div>
                    <button
                        onClick={addNote}
                        className="flex items-center gap-1.5 bg-[#0047AB] text-white px-3 py-2 rounded-lg hover:bg-[#003a8c] transition-all active:scale-95 shadow-sm"
                    >
                        <Plus size={14} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Add Note</span>
                    </button>
                </div>

                {notes.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                        <StickyNote size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">No notes yet</p>
                        <p className="text-xs text-slate-400 mt-1">Click "Add Note" to create your first note</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all relative group"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300 rounded-t-xl"></div>
                                <button
                                    onClick={() => deleteNote(note.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-200 transition-all active:scale-90"
                                    title="Delete note"
                                    aria-label="Delete note"
                                >
                                    <Trash2 size={12} aria-hidden="true" />
                                </button>
                                <textarea
                                    value={note.content}
                                    onChange={(e) => updateNote(note.id, e.target.value)}
                                    placeholder="📝 Start KM: ___&#10;Start Time: ___&#10;End KM: ___&#10;End Time: ___&#10;Notes..."
                                    aria-label="Note content"
                                    className="w-full bg-white/50 border border-yellow-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder:text-slate-400 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all mt-1"
                                    rows={5}
                                    style={{ fontFamily: 'Noto Sans, sans-serif' }}
                                />
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1.5 tracking-wide">
                                    {new Date(note.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
