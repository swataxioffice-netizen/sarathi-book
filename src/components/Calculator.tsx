import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { MapPin, Users, Car, Clock, CheckCircle2, MessageCircle, AlertCircle, UserCheck, Truck, Hash } from 'lucide-react';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
import { calculateDistance } from '../utils/googleMaps';

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
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<string>('');
    const [passengers, setPassengers] = useState<number>(4);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('swift');
    const [customRate, setCustomRate] = useState<number>(14);
    const [result, setResult] = useState<any>(null);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const handleMapSelect = (pickupAddr: string, dropAddr: string, dist: number) => {
        setPickup(pickupAddr);
        setDrop(dropAddr);
        setDistance(dist.toString());
    };



    // Auto-calculate distance when both locations are selected via autocomplete
    useEffect(() => {
        const autoCalculateDistance = async () => {
            if (pickupCoords && dropCoords) {
                setCalculatingDistance(true);
                try {
                    const result = await calculateDistance(pickupCoords, dropCoords);
                    if (result) {
                        setDistance(result.distance.toString());
                    }
                } catch (error) {
                    console.error('Error calculating distance:', error);
                } finally {
                    setCalculatingDistance(false);
                }
            }
        };

        autoCalculateDistance();
    }, [pickupCoords, dropCoords]);

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
        const dist = parseFloat(distance);
        if (!dist) return;

        // Detect inter-state travel for permit charges
        const pickupLower = pickup.toLowerCase();
        const dropLower = drop.toLowerCase();
        const isKarnataka = pickupLower.includes('karnataka') || dropLower.includes('karnataka') ||
            pickupLower.includes('bangalore') || dropLower.includes('bangalore') ||
            pickupLower.includes('bengaluru') || dropLower.includes('bengaluru') ||
            pickupLower.includes('mysore') || dropLower.includes('mysore');
        const isKerala = pickupLower.includes('kerala') || dropLower.includes('kerala') ||
            pickupLower.includes('kochi') || dropLower.includes('kochi') ||
            pickupLower.includes('trivandrum') || dropLower.includes('trivandrum');
        const isAndhra = pickupLower.includes('andhra') || dropLower.includes('andhra') ||
            pickupLower.includes('hyderabad') || dropLower.includes('hyderabad') ||
            pickupLower.includes('tirupati') || dropLower.includes('tirupati');
        const isPondicherry = pickupLower.includes('puducherry') || dropLower.includes('puducherry') ||
            pickupLower.includes('pondicherry') || dropLower.includes('pondicherry');

        const isTamilNadu = pickupLower.includes('tamil nadu') || dropLower.includes('tamil nadu') ||
            pickupLower.includes('chennai') || dropLower.includes('chennai') ||
            pickupLower.includes('madurai') || dropLower.includes('madurai') ||
            pickupLower.includes('coimbatore') || dropLower.includes('coimbatore');

        // Determine if inter-state permit needed
        const needsPermit = (isTamilNadu && (isKarnataka || isKerala || isAndhra)) ||
            (isPondicherry && !isTamilNadu);
        const permitCharge = needsPermit ? 800 : 0;
        const permitState = isKarnataka ? 'Karnataka' : isKerala ? 'Kerala' : isAndhra ? 'Andhra Pradesh' : '';

        // Estimate tolls (rough estimate: ₹2-3 per 100 KM)
        const estimatedTolls = Math.ceil(dist / 100) * 250;

        if (tripType === 'roundtrip') {
            // Tamil Nadu Round Trip Logic
            const roundTripDistance = dist * 2;
            const minKmPerDay = 250;
            const daysNeeded = Math.ceil(roundTripDistance / minKmPerDay);
            const minChargeableKm = daysNeeded * minKmPerDay;
            const chargedKm = Math.max(roundTripDistance, minChargeableKm);
            const driverBataPerDay = 400;
            const totalBata = daysNeeded * driverBataPerDay;

            const kmCharge = chargedKm * customRate;
            const tollsRoundTrip = estimatedTolls * 2;
            const subtotal = kmCharge + totalBata + permitCharge;
            const totalFare = subtotal + tollsRoundTrip;

            const details = [
                `🚗 Round Trip: ${dist} KM × 2 = ${roundTripDistance} KM`,
                `📅 Days Required: ${daysNeeded} day(s) @ ${minKmPerDay} KM/day`,
                `📏 Minimum Chargeable: ${minChargeableKm} KM`,
                `💰 Distance Charge: ${chargedKm} KM × ₹${customRate}/KM = ₹${kmCharge.toFixed(0)}`,
                `🍽️ Driver Bata: ${daysNeeded} day(s) × ₹${driverBataPerDay} = ₹${totalBata}`,
                needsPermit ? `📋 ${permitState} Permit: ₹${permitCharge}` : '',
                `🛣️ Toll Estimate (approx): ₹${tollsRoundTrip}`,
                ``,
                `💵 TOTAL FARE: ₹${totalFare.toFixed(0)}`
            ].filter(Boolean);

            setResult({
                fare: totalFare,
                details,
                breakdown: {
                    kmCharge,
                    bata: totalBata,
                    permit: permitCharge,
                    tolls: tollsRoundTrip,
                    days: daysNeeded,
                    chargedKm
                }
            });
        } else {
            // One-Way Trip Logic
            const baseFare = dist * customRate;
            const subtotal = baseFare + permitCharge;
            const totalFare = subtotal + estimatedTolls;

            const details = [
                `🚗 One-Way Trip: ${dist} KM`,
                `💰 Distance Charge: ${dist} KM × ₹${customRate}/KM = ₹${baseFare.toFixed(0)}`,
                needsPermit ? `📋 ${permitState} Permit: ₹${permitCharge}` : '',
                `🛣️ Toll Estimate (approx): ₹${estimatedTolls}`,
                ``,
                `💵 TOTAL FARE: ₹${totalFare.toFixed(0)}`
            ].filter(Boolean);

            setResult({
                fare: totalFare,
                details,
                breakdown: {
                    kmCharge: baseFare,
                    permit: permitCharge,
                    tolls: estimatedTolls
                }
            });
        }
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
                    <PlacesAutocomplete
                        label="Pickup"
                        icon={<MapPin size={10} />}
                        value={pickup}
                        onChange={setPickup}
                        onPlaceSelected={(place) => {
                            setPickup(place.address);
                            setPickupCoords({ lat: place.lat, lng: place.lng });
                        }}
                        onMapClick={() => setShowMap(true)}
                        placeholder="Start typing..."
                    />
                    <PlacesAutocomplete
                        label="Drop"
                        icon={<MapPin size={10} />}
                        value={drop}
                        onChange={setDrop}
                        onPlaceSelected={(place) => {
                            setDrop(place.address);
                            setDropCoords({ lat: place.lat, lng: place.lng });
                        }}
                        onMapClick={() => setShowMap(true)}
                        placeholder="Start typing..."
                    />
                </div>



                <div className="space-y-1">
                    <Label icon={<AlertCircle size={10} />} text="Distance (Km)" />
                    <div className="relative">
                        <input
                            type="number"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs"
                            placeholder={calculatingDistance ? "Calculating..." : "Auto-calculated"}
                            disabled={calculatingDistance}
                        />
                        {calculatingDistance && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <Label icon={<Users size={10} />} text="Passengers" />
                    <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                        {[4, 7, 12].map(n => <option key={n} value={n}>{n} Seats</option>)}
                    </select>
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
            </div>

            <Button onClick={calculate} disabled={!distance} text="Calculate" />
            {result && <ResultCard title="Cab Fare" amount={result.fare} details={result.details} sub="Tolls & Permits Included (Approx)" onBook={book} />}

            {/* Map Picker Modal - for precise location selection */}
            {showMap && (
                <MapPicker
                    onLocationSelect={handleMapSelect}
                    onClose={() => setShowMap(false)}
                />
            )}

        </div>
    );
};

