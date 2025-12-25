import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { MapPin, Calendar, Users, Car, Clock, CheckCircle2, MessageCircle, AlertCircle, UserCheck, Truck, Hash } from 'lucide-react';

// --- Shared Types & Constants ---
interface Vehicle {
    id: string;
    name: string;
    dropRate: number;
    roundRate: number;
    seats: number;
    type: 'Sedan' | 'SUV' | 'Van';
}

const VEHICLES: Vehicle[] = [
    { id: 'swift', name: 'Swift Dzire', dropRate: 14, roundRate: 13, seats: 4, type: 'Sedan' },
    { id: 'etios', name: 'Toyota Etios', dropRate: 14, roundRate: 13, seats: 4, type: 'Sedan' },
    { id: 'innova', name: 'Innova', dropRate: 19, roundRate: 18, seats: 7, type: 'SUV' },
    { id: 'crysta', name: 'Innova Crysta', dropRate: 22, roundRate: 20, seats: 7, type: 'SUV' },
    { id: 'tempo', name: 'Tempo Traveller', dropRate: 28, roundRate: 28, seats: 12, type: 'Van' }
];

// --- 1. Cab Calculator Component ---
const CabCalculator: React.FC = () => {
    const { settings } = useSettings();
    const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'airport'>('oneway');
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [distance, setDistance] = useState<string>('');
    const [passengers, setPassengers] = useState<number>(4);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('swift');
    const [customRate, setCustomRate] = useState<number>(14);
    const [date, setDate] = useState('');
    const [days, setDays] = useState<string>('1');
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (passengers > 7) setSelectedVehicle('tempo');
        else if (passengers > 4 && !['innova', 'crysta'].includes(selectedVehicle)) setSelectedVehicle('innova');
    }, [passengers]);

    useEffect(() => {
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
        if (vehicle) {
            setCustomRate(tripType === 'roundtrip' ? vehicle.roundRate : vehicle.dropRate);
        }
    }, [selectedVehicle, tripType]);

    const calculate = () => {
        const dist = parseFloat(distance) || 0;
        const dayCount = parseInt(days) || 1;
        if (!dist) return;

        let totalFare = 0, totalDist = 0, details = '';

        if (tripType === 'roundtrip') {
            const actual = dist * 2;
            const min = dayCount * 250;
            const charged = Math.max(actual, min);
            const bata = dayCount * 300;
            totalFare = (charged * customRate) + bata;
            totalDist = charged;
            details = `Base Rate: ₹${customRate}/km\nMin: ${min}km | Charged: ${charged}km\nBata: ₹${bata}`;
        } else {
            const effective = Math.max(130, dist);
            const bata = dist > 400 ? 600 : 400;
            totalFare = (effective * customRate) + bata;
            totalDist = effective;
            details = `Base Rate: ₹${customRate}/km\nMin: 130km | Charged: ${effective}km\nBata: ₹${bata}`;
        }

        setResult({
            fare: Math.ceil(totalFare / 10) * 10,
            distance: totalDist,
            duration: tripType === 'roundtrip' ? `${dayCount} Days` : `${(dist / 50).toFixed(1)} hrs`,
            details
        });
    };

    const book = () => {
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
        const msg = `*New Cab Quote*%0AType: ${tripType}%0AVehicle: ${vehicle?.name}%0ARoute: ${pickup} to ${drop}%0ADist: ${distance} km%0AFare: ₹${result.fare}`;
        const phone = settings?.driverPhone?.replace(/[^0-9]/g, '') || '919000000000';
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="flex p-1 bg-slate-50 rounded-xl">
                {['oneway', 'roundtrip'].map((t: any) => (
                    <button key={t} onClick={() => setTripType(t)} className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${tripType === t ? 'bg-white text-[#0047AB] shadow-sm' : 'text-slate-400'}`}>
                        {t === 'oneway' ? 'One Way / Drop' : 'Round Trip'}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Pickup City" icon={<MapPin size={10} />} value={pickup} onChange={setPickup} />
                    <Input label="Drop City" icon={<MapPin size={10} />} value={drop} onChange={setDrop} />
                </div>
                <Input label="Distance (Km)" icon={<AlertCircle size={10} />} value={distance} onChange={setDistance} type="number" />

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label icon={<Users size={10} />} text="Passengers" />
                        <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                            {[4, 7, 12].map(n => <option key={n} value={n}>{n} Seats</option>)}
                        </select>
                    </div>
                    <Input label="Travel Date" icon={<Calendar size={10} />} value={date} onChange={setDate} type="date" />
                </div>

                <div className="grid grid-cols-[2fr,1fr] gap-3">
                    <div className="space-y-1">
                        <Label icon={<Car size={10} />} text="Vehicle" />
                        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                            {VEHICLES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <Input label="Rate/Km" icon={<Hash size={10} />} value={customRate} onChange={setCustomRate} type="number" highlight />
                </div>

                {tripType === 'roundtrip' && <Input label="Duration (Days)" icon={<Clock size={10} />} value={days} onChange={setDays} type="number" />}
            </div>

            <Button onClick={calculate} disabled={!distance} text="Estimate Cab Fare" />
            {result && <ResultCard title="Cab Estimate" amount={result.fare} details={result.details} sub={tripType === 'roundtrip' ? 'Excl. Tolls' : 'Excl. Tolls'} onBook={book} />}
        </div>
    );
};

// --- 2. Acting Driver Calculator ---
const ActingDriverCalculator: React.FC = () => {
    const { settings } = useSettings();
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [days, setDays] = useState('1');
    const [bata, setBata] = useState(1000);
    const [returnCharge, setReturnCharge] = useState(500);
    const [stayProvided, setStayProvided] = useState(false);
    const [allowance, setAllowance] = useState(300);
    const [result, setResult] = useState<any>(null);

    const calculate = () => {
        const d = parseInt(days) || 1;
        const total = (bata * d) + (stayProvided ? 0 : (allowance * d)) + returnCharge;
        const details = `Bata: ₹${bata} × ${d}\nAllowance: ${stayProvided ? 'Provided' : `₹${allowance} × ${d}`}\nReturn: ₹${returnCharge}`;
        setResult({ fare: total, details });
    };

    const book = () => {
        const msg = `*Book Acting Driver*%0ARoute: ${pickup} to ${drop}%0ADuration: ${days} Days%0AStay Provided: ${stayProvided}%0ACost: ₹${result.fare}`;
        const phone = settings?.driverPhone?.replace(/[^0-9]/g, '') || '919000000000';
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Pickup" icon={<MapPin size={10} />} value={pickup} onChange={setPickup} />
                    <Input label="Drop" icon={<MapPin size={10} />} value={drop} onChange={setDrop} />
                </div>
                <Input label="Duration (Days)" icon={<Clock size={10} />} value={days} onChange={setDays} type="number" />

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex gap-3">
                        <Input label="Daily Bata (₹)" icon={<UserCheck size={10} />} value={bata} onChange={setBata} type="number" highlight />
                        <Input label="Return Charge (₹)" icon={<Truck size={10} />} value={returnCharge} onChange={setReturnCharge} type="number" highlight />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer pt-1">
                        <div onClick={() => setStayProvided(!stayProvided)} className={`w-4 h-4 rounded border flex items-center justify-center ${stayProvided ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                            {stayProvided && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">Driver Stay Provided?</span>
                    </label>
                </div>
            </div>
            <Button onClick={calculate} disabled={!days} text="Estimate Driver Cost" />
            {result && <ResultCard title="Driver Cost" amount={result.fare} details={result.details} sub="Food & Stay Extra if not provided" onBook={book} />}
        </div>
    );
};

// --- 3. Relocation Calculator ---
const RelocationCalculator: React.FC = () => {
    const { settings } = useSettings();
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [distance, setDistance] = useState('');
    const [rate, setRate] = useState(5);
    const [returnCharge, setReturnCharge] = useState(500);
    const [result, setResult] = useState<any>(null);

    const calculate = () => {
        const dist = parseFloat(distance) || 0;
        const total = (dist * rate) + returnCharge;
        const details = `Service: ${dist}km × ₹${rate}\nReturn Ticket: ₹${returnCharge}`;
        setResult({ fare: total, details });
    };

    const book = () => {
        const msg = `*Vehicle Relocation Quote*%0ARoute: ${pickup} to ${drop}%0ADist: ${distance} km%0AEstd. Cost: ₹${result.fare}`;
        const phone = settings?.driverPhone?.replace(/[^0-9]/g, '') || '919000000000';
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Input label="From City" icon={<MapPin size={10} />} value={pickup} onChange={setPickup} />
                    <Input label="To City" icon={<MapPin size={10} />} value={drop} onChange={setDrop} />
                </div>
                <Input label="Distance (Km)" icon={<AlertCircle size={10} />} value={distance} onChange={setDistance} type="number" />

                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <Input label="Service Rate/Km" icon={<Truck size={10} />} value={rate} onChange={setRate} type="number" highlight />
                    <Input label="Return Ticket" icon={<Truck size={10} />} value={returnCharge} onChange={setReturnCharge} type="number" highlight />
                </div>
            </div>
            <Button onClick={calculate} disabled={!distance} text="Get Relocation Quote" />
            {result && <ResultCard title="Relocation Cost" amount={result.fare} details={result.details} sub="Fuel & Tolls Extra" onBook={book} />}
        </div>
    );
};

// --- Helper Components ---
const Input = ({ label, icon, value, onChange, type = 'text', highlight = false }: any) => (
    <div className="space-y-1 w-full">
        <Label icon={icon} text={label} />
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs ${highlight ? 'font-black text-[#0047AB]' : ''}`} />
    </div>
);

const Label = ({ icon, text }: any) => (
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">{icon} {text}</label>
);

const Button = ({ onClick, disabled, text }: any) => (
    <button onClick={onClick} disabled={disabled} className="w-full py-4 bg-[#0047AB] text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-[10px]">
        {text}
    </button>
);

const ResultCard = ({ title, amount, details, sub, onBook }: any) => (
    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -mr-8 -mt-8"></div>
        <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                <span className="text-2xl font-black text-[#4ade80]">₹{amount.toLocaleString()}</span>
            </div>
            <pre className="font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed bg-white/5 p-3 rounded-xl">{details}</pre>
            <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-2 rounded-lg">
                <AlertCircle size={12} /> <span className="text-[9px] font-bold uppercase">{sub}</span>
            </div>
            <button onClick={onBook} className="w-full py-3 bg-[#25D366] hover:bg-[#128c7e] text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg text-[10px]">
                <MessageCircle size={16} /> Book via WhatsApp
            </button>
        </div>
    </div>
);

// --- Main Container ---
const Calculator: React.FC = () => {
    const [mode, setMode] = useState<'cab' | 'driver' | 'relocation'>('cab');

    return (
        <div className="max-w-3xl mx-auto pb-24 space-y-4">
            <div className="bg-[#0047AB] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-black uppercase tracking-wide">Estimator</h2>
                    <p className="text-blue-100 text-[10px] font-medium mt-1">Select a service to calculate cost</p>
                </div>
            </div>

            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1 overflow-x-auto">
                {[
                    { id: 'cab', label: 'Cab Booking', icon: Car },
                    { id: 'driver', label: 'Acting Driver', icon: UserCheck },
                    { id: 'relocation', label: 'Car Relocation', icon: Truck },
                ].map((m: any) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex-1 min-w-[90px] py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${mode === m.id ? 'bg-[#0047AB] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <m.icon size={18} />
                        <span className="text-[9px] font-black uppercase tracking-wider">{m.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                {mode === 'cab' && <CabCalculator />}
                {mode === 'driver' && <ActingDriverCalculator />}
                {mode === 'relocation' && <RelocationCalculator />}
            </div>
        </div>
    );
};

export default Calculator;
