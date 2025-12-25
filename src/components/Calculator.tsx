import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Calculator as CalcIcon, MapPin, Calendar, Users, Car, Clock, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';

type TripType = 'oneway' | 'roundtrip' | 'airport';

interface Vehicle {
    id: string;
    name: string;
    dropRate: number;
    roundRate: number;
    seats: number;
    type: 'Sedan' | 'SUV' | 'Van';
    image?: string;
}

// Rates as per Tariff Chart
const VEHICLES: Vehicle[] = [
    { id: 'swift', name: 'Swift Dzire', dropRate: 14, roundRate: 13, seats: 4, type: 'Sedan' },
    { id: 'etios', name: 'Toyota Etios', dropRate: 14, roundRate: 13, seats: 4, type: 'Sedan' },
    { id: 'innova', name: 'Innova', dropRate: 19, roundRate: 18, seats: 7, type: 'SUV' },
    { id: 'crysta', name: 'Innova Crysta', dropRate: 22, roundRate: 20, seats: 7, type: 'SUV' }, // Assumed slight premium
    { id: 'tempo', name: 'Tempo Traveller', dropRate: 28, roundRate: 28, seats: 12, type: 'Van' }
];

const Calculator: React.FC = () => {
    const { settings } = useSettings();
    const [tripType, setTripType] = useState<TripType>('oneway');
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [distance, setDistance] = useState<string>('');
    const [passengers, setPassengers] = useState<number>(4);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('swift');
    const [date, setDate] = useState('');
    const [days, setDays] = useState<string>('1');
    const [result, setResult] = useState<{
        fare: number;
        distance: number;
        duration: string;
        details: string;
    } | null>(null);

    // Auto-select vehicle based on passengers
    useEffect(() => {
        if (passengers > 7) setSelectedVehicle('tempo');
        else if (passengers > 4 && selectedVehicle !== 'innova' && selectedVehicle !== 'crysta') setSelectedVehicle('innova');
    }, [passengers]);

    const calculateFare = () => {
        const inputDist = parseFloat(distance);
        const dayCount = parseInt(days) || 1;
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);

        if (!inputDist || !vehicle) return;

        let totalFare = 0;
        let totalDist = 0;
        let details = '';

        if (tripType === 'oneway' || tripType === 'airport') {
            // DROP TRIP LOGIC (Per Tariff Chart & Invoice Logic)
            // Min Chargeable Distance: 130 KM
            const effectiveDist = Math.max(130, inputDist);
            const rate = vehicle.dropRate;

            // Driver Bata: ₹400 standard, ₹600 if > 400km
            const bata = inputDist > 400 ? 600 : 400;

            totalFare = (effectiveDist * rate) + bata;
            totalDist = effectiveDist;

            details = `Base Rate: ₹${rate}/km\nMin. Km: 130 | Actual: ${inputDist} | Charged: ${effectiveDist}\nDriver Bata: ₹${bata}`;
        } else {
            // ROUND TRIP LOGIC
            // Distance: Input is One Way, so Actual = Input * 2
            const actualRoundTripKm = inputDist * 2;

            // Min Chargeable: 250 KM per Day
            const minKm = dayCount * 250;
            const chargeableKm = Math.max(actualRoundTripKm, minKm);

            const rate = vehicle.roundRate;

            // Driver Bata: ₹300 per day (Standard for Round Trip)
            // Note: Chart mentions ₹600 if > 500km single day, but simple calc uses daily rate
            const bata = dayCount * 300;

            totalFare = (chargeableKm * rate) + bata;
            totalDist = chargeableKm; // Showing chargeable distance as primary

            details = `Base Rate: ₹${rate}/km\nMin. Km: ${minKm} (${dayCount} days × 250)\nActual: ${actualRoundTripKm} | Charged: ${chargeableKm}\nDriver Bata: ₹300 × ${dayCount} = ₹${bata}`;
        }

        // Round to nearest 10
        totalFare = Math.ceil(totalFare / 10) * 10;

        setResult({
            fare: totalFare,
            distance: totalDist,
            duration: tripType === 'roundtrip' ? `${dayCount} Days` : `${(inputDist / 50).toFixed(1)} hrs approx`,
            details
        });
    };

    const handleWhatsAppBook = () => {
        if (!result) return;
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);

        const message = `*New Booking Request*%0A` +
            `Type: ${tripType === 'roundtrip' ? 'Round Trip' : 'One Way'}%0A` +
            `Vehicle: ${vehicle?.name}%0A` +
            `Route: ${pickup} to ${drop}%0A` +
            `Date: ${date}%0A` +
            `Distance: ${distance} km (${tripType === 'oneway' ? 'One way input' : 'One way input'})%0A` +
            `Est. Fare: ₹${result.fare}`;

        const phone = settings.driverPhone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone || '919000000000'}?text=${message}`, '_blank');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <div className="bg-[#0047AB] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-wide">Fare Calculator</h2>
                    <p className="text-blue-100 text-xs font-medium mt-1">Updates Rates & Rules Applied</p>
                </div>
            </div>

            {/* Calculator Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">

                {/* Trip Type Tabs */}
                <div className="flex p-1 bg-slate-50 rounded-xl mb-6">
                    {(['oneway', 'roundtrip', 'airport'] as TripType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => { setTripType(type); setResult(null); }}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${tripType === type
                                    ? 'bg-white text-[#0047AB] shadow-sm ring-1 ring-slate-100'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {type === 'oneway' ? 'One Way' : type === 'roundtrip' ? 'Round Trip' : 'Airport'}
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Locations */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><MapPin size={10} /> Pickup Location</label>
                            <input type="text" value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Enter City/Area" className="tn-input w-full bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><MapPin size={10} /> Drop Location</label>
                            <input type="text" value={drop} onChange={e => setDrop(e.target.value)} placeholder="Enter Destination" className="tn-input w-full bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><AlertCircle size={10} /> Distance (One Way Km)</label>
                            <input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="e.g. 350" className="tn-input w-full bg-slate-50 border-slate-200" />
                        </div>
                    </div>

                    {/* Vehicle & Dates */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Users size={10} /> Passengers</label>
                                <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} className="tn-input w-full bg-slate-50 border-slate-200">
                                    <option value={4}>4 People</option>
                                    <option value={6}>6 People</option>
                                    <option value={7}>7 People</option>
                                    <option value={12}>12+ People</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Calendar size={10} /> Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="tn-input w-full bg-slate-50 border-slate-200 text-xs" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Car size={10} /> Preferred Vehicle</label>
                            <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="tn-input w-full bg-slate-50 border-slate-200">
                                {VEHICLES.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.name} ({tripType === 'roundtrip' ? `₹${v.roundRate}` : `₹${v.dropRate}`}/km)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {tripType === 'roundtrip' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Clock size={10} /> Duration (Days)</label>
                                <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" className="tn-input w-full bg-slate-50 border-slate-200" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={calculateFare}
                        disabled={!distance}
                        className="w-full py-4 bg-[#0047AB] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Calculate Estimate
                    </button>
                </div>
            </div>

            {/* Result Section */}
            {result && (
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start border-b border-white/10 pb-6 mb-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimated Fare</p>
                                <h3 className="text-4xl font-black mt-2 text-[#4ade80]">₹{result.fare.toLocaleString()}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billed Distance</p>
                                <p className="text-xl font-bold mt-1">{result.distance} km</p>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                <CheckCircle2 size={12} /> Rate Calculation Breakdown
                            </p>
                            <pre className="mt-3 font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">{result.details}</pre>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Vehicle</p>
                                <p className="font-bold text-sm mt-1">{VEHICLES.find(v => v.id === selectedVehicle)?.name}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Duration</p>
                                <p className="font-bold text-sm mt-1">{result.duration}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-8 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                            <AlertCircle size={16} />
                            <p className="text-[10px] font-bold uppercase tracking-wide">Excludes Toll, Parking & Permit Charges</p>
                        </div>

                        <button
                            onClick={handleWhatsAppBook}
                            className="w-full py-4 bg-[#25D366] hover:bg-[#128c7e] text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-green-900/20"
                        >
                            <MessageCircle size={20} />
                            Book via WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calculator;
