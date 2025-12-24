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
        <div className="space-y-6 pb-32">
            {/* Service Selection */}
            <div className="bg-white border-2 border-[#0047AB]/10 rounded-2xl overflow-hidden flex shadow-md">
                {[
                    { id: 'drop', label: 'ONE WAY' },
                    { id: 'outstation', label: 'ROUND TRIP' },
                    { id: 'hourly', label: 'RENTAL' },
                    { id: 'package', label: 'PACKAGE' }
                ].map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={`flex-1 py-4 px-2 text-[11px] font-black tracking-wider border-r last:border-r-0 transition-all ${mode === m.id ? 'bg-[#0047AB] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Trip Details Form */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-blue-900/5 p-5 space-y-5">
                {/* Customer Section */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">Customer Name</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(_) => setCustomerName(_.target.value)}
                            className="tn-input"
                            placeholder="Enter Customer Name"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">Billing Address</label>
                        <div className="relative">
                            <MapPin size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                            <textarea
                                value={billingAddress}
                                onChange={(_) => setBillingAddress(_.target.value)}
                                className="tn-input min-h-[100px] pl-11 pt-3 resize-none"
                                placeholder="Full Billing Address"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">GST Number</label>
                            <div className="relative">
                                <Hash size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={customerGst}
                                    onChange={(_) => setCustomerGst(_.target.value.toUpperCase())}
                                    className={`tn-input pl-11 ${customerGst && !validateGSTIN(customerGst) ? 'border-red-300 ring-red-100' : ''}`}
                                    placeholder="Optional GSTIN"
                                    maxLength={15}
                                />
                            </div>
                        </div>
                        <button
                            disabled={!customerGst || !validateGSTIN(customerGst)}
                            onClick={() => setLocalGst(!localGst)}
                            className={`h-11 px-4 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 border-2 ${localGst ? 'bg-[#00965E] text-white border-[#00965E]' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                        >
                            {localGst ? <Navigation size={14} fill="white" /> : <div className="w-3 h-3 border-2 border-slate-300 rounded-full" />}
                            GST {localGst ? 'INCLUDED' : 'OMITTED'}
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Locations Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">From</label>
                        <input
                            type="text"
                            value={fromLoc}
                            onChange={(_) => setFromLoc(_.target.value)}
                            className="tn-input"
                            placeholder="Pickup"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">To</label>
                        <input
                            type="text"
                            value={toLoc}
                            onChange={(_) => setToLoc(_.target.value)}
                            className={`tn-input ${mode === 'outstation' ? 'text-[#0047AB] font-bold' : ''}`}
                            placeholder="Destination"
                            readOnly={mode === 'outstation'}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">Via / Trip Details</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={(_) => setNotes(_.target.value)}
                        className="tn-input"
                        placeholder="Route or additional notes"
                    />
                </div>

                {/* Meter and Time Section */}
                {mode === 'package' ? (
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">Package Name</label>
                            <input
                                type="text"
                                value={packageName}
                                onChange={(_) => setPackageName(_.target.value)}
                                className="tn-input"
                                placeholder="e.g. Madurai 2 Days Tour"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">Persons</label>
                                <input
                                    type="number"
                                    value={numPersons}
                                    onChange={(_) => setNumPersons(Number(_.target.value))}
                                    className="tn-input"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70">Total Price</label>
                                <input
                                    type="number"
                                    value={packagePrice || ''}
                                    onChange={(_) => setPackagePrice(Number(_.target.value))}
                                    className="tn-input font-black text-[#0047AB]"
                                    placeholder="₹ 0"
                                />
                            </div>
                        </div>
                    </div>
                ) : mode === 'hourly' ? (
                    <div className="space-y-1.5 pt-2">
                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest opacity-70 block text-center">Rental Hours</label>
                        <input
                            type="number"
                            value={startKm || ''}
                            onChange={(_) => setStartKm(Number(_.target.value))}
                            className="tn-input h-14 text-center text-3xl font-black text-[#0047AB]"
                            placeholder="0"
                        />
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        {/* Start KM and Time side by side as requested */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest opacity-60 text-center block">Start KM</label>
                                <input
                                    type="number"
                                    value={startKm || ''}
                                    onChange={(_) => setStartKm(Number(_.target.value))}
                                    className="tn-input text-center font-black"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest opacity-60 text-center block">Start Time</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={startTime}
                                        onChange={(_) => setStartTime(_.target.value)}
                                        className="tn-input text-center font-black flex-1"
                                        placeholder="00:00"
                                    />
                                    <button onClick={() => captureTime('start')} className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shadow-sm active:bg-slate-50">
                                        <Clock size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* End KM and Time side by side */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest opacity-60 text-center block">End KM</label>
                                <input
                                    type="number"
                                    value={endKm || ''}
                                    onChange={(_) => setEndKm(Number(_.target.value))}
                                    className="tn-input text-center font-black"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest opacity-60 text-center block">End Time</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={endTime}
                                        onChange={(_) => setEndTime(_.target.value)}
                                        className="tn-input text-center font-black flex-1"
                                        placeholder="00:00"
                                    />
                                    <button onClick={() => captureTime('end')} className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shadow-sm active:bg-slate-50">
                                        <Clock size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Charges Section */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={() => setShowAdditional(!showAdditional)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-black text-[#0047AB] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
                    >
                        <span>Manage Additional Charges</span>
                        {showAdditional ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showAdditional && (
                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-fade-in shadow-inner">
                            {[
                                { id: 'batta', label: 'DRIVER BATTA', active: nightBata, toggle: () => setNightBata(!nightBata), value: settings.nightBata, isPreset: true },
                                { id: 'hills', label: 'HILL STATION', active: isHillStation, toggle: () => setIsHillStation(!isHillStation), value: 300, isPreset: true },
                                { id: 'pets', label: 'PET CHARGES', active: petCharge, toggle: () => setPetCharge(!petCharge), value: 400, isPreset: true },
                                { id: 'toll', label: 'TOLL / FASTAG', active: tollCharge, toggle: () => setTollCharge(!tollCharge), value: toll, setValue: setToll, isPreset: false },
                                { id: 'parking', label: 'PARKING FEE', active: parkingCharge, toggle: () => setParkingCharge(!parkingCharge), value: parking, setValue: setParking, isPreset: false },
                                { id: 'waiting', label: 'WAITING TIME', active: waitingCharge, toggle: () => setWaitingCharge(!waitingCharge), value: waitingHours, setValue: setWaitingHours, isPreset: false },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-slate-200 last:border-0">
                                    <div className="flex-1">
                                        <span className={`text-[12px] font-black uppercase tracking-wider ${item.active ? 'text-[#0047AB]' : 'text-slate-400 opacity-60'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    <button
                                        onClick={item.toggle}
                                        className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${item.active ? 'bg-[#00965E]' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${item.active ? 'left-8' : 'left-1'}`} />
                                    </button>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            value={item.value || ''}
                                            onChange={(e) => item.setValue?.(Number(e.target.value))}
                                            disabled={!item.active}
                                            readOnly={item.isPreset}
                                            className={`tn-input h-10 w-full text-center text-sm font-black transition-all p-0 ${item.active ? 'bg-white border-slate-300 text-slate-900 shadow-sm' : 'bg-slate-100/50 border-transparent text-slate-300 opacity-40'}`}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Primary Action Button */}
                <button
                    onClick={handleCalculate}
                    className="w-full bg-[#0047AB] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-[15px] uppercase tracking-[0.15em] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all"
                >
                    <FileText size={22} fill="white" />
                    GENERATE INVOICE
                </button>
            </div>

            {/* Fare Results Breakdown */}
            {isCalculated && result && (
                <div className="bg-slate-900 text-white rounded-[2rem] p-8 border border-white/10 shadow-2xl animate-fade-in space-y-8">
                    <div className="text-center space-y-3">
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Final Invoice Total</p>
                        <div className="text-6xl font-black tabular-nums tracking-tighter text-blue-400">₹{Math.round(result.total).toLocaleString()}</div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                            <Navigation size={14} className="text-blue-400" />
                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest uppercase">Total Dist: {result.distance} KM</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleSave} className="bg-white/10 hover:bg-white/20 text-white py-5 rounded-2xl font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 border border-white/10 transition-all">
                            <Save size={20} /> SAVE TRIP
                        </button>
                        <button
                            onClick={() => shareReceipt({ ...result, id: '', customerName, customerGst, from: fromLoc, to: toLoc, notes, billingAddress, startKm, endKm, startTime, endTime, toll: tollCharge ? toll : 0, parking: parkingCharge ? parking : 0, nightBata: nightBata ? settings.nightBata : 0, baseFare: settings.baseFare, ratePerKm: settings.ratePerKm, totalFare: result.total, gst: result.gst, date: new Date().toISOString(), mode, waitingHours, waitingCharges: result.waitingCharges, hillStationCharges: result.hillStationCharges, petCharges: result.petCharges, packageName: mode === 'package' ? packageName : undefined, numberOfPersons: mode === 'package' ? numPersons : undefined, packagePrice: mode === 'package' ? packagePrice : undefined }, { ...settings, vehicleNumber: currentVehicle?.number || 'N/A' })}
                            className="bg-[#0047AB] hover:bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all"
                        >
                            <Share2 size={20} /> SHARE PDF
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripForm;
