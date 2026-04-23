import React, { useState, useEffect, useId } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import {
    MapPin,
    Clock,
    Car,
    AlertCircle,
    CheckCircle2,
    Plus,
    ChevronUp,
    ChevronDown,
    Share2,
    UserCheck,
    Truck,
    RotateCcw,
    ArrowLeft,
    X,
    Check,
    TrendingUp,
    Copy,
    MessageSquare,
} from 'lucide-react';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
import { calculateDistance } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { estimatePermitCharge } from '../utils/permits';
import { estimateParkingCharge } from '../utils/parking';
import { calculateFare } from '../utils/fare';
import { calculateFareAsync } from '../utils/fareWorkerWrapper';
import { VEHICLES } from '../config/vehicleRates';
import { TRIP_LIMITS } from '../config/tariff_config';
import { Analytics } from '../utils/monitoring';
import { isHillStationLocation } from '../utils/locationUtils';
import AdditionalChargesDrawer from './AdditionalChargesDrawer';
import SEOHead from './SEOHead';
import CalculatorFAQ from './CalculatorFAQ';


// Define result type based on calculation output
type FareResult = ReturnType<typeof calculateFare>;

import { useAdProtection } from '../hooks/useAdProtection';
import { canCalculateFare, incrementCalcCount, calcLimitForPlan, openUpgradeModal } from '../utils/planGate';

import { generateTripSchema } from '../utils/seoSchema';

// --- Seo Fare Display Component (New Request) ---
interface SeoFareResult {
    fare: number;
    details: string[];
}
interface SeoTripData {
    pickup: string;
    drop: string;
    distance: string;
    vehicle: string;
    type: 'oneway' | 'roundtrip' | 'local' | 'airport';
    days?: string;
    durationHours?: number;
    hourlyPackage?: string;
}


