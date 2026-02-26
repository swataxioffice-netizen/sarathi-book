import React, { useState } from 'react';
import { safeJSONParse } from '../utils/storage';
import { Trip, Expense } from '../utils/fare'; // Use named imports if they are exported as such, or adjust if they are types
import { IndianRupee, TrendingUp, CheckCircle2, FileText, MoveRight, Users } from 'lucide-react';
import type { SavedQuotation } from '../utils/pdf';
import { useSettings } from '../contexts/SettingsContext';

interface DashboardProps {
    trips: Trip[];
    quotations: SavedQuotation[];
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
    const { settings } = useSettings();
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
                                ? 'bg-[#0047AB] text-white shadow-sm'
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
                        <h2 className={`text-xl font-bold mt-0.5 tabular-nums tracking-tight ${stats.profit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                            ₹{stats.profit.toLocaleString()}
                        </h2>
                    </div>
                    <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100 text-[#0047AB]">
                        <IndianRupee size={16} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex bg-slate-50 rounded-lg py-1.5 border border-slate-100 divide-x divide-slate-200">
                    <div className="flex-1 px-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-green-600 mb-0.5">INCOME</p>
                        <p className="text-[13px] font-bold text-slate-800 tabular-nums leading-none">₹{stats.income.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 px-2.5 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-red-500 mb-0.5">SPENT</p>
                        <p className="text-[13px] font-bold text-slate-800 tabular-nums leading-none">₹{stats.spending.toLocaleString()}</p>
                    </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                        MARGIN 
                        <span className={`text-[11px] font-black ${stats.income > 0 && stats.profit >= 0 ? 'text-green-600' : stats.profit < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {stats.income > 0 ? Math.round((stats.profit / stats.income) * 100) : 0}%
                        </span>
                    </p>
                    <div className="w-1/2 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${stats.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.max(0, Math.min(100, stats.income > 0 ? Math.abs((stats.profit / stats.income) * 100) : 0))}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={() => {
                        window.dispatchEvent(new Event('nav-tab-invoice'));
                    }}
                    className="flex flex-col items-center justify-center bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl shadow-sm hover:bg-slate-50 min-h-[110px] active:scale-95 transition-all"
                >
                    <FileText size={36} className="mb-3 text-green-600" />
                    <span className="font-bold uppercase tracking-wider text-[11px]">New Invoice</span>
                </button>
                <button 
                    onClick={() => {
                        window.dispatchEvent(new Event('nav-tab-invoice-history'));
                    }}
                    className="flex flex-col items-center justify-center bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl shadow-sm hover:bg-slate-50 min-h-[110px] active:scale-95 transition-all"
                >
                    <FileText size={36} className="mb-3 text-blue-500" />
                    <span className="font-bold uppercase tracking-wider text-[11px]">Recent Invoices</span>
                </button>
                <button
                    onClick={() => {
                        window.dispatchEvent(new Event('nav-tab-quotation'));
                    }}
                    className="flex flex-col items-center justify-center bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl shadow-sm hover:bg-slate-50 min-h-[110px] active:scale-95 transition-all"
                >
                    <FileText size={36} className="mb-3 text-indigo-600" />
                    <span className="font-bold uppercase tracking-wider text-[11px]">New Quotation</span>
                </button>
                <button 
                    onClick={() => {
                        window.dispatchEvent(new Event('nav-tab-quotation-history'));
                    }}
                    className="flex flex-col items-center justify-center bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl shadow-sm hover:bg-slate-50 min-h-[110px] active:scale-95 transition-all"
                >
                    <FileText size={36} className="mb-3 text-indigo-400" />
                    <span className="font-bold uppercase tracking-wider text-[11px]">Recent Quotations</span>
                </button>
            </div>

            {/* Super Pro - Market Insights */}
            {settings.plan === 'super' && (
                <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-xl shadow-amber-50 relative overflow-hidden group hover:border-amber-400 transition-all cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'trending' }))}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 rotate-3 group-hover:rotate-0 transition-transform">
                            <TrendingUp size={24} strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" /> Super Pro Market Insights
                            </h3>
                            <p className="text-slate-900 font-black text-xs uppercase tracking-tight">Access Real-time Fleet Trends</p>
                            <p className="text-slate-400 text-[9px] font-bold mt-0.5">Optimize your business with route-search analytics</p>
                        </div>
                        <div className="bg-amber-50 p-2 rounded-full text-amber-600 group-hover:translate-x-1 transition-transform">
                            <MoveRight size={16} />
                        </div>
                    </div>
                </div>
            )}





            {/* Management & Operations block */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                    onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'expenses' }))}
                    className="flex flex-col p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 transition-all active:scale-95"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <CheckCircle2 size={16} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-900 leading-tight">Daily Summary</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 tracking-tight leading-relaxed">Verify today's accounts</p>
                </div>
                <div
                    onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'staff' }))}
                    className="flex flex-col p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 transition-all active:scale-95"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-[#0047AB]">
                            <Users size={16} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-900 leading-tight">Attendance</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 tracking-tight leading-relaxed">Manage driver salary</p>
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
