import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { MapPin, Clock, Car, AlertCircle, CheckCircle2, Plus, Hash, Users, RotateCcw, ChevronUp, ChevronDown, Share2, UserCheck, Truck } from 'lucide-react';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
import { calculateDistance } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { estimatePermitCharge } from '../utils/permits';
import { estimateParkingCharge } from '../utils/parking';
import { calculateFare, FareMode } from '../utils/fare';
import { VEHICLES } from '../config/vehicleRates';
import { Analytics } from '../utils/monitoring';


// Define result type based on calculation output
type FareResult = ReturnType<typeof calculateFare>;

// --- 1. Cab Calculator Component ---
const CabCalculator: React.FC = () => {
    useSettings();
    const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'local' | 'airport'>('oneway');
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<string>('');
    const [days, setDays] = useState<string>('1');
    const [passengers, setPassengers] = useState<number>(4);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('hatchback');
    const [customRate, setCustomRate] = useState<number>(14);
    const [result, setResult] = useState<{ fare: number; details: string[]; breakdown: FareResult & { total: number } } | null>(null);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Hourly / Local Package State
    const [hourlyPackage, setHourlyPackage] = useState<string>('8hr_80km');
    const [durationHours, setDurationHours] = useState<number>(8); // Default 8

    // Additional Charges State
    const [waitingHours, setWaitingHours] = useState<number>(0);
    const [isHillStation, setIsHillStation] = useState(false);
    const [petCharge, setPetCharge] = useState(false);
    const [toll, setToll] = useState<string>('0');
    const [permit, setPermit] = useState<string>('0');
    const [parking, setParking] = useState<string>('0');
    const [showAdditional, setShowAdditional] = useState(false);

    // New Business Logic State
    const [garageBuffer, setGarageBuffer] = useState(false);
    const [manualBata, setManualBata] = useState<'auto' | 'single' | 'double'>('auto');
    const [interstateState, setInterstateState] = useState('');
    const [isNightDrive, setIsNightDrive] = useState(false);

    const [manualToll, setManualToll] = useState(false);
    const [manualPermit, setManualPermit] = useState(false);
    const [manualParking, setManualParking] = useState(false);

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
            if (tripType === 'local') {
                // For Local Hourly, distance is technically 0 at start, or user inputs usage?
                // Actually, initially we just set distance to 0 or package limit?
                // Let's rely on manual input or package default.
                // We'll calculate fare based on package.
                return;
            }

            if (pickupCoords && dropCoords) {
                setCalculatingDistance(true);
                try {
                    // 1. Estimate Permit based on states & vehicle
                    if (!manualPermit) {
                        const permitEst = estimatePermitCharge(pickup, drop, selectedVehicle);
                        if (permitEst) {
                            setPermit(permitEst.amount.toString());
                        } else {
                            setPermit('0');
                        }
                    }

                    // Reset Toll/Days to avoid stale data (ONLY if not manual)
                    if (!manualToll) setToll('0');
                    if (tripType !== 'roundtrip') setDays('1'); // Days logic remains auto for now

                    // 2. Estimate Parking based on location keywords
                    if (!manualParking) {
                        const pickupParking = estimateParkingCharge(pickup);
                        const dropParking = estimateParkingCharge(drop);
                        const totalParking = (pickupParking?.amount || 0) + (dropParking?.amount || 0);
                        setParking(totalParking.toString());
                    }

                    // 3. Try Advanced Routes API first (for tolls)
                    const advanced = await calculateAdvancedRoute(pickupCoords, dropCoords);
                    if (advanced) {
                        const multiplier = tripType === 'roundtrip' ? 2 : 1;
                        setDistance((advanced.distanceKm * multiplier).toString());

                        if (advanced.tollPrice > 0 && !manualToll) {
                            // HEURISTIC FIX: API often returns valid Round Trip Toll. 
                            // For One Way, if high (>800), assume it includes return and take 60% approx? 
                            // User says "Your One Way: 1570 (2x)". Actual ~800.
                            // So if One Way, we might need to halve it?
                            // Let's rely on user feedback: "If tripType === 'round_trip', use as is". 
                            // Implies for One Way we might need to adjust if it seems double.
                            let finalToll = advanced.tollPrice;
                            if (tripType === 'oneway' && finalToll > 1000) {
                                finalToll = Math.round(finalToll * 0.6); // 60% as safe bet (One Way usually ~50-60%)
                            }
                            setToll(finalToll.toString());
                        }

                        // Auto-Calculate Days for Rounds Trips (Min 300km/day rule)
                        if (tripType === 'roundtrip') {
                            const totalDist = advanced.distanceKm * multiplier;
                            const estDays = Math.max(1, Math.ceil(totalDist / 300));
                            setDays(estDays.toString());
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
    }, [pickupCoords, dropCoords, pickup, drop, selectedVehicle, tripType, manualToll, manualPermit, manualParking]);

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

    // Auto-switch removed for Heavy Vehicles (Now allowing Package Price for Drops)

    // AUTO-CALCULATE FARE INSTANTLY
    useEffect(() => {
        // For Local Hourly, we calculate even without distance
        if (distance || tripType === 'local') {
            calculate();
        }
    }, [distance, tripType, days, passengers, selectedVehicle, customRate, waitingHours, isHillStation, petCharge, toll, permit, parking, garageBuffer, manualBata, interstateState, isNightDrive, hourlyPackage, durationHours]);

    const calculate = () => {
        const dist = parseFloat(distance) || 0;
        if (!dist && tripType !== 'airport' && tripType !== 'local') return;

        let mode: FareMode = 'drop';
        if (tripType === 'roundtrip') mode = 'outstation';
        if (tripType === 'local') mode = 'hourly';

        const tripDays = parseInt(days) || 1;
        let packagePrice = 0;
        let pDuration = 8;
        let pKm = 80;

        // Determine Package Price based on Selection
        if (mode === 'hourly') {
            const vehicle = VEHICLES.find(v => v.id === selectedVehicle);

            // Standard Market Rates (Approx) - Hardcoded for MVP or look up?
            // Let's assume Sedan: 4hr/40km=1300, 8hr/80km=2300, 12hr/120km=3200
            // SUV: +30-40%
            // Implementation: Simple mapping
            if (hourlyPackage === '4hr_40km') {
                pDuration = 4; pKm = 40;
                packagePrice = vehicle?.type === 'SUV' ? 1800 : 1300;
                // Adjust for larger vehicles?
                if (['tempo', 'minibus', 'bus'].includes(selectedVehicle)) packagePrice = 3500; // Tempo min
            } else if (hourlyPackage === '8hr_80km') {
                pDuration = 8; pKm = 80;
                packagePrice = vehicle?.type === 'SUV' ? 3000 : 2300;
                if (['tempo', 'minibus', 'bus'].includes(selectedVehicle)) packagePrice = 5500;
            } else { // 12hr
                pDuration = 12; pKm = 120;
                packagePrice = vehicle?.type === 'SUV' ? 4200 : 3200;
                if (['tempo', 'minibus', 'bus'].includes(selectedVehicle)) packagePrice = 7500;
            }

            // Sync with state defaults if not manual
            // setDurationHours(pDuration); // Careful with loop?
        }

        const fareParams = {
            startKm: 0,
            endKm: mode === 'outstation' ? dist : dist,
            baseFare: 0,
            ratePerKm: customRate,
            toll: parseFloat(toll) || 0,
            parking: parseFloat(parking) || 0,
            gstEnabled: false,
            mode: mode,
            vehicleId: selectedVehicle,
            days: tripDays,
            nightBata: 0,
            // For Local Hourly, we handle extra hours via 'includedHours' vs 'durationHours' inside fare.ts logic now.
            // So we set waitingHours to 0 here to prevent separate 'Waiting Charge'.
            waitingHours: tripType === 'local' ? 0 : waitingHours,
            isHillStation,
            petCharge,
            includeGarageBuffer: garageBuffer,
            manualBataMode: manualBata,
            interstateState: interstateState,
            isNightDrive: isNightDrive,
            packagePrice: packagePrice,
            includedKm: pKm,
            includedHours: pDuration,
            extraHourRate: 250 // Standard Extra Hour Rate
        };

        const res = calculateFare(fareParams);
        const permitTotal = parseFloat(permit) || 0;
        const finalTotal = res.total + permitTotal;

        const currentVeh = VEHICLES.find(v => v.id === selectedVehicle);
        const details = [];

        if (pickup) details.push(`Pickup: ${pickup}`);
        if (drop) details.push(`Drop: ${drop}`);

        if (mode === 'hourly') {
            details.push(`Package: ${pDuration} Hrs / ${pKm} KM`);
            details.push(`Base Fare: ₹${packagePrice}`);
            // Add excess details
            const excessKm = Math.max(0, dist - pKm); // dist is actual usage for hourly
            const excessHr = Math.max(0, durationHours - pDuration);

            if (excessKm > 0) details.push(`Extra Distance: ${excessKm} KM × ₹${customRate} = ₹${(excessKm * customRate).toFixed(0)}`);
            if (excessHr > 0) details.push(`Extra Hours: ${excessHr} Hr × ₹250 = ₹${excessHr * 250}`); // Hardcoded 250 for now or fetch
        } else {
            details.push(`Trip: ${res.distance} KM (${res.mode === 'outstation' ? 'Round Trip' : 'Local Drop'})`);
        }

        if (res.warningMessage) {
            details.push(`⚠️ ${res.warningMessage}`);
        }

        if (res.mode === 'drop' && res.distance <= 30) {
            details.push(`Type: City Local Trip`);

            const isLarge = currentVeh?.type === 'SUV' || currentVeh?.type === 'Van';
            const baseFee = isLarge ? 350 : 250;
            const BASE_KM = 10;

            const extraRate = res.rateUsed;
            const extraKm = Math.max(0, res.distance - BASE_KM);

            details.push(`Base Fare (First ${BASE_KM} KM): ₹${baseFee}`);
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
        } else if (res.mode !== 'hourly') {
            // Outstation Drop Trip (> 30KM)
            details.push(`Outstation Drop Trip (Min 130 KM)`);
            details.push(`Distance Charge: ${res.effectiveDistance} KM × ₹${res.rateUsed} = ₹${res.distanceCharge}`);
            if (res.driverBatta > 0) {
                details.push(`Driver Allowance: ₹${res.driverBatta}`);
            }
        }

        if (res.waitingCharges > 0 && mode !== 'hourly') details.push(`Waiting Charge: ₹${res.waitingCharges}`); // Hourly includes it in extra
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



    return (
        <div className="space-y-4">
            <div className="flex p-1 bg-slate-50 rounded-xl" role="group" aria-label="Trip type selection">
                {(['oneway', 'roundtrip', 'local'] as const).map((t) => {
                    return (
                        <button
                            key={t}
                            onClick={() => setTripType(t)}
                            aria-pressed={tripType === t}
                            aria-label={t === 'oneway' ? 'One Way or Drop Trip' : (t === 'local' ? 'Local Hourly Rental' : 'Round Trip')}
                            className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all 
                                ${tripType === t ? 'bg-white text-[#0047AB] shadow-sm border-2 border-[#0047AB]' : 'text-slate-600 hover:text-slate-900 border-2 border-transparent'}
                            `}
                        >
                            {t === 'oneway' ? 'One Way' : (t === 'local' ? 'Local Hourly' : 'Round Trip')}
                        </button>
                    );
                })}
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

                    {tripType !== 'local' && (
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
                    )}

                    {tripType === 'local' && (
                        <div className="space-y-1 w-full">
                            <Label icon={<Clock size={10} aria-hidden="true" />} text="Total Hours" htmlFor="duration-hours" />
                            <select
                                id="duration-hours"
                                value={durationHours}
                                onChange={(e) => setDurationHours(parseInt(e.target.value))}
                                className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs"
                            >
                                {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(h => (
                                    <option key={h} value={h}>{h} Hours</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {tripType === 'local' && (
                    <div className="space-y-1">
                        <Label icon={<Hash size={10} aria-hidden="true" />} text="Package" htmlFor="hourly-package" />
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: '4hr_40km', label: '4 Hr / 40 KM' },
                                { id: '8hr_80km', label: '8 Hr / 80 KM' },
                                { id: '12hr_120km', label: '12 Hr / 120 KM' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setHourlyPackage(p.id)}
                                    className={`py-2 px-1 rounded-lg text-[9px] font-bold border transition-all ${hourlyPackage === p.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Row 2: Distance + (Duration or Rate) */}
                <div className="grid grid-cols-2 gap-3 items-end">
                    {tripType !== 'local' && (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <Label icon={<AlertCircle size={10} aria-hidden="true" />} text="Distance (Km)" htmlFor="cab-distance" />
                                {tripType === 'oneway' && distance && !isNaN(parseFloat(distance)) && (
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${parseFloat(distance) <= 30 ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {parseFloat(distance) <= 30 ? 'Local' : 'Drop'}
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
                                    placeholder={calculatingDistance ? "..." : "0"}
                                    disabled={calculatingDistance}
                                />
                                {calculatingDistance && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" aria-hidden="true"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Secondary Input for Row 2 */}
                    {tripType === 'roundtrip' && (
                        <div className="space-y-1">
                            <Label icon={<Clock size={10} aria-hidden="true" />} text="Trip Duration" htmlFor="cab-days" />
                            <select id="cab-days" value={days} onChange={e => setDays(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                                {[1, 2, 3, 4, 5, 6, 7, 10, 15].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Day' : 'Days'}</option>)}
                            </select>
                        </div>
                    )}
                    {tripType === 'oneway' && (
                        <Input label="Rate/Km" icon={<Hash size={10} aria-hidden="true" />} value={customRate} onChange={(val) => setCustomRate(Number(val))} type="number" highlight />
                    )}
                </div>

                {/* Rate/Km for Roundtrip */}
                {tripType === 'roundtrip' && (
                    <div className="grid grid-cols-1">
                        <Input label="Rate/Km" icon={<Hash size={10} aria-hidden="true" />} value={customRate} onChange={(val) => setCustomRate(Number(val))} type="number" highlight />
                    </div>
                )}

                {/* Row 3: Passengers + Vehicle */}
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

                {/* Row 4: Garage Buffer */}
                {(tripType === 'roundtrip' || (tripType === 'oneway' && parseFloat(distance) > 30)) && (
                    <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <input
                            type="checkbox"
                            checked={garageBuffer}
                            onChange={(e) => setGarageBuffer(e.target.checked)}
                            className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Add Garage Buffer (20km)</span>
                    </label>
                )}


                {/* Additional Charges Section - ACCORDION */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setShowAdditional(!showAdditional)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-100 transition-colors"
                        type="button"
                    >
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Plus size={12} className={`text-blue-500 transition-transform ${showAdditional ? 'rotate-45' : ''}`} />
                            {showAdditional ? 'Additional Charges' : 'Add Tolls / Parking / Batta'}
                        </p>
                        <Plus size={12} className={`text-slate-400 transition-transform duration-200 ${showAdditional ? 'rotate-180 opacity-0' : 'rotate-0'}`} />
                    </button>

                    {showAdditional && (
                        <div className="p-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            {/* Interstate Permit - Only for Outstation/Drop */}
                            {tripType !== 'local' && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Interstate Permit</label>
                                    <select
                                        value={interstateState}
                                        onChange={(e) => setInterstateState(e.target.value)}
                                        className="tn-input h-8 text-xs bg-white w-full"
                                    >
                                        <option value="">None (State Only)</option>
                                        <option value="kerala">Kerala Entry</option>
                                        <option value="karnataka">Karnataka Entry</option>
                                        <option value="andhra">Andhra Entry</option>
                                        <option value="puducherry">Puducherry Entry</option>
                                    </select>
                                </div>
                            )}

                            {/* Driver Bata Controls for Outstation */}
                            {(tripType === 'roundtrip' || (parseFloat(distance) > 30)) && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Driver Bata Mode</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        <button
                                            onClick={() => setManualBata('auto')}
                                            className={`text-[9px] font-bold py-1.5 rounded border ${manualBata === 'auto' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                        >Auto</button>
                                        <button
                                            onClick={() => setManualBata('single')}
                                            className={`text-[9px] font-bold py-1.5 rounded border ${manualBata === 'single' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                        >1x</button>
                                        <button
                                            onClick={() => setManualBata('double')}
                                            className={`text-[9px] font-bold py-1.5 rounded border ${manualBata === 'double' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                        >2x</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Waiting (Hrs)</label>
                                    <input type="number" value={waitingHours || ''} onChange={e => setWaitingHours(Number(e.target.value))} className="tn-input h-8 text-xs bg-white" placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Toll Charges</label>
                                        {manualToll && (
                                            <button onClick={() => setManualToll(false)} className="text-[9px] text-blue-600 flex items-center gap-1 hover:underline" title="Reset to Auto">
                                                <RotateCcw size={8} /> Reset
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        value={toll}
                                        onChange={e => { setToll(e.target.value); setManualToll(true); }}
                                        className={`tn-input h-8 text-xs w-full ${manualToll ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-white'}`}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Parking</label>
                                        {manualParking && (
                                            <button onClick={() => setManualParking(false)} className="text-[9px] text-blue-600 flex items-center gap-1 hover:underline" title="Reset to Auto">
                                                <RotateCcw size={8} /> Reset
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        value={parking}
                                        onChange={e => { setParking(e.target.value); setManualParking(true); }}
                                        className={`tn-input h-8 text-xs w-full ${manualParking ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-white'}`}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Permit (Manual)</label>
                                        {manualPermit && (
                                            <button onClick={() => setManualPermit(false)} className="text-[9px] text-blue-600 flex items-center gap-1 hover:underline" title="Reset to Auto">
                                                <RotateCcw size={8} /> Reset
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        value={permit}
                                        onChange={e => { setPermit(e.target.value); setManualPermit(true); }}
                                        className={`tn-input h-8 text-xs w-full ${manualPermit ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-white'}`}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIsHillStation(!isHillStation)}
                                    className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${isHillStation ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    Hill Station
                                </button>
                                <button
                                    onClick={() => setPetCharge(!petCharge)}
                                    className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${petCharge ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    Pet Charge
                                </button>
                                <button
                                    onClick={() => setIsNightDrive(!isNightDrive)}
                                    className={`col-span-2 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${isNightDrive ? 'bg-indigo-900 border-indigo-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    Night Drive (11 PM - 5 AM)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Result Card Replacement */}
            {result && <ResultCard title="Cab Fare" amount={result.fare} details={result.details} sub="Tolls & Permits Included (Approx)" />}

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
    const [result, setResult] = useState<{ fare: number; details: string[] } | null>(null);

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
            details
        });
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
            {result && <ResultCard title="Estimated Fare" amount={result.fare} details={result.details} sub={serviceType === 'outstation' ? 'Driver Bata/Night charges extra' : 'Extra Hr/Km charges apply'} />}
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

    const [result, setResult] = useState<{ fare: number; details: string[] } | null>(null);

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
                    {(
                        [
                            { id: 'car', label: 'Car/Sedan', icon: '🚗' },
                            { id: 'van', label: 'Van/SUV', icon: '🚐' },
                            { id: 'bus', label: 'Bus', icon: '🚌' }
                        ] as const
                    ).map((v) => (
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
            {result && <ResultCard title="Vehicle Relocation" amount={result.fare} details={result.details} sub={serviceType === 'carrier' ? 'Fully Insured Transport' : 'Safe & Professional Driver'} />}

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
interface InputProps {
    label: string;
    icon: React.ReactNode;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    highlight?: boolean;
}

const Input = ({ label, icon, value, onChange, type = 'text', highlight = false }: InputProps) => {
    const id = React.useId();
    return (
        <div className="space-y-1 w-full">
            <Label icon={icon} text={label} htmlFor={id} />
            <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs ${highlight ? 'font-black text-[#0047AB]' : ''}`} />
        </div>
    );
};

interface LabelProps {
    icon: React.ReactNode;
    text: string;
    htmlFor: string;
}

const Label = ({ icon, text, htmlFor }: LabelProps) => (
    <label htmlFor={htmlFor} className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1.5">{icon} {text}</label>
);

interface ButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    text: string;
    ariaLabel?: string;
}

const Button = ({ onClick, disabled, text, ariaLabel }: ButtonProps) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel || text} className="w-full py-4 bg-[#0047AB] text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-[10px]">
        {text}
    </button>
);

interface ResultCardProps {
    title: string;
    amount: number;
    details: string[] | string;
    sub: string;
}

const ResultCard = ({ title, amount, details, sub }: ResultCardProps) => {
    const [expanded, setExpanded] = useState(false);

    const shareToWhatsApp = () => {
        const cleanDetails = Array.isArray(details)
            ? details.map(line => line.replace(/[*_]/g, '').replace(/⚠️/g, '').trim()).join('\n')
            : details;
        const text = `*${title}*\n\n${cleanDetails}\n\nNote: ${sub}\n\n*Total Estimate: ₹${amount.toLocaleString()}*`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (!amount) return null;

    return (
        <>
            {/* Overlay for Expanded State */}
            {expanded && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90] transition-opacity duration-300"
                    onClick={() => setExpanded(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sticky Floating Card */}
            <div className={`fixed bottom-[90px] left-3 right-3 md:left-auto md:right-6 md:w-96 bg-white text-slate-800 z-[100] transition-all duration-300 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col overflow-hidden ${expanded ? 'max-h-[60vh]' : 'h-auto'}`}>

                {/* Visual Drag Handle (only visible when expanded) */}
                {expanded && (
                    <div
                        className="flex flex-col items-center pt-2 pb-1 cursor-pointer bg-slate-50 border-b border-slate-100"
                        onClick={() => setExpanded(false)}
                    >
                        <div className="w-10 h-1 bg-slate-300 rounded-full" />
                    </div>
                )}

                <div className="p-4 flex-1 flex flex-col">
                    {/* Header: Amount & Actions */}
                    <div className="flex justify-between items-center gap-3">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{title}</p>
                            <div className="flex items-baseline gap-1.5">
                                <h2 className="text-2xl font-black text-[#0047AB]">₹{amount.toLocaleString()}</h2>
                                <span className="text-[10px] text-slate-400 font-medium">approx</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 mr-1">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap flex items-center gap-2 ${expanded ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-50 text-[#0047AB] border-slate-200 hover:bg-slate-100'}`}
                            >
                                {expanded ? 'Close' : 'View Price Breakdown'}
                                {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>

                            <button
                                onClick={shareToWhatsApp}
                                className="p-2.5 rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all shadow-md active:scale-95 flex items-center justify-center aspect-square"
                                aria-label="Share via WhatsApp"
                            >
                                <Share2 size={20} className="text-white relative left-[-1px]" />
                            </button>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {expanded && (
                        <div className="mt-4 flex-1 flex flex-col min-h-0 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <div className="h-px bg-slate-100 w-full mb-3" />

                            {/* Scrollable Details */}
                            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                                {Array.isArray(details) ? (
                                    details.map((line: string, i: number) => {
                                        const cleanLine = line.replace(/[*_]/g, '').replace(/⚠️/g, '').trim();
                                        const isTotal = line.toLowerCase().includes('total');

                                        if (!cleanLine) return null;

                                        return (
                                            <div
                                                key={i}
                                                className={`flex justify-between items-start gap-3 text-xs py-1.5 border-b border-dashed border-slate-100 last:border-0 ${isTotal ? 'font-bold text-slate-900 bg-slate-50 px-2 rounded' : 'text-slate-600'}`}
                                            >
                                                <span>{cleanLine}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-slate-600 leading-relaxed">{details}</p>
                                )}

                                {/* Notes Box */}
                                <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-2">
                                    <AlertCircle size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Note</p>
                                        <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">{sub}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
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

            {/* Calculator Mode Tabs */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1 overflow-x-auto" role="tablist" aria-label="Calculator Mode">
                {(
                    [
                        { id: 'cab', label: 'Cab Booking', icon: Car },
                        { id: 'driver', label: 'Acting Driver', icon: UserCheck },
                        { id: 'relocation', label: 'Car Relocation', icon: Truck },
                    ] as const
                ).map((m) => (
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
