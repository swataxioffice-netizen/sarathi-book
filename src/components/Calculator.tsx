import React, { useState, useEffect, useId } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import {
    MapPin,
    Clock,
    Car,
    AlertCircle,
    CheckCircle2,
    Plus,
    Hash,
    ChevronUp,
    ChevronDown,
    Share2,
    UserCheck,
    Truck,
    RotateCcw,
    X,
    FileText,
    Check,
    TrendingUp,
    ArrowRight,
    ChevronRight,
} from 'lucide-react';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
import { calculateDistance } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { estimatePermitCharge } from '../utils/permits';
import { estimateParkingCharge } from '../utils/parking';
import { calculateFare } from '../utils/fare'; // Keep for types if needed, or remove if unused. But wait, I need to remove this if I strictly replace it? No result type uses it.
import { calculateFareAsync } from '../utils/fareWorkerWrapper';
import { VEHICLES } from '../config/vehicleRates';
import { supabase } from '../utils/supabase';
import { Analytics } from '../utils/monitoring';
import { isHillStationLocation } from '../utils/locationUtils';
import AdditionalChargesDrawer from './AdditionalChargesDrawer';
import SEOHead from './SEOHead';


// Define result type based on calculation output
type FareResult = ReturnType<typeof calculateFare>;

// --- 1. Cab Calculator Component ---
interface CabProps {
    initialPickup?: string;
    initialDrop?: string;
    initialTripType?: 'oneway' | 'roundtrip' | 'local' | 'airport';
    initialResult?: any;
}

