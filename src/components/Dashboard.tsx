import React, { useState } from 'react';
import { safeJSONParse } from '../utils/storage';
import type { Trip, Expense } from '../utils/fare';
import { IndianRupee, TrendingUp, Crown, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';



interface DashboardProps {
    trips: Trip[];
}




type TimeRange = 'today' | 'week' | 'month' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
    const { settings } = useSettings();
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
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 text-slate-400">
                            <TrendingUp size={14} aria-hidden="true" /> {stats.label}
                        </p>
                        <h2 className={`text-hero font-black mt-2 tabular-nums ${stats.profit >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                            ₹{stats.profit.toLocaleString()}
                        </h2>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                        <IndianRupee size={20} strokeWidth={2.5} className="text-[#0047AB]" />
                    </div>
                </div>

                <div className="mt-5 flex gap-3">
                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 relative group">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">INCOME</p>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'trips' }))}
                                className="text-[9px] font-black bg-white border border-slate-200 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider hover:text-green-600 hover:border-green-200 transition-colors"
                            >
                                Add +
                            </button>
                        </div>
                        <p className="text-sm font-black mt-0.5 text-slate-700">₹{stats.income.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 relative group">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SPENT</p>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'expenses' }))}
                                className="text-[9px] font-black bg-white border border-slate-200 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider hover:text-red-500 hover:border-red-200 transition-colors"
                            >
                                Add +
                            </button>
                        </div>
                        <p className="text-sm font-black mt-0.5 text-slate-700">₹{stats.spending.toLocaleString()}</p>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">MARGIN</p>
                        <p className={`text-sm font-black mt-0.5 ${stats.income > 0 && stats.profit >= 0 ? 'text-green-600' : stats.profit < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {stats.income > 0 ? Math.round((stats.profit / stats.income) * 100) : 0}%
                        </p>
                    </div>
                    <div className="w-1/2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                        className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${range === r
                            ? 'bg-[#0047AB] text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Daily Audit Recommendation (Retention Feature) */}
            <div
                onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'expenses' }))}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-600">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-tight">Daily Closing Audit</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-tight pr-2">Verify today's accounts</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-green-600 text-white rounded-full">
                    <span className="text-[9px] font-black uppercase tracking-wider">Start</span>
                </div>
            </div>

            {/* Premium Upgrade Nudge */}
            {!settings.isPremium && (
                <div
                    onClick={() => window.dispatchEvent(new CustomEvent('open-pricing-modal'))}
                    className="group bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden cursor-pointer hover:shadow-blue-500/20 transition-all border border-blue-400/20"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-110" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Crown size={14} className="text-amber-400 fill-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Pro Feature</span>
                            </div>
                            <h4 className="text-sm font-black mb-1">Professional Branding Package</h4>
                            <p className="text-[10px] font-bold text-blue-100/70 leading-relaxed max-w-[200px]">Remove watermarks and add custom business logos to all your invoices.</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-white/30 transition-colors">
                            Upgrade
                        </div>
                    </div>
                </div>
            )}

            {/* Active Widgets Grid */}
            <div className={`grid grid-cols-1 gap-3`}>
                <div
                    onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'tariff' }))}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
                            <IndianRupee size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-tight">Rate Card</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-tight">Check current tariff & charges</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={14} className="text-slate-400" /> Recent Activity
                    </h3>
                </div>

                <div className="space-y-3">
                    {[
                        ...trips.map(t => ({ ...t, type: 'trip' as const, sortDate: t.date, displayAmount: t.totalFare })),
                        ...expenses.map(e => ({ ...e, type: 'expense' as const, sortDate: e.date, displayAmount: e.amount }))
                    ]
                        .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
                        .slice(0, 3)
                        .map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.type === 'trip'
                                        ? 'bg-green-50 border-green-100 text-green-600'
                                        : 'bg-red-50 border-red-100 text-red-600'}`}>
                                        {item.type === 'trip' ? <IndianRupee size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                            {item.type === 'trip' ? (item.customerName || 'Trip Income') : (item.category || 'Expense')}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            {new Date(item.sortDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {item.type === 'trip' ? 'Income' : 'Spent'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs font-black tabular-nums ${item.type === 'trip' ? 'text-green-600' : 'text-red-500'}`}>
                                    {item.type === 'trip' ? '+' : '-'}₹{item.displayAmount?.toLocaleString()}
                                </span>
                            </div>
                        ))}

                    {trips.length === 0 && expenses.length === 0 && (
                        <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest py-4">No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
