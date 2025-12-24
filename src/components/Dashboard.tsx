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
        <div className="space-y-6 pb-24">
            {/* Professional Summary Dashboard */}
            <div className="bg-[#0047AB] rounded-3xl p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                            <TrendingUp size={12} /> NET CASH FLOW TODAY
                        </p>
                        <h2 className="text-5xl font-black mt-4 tabular-nums">₹{profit.toLocaleString()}</h2>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                        <IndianRupee size={32} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
                    <div className="text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">PROFIT MARGIN</p>
                        <p className="text-2xl font-black mt-1">{income > 0 ? Math.round((profit / income) * 100) : 0}%</p>
                    </div>
                    <div className="w-1/2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-1000"
                            style={{ width: `${Math.max(0, Math.min(100, income > 0 ? (profit / income) * 100 : 0))}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Split Record Blocks */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-50 text-[#00965E] rounded-lg">
                            <TrendingUp size={16} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">INCOME</p>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black tabular-nums text-slate-900">₹{income.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">{todaysTrips.length} INVOICES</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                            <Wallet size={16} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SPENDING</p>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black tabular-nums text-slate-900">₹{spending.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">{expenses.filter(e => e.date.startsWith(today)).length} LOGS</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Official Portal Portal */}
            <a
                href="https://kalidasstravels.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-[#0047AB] transition-all group"
            >
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[#0047AB] group-hover:bg-blue-50 transition-colors">
                        <Globe size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-900 leading-tight">OFFICIAL BOOKING PORTAL</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-tight">Access Central Reservations</p>
                    </div>
                </div>
                <div className="p-2 text-slate-300 group-hover:text-[#0047AB] transition-colors">
                    <ArrowUpRight size={28} />
                </div>
            </a>

            {/* Recent Ledger Preview */}
            <div className="space-y-4 pt-2">
                <div className="flex flex-col items-center gap-2 px-1 pb-4">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 px-8">Real-Time Logbook</h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[9px] font-black text-green-700 uppercase tracking-wide">LIVE MONITORING</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 uppercase">Performance Metrics Active</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase leading-relaxed">System monitoring enabled for<br /> Saravanan Kuppusamy</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