// --- 2. Acting Driver Calculator ---
const ActingDriverCalculator: React.FC = () => {
    const { settings } = useSettings();
    const [serviceType, setServiceType] = useState<'local8' | 'local12' | 'outstation'>('local8');
    const [days, setDays] = useState('1');
    const [stayProvided, setStayProvided] = useState(false);
    const [foodProvided, setFoodProvided] = useState(false);
    const [result, setResult] = useState<any>(null);

    const calculate = () => {
        const numDays = parseInt(days) || 1;

        // Base rates (Tamil Nadu market rates)
        const rates = {
            local8: 800,   // 8 hours / 80 KM per day
            local12: 1200, // 12 hours / 120 KM per day
            outstation: 1000 // Per day (unlimited hours)
        };

        const baseRate = rates[serviceType];
        const driverCharge = baseRate * numDays;

        // Additional charges for outstation
        let bataCharge = 0;
        let accommodationCharge = 0;
        let returnCharge = 0;

        if (serviceType === 'outstation') {
            // Driver bata (food allowance)
            bataCharge = foodProvided ? 0 : (400 * numDays);

            // Accommodation
            accommodationCharge = stayProvided ? 0 : (500 * numDays);

            // Return charges (driver's return journey)
            returnCharge = 500;
        }

        const totalFare = driverCharge + bataCharge + accommodationCharge + returnCharge;

        const details = [
            `👨‍✈️ Service: ${serviceType === 'local8' ? 'Local (8 hrs/80 KM)' : serviceType === 'local12' ? 'Local (12 hrs/120 KM)' : 'Outstation'}`,
            `📅 Duration: ${numDays} day(s)`,
            `💰 Driver Charge: ${numDays} day(s) × ₹${baseRate} = ₹${driverCharge}`,
            serviceType === 'outstation' && !foodProvided ? `🍽️ Food Bata: ${numDays} day(s) × ₹400 = ₹${bataCharge}` : '',
            serviceType === 'outstation' && !stayProvided ? `🏨 Accommodation: ${numDays} day(s) × ₹500 = ₹${accommodationCharge}` : '',
            serviceType === 'outstation' ? `🔄 Return Charge: ₹${returnCharge}` : '',
            ``,
            `💵 TOTAL COST: ₹${totalFare}`
        ].filter(Boolean);

        setResult({
            fare: totalFare,
            details,
            breakdown: {
                driverCharge,
                bata: bataCharge,
                accommodation: accommodationCharge,
                returnCharge
            }
        });
    };

    const book = () => {
        const serviceNames = {
            local8: 'Local Driver (8 hrs/80 KM)',
            local12: 'Local Driver (12 hrs/120 KM)',
            outstation: 'Outstation Driver'
        };
        const msg = `*Book Acting Driver*\n\nService: ${serviceNames[serviceType]}\nDuration: ${days} day(s)\n${serviceType === 'outstation' ? `Food: ${foodProvided ? 'Provided' : 'Not Provided'}\nStay: ${stayProvided ? 'Provided' : 'Not Provided'}\n` : ''}Total Cost: ₹${result.fare}`;
        window.open(`https://wa.me/${settings.driverPhone}?text=${encodeURIComponent(msg)}`);
    };

    return (
        <div className="space-y-4">
            {/* Service Type Selection */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 pl-3 border-l-4 border-blue-500">Service Type</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setServiceType('local8')}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'local8'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        8 Hrs<br />80 KM
                    </button>
                    <button
                        onClick={() => setServiceType('local12')}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'local12'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        12 Hrs<br />120 KM
                    </button>
                    <button
                        onClick={() => setServiceType('outstation')}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'outstation'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Outstation<br />Unlimited
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <Input label="Duration (Days)" icon={<Clock size={10} />} value={days} onChange={setDays} type="number" />

                {/* Outstation Options */}
                {serviceType === 'outstation' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2">Driver Provisions</p>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <div onClick={() => setFoodProvided(!foodProvided)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${foodProvided ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {foodProvided && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Food Provided by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, ₹400/day bata will be charged</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <div onClick={() => setStayProvided(!stayProvided)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${stayProvided ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {stayProvided && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Accommodation Provided by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, ₹500/day will be charged</p>
                            </div>
                        </label>
                    </div>
                )}
            </div>

            <Button onClick={calculate} disabled={!days} text="Calculate Driver Cost" />
            {result && <ResultCard title="Acting Driver Cost" amount={result.fare} details={result.details} sub={serviceType === 'outstation' ? 'Fuel & Vehicle by Customer' : 'Extra hours charged separately'} onBook={book} />}
        </div>
    );
};

