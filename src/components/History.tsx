import React, { useState, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { Trip } from '../utils/fare';
import { shareReceipt, shareQuotation, generateQuotationPDF, generateReceiptPDF, generateBulkReceiptsPDF, type SavedQuotation } from '../utils/pdf';
import { format, subMonths, addMonths, isSameMonth } from 'date-fns';
import { FileText, Share2, Eye, Trash2, Download, ChevronLeft, ChevronRight, Calendar, PenLine } from 'lucide-react';
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
    onBack?: () => void;
    onEditTrip?: (trip: Trip) => void;
    onEditQuotation?: (quotation: SavedQuotation) => void;
}

type TimeFilter = 'month';
type GstFilter = 'gst' | 'non-gst';

const History: React.FC<HistoryProps> = ({ trips = [], quotations = [], type, onDeleteTrip, onDeleteQuotation, onBack, onEditTrip, onEditQuotation }) => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const [filter] = useState<TimeFilter>('month');
    const [gstFilter, setGstFilter] = useState<GstFilter>('gst');
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    // Preview State
    const [showPreview, setShowPreview] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState('');

    // Filter Logic
    const filteredItems = useMemo(() => {
        const data = type === 'invoice' ? trips : quotations;

        return data.filter(item => {
            const date = new Date(item.date);


            if (filter === 'month' && !isSameMonth(date, selectedMonth)) {
                return false;
            }

            if (type === 'invoice') {
                const trip = item as Trip;
                const isGst = (trip.invoiceNo?.startsWith('INV') || (trip.gst !== undefined && trip.gst > 0));
                
                if (gstFilter === 'gst' && !isGst) return false;
                if (gstFilter === 'non-gst' && isGst) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [trips, quotations, filter, gstFilter, type, selectedMonth]);

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

    const handleBulkDownload = async () => {
        if (type !== 'invoice') return;
        
        // Sort items by Invoice Number for the report
        // Filter: Only include GST Invoices (INV prefix), skip Non-GST Bills (BILL prefix)
        const itemsToPrint = ([...filteredItems] as Trip[]).filter(trip => 
            trip.invoiceNo?.startsWith('INV') || (trip.gst !== undefined && trip.gst > 0)
        );

        itemsToPrint.sort((a, b) => {
             const aNum = a.invoiceNo || '';
             const bNum = b.invoiceNo || '';
             return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
        });

        if (itemsToPrint.length === 0) {
            alert('No GST invoices found to download for this month.');
            return;
        }

        try {
            const doc = await generateBulkReceiptsPDF(itemsToPrint, {
                ...settings,
                vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A'
            });
            const monthStr = format(selectedMonth, 'MMM-yyyy');
            doc.save(`${monthStr}-GST-Invoices.pdf`);
        } catch (error) {
            console.error('Bulk download failed:', error);
            alert('Failed to generate monthly report.');
        }
    };

    // Ad Removal
    const { triggerAction } = useAdProtection();


    return (
        <div className="pb-24">
            <PDFPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                pdfUrl={previewPdfUrl}
                title={type === 'invoice' ? "Invoice Preview" : "Quotation Preview"}
            />

            {/* Filter & Summary Section */}
            <div className="flex flex-col gap-1.5 sticky top-[-16px] md:top-[-32px] z-20 bg-[#F5F7FA]/95 backdrop-blur-md -mx-3 px-3 py-1.5 mb-2 border-b border-slate-200/50 shadow-sm">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-0.5">
                        <div className="flex items-center gap-2">
                            {onBack && (
                                <button onClick={onBack} className="lg:hidden p-1 -ml-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-transform">
                                    <ChevronLeft size={20} strokeWidth={2.5} />
                                </button>
                            )}
                            <h3 className="text-[10px] font-black uppercase tracking-widest relative inline-block text-slate-800">
                                {onBack ? 'BACK' : `${type === 'invoice' ? 'Invoice' : 'Quotation'} History`}
                                <span className="absolute -bottom-1 left-0 w-6 h-0.5 rounded-full bg-primary"></span>
                            </h3>
                        </div>

                    </div>

                    {/* Month Navigator & Actions */}
                    {filter === 'month' && (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center justify-between bg-white rounded-lg p-1.5 border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setSelectedMonth((prev: Date) => subMonths(prev, 1))}
                                    className="p-1 hover:bg-slate-50 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">
                                        {format(selectedMonth, 'MMMM yyyy')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedMonth((prev: Date) => addMonths(prev, 1))}
                                    className="p-1 hover:bg-slate-50 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            {/* Download Button */}
                            {type === 'invoice' && filteredItems.length > 0 && (
                                <button
                                    onClick={() => triggerAction(handleBulkDownload)}
                                    className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-blue-800 transition-colors flex items-center justify-center"
                                    title="Download Monthly GST Report"
                                >
                                    <Download size={20} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* GST Filter Toggle */}
                    {type === 'invoice' && (
                        <div className="bg-slate-100/30 p-1 rounded-xl border border-slate-200/50 flex gap-1 mx-0.5 mt-1">
                            {(['gst', 'non-gst'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setGstFilter(f)}
                                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${gstFilter === f 
                                        ? 'bg-primary text-white shadow-md' 
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                                >
                                    {f === 'gst' ? 'GST Invoice' : 'Non-GST Bill'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total Summary Card - More Compact */}
                <div className="bg-white border border-slate-200 rounded-xl p-2 flex justify-between items-center shadow-sm">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 line-clamp-1">Total Volume</p>
                        <h2 className="text-base font-black tracking-tight text-slate-900 leading-none">₹{Math.round(totalAmount).toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] bg-primary/5 text-primary border-primary/10 px-2 py-0.5 rounded-md font-black uppercase tracking-wider border">{filteredItems.length} {type === 'invoice' ? 'Invoices' : 'Quotes'}</span>
                    </div>
                </div>
            </div>

            {
                filteredItems.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-2xl py-12 flex flex-col items-center justify-center text-center">
                        <FileText className="text-slate-200 mb-3" size={32} />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                            No {type === 'invoice' ? 'invoices' : 'quotations'} found for {filter === 'month' ? format(selectedMonth, 'MMM yyyy') : filter}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map((item) => {
                            const isInvoice = type === 'invoice';
                            const trip = isInvoice ? item as Trip : null;
                            const quotation = !isInvoice ? item as SavedQuotation : null;

                            return (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all mx-1 mb-2">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isInvoice && trip?.mode === 'outstation' ? 'bg-purple-400' : 'bg-primary'}`}></div>

                                    <div className="p-2.5 pl-3.5">
                                        {/* Top Row: Invoice No & Date */}
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                {isInvoice ? (trip?.invoiceNo || 'INV-000') : (quotation?.quotationNo || 'QTN-000')}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">{formatDate(item.date)}</span>
                                        </div>

                                        {/* Main Content: Customer & Amount */}
                                        <div className="flex justify-between items-center mb-1.5">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate leading-none">{item.customerName || 'Guest User'}</h4>
                                            <p className="text-base font-black text-slate-900 tracking-tight tabular-nums leading-none">
                                                ₹{Math.round(isInvoice ? (trip?.totalFare || 0) : ((quotation?.items || []).reduce((s: number, i: { amount: string }) => s + (parseFloat(i.amount) || 0), 0) * (quotation?.gstEnabled ? 1.05 : 1))).toLocaleString('en-IN')}
                                            </p>
                                        </div>

                                        {/* Route Details */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center px-1 py-px rounded-[4px] text-[8px] font-black uppercase tracking-wider border bg-primary/5 text-primary border-primary/10">
                                                {isInvoice ? (trip?.mode || 'TRIP') : 'QUOTE'}
                                            </span>
                                            {isInvoice && (trip?.invoiceNo?.startsWith('INV') || (trip?.gst !== undefined && trip.gst > 0)) && (
                                                <span className="inline-flex items-center px-1 py-px rounded-[4px] text-[8px] font-black uppercase tracking-wider border bg-primary/5 text-primary border-primary/10">
                                                    GST
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[200px]">
                                                {isInvoice ? `${trip?.from}${trip?.to ? ` ➔ ${trip.to}` : ''}` : quotation?.subject}
                                            </span>
                                        </div>

                                        {/* Footer Actions - Compact */}
                                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => triggerAction(() => isInvoice ? handlePreviewInvoice(trip!) : handlePreviewQuotation(quotation!))}
                                                    className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide"
                                                >
                                                    <Eye size={12} strokeWidth={2.5} />
                                                    <span>View</span>
                                                </button>
                                                <button
                                                    onClick={() => triggerAction(() => isInvoice ? handleDownloadInvoice(trip!) : handleDownloadQuotation(quotation!))}
                                                    className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide"
                                                >
                                                    <Download size={12} strokeWidth={2.5} />
                                                    <span>PDF</span>
                                                </button>
                                                <button
                                                    onClick={() => triggerAction(() => isInvoice ? shareReceipt(trip!, { ...settings, vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A', userId: user?.id }) : handleShareQuotation(quotation!))}
                                                    className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide"
                                                >
                                                    <Share2 size={12} strokeWidth={2.5} />
                                                    <span>Share</span>
                                                </button>
                                                {(isInvoice ? onEditTrip : onEditQuotation) && (
                                                    <button
                                                        onClick={() => triggerAction(() => isInvoice ? onEditTrip!(trip!) : onEditQuotation!(quotation!))}
                                                        className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide"
                                                    >
                                                        <PenLine size={12} strokeWidth={2.5} />
                                                        <span>Edit</span>
                                                    </button>
                                                )}
                                            </div>

                                            {(isInvoice ? onDeleteTrip : onDeleteQuotation) && (
                                                <button
                                                    onClick={() => isInvoice ? onDeleteTrip!(item.id) : onDeleteQuotation!(item.id)}
                                                    className="p-1 rounded text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={12} strokeWidth={2.5} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            }
        </div>
    );
};

export default History;
