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
    const { settings, currentVehicle, updateSettings } = useSettings();
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
            {/* Main Dynamic Card - Compact Black Theme */}
            <div className="rounded-2xl p-4 text-white shadow-xl relative overflow-hidden transition-all duration-500 bg-[#0F172A] border border-slate-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#0047AB]/10 rounded-full -mr-12 -mt-12"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 text-slate-300">
                            <TrendingUp size={14} aria-hidden="true" /> {stats.label}
                        </p>
                        <h2 className={`text-hero font-black mt-2 tabular-nums transition-colors duration-500 ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ₹{stats.profit.toLocaleString()}
                        </h2>
                    </div>
                    <div className="bg-[#0047AB]/20 p-2.5 rounded-xl backdrop-blur-md border border-[#0047AB]/30">
                        <IndianRupee size={20} strokeWidth={2.5} className="text-[#0047AB]" />
                    </div>
                </div>

                <div className="mt-5 flex gap-3">
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">TOTAL INCOME</p>
                        <p className="text-sm font-black mt-1">₹{stats.income.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">TOTAL SPENT</p>
                        <p className="text-sm font-black mt-1">₹{stats.spending.toLocaleString()}</p>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center relative z-10">
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">PROFIT MARGIN</p>
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
                className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg cursor-pointer hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white leading-tight">Daily Closing Audit</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-tight pr-2">Spend 10 mins to verify today's accounts.</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-green-500 text-white rounded-full">
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
                {/* Fuel Cost Calculator */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" /><path d="M5 12V7a2 2 0 0 1 2-2h1" /><path d="M22 22H2" /><path d="M12 12H8" /><path d="M11 20H5a2 2 0 0 1-0-4a2 2 0 0 1 0 4" /><path d="M16 9h-.01" /></svg>
                                </div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Running Cost</h3>
                            </div>

                            {/* Vehicle Selector for accurate cost */}
                            <select
                                value={currentVehicle?.id || ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        updateSettings({ currentVehicleId: e.target.value });
                                    }
                                }}
                                className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg px-2 py-1 outline-none text-slate-700 max-w-[120px]"
                            >
                                {settings.vehicles.length > 0 ? (
                                    settings.vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.model} ({v.number})</option>
                                    ))
                                ) : <option>Def. Car</option>}
                            </select>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                            <div className="flex-1 w-full">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fuel Price (₹)</label>
                                <input
                                    type="number"
                                    value={safeJSONParse('fuel-price', 102)}
                                    onChange={(e) => {
                                        localStorage.setItem('fuel-price', e.target.value);
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-orange-400 transition-colors"
                                />
                            </div>
                            <div className="flex-1 w-full sm:text-right flex justify-between sm:block items-center bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost / KM</p>
                                <div className="text-xl font-black text-slate-900 leading-tight flex items-baseline justify-end gap-1">
                                    <span className="text-xs font-bold text-slate-400">₹</span>
                                    {Math.round((parseInt(localStorage.getItem('fuel-price') || '102') / (parseInt(currentVehicle?.mileage || localStorage.getItem('guest-mileage') || '15'))) * 100) / 100}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                            {/* Mileage Display or Input */}
                            {settings.vehicles.length > 0 ? (
                                <span>Mileage: {currentVehicle?.mileage} km/l</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>Mileage:</span>
                                    <input
                                        type="number"
                                        className="w-12 bg-slate-100 border-b border-slate-300 text-center font-black text-slate-700 focus:outline-none focus:border-orange-400"
                                        placeholder="15"
                                        defaultValue={safeJSONParse('guest-mileage', 15)}
                                        onChange={(e) => {
                                            localStorage.setItem('guest-mileage', e.target.value);
                                            window.dispatchEvent(new Event('storage'));
                                        }}
                                    />
                                    <span>km/l</span>
                                </div>
                            )}

                            {settings.vehicles.length === 0 && <span className="text-orange-400">Guest Mode</span>}
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
