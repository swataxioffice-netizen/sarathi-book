import { useState, useEffect } from 'react';
import {
    Plus, Fuel, Settings, Trash2, PieChart, ShoppingBag, Coffee, Calculator, Wallet, MapPin, Shield, CreditCard, Scan
} from 'lucide-react';
import { generateId } from '../utils/uuid';

import { useSettings } from '../contexts/SettingsContext';
import type { Expense } from '../utils/fare';
import { safeJSONParse } from '../utils/storage';
import DocumentScanner from './DocumentScanner';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { Analytics } from '../utils/monitoring';

const ExpenseTracker: React.FC = () => {
    const { t } = useSettings();
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>(() => safeJSONParse<Expense[]>('cab-expenses', []));
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Expense['category']>('fuel');
    const [desc, setDesc] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    // Cloud Sync: Fetch expenses on load/login
    useEffect(() => {
        const fetchExpenses = async () => {
            if (user) {
                // 1. Fetch Cloud Expenses
                const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });

                if (!error) {
                    const cloudExpensesMap = new Map();
                    if (data) {
                        data.forEach(row => {
                            cloudExpensesMap.set(row.id, {
                                id: row.id,
                                category: row.category as any,
                                amount: Number(row.amount),
                                description: row.description || '',
                                date: row.date
                            });
                        });
                    }

                    // 2. Identify Local-Only Expenses (created offline)
                    const localStored = safeJSONParse<Expense[]>('cab-expenses', []);
                    const localToUpload: Expense[] = [];

                    for (const localE of localStored) {
                        if (!cloudExpensesMap.has(localE.id)) {
                            localToUpload.push(localE);
                        }
                    }

                    // 3. Upload Offline Expenses
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

                    // 4. Merge State (Cloud Wins + Local which is now Cloud)
                    setExpenses(prev => {
                        const merged = new Map<string, Expense>();
                        // Keep current state
                        prev.forEach((e) => merged.set(e.id, e));
                        // Add Cloud (which now includes uploaded ones effectively)
                        cloudExpensesMap.forEach((e, id) => merged.set(id, e));
                        // Add uploaded ones explicitly to be safe for immediate UI update? 
                        localToUpload.forEach(e => merged.set(e.id, e));

                        const mergedArray = Array.from(merged.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) as Expense[];
                        // Update LocalStorage to match synced state
                        localStorage.setItem('cab-expenses', JSON.stringify(mergedArray));
                        return mergedArray;
                    });
                }
            }
        };
        fetchExpenses();
    }, [user]);

    // 5. Real-time Subscription for Simultaneous Sync
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('public:expenses')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'expenses',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Real-time expense change:', payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newExpense: Expense = {
                            id: payload.new.id,
                            category: payload.new.category as any,
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

                        // Update LocalStorage
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

        // Sync to Cloud
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
            setCategory('fuel'); // OCR is mostly used for fuel
            setDesc(`Smart Scan: ${new Date().toLocaleDateString()}`);
        }
        setShowScanner(false);
    };

    const deleteExpense = async (id: string) => {
        const deletedExpense = expenses.find(e => e.id === id);
        const up = expenses.filter(e => e.id !== id);
        setExpenses(up);
        localStorage.setItem('cab-expenses', JSON.stringify(up));

        // Sync to Cloud
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

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Helper for date ranges
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

    const todaysExpenses = expenses.filter(e => e.date.startsWith(today));
    const totalSpentToday = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSpentWeek = expenses.filter(e => isThisWeek(e.date)).reduce((sum, e) => sum + e.amount, 0);
    const totalSpentMonth = expenses.filter(e => isThisMonth(e.date)).reduce((sum, e) => sum + e.amount, 0);
    const totalSpentYear = expenses.filter(e => isThisYear(e.date)).reduce((sum, e) => sum + e.amount, 0);

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
    }

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
    }

    return (
        <div className="space-y-4 pb-24">
            {/* Cash Flow Summary - Dynamic Grid */}
            <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">TOTAL SPENT TODAY</p>
                        <h2 className="text-3xl font-black tabular-nums tracking-tight text-slate-900">₹{totalSpentToday.toLocaleString()}</h2>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                        <PieChart size={20} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">THIS WEEK</p>
                        <p className="text-sm font-black text-slate-900">₹{totalSpentWeek.toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">THIS MONTH</p>
                        <p className="text-sm font-black text-slate-900">₹{totalSpentMonth.toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">THIS YEAR</p>
                        <p className="text-sm font-black text-slate-900">₹{totalSpentYear.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Expense Entry Card - Compacter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-[#0047AB] rounded-lg">
                            <Plus size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">New Expenditure</h3>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowScanner(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#0047AB] rounded-xl border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 group"
                    >
                        <Scan size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Scan Bill</span>
                    </button>
                </div>

                {showScanner && (
                    <DocumentScanner
                        onClose={() => setShowScanner(false)}
                        onScanComplete={handleScanComplete}
                        label="Scan Fuel Receipt"
                    />
                )}

                <div className="grid grid-cols-[1fr,1.5fr] gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">AMOUNT</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(_) => setAmount(_.target.value)}
                                className="tn-input h-10 pl-7 bg-slate-50 border-slate-200 font-black text-base w-full"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">CATEGORY</label>
                        <select
                            value={category}
                            onChange={(_) => setCategory(_.target.value as any)}
                            className="tn-input h-10 bg-slate-50 border-slate-200 font-bold text-[10px] uppercase w-full"
                        >
                            {['fuel', 'maintenance', 'food', 'toll', 'permit', 'parking', 'other'].map(c => <option key={c} value={c}>{t(c)}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={addExpense}
                    className="w-full bg-[#0047AB] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Wallet size={14} /> REGISTER EXPENSE
                </button>
            </div>

            {/* Transaction Feed - Condensed List */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-2 pt-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                    <span className="text-[9px] font-bold text-[#0047AB] bg-blue-50 px-2 py-0.5 rounded-md">{todaysExpenses.length} Today</span>
                </div>

                {expenses.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-2xl py-8 flex flex-col items-center justify-center text-center opacity-60">
                        <Calculator size={32} className="text-slate-200 mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">No expenses recorded</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {expenses.map(e => {
                            const isToday = e.date.startsWith(today);
                            return (
                                <div key={e.id} className={`bg-white border rounded-xl p-3 flex justify-between items-center shadow-sm ${isToday ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg border ${getCategoryColor(e.category)}`}>
                                            {getIcon(e.category)}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{t(e.category)}</h4>
                                            {e.description && <p className="text-[8px] text-slate-400 font-medium italic">{e.description}</p>}
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900 tabular-nums">₹{e.amount}</p>
                                        </div>
                                        <button
                                            onClick={() => deleteExpense(e.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseTracker;
