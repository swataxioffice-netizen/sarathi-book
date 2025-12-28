import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { calculateFare } from '../utils/fare';
import type { Trip } from '../utils/fare';
import { shareReceipt } from '../utils/pdf';
import { Clock, Navigation, Save, UserPlus, ArrowLeft, Receipt, Star, History, MapPin, Camera, Mic, MessageCircle } from 'lucide-react';
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

    const [permitCharge, setPermitCharge] = useState(0);

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
                // @ts-ignore
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

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Attempt reverse geocoding (using a free service like Nominatim - strictly for client-side convenience)
                // Note: In production, consider a more robust API or handle rate limits.
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.display_name) {
                        // Extract a shorter name if possible, or use full
                        setFromLoc(data.display_name.split(',').slice(0, 3).join(', '));
                        return;
                    }
                }
                setFromLoc(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            } catch (e) {
                setFromLoc(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
        }, () => {
            alert('Unable to retrieve your location');
        });
    };

    // Voice Input Helper (Simple implementation using Web Speech API if available)
    const startListening = (setField: (val: string) => void) => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US'; // Default to English, could be made dynamic
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.start();

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setField(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
            };
        } else {
            alert('Voice input not supported in this browser.');
        }
    };



    const handleCalculate = () => {
        const activeRate = (mode === 'drop' || mode === 'outstation') ? customRate : settings.ratePerKm;
        const permit = permitCharge; // Use value directly
        const res = calculateFare({
            startKm,
            endKm,
            baseFare: settings.baseFare,
            ratePerKm: activeRate,
            toll: toll, // Use value directly
            parking: parking, // Use value directly
            gstEnabled: localGst,
            mode,
            vehicleId: selectedVehicleId,
            hourlyRate: settings.hourlyRate,
            durationHours: mode === 'hourly' ? (endKm - startKm) : 0,
            nightBata: nightBata ? settings.nightBata : 0,
            waitingHours: waitingHours, // Use value directly
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
            toll: toll,
            parking: parking,
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
            permit: permitCharge
        });
        setCustomerName(''); setCustomerPhone(''); setCustomerGst(''); setBillingAddress(''); setFromLoc(''); setToLoc(''); setNotes(''); setStartKm(0); setEndKm(0); setToll(0); setParking(0); setWaitingHours(0); setNightBata(false); setIsHillStation(false); setPetCharge(false); setPermitCharge(0); setIsCalculated(false); setResult(null);
        setPackageName(''); setNumPersons(1); setPackagePrice(0);
        setInvoiceDate(new Date().toISOString().split('T')[0]);
    };

    const handleClear = () => {
        setCustomerName(''); setCustomerPhone(''); setCustomerGst(''); setBillingAddress(''); setFromLoc(''); setToLoc(''); setNotes(''); setStartKm(0); setEndKm(0); setToll(0); setParking(0); setWaitingHours(0); setNightBata(false); setIsHillStation(false); setPetCharge(false); setPermitCharge(0); setIsCalculated(false); setResult(null);
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
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        className="tn-input pl-11 pr-20 transition-all focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="e.g. Chennai Airport"
                                        value={fromLoc}
                                        onChange={(e) => setFromLoc(e.target.value)}
                                    />
                                    {/* Action Buttons */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button
                                            onClick={() => startListening(setFromLoc)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Voice Input"
                                        >
                                            <Mic size={16} />
                                        </button>
                                        <button
                                            onClick={handleCurrentLocation}
                                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                                            title="Current Location"
                                        >
                                            <MapPin size={14} className="fill-current" />
                                            <span className="text-[9px] font-black uppercase">GPS</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="tn-label">Destination</label>
                                <div className="relative">
                                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16} />
                                    <input
                                        type="text"
                                        className="tn-input pl-11 pr-10"
                                        placeholder="e.g. Pondicherry"
                                        value={toLoc}
                                        onChange={(e) => setToLoc(e.target.value)}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <button
                                            onClick={() => startListening(setToLoc)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Mic size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="tn-label flex items-center justify-between">
                                    Start KM
                                    <label className="text-[9px] text-blue-600 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100">
                                        <Camera size={10} /> Photo
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => alert('Photo attached!')} />
                                    </label>
                                </label>
                                <input
                                    type="number"
                                    className="tn-input"
                                    value={startKm || ''}
                                    onChange={(e) => setStartKm(Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="tn-label flex items-center justify-between">
                                    End KM
                                    <label className="text-[9px] text-blue-600 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100">
                                        <Camera size={10} /> Photo
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => alert('Photo attached!')} />
                                    </label>
                                </label>
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
                            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-2">
                                <p className="text-[10px] text-blue-700 font-medium text-center">
                                    💡 Tip: Enter 0 to disable a charge. Values {'>'} 0 are automatically added.
                                </p>
                            </div>

                            {[
                                { id: 'toll', label: 'Toll Fees', input: toll, setInput: setToll },
                                { id: 'parking', label: 'Parking Fees', input: parking, setInput: setParking },
                                { id: 'waiting', label: 'Waiting Time', input: waitingHours, setInput: setWaitingHours, unit: 'Hrs' },
                                { id: 'permit', label: 'Permit Charge', input: permitCharge, setInput: setPermitCharge }
                            ].map((item) => (
                                <div key={item.id} className={`p-4 rounded-2xl border-2 transition-all ${Number(item.input) > 0 ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${Number(item.input) > 0 ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                <Receipt size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[13px] font-black uppercase tracking-wider ${Number(item.input) > 0 ? 'text-blue-900' : 'text-slate-900'}`}>{item.label}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{Number(item.input) > 0 ? 'Active' : 'Not Added'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {Number(item.input) > 0 && <span className="text-[11px] font-black text-blue-900 opacity-60">₹</span>}
                                            <input
                                                type="number"
                                                className={`tn-input w-24 text-right font-black ${Number(item.input) > 0 ? 'text-blue-900 bg-white border-blue-200' : 'text-slate-400 bg-slate-50 border-transparent'}`}
                                                placeholder="0"
                                                value={item.input || ''}
                                                onChange={(e) => item.setInput(Number(e.target.value))}
                                                onFocus={(e) => e.target.select()}
                                            />
                                            {item.unit && <span className="text-[10px] font-bold text-slate-400 w-6">{item.unit}</span>}
                                        </div>
                                    </div>
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
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-50 text-blue-600 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center gap-1"
                                    >
                                        <UserPlus size={14} /> Pick Contact
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
                                <div className="flex items-end h-full pb-1">
                                    <label className={`w-full py-3 px-4 rounded-xl border-2 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between ${nightBata ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={nightBata}
                                                onChange={() => setNightBata(!nightBata)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Night Batta</span>
                                        </div>
                                        <span>₹{settings.nightBata}</span>
                                    </label>
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
                                                permit: permitCharge,
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
                                        className="w-full py-4 rounded-2xl border-2 border-[#25D366] bg-[#25D366]/5 font-black text-[11px] uppercase tracking-widest text-[#25D366] flex items-center justify-center gap-2 hover:bg-[#25D366]/10"
                                    >
                                        <MessageCircle size={18} />
                                        Share on WhatsApp
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
