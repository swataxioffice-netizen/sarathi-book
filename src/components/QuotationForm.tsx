import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { shareQuotation } from '../utils/pdf';
import type { QuotationItem } from '../utils/pdf';
import { safeJSONParse } from '../utils/storage';
import { Send, User, Plus, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface SavedQuotation {
    id: string;
    customerName: string;
    subject: string;
    date: string;
    items: QuotationItem[];
    vehicleType: string;
}

const QuotationForm: React.FC = () => {
    const { settings } = useSettings();
    const [customerName, setCustomerName] = useState('');
    const [subject, setSubject] = useState('');
    const [vehicleType, setVehicleType] = useState('Sedan');
    const [items, setItems] = useState<QuotationItem[]>([
        { description: 'Airport Transfer', package: 'Minimum 20 Km', vehicleType: 'Sedan', rate: '700', amount: '700.00' },
        { description: 'One Way', package: 'Minimum 130 Km', vehicleType: 'Sedan', rate: '15 / km', amount: '2250.00' },
        { description: 'Round Trip', package: 'Minimum 250 Km', vehicleType: 'Sedan', rate: '12 / km', amount: '3400.00' }
    ]);
    const [showItems, setShowItems] = useState(false);
    const [quotations, setQuotations] = useState<SavedQuotation[]>(() => safeJSONParse('saved-quotations', []));
    const [showAllHistory, setShowAllHistory] = useState(false);

    useEffect(() => {
        localStorage.setItem('saved-quotations', JSON.stringify(quotations));
    }, [quotations]);

    const handleAddItem = () => {
        setItems([...items, { description: '', package: '', vehicleType: vehicleType, rate: '', amount: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleShareQuote = async () => {
        if (!customerName || items.length === 0) return;

        const newQuote: SavedQuotation = {
            id: Date.now().toString(),
            customerName,
            subject,
            date: new Date().toISOString(),
            items: items.map(item => ({ ...item, vehicleType })),
            vehicleType
        };

        setQuotations(prev => [newQuote, ...prev]);

        await shareQuotation({
            customerName,
            subject,
            date: newQuote.date,
            items: newQuote.items
        }, { ...settings, vehicleNumber: 'N/A' });
    };

    const handleReshare = async (quote: SavedQuotation) => {
        await shareQuotation({
            customerName: quote.customerName,
            subject: quote.subject,
            date: quote.date,
            items: quote.items
        }, { ...settings, vehicleNumber: 'N/A' });
    };

    const displayHistory = showAllHistory ? quotations : quotations.slice(0, 3);

    return (
        <div className="space-y-2 pb-24">
            {/* Page Title */}
            <div className="px-2 py-1 text-center">
                <h2 className="text-lg font-black uppercase tracking-wide text-slate-800 underline decoration-4 decoration-blue-500 underline-offset-4">QUOTATION</h2>
                <p className="text-slate-600 text-[10px] font-medium mt-0.5">Create formal quotations</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 space-y-2">
                <div className="space-y-2">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guest / Company Name</label>
                        <div className="relative">
                            <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="tn-input h-8 pl-8 text-xs font-bold bg-slate-50 border-slate-200"
                                placeholder="Client / Company Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="tn-input h-8 text-xs font-bold bg-slate-50 border-slate-200"
                            placeholder="e.g. Airport Transfer"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                        <div className="flex gap-1">
                            {['Sedan', 'SUV', 'Innova', 'Tempo'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setVehicleType(type)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all border ${vehicleType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-1">
                    <button
                        onClick={() => setShowItems(!showItems)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-[#0047AB] uppercase tracking-widest"
                    >
                        <span>Edit Items ({items.length})</span>
                        {showItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showItems && (
                        <div className="space-y-2 animate-fade-in">
                            {items.map((item, index) => (
                                <div key={index} className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1.5 relative">
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90"
                                    >
                                        <Trash2 size={10} />
                                    </button>

                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase">Description</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            className="tn-input h-7 text-xs font-bold"
                                            placeholder="Service"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase">Package</label>
                                            <input
                                                type="text"
                                                value={item.package}
                                                onChange={(e) => updateItem(index, 'package', e.target.value)}
                                                className="tn-input h-7 text-xs font-bold"
                                                placeholder="Limit"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase">Rate</label>
                                            <input
                                                type="text"
                                                value={item.rate}
                                                onChange={(e) => updateItem(index, 'rate', e.target.value)}
                                                className="tn-input h-7 text-xs font-bold"
                                                placeholder="Rate"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase">Amount</label>
                                            <input
                                                type="text"
                                                value={item.amount}
                                                onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                                className="tn-input h-7 text-xs font-black text-right"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={handleAddItem}
                                className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-slate-400 text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-slate-50"
                            >
                                <Plus size={14} /> ADD ROW
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-1">
                    <button
                        onClick={handleShareQuote}
                        disabled={!customerName || items.length === 0}
                        className="w-full bg-[#0047AB] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <Send size={16} />
                        Share Quotation
                    </button>
                </div>
            </div>

            {/* Quotation History */}
            <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Recent Quotations</h3>
                    {quotations.length > 3 && (
                        <button
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="text-[9px] font-black uppercase tracking-tight text-[#0047AB] bg-blue-50 px-2 py-1 rounded-full border border-blue-100"
                        >
                            {showAllHistory ? 'Show Less' : 'View All'}
                        </button>
                    )}
                </div>

                {quotations.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-xl py-6 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No quotations yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayHistory.map((quote) => (
                            <div key={quote.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/20"></div>
                                <div className="flex items-center gap-3 pl-1">
                                    <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg text-purple-500">
                                        <FileText size={16} />
                                    </div>
                                    <div className="leading-tight">
                                        <h4 className="text-xs font-black text-slate-900">{quote.customerName}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {new Date(quote.date).toLocaleDateString()}
                                            </span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                            <span className="text-[8px] font-black text-purple-600 uppercase">
                                                {quote.items.length} Items
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleReshare(quote)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-[#0047AB] hover:text-white transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotationForm;
