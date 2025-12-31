import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { MapPin, Users, Car, Clock, CheckCircle2, MessageCircle, AlertCircle, UserCheck, Truck, Hash, Plus } from 'lucide-react';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
import { calculateDistance } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { estimatePermitCharge } from '../utils/permits';
import { estimateParkingCharge } from '../utils/parking';
import { calculateFare, VEHICLES, FareMode } from '../utils/fare';
import { Analytics } from '../utils/monitoring';

// Using central VEHICLES from fare.ts

// --- 1. Cab Calculator Component ---
const CabCalculator: React.FC = () => {
    useSettings();
    const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'airport'>('oneway');
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<string>('');
    const [days, setDays] = useState<string>('1');
    const [passengers, setPassengers] = useState<number>(4);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('hatchback');
    const [customRate, setCustomRate] = useState<number>(14);
    const [result, setResult] = useState<any>(null);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Additional Charges State
    const [waitingHours, setWaitingHours] = useState<number>(0);
    const [isHillStation, setIsHillStation] = useState(false);
    const [petCharge, setPetCharge] = useState(false);
    const [toll, setToll] = useState<string>('0');
    const [permit, setPermit] = useState<string>('0');
    const [parking, setParking] = useState<string>('0');
    const [showAdditional, setShowAdditional] = useState(false);

    const handleMapSelect = (pickupAddr: string, dropAddr: string, dist: number, tollAmt?: number) => {
        setPickup(pickupAddr);
        setDrop(dropAddr);
        setDistance(dist.toString());
        if (tollAmt && tollAmt > 0) {
            setToll(tollAmt.toString());
        }
        setShowMap(false);
    };

    // Auto-calculate distance, TOLLS, PERMITS AND PARKING when both locations are selected via autocomplete
    useEffect(() => {
        const autoCalculateTrip = async () => {
            if (pickupCoords && dropCoords) {
                setCalculatingDistance(true);
                try {
                    // 1. Estimate Permit based on states & vehicle
                    const permitEst = estimatePermitCharge(pickup, drop, selectedVehicle);
                    if (permitEst) {
                        setPermit(permitEst.amount.toString());
                    } else {
                        setPermit('0');
                    }

                    // 2. Estimate Parking based on location keywords
                    const pickupParking = estimateParkingCharge(pickup);
                    const dropParking = estimateParkingCharge(drop);
                    const totalParking = (pickupParking?.amount || 0) + (dropParking?.amount || 0);
                    setParking(totalParking.toString());

                    // 3. Try Advanced Routes API first (for tolls)
                    const advanced = await calculateAdvancedRoute(pickupCoords, dropCoords);
                    if (advanced) {
                        const multiplier = tripType === 'roundtrip' ? 2 : 1;
                        setDistance((advanced.distanceKm * multiplier).toString());
                        if (advanced.tollPrice > 0) {
                            // Doubling toll for Round Trip
                            setToll((advanced.tollPrice * multiplier).toString());
                        }
                    } else {
                        // 4. Fallback to basic distance matrix
                        const basic = await calculateDistance(pickupCoords, dropCoords);
                        if (basic) {
                            const multiplier = tripType === 'roundtrip' ? 2 : 1;
                            setDistance((basic.distance * multiplier).toString());
                        }
                    }
                } catch (error) {
                    console.error('Error calculating trip data:', error);
                } finally {
                    setCalculatingDistance(false);
                }
            }
        };

        autoCalculateTrip();
    }, [pickupCoords, dropCoords, pickup, drop, selectedVehicle, tripType]);

    useEffect(() => {
        if (passengers > 18) {
            setSelectedVehicle('bus');
        } else if (passengers > 12) {
            setSelectedVehicle('minibus');
        } else if (passengers > 7) {
            setSelectedVehicle('tempo');
        } else if (passengers > 4) {
            if (!['suv', 'premium_suv', 'tempo', 'minibus', 'bus'].includes(selectedVehicle)) {
                setSelectedVehicle('suv');
            }
        }
    }, [passengers]);

    useEffect(() => {
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
        if (vehicle) {
            setCustomRate(tripType === 'roundtrip' ? vehicle.roundRate : vehicle.dropRate);
        }
    }, [selectedVehicle, tripType]);

    // AUTO-CALCULATE FARE INSTANTLY
    useEffect(() => {
        if (distance) {
            calculate();
        }
    }, [distance, tripType, days, passengers, selectedVehicle, customRate, waitingHours, isHillStation, petCharge, toll, permit, parking]);

    const calculate = () => {
        const dist = parseFloat(distance);
        if (!dist && tripType !== 'airport') return;

        const mode: FareMode = tripType === 'roundtrip' ? 'outstation' : 'drop';
        const tripDays = parseInt(days) || 1;

        const fareParams = {
            startKm: 0,
            endKm: mode === 'outstation' ? dist : dist, // distance is one-way for round trips usually? Wait, let's keep it consistent.
            baseFare: 0,
            ratePerKm: customRate,
            toll: parseFloat(toll) || 0,
            parking: parseFloat(parking) || 0,
            gstEnabled: false,
            mode: mode,
            vehicleId: selectedVehicle,
            days: tripDays,
            nightBata: 0,
            waitingHours: waitingHours,
            isHillStation,
            petCharge
        };

        const res = calculateFare(fareParams);
        const permitTotal = parseFloat(permit) || 0;
        const finalTotal = res.total + permitTotal;

        const currentVeh = VEHICLES.find(v => v.id === selectedVehicle);
        const details = [];

        if (pickup) details.push(`Pickup: ${pickup}`);
        if (drop) details.push(`Drop: ${drop}`);
        details.push(`Trip: ${res.distance} KM (${res.mode === 'outstation' ? 'Round Trip' : 'Local Drop'})`);

        if (res.mode === 'drop' && res.distance <= 30) {
            details.push(`Type: City Local Trip (Standard)`);
            const isLarge = currentVeh?.type === 'SUV' || currentVeh?.type === 'Van';
            const baseFee = isLarge ? 350 : 250;
            const extraRate = isLarge ? 35 : 25;
            const extraKm = Math.max(0, res.distance - 10);

            details.push(`Base Fare (First 10 KM): ₹${baseFee}`);
            if (extraKm > 0) {
                details.push(`Extra Distance: ${extraKm.toFixed(1)} KM × ₹${extraRate} = ₹${(extraKm * extraRate).toFixed(0)}`);
            }
        } else if (res.mode === 'outstation') {
            const minKmDay = currentVeh?.minKm || 250;
            details.push(`Outstation Round Trip (Min ${minKmDay} KM/Day)`);
            details.push(`Distance Charge: ${res.effectiveDistance} KM × ₹${res.rateUsed} = ₹${res.distanceCharge}`);
            if (res.driverBatta > 0) {
                details.push(`Driver Allowance: ₹${res.driverBatta}`);
            }
        } else {
            // Outstation Drop Trip (> 30KM)
            details.push(`Outstation Drop Trip (Min 130 KM)`);
            details.push(`Distance Charge: ${res.effectiveDistance} KM × ₹${res.rateUsed} = ₹${res.distanceCharge}`);
            if (res.driverBatta > 0) {
                details.push(`Driver Allowance: ₹${res.driverBatta}`);
            }
        }

        if (res.waitingCharges > 0) details.push(`Waiting Charge: ₹${res.waitingCharges}`);
        if (res.hillStationCharges > 0) details.push(`Hill Station: ₹${res.hillStationCharges}`);
        if (res.petCharges > 0) details.push(`Pet Charge: ₹${res.petCharges}`);
        if (res.nightBata > 0) details.push(`Night Driver Allowance: ₹${res.nightBata}`);
        if (res.nightStay > 0) details.push(`Night Stay: ₹${res.nightStay}`);
        if (parseFloat(toll) > 0) details.push(`Tolls: ₹${toll}`);
        if (parseFloat(parking) > 0) details.push(`Parking: ₹${parking}`);
        if (permitTotal > 0) details.push(`Permit: ₹${permitTotal}`);

        details.push(``);
        details.push(`TOTAL ESTIMATED FARE: ₹${Math.round(finalTotal)}`);

        Analytics.calculateFare(res.mode, selectedVehicle, res.distance);

        setResult({
            fare: Math.round(finalTotal),
            details,
            breakdown: {
                ...res,
                total: finalTotal
            }
        });
    };

    const book = () => {
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
        let typeLabel = 'Local Drop';
        if (tripType === 'roundtrip') {
            typeLabel = 'Round Trip';
        } else if (parseFloat(distance) > 30) {
            typeLabel = 'Outstation Drop';
        }

        const msg = `*PICKUP:* ${pickup}\n` +
            `*DROP:* ${drop}\n\n` +
            `*VEHICLE:* ${vehicle?.name} (${passengers} Seats)\n` +
            `*TRIP TYPE:* ${typeLabel}\n` +
            `*DISTANCE:* ${distance} km\n` +
            (tripType === 'roundtrip' ? `*DURATION:* ${days} Day(s)\n` : '') +
            `\n` +
            `*ESTIMATED FARE: ₹${result.fare}*\n` +
            `_(Includes Approx Tolls & Permits)_`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="flex p-1 bg-slate-50 rounded-xl" role="group" aria-label="Trip type selection">
                {['oneway', 'roundtrip'].map((t: any) => (
                    <button
                        key={t}
                        onClick={() => setTripType(t)}
                        aria-pressed={tripType === t}
                        aria-label={t === 'oneway' ? 'One Way or Drop Trip' : 'Round Trip'}
                        className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${tripType === t ? 'bg-white text-[#0047AB] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        {t === 'oneway' ? 'One Way' : 'Round Trip'}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <PlacesAutocomplete
                        label="Pickup"
                        icon={<MapPin size={10} aria-hidden="true" />}
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
                        icon={<MapPin size={10} aria-hidden="true" />}
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
                    <div className="flex justify-between items-center">
                        <Label icon={<AlertCircle size={10} aria-hidden="true" />} text="Distance (Km)" htmlFor="cab-distance" />
                        {tripType === 'oneway' && distance && !isNaN(parseFloat(distance)) && (
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${parseFloat(distance) <= 30 ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                {parseFloat(distance) <= 30 ? 'Local' : 'Outstation Drop'}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            id="cab-distance"
                            type="number"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs"
                            placeholder={calculatingDistance ? "Calculating..." : "Auto-calculated"}
                            disabled={calculatingDistance}
                        />
                        {calculatingDistance && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" aria-hidden="true"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label icon={<Users size={10} aria-hidden="true" />} text="Passengers" htmlFor="cab-passengers" />
                        <select id="cab-passengers" value={passengers} onChange={e => setPassengers(Number(e.target.value))} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                            {[4, 7, 12, 18, 24].map(n => <option key={n} value={n}>{n} Passengers</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <Label icon={<Car size={10} aria-hidden="true" />} text="Vehicle" htmlFor="cab-vehicle" />
                        <select id="cab-vehicle" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                            {VEHICLES.filter(v => {
                                if (passengers > 18) return v.seats >= 24;
                                if (passengers > 12) return v.seats >= 18;
                                if (passengers > 7) return v.seats >= 12;
                                if (passengers > 4) return v.seats >= 7;
                                return true;
                            }).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className={`grid ${tripType === 'roundtrip' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                    {tripType === 'roundtrip' && (
                        <div className="space-y-1">
                            <Label icon={<Clock size={10} aria-hidden="true" />} text="Trip Duration" htmlFor="cab-days" />
                            <select id="cab-days" value={days} onChange={e => setDays(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                                {[1, 2, 3, 4, 5, 6, 7, 10, 15].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Day' : 'Days'}</option>)}
                            </select>
                        </div>
                    )}
                    <Input label="Rate/Km" icon={<Hash size={10} aria-hidden="true" />} value={customRate} onChange={setCustomRate} type="number" highlight />
                </div>

                {/* Additional Charges Section - ACCORDION */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setShowAdditional(!showAdditional)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-100 transition-colors"
                        type="button"
                    >
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Plus size={12} className={`text-blue-500 transition-transform ${showAdditional ? 'rotate-45' : ''}`} />
                            Additional Charges
                        </p>
                        <Plus size={12} className={`text-slate-400 transition-transform duration-200 ${showAdditional ? 'rotate-180 opacity-0' : 'rotate-0'}`} />
                    </button>

                    {showAdditional && (
                        <div className="p-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Waiting (Hrs)</label>
                                    <input type="number" value={waitingHours || ''} onChange={e => setWaitingHours(Number(e.target.value))} className="tn-input h-8 text-xs bg-white" placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Toll Charges</label>
                                    <input type="number" value={toll} onChange={e => setToll(e.target.value)} className="tn-input h-8 text-xs bg-white" placeholder="0" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Parking</label>
                                    <input type="number" value={parking} onChange={e => setParking(e.target.value)} className="tn-input h-8 text-xs bg-white" placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Permit Charges</label>
                                    <input type="number" value={permit} onChange={e => setPermit(e.target.value)} className="tn-input h-8 text-xs bg-white" placeholder="0" />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsHillStation(!isHillStation)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${isHillStation ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    🏔️ Hill Station
                                </button>
                                <button
                                    onClick={() => setPetCharge(!petCharge)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${petCharge ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    🐾 Pet Charge
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Button onClick={calculate} disabled={!distance} text="Calculate Fare" ariaLabel="Calculate Cab Fare" />
            {result && <ResultCard title="Cab Fare" amount={result.fare} details={result.details} sub="Tolls & Permits Included (Approx)" onBook={book} />}

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
    useSettings();
    const [serviceType, setServiceType] = useState<'local8' | 'local12' | 'outstation'>('local8');
    const [days, setDays] = useState('1');
    const [stayProvided, setStayProvided] = useState(false);
    const [foodProvided, setFoodProvided] = useState(false);
    const [result, setResult] = useState<any>(null);

    const calculate = () => {
        const numDays = parseInt(days) || 1;

        const rates = {
            local8: 800,
            local12: 1200,
            outstation: 1200
        };

        const baseRate = rates[serviceType];
        const driverCharge = baseRate * numDays;

        let bataCharge = 0;
        let accommodationCharge = 0;
        let returnCharge = 0;

        if (serviceType === 'outstation') {
            bataCharge = foodProvided ? 0 : (400 * numDays);
            accommodationCharge = stayProvided ? 0 : (500 * numDays);
            returnCharge = 500;
        }

        const totalFare = driverCharge + bataCharge + accommodationCharge + returnCharge;

        const details = [
            `Service: ${serviceType === 'local8' ? 'Local (8 hrs/80 KM)' : serviceType === 'local12' ? 'Local (12 hrs/120 KM)' : 'Outstation'}`,
            `Duration: ${numDays} day(s)`,
            `Driver Charge: ${numDays} day(s) × ₹${baseRate} = ₹${driverCharge}`,
            serviceType === 'outstation' && !foodProvided ? `Food Bata: ${numDays} day(s) × ₹400 = ₹${bataCharge}` : '',
            serviceType === 'outstation' && !stayProvided ? `Accommodation: ${numDays} day(s) × ₹500 = ₹${accommodationCharge}` : '',
            serviceType === 'outstation' ? `Return Charge: ₹${returnCharge}` : '',
            ``,
            `TOTAL COST: ₹${totalFare}`
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
        const msg = `*SERVICE:* ${serviceNames[serviceType]}\n` +
            `*DURATION:* ${days} Day(s)\n` +
            (serviceType === 'outstation' ?
                `*FOOD:* ${foodProvided ? 'Provided' : 'Not Provided'}\n` +
                `*STAY:* ${stayProvided ? 'Provided' : 'Not Provided'}\n` : '') +
            `\n` +
            `*ESTIMATED COST: ₹${result.fare}*`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 pl-3 border-l-4 border-blue-500">Service Type</p>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Acting driver service type">
                    <button
                        onClick={() => setServiceType('local8')}
                        aria-pressed={serviceType === 'local8'}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'local8'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        8 Hrs<br />80 KM
                    </button>
                    <button
                        onClick={() => setServiceType('local12')}
                        aria-pressed={serviceType === 'local12'}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'local12'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        12 Hrs<br />120 KM
                    </button>
                    <button
                        onClick={() => setServiceType('outstation')}
                        aria-pressed={serviceType === 'outstation'}
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
                <Input label="Duration (Days)" icon={<Clock size={10} aria-hidden="true" />} value={days} onChange={setDays} type="number" />

                {serviceType === 'outstation' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2">Driver Provisions</p>

                        <button onClick={() => setFoodProvided(!foodProvided)} aria-pressed={foodProvided} className="flex items-center gap-3 w-full text-left">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${foodProvided ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {foodProvided && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Food Provided by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, ₹400/day bata will be charged</p>
                            </div>
                        </button>

                        <button onClick={() => setStayProvided(!stayProvided)} aria-pressed={stayProvided} className="flex items-center gap-3 w-full text-left">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${stayProvided ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {stayProvided && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Accommodation Provided by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, ₹500/day will be charged</p>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            <Button onClick={calculate} disabled={!days} text="Calculate Driver Cost" ariaLabel="Calculate Acting Driver Cost" />
            {result && <ResultCard title="Acting Driver Cost" amount={result.fare} details={result.details} sub={serviceType === 'outstation' ? 'Fuel & Vehicle by Customer' : 'Extra hours/Night charges (₹200) extra'} onBook={book} />}
        </div>
    );
};

// --- 3. Relocation Calculator ---
const RelocationCalculator: React.FC = () => {
    useSettings();
    const [serviceType, setServiceType] = useState<'carrier' | 'driver'>('carrier');
    const [vehicleType, setVehicleType] = useState<'car' | 'van' | 'bus'>('car');
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [distance, setDistance] = useState('');
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [showMap, setShowMap] = useState(false);

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

    const handleMapSelect = (pickupAddr: string, dropAddr: string, dist: number, _tollAmt?: number) => {
        setPickup(pickupAddr);
        setDrop(dropAddr);
        setDistance(dist.toString());
        setShowMap(false);
    };

    const calculate = () => {
        const dist = parseFloat(distance);
        if (!dist) return;

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
            const baseRates = {
                car: dist <= 500 ? 6000 : dist <= 1000 ? 10000 : dist <= 1500 ? 14000 : 18000,
                van: dist <= 500 ? 8000 : dist <= 1000 ? 13000 : dist <= 1500 ? 18000 : 24000,
                bus: dist <= 500 ? 14000 : dist <= 1000 ? 22000 : dist <= 1500 ? 30000 : 38000
            };

            const baseCharge = baseRates[vehicleType];
            totalFare = baseCharge + permitCharge;

            details.push(
                `Professional Carrier Service`,
                `Vehicle: ${vehicleType === 'car' ? 'Car/Sedan' : vehicleType === 'van' ? 'Van/SUV' : 'Bus/Large Vehicle'}`,
                `Pickup: ${pickup}`,
                `Drop: ${drop}`,
                `Distance: ${dist} KM`,
                ``,
                `Base Charge: ₹${baseCharge.toFixed(0)}`,
                `   (Includes: Carrier + Fuel + Tolls + Driver + Insurance)`,
                needsPermit ? `${permitState} Permit: ₹${permitCharge}` : '',
                ``,
                `TOTAL COST: ₹${totalFare.toFixed(0)}`
            );
        } else {
            const driverCharges = {
                car: 1000,
                van: 1500,
                bus: 2500
            };

            const driverCharge = driverCharges[vehicleType];
            let fuelCharge = 0;
            let tollCharge = 0;
            let returnCharge = 0;

            if (!fuelIncluded) {
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
                `Driver-Driven Service`,
                `Vehicle: ${vehicleType === 'car' ? 'Car/Sedan' : vehicleType === 'van' ? 'Van/SUV' : 'Bus/Large Vehicle'}`,
                `Pickup: ${pickup}`,
                `Drop: ${drop}`,
                `Distance: ${dist} KM`,
                ``,
                `Driver Charge: ₹${driverCharge}`,
                !fuelIncluded ? `Fuel: ${dist} KM × ₹${vehicleType === 'car' ? 7 : vehicleType === 'van' ? 9 : 12}/KM = ₹${fuelCharge.toFixed(0)}` : `Fuel: Provided by Customer`,
                !tollsIncluded ? `Tolls: ₹${tollCharge}` : `Tolls: Paid by Customer`,
                needsPermit ? `${permitState} Permit: ₹${permitCharge}` : '',
                !driverReturnIncluded ? `Driver Return: ₹${returnCharge}` : `Driver Return: Arranged by Customer`,
                ``,
                `TOTAL COST: ₹${totalFare.toFixed(0)}`
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
        const msg = `*PICKUP:* ${pickup}\n` +
            `*DROP:* ${drop}\n\n` +
            `*VEHICLE:* ${vehicleNames[vehicleType]}\n` +
            `*SERVICE:* ${serviceNames[serviceType]}\n` +
            `*DISTANCE:* ${distance} km\n` +
            `\n` +
            `*ESTIMATED COST: ₹${result.fare.toFixed(0)}*`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 pl-3 border-l-4 border-blue-500">Service Type</p>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Relocation service type">
                    <button
                        onClick={() => setServiceType('carrier')}
                        aria-pressed={serviceType === 'carrier'}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'carrier'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        🚛 Carrier<br /><span className="text-[8px] font-normal">All Inclusive</span>
                    </button>
                    <button
                        onClick={() => setServiceType('driver')}
                        aria-pressed={serviceType === 'driver'}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'driver'
                            ? 'bg-[#0047AB] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        👨‍✈️ Driver<br /><span className="text-[8px] font-normal">Driven</span>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 pl-3 border-l-4 border-blue-500">Vehicle Type</p>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Relocation vehicle type">
                    {[
                        { id: 'car', label: 'Car/Sedan', icon: '🚗' },
                        { id: 'van', label: 'Van/SUV', icon: '🚐' },
                        { id: 'bus', label: 'Bus', icon: '🚌' }
                    ].map((v: any) => (
                        <button
                            key={v.id}
                            onClick={() => setVehicleType(v.id)}
                            aria-pressed={vehicleType === v.id}
                            className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${vehicleType === v.id
                                ? 'bg-[#0047AB] text-white shadow-lg'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <span role="img" aria-label={v.label}>{v.icon}</span><br />{v.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <PlacesAutocomplete
                        label="Pickup"
                        icon={<MapPin size={10} aria-hidden="true" />}
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
                        icon={<MapPin size={10} aria-hidden="true" />}
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
                    <Label icon={<AlertCircle size={10} aria-hidden="true" />} text="Distance (Km)" htmlFor="relocation-distance" />
                    <div className="relative">
                        <input
                            id="relocation-distance"
                            type="number"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs"
                            placeholder={calculatingDistance ? "Calculating..." : "Auto-calculated"}
                            disabled={calculatingDistance}
                        />
                        {calculatingDistance && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" aria-hidden="true"></div>
                            </div>
                        )}
                    </div>
                </div>

                {serviceType === 'driver' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2">Customer Provides</p>

                        <button onClick={() => setFuelIncluded(!fuelIncluded)} aria-pressed={fuelIncluded} className="flex items-center gap-3 w-full text-left">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${fuelIncluded ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {fuelIncluded && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Fuel Provided by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, estimated fuel cost will be charged</p>
                            </div>
                        </button>

                        <button onClick={() => setTollsIncluded(!tollsIncluded)} aria-pressed={tollsIncluded} className="flex items-center gap-3 w-full text-left">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tollsIncluded ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {tollsIncluded && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Tolls Paid by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, estimated toll charges will be added</p>
                            </div>
                        </button>

                        <button onClick={() => setDriverReturnIncluded(!driverReturnIncluded)} aria-pressed={driverReturnIncluded} className="flex items-center gap-3 w-full text-left">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${driverReturnIncluded ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                {driverReturnIncluded && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Driver Return Arranged by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, ₹500 return ticket will be charged</p>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            <Button onClick={calculate} disabled={!distance} text="Calculate Relocation Cost" ariaLabel="Calculate Vehicle Relocation Cost" />
            {result && <ResultCard title="Vehicle Relocation" amount={result.fare} details={result.details} sub={serviceType === 'carrier' ? 'Fully Insured Transport' : 'Safe & Professional Driver'} onBook={book} />}

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
const Input = ({ label, icon, value, onChange, type = 'text', highlight = false }: any) => {
    const id = React.useId();
    return (
        <div className="space-y-1 w-full">
            <Label icon={icon} text={label} htmlFor={id} />
            <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs ${highlight ? 'font-black text-[#0047AB]' : ''}`} />
        </div>
    );
};

const Label = ({ icon, text, htmlFor }: any) => (
    <label htmlFor={htmlFor} className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1.5">{icon} {text}</label>
);

const Button = ({ onClick, disabled, text, ariaLabel }: any) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel || text} className="w-full py-4 bg-[#0047AB] text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-[10px]">
        {text}
    </button>
);

const ResultCard = ({ title, amount, details, sub, onBook }: any) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        const text = `*${title}*\n\n${Array.isArray(details) ? details.join('\n') : details}\n\nNote: ${sub}\n\nBook Now: Contact us for confirmation`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -mr-8 -mt-8" aria-hidden="true"></div>
            <div className="relative z-10 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                    <span className="text-xl font-black text-[#4ade80]">₹{amount.toLocaleString()}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed bg-white/5 p-2.5 rounded-xl">
                    {Array.isArray(details) ? (
                        details.map((line: string, i: number) => {
                            let emoji = '🔹';
                            if (line.includes('Trip')) emoji = '🚐';
                            if (line.includes('Charge')) emoji = '💰';
                            if (line.includes('Toll')) emoji = '🛣️';
                            if (line.includes('TOTAL')) emoji = '💵';
                            if (line.includes('Bata')) emoji = '🍽️';
                            return <div key={i} className="flex gap-2 mb-1"><span>{emoji}</span><span>{line}</span></div>;
                        })
                    ) : details}
                </div>
                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-2 rounded-lg">
                    <AlertCircle size={12} aria-hidden="true" /> <span className="text-[9px] font-bold uppercase">{sub}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={copyToClipboard}
                        aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
                        className="py-3 bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg text-[10px]"
                    >
                        {copied ? <CheckCircle2 size={16} aria-hidden="true" /> : <MessageCircle size={16} aria-hidden="true" />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                        onClick={onBook}
                        aria-label="Contact us on WhatsApp"
                        className="py-3 bg-[#25D366] hover:bg-[#128c7e] text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg text-[10px]"
                    >
                        <MessageCircle size={16} aria-hidden="true" /> WhatsApp
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
                <h1 className="text-lg font-black uppercase tracking-wide text-slate-800 underline decoration-4 decoration-blue-500 underline-offset-4">FARE CALCULATOR</h1>
                <p className="text-slate-600 text-[10px] font-medium mt-0.5">Select a service to calculate cost</p>
            </div>

            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1 overflow-x-auto" role="tablist" aria-label="Calculator Mode">
                {[
                    { id: 'cab', label: 'Cab Booking', icon: Car },
                    { id: 'driver', label: 'Acting Driver', icon: UserCheck },
                    { id: 'relocation', label: 'Car Relocation', icon: Truck },
                ].map((m: any) => (
                    <button
                        key={m.id}
                        role="tab"
                        aria-selected={mode === m.id}
                        aria-controls={`${m.id}-panel`}
                        id={`${m.id}-tab`}
                        onClick={() => setMode(m.id)}
                        className={`flex-1 min-w-[90px] py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${mode === m.id ? 'bg-[#0047AB] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <m.icon size={18} aria-hidden="true" />
                        <span className="text-[9px] font-black uppercase tracking-wider">{m.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm" role="tabpanel" id={`${mode}-panel`} aria-labelledby={`${mode}-tab`}>
                {mode === 'cab' && <CabCalculator />}
                {mode === 'driver' && <ActingDriverCalculator />}
                {mode === 'relocation' && <RelocationCalculator />}
            </div>
        </div>
    );
};

export default Calculator;
