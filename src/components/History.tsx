import React, { useState, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { Trip } from '../utils/fare';
import { shareReceipt, shareQuotation, generateQuotationPDF, generateReceiptPDF, type SavedQuotation } from '../utils/pdf';
import { FileText, Share2, Eye, Trash2, Quote, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdProtection } from '../hooks/useAdProtection';
import PDFPreviewModal from './PDFPreviewModal';


interface HistoryProps {
    trips?: Trip[];
    quotations?: SavedQuotation[];
    type: 'invoice' | 'quotation';
    onDeleteTrip?: (id: string) => void;
    onDeleteQuotation?: (id: string) => void;
    onConvertQuotation?: (quotation: SavedQuotation) => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

const History: React.FC<HistoryProps> = ({ trips = [], quotations = [], type, onDeleteTrip, onDeleteQuotation }) => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const [filter, setFilter] = useState<TimeFilter>('all');

    // Preview State
    const [showPreview, setShowPreview] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState('');

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

    const handlePreviewQuotation = async (q: SavedQuotation) => {
        const quoteData = {
            customerName: q.customerName,
            subject: q.subject,
            date: q.date,
            items: q.items,
            gstEnabled: q.gstEnabled,
            quotationNo: q.quotationNo,
            terms: q.terms,
            customerAddress: q.customerAddress,
            customerGstin: q.customerGstin
        };
        const doc = await generateQuotationPDF(quoteData, {
            ...settings,
            vehicleNumber: 'N/A' // Quotations are generic
        });
        setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
        setShowPreview(true);
    };

    const handlePreviewInvoice = async (trip: Trip) => {
        const doc = await generateReceiptPDF(trip, {
            ...settings,
            vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A'
        });
        setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
        setShowPreview(true);
    };

    const handleDownloadQuotation = async (q: SavedQuotation) => {
        const quoteData = {
            customerName: q.customerName,
            subject: q.subject,
            date: q.date,
            items: q.items,
            gstEnabled: q.gstEnabled,
            quotationNo: q.quotationNo,
            terms: q.terms,
            customerAddress: q.customerAddress,
            customerGstin: q.customerGstin
        };
        const doc = await generateQuotationPDF(quoteData, {
            ...settings,
            vehicleNumber: 'N/A'
        });
        doc.save(`${q.quotationNo || 'quotation'}.pdf`);
    };

    const handleDownloadInvoice = async (trip: Trip) => {
        const doc = await generateReceiptPDF(trip, {
            ...settings,
            vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A'
        });
        doc.save(`${trip.invoiceNo || 'invoice'}.pdf`);
    };

    const handleShareQuotation = async (q: SavedQuotation) => {
        const quoteData = {
            customerName: q.customerName,
            subject: q.subject,
            date: q.date,
            items: q.items,
            gstEnabled: q.gstEnabled,
            quotationNo: q.quotationNo,
            terms: q.terms,
            customerAddress: q.customerAddress,
            customerGstin: q.customerGstin
        };
        await shareQuotation(quoteData, {
            ...settings,
            vehicleNumber: 'N/A', // Quotations are generic usually
            userId: user?.id
        });
    };

    // Ad Removal
    const { triggerAction } = useAdProtection();


    return (
        <div className="space-y-3 pt-2 pb-24">
            <React.Suspense fallback={null}>
            </React.Suspense>


            <PDFPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                pdfUrl={previewPdfUrl}
                title={type === 'invoice' ? "Invoice Preview" : "Quotation Preview"}
            />

            {/* Filter & Summary Section */}
            <div className="flex flex-col gap-1.5 sticky top-[-16px] md:top-[-32px] z-20 bg-[#F5F7FA]/95 backdrop-blur-md -mx-3 px-3 py-1.5 mb-2 border-b border-slate-200/50 shadow-sm">
                <div className="flex justify-between items-center px-0.5">
                    <h3 className={`text-[10px] font-black uppercase tracking-widest relative inline-block ${type === 'invoice' ? 'text-slate-800' : 'text-slate-800'}`}>
                        Recent {type === 'invoice' ? 'Invoices' : 'Quotations'}
                        <span className={`absolute -bottom-1 left-0 w-6 h-0.5 rounded-full ${type === 'invoice' ? 'bg-blue-600' : 'bg-[#6366F1]'}`}></span>
                    </h3>
                    <div className="flex bg-slate-100/50 rounded-lg p-0.5 border border-slate-200/50">
                        {(['all', 'today', 'week', 'month'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase transition-all ${filter === f ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Total Summary Card - More Compact */}
                <div className="bg-white border border-slate-200 rounded-xl p-2 flex justify-between items-center shadow-sm">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 line-clamp-1">Total Volume</p>
                        <h2 className="text-base font-black tracking-tight text-slate-900 leading-none">₹{Math.round(totalAmount).toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-black uppercase tracking-wider border border-blue-100">{filteredItems.length} {type === 'invoice' ? 'Invoices' : 'Quotes'}</span>
                    </div>
                </div>
            </div>

            {
                filteredItems.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-2xl py-12 flex flex-col items-center justify-center text-center">
                        <FileText className="text-slate-200 mb-3" size={32} />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">No {type === 'invoice' ? 'invoices' : 'quotations'} found for {filter}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map((item: any) => (
                            <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden group hover:bg-slate-50 transition-all mx-1">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${type === 'invoice' ? (item.mode === 'outstation' ? 'bg-purple-500' : 'bg-blue-600') : 'bg-indigo-600'}`}></div>

                                <div className="p-2 space-y-2">
                                    {/* Row 1: Header & Amount - Compact */}
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${type === 'invoice' ? (item.mode === 'outstation' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-blue-50 border-blue-100 text-blue-600') : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                                {type === 'invoice' ? <FileText size={14} /> : <Quote size={14} />}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wide truncate leading-tight">{item.customerName || 'Guest User'}</h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide ${type === 'invoice' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                                        {type === 'invoice' ? (item.mode || 'TRIP') : 'QUOTE'}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold">•</span>
                                                    <span className="text-[9px] font-bold text-slate-500">{formatDate(item.date)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[13px] font-bold text-slate-900 tracking-tight tabular-nums">
                                                ₹{Math.round(type === 'invoice' ? item.totalFare : (item.items || []).reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0) * (item.gstEnabled ? 1.05 : 1)).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Row 2: Details - Compact Line */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                                        <p className="text-[10px] font-bold text-slate-500 truncate max-w-[60%]">
                                            {(type === 'invoice' ? (item.invoiceNo || 'INV-000') : (item.quotationNo || 'QTN-000'))} • {type === 'invoice' ? `${item.from}${item.to ? ` ➔ ${item.to}` : ''}` : item.subject}
                                        </p>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => triggerAction(() => type === 'invoice' ? handlePreviewInvoice(item) : handlePreviewQuotation(item))}
                                                className="p-1.5 rounded-md bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                                                aria-label="View"
                                            >
                                                <Eye size={12} />
                                            </button>
                                            <button
                                                onClick={() => triggerAction(() => type === 'invoice' ? handleDownloadInvoice(item) : handleDownloadQuotation(item))}
                                                className="p-1.5 rounded-md bg-slate-50 text-blue-600 hover:bg-blue-50 transition-colors"
                                                aria-label="Download PDF"
                                            >
                                                <Download size={12} />
                                            </button>
                                            <button
                                                onClick={() => triggerAction(() => type === 'invoice' ? shareReceipt(item, { ...settings, vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A', userId: user?.id }) : handleShareQuotation(item))}
                                                className="p-1.5 rounded-md bg-slate-50 text-green-600 hover:bg-green-50 transition-colors"
                                                aria-label="Share"
                                            >
                                                <Share2 size={12} />
                                            </button>
                                            {(type === 'invoice' ? onDeleteTrip : onDeleteQuotation) && (
                                                <button
                                                    onClick={() => type === 'invoice' ? onDeleteTrip!(item.id) : onDeleteQuotation!(item.id)}
                                                    className="p-1.5 rounded-md bg-slate-50 text-red-500 hover:bg-red-50 transition-colors"
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 size={12} />
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
        </div>
    );
};

export default History;
