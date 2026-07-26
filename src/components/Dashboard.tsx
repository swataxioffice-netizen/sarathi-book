import React, { useState, useEffect } from 'react';
import { safeJSONParse } from '../utils/storage';
import { Trip, Expense } from '../utils/fare';
import { 
    IndianRupee, TrendingUp, Plus, Trash2, Scan, 
    Fuel, Coffee, Settings, MapPin, Shield, CreditCard, ShoppingBag, X 
} from 'lucide-react';
import type { SavedQuotation } from '../utils/pdf';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../utils/supabase';
import { Analytics } from '../utils/monitoring';
import { generateId } from '../utils/uuid';
import DocumentScanner from './DocumentScanner';

interface DashboardProps {
    trips: Trip[];
    quotations: SavedQuotation[];
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
    const { t } = useSettings();
    const { user } = useAuth();
    const [range, setRange] = useState<TimeRange>('today');

    const [expenses, setExpenses] = useState<Expense[]>(() => safeJSONParse<Expense[]>('cab-expenses', []));
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Expense['category']>('fuel');
    const [desc, setDesc] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const now = new Date();
    const today = now.toISOString().split('T')[0];

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

    // Cloud Sync: Fetch expenses on load/login
    useEffect(() => {
        const fetchExpenses = async () => {
            if (user) {
                const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });

                if (!error) {
                    const cloudExpensesMap = new Map();
                    if (data) {
                        data.forEach(row => {
                            cloudExpensesMap.set(row.id, {
                                id: row.id,
                                category: row.category as Expense['category'],
                                amount: Number(row.amount),
                                description: row.description || '',
                                date: row.date
                            });
                        });
                    }

                    const localStored = safeJSONParse<Expense[]>('cab-expenses', []);
                    const localToUpload: Expense[] = [];

                    for (const localE of localStored) {
                        if (!cloudExpensesMap.has(localE.id)) {
                            localToUpload.push(localE);
                        }
                    }

                    if (localToUpload.length > 0) {
                        console.log(`Syncing ${localToUpload.length} local expenses to cloud...`);
                        await Promise.all(localToUpload.map(e =>
                            supabase.from('expenses').upsert({
                                id: e.id,
                                user_id: user.id,
                                category: e.category,
                                amount: e.amount,
                                description: e.description,
                                date: e.date
                            })
                        ));
                    }

                    setExpenses(prev => {
                        const merged = new Map<string, Expense>();
                        prev.forEach((e) => merged.set(e.id, e));
                        cloudExpensesMap.forEach((e, id) => merged.set(id, e));
                        localToUpload.forEach(e => merged.set(e.id, e));

                        const mergedArray = Array.from(merged.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) as Expense[];
                        localStorage.setItem('cab-expenses', JSON.stringify(mergedArray));
                        return mergedArray;
                    });
                }
            }
        };
        fetchExpenses();
    }, [user]);

    // Real-time Subscription for Simultaneous Sync
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('public:expenses_dashboard')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'expenses',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Real-time expense change (dashboard):', payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newExpense: Expense = {
                            id: payload.new.id,
                            category: payload.new.category as Expense['category'],
                            amount: Number(payload.new.amount),
                            description: payload.new.description || '',
                            date: payload.new.date
                        };

                        setExpenses(prev => {
                            const idx = prev.findIndex(e => e.id === newExpense.id);
                            if (idx !== -1) {
                                if (JSON.stringify(prev[idx]) === JSON.stringify(newExpense)) return prev;
                                const next = [...prev];
                                next[idx] = newExpense;
                                return next;
                            }
                            return [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        });

                        const current = safeJSONParse<Expense[]>('cab-expenses', []);
                        const idx = current.findIndex(e => e.id === newExpense.id);
                        let updated;
                        if (idx !== -1) {
                            updated = [...current];
                            updated[idx] = newExpense;
                        } else {
                            updated = [newExpense, ...current];
                        }
                        localStorage.setItem('cab-expenses', JSON.stringify(updated));

                    } else if (payload.eventType === 'DELETE') {
                        setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
                        const current = safeJSONParse<Expense[]>('cab-expenses', []);
                        localStorage.setItem('cab-expenses', JSON.stringify(current.filter(e => e.id !== payload.old.id)));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const addExpense = async () => {
        if (!amount) return;
        const newExpense: Expense = {
            id: generateId(),
            category,
            amount: Number(amount),
            description: desc,
            date: new Date().toISOString()
        };

        const up = [newExpense, ...expenses];
        setExpenses(up);
        localStorage.setItem('cab-expenses', JSON.stringify(up));
        setAmount(''); setDesc('');
        setIsFormOpen(false);

        if (user) {
            await supabase.from('expenses').insert({
                id: newExpense.id,
                user_id: user.id,
                category: newExpense.category,
                amount: newExpense.amount,
                description: newExpense.description,
                date: newExpense.date
            });
            await Analytics.logActivity('expense_logged', {
                amount: newExpense.amount,
                category: newExpense.category,
                description: newExpense.description
            }, user.id);
        }
    };

    const handleScanComplete = (data: { amount?: number; date?: string; fullText: string }) => {
        if (data.amount) {
            setAmount(data.amount.toString());
            setCategory('fuel');
            setDesc(`Smart Scan: ${new Date().toLocaleDateString()}`);
        }
        setShowScanner(false);
    };

    const deleteExpense = async (id: string) => {
        const deletedExpense = expenses.find(e => e.id === id);
        const up = expenses.filter(e => e.id !== id);
        setExpenses(up);
        localStorage.setItem('cab-expenses', JSON.stringify(up));

        if (user) {
            await supabase.from('expenses').delete().eq('id', id);
            if (deletedExpense) {
                await Analytics.logActivity('expense_deleted', {
                    id,
                    amount: deletedExpense.amount,
                    category: deletedExpense.category
                }, user.id);
            }
        }
    };

    const getStats = () => {
        let income = 0;
        let spending = 0;
        let label = '';

        switch (range) {
            case 'today':
                income = trips.filter(t => t.date.startsWith(today)).reduce((sum, t) => sum + t.totalFare, 0);
                spending = expenses.filter(e => e.date.startsWith(today)).reduce((sum, e) => sum + e.amount, 0);
                label = "Today's Summary";
                break;
            case 'week':
                income = trips.filter(t => isThisWeek(t.date)).reduce((sum, t) => sum + t.totalFare, 0);
                spending = expenses.filter(e => isThisWeek(e.date)).reduce((sum, e) => sum + e.amount, 0);
                label = 'This Week';
                break;
            case 'month':
                income = trips.filter(t => isThisMonth(t.date)).reduce((sum, t) => sum + t.totalFare, 0);
                spending = expenses.filter(e => isThisMonth(e.date)).reduce((sum, e) => sum + e.amount, 0);
                label = 'This Month';
                break;
            case 'year':
                income = trips.filter(t => isThisYear(t.date)).reduce((sum, t) => sum + t.totalFare, 0);
                spending = expenses.filter(e => isThisYear(e.date)).reduce((sum, e) => sum + e.amount, 0);
                label = 'This Year';
                break;
        }
        return { income, spending, profit: income - spending, label };
    };

    const getIcon = (cat: string) => {
        switch (cat) {
            case 'fuel': return <Fuel size={16} />;
            case 'food': return <Coffee size={16} />;
            case 'maintenance': return <Settings size={16} />;
            case 'toll': return <MapPin size={16} />;
            case 'permit': return <Shield size={16} />;
            case 'parking': return <CreditCard size={16} />;
            default: return <ShoppingBag size={16} />;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'fuel': return 'text-orange-500 bg-orange-50 border-orange-100';
            case 'food': return 'text-blue-500 bg-blue-50 border-blue-100';
            case 'maintenance': return 'text-purple-500 bg-purple-50 border-purple-100';
            case 'toll': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'permit': return 'text-indigo-500 bg-indigo-50 border-indigo-100';
            case 'parking': return 'text-rose-500 bg-rose-50 border-rose-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const stats = getStats();

    return (
        <div className="space-y-4 pb-24 animate-fade-in">

            {/* Main Dynamic Card - Clean White Theme */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm relative overflow-hidden">
                {/* Range Toggle - Clean Pill Style */}
                <div className="bg-slate-50 p-1 rounded-xl shadow-inner border border-slate-100 flex gap-1 mb-2.5">
                    {(['today', 'week', 'month', 'year'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            aria-label={`Show stats for ${r}`}
                            aria-pressed={range === r}
                            className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${range === r
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
                
                <div className="relative z-10 flex justify-between items-start mb-2.5">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 text-slate-400">
                            <TrendingUp size={11} aria-hidden="true" /> {stats.label}
                        </p>
                        {stats.income === 0 && stats.spending === 0 && range === 'today' ? (
                            <h2 className="text-[17px] font-bold mt-0.5 tracking-tight text-slate-500">
                                Let's get started! 🚀
                            </h2>
                        ) : stats.income === 0 && stats.spending > 0 ? (
                            <div>
                                <h2 className="text-3xl font-black mt-0.5 tabular-nums tracking-tight text-slate-900">
                                    ₹{stats.spending.toLocaleString()}
                                </h2>
                                <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">Total Spent</p>
                            </div>
                        ) : (
                            <div>
                                <h2 className={`text-3xl font-black mt-0.5 tabular-nums tracking-tight ${stats.profit >= 0 ? 'text-slate-900' : 'text-error'}`}>
                                    ₹{stats.profit.toLocaleString()}
                                </h2>
                                <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">Net Profit</p>
                            </div>
                        )}
                    </div>
                    <div className="bg-primary/5 p-1.5 rounded-lg border border-primary/10 text-primary">
                        <IndianRupee size={16} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex bg-slate-50 rounded-lg py-1.5 border border-slate-100 divide-x divide-slate-200">
                    <div className="flex-1 px-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-success mb-0.5">INCOME</p>
                        {stats.income === 0 ? (
                            <p className="text-[11px] font-bold text-slate-400 leading-none mt-1">No trips yet</p>
                        ) : (
                            <p className="text-[13px] font-bold text-slate-800 tabular-nums leading-none">₹{stats.income.toLocaleString()}</p>
                        )}
                    </div>
                    <div className="flex-1 px-2.5 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">SPENT</p>
                        {stats.spending === 0 ? (
                            <p className="text-[11px] font-bold text-slate-400 leading-none mt-1">₹0</p>
                        ) : (
                            <p className="text-[13px] font-bold text-slate-800 tabular-nums leading-none">₹{stats.spending.toLocaleString()}</p>
                        )}
                    </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                        {stats.income > 0 ? 'MARGIN' : 'STATUS'} 
                        <span className={`text-[11px] font-black ${stats.income > 0 && stats.profit >= 0 ? 'text-success' : stats.income > 0 && stats.profit < 0 ? 'text-error' : 'text-slate-500'}`}>
                            {stats.income === 0 ? (stats.spending > 0 ? 'Tracking Spending' : '--') : `${Math.round((stats.profit / stats.income) * 100)}%`}
                        </span>
                    </p>
                    <div className="w-1/2 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${stats.income > 0 && stats.profit >= 0 ? 'bg-success' : stats.income > 0 ? 'bg-error' : 'bg-primary'}`}
                            style={{ width: `${stats.income > 0 ? Math.max(0, Math.min(100, Math.abs((stats.profit / stats.income) * 100))) : stats.spending > 0 ? 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Quick Add Expense Form / Toggle Button */}
            {!isFormOpen ? (
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="w-full bg-error text-white h-12 rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-md hover:bg-error/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} strokeWidth={3} /> Add Spending (Expense)
                </button>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3 animate-fade-in">
                    {/* Header: Title + Scan Receipt + Close */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-error/10 text-error rounded-lg">
                                <Plus size={14} strokeWidth={3} />
                            </div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Add Spending</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowScanner(true)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 group"
                            >
                                <Scan size={12} className="group-hover:rotate-12 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-wider">Scan Receipt</span>
                            </button>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                aria-label="Close form"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {showScanner && (
                        <DocumentScanner
                            onClose={() => setShowScanner(false)}
                            onScanComplete={handleScanComplete}
                            label="Scan Receipt"
                        />
                    )}

                    {/* 1. Category Chips - 1 Tap Selection */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Category</label>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { id: 'fuel', label: 'Fuel', icon: <Fuel size={13} /> },
                                { id: 'toll', label: 'Toll', icon: <MapPin size={13} /> },
                                { id: 'food', label: 'Food', icon: <Coffee size={13} /> },
                                { id: 'maintenance', label: 'Repair', icon: <Settings size={13} /> },
                                { id: 'parking', label: 'Parking', icon: <CreditCard size={13} /> },
                                { id: 'permit', label: 'Permit', icon: <Shield size={13} /> },
                                { id: 'other', label: 'Other', icon: <ShoppingBag size={13} /> },
                            ].map((c) => {
                                const isSelected = category === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCategory(c.id as Expense['category'])}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 ${
                                            isSelected
                                                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {c.icon}
                                        <span>{c.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Amount Input + Quick Addition Chips */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Amount (₹)</label>
                            <div className="flex gap-1">
                                {[50, 100, 200, 500, 1000].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setAmount(prev => (Number(prev || 0) + preset).toString())}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black rounded-md border border-slate-200/60 active:scale-95 transition-all"
                                    >
                                        +{preset}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                            <input
                                type="number"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="tn-input h-10 pl-8 bg-slate-50 border-slate-200 font-black text-base w-full focus:bg-white focus:border-primary transition-colors"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* 3. Optional Note Field */}
                    <div className="space-y-1">
                        <input
                            type="text"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="tn-input h-8 bg-slate-50 border-slate-100 font-medium text-xs w-full placeholder:text-slate-400"
                            placeholder="Notes (optional, e.g. Shell petrol pump)"
                        />
                    </div>

                    {/* 4. Action Buttons */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={addExpense}
                            disabled={!amount || Number(amount) <= 0}
                            className="flex-1 bg-error text-white h-10 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:bg-error/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} strokeWidth={3} /> Save Spending
                        </button>
                    </div>
                </div>
            )}

            {/* Recent Activity Feed - Combined */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-slate-400" /> Recent Activity
                    </h3>
                </div>

                <div className="space-y-2">
                    {([
                        ...trips.map(t => ({ ...t, type: 'trip' as const, sortDate: t.date, displayAmount: t.totalFare })),
                        ...expenses.map(e => ({ ...e, type: 'expense' as const, sortDate: e.date, displayAmount: e.amount }))
                    ] as (
                        | (Trip & { type: 'trip', sortDate: string, displayAmount: number })
                        | (Expense & { type: 'expense', sortDate: string, displayAmount: number, category: string, description?: string })
                    )[])
                        .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
                        .slice(0, 10)
                        .map((item) => (
                            <div key={item.id} className="flex items-center justify-between group p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                        item.type === 'trip'
                                            ? 'bg-success/5 border-success/10 text-success'
                                            : getCategoryColor(item.category)
                                    }`}>
                                        {item.type === 'trip' ? <IndianRupee size={14} /> : getIcon(item.category)}
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-900 uppercase tracking-wide">
                                            {item.type === 'trip' ? (item.customerName || 'Trip Income') : t(item.category)}
                                        </p>
                                        {item.type === 'expense' && item.description && (
                                            <p className="text-[8px] text-slate-400 font-medium italic">{item.description}</p>
                                        )}
                                        <p className="text-[9px] font-bold text-slate-500 mt-0">
                                            {new Date(item.sortDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {item.type === 'trip' ? 'Income' : 'Spent'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[13px] font-bold tabular-nums tracking-tight ${item.type === 'trip' ? 'text-success' : 'text-slate-800'}`}>
                                        {item.type === 'trip' ? '+₹' : '₹'}{item.displayAmount?.toLocaleString()}
                                    </span>
                                    {item.type === 'expense' ? (
                                        <button
                                            onClick={() => deleteExpense(item.id)}
                                            className="p-1 text-slate-300 hover:text-red-500 transition-all active:scale-95"
                                            aria-label="Delete expense"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent('show-invoice-delete-redirect'));
                                            }}
                                            className="p-1 text-slate-300 hover:text-red-500 transition-all active:scale-95"
                                            aria-label="Delete invoice"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                    {trips.length === 0 && expenses.length === 0 && (
                        <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-wide py-4">No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
