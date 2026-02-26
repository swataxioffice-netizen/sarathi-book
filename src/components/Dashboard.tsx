import React, { useState, useMemo } from 'react';
import { safeJSONParse } from '../utils/storage';
import { Trip, Expense } from '../utils/fare'; // Use named imports if they are exported as such, or adjust if they are types
import { IndianRupee, TrendingUp, CheckCircle2, FileText, Eye, MoveRight } from 'lucide-react';
import type { SavedQuotation } from '../utils/pdf';
import { generateReceiptPDF, generateQuotationPDF } from '../utils/pdf';
import { useSettings } from '../contexts/SettingsContext';
import PDFPreviewModal from './PDFPreviewModal';

interface DashboardProps {
    trips: Trip[];
    quotations: SavedQuotation[];
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

type RecentItem = 
    | (Trip & { type: 'invoice'; sortDate: string })
    | (SavedQuotation & { type: 'quotation'; sortDate: string });

const Dashboard: React.FC<DashboardProps> = ({ trips, quotations }) => {
    const { settings } = useSettings();
    const [range, setRange] = useState<TimeRange>('today');
    const [showPreview, setShowPreview] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

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

    // Prepare Recent Invoices & Quotations
    const recentDocs = useMemo<RecentItem[]>(() => {
        const combined: RecentItem[] = [
            ...trips.map(t => ({ ...t, type: 'invoice' as const, sortDate: t.date })),
            ...quotations.map(q => ({ ...q, type: 'quotation' as const, sortDate: q.date }))
        ];
        return combined
            .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
            .slice(0, 5); // Show top 5
    }, [trips, quotations]);

    const handlePreview = async (item: RecentItem) => {
        if (item.type === 'invoice') {
            const doc = await generateReceiptPDF(item, {
                ...settings,
                vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A'
            });
            setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
            setPreviewTitle(`Invoice: ${item.invoiceNo || 'Draft'}`);
        } else {
             const quoteData = {
                customerName: item.customerName,
                subject: item.subject,
                date: item.date,
                items: item.items,
                gstEnabled: item.gstEnabled,
                quotationNo: item.quotationNo,
                terms: item.terms,
                customerAddress: item.customerAddress,
                customerGstin: item.customerGstin
            };
            const quoteSettings = {
                ...settings,
                vehicleNumber: 'N/A'
            };
            // Ensure compatibility with generateQuotationPDF expecting vehicles array in settings
            const doc = await generateQuotationPDF(quoteData, quoteSettings);
            setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
            setPreviewTitle(`Quotation: ${item.quotationNo || 'Draft'}`);
        }
        setShowPreview(true);
    };

    return (
        <div className="space-y-4 pb-24">
            <PDFPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                pdfUrl={previewPdfUrl}
                title={previewTitle}
            />

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

            {/* Engagement Banner - Business Features */}
            <div className="bg-linear-to-br from-[#0047AB] to-indigo-800 rounded-2xl p-4 shadow-lg shadow-blue-100 flex items-center justify-between group transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'staff' }))}>
                <div className="space-y-1.5 flex-1 pr-4">
                    <h3 className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={12} className="text-blue-200" /> Pro Features {settings.isPremium && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[8px]">Active</span>}
                    </h3>
                    <p className="text-blue-50 [9px] font-bold leading-relaxed">
                        Create <strong>Invoices</strong>, <strong>Quotations</strong> & <strong>Pay Slips</strong>. Track <strong>Attendance</strong>, <strong>Salaries</strong> & <strong>Advances</strong> effortlessly.
                    </p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm group-hover:bg-white/20 transition-colors shrink-0">
                    <CheckCircle2 size={24} className="text-white" />
                </div>
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

             {/* Recent Invoices & Quotations - New Section */}
             <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText size={12} className="text-slate-400" /> Recent Invoices & Quotations
                    </h3>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'trips' }))}
                        className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide"
                    >
                        View All
                    </button>
                </div>

                <div className="space-y-2">
                    {recentDocs.length > 0 ? (
                        recentDocs.map((item) => (
                            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between group p-1.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                                        item.type === 'invoice' 
                                            ? 'bg-blue-50 border-blue-100 text-blue-600' 
                                            : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                    }`}>
                                        <FileText size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wide truncate">
                                            {item.customerName || 'Guest User'}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500 mt-0 truncate">
                                            {new Date(item.sortDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {item.type === 'invoice' ? item.invoiceNo || 'Draft Inv' : item.quotationNo || 'Draft Quote'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-2">
                                    <p className="text-[11px] font-bold tabular-nums tracking-tight text-slate-700">
                                        ₹{Math.round(
                                            item.type === 'invoice' 
                                                ? item.totalFare 
                                                : item.items.reduce((acc, i) => acc + parseFloat(i.amount), 0)
                                        ).toLocaleString()}
                                    </p>
                                    <button 
                                        onClick={() => handlePreview(item)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        title="View PDF"
                                    >
                                        <Eye size={12} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-wide py-4">No recent documents</p>
                    )}
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
                        <TrendingUp size={12} className="text-slate-400" /> Recent Logic (Cash Flow)
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
