import React, { useState, useEffect } from 'react';
import { MapPin, Car, ArrowRight, RotateCcw, CheckCircle2, Loader2, ChevronRight, TrendingUp, Warehouse } from 'lucide-react';
import PlacesAutocomplete from './PlacesAutocomplete';
import AdditionalChargesDrawer from './AdditionalChargesDrawer';
import MapPicker from './MapPicker';
import SEOHead from './SEOHead';
import CalculatorFAQ from './CalculatorFAQ';
import GoogleSignInButton from './GoogleSignInButton';
import { calculateDistance } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { calculateFare } from '../utils/fare';
import { estimatePermitCharge } from '../utils/permits';
import { estimateParkingCharge } from '../utils/parking';
import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';
import { isHillStationLocation } from '../utils/locationUtils';

const VEHICLES = [
    { id: 'hatchback',   name: 'Hatchback', sub: 'Swift / WagonR' },
    { id: 'sedan',       name: 'Sedan',     sub: 'Dzire / Etios' },
    { id: 'suv',         name: 'SUV',       sub: 'Innova / Ertiga' },
    { id: 'premium_suv', name: 'Premium',   sub: 'Innova Crysta' },
] as const;

type VehicleId = typeof VEHICLES[number]['id'] | '';
type TripType  = 'oneway' | 'roundtrip' | 'local';

const TRIP_TYPES: { id: TripType; label: string }[] = [
    { id: 'oneway',    label: 'One Way' },
    { id: 'roundtrip', label: 'Round Trip' },
    { id: 'local',     label: 'Local Rental' },
];

const LOCAL_PACKAGES = [
    { id: '4hr_40km',   label: '4 Hr / 40 Km' },
    { id: '8hr_80km',   label: '8 Hr / 80 Km' },
    { id: '12hr_120km', label: '12 Hr / 120 Km' },
];

const PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Taxi Fare Calculator India',
    description: 'Free online cab fare calculator for India. Calculate accurate taxi prices for outstation, local, and round trips.',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
};

