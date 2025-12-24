import React, { useState } from 'react';
import { Plus, Fuel, Settings, Trash2, PieChart, ShoppingBag, Coffee, Calculator, Wallet } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import type { Expense } from '../utils/fare';
import { safeJSONParse } from '../utils/storage';

const ExpenseTracker: React.FC = () => {
    const { t } = useSettings();
    const [expenses, setExpenses] = useState<Expense[]>(() => safeJSONParse<Expense[]>('cab-expenses', []));
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Expense['category']>('fuel');
    const [desc, setDesc] = useState('');

    const addExpense = () => {
        if (!amount) return;
        const up = [{ id: crypto.randomUUID(), category, amount: Number(amount), description: desc, date: new Date().toISOString() }, ...expenses];
        setExpenses(up);
        localStorage.setItem('cab-expenses', JSON.stringify(up));
        setAmount(''); setDesc('');
    };

    const deleteExpense = (id: string) => {
        const up = expenses.filter(e => e.id !== id);
        setExpenses(up);
        localStorage.setItem('cab-expenses', JSON.stringify(up));
    };

    const today = new Date().toISOString().split('T')[0];
    const todaysExpenses = expenses.filter(e => e.date.startsWith(today));
    const totalSpent = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);

    const getIcon = (cat: string) => {
        switch (cat) {
            case 'fuel': return <Fuel size={20} />;
            case 'food': return <Coffee size={20} />;
            case 'maintenance': return <Settings size={20} />;
            default: return <ShoppingBag size={20} />;
        }
    }

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'fuel': return 'text-orange-500 bg-orange-50 border-orange-100';
            case 'food': return 'text-blue-500 bg-blue-50 border-blue-100';
            case 'maintenance': return 'text-purple-500 bg-purple-50 border-purple-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Cash Flow Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">TOTAL SPENT TODAY</p>
                        <h2 className="text-5xl font-black tabular-nums tracking-tight">₹{totalSpent.toLocaleString()}</h2>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                        <PieChart size={28} />
                    </div>
                </div>
            </div>

            {/* Expense Entry Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-8">
                <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-5 text-center">
                    <div className="p-3 bg-blue-50 text-[#0047AB] rounded-xl flex items-center justify-center mb-3">
                        <Plus size={24} strokeWidth={3} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">New Expenditure</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">RECORD DAILY OUTFLOW</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-tight ml-1">AMOUNT</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(_) => setAmount(_.target.value)}
                                className="tn-input h-14 pl-10 bg-slate-50 border-slate-200 font-black text-2xl"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-tight ml-1">CATEGORY</label>
                        <select
                            value={category}
                            onChange={(_) => setCategory(_.target.value as any)}
                            className="tn-input h-14 bg-slate-50 border-slate-200 font-black text-xs uppercase"
                        >
                            {['fuel', 'maintenance', 'food', 'other'].map(c => <option key={c} value={c}>{t(c)}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={addExpense}
                    className="w-full bg-[#0047AB] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <Wallet size={18} /> REGISTER EXPENSE
                </button>
            </div>

            {/* Transaction Feed */}
            <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 px-1 pb-4">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 px-8">Transaction Feed</h3>
                    <span className="text-[9px] font-black text-[#0047AB] bg-blue-50 px-3 py-1 rounded-full">{todaysExpenses.length} ENTRIES TODAY</span>
                </div>

                {expenses.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-3xl py-16 flex flex-col items-center justify-center text-center opacity-60">
                        <Calculator size={48} className="text-slate-200 mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ledger is empty for today</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {expenses.map(e => {
                            const isToday = e.date.startsWith(today);
                            return (
                                <div key={e.id} className={`bg-white border rounded-2xl p-5 flex justify-between items-center shadow-sm transition-all ${isToday ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                                    <div className="flex items-center gap-5">
                                        <div className={`p-3 rounded-xl border transition-all ${getCategoryColor(e.category)}`}>
                                            {getIcon(e.category)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t(e.category)}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900 tabular-nums">₹{e.amount}</p>
                                        </div>
                                        <button
                                            onClick={() => deleteExpense(e.id)}
                                            className="p-3 text-slate-300 hover:text-red-500 active:scale-90 transition-all"
                                        >
                                            <Trash2 size={20} />
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
