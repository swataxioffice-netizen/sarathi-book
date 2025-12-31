import React, { useState, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { Trip } from '../utils/fare';
import { shareReceipt, shareQuotation, type SavedQuotation } from '../utils/pdf';
import { FileText, Share2, Eye, Trash2, Quote, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HistoryProps {
    trips?: Trip[];
    quotations?: SavedQuotation[];
    type: 'invoice' | 'quotation';
    onDeleteTrip?: (id: string) => void;
    onDeleteQuotation?: (id: string) => void;
    onConvertQuotation?: (quotation: SavedQuotation) => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

const History: React.FC<HistoryProps> = ({ trips = [], quotations = [], type, onDeleteTrip, onDeleteQuotation, onConvertQuotation }) => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const [filter, setFilter] = useState<TimeFilter>('all');

    // Filter Logic
    const filteredItems = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const data = type === 'invoice' ? trips : quotations;

        return data.filter(item => {
            const date = new Date(item.date);
            const dateStr = date.toISOString().split('T')[0];

            if (filter === 'today') return dateStr === today;
            if (filter === 'week') {
                const diffTime = Math.abs(now.getTime() - date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            }
            if (filter === 'month') {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [trips, quotations, filter, type]);

    // Calculate Total Amount
    const totalAmount = useMemo(() => {
        if (type === 'invoice') {
            return (filteredItems as Trip[]).reduce((sum, item) => sum + item.totalFare, 0);
        } else {
            return (filteredItems as SavedQuotation[]).reduce((sum, item) => {
                const itemTotal = item.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
                const gst = item.gstEnabled ? itemTotal * 0.05 : 0;
                return sum + itemTotal + gst;
            }, 0);
        }
    }, [filteredItems, type]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleShareQuotation = async (q: SavedQuotation) => {
        const quoteData = {
            customerName: q.customerName,
            subject: q.subject,
            date: q.date,
            items: q.items,
            gstEnabled: q.gstEnabled
        };
        await shareQuotation(quoteData, {
            ...settings,
            vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A',
            userId: user?.id
        });
    };

    return (
        <div className="space-y-4 pt-2 pb-24">

            {/* Filter & Summary Section */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                    <h3 className={`text-[11px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 ${type === 'invoice' ? 'text-slate-800 decoration-blue-500' : 'text-slate-800 decoration-[#6366F1]'}`}>
                        Recent {type === 'invoice' ? 'Invoices' : 'Quotations'}
                    </h3>
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                        {(['all', 'today', 'week', 'month'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Total Card */}
                <div className={`rounded-xl p-4 text-white shadow-lg relative overflow-hidden bg-gradient-to-r ${type === 'invoice' ? 'from-slate-900 to-slate-800' : 'from-[#4F46E5] to-[#6366F1]'}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-1">Total {filter === 'all' ? 'Volume' : filter + ' Volume'}</p>
                            <h2 className="text-2xl font-black tracking-tight">₹{Math.round(totalAmount).toLocaleString('en-IN')}</h2>
                        </div>
                        <div className="mb-1">
                            <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full font-medium">{filteredItems.length} {type === 'invoice' ? 'Invoices' : 'Quotes'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {
                filteredItems.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-center">
                        <FileText className="text-slate-300 mb-2" size={24} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No {type === 'invoice' ? 'invoices' : 'quotations'} found for {filter}</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredItems.map((item: any) => (
                            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${type === 'invoice' ? (item.mode === 'outstation' ? 'bg-purple-500' : 'bg-[#0047AB]') : 'bg-[#6366F1]'}`}></div>

                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3 pl-1.5">
                                        <div className={`p-2.5 rounded-xl border ${type === 'invoice' ? (item.mode === 'outstation' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-blue-50 border-blue-100 text-[#0047AB]') : 'bg-indigo-50 border-indigo-100 text-[#6366F1]'}`}>
                                            {type === 'invoice' ? <FileText size={18} /> : <Quote size={18} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-sm font-black text-slate-900 leading-none truncate max-w-[140px]">{item.customerName || 'Guest User'}</h4>

                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                    {formatDate(item.date)}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${type === 'invoice' ? (item.mode === 'outstation' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700') : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {type === 'invoice' ? (item.mode === 'package' ? 'PACKAGE' : item.mode === 'hourly' ? 'RENTAL' : item.mode === 'outstation' ? 'OUTSTATION' : 'DROP') : (item.quotationNo || 'QUOTATION')}
                                                </span>
                                            </div>

                                            <div className="mt-1 text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                                                {type === 'invoice' ? `${item.from}${item.to ? ` ➔ ${item.to}` : ''}` : item.subject}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-sm font-black text-slate-900">
                                            ₹{Math.round(type === 'invoice' ? item.totalFare : item.items.reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0) * (item.gstEnabled ? 1.05 : 1)).toLocaleString('en-IN')}
                                        </span>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => type === 'invoice' ? shareReceipt(item, { ...settings, vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A', userId: user?.id }) : handleShareQuotation(item)}
                                                className={`p-2 rounded-lg transition-all border ${type === 'invoice' ? 'bg-blue-50 text-[#0047AB] border-blue-100 hover:bg-[#0047AB]' : 'bg-indigo-50 text-[#6366F1] border-indigo-100 hover:bg-[#6366F1]'} hover:text-white`}
                                                title="View/Download"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => type === 'invoice' ? shareReceipt(item, { ...settings, vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A', userId: user?.id }) : handleShareQuotation(item)}
                                                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all border border-green-100"
                                                title="Share"
                                            >
                                                <Share2 size={14} />
                                            </button>

                                            {/* Convert to Invoice (Quotation Only) */}
                                            {type === 'quotation' && onConvertQuotation && (
                                                <button
                                                    onClick={() => onConvertQuotation(item)}
                                                    className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                                                    title="Convert to Invoice"
                                                >
                                                    <ArrowRightLeft size={14} />
                                                </button>
                                            )}

                                            {/* Delete Button */}
                                            {(type === 'invoice' ? onDeleteTrip : onDeleteQuotation) && (
                                                <button
                                                    onClick={() => type === 'invoice' ? onDeleteTrip!(item.id) : onDeleteQuotation!(item.id)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
};
export default History;
