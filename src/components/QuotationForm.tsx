import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { shareQuotation, type SavedQuotation, type QuotationItem } from '../utils/pdf';
import { safeJSONParse } from '../utils/storage';
import { Send, User, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, MapPin, Landmark, Eye } from 'lucide-react';
import { generateQuotationPDF } from '../utils/pdf';
import PDFPreviewModal from './PDFPreviewModal';
import { saveToHistory, getHistory } from '../utils/history';
import { toTitleCase, formatAddress } from '../utils/stringUtils';
import { useAuth } from '../contexts/AuthContext';

interface QuotationFormProps {
    onSaveQuotation: (q: SavedQuotation) => void;
    quotations?: SavedQuotation[];
}

const DEFAULT_TERMS = [
    'Toll, Parking, State Permit and Border Entry Fees are extra as per actual receipts.',
    'Driver Batta/Allowance will be charged extra as applicable.',
    'Night Driving Allowance (10 PM to 6 AM) will be charged extra if applicable.',
    'Starting and Ending KM/Time will be calculated from our office to office.',
    'In case of any significant fuel price hike, the rates will be subject to revision.',
    'This quotation is valid for a period of 15 days from the date of issue.'
];

const QuotationForm: React.FC<QuotationFormProps> = ({ onSaveQuotation, quotations = [] }) => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const [customerName, setCustomerName] = useState(() => safeJSONParse('draft-q-name', ''));
    const [customerAddress, setCustomerAddress] = useState(() => safeJSONParse('draft-q-address', ''));
    const [customerGstin, setCustomerGstin] = useState(() => safeJSONParse('draft-q-gstin', ''));
    const [subject, setSubject] = useState(() => safeJSONParse('draft-q-subject', ''));
    const [vehicleType, setVehicleType] = useState(() => safeJSONParse('draft-q-vehicle', 'Sedan'));
    const [items, setItems] = useState<QuotationItem[]>(() => safeJSONParse('draft-q-items', []));
    const [gstEnabled, setGstEnabled] = useState(() => safeJSONParse('draft-q-gst', false));
    const [selectedTerms, setSelectedTerms] = useState<string[]>(() => safeJSONParse('draft-q-terms', DEFAULT_TERMS));
    const [customTerm, setCustomTerm] = useState('');
    const [showItems, setShowItems] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // History States
    const [history, setHistory] = useState({
        names: getHistory('customer_name'),
        addresses: getHistory('customer_address'),
        gstins: getHistory('customer_gstin'),
        subjects: getHistory('quotation_subject'),
        descriptions: getHistory('item_description')
    });

    // Auto-save draft changes
    useEffect(() => { localStorage.setItem('draft-q-name', JSON.stringify(customerName)); }, [customerName]);
    useEffect(() => { localStorage.setItem('draft-q-address', JSON.stringify(customerAddress)); }, [customerAddress]);
    useEffect(() => { localStorage.setItem('draft-q-gstin', JSON.stringify(customerGstin)); }, [customerGstin]);
    useEffect(() => { localStorage.setItem('draft-q-subject', JSON.stringify(subject)); }, [subject]);
    useEffect(() => { localStorage.setItem('draft-q-vehicle', JSON.stringify(vehicleType)); }, [vehicleType]);
    useEffect(() => { localStorage.setItem('draft-q-items', JSON.stringify(items)); }, [items]);
    useEffect(() => { localStorage.setItem('draft-q-gst', JSON.stringify(gstEnabled)); }, [gstEnabled]);
    useEffect(() => { localStorage.setItem('draft-q-terms', JSON.stringify(selectedTerms)); }, [selectedTerms]);



    const handleAddItem = () => {
        setItems([...items, { description: '', package: '', vehicleType: vehicleType, rate: '', amount: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const applyTemplate = (type: 'day_rental') => {
        if (type === 'day_rental') {
            setSubject('Day Rental Quotation');
            setItems([
                {
                    description: 'Day Rental (Local)',
                    package: '12 Hrs / 120 KM',
                    vehicleType: vehicleType,
                    rate: '4000',
                    amount: '4000'
                }
            ]);
            setGstEnabled(true);
            setShowItems(true);
        }
    };

    const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const toggleTerm = (term: string) => {
        if (selectedTerms.includes(term)) {
            setSelectedTerms(selectedTerms.filter(t => t !== term));
        } else {
            setSelectedTerms([...selectedTerms, term]);
        }
    };

    const addCustomTerm = () => {
        if (!customTerm.trim()) return;
        const newTerm = `• ${customTerm.trim()}`;
        setSelectedTerms([...selectedTerms, newTerm]);
        setCustomTerm('');
    };

    const removeTerm = (index: number) => {
        setSelectedTerms(selectedTerms.filter((_, i) => i !== index));
    };

    const getNextQuotationNo = () => {
        const dateObj = new Date();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        const prefix = `QT/${mm}${yyyy}/`;

        if (!quotations || quotations.length === 0) {
            return `${prefix}01`;
        }

        // Find all quotations for the current month and get their serial numbers
        const currentMonthSerials = quotations
            .filter(q => q.quotationNo && q.quotationNo.startsWith(prefix))
            .map(q => {
                const parts = q.quotationNo.split('/');
                const serialStr = parts[parts.length - 1];
                return parseInt(serialStr) || 0;
            });

        const maxSerial = currentMonthSerials.length > 0 ? Math.max(...currentMonthSerials) : 0;
        return `${prefix}${String(maxSerial + 1).padStart(2, '0')}`;
    };

    const handlePreview = async () => {
        if (!customerName?.trim()) { alert('Please enter Guest / Company Name'); return; }
        if (!subject?.trim()) { alert('Please enter a Subject for the quotation'); return; }
        if (items.length === 0) { alert('Please add at least one item to the quotation'); return; }

        const qNo = getNextQuotationNo();

        const doc = await generateQuotationPDF({
            customerName,
            customerAddress,
            customerGstin,
            subject,
            date: new Date().toISOString(),
            items: items.map(item => ({ ...item, vehicleType })),
            gstEnabled,
            quotationNo: qNo,
            terms: selectedTerms
        }, {
            ...settings,
            vehicleNumber: 'N/A',
            signatureUrl: settings.signatureUrl,
            userId: user?.id,
            bankName: settings.bankName,
            accountNumber: settings.accountNumber,
            ifscCode: settings.ifscCode,
            holderName: settings.holderName,
            upiId: settings.upiId
        });

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
        setShowPreview(true);
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

        const qNo = getNextQuotationNo();

        const newQuote: SavedQuotation = {
            id: Date.now().toString(),
            quotationNo: qNo,
            customerName,
            subject,
            date: new Date().toISOString(),
            items: items.map(item => ({ ...item, vehicleType })),
            vehicleType,
            gstEnabled,
            terms: selectedTerms
        };

        onSaveQuotation(newQuote);

        await shareQuotation({
            customerName,
            customerAddress,
            customerGstin,
            subject,
            date: newQuote.date,
            items: newQuote.items,
            gstEnabled,
            quotationNo: qNo,
            terms: selectedTerms
        }, {
            ...settings,
            vehicleNumber: 'N/A',
            signatureUrl: settings.signatureUrl,
            userId: user?.id,
            bankName: settings.bankName,
            accountNumber: settings.accountNumber,
            ifscCode: settings.ifscCode,
            holderName: settings.holderName,
            upiId: settings.upiId
        });

        // Clear draft after successful creation
        setCustomerName('');
        setCustomerAddress('');
        setCustomerGstin('');
        setSubject('');
        setVehicleType('Sedan');
        setItems([]);
        localStorage.removeItem('draft-q-name');
        localStorage.removeItem('draft-q-address');
        localStorage.removeItem('draft-q-gstin');
        localStorage.removeItem('draft-q-subject');
        localStorage.removeItem('draft-q-vehicle');
        localStorage.removeItem('draft-q-items');
        localStorage.removeItem('draft-q-gst');
        // Save to History
        if (customerName) saveToHistory('customer_name', customerName);
        if (customerAddress) saveToHistory('customer_address', customerAddress);
        if (customerGstin) saveToHistory('customer_gstin', customerGstin);
        if (subject) saveToHistory('quotation_subject', subject);
        items.forEach(i => { if (i.description) saveToHistory('item_description', i.description); });

        // Update local history state
        setHistory({
            names: getHistory('customer_name'),
            addresses: getHistory('customer_address'),
            gstins: getHistory('customer_gstin'),
            subjects: getHistory('quotation_subject'),
            descriptions: getHistory('item_description')
        });

        setShowPreview(false);
    };

    return (
        <div className="space-y-2 pb-24">
            {/* Page Title */}
            <div className="px-2 py-1 text-center relative">
                <h2 className="text-lg font-black uppercase tracking-wide text-slate-800 underline decoration-4 decoration-[#6366F1] underline-offset-4">QUOTATION</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-slate-600 text-[10px] font-medium">Create formal quotations</p>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-[#6366F1] text-[8px] font-black rounded uppercase border border-blue-100 mt-1">v2.1</span>
                </div>

                {/* Emergency Refresh for Cache issues */}
                <button
                    onClick={() => window.location.reload()}
                    className="absolute right-2 top-2 p-2 text-slate-400 hover:text-blue-600 active:rotate-180 transition-all duration-500"
                    title="Refresh App"
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 space-y-2">
                <div className="space-y-2">
                    <div className="space-y-2 mb-2">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Guest / Company Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    onBlur={(e) => setCustomerName(toTitleCase(e.target.value))}
                                    className="tn-input h-10 pl-8 text-xs font-bold bg-white border-slate-200 focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                                    placeholder="Enter Client Name"
                                    list="q-history-names"
                                />
                                <datalist id="q-history-names">
                                    {history.names.map(name => <option key={name} value={name} />)}
                                </datalist>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <MapPin size={10} className="text-red-500" /> Client Address
                                </label>
                                <input
                                    type="text"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    onBlur={(e) => setCustomerAddress(formatAddress(e.target.value))}
                                    className="tn-input h-10 text-xs font-bold bg-white border-slate-200"
                                    placeholder="City, State"
                                    list="q-history-addresses"
                                />
                                <datalist id="q-history-addresses">
                                    {history.addresses.map(addr => <option key={addr} value={addr} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <Landmark size={10} className="text-blue-500" /> Client GSTIN (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={customerGstin}
                                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                                    className="tn-input h-10 text-xs font-bold bg-white border-slate-200"
                                    placeholder="33XXXXX0000X1ZX"
                                    maxLength={15}
                                    list="q-history-gstins"
                                />
                                <datalist id="q-history-gstins">
                                    {history.gstins.map(gst => <option key={gst} value={gst} />)}
                                </datalist>
                            </div>
                        </div>
                    </div>



                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            onBlur={(e) => setSubject(toTitleCase(e.target.value))}
                            className="tn-input h-8 text-xs font-bold bg-slate-50 border-slate-200"
                            placeholder="e.g. Airport Transfer"
                            list="q-history-subjects"
                        />
                        <datalist id="q-history-subjects">
                            {history.subjects.map(s => <option key={s} value={s} />)}
                        </datalist>
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

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <Plus size={12} className="text-blue-600" />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Quick Fill</span>
                        </div>
                        <button
                            onClick={() => applyTemplate('day_rental')}
                            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            DAY RENTAL (₹4000)
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Include 5% GST</span>
                        <button
                            onClick={() => setGstEnabled(!gstEnabled)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${gstEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${gstEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
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
                                            onBlur={(e) => updateItem(index, 'description', toTitleCase(e.target.value))}
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

                {/* Terms and Conditions Selection */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select Terms</h4>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{selectedTerms.length} Selected</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {DEFAULT_TERMS.map((term, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => toggleTerm(`• ${term}`)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[8.5px] font-bold transition-all text-left max-w-full ${selectedTerms.includes(`• ${term}`)
                                    ? 'bg-blue-50 border-blue-200 text-[#0047AB]'
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                {term.length > 50 ? term.substring(0, 50) + '...' : term}
                            </button>
                        ))}
                    </div>

                    {/* Custom Terms List */}
                    {selectedTerms.filter(t => !DEFAULT_TERMS.some(dt => `• ${dt}` === t)).length > 0 && (
                        <div className="space-y-1.5 mt-2 text-left">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Custom Terms</p>
                            {selectedTerms.map((t, i) => {
                                if (DEFAULT_TERMS.some(dt => `• ${dt}` === t)) return null;
                                return (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg group">
                                        <p className="flex-1 text-[9px] font-bold text-slate-600 leading-tight">{t.replace('• ', '')}</p>
                                        <button
                                            type="button"
                                            onClick={() => removeTerm(i)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Custom Term Input */}
                    <div className="flex gap-2 pb-2">
                        <input
                            type="text"
                            value={customTerm}
                            onChange={(e) => setCustomTerm(e.target.value)}
                            placeholder="Add custom policy..."
                            className="flex-1 tn-input h-8 text-[11px] font-bold"
                            onKeyPress={(e) => e.key === 'Enter' && addCustomTerm()}
                        />
                        <button
                            type="button"
                            onClick={addCustomTerm}
                            className="px-3 bg-blue-50 border border-blue-100 text-[#0047AB] rounded-lg hover:bg-blue-100 transition-all font-black text-[10px]"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                <div className="pt-1 flex gap-2">
                    <button
                        onClick={handlePreview}
                        disabled={!customerName || items.length === 0}
                        className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <Eye size={16} />
                        Preview
                    </button>
                    <button
                        onClick={handleShareQuote}
                        disabled={!customerName || items.length === 0}
                        className="flex-[2] bg-[#6366F1] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <Send size={16} />
                        Share Quote
                    </button>
                </div>

                <PDFPreviewModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    pdfUrl={previewPdfUrl || ''}
                    onShare={handleShareQuote}
                    title="Quotation Preview"
                />
            </div>


        </div>
    );
};

export default QuotationForm;
