import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { shareQuotation, type SavedQuotation, type QuotationItem } from '../utils/pdf';
import { Send, Plus, Trash2, ChevronDown, ChevronUp, Briefcase, Car, MapPin, Sparkles } from 'lucide-react';
import { generateQuotationPDF } from '../utils/pdf';
import PDFPreviewModal from './PDFPreviewModal';
import { saveToHistory, getHistory } from '../utils/history';
import { toTitleCase, formatAddress } from '../utils/stringUtils';
import { useAuth } from '../contexts/AuthContext';

interface QuotationFormProps {
    onSaveQuotation: (q: SavedQuotation) => void;
    quotations?: SavedQuotation[];
    onStepChange?: (step: number) => void;
}

const DEFAULT_TERMS = [
    'Toll, Parking, State Permit and Border Entry Fees are extra as per actual receipts.',
    'Driver Batta/Allowance will be charged extra as applicable.',
    'Night Driving Allowance (10 PM to 6 AM) will be charged extra if applicable.',
    'Starting and Ending KM/Time will be calculated from our office to office.',
    'In case of any significant fuel price hike, the rates will be subject to revision.',
    'This quotation is valid for a period of 15 days from the date of issue.'
];

const QUOTATION_TEMPLATES = [
    { id: 'local', label: 'Local Rental', icon: Car, desc: '8Hr/80KM Pkg', subject: 'Quotation for Local Car Rental', items: [{ description: 'Sedan - 8 Hrs / 80 KM', package: '8h 80km', vehicleType: 'Sedan', rate: '2500', amount: '2500' }, { description: 'Extra KM Charge', package: 'Per KM', vehicleType: 'Any', rate: '14', amount: '' }, { description: 'Extra Hour Charge', package: 'Per Hr', vehicleType: 'Any', rate: '150', amount: '' }] },
    { id: 'outstation', label: 'Outstation', icon: MapPin, desc: 'Round Trip', subject: 'Quotation for Outstation Trip', items: [{ description: 'Sedan - Min 250 KM/Day', package: 'Per KM', vehicleType: 'Sedan', rate: '12', amount: '3000' }, { description: 'Driver Batta', package: 'Per Day', vehicleType: 'Any', rate: '500', amount: '500' }] },
    { id: 'airport', label: 'Airport', icon: Send, desc: 'Pickup/Drop', subject: 'Quotation for Airport Transfer', items: [{ description: 'Airport Drop (City to Airport)', package: 'One Way', vehicleType: 'Sedan', rate: '1200', amount: '1200' }, { description: 'Airport Pickup (Airport to City)', package: 'One Way', vehicleType: 'Sedan', rate: '1300', amount: '1300' }] },
    { id: 'monthly', label: 'Corporate', icon: Briefcase, desc: 'Monthly Cab', subject: 'Quotation for Corporate Monthly Cab', items: [{ description: 'Monthly Cab Service (Sedan)', package: '3000 KM / 300 Hrs', vehicleType: 'Sedan', rate: '45000', amount: '45000' }] },
];



