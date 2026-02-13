import React, { useState } from 'react';
import { safeJSONParse } from '../utils/storage';
import type { Trip, Expense } from '../utils/fare';
import { IndianRupee, TrendingUp, CheckCircle2 } from 'lucide-react';




interface DashboardProps {
    trips: Trip[];
}




type TimeRange = 'today' | 'week' | 'month' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {

    const [range, setRange] = useState<TimeRange>('today');


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



    return (
        <div className="space-y-4 pb-24">
            {/* Main Dynamic Card - Clean White Theme */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 text-slate-400">
                            <TrendingUp size={12} aria-hidden="true" /> {stats.label}
                        </p>
                        <h2 className={`text-xl font-bold mt-1.5 tabular-nums tracking-tight ${stats.profit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                            ₹{stats.profit.toLocaleString()}
                        </h2>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <IndianRupee size={16} strokeWidth={2.5} className="text-[#0047AB]" />
                    </div>
                </div>

                <div className="mt-3 flex gap-2">
                    <div className="flex-1 bg-slate-50 rounded-xl p-2.5 border border-slate-100 relative group">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">INCOME</p>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'trips' }))}
                                className="text-[9px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wide hover:text-green-600 hover:border-green-300 transition-all shadow-sm"
                            >
                                Add
                            </button>
                        </div>
                        <p className="text-sm font-bold mt-0.5 text-slate-800">₹{stats.income.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-2.5 border border-slate-100 relative group">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">SPENT</p>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'expenses' }))}
                                className="text-[9px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wide hover:text-red-500 hover:border-red-300 transition-all shadow-sm"
                            >
                                Add
                            </button>
                        </div>
                        <p className="text-sm font-bold mt-0.5 text-slate-800">₹{stats.spending.toLocaleString()}</p>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">MARGIN</p>
                        <p className={`text-base font-bold mt-0.5 ${stats.income > 0 && stats.profit >= 0 ? 'text-green-600' : stats.profit < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {stats.income > 0 ? Math.round((stats.profit / stats.income) * 100) : 0}%
                        </p>
                    </div>
                    <div className="w-1/2 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${stats.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.max(0, Math.min(100, stats.income > 0 ? Math.abs((stats.profit / stats.income) * 100) : 0))}%` }}
                        ></div>
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
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${range === r
                            ? 'bg-[#0047AB] text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Daily Audit - Compact */}
            <div
                onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'expenses' }))}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 border border-green-100 rounded-xl text-green-700 shadow-sm">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <p className="text-[12px] font-bold uppercase tracking-wide text-slate-900 leading-tight">Daily Audit</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5 tracking-tight">Verify today's accounts</p>
                    </div>
                </div>
                <div className="px-5 py-2 bg-green-600 text-white rounded-full shadow-md shadow-green-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Start Now</span>
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
                    {[
                        ...trips.map(t => ({ ...t, type: 'trip' as const, sortDate: t.date, displayAmount: t.totalFare })),
                        ...expenses.map(e => ({ ...e, type: 'expense' as const, sortDate: e.date, displayAmount: e.amount }))
                    ]
                        .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
                        .slice(0, 3)
                        .map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between group p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.type === 'trip'
                                        ? 'bg-green-50 border-green-100 text-green-600'
                                        : 'bg-red-50 border-red-100 text-red-600'}`}>
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
                                <span className={`text-[13px] font-bold tabular-nums tracking-tight ${item.type === 'trip' ? 'text-green-600' : 'text-red-600'}`}>
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
