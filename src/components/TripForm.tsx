import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { calculateFare } from '../utils/fare';
import type { Trip } from '../utils/fare';
import { shareReceipt } from '../utils/pdf';
import { Clock, Navigation, Save, Share2, UserPlus, ArrowLeft, Receipt, Star, History } from 'lucide-react';
import { validateGSTIN } from '../utils/validation';
import { VEHICLES } from '../utils/fare';

interface TripFormProps {
    onSaveTrip: (trip: Trip) => void;
    onStatusChange?: (isOngoing: boolean) => void;
}

const TripForm: React.FC<TripFormProps> = ({ onSaveTrip }) => {
    const { settings, currentVehicle } = useSettings();
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerGst, setCustomerGst] = useState('');
    const [startKm, setStartKm] = useState<number>(0);
    const [endKm, setEndKm] = useState<number>(0);
    const [startTime] = useState('');
    const [endTime] = useState('');
    const [toll, setToll] = useState<number>(0);
    const [parking, setParking] = useState<number>(0);
    const [nightBata, setNightBata] = useState(false);
    const [isCalculated, setIsCalculated] = useState(false);

    const [result, setResult] = useState<{ total: number; gst: number; fare: number; distance: number; waitingCharges: number; hillStationCharges: number; petCharges: number } | null>(null);
    const [notes, setNotes] = useState('');
    const [mode, setMode] = useState<Trip['mode']>('drop');
    const [fromLoc, setFromLoc] = useState('');
    const [toLoc, setToLoc] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [localGst, setLocalGst] = useState(false);

    const [waitingHours, setWaitingHours] = useState<number>(0);
    const [isHillStation, setIsHillStation] = useState(false);
    const [petCharge, setPetCharge] = useState(false);
    const [tollCharge, setTollCharge] = useState(false);
    const [parkingCharge, setParkingCharge] = useState(false);
    const [waitingCharge, setWaitingCharge] = useState(false);

    const [permitCharge, setPermitCharge] = useState(0);
    const [permitActive, setPermitActive] = useState(false);

    // Package details
    const [packageName, setPackageName] = useState('');
    const [numPersons, setNumPersons] = useState<number>(4);
    const [packagePrice, setPackagePrice] = useState<number>(0);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('swift');
    const [days] = useState<number>(1);
    const [customRate, setCustomRate] = useState<number>(14);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    // Helper function to get state name from GSTIN
    const getStateFromGSTIN = (gstin: string): string => {
        if (!gstin || gstin.length < 2) return '';
        const stateCode = gstin.substring(0, 2);
        const stateMap: Record<string, string> = {
            '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
            '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
            '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
            '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
            '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
            '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
            '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra', '28': 'Andhra Pradesh',
            '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
            '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana',
            '37': 'Andhra Pradesh', '38': 'Ladakh'
        };
        return stateMap[stateCode] || '';
    };

    useEffect(() => {
        if (customerGst.trim().length === 15 && validateGSTIN(customerGst)) {
            setLocalGst(true);
            // Auto-fill billing address with state name if address is empty
            if (!billingAddress.trim()) {
                const stateName = getStateFromGSTIN(customerGst);
                if (stateName) {
                    setBillingAddress(stateName);
                }
            }
        } else {
            setLocalGst(false);
        }
    }, [customerGst]);

    useEffect(() => {
        if (mode === 'outstation' && fromLoc) {
            setToLoc(fromLoc);
        }
    }, [mode, fromLoc]);

    useEffect(() => {
        if (numPersons === 12) {
            setSelectedVehicleId('tempo');
        } else if (numPersons === 7) {
            if (!['innova', 'crysta', 'tempo'].includes(selectedVehicleId)) {
                setSelectedVehicleId('innova');
            }
        }
    }, [numPersons]);

    // Auto-suggest rate based on vehicle and mode, but keep it editable
    useEffect(() => {
        const vehicle = VEHICLES.find(v => v.id === selectedVehicleId);
        if (vehicle) {
            const suggestedRate = mode === 'outstation' ? vehicle.roundRate : vehicle.dropRate;
            setCustomRate(suggestedRate);
        }
    }, [selectedVehicleId, mode]);

    const handleImportContact = async () => {
        try {
            // Check if Contact Picker API is available
            if ('contacts' in navigator && 'ContactsManager' in window) {
                const props = ['name', 'tel'];
                const opts = { multiple: false };
                // @ts-ignore - Contact Picker API is not yet in TypeScript definitions
                const contacts = await navigator.contacts.select(props, opts);
                if (contacts && contacts.length > 0) {
                    const contact = contacts[0];
                    if (contact.name && contact.name.length > 0) {
                        setCustomerName(contact.name[0]);
                    }
                    if (contact.tel && contact.tel.length > 0) {
                        setCustomerPhone(contact.tel[0]);
                    }
                }
            } else {
                alert('Contact picker not supported on this device');
            }
        } catch (error) {
            // Contact selection cancelled or failed
        }
    };



    const handleCalculate = () => {
        const activeRate = (mode === 'drop' || mode === 'outstation') ? customRate : settings.ratePerKm;
        // Add permit charge if active
        const permit = permitActive ? permitCharge : 0;
        const res = calculateFare({
            startKm,
            endKm,
            baseFare: settings.baseFare,
            ratePerKm: activeRate,
            toll: tollCharge ? toll : 0,
            parking: parkingCharge ? parking : 0,
            gstEnabled: localGst,
            mode,
            vehicleId: selectedVehicleId,
            hourlyRate: settings.hourlyRate,
            durationHours: mode === 'hourly' ? (endKm - startKm) : 0, // In hourly mode distance is hours in some contexts, but let's be careful
            nightBata: nightBata ? settings.nightBata : 0,
            waitingHours: waitingCharge ? waitingHours : 0,
            isHillStation,
            petCharge,
            packagePrice: (mode === 'package' || mode === 'fixed') ? packagePrice : 0,
            actualHours: 0,
            baseKmLimit: 0,
            baseHourLimit: 0,
            extraKmRate: 0,
            extraHourRate: 0,
            days: mode === 'outstation' ? days : 1
        });
        // Add permit to total and fare
        // Add permit to total and fare
        setResult({ ...res, total: res.total + permit, fare: res.fare + permit, distance: res.distance ?? (endKm - startKm) });
        setIsCalculated(true);

    };

    const handleSave = () => {
        if (!result) return;
        onSaveTrip({
            id: crypto.randomUUID(),
            customerName: customerName || 'Cash Guest',
            customerGst,
            from: fromLoc, to: toLoc, billingAddress, startKm, endKm, startTime, endTime,
            toll: tollCharge ? toll : 0,
            parking: parkingCharge ? parking : 0,
            nightBata: nightBata ? settings.nightBata : 0,
            baseFare: settings.baseFare,
            ratePerKm: settings.ratePerKm,
            totalFare: result.total,
            gst: result.gst,
            date: new Date(invoiceDate).toISOString(),
            mode,
            durationHours: mode === 'hourly' ? startKm : undefined,
            hourlyRate: mode === 'hourly' ? settings.hourlyRate : undefined,
            notes: notes || '',
            waitingHours,
            waitingCharges: result.waitingCharges,
            hillStationCharges: result.hillStationCharges,
            petCharges: result.petCharges,
            packageName: mode === 'package' ? packageName : undefined,
            numberOfPersons: mode === 'package' ? numPersons : undefined,
            packagePrice: mode === 'package' ? packagePrice : undefined,
            permit: permitActive ? permitCharge : 0
        });
        setCustomerName(''); setCustomerPhone(''); setCustomerGst(''); setBillingAddress(''); setFromLoc(''); setToLoc(''); setNotes(''); setStartKm(0); setEndKm(0); setToll(0); setParking(0); setWaitingHours(0); setNightBata(false); setIsHillStation(false); setPetCharge(false); setTollCharge(false); setParkingCharge(false); setWaitingCharge(false); setPermitActive(false); setPermitCharge(0); setIsCalculated(false); setResult(null);
        setPackageName(''); setNumPersons(1); setPackagePrice(0);
        setInvoiceDate(new Date().toISOString().split('T')[0]);
    };

    const handleClear = () => {
        setCustomerName(''); setCustomerPhone(''); setCustomerGst(''); setBillingAddress(''); setFromLoc(''); setToLoc(''); setNotes(''); setStartKm(0); setEndKm(0); setToll(0); setParking(0); setWaitingHours(0); setNightBata(false); setIsHillStation(false); setPetCharge(false); setTollCharge(false); setParkingCharge(false); setWaitingCharge(false); setIsCalculated(false); setResult(null);
        setPackageName(''); setNumPersons(1); setPackagePrice(0);
        setInvoiceDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <div className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-300 ${s <= currentStep ? (s === currentStep ? 'w-8 bg-blue-600' : 'w-4 bg-blue-400') : 'w-4 bg-slate-200'
                                }`}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Step {currentStep} of {totalSteps}</span>
            </div>

            <div className="tn-card overflow-hidden">
                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Choose Service</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">What kind of trip is this?</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'drop', label: 'One Way Drop', desc: 'Point to point travel', icon: Navigation },
                                { id: 'outstation', label: 'Round Trip', desc: 'Multi-day outstation', icon: History },
                                { id: 'hourly', label: 'Local Hourly', desc: 'City rental by hours', icon: Clock },
                                { id: 'package', label: 'Tour Package', desc: 'Fixed rate packages', icon: Star },
                                { id: 'fixed', label: 'Fixed Price', desc: 'Pre-negotiated rate', icon: Receipt }
                            ].map((s) => {
                                const Icon = s.icon;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => { setMode(s.id as any); nextStep(); }}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${mode === s.id ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-xl ${mode === s.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-xs font-black uppercase tracking-wider ${mode === s.id ? 'text-blue-900' : 'text-slate-900'}`}>{s.label}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">{s.desc}</p>
                                        </div>
                                        {mode === s.id && (
                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'dashboard' }))}
                            className="w-full py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Back to Dashboard
                        </button>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Trip Details</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Enter route and timing</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="tn-label">Pickup Location</label>
                                <div className="relative">
                                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        className="tn-input pl-11"
                                        placeholder="e.g. Chennai Airport"
                                        value={fromLoc}
                                        onChange={(e) => setFromLoc(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="tn-label">Destination</label>
                                <div className="relative">
                                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16} />
                                    <input
                                        type="text"
                                        className="tn-input pl-11"
                                        placeholder="e.g. Pondicherry"
                                        value={toLoc}
                                        onChange={(e) => setToLoc(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="tn-label">Start KM</label>
                                <input
                                    type="number"
                                    className="tn-input"
                                    value={startKm || ''}
                                    onChange={(e) => setStartKm(Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="tn-label">End KM</label>
                                <input
                                    type="number"
                                    className="tn-input"
                                    value={endKm || ''}
                                    onChange={(e) => setEndKm(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={prevStep} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-2xl">Back</button>
                            <button onClick={nextStep} className="flex-[2] tn-button-primary">Continue</button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Additional Charges</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Tolls, parking, and extras</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'tollCharge', label: 'Toll Fees', state: tollCharge, setState: setTollCharge, input: toll, setInput: setToll },
                                { id: 'parkingCharge', label: 'Parking Fees', state: parkingCharge, setState: setParkingCharge, input: parking, setInput: setParking },
                                { id: 'waitingCharge', label: 'Waiting Time', state: waitingCharge, setState: setWaitingCharge, input: waitingHours, setInput: setWaitingHours, unit: 'Hrs' },
                                { id: 'permitActive', label: 'Permit Charge', state: permitActive, setState: setPermitActive, input: permitCharge, setInput: setPermitCharge }
                            ].map((item) => (
                                <div key={item.id} className={`p-4 rounded-2xl border-2 transition-all ${item.state ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-slate-50 border-transparent'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.state ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                                                <Receipt size={18} />
                                            </div>
                                            <span className={`text-[13px] font-black uppercase tracking-wider ${item.state ? 'text-blue-900' : 'text-slate-900'}`}>{item.label}</span>
                                        </div>
                                        <button
                                            onClick={() => item.setState(!item.state)}
                                            className={`w-12 h-6 rounded-full transition-all relative ${item.state ? 'bg-blue-600' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.state ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    {item.state && (
                                        <div className="mt-4 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                            <span className="text-[11px] font-black text-blue-900 opacity-60">AMOUNT:</span>
                                            <input
                                                type="number"
                                                className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold w-full outline-none focus:ring-2 focus:ring-blue-600/20"
                                                placeholder={`Enter ${item.unit || 'amount'}...`}
                                                value={item.input || ''}
                                                onChange={(e) => item.setInput(Number(e.target.value))}
                                            />
                                            {item.unit && <span className="text-[11px] font-black text-blue-900">{item.unit}</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={prevStep} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-2xl">Back</button>
                            <button onClick={nextStep} className="flex-[2] tn-button-primary">Continue</button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Passenger Info</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">For PDF invoice generation</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="tn-label">Customer Name</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        className="tn-input pl-11"
                                        placeholder="Guest Name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                    <button
                                        onClick={handleImportContact}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-50 text-blue-600 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                                    >
                                        Import
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="tn-label">Vehicle Details</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {VEHICLES.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVehicleId(v.id)}
                                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedVehicleId === v.id ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{v.name}</span>
                                            <span className="text-[11px] font-bold">₹{mode === 'outstation' ? v.roundRate : v.dropRate}/KM</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="tn-label">Rate/KM (Editable)</label>
                                    <input
                                        type="number"
                                        className="tn-input"
                                        value={customRate || ''}
                                        onChange={(e) => setCustomRate(Number(e.target.value))}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={() => setNightBata(!nightBata)}
                                        className={`w-full py-3 rounded-xl border-2 font-black text-[11px] uppercase tracking-wider transition-all h-12 flex items-center justify-center gap-2 ${nightBata ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                    >
                                        <Clock size={14} />
                                        Night Bat{nightBata ? 'ta' : 'ta'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={prevStep} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-2xl">Back</button>
                            <button
                                onClick={() => { handleCalculate(); nextStep(); }}
                                className="flex-[2] tn-button-primary"
                            >
                                Calculate Fare
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {isCalculated && result && (
                            <div className="space-y-6">
                                <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                                    {/* Glassmorphism Effect */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -mr-10 -mt-10" />

                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Final Amount</p>
                                        <h4 className="text-5xl font-black mb-1">₹{result.total.toLocaleString()}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Includes Distance & All Taxes</p>

                                        <div className="w-full h-px bg-white/10 my-6" />

                                        <div className="grid grid-cols-3 w-full gap-4">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Distance</p>
                                                <p className="text-sm font-bold text-white">{result.distance} KM</p>
                                            </div>
                                            <div className="text-center border-x border-white/10">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fare</p>
                                                <p className="text-sm font-bold text-white">₹{result.fare}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">GST (5%)</p>
                                                <p className="text-sm font-bold text-white">₹{result.gst}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={handleSave} className="tn-button-primary w-full bg-[#0047AB] hover:bg-blue-700 h-16 rounded-2xl shadow-lg border-b-4 border-blue-900 active:border-b-0 active:translate-y-1">
                                        <Save size={20} />
                                        <span>Save Invoice</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!result) return;
                                            const tripData: any = {
                                                id: crypto.randomUUID(),
                                                customerName: customerName || 'Valued Customer',
                                                customerPhone,
                                                customerGst,
                                                from: fromLoc,
                                                to: toLoc,
                                                date: new Date(invoiceDate).toISOString(),
                                                mode,
                                                totalFare: result.total,
                                                fare: result.fare,
                                                gst: result.gst,
                                                startKm,
                                                endKm,
                                                waitingCharges: result.waitingCharges,
                                                waitingHours,
                                                hillStationCharges: result.hillStationCharges,
                                                petCharges: result.petCharges,
                                                permit: permitActive ? permitCharge : 0,
                                                ratePerKm: customRate
                                            };
                                            shareReceipt(tripData, {
                                                companyName: settings.companyName,
                                                companyAddress: settings.companyAddress,
                                                driverPhone: settings.driverPhone,
                                                gstin: settings.gstin,
                                                vehicleNumber: currentVehicle?.number || '',
                                                gstEnabled: localGst
                                            });
                                        }}
                                        className="w-full py-4 rounded-2xl border-2 border-slate-200 font-black text-[11px] uppercase tracking-widest text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50"
                                    >
                                        <Share2 size={16} />
                                        Share Quote
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={prevStep} className="w-full py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-xl">Back</button>
                                        <button
                                            onClick={() => {
                                                setCurrentStep(1);
                                                handleClear();
                                            }}
                                            className="w-full py-4 font-bold text-red-400 uppercase tracking-widest text-[11px] border-2 border-red-50 rounded-xl"
                                        >
                                            Start Over
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>


        </div>
    );
};

// @ts-ignore
function ChevronRight({ size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
    );
}

export default TripForm;
