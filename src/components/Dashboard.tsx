import React, { useState } from 'react';
import { safeJSONParse } from '../utils/storage';
import { Trip, Expense } from '../utils/fare'; // Use named imports if they are exported as such, or adjust if they are types
import { IndianRupee, TrendingUp } from 'lucide-react';
import type { SavedQuotation } from '../utils/pdf';

interface DashboardProps {
    trips: Trip[];
    quotations: SavedQuotation[];
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
    const [range, setRange] = useState<TimeRange>('today');

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // ... (keep existing helper functions: isThisWeek, isThisMonth, isThisYear) ...
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
                label = 'Aaj Ki Kamai';
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

    const stats = getStats();

    return (
        <div className="space-y-4 pb-24">

            {/* Main Dynamic Card - Clean White Theme */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm relative overflow-hidden mb-3">
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
                        ) : (
                            <h2 className={`text-3xl font-black mt-0.5 tabular-nums tracking-tight ${stats.profit >= 0 ? 'text-slate-900' : 'text-error'}`}>
                                ₹{stats.profit.toLocaleString()}
                            </h2>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'expenses' }))}
                            className="bg-error/5 hover:bg-error/10 p-1.5 rounded-lg border border-error/10 text-error transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                            <TrendingUp size={14} className="rotate-180" strokeWidth={3} />
                            <span className="text-[10px] font-bold uppercase">Add Expense</span>
                        </button>
                        <div className="bg-success/5 p-1.5 rounded-lg border border-success/10 text-success">
                            <IndianRupee size={16} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                <div className="flex bg-slate-50 rounded-lg py-1.5 border border-slate-100 divide-x divide-slate-200">
                    <div className="flex-1 px-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-success mb-0.5">INCOME</p>
                        {stats.income === 0 && range === 'today' ? (
                            <p className="text-[11px] font-bold text-slate-400 leading-none mt-1">No trips yet</p>
                        ) : (
                            <p className="text-[13px] font-bold text-slate-800 tabular-nums leading-none">₹{stats.income.toLocaleString()}</p>
                        )}
                    </div>
                    <div className="flex-1 px-2.5 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-error mb-0.5">SPENT</p>
                        {stats.spending === 0 && range === 'today' ? (
                            <p className="text-[11px] font-bold text-slate-400 leading-none mt-1">₹0</p>
                        ) : (
                            <p className="text-[13px] font-bold text-slate-800 tabular-nums leading-none">₹{stats.spending.toLocaleString()}</p>
                        )}
                    </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                        MARGIN 
                        <span className={`text-[11px] font-black ${stats.income > 0 && stats.profit >= 0 ? 'text-success' : stats.profit < 0 ? 'text-error' : 'text-slate-400'}`}>
                            {stats.income === 0 && stats.spending === 0 && range === 'today' ? '--' : `${stats.income > 0 ? Math.round((stats.profit / stats.income) * 100) : 0}%`}
                        </span>
                    </p>
                    <div className="w-1/2 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${stats.profit >= 0 ? 'bg-success' : 'bg-error'}`}
                            style={{ width: `${Math.max(0, Math.min(100, stats.income > 0 ? Math.abs((stats.profit / stats.income) * 100) : 0))}%` }}
                        ></div>
                    </div>
                </div>
            </div>








            {/* Recent Activity Feed - Compact */}
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
                        | (Expense & { type: 'expense', sortDate: string, displayAmount: number })
                    )[])
                        .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
                        .slice(0, 3)
                        .map((item) => (
                            <div key={item.id} className="flex items-center justify-between group p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.type === 'trip'
                                        ? 'bg-success/5 border-success/10 text-success'
                                        : 'bg-error/5 border-error/10 text-error'}`}>
                                        {item.type === 'trip' ? <IndianRupee size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-900 uppercase tracking-wide">
                                            {item.type === 'trip' ? (item.customerName || 'Trip Income') : (item.category || 'Expense')}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500 mt-0">
                                            {new Date(item.sortDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {item.type === 'trip' ? 'Income' : 'Spent'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[13px] font-bold tabular-nums tracking-tight ${item.type === 'trip' ? 'text-success' : 'text-error'}`}>
                                    {item.type === 'trip' ? '+' : '-'}₹{item.displayAmount?.toLocaleString()}
                                </span>
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
