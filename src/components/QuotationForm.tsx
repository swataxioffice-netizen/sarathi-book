import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { shareQuotation } from '../utils/pdf';
import type { QuotationItem } from '../utils/pdf';
import { safeJSONParse } from '../utils/storage';
import { Send, User, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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
    const [customerName, setCustomerName] = useState(() => safeJSONParse('draft-q-name', ''));
    const [subject, setSubject] = useState(() => safeJSONParse('draft-q-subject', ''));
    const [vehicleType, setVehicleType] = useState(() => safeJSONParse('draft-q-vehicle', 'Sedan'));
    const [items, setItems] = useState<QuotationItem[]>(() => safeJSONParse('draft-q-items', []));
    const [showItems, setShowItems] = useState(false);
    const [quotations, setQuotations] = useState<SavedQuotation[]>(() => safeJSONParse('saved-quotations', []));

    // Auto-save draft changes
    useEffect(() => { localStorage.setItem('draft-q-name', JSON.stringify(customerName)); }, [customerName]);
    useEffect(() => { localStorage.setItem('draft-q-subject', JSON.stringify(subject)); }, [subject]);
    useEffect(() => { localStorage.setItem('draft-q-vehicle', JSON.stringify(vehicleType)); }, [vehicleType]);
    useEffect(() => { localStorage.setItem('draft-q-items', JSON.stringify(items)); }, [items]);


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
        if (!customerName?.trim()) { alert('Please enter Guest / Company Name'); return; }
        if (!subject?.trim()) { alert('Please enter a Subject for the quotation'); return; }
        if (items.length === 0) { alert('Please add at least one item to the quotation'); return; }

        // Validate Item Details
        const invalidItems = items.filter(i => !i.description?.trim() || !i.amount || Number(i.amount) <= 0);
        if (invalidItems.length > 0) {
            alert('Please ensure all items have a Description and valid Amount');
            return;
        }

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

        // Clear draft after successful creation
        setCustomerName('');
        setSubject('');
        setVehicleType('Sedan');
        setItems([]);
        localStorage.removeItem('draft-q-name');
        localStorage.removeItem('draft-q-subject');
        localStorage.removeItem('draft-q-vehicle');
        localStorage.removeItem('draft-q-items');
    };

    return (
        <div className="space-y-2 pb-24">
            {/* Page Title */}
            <div className="px-2 py-1 text-center">
                <h2 className="text-lg font-black uppercase tracking-wide text-slate-800 underline decoration-4 decoration-[#6366F1] underline-offset-4">QUOTATION</h2>
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
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-[#6366F1] uppercase tracking-widest"
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
                        className="w-full bg-[#6366F1] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <Send size={16} />
                        Share Quotation
                    </button>
                </div>
            </div>


        </div>
    );
};

export default QuotationForm;