const SeoFareDisplay = ({ result, tripData, onEdit }: { result: SeoFareResult, tripData: SeoTripData, onEdit: () => void }) => {
    if (!result) return null;

    const { details, fare } = result;

    // Generate Schema for Landing View
    const schema = generateTripSchema({
        pickup: tripData.pickup,
        drop: tripData.drop,
        distance: tripData.distance,
        vehicle: tripData.vehicle,
        amount: fare,
        tripType: tripData.type
    });

    const vehicle = VEHICLES.find(v => v.id === tripData.vehicle);
    const isTruck = vehicle?.type === 'Truck';
    const pCity = (tripData.pickup || 'Location').split(',')[0];
    const dCity = (tripData.drop || 'Location').split(',')[0];
    const vRaw = tripData.vehicle || 'Cab';
    const vehicleName = vRaw.charAt(0).toUpperCase() + vRaw.slice(1);

    const title = `${fare} INR - ${isTruck ? 'Truck' : 'Cab'} from ${pCity} to ${dCity} Fare Estimate (${vehicleName})`;
    const description = `Get exact ${isTruck ? 'load vehicle' : 'cab'} fare from ${pCity} to ${dCity}. ${vehicleName} price is ₹${fare} approx for ${tripData.distance} km. Best rates for Outstation & Local trips with Sarathi Book.`;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
            <SEOHead
                title={title}
                description={description}
                schema={schema}
            />
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                    Trip Estimate Details
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {tripData.type === 'roundtrip' ? 'Round Trip' : 'Drop Trip'}
                    </span>
                </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Trip Information */}
                <div className="space-y-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                {isTruck ? <Truck size={14} /> : <Car size={14} />}
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vehicle</p>
                                <p className="text-xs font-black text-slate-800 capitalize">{tripData.vehicle}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                <MapPin size={14} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Route</p>
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-xs font-bold text-slate-800">{tripData.pickup}</p>
                                    <div className="pl-1 border-l-2 border-slate-200 ml-1 py-0.5">
                                        <p className="text-[9px] text-slate-400 font-medium pl-2">{tripData.distance} km approx</p>
                                    </div>
                                    <p className="text-xs font-bold text-slate-800">{tripData.drop}</p>
                                </div>
                            </div>
                        </div>

                        {tripData.type === 'roundtrip' && (
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Clock size={14} />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Duration</p>
                                    <p className="text-xs font-black text-slate-800">{tripData.days} Days</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Fare Breakdown Table */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-5">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                        Fare Breakdown
                    </h3>
                    <div className="space-y-3">
                        {Array.isArray(details) && details.map((line: string, i: number) => {
                            const cleanLine = line.replace(/[*_]/g, '').replace(/⚠️/g, '').trim();
                            if (!cleanLine || cleanLine.toLowerCase().startsWith('note:')) return null;

                            const parts = cleanLine.split(/[:=]\s+₹(?=\d)/);
                            return (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-600 font-medium">{parts[0]}</span>
                                    {parts.length === 2 && <span className="text-slate-900 font-bold">₹{parts[1]}</span>}
                                </div>
                            );
                        })}

                        <div className="pt-3 mt-2 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Total Estimated</span>
                            <span className="text-xl font-black text-primary">₹{(fare || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right font-medium">Click customize to add options like GST</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-center">
                <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white shadow-md rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
                >
                    <RotateCcw size={14} />
                    Edit / Customize Trip
                </button>
            </div>
        </div>
    );
};

// --- 1. Cab Calculator Component ---
interface CabProps {
    initialPickup?: string;
    initialDrop?: string;
    initialTripType?: 'oneway' | 'roundtrip' | 'local' | 'airport';
    initialResult?: { fare: number; details: string[]; breakdown: FareResult & { total: number }; distance: number; vehicle: string; totalFare: number; }; // Expanded type
    initialDistance?: string; // Add this
    initialVehicle?: string; // Add this
}

const CabCalculator: React.FC<CabProps> = ({ initialPickup, initialDrop, initialTripType, initialResult, initialDistance, initialVehicle }) => {
    const { settings } = useSettings();
    const [calcLimitHit, setCalcLimitHit] = useState(false);
    const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'local' | 'airport'>('oneway');
    const [pickup, setPickup] = useState(initialPickup || '');
    const [drop, setDrop] = useState(initialDrop || '');
    // Landing View Mode: If we have enough info to show a result immediately, start in 'Landing View'
    const [isLandingView, setIsLandingView] = useState(() => {
        return !!(initialPickup && initialDrop && initialResult)
            || !!(initialPickup && initialDrop && initialDistance); // If we have distance, we can auto-calc
    });


    useEffect(() => {
        if (initialPickup && initialDrop && (initialResult || initialDistance)) {
            setIsLandingView(true);
        }
    }, [initialPickup, initialDrop, initialResult, initialDistance]); // Re-trigger on deep link change
    useEffect(() => {
        if (initialPickup) setPickup(initialPickup);
        if (initialDrop) setDrop(initialDrop);
        if (initialTripType) setTripType(initialTripType);
    }, [initialPickup, initialDrop, initialTripType]);

    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<string>(initialDistance || '');
    const [days, setDays] = useState<string>('1');
    const [selectedVehicle, setSelectedVehicle] = useState<string>(initialVehicle || '');
    const [customRate, setCustomRate] = useState<number>(0);
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

    // Parse URL Query Params for Deep Linking / SEO
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlPickup = params.get('pickup') || params.get('from');
        const urlDrop = params.get('drop') || params.get('to');
        const urlDist = params.get('distance') || params.get('km') || params.get('dist');
        const urlVehicle = params.get('vehicle') || params.get('car') || params.get('veh');
        const urlType = params.get('type') || params.get('tripType');
        const urlDays = params.get('days');

        if (urlPickup) setPickup(urlPickup);
        if (urlDrop) setDrop(urlDrop);

        if (urlDist) {
            setDistance(urlDist);
            // If we have enough info, enable landing view for SEO
            if (urlPickup && urlDrop) {
                setIsLandingView(true);
            }
        }

        if (urlVehicle) {
            // Check if vehicle exists in config
            const valid = VEHICLES.some(v => v.id === urlVehicle);
            if (valid) setSelectedVehicle(urlVehicle);
        } else if (urlDist) {
            // Default to Sedan if not specified but likely an SEO link
            setSelectedVehicle('sedan');
        }

        if (urlType && ['oneway', 'roundtrip', 'local', 'airport'].includes(urlType)) {
            setTripType(urlType as 'oneway' | 'roundtrip' | 'local' | 'airport');
        }

        if (urlDays) setDays(urlDays);

    }, []);

    // Hourly / Local Package State
    const [hourlyPackage, setHourlyPackage] = useState<string>('');
    const [durationHours, setDurationHours] = useState<number>(0);

    // Auto-update inputs when package changes
    useEffect(() => {
        if (hourlyPackage === '2hr_20km') {
            setDurationHours(2);
            setDistance('20');
        } else if (hourlyPackage === '4hr_40km') {
            setDurationHours(4);
            setDistance('40');
        } else if (hourlyPackage === '8hr_80km') {
            setDurationHours(8);
            setDistance('80');
        } else if (hourlyPackage === '12hr_120km') {
            setDurationHours(12);
            setDistance('120');
        }
    }, [hourlyPackage]);

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
    const [extraItems, setExtraItems] = useState<{ description: string, amount: number }[]>([]);

    const handleMapSelect = (pickupAddr: string, dropAddr: string, dist: number, tollAmt?: number, pickupLat?: number, pickupLng?: number, dropLat?: number, dropLng?: number) => {
        setPickup(pickupAddr);
        setDrop(dropAddr);
        if (pickupLat && pickupLng) setPickupCoords({ lat: pickupLat, lng: pickupLng });
        if (dropLat && dropLng) setDropCoords({ lat: dropLat, lng: dropLng });
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
                            const estDays = Math.max(1, Math.ceil(totalDist / TRIP_LIMITS.max_km_per_day));
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
                                const estDays = Math.max(1, Math.ceil(totalDist / TRIP_LIMITS.max_km_per_day));
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
                const isHeavy = ['tempo', 'minibus', 'bus'].some(t => vehicle.id.includes(t)) || vehicle.type === 'Truck';

                if (tripType === 'roundtrip') {
                    const d = parseInt(days) || 1;
                    batta = vehicle.batta * d;
                } else if (tripType === 'oneway') {
                    // Calculate days for drop trip based on max km per day
                    const estDays = Math.max(1, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
                    batta = (dist > 40 || isHeavy) ? vehicle.batta * estDays : 0;
                }
                setDriverBata(batta.toString());
            }
        } else {
            setCustomRate(0);
        }
    }, [selectedVehicle, tripType, days, manualDriverBata, distance]);

    const calculate = async () => {
        if (!selectedVehicle) return; // Require vehicle selection
        if (tripType === 'local' && !hourlyPackage) return; // Require package selection
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
            let baseHours = 8;
            if (hourlyPackage === '2hr_20km') baseHours = 2;
            if (hourlyPackage === '4hr_40km') baseHours = 4;
            if (hourlyPackage === '12hr_120km') baseHours = 12;

            calcExtraHours = Math.max(0, durationHours - baseHours);
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
                parseFloat(nightCharge),
                hourlyPackage // NEW ARGUMENT for worker
            );

            const permitTotal = parseFloat(permit) || 0;
            const parkingTotal = parking ? parseFloat(parking) : 0;
            const tollTotal = toll ? parseFloat(toll) : 0;
            const extraItemsTotal = extraItems.reduce((acc, item) => acc + (item.amount || 0), 0);
            const otherExtras = permitTotal + parkingTotal + tollTotal + extraItemsTotal;

            const finalTotal = res.totalFare + otherExtras;

            const fullBreakdown = [...res.breakdown];

            if (permitTotal > 0) fullBreakdown.push(`Permit Charges: ₹${(permitTotal || 0).toLocaleString()}`);
            if (parkingTotal > 0) fullBreakdown.push(`Parking Charges: ₹${(parkingTotal || 0).toLocaleString()}`);
            if (tollTotal > 0) fullBreakdown.push(`Toll Charges: ₹${(tollTotal || 0).toLocaleString()}`);
            extraItems.forEach(item => {
                if (item.amount > 0) fullBreakdown.push(`${item.description}: ₹${(item.amount || 0).toLocaleString()}`);
            });

            Analytics.calculateFare(serviceType, selectedVehicle, dist, pickup, drop, Math.round(finalTotal));

            incrementCalcCount();
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
    // AUTO-CALCULATE FARE INSTANTLY
    useEffect(() => {
        // Only auto-calc if we DON'T have an initial result loaded, OR if user changed inputs
        if (initialResult && distance === initialResult.distance.toString() && selectedVehicle === initialResult.vehicle) {
            // Do nothing, let initial result persist
        } else {
            if (distance || tripType === 'local') {
                if (!canCalculateFare(settings)) {
                    setCalcLimitHit(true);
                    setResult(null);
                } else {
                    setCalcLimitHit(false);
                    calculate();
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [distance, tripType, days, selectedVehicle, customRate, hillStationCharge, petCharge, toll, permit, parking, garageBuffer, driverBata, nightCharge, hourlyPackage, durationHours, extraItems, manualDriverBata, initialResult]);

    // Handle vehicle selection reset
    useEffect(() => {
        if (tripType === 'oneway' && ['tempo', 'minibus', 'bus'].includes(selectedVehicle)) {
            setSelectedVehicle('');
        }
    }, [tripType, selectedVehicle]);

    // Calculate total additional charges
    const extraItemsTotal = extraItems.reduce((acc, item) => acc + (item.amount || 0), 0);
    const totalExtras = (parseFloat(driverBata) || 0) + (parseFloat(toll) || 0) + (parseFloat(parking) || 0) + (parseFloat(permit) || 0) + (parseFloat(hillStationCharge) || 0) + (parseFloat(petCharge) || 0) + (parseFloat(nightCharge) || 0) + extraItemsTotal;

    const minDays = (tripType === 'roundtrip' && distance) ? Math.max(1, Math.ceil((parseFloat(distance) - 50) / TRIP_LIMITS.max_km_per_day)) : 1;

    const vehicleSelector = (
        <div className={`grid grid-cols-1 ${tripType !== 'local' ? 'sm:grid-cols-2' : ''} gap-3`}>
            <div className="space-y-1">
                <Label icon={<Car size={10} />} text="Vehicle" htmlFor="cab-vehicle" />
                <select
                    id="cab-vehicle"
                    value={selectedVehicle}
                    onChange={e => setSelectedVehicle(e.target.value)}
                    className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                >
                    <option value="" disabled>Select Vehicle Type</option>
                    {VEHICLES.filter(v => {
                        if (tripType === 'oneway') {
                            return !['tempo', 'minibus', 'bus'].includes(v.id);
                        }
                        return true;
                    }).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
            </div>

            {tripType !== 'local' && (
                <Input
                    label="Rate/Km"
                    icon={<TrendingUp size={10} />}
                    value={customRate}
                    onChange={(val) => setCustomRate(Number(val))}
                    type="number"
                    highlight
                />
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Calc limit banner */}
            {calcLimitHit && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
                    <p className="text-sm font-black text-blue-900 uppercase tracking-tight">
                        Monthly Limit Reached ({calcLimitForPlan(settings)}/month)
                    </p>
                    <p className="text-xs text-blue-600 font-medium">Upgrade to Pro for 80 calculations or Super for unlimited.</p>
                    <button
                        onClick={openUpgradeModal}
                        className="mt-1 bg-blue-600 text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        Upgrade Now
                    </button>
                </div>
            )}

            {/* Default SEO for Calculator Page */}
            {!isLandingView && (
                <SEOHead
                    title="Cab Fare Calculator India - Estimate Cab Rates Online"
                    description="Calculate accurate cab fares in India for Drop Trips, Round Trips, and Local Hourly Rentals. Get price estimates with driver batta, tolls, and permit charges included."
                />
            )}

            {/* Landing View (SEO Page) */}
            {isLandingView && result && (
                <SeoFareDisplay
                    result={result}
                    tripData={{
                        pickup,
                        drop,
                        distance,
                        vehicle: selectedVehicle,
                        type: tripType,
                        days
                    }}
                    onEdit={() => setIsLandingView(false)}
                />
            )}

            {/* Input Section - Hidden in Landing View */}
            {!isLandingView && (
                <div className="space-y-4 animate-fade-in peer">
                    <div className="flex p-1 bg-slate-50 rounded-xl" role="group" aria-label="Trip type selection">
                        {(['oneway', 'roundtrip', 'local'] as const).map((t) => {
                            return (
                                <button
                                    key={t}
                                    onClick={() => {
                                        if (t !== tripType) {
                                            setResult(null);
                                            if (tripType === 'local' || t === 'local') {
                                                setPickup('');
                                                setDrop('');
                                                setPickupCoords(null);
                                                setDropCoords(null);
                                                setDistance('');
                                            }
                                            setTripType(t);
                                        }
                                    }}
                                    aria-pressed={tripType === t}
                                    aria-label={t === 'oneway' ? 'Drop Trip' : (t === 'local' ? 'Local Package' : 'Outstation')}
                                    className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all 
                                            ${tripType === t ? 'bg-white text-primary shadow-sm border-2 border-primary' : 'text-slate-600 hover:text-slate-900 border-2 border-transparent'}
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
                                value={pickup}
                                onChange={(val) => {
                                    setPickup(val);
                                    // Clear coords if user is manually typing to prevent stale calc
                                    if (pickupCoords) setPickupCoords(null);
                                    setResult(null);
                                    setDistance('');
                                }}
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
                                    value={drop}
                                    onChange={(val) => {
                                        setDrop(val);
                                        // Clear coords if user is manually typing to prevent stale calc
                                        if (dropCoords) setDropCoords(null);
                                        setResult(null);
                                        setDistance('');
                                    }}
                                    onPlaceSelected={(place) => {
                                        setDrop(place.address);
                                        setDropCoords({ lat: place.lat, lng: place.lng });
                                }}
                                    onMapClick={() => setShowMap(true)}
                                    placeholder="Start typing..."
                                />
                            )}
                        </div>

                        {/* Local Package Flow: Vehicle First */}
                        {tripType === 'local' && vehicleSelector}

                        <div className="space-y-1">
                            {tripType === 'local' ? (
                                <div className="space-y-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Select Package</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none snap-x">
                                            {[
                                                { id: '2hr_20km', hr: '2 Hr', km: '20 Km' },
                                                { id: '4hr_40km', hr: '4 Hr', km: '40 Km' },
                                                { id: '8hr_80km', hr: '8 Hr', km: '80 Km', label: 'Std' },
                                                { id: '12hr_120km', hr: '12 Hr', km: '120 Km' },
                                                { id: 'custom', hr: 'Custom', km: 'Trip' }
                                            ].map(pkg => (
                                                <button
                                                    key={pkg.id}
                                                    onClick={() => setHourlyPackage(pkg.id)}
                                                    className={`min-w-[70px] shrink-0 flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all snap-start
                                                        ${hourlyPackage === pkg.id
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 ring-1 ring-blue-600 ring-offset-1'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}
                                                        ${!selectedVehicle ? 'opacity-50 cursor-not-allowed' : ''}
                                                    `}
                                                    disabled={!selectedVehicle}
                                                >
                                                    {pkg.label && (
                                                        <span className={`text-[8px] font-black uppercase tracking-wider mb-0.5 ${hourlyPackage === pkg.id ? 'text-blue-200' : 'text-blue-600'}`}>
                                                            {pkg.label}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-black uppercase tracking-wider leading-none">{pkg.hr}</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider leading-none mt-1 ${hourlyPackage === pkg.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                                        {pkg.km}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {hourlyPackage !== 'custom' ? (
                                        <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex-1 text-center border-r border-slate-100">
                                                <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Includes</p>
                                                <p className="text-base font-black text-slate-700">{distance} KM</p>
                                            </div>
                                            <div className="flex-1 text-center">
                                                <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Duration</p>
                                                <p className="text-base font-black text-slate-700">{durationHours} HRS</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 pt-1">
                                            <Input
                                                label="Duration (Hrs)"
                                                icon={<Clock size={10} />}
                                                value={durationHours}
                                                onChange={(v) => {
                                                    const val = Number(v);
                                                    setDurationHours(val > 24 ? 24 : val);
                                                }}
                                                type="number"
                                            />
                                            <div className="space-y-1">
                                                <Label icon={<TrendingUp size={10} />} text="Distance (Km)" htmlFor="local-dist" />
                                                <input
                                                    id="local-dist"
                                                    type="number"
                                                    value={distance}
                                                    onChange={(e) => setDistance(e.target.value)}
                                                    className="tn-input h-10 w-full bg-white border-slate-200 text-xs shadow-sm focus:border-blue-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label icon={<TrendingUp size={10} />} text="Distance (Km)" htmlFor="cab-distance" />
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
                                                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" aria-hidden="true"></div>
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
                                    <Label icon={<Clock size={10} />} text="Trip Duration" htmlFor="cab-days" />
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

                        {tripType !== 'local' && vehicleSelector}

                        {(tripType === 'roundtrip' || (tripType === 'oneway' && parseFloat(distance) > 30)) && (
                            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <input
                                    type="checkbox"
                                    checked={garageBuffer}
                                    onChange={(e) => setGarageBuffer(e.target.checked)}
                                    className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    title="Garage Buffer"
                                />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Add Garage Buffer (20km)</span>
                            </label>
                        )}
                    </div>

                    {/* Transparency Section */}
                    {pickup && drop && (
                        <div className="sr-only">
                            <h4>0% Service Commission</h4>
                            <p>Sarathi Book estimates are derived directly from cab associations, ensuring you pay one fair, direct price.</p>
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
                        extraItems={extraItems} setExtraItems={setExtraItems}
                    />
                </div>
            )}

            {/* Standard Result Card - Only show if valid result AND NOT in Landing View (since SeoFareDisplay handles that) */}
            {(result || initialResult) && !isLandingView && (
                <div id="result-card-container">
                    <ResultCard
                        title="Cab Fare"
                        amount={result ? result.fare : initialResult!.totalFare}
                        details={result ? result.details : initialResult!.details}
                        sub="Tolls & Permits Included (Approx)"
                        tripData={{
                            pickup,
                            drop,
                            distance,
                            vehicle: selectedVehicle,
                            type: tripType,
                            days,
                            durationHours,
                            hourlyPackage,
                            charges: {
                                toll, parking, permit, driverBatta: driverBata, nightBata: nightCharge, hillStation: hillStationCharge, petCharge, extraItems
                            }
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
    const { settings } = useSettings();
    const { triggerAction } = useAdProtection();

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

    const handleCalculate = () => {
        if (!canCalculateFare(settings)) {
            alert(`Calculation limit reached (${calcLimitForPlan(settings)}/month). Upgrade for more.`);
            openUpgradeModal();
            return;
        }
        incrementCalcCount();
        triggerAction(calculate);
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
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        8 Hrs<br />80 KM
                    </button>
                    <button
                        onClick={() => setServiceType('local12')}
                        aria-pressed={serviceType === 'local12'}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'local12'
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        12 Hrs<br />120 KM
                    </button>
                    <button
                        onClick={() => setServiceType('outstation')}
                        aria-pressed={serviceType === 'outstation'}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${serviceType === 'outstation'
                            ? 'bg-primary text-white shadow-lg'
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
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${foodProvided ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                                {foodProvided && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700">Food Provided by Customer</span>
                                <p className="text-[9px] text-slate-500">If not, ₹400/day bata will be charged</p>
                            </div>
                        </button>

                        <button onClick={() => setStayProvided(!stayProvided)} aria-pressed={stayProvided} className="flex items-center gap-3 w-full text-left">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${stayProvided ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
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

            <Button onClick={handleCalculate} disabled={!days} text="Calculate Driver Cost" ariaLabel="Calculate Acting Driver Cost" />
            <React.Suspense fallback={null}>
            </React.Suspense>

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
    const { settings } = useSettings();
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

    const { triggerAction } = useAdProtection();


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

    const handleCalculate = () => {
        if (!canCalculateFare(settings)) {
            alert(`Calculation limit reached (${calcLimitForPlan(settings)}/month). Upgrade for more.`);
            openUpgradeModal();
            return;
        }
        incrementCalcCount();
        triggerAction(calculate);
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
                                ? 'bg-primary text-white shadow-lg'
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
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${fuelIncluded ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                                {fuelIncluded && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-700">Fuel Provided by Customer</span>
                            <p className="text-[9px] text-slate-500">If not, estimated fuel cost will be charged</p>
                        </div>
                    </button>

                    <button onClick={() => setTollsIncluded(!tollsIncluded)} aria-pressed={tollsIncluded} className="flex items-center gap-3 w-full text-left">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tollsIncluded ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                                {tollsIncluded && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-700">Tolls Paid by Customer</span>
                            <p className="text-[9px] text-slate-500">If not, estimated toll charges will be added</p>
                        </div>
                    </button>

                    <button onClick={() => setDriverReturnIncluded(!driverReturnIncluded)} aria-pressed={driverReturnIncluded} className="flex items-center gap-3 w-full text-left">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${driverReturnIncluded ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                                {driverReturnIncluded && <CheckCircle2 size={14} className="text-white" aria-hidden="true" />}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-700">Driver Return Arranged by Customer</span>
                            <p className="text-[9px] text-slate-500">If not, ₹500 return ticket will be charged</p>
                        </div>
                    </button>
                </div>
            </div>

            <Button onClick={handleCalculate} disabled={!distance} text="Calculate Relocation Cost" ariaLabel="Calculate Vehicle Relocation Cost" />
            <React.Suspense fallback={null}>
            </React.Suspense>

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
            <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs ${highlight ? 'font-black text-primary' : ''}`} />
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
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel || text} className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-[10px]">
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
        durationHours?: number;
        hourlyPackage?: string;
        charges?: {
            toll: string;
            parking: string;
            permit: string;
            driverBatta: string;
            nightBata: string;
            hillStation: string;
            petCharge: string;
            extraItems: { description: string; amount: number }[];
        };
    };
}

const ResultCard = ({ title, amount, details, sub, tripData }: ResultCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const [includeGst, setIncludeGst] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const [copied, setCopied] = useState(false);

    // Ad Logic
    const { triggerAction } = useAdProtection();


    const gstAmount = Math.round(amount * 0.05);
    const finalAmount = includeGst ? amount + gstAmount : amount;

    const buildShareText = () => {
        const cleanDetails = Array.isArray(details)
            ? details.map(line => line.replace(/[*_]/g, '').replace(/⚠️/g, '').trim()).join('\n')
            : details;
        let text = `${title}\n\n${cleanDetails}`;
        if (includeGst) text += `\nGST (5%): ₹${gstAmount.toLocaleString()}`;
        text += `\n\nNote: ${sub}\n\nTotal: ₹${finalAmount.toLocaleString()}\n\n— SarathiBook App`;
        return text;
    };

    const handleShare = async () => {
        const text = buildShareText();
        if (navigator.share) {
            try {
                await navigator.share({ title, text });
                return;
            } catch {
                // user cancelled or not supported, fall through to sheet
            }
        }
        setShowShareSheet(true);
    };

    const shareToWhatsApp = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareText())}`, '_blank');
        setShowShareSheet(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(buildShareText()).then(() => {
            setCopied(true);
            setTimeout(() => { setCopied(false); setShowShareSheet(false); }, 1500);
        });
    };

    if (!amount) return null;

    // AEO/SEO Logic: Construct detailed answer for search engines
    const seoData = tripData ? (() => {
        const pCity = (tripData.pickup || 'Location').split(',')[0];
        const dCity = (tripData.drop || 'Location').split(',')[0];
        const vRaw = tripData.vehicle || 'Cab';
        const vehicleName = vRaw.charAt(0).toUpperCase() + vRaw.slice(1);

        let extras = '';
        if (Array.isArray(details)) {
            const extraItems = details.filter(d => typeof d === 'string' && d.toLowerCase().match(/(toll|permit|bata|allowance|night)/));
            if (extraItems.length > 0) {
                extras = 'Includes ' + extraItems.map(e => (typeof e === 'string' ? e.split(/[:=]/)[0].trim() : '')).join(', ') + '.';
            }
        }

        const schema = generateTripSchema({
            pickup: tripData.pickup,
            drop: tripData.drop,
            distance: tripData.distance,
            vehicle: tripData.vehicle,
            amount: amount,
            tripType: tripData.type
        });

        return {
            title: `${amount} INR - Cab from ${pCity} to ${dCity} Fare Estimate (${vehicleName})`,
            description: `Get exact cab fare from ${pCity} to ${dCity}. ${vehicleName} Taxi price is ₹${amount} approx for ${tripData.distance} km. ${extras} Best rates for Outstation & Local trips with Sarathi Book.`,
            schema: schema
        };
    })() : null;


    return (
        <>
            {seoData && (
                <SEOHead
                    title={seoData.title}
                    description={seoData.description}
                    schema={seoData.schema}
                />
            )}
            <React.Suspense fallback={null} />

            {/* Backdrop when expanded */}
            {expanded && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-90"
                    onClick={() => setExpanded(false)}
                />
            )}

            {/* Sticky Floating Card */}
            <div className={`fixed bottom-[90px] left-3 right-3 md:left-auto md:right-6 md:w-96 bg-white z-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[85vh]' : 'h-auto'}`}>

                {/* Drag handle — only when expanded */}
                {expanded && (
                    <div className="flex justify-center pt-2 pb-1 cursor-pointer" onClick={() => setExpanded(false)}>
                        <div className="w-8 h-1 bg-slate-300 rounded-full" />
                    </div>
                )}

                {/* Header — always visible */}
                <div className="px-4 py-3 flex flex-col items-center gap-2">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{title}</p>
                        <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
                            <span className="text-2xl font-black text-primary">₹{finalAmount.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-medium">approx</span>
                            {!includeGst && <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Excl. GST</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { expanded ? setExpanded(false) : triggerAction(() => setExpanded(true)); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-600 active:scale-95 transition-all"
                        >
                            {expanded ? 'Hide Details' : 'View Details'}
                            {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#25D366] text-white active:scale-95 transition-all shadow-sm"
                            title="Share"
                        >
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Expanded breakdown */}
                {expanded && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="h-px bg-slate-100 mx-4" />
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-3 pb-1">
                            {Array.isArray(details) ? (
                                <>
                                    {details.map((line: string, i: number) => {
                                        const cleanLine = line.replace(/[*_]/g, '').replace(/⚠️/g, '').trim();
                                        if (!cleanLine || cleanLine.toLowerCase().startsWith('note:')) return null;
                                        const parts = cleanLine.split(/[:=]\s+₹(?=\d)/);
                                        return (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                <span className="text-[11px] font-bold text-slate-600">{parts[0]}</span>
                                                {parts.length === 2 && <span className="text-[11px] font-black text-slate-900">₹{parts[1]}</span>}
                                            </div>
                                        );
                                    })}

                                    {/* GST */}
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 cursor-pointer" onClick={() => setIncludeGst(!includeGst)}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${includeGst ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                                                {includeGst && <Check size={10} className="text-white" />}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700 select-none">Add GST (5%)</span>
                                        </div>
                                        {includeGst && <span className="text-[11px] font-black text-primary">₹{gstAmount.toLocaleString()}</span>}
                                    </div>

                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-3 pb-2 border-t-2 border-slate-100 mt-2">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-xl font-black text-primary">₹{finalAmount.toLocaleString()}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-slate-600 font-medium leading-relaxed py-2">{details}</p>
                            )}

                            {/* Note */}
                            <div className="bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg flex gap-2 mb-3">
                                <AlertCircle size={13} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-600 font-medium leading-relaxed">{sub}</p>
                            </div>
                        </div>

                        {/* Share */}
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                            <button
                                onClick={handleShare}
                                className="w-full bg-[#25D366] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow active:scale-95 transition-all"
                            >
                                <Share2 size={18} />
                                Share to Customer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Share Sheet */}
            {showShareSheet && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
                    onClick={() => setShowShareSheet(false)}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
                        <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Send Estimate To Customer</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={shareToWhatsApp}
                                className="flex flex-col items-center justify-center gap-2 bg-[#25D366] text-white rounded-2xl py-6 active:scale-95 transition-all shadow"
                            >
                                <MessageSquare size={32} />
                                <span className="text-base font-black">WhatsApp</span>
                            </button>

                            <button
                                onClick={copyToClipboard}
                                className="flex flex-col items-center justify-center gap-2 bg-slate-700 text-white rounded-2xl py-6 active:scale-95 transition-all shadow"
                            >
                                {copied ? <Check size={32} /> : <Copy size={32} />}
                                <span className="text-base font-black">{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowShareSheet(false)}
                            className="w-full mt-4 py-3 text-sm font-black text-slate-400 uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

interface CalculatorProps {
    initialPickup?: string;
    initialDrop?: string;
}

// --- Main Container ---
const Calculator: React.FC<CalculatorProps> = ({ initialPickup, initialDrop }) => {
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

    // Top-Level State for managing "Service Modes" (Cab vs Driver vs Relocation)
    // We default to 'cab' if initial props are present
    const [mode, setMode] = useState<'cab' | 'driver' | 'relocation' | null>(() => {
        if (initialPickup || initialDrop) return 'cab';
        const path = window.location.pathname.split('/')[2];
        return (path as 'cab' | 'driver' | 'relocation') || null;
    });

    // URL Parameter Handling for Deep Linking / SEO Landing Pages
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from');
        const to = params.get('to');
        const dist = params.get('dist');
        const veh = params.get('veh');
        const type = params.get('type');

        if (from && to) {
            setDynamicRoute({ pickup: from, drop: to });
            setDynamicTripType((type as 'oneway' | 'roundtrip' | 'local' | 'airport') || 'oneway');
            setMode('cab'); // Automatically enter cab mode

            // If we have distance and vehicle from URL (Speedy Result), construct result immediately
            if (dist && veh) {
                // We don't have the full breakdown, but we can try to reconstruct a basic valid result state 
                // to trick the CabCalculator into showing something while it (maybe) refines it.
                // Actually, CabCalculator's 'initialResult' takes priority.
                // Let's rely on CabCalculator to read these props and auto-calculate if it has distance.
                // Wait, CabCalculator currently only reads 'initialResult'.
                // We will simply pass the raw distance as a "partial" initial result to trigger its internal logic?
                // No, better to let CabCalculator handle "Search Params" itself OR 
                // we construct a "Simulated" initial result here if we trust the URL.

                // If the user clicked a "Trending Route", we trust the URL's distance.
                // We can create a fake 'initialResult' with the distance.
                // const d = parseFloat(dist);
                // const v = veh || 'sedan';

                // However, we don't have the fare.
                // If we want "Instant Page Load", we should ideally have the fare in URL too, but that makes URL ugly/long.
                // Best approach: Pass these as props to CabCalculator and let it "Auto Calculate" instantly 
                // without needing geocoding because distance is provided!
            }
        }
    }, []);

    // Helper to shorten city names
    // Helper for short city names (Unused in Table View)
    // const shortCity = (address: string) => {
    //    return address.split(',')[0].trim();
    // };
    const [dynamicRoute, setDynamicRoute] = useState<{ pickup: string, drop: string } | null>(null);

    const [dynamicTripType, setDynamicTripType] = useState<'oneway' | 'roundtrip' | 'local' | 'airport' | null>(null);
    // New State for explicit params (Fixes auto-landing view issue)
    const [dynamicParams, setDynamicParams] = useState<{ dist?: string, veh?: string } | null>(null);
    const [dynamicResult, setDynamicResult] = useState<{ fare: number; details: string[]; breakdown: FareResult & { total: number }; distance: number; vehicle: string; totalFare: number; } | null>(null);
    // Listen for route changes within calculators
    useEffect(() => {
        const handleRouteUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            setDynamicRoute(customEvent.detail);
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
            const cleanPath = mode ? `/taxi-fare-calculator/${mode}` : '/taxi-fare-calculator';
            window.history.replaceState(null, '', `${cleanPath}${newSearch ? '?' + newSearch : ''}`);
        }
    }, [dynamicRoute, mode]);

    // Sync mode with URL but PRESERVE search parameters (for auto-fill)
    useEffect(() => {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const cleanPath = mode ? `/taxi-fare-calculator/${mode}` : '/taxi-fare-calculator';
        const newUrl = cleanPath + currentSearch;

        if (currentPath !== cleanPath) {
            window.history.replaceState(null, '', newUrl);
        }
    }, [mode]);

    // Handle initial mount and browser back/forward
    useEffect(() => {
        const parseUrlParams = () => {
            const path = window.location.pathname.split('/')[2];
            const initialMode = (path as 'cab' | 'driver' | 'relocation') || null;
            if (initialMode && SERVICES.some(s => s.id === initialMode)) {
                setMode(initialMode);
                const params = new URLSearchParams(window.location.search);
                const from = params.get('from');
                const to = params.get('to');
                if (from && to) setDynamicRoute({ pickup: from, drop: to });
                const type = params.get('type');
                if (type) setDynamicTripType(type as 'oneway' | 'roundtrip' | 'local' | 'airport');
                const dist = params.get('dist');
                const veh = params.get('veh');
                if (dist) setDynamicParams({ dist: dist, veh: veh || undefined });
            } else {
                setMode(null);
            }
        };

        parseUrlParams(); // Run on mount

        const handlePopState = () => parseUrlParams();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!mode) {
        return (
            <div className="max-w-3xl mx-auto pb-24 px-4 space-y-6">
                <SEOHead
                    title="Cab Fare Calculator India | Estimate Taxi Price & Driver Bata"
                    description="Calculate accurate cab fares for local, outstation, and round trips in India. Get instant price estimates for Hatchback, Sedan, SUV, and Tempo Traveller including tolls, permits, and driver bata."
                    schema={{
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Sarathi Book Cab Calculator",
                        "applicationCategory": "TravelApplication",
                        "operatingSystem": "Web",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "INR"
                        },
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.8",
                            "ratingCount": "1250"
                        },
                        "description": "Calculate taxi and cab fares for local and outstation trips in India."
                    }}
                />

                <div className="text-center py-6">
                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-tight">Fare Calculator</h1>
                    <p className="text-slate-600 text-xs font-medium mt-1">Select a service to start calculation</p>

                    {/* Hidden H2 for SEO structure but visible to bots */}
                    <div className="sr-only">
                        <h2>Calculate Cab Rates for Outstation and Local Trips</h2>
                        <p>
                            Use our advanced cab fare calculator to check cab rates for One Way Drops, Round Trips, and Local Hourly Rentals.
                            We provide detailed fare breakdowns including Driver Bata, Tolls, Permits, and Night Charges for all vehicle types
                            like Sedan, SUV, Innova, and Tempo Traveller.
                        </p>
                    </div>
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
                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                            Fare calculator + GST invoice in 60 seconds. Share a professional quote with your customer before they ask.
                        </p>
                    </div>
                </div>

                {/* Popular Routes Section for SEO/AEO */}
                <div className="pt-4 space-y-4">
                        {/* Informational SEO Content Section */}
                        <div className="pt-12 space-y-8">
                            <section>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-4 leading-none border-l-4 border-primary pl-4">Why use Sarathi Book Calculator?</h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    Our platform provides the most accurate cab fare estimates in India by integrating real-time Google Maps data with localized union tariff rates. Whether you are planning a local city trip, an outstation drop trip, or a multi-day round trip, we provide a complete breakdown of costs including base fare, driver bata, tolls, and state permit charges.
                                </p>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-3">Professional Estimates</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Generate professional-grade fare estimates that you can share directly with customers via WhatsApp or PDF.</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-3">Route Transparency</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">View detailed route information, distance, and estimated travel time before you start your journey.</p>
                                </div>
                            </section>

                            {/* FAQ Section */}
                            <CalculatorFAQ />
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
                        setDynamicParams(null);
                        setDynamicTripType(null);
                        setDynamicResult(null);
                        window.history.pushState({}, '', '/taxi-fare-calculator');
                    }}

                    className="flex items-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
                >
                    <ArrowLeft size={12} className="text-primary" />
                    Change Service
                </button>
                <div className="flex items-center gap-2">
                    {currentService && <currentService.icon size={14} className="text-primary" />}
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
                        initialPickup={dynamicRoute?.pickup || initialPickup}
                        initialDrop={dynamicRoute?.drop || initialDrop}
                        initialTripType={dynamicTripType || undefined}
                        initialResult={dynamicResult || undefined}
                        initialDistance={dynamicParams?.dist || new URLSearchParams(window.location.search).get('dist') || undefined}
                        initialVehicle={dynamicParams?.veh || new URLSearchParams(window.location.search).get('veh') || undefined}
                    />
                )}
                {mode === 'driver' && <ActingDriverCalculator />}
                {mode === 'relocation' && <RelocationCalculator />}
            </div>
        </div >
    );
};

export default Calculator;