const PublicFareCalculator: React.FC = () => {
    // ── Core inputs ─────────────────────────────────────────────────────────
    const [tripType, setTripType]         = useState<TripType>('oneway');
    const [pickup,   setPickup]           = useState('');
    const [drop,     setDrop]             = useState('');
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords,   setDropCoords]   = useState<{ lat: number; lng: number } | null>(null);
    const [vehicle,  setVehicle]          = useState<VehicleId>('');
    const [days,     setDays]             = useState('1');
    const [pkg,      setPkg]              = useState('8hr_80km');
    const [distanceKm, setDistanceKm]     = useState('');
    const [rateKm,   setRateKm]           = useState(0);
    const [manualRate, setManualRate]     = useState(false);
    const [garageBuffer, setGarageBuffer] = useState(false);

    // ── Additional charges ───────────────────────────────────────────────────
    const [driverBata,     setDriverBata]     = useState('0');
    const [manualBata,     setManualBata]     = useState(false);
    const [toll,           setToll]           = useState('0');
    const [manualToll,     setManualToll]     = useState(false);
    const [parking,        setParking]        = useState('0');
    const [manualParking,  setManualParking]  = useState(false);
    const [permit,         setPermit]         = useState('0');
    const [manualPermit,   setManualPermit]   = useState(false);
    const [hillStation,    setHillStation]    = useState('0');
    const [manualHill,     setManualHill]     = useState(false);
    const [petCharge,      setPetCharge]      = useState('0');
    const [manualPet,      setManualPet]      = useState(false);
    const [nightCharge,    setNightCharge]    = useState('0');
    const [manualNight,    setManualNight]    = useState(false);
    const [extraItems,     setExtraItems]     = useState<{ description: string; amount: number }[]>([]);
    const [showDrawer,     setShowDrawer]     = useState(false);

    // ── UI state ────────────────────────────────────────────────────────────
    const [calcDist, setCalcDist] = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [result,   setResult]   = useState<{ totalFare: number; breakdown: string[] } | null>(null);
    const [error,    setError]    = useState('');
    const [showMap,  setShowMap]  = useState(false);

    // ── Auto-populate rate when vehicle or tripType changes ─────────────────
    useEffect(() => {
        if (manualRate) return;
        const t = TARIFFS.vehicles[vehicle as keyof typeof TARIFFS.vehicles];
        if (t) setRateKm(tripType === 'roundtrip' ? t.round_trip_rate : t.one_way_rate);
    }, [vehicle, tripType, manualRate]);

    // ── Auto-populate bata when relevant inputs change ───────────────────────
    useEffect(() => {
        if (manualBata) return;
        const t = TARIFFS.vehicles[vehicle as keyof typeof TARIFFS.vehicles];
        if (!t) return;
        const km = parseFloat(distanceKm) || 0;
        let bata = 0;
        if (tripType === 'roundtrip') {
            bata = t.driver_bata * (parseInt(days) || 1);
        } else if (tripType === 'oneway' && km > 40) {
            const estDays = Math.max(1, Math.ceil(km / TRIP_LIMITS.max_km_per_day));
            bata = t.driver_bata * estDays;
        }
        setDriverBata(String(bata));
    }, [vehicle, tripType, days, distanceKm, manualBata]);

    // ── Auto-fill distance + charges when both locations selected ────────────
    useEffect(() => {
        if (tripType === 'local' || !pickupCoords || !dropCoords) return;

        let cancelled = false;
        const run = async () => {
            setCalcDist(true);
            setDistanceKm('');
            if (!manualToll) setToll('0');
            setResult(null);

            try {
                let km = 0;

                const advanced = await calculateAdvancedRoute(pickupCoords, dropCoords);
                if (!cancelled) {
                    if (advanced) {
                        const mult = tripType === 'roundtrip' ? 2 : 1;
                        km = advanced.distanceKm * mult;
                        setDistanceKm(km.toFixed(1));

                        if (advanced.tollPrice > 0 && !manualToll) {
                            const t = tripType === 'roundtrip'
                                ? Math.round(advanced.tollPrice * (parseInt(days) > 1 ? 2 : 1.6))
                                : advanced.tollPrice;
                            setToll(String(t));
                        }
                    } else {
                        const basic = await calculateDistance(pickupCoords, dropCoords);
                        if (basic) {
                            const mult = tripType === 'roundtrip' ? 2 : 1;
                            km = basic.distance * mult;
                            setDistanceKm(km.toFixed(1));
                        }
                    }
                }

                if (!cancelled && km > 0) {
                    // Auto-estimate days for round trips
                    if (tripType === 'roundtrip') {
                        const estDays = Math.max(1, Math.ceil(km / TRIP_LIMITS.max_km_per_day));
                        if (parseInt(days) < estDays) setDays(String(estDays));
                    }

                    // Permit
                    if (!manualPermit) {
                        const p = estimatePermitCharge(pickup, drop, vehicle);
                        setPermit(String(p?.amount || 0));
                    }

                    // Parking
                    if (!manualParking) {
                        const pp = estimateParkingCharge(pickup);
                        const dp = estimateParkingCharge(drop);
                        setParking(String((pp?.amount || 0) + (dp?.amount || 0)));
                    }

                    // Hill station
                    if (!manualHill) {
                        setHillStation(isHillStationLocation(drop) ? '500' : '0');
                    }
                }
            } catch {
                // silent
            } finally {
                if (!cancelled) setCalcDist(false);
            }
        };

        run();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pickupCoords, dropCoords, tripType]);

    // ── Map picker callback ──────────────────────────────────────────────────
    const handleMapSelect = (
        pickupAddr: string, dropAddr: string, dist: number, tollAmt?: number,
        pickupLat?: number, pickupLng?: number, dropLat?: number, dropLng?: number
    ) => {
        setPickup(pickupAddr);
        setDrop(dropAddr);
        if (pickupLat && pickupLng) setPickupCoords({ lat: pickupLat, lng: pickupLng });
        if (dropLat   && dropLng)   setDropCoords({ lat: dropLat, lng: dropLng });
        setDistanceKm(dist.toFixed(1));
        if (tollAmt && tollAmt > 0) {
            const finalToll = tripType === 'roundtrip'
                ? (parseInt(days) > 1 ? tollAmt * 2 : Math.round(tollAmt * 1.6))
                : tollAmt;
            setToll(String(finalToll));
            setManualToll(true);
        }
        setResult(null);
        setShowMap(false);
    };

    // ── Calculate ────────────────────────────────────────────────────────────
    const handleCalculate = async () => {
        if (!vehicle) {
            setError('Please select a vehicle type.');
            return;
        }
        const rawKm = parseFloat(distanceKm);
        if (tripType !== 'local' && (!rawKm || rawKm <= 0)) {
            setError('Enter distance or select locations to auto-fill.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const km = (rawKm || 0) + (garageBuffer ? 20 : 0);
            const serviceType = tripType === 'roundtrip' ? 'round_trip'
                : tripType === 'local' ? 'local_hourly' : 'one_way';

            const fareResult = calculateFare(
                serviceType, vehicle, km,
                parseInt(days) || 1,
                0, false,
                rateKm > 0 ? rateKm : undefined,
                manualBata ? parseFloat(driverBata) : undefined,
                parseFloat(hillStation) || undefined,
                parseFloat(petCharge)   || undefined,
                parseFloat(nightCharge) || undefined,
                tripType === 'local' ? pkg : undefined
            );

            const tollAmt    = parseFloat(toll)    || 0;
            const parkingAmt = parseFloat(parking) || 0;
            const permitAmt  = parseFloat(permit)  || 0;
            const extraTotal = extraItems.reduce((s, i) => s + (i.amount || 0), 0);

            const fullBreakdown = [...fareResult.breakdown];
            if (tollAmt    > 0) fullBreakdown.push(`Toll Charges: ₹${tollAmt.toLocaleString()}`);
            if (parkingAmt > 0) fullBreakdown.push(`Parking Charges: ₹${parkingAmt.toLocaleString()}`);
            if (permitAmt  > 0) fullBreakdown.push(`Permit Charges: ₹${permitAmt.toLocaleString()}`);
            extraItems.forEach(i => {
                if (i.amount > 0) fullBreakdown.push(`${i.description}: ₹${i.amount.toLocaleString()}`);
            });

            setResult({
                totalFare: fareResult.totalFare + tollAmt + parkingAmt + permitAmt + extraTotal,
                breakdown: fullBreakdown,
            });

            setTimeout(() => {
                document.getElementById('pfc-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch {
            setError('Calculation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Additional charges summary label ────────────────────────────────────
    const extraChargesSummary = () => {
        const parts: string[] = [];
        const t = parseFloat(toll) || 0;
        const b = parseFloat(driverBata) || 0;
        const pk = parseFloat(parking) || 0;
        const pm = parseFloat(permit) || 0;
        if (t  > 0) parts.push(`Tolls: ₹${t.toLocaleString()}`);
        if (b  > 0) parts.push(`Bata: ₹${b.toLocaleString()}`);
        if (pk > 0) parts.push(`Parking: ₹${pk.toLocaleString()}`);
        if (pm > 0) parts.push(`Permit: ₹${pm.toLocaleString()}`);
        extraItems.forEach(i => { if (i.amount > 0) parts.push(`${i.description}: ₹${i.amount}`); });
        return parts.length > 0 ? parts.join(', ') : 'Toll, Bata, Parking & more';
    };

    const totalExtras = [driverBata, toll, parking, permit, hillStation, petCharge, nightCharge]
        .reduce((s, v) => s + (parseFloat(v) || 0), 0)
        + extraItems.reduce((s, i) => s + (i.amount || 0), 0);

    return (
        <div className="min-h-screen bg-[#F5F7FA]">
            <SEOHead
                title="Free Taxi Fare Calculator India — Cab Price Estimator"
                description="Calculate accurate taxi fares for one-way, round trip, and local rentals in India. Includes toll, parking & permit charges. No login required."
                schema={PAGE_SCHEMA}
                canonical={`${window.location.origin}/taxi-fare-calculator`}
            />

            {/* Hero */}
            <div className="bg-slate-900 text-white px-4 pt-3 pb-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full mb-2 border border-blue-500/30">
                        Free · No Login Required
                    </div>
                    <h1 className="text-base md:text-lg font-bold text-white mb-1 leading-tight">
                        Taxi Fare Calculator India
                    </h1>
                    <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
                        Accurate cab fare estimates including toll, parking &amp; permit. Based on official union tariff rates.
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-4 pb-8 space-y-3">

                {/* Calculator Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Trip Type Tabs */}
                    <div className="flex border-b border-slate-100">
                        {TRIP_TYPES.map(t => (
                            <button key={t.id}
                                onClick={() => {
                                    if (t.id !== tripType) {
                                        setTripType(t.id);
                                        setDistanceKm('');
                                        setToll('0'); setManualToll(false);
                                        setPermit('0'); setParking('0');
                                        setHillStation('0');
                                        setResult(null);
                                    }
                                }}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                    tripType === t.id ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 space-y-3">

                        {/* Locations */}
                        <div className="space-y-2">
                            <PlacesAutocomplete
                                value={pickup} onChange={v => { setPickup(v); setResult(null); }}
                                onPlaceSelected={p => { setPickup(p.address); setPickupCoords({ lat: p.lat, lng: p.lng }); setResult(null); }}
                                onMapClick={() => setShowMap(true)}
                                placeholder="Pickup location or city" label="Pickup"
                                icon={<MapPin size={13} className="text-green-500" />}
                                className="tn-input w-full h-10 text-xs pl-9 pr-8"
                            />
                            {tripType !== 'local' && (
                                <PlacesAutocomplete
                                    value={drop} onChange={v => { setDrop(v); setResult(null); }}
                                    onPlaceSelected={p => { setDrop(p.address); setDropCoords({ lat: p.lat, lng: p.lng }); setResult(null); }}
                                    onMapClick={() => setShowMap(true)}
                                    placeholder="Drop location or city" label="Drop"
                                    icon={<MapPin size={13} className="text-red-500" />}
                                    className="tn-input w-full h-10 text-xs pl-9 pr-8"
                                />
                            )}
                        </div>

                        {/* Distance */}
                        {tripType !== 'local' && (
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    Distance (KM)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number" value={distanceKm} min="1"
                                        onChange={e => { setDistanceKm(e.target.value); setManualToll(false); setResult(null); }}
                                        placeholder={calcDist ? 'Calculating…' : 'Auto-filled or enter manually'}
                                        disabled={calcDist}
                                        className="tn-input w-full h-10 text-xs pr-10 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />
                                    {calcDist && <Loader2 size={15} className="animate-spin text-primary absolute right-3 top-1/2 -translate-y-1/2" />}
                                    {!calcDist && distanceKm && <CheckCircle2 size={15} className="text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                                </div>
                            </div>
                        )}

                        {/* Vehicle + Rate/KM row */}
                        <div className={`grid gap-3 ${tripType !== 'local' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Vehicle</label>
                                <div className="relative">
                                    <Car size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <select
                                        value={vehicle}
                                        onChange={e => { setVehicle(e.target.value as VehicleId); setManualRate(false); setResult(null); }}
                                        className="tn-input w-full h-10 text-xs pl-8 appearance-none"
                                    >
                                        <option value="" disabled>Select Vehicle</option>
                                        {VEHICLES.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} — {v.sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {tripType !== 'local' && (
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                        <TrendingUp size={10} /> Rate / KM
                                        {manualRate && (
                                            <button onClick={() => { setManualRate(false); setResult(null); }}
                                                className="ml-auto text-blue-500 text-[9px] flex items-center gap-0.5">
                                                <RotateCcw size={9} /> Reset
                                            </button>
                                        )}
                                    </label>
                                    <input
                                        type="number" value={vehicle ? rateKm : ''}
                                        onChange={e => { setRateKm(Number(e.target.value)); setManualRate(true); setResult(null); }}
                                        disabled={!vehicle}
                                        placeholder={!vehicle ? 'Select vehicle first' : ''}
                                        className={`tn-input w-full h-10 text-xs disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${manualRate ? 'border-yellow-400! bg-yellow-50! text-yellow-800!' : ''}`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Round Trip Days */}
                        {tripType === 'roundtrip' && (
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Number of Days</label>
                                <input type="number" value={days} min="1"
                                    onChange={e => { setDays(e.target.value); setResult(null); }}
                                    className="tn-input w-full h-10 text-xs"
                                />
                            </div>
                        )}

                        {/* Local Package */}
                        {tripType === 'local' && (
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Rental Package</label>
                                <div className="flex gap-2">
                                    {LOCAL_PACKAGES.map(p => (
                                        <button key={p.id} onClick={() => { setPkg(p.id); setResult(null); }}
                                            className={`flex-1 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                                                pkg === p.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Garage Buffer */}
                        {tripType !== 'local' && (
                            <label className="flex items-center gap-3 cursor-pointer select-none group">
                                <input type="checkbox" checked={garageBuffer}
                                    onChange={e => { setGarageBuffer(e.target.checked); setResult(null); }}
                                    className="w-4 h-4 rounded border-slate-300 accent-primary"
                                />
                                <div className="flex items-center gap-1.5">
                                    <Warehouse size={13} className="text-slate-400" />
                                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                                        Add Garage Buffer (20 km)
                                    </span>
                                </div>
                            </label>
                        )}

                        {/* Additional Charges Row */}
                        <button
                            type="button"
                            onClick={() => setShowDrawer(true)}
                            className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors group"
                        >
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    + Additional Charges
                                    {totalExtras > 0 && (
                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[9px] font-black">
                                            ₹{totalExtras.toLocaleString()}
                                        </span>
                                    )}
                                </span>
                                <span className="text-[9px] text-slate-400 text-left truncate max-w-[260px]">
                                    {extraChargesSummary()}
                                </span>
                            </div>
                            <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                        </button>

                        {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

                        <button onClick={handleCalculate} disabled={loading || calcDist}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                            {loading ? 'Calculating...' : calcDist ? 'Fetching Distance…' : 'Get Fare Estimate'}
                        </button>
                    </div>
                </div>

                {/* Result Card */}
                {result && (
                    <div id="pfc-result" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-green-500" />
                                <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Fare Estimate</h2>
                            </div>
                            <button onClick={() => setResult(null)}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors">
                                <RotateCcw size={11} /> Recalculate
                            </button>
                        </div>

                        <div className="p-5 space-y-2.5">
                            {result.breakdown.map((line, i) => {
                                const clean = line.replace(/[*_⚠️]/g, '').trim();
                                if (!clean || clean.toLowerCase().startsWith('note:')) return null;
                                const parts = clean.split(/[:=]\s*₹(?=\d)/);
                                if (parts.length < 2) return <p key={i} className="text-xs text-slate-400">{clean}</p>;
                                return (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">{parts[0].trim()}</span>
                                        <span className="font-bold text-slate-800">₹{parts[1].trim()}</span>
                                    </div>
                                );
                            })}
                            <div className="pt-3 mt-1 border-t-2 border-slate-200 flex justify-between items-center">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Total Estimated</span>
                                <span className="text-3xl font-black text-primary">₹{result.totalFare.toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center pt-1">
                                Estimate only · Excl. GST · Toll &amp; parking are approximate
                            </p>
                        </div>

                        {/* Driver CTA */}
                        <div className="bg-slate-900 p-5 space-y-3 text-center">
                            <p className="text-white text-sm font-black">Are you a cab driver?</p>
                            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                                Generate GST invoices, track trips &amp; manage earnings — free with Sarathi Book.
                            </p>
                            <GoogleSignInButton text="Start Free with Google" className="w-full justify-center" />
                        </div>
                    </div>
                )}

                <CalculatorFAQ />

                {!result && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center space-y-3">
                        <p className="text-slate-800 text-sm font-black">Cab Driver? Manage trips professionally</p>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Track fares, generate GST invoices &amp; manage driver salary — all in one app.
                        </p>
                        <GoogleSignInButton text="Join Free — Sarathi Book" className="w-full justify-center" />
                    </div>
                )}
            </div>

            {/* Map Picker */}
            {showMap && (
                <MapPicker
                    onLocationSelect={handleMapSelect}
                    onClose={() => setShowMap(false)}
                />
            )}

            {/* Additional Charges Drawer */}
            <AdditionalChargesDrawer
                isOpen={showDrawer} onClose={() => setShowDrawer(false)}
                tripType={tripType} days={days}
                driverBata={driverBata} setDriverBata={setDriverBata} manualDriverBata={manualBata} setManualDriverBata={setManualBata}
                toll={toll} setToll={setToll} manualToll={manualToll} setManualToll={setManualToll}
                parking={parking} setParking={setParking} manualParking={manualParking} setManualParking={setManualParking}
                permit={permit} setPermit={setPermit} manualPermit={manualPermit} setManualPermit={setManualPermit}
                hillStationCharge={hillStation} setHillStationCharge={setHillStation} manualHillStation={manualHill} setManualHillStation={setManualHill}
                petCharge={petCharge} setPetCharge={setPetCharge} manualPet={manualPet} setManualPet={setManualPet}
                nightCharge={nightCharge} setNightCharge={setNightCharge} manualNight={manualNight} setManualNight={setManualNight}
                extraItems={extraItems} setExtraItems={setExtraItems}
            />
        </div>
    );
};

export default PublicFareCalculator;