const QuotationForm: React.FC<QuotationFormProps> = ({ onSaveQuotation, quotations = [], onStepChange }) => {
    const { settings } = useSettings();
    const { user } = useAuth();

    // Steps: 1=Type, 2=Items/Pricing, 3=Client, 4=Terms/Preview
    const [currentStep, setCurrentStep] = useState(1);


    // Sync step change to parent
    useEffect(() => {
        onStepChange?.(currentStep);
    }, [currentStep, onStepChange]);

    // Initialize with empty defaults (no draft persistence as per user request)
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerGstin, setCustomerGstin] = useState('');
    const [subject, setSubject] = useState('');

    // Removed global vehicleType state in favor of item-level types
    const [items, setItems] = useState<QuotationItem[]>([]);

    const [gstEnabled, setGstEnabled] = useState(false);
    const [rcmEnabled, setRcmEnabled] = useState(false);
    const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

    // UI States
    const [customTerm, setCustomTerm] = useState('');
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showTerms, setShowTerms] = useState(false); // Collapsible

    // History
    const [history, setHistory] = useState({
        names: getHistory('customer_name'),
        addresses: getHistory('customer_address'),
        gstins: getHistory('customer_gstin'),
        subjects: getHistory('quotation_subject'),
        descriptions: getHistory('item_description')
    });



    const handleAddItem = () => {
        setItems([...items, { description: '', package: '', vehicleType: 'Sedan', rate: '', quantity: 1, amount: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto Calculate Amount
        if (field === 'rate' || field === 'quantity') {
            const rate = parseFloat(newItems[index].rate) || 0;
            const qty = parseFloat(String(newItems[index].quantity)) || 0;
            if (rate > 0 && qty > 0) {
                newItems[index].amount = (rate * qty).toString();
            } else {
                newItems[index].amount = '';
            }
        }

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

    const getNextQuotationNo = () => {
        const dateObj = new Date();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        const prefix = `QT/${mm}${yyyy}/`;

        if (!quotations || quotations.length === 0) {
            return `${prefix}01`;
        }
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
        const qNo = getNextQuotationNo();
        const doc = await generateQuotationPDF({
            customerName,
            customerAddress,
            customerGstin,
            subject,
            date: new Date().toISOString(),
            items: items.map(item => ({ ...item, vehicleType: item.vehicleType || 'Sedan' })),
            gstEnabled,
            rcmEnabled,
            quotationNo: qNo,
            terms: currentStep >= 3 ? selectedTerms : []
        }, { ...settings, vehicleNumber: 'N/A', signatureUrl: settings.signatureUrl, userId: user?.id, bankName: settings.bankName, accountNumber: settings.accountNumber, ifscCode: settings.ifscCode, holderName: settings.holderName, upiId: settings.upiId });
        setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
        setShowPreview(true);
    };

    const handleShareQuote = async () => {
        if (!customerName?.trim()) { alert('Please enter Guest / Company Name'); return; }
        const qNo = getNextQuotationNo();
        const newQuote: SavedQuotation = {
            id: Date.now().toString(),
            quotationNo: qNo,
            customerName, customerAddress, customerGstin, subject,
            date: new Date().toISOString(),
            items: items.map(item => ({ ...item, vehicleType: item.vehicleType || 'Sedan' })),
            vehicleType: 'Sedan',
            gstEnabled, rcmEnabled, terms: selectedTerms
        };
        onSaveQuotation(newQuote);
        await shareQuotation(newQuote, { ...settings, vehicleNumber: 'N/A', signatureUrl: settings.signatureUrl, userId: user?.id, bankName: settings.bankName, accountNumber: settings.accountNumber, ifscCode: settings.ifscCode, holderName: settings.holderName, upiId: settings.upiId });

        // Reset
        setCustomerName(''); setCustomerAddress(''); setCustomerGstin(''); setSubject(''); setItems([]);
        setCurrentStep(1);
        localStorage.removeItem('draft-q-name'); localStorage.removeItem('draft-q-items');

        // Save History
        if (customerName) saveToHistory('customer_name', customerName);
        if (customerAddress) saveToHistory('customer_address', customerAddress);
        if (customerGstin) saveToHistory('customer_gstin', customerGstin);
        if (subject) saveToHistory('quotation_subject', subject);
        // Save description history for all items
        items.forEach(item => { if (item.description) saveToHistory('item_description', item.description); });

        // Update local history
        setHistory({
            names: getHistory('customer_name'),
            addresses: getHistory('customer_address'),
            gstins: getHistory('customer_gstin'),
            subjects: getHistory('quotation_subject'),
            descriptions: getHistory('item_description')
        });

        setShowPreview(false);
    };

    const applyTemplate = (tmpl: typeof QUOTATION_TEMPLATES[0]) => {
        setSubject(tmpl.subject);
        setItems(tmpl.items.map(i => ({ ...i, quantity: 1 }))); // Deep copy to avoid ref issues
    };

    return (

        <div className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= currentStep ? (s === currentStep ? 'w-8 bg-blue-600' : 'w-4 bg-blue-400') : 'w-4 bg-slate-200'}`} />
                    ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Step {currentStep} of 3</span>
            </div>

            <div className="tn-card overflow-hidden">
                {/* STEP 1: CLIENT & SUBJECT */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Quotation Details</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Client Info & Subject</p>
                        </div>

                        <div className="space-y-4">
                            {/* To Address Section */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Briefcase size={12} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To (Client)</span>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Client Name</label>
                                    <input
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        onBlur={(e) => setCustomerName(toTitleCase(e.target.value))}
                                        className="w-full h-10 px-3 text-sm font-bold border border-slate-200 rounded-xl focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] outline-none bg-white"
                                        placeholder="Company / Person Name"
                                        list="q-history-names"
                                    />
                                    <datalist id="q-history-names">{history.names.map(n => <option key={n} value={n} />)}</datalist>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Address</label>
                                    <input
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        onBlur={(e) => setCustomerAddress(formatAddress(e.target.value))}
                                        className="w-full h-10 px-3 text-sm font-bold border border-slate-200 rounded-xl focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] outline-none bg-white"
                                        placeholder="Full Address"
                                        list="q-history-addresses"
                                    />
                                    <datalist id="q-history-addresses">{history.addresses.map(a => <option key={a} value={a} />)}</datalist>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">GSTIN (Optional)</label>
                                    <input
                                        value={customerGstin}
                                        onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                                        className="w-full h-10 px-3 text-sm font-bold border border-slate-200 rounded-xl focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] uppercase outline-none bg-white"
                                        placeholder="GST Number"
                                        maxLength={15}
                                        list="q-history-gstins"
                                    />
                                    <datalist id="q-history-gstins">{history.gstins.map(g => <option key={g} value={g} />)}</datalist>
                                </div>
                            </div>

                            {/* Subject Section */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Subject Line</label>
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full h-12 px-4 text-sm font-bold border border-slate-200 rounded-xl focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] outline-none"
                                    placeholder="e.g. Quotation for Monthly Cab Services"
                                    list="q-history-subjects"
                                />
                                <datalist id="q-history-subjects">{history.subjects.map(s => <option key={s} value={s} />)}</datalist>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setCurrentStep(2)} className="flex-[2] bg-[#0047AB] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all">Next: Add Items</button>
                        </div>
                    </div>
                )}

                {/* STEP 2: COMMERCIALS / ITEMS */}
                {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Commercials</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Edit rates & descriptions</p>
                            </div>
                        </div>

                        {items.length === 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Templates</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {QUOTATION_TEMPLATES.map(t => {
                                        const Icon = t.icon;
                                        return (
                                            <button key={t.id} onClick={() => applyTemplate(t)} className="bg-white border hover:border-blue-500 hover:bg-blue-50 transition-all p-3 rounded-xl text-left flex items-start gap-3 group">
                                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <Icon size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700">{t.label}</p>
                                                    <p className="text-[9px] font-medium text-slate-400">{t.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}



                        <div className="space-y-3">

                            {items.map((item, index) => (
                                <div key={index} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm relative group space-y-3">
                                    <div className="absolute top-3 right-3">
                                        <button onClick={() => handleRemoveItem(index)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={16} /></button>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Description</label>
                                        <input
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            className="w-full font-bold text-xs border-b border-slate-200 pb-1 outline-none focus:border-blue-500 bg-transparent"
                                            placeholder="Details"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Vehicle Class</label>
                                            <select
                                                value={item.vehicleType || 'Sedan'}
                                                onChange={(e) => updateItem(index, 'vehicleType', e.target.value)}
                                                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none"
                                            >
                                                <option value="Sedan">Sedan</option>
                                                <option value="SUV">SUV</option>
                                                <option value="Innova">Innova</option>
                                                <option value="Tempo">Tempo</option>
                                                <option value="Any">Any</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Package Limit</label>
                                            <input value={item.package} onChange={(e) => updateItem(index, 'package', e.target.value)} className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none" placeholder="e.g. 8h 80km" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Rate</label>
                                            <input value={item.rate} onChange={(e) => updateItem(index, 'rate', e.target.value)} className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none" placeholder="Rate" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Qty</label>
                                            <input
                                                type="number"
                                                value={item.quantity || 1}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Amount</label>
                                            <input
                                                value={item.amount}
                                                readOnly
                                                className="w-full text-xs font-black bg-slate-100 border border-slate-200 rounded-lg px-2 py-2 outline-none text-right text-slate-600 cursor-not-allowed"
                                                placeholder="Total"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>


                        <button onClick={handleAddItem} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                            <Plus size={16} /> Add New Row
                        </button>

                        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                            <button onClick={() => setCurrentStep(1)} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">Back</button>
                            <div className="flex-[2] flex gap-2">
                                <button onClick={handlePreview} className="flex-1 bg-white border-2 border-slate-200 text-slate-800 font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-sm hover:bg-slate-50">Preview</button>
                                <button onClick={() => setCurrentStep(3)} className="flex-[2] bg-[#0047AB] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all">Continue</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: TAX, TERMS & REVIEW */}
                {currentStep === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Review & Legal</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Tax Settings & Terms</p>
                        </div>

                        {/* Tax Settings */}
                        <div className="grid grid-cols-2 gap-3">
                            <div onClick={() => setGstEnabled(!gstEnabled)} className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${gstEnabled ? 'bg-green-50 border-green-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${gstEnabled ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}>
                                    {gstEnabled && <span className="text-white text-[8px]">✓</span>}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">GST (5%)</p>
                            </div>
                            <div onClick={() => setRcmEnabled(!rcmEnabled)} className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${rcmEnabled ? 'bg-orange-50 border-orange-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${rcmEnabled ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                                    {rcmEnabled && <span className="text-white text-[8px]">✓</span>}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">RCM Mode</p>
                            </div>
                        </div>

                        {/* Terms */}
                        {/* Terms */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <button onClick={() => setShowTerms(!showTerms)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Terms & Conditions ({selectedTerms.length} Selected)</span>
                                {showTerms ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </button>
                            {showTerms && (
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <div className="space-y-3 mb-4">
                                        {DEFAULT_TERMS.map((term, i) => {

                                            // The toggle function adds '• ' prefix if missing in DEFAULT_TERMS, but DEFAULT_TERMS strings don't have it. 
                                            // Let's standardize: The state `selectedTerms` seems to store strings. 
                                            // The `toggleTerm` function: `toggleTerm('• ' + term)` was used before.
                                            // Let's simplify: Just store the term string. The PDF generation can add bullets if needed, or we store with bullets. 
                                            // Currently `toggleTerm` toggles exact string match.

                                            // Wait, looking at previous code: 
                                            // `toggleTerm('• ' + term)` was called on click.
                                            // But `DEFAULT_TERMS` (line 17) does NOT have bullets.
                                            // So `selectedTerms` has bullets.

                                            return (
                                                <div key={i} onClick={() => toggleTerm(`• ${term}`)} className="flex items-start gap-3 cursor-pointer group">
                                                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${selectedTerms.includes(`• ${term}`) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400 bg-white'}`}>
                                                        {selectedTerms.includes(`• ${term}`) && <span className="text-white text-xs font-bold">✓</span>}
                                                    </div>
                                                    <p className={`text-xs font-medium leading-relaxed ${selectedTerms.includes(`• ${term}`) ? 'text-slate-900' : 'text-slate-500'}`}>
                                                        {term}
                                                    </p>
                                                </div>
                                            );
                                        })}

                                        {/* Show Custom Terms that are in selectedTerms but NOT in DEFAULT_TERMS */}
                                        {selectedTerms.filter(t => !DEFAULT_TERMS.some(dt => t === `• ${dt}` || t === dt)).map((term, i) => (
                                            <div key={`custom-${i}`} onClick={() => toggleTerm(term)} className="flex items-start gap-3 cursor-pointer group">
                                                <div className="mt-0.5 w-5 h-5 rounded-md border-2 border-blue-600 bg-blue-600 flex items-center justify-center shrink-0">
                                                    <span className="text-white text-xs font-bold">✓</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium leading-relaxed text-slate-900">{term.replace(/^•\s*/, '')}</p>
                                                    <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">Custom Term</span>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); toggleTerm(term); }} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-slate-50">
                                        <input
                                            value={customTerm}
                                            onChange={e => setCustomTerm(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addCustomTerm()}
                                            className="flex-1 h-10 px-3 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all placeholder:font-medium"
                                            placeholder="Type a new term and press Enter..."
                                        />
                                        <button onClick={addCustomTerm} className="bg-slate-900 hover:bg-slate-800 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-slate-200"><Plus size={16} /></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-10 blur-2xl"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Estimated Value</p>
                            <h2 className="text-4xl font-black flex items-baseline gap-1">
                                <span className="text-2xl text-slate-400">₹</span>
                                {items.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0).toLocaleString()}
                            </h2>
                            <p className="text-[10px] text-slate-400 mt-4 font-medium border-t border-white/10 pt-3">
                                for {items.length} service items in "{subject}"
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setCurrentStep(2)} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">Back</button>
                            <div className="flex-[2] flex gap-2">
                                <button onClick={handlePreview} className="flex-1 bg-white border-2 border-slate-200 text-slate-800 font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-sm hover:bg-slate-50">Preview</button>
                                <button onClick={handleShareQuote} className="flex-[2] bg-[#0047AB] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    Share <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <PDFPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                pdfUrl={previewPdfUrl || ''}
                onShare={handleShareQuote}
                title="Quotation Preview"
            />
        </div >
    );
};

export default QuotationForm;