const CabCalculator: React.FC<CabProps> = ({ initialPickup, initialDrop, initialTripType, initialResult }) => {
    useSettings();
    const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'local' | 'airport'>('oneway');
    const [pickup, setPickup] = useState(initialPickup || '');
    const [drop, setDrop] = useState(initialDrop || '');

    // Sync state with props (for deep linking from URL)
    useEffect(() => {
        if (initialPickup) setPickup(initialPickup);
        if (initialDrop) setDrop(initialDrop);
        if (initialTripType) setTripType(initialTripType);
    }, [initialPickup, initialDrop, initialTripType]);

    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<string>('');
    const [days, setDays] = useState<string>('1');
    const [selectedVehicle, setSelectedVehicle] = useState<string>('hatchback');
    const [customRate, setCustomRate] = useState<number>(14);
    const [result, setResult] = useState<{ fare: number; details: string[]; breakdown: FareResult & { total: number } } | null>(null);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Initial Result Pre-fill
    useEffect(() => {
        if (initialResult) {
            setDistance(initialResult.distance.toString());
            setSelectedVehicle(initialResult.vehicle || 'sedan');
            setResult(initialResult);
            // Scroll to result slightly
            setTimeout(() => {
                const el = document.getElementById('result-card-container');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [initialResult]);

    // Dynamic SEO Callback
    useEffect(() => {
        if (pickup && drop) {
            window.dispatchEvent(new CustomEvent('calculator-route-change', {
                detail: { pickup, drop }
            }));
        }
    }, [pickup, drop]);

    // Hourly / Local Package State
    const [hourlyPackage, setHourlyPackage] = useState<string>('8hr_80km');
    const [durationHours, setDurationHours] = useState<number>(8); // Default 8

    // Additional Charges State
    const [hillStationCharge, setHillStationCharge] = useState<string>('0');
    const [petCharge, setPetCharge] = useState<string>('0');
    const [nightCharge, setNightCharge] = useState<string>('0');
    const [toll, setToll] = useState<string>('0');
    const [permit, setPermit] = useState<string>('0');
    const [parking, setParking] = useState<string>('0');
    const [showAdditional, setShowAdditional] = useState(false);

    // New Business Logic State
    const [garageBuffer, setGarageBuffer] = useState(false);
    const [driverBata, setDriverBata] = useState<string>('0');
    const [manualDriverBata, setManualDriverBata] = useState(false);

    const [manualToll, setManualToll] = useState(false);
    const [manualPermit, setManualPermit] = useState(false);
    const [manualParking, setManualParking] = useState(false);
    const [manualHillStation, setManualHillStation] = useState(false);
    const [manualPet, setManualPet] = useState(false);
    const [manualNight, setManualNight] = useState(false);

    const handleMapSelect = (pickupAddr: string, dropAddr: string, dist: number, tollAmt?: number) => {
        setPickup(pickupAddr);
        setDrop(dropAddr);
        setDistance(dist.toFixed(1));
        if (tollAmt && tollAmt > 0) {
            let finalToll = tollAmt;
            if (tripType === 'roundtrip') {
                const numDays = parseInt(days) || 1;
                // Indian Toll Logic: ~1.6x for return within 24h, 2.0x for multi-day
                finalToll = numDays > 1 ? tollAmt * 2 : Math.round(tollAmt * 1.6);
            }
            setToll(finalToll.toString());
        }
        setShowMap(false);
    };

    // Auto-calculate distance
    useEffect(() => {
        const autoCalculateTrip = async () => {
            if (tripType === 'local') return;

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
                    if (tripType !== 'roundtrip') setDays('1');

                    // 2. Estimate Parking
                    if (!manualParking) {
                        const pickupParking = estimateParkingCharge(pickup);
                        const dropParking = estimateParkingCharge(drop);
                        const totalParking = (pickupParking?.amount || 0) + (dropParking?.amount || 0);
                        setParking(totalParking.toString());
                    }

                    // 3. Auto Hill Station
                    if (!manualHillStation) {
                        if (drop && isHillStationLocation(drop)) {
                            const v = VEHICLES.find(v => v.id === selectedVehicle);
                            const isHeavy = ['tempo', 'minibus', 'bus'].some(t => v?.id.includes(t));
                            setHillStationCharge(isHeavy ? '1000' : '500');
                        } else {
                            setHillStationCharge('0');
                        }
                    }

                    // 4. Try Advanced Routes API first
                    const advanced = await calculateAdvancedRoute(pickupCoords, dropCoords);
                    if (advanced) {
                        const multiplier = tripType === 'roundtrip' ? 2 : 1;
                        setDistance((advanced.distanceKm * multiplier).toString());

                        if (advanced.tollPrice > 0 && !manualToll) {
                            let baseToll = advanced.tollPrice;
                            let vehicleMultiplier = 1;
                            if (selectedVehicle === 'tempo') vehicleMultiplier = 1.6;
                            else if (['minibus', 'bus'].includes(selectedVehicle)) vehicleMultiplier = 3.3;

                            baseToll = Math.round(baseToll * vehicleMultiplier);

                            let finalToll = 0;
                            if (tripType === 'oneway') {
                                finalToll = baseToll;
                            } else if (tripType === 'roundtrip') {
                                const numDays = parseInt(days) || 1;
                                if (numDays > 1) {
                                    finalToll = baseToll * 2;
                                } else {
                                    finalToll = Math.round(baseToll * 1.6);
                                }
                            }
                            setToll(finalToll.toString());
                        }

                        // Auto-Calculate Days for Rounds Trips
                        if (tripType === 'roundtrip') {
                            const totalDist = advanced.distanceKm * multiplier;
                            const estDays = Math.max(1, Math.ceil(totalDist / 600));
                            if (parseInt(days) < estDays) {
                                setDays(estDays.toString());
                            }
                        }
                    } else {
                        // 5. Fallback to basic distance matrix
                        const basic = await calculateDistance(pickupCoords, dropCoords);
                        if (basic) {
                            const multiplier = tripType === 'roundtrip' ? 2 : 1;
                            const totalDist = basic.distance * multiplier;
                            setDistance(totalDist.toString());

                            if (tripType === 'roundtrip') {
                                const estDays = Math.max(1, Math.ceil(totalDist / 600));
                                if (parseInt(days) < estDays) {
                                    setDays(estDays.toString());
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error calculating trip data:', error);
                } finally {
                    setCalculatingDistance(false);
                }
            }
        };

        // Don't auto-calculate if we just loaded an initial result (to prevent overwrite)
        if (!initialResult) {
            autoCalculateTrip();
        }
    }, [pickupCoords, dropCoords, pickup, drop, selectedVehicle, tripType, manualToll, manualPermit, manualParking, days, manualHillStation, initialResult]);

    useEffect(() => {
        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
        if (vehicle) {
            setCustomRate(tripType === 'roundtrip' ? vehicle.roundRate : vehicle.dropRate);

            if (!manualDriverBata) {
                let batta = 0;
                const dist = parseFloat(distance) || 0;
                const isHeavy = ['tempo', 'minibus', 'bus'].some(t => vehicle.id.includes(t));

                if (tripType === 'roundtrip') {
                    const d = parseInt(days) || 1;
                    batta = vehicle.batta * d;
                } else if (tripType === 'oneway') {
                    batta = (dist > 40 || isHeavy) ? vehicle.batta : 0;
                }
                setDriverBata(batta.toString());
            }
        }
    }, [selectedVehicle, tripType, days, manualDriverBata, distance]);

    const calculate = async () => {
        const dist = parseFloat(distance) || 0;
        if (!dist && tripType !== 'local') return;

        let serviceType = 'one_way';
        if (tripType === 'roundtrip') serviceType = 'round_trip';
        if (tripType === 'local') serviceType = 'local_hourly';

        let durationDays = 1;
        if (serviceType === 'round_trip') {
            durationDays = parseInt(days) || 1;
        }

        let calcExtraHours = 0;
        if (serviceType === 'local_hourly') {
            calcExtraHours = Math.max(0, durationHours - 8);
        }

        const overrideRate = (customRate && customRate > 0) ? customRate : undefined;

        try {
            const res = await calculateFareAsync(
                serviceType,
                selectedVehicle,
                dist + (garageBuffer ? 20 : 0),
                durationDays,
                calcExtraHours,
                false,
                overrideRate,
                manualDriverBata ? parseFloat(driverBata) : undefined,
                parseFloat(hillStationCharge),
                parseFloat(petCharge),
                parseFloat(nightCharge)
            );

            const permitTotal = parseFloat(permit) || 0;
            const parkingTotal = parking ? parseFloat(parking) : 0;
            const tollTotal = toll ? parseFloat(toll) : 0;
            const otherExtras = permitTotal + parkingTotal + tollTotal;

            const finalTotal = res.totalFare + otherExtras;

            const fullBreakdown = [...res.breakdown];

            if (permitTotal > 0) fullBreakdown.push(`Permit Charges: ₹${permitTotal.toLocaleString()}`);
            if (parkingTotal > 0) fullBreakdown.push(`Parking Charges: ₹${parkingTotal.toLocaleString()}`);
            if (tollTotal > 0) fullBreakdown.push(`Toll Charges: ₹${tollTotal.toLocaleString()}`);

            // Pass full context to Analytics for "Real" Trending Routes
            Analytics.calculateFare(serviceType, selectedVehicle, dist, pickup, drop, Math.round(finalTotal));

            setResult({
                fare: Math.round(finalTotal),
                details: fullBreakdown,
                breakdown: {
                    ...res,
                    total: finalTotal
                }
            });
        } catch (err) {
            console.error(err);
        }
    };

    // AUTO-CALCULATE FARE INSTANTLY
    useEffect(() => {
        // Only auto-calc if we DON'T have an initial result loaded, OR if user changed inputs
        if (initialResult && distance === initialResult.distance.toString() && selectedVehicle === initialResult.vehicle) {
            // Do nothing, let initial result persist
        } else {
            if (distance || tripType === 'local') {
                calculate();
            }
        }
    }, [distance, tripType, days, selectedVehicle, customRate, hillStationCharge, petCharge, toll, permit, parking, garageBuffer, driverBata, nightCharge, hourlyPackage, durationHours]);

    // Handle vehicle selection reset
    useEffect(() => {
        if (tripType === 'oneway' && ['tempo', 'minibus', 'bus'].includes(selectedVehicle)) {
            setSelectedVehicle('hatchback');
        }
    }, [tripType, selectedVehicle]);

    // Calculate total additional charges
    const totalExtras = (parseFloat(driverBata) || 0) + (parseFloat(toll) || 0) + (parseFloat(parking) || 0) + (parseFloat(permit) || 0) + (parseFloat(hillStationCharge) || 0) + (parseFloat(petCharge) || 0) + (parseFloat(nightCharge) || 0);

    const minDays = (tripType === 'roundtrip' && distance) ? Math.max(1, Math.ceil((parseFloat(distance) - 50) / 600)) : 1;

    return (
        <div className="space-y-4">
            <div className="flex p-1 bg-slate-50 rounded-xl" role="group" aria-label="Trip type selection">
                {(['oneway', 'roundtrip', 'local'] as const).map((t) => {
                    return (
                        <button
                            key={t}
                            onClick={() => setTripType(t)}
                            aria-pressed={tripType === t}
                            aria-label={t === 'oneway' ? 'Drop Trip' : (t === 'local' ? 'Local Package' : 'Outstation')}
                            className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all 
                                    ${tripType === t ? 'bg-white text-[#0047AB] shadow-sm border-2 border-[#0047AB]' : 'text-slate-600 hover:text-slate-900 border-2 border-transparent'}
                                `}
                        >
                            {t === 'oneway' ? 'Drop Trip' : (t === 'local' ? 'Local Package' : 'Outstation')}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
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
                        rightContent={pickup && (
                            <button
                                onClick={() => {
                                    setPickup('');
                                    setPickupCoords(null);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                            >
                                <X size={14} />
                            </button>
                        )}
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
                        rightContent={drop && (
                            <button
                                onClick={() => {
                                    setDrop('');
                                    setDropCoords(null);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                            >
                                <X size={14} />
                            </button>
                        )}
                    />
                </div>

                <div className="space-y-1">
                    {tripType === 'local' ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                {['8hr_80km', '12hr_120km', 'custom'].map(pkg => (
                                    <button
                                        key={pkg}
                                        onClick={() => setHourlyPackage(pkg)}
                                        className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all
                                                ${hourlyPackage === pkg ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}
                                            `}
                                    >
                                        {pkg === 'custom' ? 'Custom' : pkg.replace('_', ' / ').toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    label="Duration (Hrs)"
                                    icon={<Clock size={10} />}
                                    value={durationHours}
                                    onChange={(v) => setDurationHours(Number(v))}
                                    type="number"
                                />
                                <div className="space-y-1">
                                    <Label icon={<AlertCircle size={10} aria-hidden="true" />} text="Est. Distance (Km)" htmlFor="local-dist" />
                                    <input
                                        id="local-dist"
                                        type="number"
                                        value={distance}
                                        onChange={(e) => setDistance(e.target.value)}
                                        className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Label icon={<AlertCircle size={10} aria-hidden="true" />} text="Distance (Km)" htmlFor="cab-distance" />
                            <div className="flex items-center gap-3">
                                <div className="relative w-1/2">
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

                                {parseFloat(distance) > 0 && (
                                    <span className="shrink-0 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100 uppercase tracking-wider">
                                        {parseFloat(distance) <= 40 ? 'Local' : (tripType === 'roundtrip' ? 'Outstation' : 'Drop Trip')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {tripType === 'roundtrip' && (
                        <div className="space-y-1">
                            <Label icon={<Clock size={10} aria-hidden="true" />} text="Trip Duration" htmlFor="cab-days" />
                            <select id="cab-days" value={days} onChange={e => setDays(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                                {[1, 2, 3, 4, 5, 6, 7, 10, 15].map(n => (
                                    <option key={n} value={n} disabled={n < minDays}>
                                        {n} {n === 1 ? 'Day' : 'Days'} {n < minDays ? '(Below Min)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label icon={<Car size={10} aria-hidden="true" />} text="Vehicle" htmlFor="cab-vehicle" />
                        <select id="cab-vehicle" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs">
                            {VEHICLES.filter(v => {
                                if (tripType === 'oneway') {
                                    return !['tempo', 'minibus', 'bus'].includes(v.id);
                                }
                                return true;
                            }).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>

                    <Input
                        label="Rate/Km"
                        icon={<Hash size={10} aria-hidden="true" />}
                        value={customRate}
                        onChange={(val) => setCustomRate(Number(val))}
                        type="number"
                        highlight
                    />
                </div>

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
            </div>

            {/* Transparency Section */}
            {pickup && drop && (
                <div className="sr-only">
                    <h4>0% Service Commission</h4>
                    <p>Sarathi Book estimates are derived directly from taxi associations, ensuring you pay one fair, direct price.</p>
                </div>
            )}

            <div
                onClick={() => setShowAdditional(true)}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-blue-300 transition-all select-none group"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Plus size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Additional Charges</span>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-8">
                        {totalExtras > 0
                            ? `Includes Tolls: ₹${toll}, Bata: ₹${driverBata}...`
                            : 'Tap to add Tolls, Parking, Bata & Night charges'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ChevronUp className="text-slate-300 rotate-90" size={16} />
                </div>
            </div>

            <AdditionalChargesDrawer
                isOpen={showAdditional}
                onClose={() => setShowAdditional(false)}
                tripType={tripType}
                days={days}
                driverBata={driverBata} setDriverBata={setDriverBata}
                manualDriverBata={manualDriverBata} setManualDriverBata={setManualDriverBata}
                toll={toll} setToll={setToll}
                manualToll={manualToll} setManualToll={setManualToll}
                parking={parking} setParking={setParking}
                manualParking={manualParking} setManualParking={setManualParking}
                permit={permit} setPermit={setPermit}
                manualPermit={manualPermit} setManualPermit={setManualPermit}
                hillStationCharge={hillStationCharge} setHillStationCharge={setHillStationCharge}
                manualHillStation={manualHillStation} setManualHillStation={setManualHillStation}
                petCharge={petCharge} setPetCharge={setPetCharge}
                manualPet={manualPet} setManualPet={setManualPet}
                nightCharge={nightCharge} setNightCharge={setNightCharge}
                manualNight={manualNight} setManualNight={setManualNight}
            />

            {(result || initialResult) && (
                <div id="result-card-container">
                    <ResultCard
                        title="Cab Fare"
                        amount={result ? result.fare : initialResult.totalFare}
                        details={result ? result.details : initialResult.breakdown}
                        sub="Tolls & Permits Included (Approx)"
                        tripData={{
                            pickup,
                            drop,
                            distance,
                            vehicle: selectedVehicle,
                            type: tripType,
                            days
                        }}
                    />
                </div>
            )}

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
            {result && (
                <ResultCard
                    title="Estimated Fare"
                    amount={result.fare}
                    details={result.details}
                    sub={serviceType === 'outstation' ? 'Driver Bata/Night charges extra' : 'Extra Hr/Km charges apply'}
                    tripData={{
                        pickup: 'Acting Driver Service',
                        drop: serviceType.toUpperCase(),
                        distance: days,
                        vehicle: 'Acting Driver',
                        type: 'local',
                        days
                    }}
                />
            )}
        </div>
    );
};

// --- 3. Relocation Calculator ---
const RelocationCalculator: React.FC = () => {
    useSettings();
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

        setResult({
            fare: totalFare,
            details: details.filter(Boolean)
        });
    };



    return (
        <div className="space-y-4">


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
                <div className="grid grid-cols-1 gap-3">
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
                        rightContent={pickup && (
                            <button
                                onClick={() => {
                                    setPickup('');
                                    setPickupCoords(null);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                            >
                                <X size={14} />
                            </button>
                        )}
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
                        rightContent={drop && (
                            <button
                                onClick={() => {
                                    setDrop('');
                                    setDropCoords(null);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                            >
                                <X size={14} />
                            </button>
                        )}
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
            </div>

            <Button onClick={calculate} disabled={!distance} text="Calculate Relocation Cost" ariaLabel="Calculate Vehicle Relocation Cost" />
            {result && <ResultCard title="Vehicle Relocation" amount={result.fare} details={result.details} sub="Safe & Professional Driver" />}

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
    const id = useId();
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
    tripData?: {
        pickup: string;
        drop: string;
        distance: string;
        vehicle: string;
        type: string;
        days?: string;
    };
}

const ResultCard = ({ title, amount, details, sub, tripData }: ResultCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const [includeGst, setIncludeGst] = useState(false);

    const gstAmount = Math.round(amount * 0.05);
    const finalAmount = includeGst ? amount + gstAmount : amount;

    const shareToWhatsApp = () => {
        const cleanDetails = Array.isArray(details)
            ? details.map(line => line.replace(/[*_]/g, '').replace(/⚠️/g, '').trim()).join('\n')
            : details;

        let text = `*${title}*\n\n${cleanDetails}`;
        if (includeGst) {
            text += `\nGST (5%): ₹${gstAmount.toLocaleString()}`;
        }
        text += `\n\nNote: ${sub}\n\n*Total Estimate: ₹${finalAmount.toLocaleString()}*`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleCreateQuote = () => {
        if (!tripData) return;

        // 1. Prepare items from details
        const items = Array.isArray(details) ? details
            .filter(line => !line.toLowerCase().startsWith('note:'))
            .map(line => {
                const parts = line.split(': ₹');
                // Force break before parentheses to ensure proper wrapping in PDF
                // Also remove '₹' symbol as it breaks PDF font encoding (shows as ¹)
                const desc = parts[0].trim().replace(' (', '\n(').replace(/₹/g, '');
                const amt = parts[1] ? parts[1].replace(/,/g, '') : '';

                return {
                    description: desc,
                    rate: amt,
                    quantity: 1,
                    amount: amt,
                    package: '',
                    vehicleType: tripData.vehicle,
                    taxable: true
                };
            }) : [];

        // 2. Set localStorage drafts for QuotationForm
        // Shorten locations (City only) to prevent PDF overflow
        const shortPickup = tripData.pickup.split(',')[0].trim();
        const shortDrop = tripData.drop.split(',')[0].trim();
        // Use Pipe Separator for multi-line formatting in PDF
        localStorage.setItem('draft-q-subject', JSON.stringify(`Quotation for Cab Services - ${tripData.vehicle} | Pickup: ${shortPickup} | Drop: ${shortDrop}`));
        localStorage.setItem('draft-q-vehicle', JSON.stringify(tripData.vehicle));
        localStorage.setItem('draft-q-items', JSON.stringify(items));
        if (includeGst) {
            localStorage.setItem('draft-q-gst', 'true');
        }

        // 3. Dispatch navigation event
        window.dispatchEvent(new CustomEvent('nav-tab-quotation'));
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
            <div className={`fixed bottom-[90px] left-3 right-3 md:left-auto md:right-6 md:w-96 bg-white text-slate-800 z-[100] transition-all duration-300 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col overflow-hidden ${expanded ? 'max-h-[85vh]' : 'h-auto'}`}>

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
                            <div className="flex items-baseline flex-wrap gap-1.5">
                                <h2 className="text-2xl font-black text-[#0047AB]">₹{finalAmount.toLocaleString()}</h2>
                                <span className="text-[10px] text-slate-400 font-medium">approx</span>
                                {!includeGst && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">Excl. GST</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 mr-1">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap flex items-center gap-2 ${expanded ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-50 text-[#0047AB] border-slate-200 hover:bg-slate-100'}`}
                            >
                                {expanded ? 'Hide Details' : 'View Price'}
                                {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
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
                                    <div className="space-y-1">
                                        {details.map((line: string, i: number) => {
                                            const cleanLine = line.replace(/[*_]/g, '').replace(/⚠️/g, '').trim();
                                            if (!cleanLine) return null;

                                            const parts = cleanLine.split(': ₹');
                                            const isNote = cleanLine.toLowerCase().startsWith('note:');

                                            if (isNote) {
                                                return (
                                                    <div key={i} className="py-1 px-2 bg-slate-50 rounded text-[10px] text-slate-400 italic font-medium mt-1">
                                                        {cleanLine}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0"
                                                >
                                                    <span className="text-[11px] font-bold text-slate-600">
                                                        {parts[0]}
                                                    </span>
                                                    {parts.length === 2 && (
                                                        <span className="text-[11px] font-black text-slate-900">
                                                            ₹{parts[1]}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* GST Toggle Section */}
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 border-blue-100/50">
                                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIncludeGst(!includeGst)}>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${includeGst ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white border-slate-300'}`}>
                                                    {includeGst && <Check size={12} className="text-white" />}
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-700 select-none">Add GST (5%)</span>
                                            </div>
                                            {includeGst && <span className="text-[11px] font-black text-[#0047AB]">₹{gstAmount.toLocaleString()}</span>}
                                        </div>
                                        {/* Final Sum Line */}
                                        <div className="mt-4 pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Total Amount</span>
                                            <span className="text-xl font-black text-[#0047AB]">₹{finalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{details}</p>
                                )}

                                {/* Notes Box */}
                                <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-2">
                                    <AlertCircle size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Note</p>
                                        <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">{sub}</p>
                                    </div>
                                </div>

                                {/* Bottom Actions Area */}
                                <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={handleCreateQuote}
                                        className="col-span-4 bg-[#6366F1] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                    >
                                        <FileText size={16} />
                                        Create Formal Quotation
                                    </button>
                                    <button
                                        onClick={shareToWhatsApp}
                                        className="col-span-1 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                                        aria-label="Share via WhatsApp"
                                    >
                                        <Share2 size={20} />
                                    </button>
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
    const SERVICES = [
        {
            id: 'cab',
            label: 'Cab Rental',
            sub: 'Calculations for distance, drops & outstation',
            icon: Car,
            color: 'bg-blue-600',
            seoTitle: 'Cab Rental Fare Calculator | Best Rates for Outstation & Local',
            seoDesc: 'Calculate accurate cab fares for outstation drop trips, round trips, and local hourly rentals. Includes tolls, permits, and driver allowance.'
        },
        {
            id: 'driver',
            label: 'Acting Driver',
            sub: 'Daily & hourly charges for acting drivers',
            icon: UserCheck,
            color: 'bg-emerald-600',
            seoTitle: 'Acting Driver Charges Estimator | Daily & Hourly Driver Rates',
            seoDesc: 'Estimate acting driver charges for local and outstation trips. Professional drivers at affordable daily and hourly rates.'
        },
        {
            id: 'relocation',
            label: 'Relocation',
            sub: 'Car & vehicle relocation service costs',
            icon: Truck,
            color: 'bg-orange-600',
            seoTitle: 'Car Relocation Cost Estimator | Vehicle Shifting Charges',
            seoDesc: 'Calculate professional car relocation costs and vehicle shifting charges. Reliable car transport services across India.'
        },
    ] as const;

    const [mode, setMode] = useState<'cab' | 'driver' | 'relocation' | null>(() => {
        const path = window.location.pathname.split('/')[2];
        return (path as any) || null;
    });

    const [dynamicRoute, setDynamicRoute] = useState<{ pickup: string, drop: string } | null>(() => {
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from');
        const to = params.get('to');
        if (from && to) return { pickup: from, drop: to };
        return null;
    });

    const [dynamicTripType, setDynamicTripType] = useState<'oneway' | 'roundtrip' | 'local' | 'airport' | null>(null);
    const [dynamicResult, setDynamicResult] = useState<any>(null);
    const [trendingRoutes, setTrendingRoutes] = useState<any[]>([]);

    // Fetch Real Trending Data
    useEffect(() => {
        const fetchTrends = async () => {
            // Try to fetch real stats from Supabase
            try {
                const { data, error } = await supabase
                    .from('route_searches')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50); // Fetch last 50 searches

                if (error) throw error;

                if (data && data.length > 0) {
                    // Aggregate by Route (Pickup-Drop)
                    const counts: Record<string, any> = {};

                    data.forEach(row => {
                        // Normalize key
                        const key = `${row.pickup_location?.trim()}-${row.drop_location?.trim()}`;
                        if (!row.pickup_location || !row.drop_location) return;

                        if (!counts[key]) {
                            counts[key] = {
                                from: row.pickup_location,
                                to: row.drop_location,
                                type: row.trip_type === 'roundtrip' ? 'Round Trip' : 'One Way',
                                mode: row.trip_type,
                                dist: row.distance_km,
                                fare: row.estimated_fare,
                                veh: row.vehicle_type,
                                count: 0
                            };
                        }
                        counts[key].count++;
                    });

                    // Sort by popularity
                    const sorted = Object.values(counts)
                        .sort((a: any, b: any) => b.count - a.count)
                        .slice(0, 5) // Top 5
                        .map((item: any, index) => ({
                            ...item,
                            rank: index + 1,
                            searches: `${item.count} calc`,
                            trend: item.count > 2 ? 'up' : 'stable'
                        }));

                    setTrendingRoutes(sorted);
                } else {
                    setTrendingRoutes([]); // No data yet
                }
            } catch (err) {
                console.error("Failed to fetch trending routes", err);
                setTrendingRoutes([]);
            }
        };

        fetchTrends();
    }, []);

    // Listen for route changes within calculators
    useEffect(() => {
        const handleRouteUpdate = (e: any) => {
            setDynamicRoute(e.detail);
        };
        window.addEventListener('calculator-route-change', handleRouteUpdate);
        return () => window.removeEventListener('calculator-route-change', handleRouteUpdate);
    }, []);

    // Sync search params back to URL for shareability
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (dynamicRoute) {
            params.set('from', dynamicRoute.pickup);
            params.set('to', dynamicRoute.drop);
        } else {
            params.delete('from');
            params.delete('to');
        }

        const newSearch = params.toString();
        const currentSearch = window.location.search.slice(1);

        if (newSearch !== currentSearch) {
            const cleanPath = mode ? `/calculator/${mode}` : '/calculator';
            window.history.replaceState(null, '', `${cleanPath}${newSearch ? '?' + newSearch : ''}`);
        }
    }, [dynamicRoute, mode]);

    // Sync mode with URL but PRESERVE search parameters (for auto-fill)
    useEffect(() => {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const cleanPath = mode ? `/calculator/${mode}` : '/calculator';
        const newUrl = cleanPath + currentSearch;

        if (currentPath !== cleanPath) {
            window.history.replaceState(null, '', newUrl);
        }
    }, [mode]);

    // Handle initial mount and browser back/forward
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname.split('/')[2];
            setMode((path as any) || null);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    if (!mode) {
        return (
            <div className="max-w-3xl mx-auto pb-24 px-4 space-y-6">
                <div className="text-center py-6">
                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-tight">Fare Calculator</h1>
                    <p className="text-slate-500 text-xs font-medium mt-1">Select a service to start calculation</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {SERVICES.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setMode(s.id)}
                            className="bg-white border-2 border-slate-100 rounded-3xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98] text-left group"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                <s.icon size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">{s.label}</h3>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{s.sub}</p>
                            </div>
                            <ChevronUp className="text-slate-300 rotate-90" size={20} />
                        </button>
                    ))}
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 mt-4">
                    <div className="flex gap-3">
                        <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
                            Professional tools designed for taxi owners and drivers to provide instant, accurate quotes to customers.
                        </p>
                    </div>
                </div>

                {/* Popular Routes Section for SEO/AEO */}
                <div className="pt-4 space-y-4">
                    {/* Trending Routes Section (Real User Data) */}
                    <div className="pt-6 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-600" />
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Most Calculated Routes</h3>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Community Hits</span>
                        </div>

                        {trendingRoutes.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <p className="text-xs text-slate-400 font-medium">No trending routes yet. Calculate a fare to see it here!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trendingRoutes.map((route, i) => (
                                    <div
                                        key={i}
                                        className="group bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer active:scale-[0.99]"
                                        onClick={() => {
                                            setDynamicRoute({ pickup: route.from, drop: route.to });
                                            setDynamicTripType(route.mode as any);

                                            // Construct Simulated Result from Real Data
                                            const simulatedResult = {
                                                totalFare: route.fare,
                                                breakdown: [
                                                    `Trip Charge (${route.dist} km): ₹${(route.fare * 0.85).toFixed(0)}`,
                                                    `Driver Bata & Allowances: ₹${(route.fare * 0.1).toFixed(0)}`,
                                                    `Tolls & Permits (Est): ₹${(route.fare * 0.05).toFixed(0)}`
                                                ],
                                                effectiveDistance: route.dist,
                                                rateUsed: 14,
                                                distance: route.dist,
                                                mode: route.mode,
                                                vehicle: route.veh,
                                                details: {
                                                    fare: route.fare * 0.85,
                                                    driverBatta: route.fare * 0.1,
                                                    hillStation: 0,
                                                    petCharge: 0,
                                                    nightCharge: 0
                                                }
                                            };
                                            setDynamicResult(simulatedResult);
                                            setMode('cab');
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-700' : (i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600')}`}>
                                                #{route.rank}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="text-sm font-black text-slate-800">{route.from}</h4>
                                                    <ArrowRight size={12} className="text-slate-300" />
                                                    <h4 className="text-sm font-black text-slate-800">{route.to}</h4>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{route.type}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-[9px] font-bold text-blue-500">{route.searches}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <ChevronRight size={16} className="text-slate-400 group-hover:text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const currentService = SERVICES.find(s => s.id === mode);

    return (
        <div className="max-w-3xl mx-auto pb-24 space-y-4">
            {/* Minimal Header with Back Button */}
            <div className="px-4 flex items-center justify-between gap-4">
                <button
                    onClick={() => {
                        setMode(null);
                        setDynamicRoute(null);
                        setDynamicTripType(null);
                        setDynamicResult(null);
                    }}
                    className="flex items-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
                >
                    <RotateCcw size={12} className="text-blue-600" />
                    Change Service
                </button>
                <div className="flex items-center gap-2">
                    {currentService && <currentService.icon size={14} className="text-blue-600" />}
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{currentService?.label}</span>
                </div>
            </div>

            <SEOHead
                title={dynamicRoute
                    ? `${dynamicRoute.pickup} to ${dynamicRoute.drop} Cab Fare & Price`
                    : (currentService?.seoTitle || 'Fare Calculator')
                }
                description={dynamicRoute
                    ? `Calculate exact cab fare from ${dynamicRoute.pickup} to ${dynamicRoute.drop}. Get estimates for Sedan, SUV and Tempo Traveller with tolls and permits.`
                    : currentService?.seoDesc
                }
                schema={dynamicRoute ? {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "name": `Cab from ${dynamicRoute.pickup} to ${dynamicRoute.drop}`,
                    "description": `Professional taxi service and fare estimate for ${dynamicRoute.pickup} to ${dynamicRoute.drop} route.`,
                    "provider": {
                        "@type": "LocalBusiness",
                        "name": "Sarathi Book"
                    },
                    "areaServed": [
                        { "@type": "City", "name": dynamicRoute.pickup },
                        { "@type": "City", "name": dynamicRoute.drop }
                    ],
                    "offers": {
                        "@type": "Offer",
                        "description": "Starting price for Hatchback one-way",
                        "priceCurrency": "INR",
                        "price": "2500"
                    }
                } : null}
            />

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mx-2">
                {mode === 'cab' && (
                    <CabCalculator
                        initialPickup={dynamicRoute?.pickup}
                        initialDrop={dynamicRoute?.drop}
                        initialTripType={dynamicTripType || undefined}
                        initialResult={dynamicResult}
                    />
                )}
                {mode === 'driver' && <ActingDriverCalculator />}
                {mode === 'relocation' && <RelocationCalculator />}
            </div>
        </div>
    );
};

export default Calculator;
