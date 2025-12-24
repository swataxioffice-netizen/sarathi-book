import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { shareQuotation } from '../utils/pdf';
import type { QuotationItem } from '../utils/pdf';
import { Send, User, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const QuotationForm: React.FC = () => {
    const { settings } = useSettings();
    const [customerName, setCustomerName] = useState('');
    const [subject, setSubject] = useState('Pickup and Drop from the airport to various locations - Reg');
    const [vehicleType, setVehicleType] = useState('Sedan');
    const [items, setItems] = useState<QuotationItem[]>([
        { description: 'Airport Transfer', package: 'Minimum 20 Km', vehicleType: 'Sedan', rate: '700', amount: '700.00' },
        { description: 'One Way', package: 'Minimum 130 Km', vehicleType: 'Sedan', rate: '15 / km', amount: '2250.00' },
        { description: 'Round Trip', package: 'Minimum 250 Km', vehicleType: 'Sedan', rate: '12 / km', amount: '3400.00' }
    ]);
    const [showItems, setShowItems] = useState(false);

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

        await shareQuotation({
            customerName,
            subject,
            date: new Date().toISOString(),
            items: items.map(item => ({ ...item, vehicleType }))
        }, { ...settings, vehicleNumber: 'N/A' });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-center items-center px-1 pb-4">
                <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 px-8">Formal Quotation</h3>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Guest / Company Name</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="tn-input pl-11"
                                placeholder="Client / Company Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="tn-input"
                            placeholder="e.g. Pickup and Drop from the airport to various locations"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Vehicle Type</label>
                        <div className="flex gap-2">
                            {['Sedan', 'SUV', 'Innova', 'Tempo'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setVehicleType(type)}
                                    className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all border-2 ${vehicleType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => setShowItems(!showItems)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-[#0047AB] uppercase tracking-widest"
                    >
                        <span>Edit Quotation Items ({items.length})</span>
                        {showItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showItems && (
                        <div className="space-y-4 animate-fade-in p-2">
                            {items.map((item, index) => (
                                <div key={index} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 relative">
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Service Description</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            className="tn-input h-9 text-sm"
                                            placeholder="e.g. One Way"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Package / Limit</label>
                                            <input
                                                type="text"
                                                value={item.package}
                                                onChange={(e) => updateItem(index, 'package', e.target.value)}
                                                className="tn-input h-9 text-sm"
                                                placeholder="e.g. Min 130 Km"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Rate/Unit</label>
                                            <input
                                                type="text"
                                                value={item.rate}
                                                onChange={(e) => updateItem(index, 'rate', e.target.value)}
                                                className="tn-input h-9 text-sm"
                                                placeholder="e.g. 15 / Km or Fixed"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Final Amount</label>
                                        <input
                                            type="text"
                                            value={item.amount}
                                            onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                            className="tn-input h-9 text-sm font-black"
                                            placeholder="e.g. 2500.00"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={handleAddItem}
                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-50"
                            >
                                <Plus size={16} /> ADD NEW SERVICE ROW
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleShareQuote}
                        disabled={!customerName || items.length === 0}
                        className="w-full bg-[#0047AB] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-[13px] uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <Send size={18} />
                        Share Professional Quotation
                    </button>
                    <p className="text-[9px] text-center text-slate-400 mt-3 font-bold uppercase tracking-widest">
                        This follows the Formal PDF standard
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuotationForm;
