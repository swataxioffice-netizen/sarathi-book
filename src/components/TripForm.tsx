import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { calculateFare } from '../utils/fare';
import type { Trip } from '../utils/fare';
import { shareReceipt } from '../utils/pdf';
import { Clock, Navigation, Save, Share2, ChevronDown, ChevronUp, MapPin, Hash, FileText } from 'lucide-react';
import { validateGSTIN } from '../utils/validation';

interface TripFormProps {
    onSaveTrip: (trip: Trip) => void;
    onStatusChange?: (isOngoing: boolean) => void;
}

const TripForm: React.FC<TripFormProps> = ({ onSaveTrip }) => {
    const { settings, currentVehicle } = useSettings();
    const [customerName, setCustomerName] = useState('');
    const [customerGst, setCustomerGst] = useState('');
    const [startKm, setStartKm] = useState<number>(0);
    const [endKm, setEndKm] = useState<number>(0);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
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
    const [showAdditional, setShowAdditional] = useState(false);

    // Package details
    const [packageName, setPackageName] = useState('');
    const [numPersons, setNumPersons] = useState<number>(1);
    const [packagePrice, setPackagePrice] = useState<number>(0);

    useEffect(() => {
        if (customerGst.trim().length === 15 && validateGSTIN(customerGst)) {
            setLocalGst(true);
        } else {
            setLocalGst(false);
        }
    }, [customerGst]);

    useEffect(() => {
        if (mode === 'outstation' && fromLoc) {
            setToLoc(fromLoc);
        }
    }, [mode, fromLoc]);

    const captureTime = (type: 'start' | 'end') => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        if (type === 'start') setStartTime(timeStr);
        else setEndTime(timeStr);
    };

    const handleCalculate = () => {
        const res = calculateFare({
            startKm, endKm, baseFare: settings.baseFare, ratePerKm: settings.ratePerKm, toll, parking,
            gstEnabled: localGst, mode, hourlyRate: settings.hourlyRate,
            durationHours: mode === 'hourly' ? startKm : 0,
            nightBata: nightBata ? settings.nightBata : 0,
            waitingHours, isHillStation, petCharge,
            packagePrice: mode === 'package' ? packagePrice : 0,
            actualHours: 0,
            baseKmLimit: 0, baseHourLimit: 0, extraKmRate: 0, extraHourRate: 0
        });
        setResult({ ...res, distance: res.distance ?? (endKm - startKm) });
        setIsCalculated(true);
    };

    const handleSave = () => {
        if (!result) return;
        onSaveTrip({
            id: crypto.randomUUID(),
            customerName: customerName || 'Cash Guest',
            customerGst,
            from: fromLoc, to: toLoc, billingAddress, startKm, endKm, startTime, endTime, toll: tollCharge ? toll : 0, parking: parkingCharge ? parking : 0,
            nightBata: nightBata ? settings.nightBata : 0, baseFare: settings.baseFare, ratePerKm: settings.ratePerKm,
            totalFare: result.total, gst: result.gst, date: new Date().toISOString(), mode,
            durationHours: mode === 'hourly' ? startKm : undefined,
            hourlyRate: mode === 'hourly' ? settings.hourlyRate : undefined,
            notes: notes || '',
            waitingHours,
            waitingCharges: result.waitingCharges,
            hillStationCharges: result.hillStationCharges,
            petCharges: result.petCharges,
            packageName: mode === 'package' ? packageName : undefined,
            numberOfPersons: mode === 'package' ? numPersons : undefined,
            packagePrice: mode === 'package' ? packagePrice : undefined
        });
        setCustomerName(''); setCustomerGst(''); setBillingAddress(''); setFromLoc(''); setToLoc(''); setNotes(''); setStartKm(0); setEndKm(0); setToll(0); setParking(0); setWaitingHours(0); setNightBata(false); setIsHillStation(false); setPetCharge(false); setTollCharge(false); setParkingCharge(false); setWaitingCharge(false); setIsCalculated(false); setResult(null);
        setPackageName(''); setNumPersons(1); setPackagePrice(0);
    };

    return (
        <div className="space-y-4 pb-32">
            {/* Service Selection - Compact */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex shadow-sm">
                {[
                    { id: 'drop', label: 'ONE WAY' },
                    { id: 'outstation', label: 'ROUND TRIP' },
                    { id: 'hourly', label: 'RENTAL' },
                    { id: 'package', label: 'PACKAGE' }
                ].map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={`flex-1 py-3 px-1 text-[10px] font-black tracking-wider border-r last:border-r-0 transition-all ${mode === m.id ? 'bg-[#0047AB] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Trip Details Form - Dense */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
                {/* Customer Section */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(_) => setCustomerName(_.target.value)}
                            className="tn-input h-10 bg-slate-50 border-slate-200 text-xs font-bold"
                            placeholder="Customer Name"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Address</label>
                        <textarea
                            value={billingAddress}
                            onChange={(_) => setBillingAddress(_.target.value)}
                            className="tn-input min-h-[60px] resize-none bg-slate-50 border-slate-200 text-xs font-bold pt-2 active:ring-0"
                            placeholder="Address (Optional)"
                        />
                    </div>

                    <div className="grid grid-cols-[1fr,auto] gap-3 items-end">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number</label>
                            <input
                                type="text"
                                value={customerGst}
                                onChange={(_) => setCustomerGst(_.target.value.toUpperCase())}
                                className={`tn-input h-10 bg-slate-50 border-slate-200 text-xs font-bold uppercase ${customerGst && !validateGSTIN(customerGst) ? 'border-red-300 ring-1 ring-red-100' : ''}`}
                                placeholder="GSTIN (Optional)"
                                maxLength={15}
                            />
                        </div>
                        <button
                            disabled={!customerGst || !validateGSTIN(customerGst)}
                            onClick={() => setLocalGst(!localGst)}
                            className={`h-10 px-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 border ${localGst ? 'bg-[#00965E] text-white border-[#00965E]' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                        >
                            {localGst ? <Navigation size={12} fill="white" /> : <div className="w-2.5 h-2.5 border-2 border-slate-300 rounded-full" />}
                            {localGst ? 'GST ON' : 'GST OFF'}
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Locations Section */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From</label>
                        <input
                            type="text"
                            value={fromLoc}
                            onChange={(_) => setFromLoc(_.target.value)}
                            className="tn-input h-10 bg-slate-50 border-slate-200 text-xs font-bold"
                            placeholder="Pickup"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To</label>
                        <input
                            type="text"
                            value={toLoc}
                            onChange={(_) => setToLoc(_.target.value)}
                            className={`tn-input h-10 bg-slate-50 border-slate-200 text-xs font-bold ${mode === 'outstation' ? 'text-[#0047AB]' : ''}`}
                            placeholder="Drop"
                            readOnly={mode === 'outstation'}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Route / Notes</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={(_) => setNotes(_.target.value)}
                        className="tn-input h-10 bg-slate-50 border-slate-200 text-xs font-bold"
                        placeholder="Details"
                    />
                </div>

                {/* Meter and Time Section - Compact */}
                {mode === 'package' ? (
                    <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-[2fr,1fr] gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Package Name</label>
                                <input type="text" value={packageName} onChange={(_) => setPackageName(_.target.value)} className="tn-input h-10 bg-slate-50 border-slate-200 text-xs font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price</label>
                                <input type="number" value={packagePrice || ''} onChange={(_) => setPackagePrice(Number(_.target.value))} className="tn-input h-10 bg-slate-50 border-slate-200 text-xs font-black text-[#0047AB]" />
                            </div>
                        </div>
                    </div>
                ) : mode === 'hourly' ? (
                    <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Rental Hours</label>
                        <input
                            type="number"
                            value={startKm || ''}
                            onChange={(_) => setStartKm(Number(_.target.value))}
                            className="tn-input h-12 text-center text-3xl font-black text-[#0047AB] bg-slate-50 border-slate-200"
                            placeholder="0"
                        />
                    </div>
                ) : (
                    <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Start */}
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase block text-center">Start KM</label>
                                    <input type="number" value={startKm || ''} onChange={(_) => setStartKm(Number(_.target.value))} className="tn-input h-8 text-center font-black text-sm bg-white border-slate-200" placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase block text-center">Start Time</label>
                                    <div className="flex gap-1">
                                        <input type="text" value={startTime} onChange={(_) => setStartTime(_.target.value)} className="tn-input h-8 text-center font-bold text-xs bg-white border-slate-200 flex-1" placeholder="00:00" />
                                        <button onClick={() => captureTime('start')} className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50"><Clock size={14} /></button>
                                    </div>
                                </div>
                            </div>
                            {/* End */}
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase block text-center">End KM</label>
                                    <input type="number" value={endKm || ''} onChange={(_) => setEndKm(Number(_.target.value))} className="tn-input h-8 text-center font-black text-sm bg-white border-slate-200" placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase block text-center">End Time</label>
                                    <div className="flex gap-1">
                                        <input type="text" value={endTime} onChange={(_) => setEndTime(_.target.value)} className="tn-input h-8 text-center font-bold text-xs bg-white border-slate-200 flex-1" placeholder="00:00" />
                                        <button onClick={() => captureTime('end')} className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50"><Clock size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Charges - Compact */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button onClick={() => setShowAdditional(!showAdditional)} className="w-full flex items-center justify-between px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-[#0047AB] uppercase tracking-widest transition-all">
                        <span>Additional Charges</span>
                        {showAdditional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showAdditional && (
                        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {[
                                { id: 'batta', label: 'Batta', active: nightBata, toggle: () => setNightBata(!nightBata), value: settings.nightBata, isPreset: true },
                                { id: 'hills', label: 'Hills', active: isHillStation, toggle: () => setIsHillStation(!isHillStation), value: 300, isPreset: true },
                                { id: 'toll', label: 'Toll', active: tollCharge, toggle: () => setTollCharge(!tollCharge), value: toll, setValue: setToll, isPreset: false },
                                { id: 'parking', label: 'Parking', active: parkingCharge, toggle: () => setParkingCharge(!parkingCharge), value: parking, setValue: setParking, isPreset: false },
                                { id: 'waiting', label: 'Wait Hrs', active: waitingCharge, toggle: () => setWaitingCharge(!waitingCharge), value: waitingHours, setValue: setWaitingHours, isPreset: false },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-slate-200 last:border-0">
                                    <div className="flex-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wide ${item.active ? 'text-[#0047AB]' : 'text-slate-400'}`}>{item.label}</span>
                                    </div>
                                    <button onClick={item.toggle} className={`w-8 h-4 rounded-full relative transition-all ${item.active ? 'bg-[#00965E]' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-md transition-all ${item.active ? 'left-4.5' : 'left-0.5'}`} />
                                    </button>
                                    <div className="w-16">
                                        <input type="number" value={item.value || ''} onChange={(e) => item.setValue?.(Number(e.target.value))} disabled={!item.active} readOnly={item.isPreset} className={`tn-input h-7 w-full text-center text-xs font-bold p-0 ${item.active ? 'bg-white border-slate-300' : 'bg-transparent border-transparent'}`} placeholder="0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={handleCalculate} className="w-full bg-[#0047AB] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all">
                    <FileText size={16} fill="white" /> Generate Invoice
                </button>
            </div>

            {/* Fare Results - Compact */}
            {isCalculated && result && (
                <div className="bg-slate-900 text-white rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Invoice Total</p>
                        <div className="text-4xl font-black tabular-nums tracking-tight text-blue-400">₹{Math.round(result.total).toLocaleString()}</div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{result.distance} KM</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleSave} className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-white/10 transition-all">
                            <Save size={16} /> Save
                        </button>
                        <button
                            onClick={() => shareReceipt({ ...result, id: '', customerName, customerGst, from: fromLoc, to: toLoc, notes, billingAddress, startKm, endKm, startTime, endTime, toll: tollCharge ? toll : 0, parking: parkingCharge ? parking : 0, nightBata: nightBata ? settings.nightBata : 0, baseFare: settings.baseFare, ratePerKm: settings.ratePerKm, totalFare: result.total, gst: result.gst, date: new Date().toISOString(), mode, waitingHours, waitingCharges: result.waitingCharges, hillStationCharges: result.hillStationCharges, petCharges: result.petCharges, packageName: mode === 'package' ? packageName : undefined, numberOfPersons: mode === 'package' ? numPersons : undefined, packagePrice: mode === 'package' ? packagePrice : undefined }, { ...settings, vehicleNumber: currentVehicle?.number || 'N/A' })}
                            className="bg-[#0047AB] hover:bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            <Share2 size={16} /> PDF
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripForm;