// --- 3. Relocation Calculator ---
const RelocationCalculator: React.FC = () => {
    const { settings } = useSettings();
    const [serviceType, setServiceType] = useState<'carrier' | 'driver'>('carrier');
    const [vehicleType, setVehicleType] = useState<'car' | 'van' | 'bus'>('car');
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [distance, setDistance] = useState('');
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Driver-Driven options (only for driver service)
    const [fuelIncluded, setFuelIncluded] = useState(false);
    const [tollsIncluded, setTollsIncluded] = useState(false);
    const [driverReturnIncluded, setDriverReturnIncluded] = useState(false);

    const [result, setResult] = useState<any>(null);

    // Auto-calculate distance
    useEffect(() => {
        const autoCalculateDistance = async () => {
            if (pickupCoords && dropCoords) {
                setCalculatingDistance(true);
                try {
                    const result = await calculateDistance(pickupCoords, dropCoords);
                    if (result) {
                        setDistance(result.distance.toString());
                    }
                } catch (error) {
                    console.error('Error calculating distance:', error);
                } finally {
                    setCalculatingDistance(false);
                }
            }
        };
        autoCalculateDistance();
    }, [pickupCoords, dropCoords]);

    const handleMapSelect = (pickupAddr: string, dropAddr: string, dist: number) => {
        setPickup(pickupAddr);
        setDrop(dropAddr);
        setDistance(dist.toString());
        setShowMap(false);
    };

    const calculate = () => {
        const dist = parseFloat(distance);
        if (!dist) return;

        // Detect inter-state for permit
        const pickupLower = pickup.toLowerCase();
        const dropLower = drop.toLowerCase();
        const isKarnataka = pickupLower.includes('karnataka') || dropLower.includes('karnataka') ||
            pickupLower.includes('bangalore') || dropLower.includes('bangalore');
        const isKerala = pickupLower.includes('kerala') || dropLower.includes('kerala');
        const isAndhra = pickupLower.includes('andhra') || dropLower.includes('andhra');
        const isTamilNadu = pickupLower.includes('tamil nadu') || dropLower.includes('tamil nadu') ||
            pickupLower.includes('chennai') || dropLower.includes('chennai');

        const needsPermit = (isTamilNadu && (isKarnataka || isKerala || isAndhra));
        const permitCharge = needsPermit ? 800 : 0;
        const permitState = isKarnataka ? 'Karnataka' : isKerala ? 'Kerala' : isAndhra ? 'Andhra Pradesh' : '';

        let totalFare = 0;
        const details: string[] = [];

        if (serviceType === 'carrier') {
            // Professional Carrier Service (All-Inclusive)
            // Rates based on vehicle type and distance
            const baseRates = {
                car: dist <= 500 ? 5000 : dist <= 1000 ? 8000 : dist <= 1500 ? 12000 : 15000,
                van: dist <= 500 ? 7000 : dist <= 1000 ? 11000 : dist <= 1500 ? 16000 : 20000,
                bus: dist <= 500 ? 12000 : dist <= 1000 ? 18000 : dist <= 1500 ? 25000 : 32000
            };

            const baseCharge = baseRates[vehicleType];
            totalFare = baseCharge + permitCharge;

            details.push(
                `🚛 Professional Carrier Service`,
                `🚗 Vehicle: ${vehicleType === 'car' ? 'Car/Sedan' : vehicleType === 'van' ? 'Van/SUV' : 'Bus/Large Vehicle'}`,
                `📍 Route: ${pickup} → ${drop}`,
                `📏 Distance: ${dist} KM`,
                ``,
                `💰 Base Charge: ₹${baseCharge.toFixed(0)}`,
                `   (Includes: Carrier + Fuel + Tolls + Driver + Insurance)`,
                needsPermit ? `📋 ${permitState} Permit: ₹${permitCharge}` : '',
                ``,
                `💵 TOTAL COST: ₹${totalFare.toFixed(0)}`
            );
        } else {
            // Driver-Driven Service (Customer Controls Costs)
            const driverCharges = {
                car: 1000, // Base driver charge per trip
                van: 1500,
                bus: 2500
            };

            const driverCharge = driverCharges[vehicleType];
            let fuelCharge = 0;
            let tollCharge = 0;
            let returnCharge = 0;

            if (!fuelIncluded) {
                // Fuel estimates (₹/KM)
                const fuelRates = { car: 7, van: 9, bus: 12 };
                fuelCharge = dist * fuelRates[vehicleType];
            }

            if (!tollsIncluded) {
                tollCharge = Math.ceil(dist / 100) * 250;
            }

            if (!driverReturnIncluded) {
                returnCharge = 500;
            }

            totalFare = driverCharge + fuelCharge + tollCharge + permitCharge + returnCharge;

            details.push(
                `👨‍✈️ Driver-Driven Service`,
                `🚗 Vehicle: ${vehicleType === 'car' ? 'Car/Sedan' : vehicleType === 'van' ? 'Van/SUV' : 'Bus/Large Vehicle'}`,
                `📍 Route: ${pickup} → ${drop}`,
                `📏 Distance: ${dist} KM`,
                ``,
                `💰 Driver Charge: ₹${driverCharge}`,
                !fuelIncluded ? `⛽ Fuel: ${dist} KM × ₹${vehicleType === 'car' ? 7 : vehicleType === 'van' ? 9 : 12}/KM = ₹${fuelCharge.toFixed(0)}` : `⛽ Fuel: Provided by Customer`,
                !tollsIncluded ? `🛣️ Tolls: ₹${tollCharge}` : `🛣️ Tolls: Paid by Customer`,
                needsPermit ? `📋 ${permitState} Permit: ₹${permitCharge}` : '',
                !driverReturnIncluded ? `🎫 Driver Return: ₹${returnCharge}` : `🎫 Driver Return: Arranged by Customer`,
                ``,
                `💵 TOTAL COST: ₹${totalFare.toFixed(0)}`
            );
        }

        setResult({
            fare: totalFare,
            details: details.filter(Boolean)
        });
    };

    const book = () => {
        const serviceNames = {
            carrier: 'Professional Carrier',
            driver: 'Driver-Driven'
        };
        const vehicleNames = {
            car: 'Car/Sedan',
            van: 'Van/SUV',
            bus: 'Bus/Large Vehicle'
        };
        const msg = `*Vehicle Relocation Quote*\n\nService: ${serviceNames[serviceType]}\nVehicle: ${vehicleNames[vehicleType]}\nRoute: ${pickup} → ${drop}\nDistance: ${distance} KM\nEstimated Cost: ₹${result.fare.toFixed(0)}`;
        window.open(`https://wa.me/${settings.driverPhone}?text=${encodeURIComponent(msg)}`);
    };

    return (
        <div className="space-y-4">
            {/* Service Type Selection */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 pl-3 border-l-4 border-blue-500">Service Type</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setServiceType('carrier')}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'carrier'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        🚛 Carrier<br /><span className="text-[8px] font-normal">All Inclusive</span>
                    </button>
                    <button
                        onClick={() => setServiceType('driver')}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'driver'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        👨‍✈️ Driver<br /><span className="text-[8px] font-normal">Driven</span>
                    </button>
                </div>
            </div>

            {/* Vehicle Type Selection */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 pl-3 border-l-4 border-blue-500">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'car', label: 'Car/Sedan', icon: '🚗' },
                        { id: 'van', label: 'Van/SUV', icon: '🚐' },
                        { id: 'bus', label: 'Bus', icon: '🚌' }
                    ].map((v: any) => (
                        <button
                            key={v.id}
                            onClick={() => setVehicleType(v.id)}
                            className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${vehicleType === v.id
                                ? 'bg-[#0047AB] text-white shadow-lg'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {v.icon}<br />{v.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <PlacesAutocomplete
                        label="Pickup Location"
                        icon={<MapPin size={10} />}
                        value={pickup}
                        onChange={setPickup}
                        onPlaceSelected={(place) => {
                            setPickup(place.address);
                            setPickupCoords({ lat: place.lat, lng: place.lng });
                        }}
                        onMapClick={() => setShowMap(true)}
                        placeholder="Start typing..."
                    />
                    <PlacesAutocomplete
                        label="Drop Location"
                        icon={<MapPin size={10} />}
                        value={drop}
                        onChange={setDrop}
                        onPlaceSelected={(place) => {
                            setDrop(place.address);
                            setDropCoords({ lat: place.lat, lng: place.lng });
                        }}
                        onMapClick={() => setShowMap(true)}
                        placeholder="Start typing..."
                    />
                </div>

                <div className="space-y-1">
                    <Label icon={<AlertCircle size={10} />} text="Distance (Km)" />
                    <div className="relative">
                        <input
                            type="number"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs"
                            placeholder={calculatingDistance ? "Calculating..." : "Auto-calculated"}
                            disabled={calculatingDistance}
                        />
                        {calculatingDistance && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Driver-Driven Options */}
                {serviceType === 'driver' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2">Customer Provides</p>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <div onClick={() => setFuelIncluded(!fuelIncluded)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${fuelIncluded ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {fuelIncluded && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Fuel Provided by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, estimated fuel cost will be charged</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <div onClick={() => setTollsIncluded(!tollsIncluded)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tollsIncluded ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {tollsIncluded && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Tolls Paid by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, estimated toll charges will be added</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <div onClick={() => setDriverReturnIncluded(!driverReturnIncluded)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${driverReturnIncluded ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {driverReturnIncluded && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Driver Return Arranged by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, ₹500 return ticket will be charged</p>
                            </div>
                        </label>
                    </div>
                )}
            </div>

            <Button onClick={calculate} disabled={!distance} text="Calculate Relocation Cost" />
            {result && <ResultCard title="Vehicle Relocation" amount={result.fare} details={result.details} sub={serviceType === 'carrier' ? 'Fully Insured Transport' : 'Safe & Professional Driver'} onBook={book} />}

            {/* Map Picker Modal */}
            {showMap && (
                <MapPicker
                    onLocationSelect={handleMapSelect}
                    onClose={() => setShowMap(false)}
                />
            )}
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

const ResultCard = ({ title, amount, details, sub, onBook }: any) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        const text = `🚖 *${title}*\n\n${Array.isArray(details) ? details.join('\n') : details}\n\n⚠️ ${sub}\n\n📞 Book Now: Contact us for confirmation`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="relative z-10 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                    <span className="text-2xl font-black text-[#4ade80]">₹{amount.toLocaleString()}</span>
                </div>
                <pre className="font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed bg-white/5 p-3 rounded-xl">
                    {Array.isArray(details) ? details.join('\n') : details}
                </pre>
                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-2 rounded-lg">
                    <AlertCircle size={12} /> <span className="text-[9px] font-bold uppercase">{sub}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={copyToClipboard}
                        className="py-3 bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg text-[10px]"
                    >
                        {copied ? <CheckCircle2 size={16} /> : <MessageCircle size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={onBook}
                        className="py-3 bg-[#25D366] hover:bg-[#128c7e] text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg text-[10px]"
                    >
                        <MessageCircle size={16} /> WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Container ---
const Calculator: React.FC = () => {
    const [mode, setMode] = useState<'cab' | 'driver' | 'relocation'>('cab');

    return (
        <div className="max-w-3xl mx-auto pb-24 space-y-2">
            <div className="px-2 py-1 text-center">
                <h2 className="text-lg font-black uppercase tracking-wide text-slate-800 underline decoration-4 decoration-blue-500 underline-offset-4">FARE CALCULATOR</h2>
                <p className="text-slate-600 text-[10px] font-medium mt-0.5">Select a service to calculate cost</p>
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
