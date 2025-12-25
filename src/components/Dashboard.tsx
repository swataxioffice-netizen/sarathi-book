import React from 'react';
import { safeJSONParse } from '../utils/storage';
import type { Trip, Expense } from '../utils/fare';
import { IndianRupee, Globe, ArrowUpRight, TrendingUp, Wallet } from 'lucide-react';

interface DashboardProps {
    trips: Trip[];
}

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTrips = trips.filter(trip => trip.date.startsWith(today));
    const income = todaysTrips.reduce((sum, trip) => sum + trip.totalFare, 0);
    const expenses = safeJSONParse<Expense[]>('cab-expenses', []);
    const spending = expenses.filter(e => e.date.startsWith(today)).reduce((sum, e) => sum + e.amount, 0);
    const profit = income - spending;

    return (
        <div className="space-y-2 pb-24">
            {/* Professional Summary Dashboard - Compact */}
            <div className="bg-[#0047AB] rounded-2xl p-4 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-10 -mb-10"></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
                            <TrendingUp size={10} /> NET CASH FLOW TODAY
                        </p>
                        <h2 className="text-3xl font-black mt-2 tabular-nums">₹{profit.toLocaleString()}</h2>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                        <IndianRupee size={20} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center relative z-10">
                    <div className="text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">PROFIT MARGIN</p>
                        <p className="text-sm font-black mt-0.5">{income > 0 ? Math.round((profit / income) * 100) : 0}%</p>
                    </div>
                    <div className="w-1/2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-1000"
                            style={{ width: `${Math.max(0, Math.min(100, income > 0 ? (profit / income) * 100 : 0))}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Split Record Blocks - Compact */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-green-50 text-[#00965E] rounded-lg">
                            <TrendingUp size={14} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">INCOME</p>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tabular-nums text-slate-900">₹{income.toLocaleString()}</span>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-1 h-1 rounded-full bg-green-500"></span>
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">{todaysTrips.length} INVOICES</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-red-50 text-red-500 rounded-lg">
                            <Wallet size={14} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">SPENDING</p>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tabular-nums text-slate-900">₹{spending.toLocaleString()}</span>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-1 h-1 rounded-full bg-red-500"></span>
                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">{expenses.filter(e => e.date.startsWith(today)).length} LOGS</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Official Portal Portal - Compact */}
            <a
                href="https://kalidasstravels.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-[#0047AB] transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[#0047AB] group-hover:bg-blue-50 transition-colors">
                        <Globe size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-tight">OFFICIAL BOOKING PORTAL</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight">Access Central Reservations</p>
                    </div>
                </div>
                <div className="p-1 text-slate-300 group-hover:text-[#0047AB] transition-colors">
                    <ArrowUpRight size={20} />
                </div>
            </a>

            {/* Recent Ledger Preview - Compact */}
            <div className="space-y-3 pt-1">
                <div className="flex flex-col items-center gap-1 px-1 pb-2">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-100 pb-1.5 px-6">Real-Time Logbook</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full border border-green-100">
                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[8px] font-black text-green-700 uppercase tracking-wide">LIVE MONITORING</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase">Performance Metrics Active</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase leading-relaxed">System monitoring enabled for<br /> Driver Console</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
