import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Calculator as CalcIcon, MapPin, Calendar, Users, Car, Clock, CheckCircle2, MessageCircle, AlertCircle, Hash, UserCheck, Truck, BedDouble } from 'lucide-react';

type TripType = 'oneway' | 'roundtrip' | 'airport' | 'acting_driver' | 'relocation';

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
    { id: 'crysta', name: 'Innova Crysta', dropRate: 22, roundRate: 20, seats: 7, type: 'SUV' },
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
    const [customRate, setCustomRate] = useState<number>(14);
    const [date, setDate] = useState('');
    const [days, setDays] = useState<string>('1');
    const [result, setResult] = useState<{
        fare: number;
        distance: number;
        duration: string;
        details: string;
    } | null>(null);

    // Acting Driver / Relocation specific states
    const [driverStayProvided, setDriverStayProvided] = useState(false);
    const [actingBata, setActingBata] = useState<number>(1000); // Daily Driver Fee
    const [actingStayOption, setActingStayOption] = useState<number>(300); // Stay Allowance
    const [returnCharge, setReturnCharge] = useState<number>(500); // Bus/Train ticket

    // Auto-select vehicle based on passengers
    useEffect(() => {
        if (passengers > 7) setSelectedVehicle('tempo');
        else if (passengers > 4 && selectedVehicle !== 'innova' && selectedVehicle !== 'crysta') setSelectedVehicle('innova');
    }, [passengers]);

    // Update rate when vehicle or trip type changes (Only for Cabs)
    useEffect(() => {
        if (['acting_driver', 'relocation'].includes(tripType)) return;

        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
        if (vehicle) {
            const rate = (tripType === 'oneway' || tripType === 'airport') ? vehicle.dropRate : vehicle.roundRate;
            setCustomRate(rate);
        }
    }, [selectedVehicle, tripType]);

    const calculateFare = () => {
        const inputDist = parseFloat(distance) || 0;
        const dayCount = parseInt(days) || 1;
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);

        let totalFare = 0;
        let totalDist = 0;
        let details = '';

        if (tripType === 'acting_driver') {
            // Acting Driver Logic
            // Cost = (Bata + Stay) * Days + ReturnCharge (if One Way... assume Return charge applies for Drop or just general travel?)
            // Assuming simplified logic: Cost = (DailyFee * Days) + (ProvidedStay ? 0 : StayAllowance * Days)
            // Plus Return Charge for the driver to get back/to location

            const stayCost = driverStayProvided ? 0 : (actingStayOption * dayCount);
            const driverCost = actingBata * dayCount;

            totalFare = driverCost + stayCost + returnCharge;

            details = `Driver Bata: ₹${actingBata} × ${dayCount} days = ₹${driverCost}\n` +
                `Stay/Food Allowance: ${driverStayProvided ? 'Provided by Customer' : `₹${actingStayOption} × ${dayCount} days = ₹${stayCost}`}\n` +
                `Return Travel Allowance: ₹${returnCharge}`;

            totalDist = 0; // Not distance based usually, or irrelevant for calculation

        } else if (tripType === 'relocation') {
            // Relocation Quote Logic
            // Usually Distance Based Service Charge
            // Cost = (Distance * RatePerKm) + ReturnTravel
            // Rate per km for driving someone's car is usually lower, e.g., ₹3-5/km

            // Using customRate input for this (defaulting to say 5)
            // Or use specific Relocation Rate state? I'll re-use customRate but default it.

            const serviceCharge = inputDist * customRate;
            totalFare = serviceCharge + returnCharge;
            totalDist = inputDist;

            details = `Driving Service: ${inputDist} km × ₹${customRate}/km = ₹${serviceCharge}\n` +
                `Return Travel (Bus/Train): ₹${returnCharge}`;

        } else if (tripType === 'oneway' || tripType === 'airport') {
            if (!inputDist || !vehicle) return;
            // DROP TRIP LOGIC
            const effectiveDist = Math.max(130, inputDist);
            const rate = customRate;
            const bata = inputDist > 400 ? 600 : 400;

            totalFare = (effectiveDist * rate) + bata;
            totalDist = effectiveDist;
            details = `Base Rate: ₹${rate}/km\nMin. Km: 130 | Actual: ${inputDist} | Charged: ${effectiveDist}\nDriver Bata: ₹${bata}`;

        } else {
            if (!inputDist || !vehicle) return;
            // ROUND TRIP LOGIC
            const actualRoundTripKm = inputDist * 2;
            const minKm = dayCount * 250;
            const chargeableKm = Math.max(actualRoundTripKm, minKm);
            const rate = customRate;
            const bata = dayCount * 300;

            totalFare = (chargeableKm * rate) + bata;
            totalDist = chargeableKm;
            details = `Base Rate: ₹${rate}/km\nMin. Km: ${minKm} (${dayCount} days × 250)\nActual: ${actualRoundTripKm} | Charged: ${chargeableKm}\nDriver Bata: ₹300 × ${dayCount} = ₹${bata}`;
        }

        // Round to nearest 10
        totalFare = Math.ceil(totalFare / 10) * 10;

        setResult({
            fare: totalFare,
            distance: totalDist,
            duration: (tripType === 'roundtrip' || tripType === 'acting_driver') ? `${dayCount} Days` : tripType === 'relocation' ? `${(inputDist / 50).toFixed(1)} hrs` : `${(inputDist / 50).toFixed(1)} hrs`,
            details
        });
    };

    const handleWhatsAppBook = () => {
        if (!result) return;
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);

        let message = `*New Booking Request*%0A`;

        if (tripType === 'acting_driver') {
            message += `Type: Acting Driver Service%0A` +
                `Duration: ${days} Days%0A` +
                `Route: ${pickup} to ${drop}%0A` +
                `Stay Provided: ${driverStayProvided ? 'Yes' : 'No'}%0A` +
                `Est. Cost: ₹${result.fare}`;
        } else if (tripType === 'relocation') {
            message += `Type: Vehicle Relocation%0A` +
                `Route: ${pickup} to ${drop}%0A` +
                `Distance: ${distance} km%0A` +
                `Est. Service Cost: ₹${result.fare}%0A` +
                `(Fuel & Tolls Extra)`;
        } else {
            message += `Type: ${tripType === 'roundtrip' ? 'Round Trip' : 'One Way'}%0A` +
                `Vehicle: ${vehicle?.name}%0A` +
                `Route: ${pickup} to ${drop}%0A` +
                `Distance: ${distance} km%0A` +
                `Rate: ₹${customRate}/km%0A` +
                `Est. Fare: ₹${result.fare}`;
        }

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
                <div className="flex flex-wrap p-1 bg-slate-50 rounded-xl mb-6 gap-1">
                    {(['oneway', 'roundtrip', 'acting_driver', 'relocation'] as TripType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                setTripType(type);
                                setResult(null);
                                if (type === 'relocation') setCustomRate(5); // Default relocation rate
                            }}
                            className={`flex-1 min-w-[30%] py-3 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${tripType === type
                                    ? 'bg-white text-[#0047AB] shadow-sm ring-1 ring-slate-100'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {type === 'oneway' ? 'One Way' :
                                type === 'roundtrip' ? 'Round Trip' :
                                    type === 'acting_driver' ? 'Acting Driver' : 'Relocation'}
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

                        {(tripType !== 'acting_driver') && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><AlertCircle size={10} /> Distance (Km)</label>
                                <input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="e.g. 350" className="tn-input w-full bg-slate-50 border-slate-200" />
                            </div>
                        )}

                        {tripType === 'acting_driver' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Clock size={10} /> Duration (Days)</label>
                                <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" className="tn-input w-full bg-slate-50 border-slate-200" />
                            </div>
                        )}
                    </div>

                    {/* Right Side Inputs Logic based on Type */}
                    <div className="space-y-4">

                        {/* CAB MODES */}
                        {['oneway', 'roundtrip'].includes(tripType) && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Users size={10} /> Passengers</label>
                                        <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} className="tn-input w-full bg-slate-50 border-slate-200">
                                            <option value={4}>4 People</option>
                                            <option value={7}>7 People</option>
                                            <option value={12}>12+ People</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Calendar size={10} /> Date</label>
                                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="tn-input w-full bg-slate-50 border-slate-200 text-xs" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-[2fr,1fr] gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Car size={10} /> Preferred Vehicle</label>
                                        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="tn-input w-full bg-slate-50 border-slate-200">
                                            {VEHICLES.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Hash size={10} /> Rate/Km</label>
                                        <input type="number" value={customRate} onChange={e => setCustomRate(Number(e.target.value))} className="tn-input w-full bg-slate-50 border-slate-200 font-bold text-[#0047AB]" />
                                    </div>
                                </div>

                                {tripType === 'roundtrip' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Clock size={10} /> Duration (Days)</label>
                                        <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" className="tn-input w-full bg-slate-50 border-slate-200" />
                                    </div>
                                )}
                            </>
                        )}

                        {/* ACTING DRIVER MODE */}
                        {tripType === 'acting_driver' && (
                            <>
                                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><UserCheck size={12} /> Daily Fee (Bata)</label>
                                        <input type="number" value={actingBata} onChange={e => setActingBata(Number(e.target.value))} className="tn-input w-24 h-10 text-right font-bold text-[#0047AB]" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Truck size={12} /> Return Travel</label>
                                        <input type="number" value={returnCharge} onChange={e => setReturnCharge(Number(e.target.value))} className="tn-input w-24 h-10 text-right font-bold text-[#0047AB]" />
                                    </div>
                                    <div className="pt-2 border-t border-slate-200">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${driverStayProvided ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`} onClick={() => setDriverStayProvided(!driverStayProvided)}>
                                                {driverStayProvided && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700">I will provide Driver Stay</span>
                                        </label>
                                        <p className="text-[9px] text-slate-400 mt-1 pl-8">If specific accommodation is not provided, a stay allowance of ₹{actingStayOption}/day will be added.</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* RELOCATION MODE */}
                        {tripType === 'relocation' && (
                            <>
                                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Truck size={12} /> Service Cost / Km</label>
                                        <input type="number" value={customRate} onChange={e => setCustomRate(Number(e.target.value))} className="tn-input w-24 h-10 text-right font-bold text-[#0047AB]" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Truck size={12} /> Return Ticket</label>
                                        <input type="number" value={returnCharge} onChange={e => setReturnCharge(Number(e.target.value))} className="tn-input w-24 h-10 text-right font-bold text-[#0047AB]" />
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-bold flex gap-2">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span>Note: Fuel & Tolls are extra. Driver travel cost is reimbursed at actuals.</span>
                                </div>
                            </>
                        )}

                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={calculateFare}
                        disabled={!distance && tripType !== 'acting_driver'}
                        className="w-full py-4 bg-[#0047AB] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Calculate Cost
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
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimated Cost</p>
                                <h3 className="text-4xl font-black mt-2 text-[#4ade80]">₹{result.fare.toLocaleString()}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {tripType === 'acting_driver' ? 'Duration' : 'Distance'}
                                </p>
                                <p className="text-xl font-bold mt-1">
                                    {tripType === 'acting_driver' ? `${days} Days` : `${result.distance} km`}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                <CheckCircle2 size={12} /> Cost Breakdown
                            </p>
                            <pre className="mt-3 font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">{result.details}</pre>
                        </div>

                        {(tripType === 'acting_driver' || tripType === 'relocation') ? (
                            <div className="flex items-center gap-3 mb-8 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                                <AlertCircle size={16} />
                                <p className="text-[10px] font-bold uppercase tracking-wide">
                                    {tripType === 'acting_driver' ? 'Food & Accommodation Extra if not provided.' : 'Fuel & Tolls excluded.'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 mb-8 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                                <AlertCircle size={16} />
                                <p className="text-[10px] font-bold uppercase tracking-wide">Excludes Toll, Parking & Permit Charges</p>
                            </div>
                        )}

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
