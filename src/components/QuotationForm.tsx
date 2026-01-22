import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/monitoring';
import { calculateFareAsync } from '../utils/fareWorkerWrapper';
import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';
import { estimateParkingCharge } from '../utils/parking';
import { estimatePermitCharge } from '../utils/permits';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
import {
    MoveRight, MapPin, Plus,
    Repeat, Clock, UserCheck,
    Car, ChevronLeft,
    RotateCcw, Trash2, PenLine,
    StickyNote, Check
} from 'lucide-react';
import { shareQuotation, generateQuotationPDF, QuotationData, SavedQuotation } from '../utils/pdf';
import PDFPreviewModal from './PDFPreviewModal';
import { calculateDistance, geocodeAddress } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { isHillStationLocation } from '../utils/locationUtils';
import { calculateGST, determineGSTType, GSTRate, GSTBreakdown } from '../utils/gstUtils';

// Reusing types from TripForm but adapted for Quotation context if needed, or just using local interfaces
type CalculationResult = {
    total: number;
    gst: number;
    gstBreakdown?: GSTBreakdown;
    fare: number;
    distance: number;
    effectiveDistance: number;
    rateUsed: number;
    distanceCharge: number;
    waitingHours: number;
    hillStationCharges: number;
    petCharges: number;
    driverBatta: number;
    nightStay: number;
    breakdown: string[];
}

interface QuotationFormProps {
    onSaveQuotation?: (quotation: SavedQuotation) => void;
    onStepChange?: (step: number) => void;
    quotations?: SavedQuotation[];
}

// Vehicle Classes for Selection
const VEHICLE_CLASSES = [
    { id: 'sedan', label: 'Sedan (Etios/Dzire)', model: 'Sedan' },
    { id: 'suv', label: 'SUV (Ertiga/Kia)', model: 'SUV' },
    { id: 'innova', label: 'Innova Crysta', model: 'Innova Crysta' },
    { id: 'tempo', label: 'Tempo Traveller', model: 'Tempo Traveller' }
];

const DEFAULT_TERMS = [
    "This is a tentative estimate. Final charges will be based on actual Kms and time used.",
    "Kms and Time are calculated on a Garage-to-Garage basis.",
    "Tolls, Parking, State Permits, and Entry fees are extra at actuals.",
    "Driver Batta/Allowance is for driver food and stay per calendar day.",
    "Night driving charges (10:00 PM - 06:00 AM) are applicable extra.",
    "GST 5% is applicable on the total bill amount."
];

const QuotationForm: React.FC<QuotationFormProps> = ({ onSaveQuotation, onStepChange, quotations }) => {
    const { settings } = useSettings();
    const { user } = useAuth();
    // Mock user/ad protection if removed imports

    // --- State ---
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState<'drop' | 'outstation' | 'local' | 'custom' | null>(null);

    // Vehicle Selection (Generic Class)
    const [selectedVehicleType, setSelectedVehicleType] = useState('');

    // Journey
    const [fromLoc, setFromLoc] = useState('');
    const [toLoc, setToLoc] = useState('');
    const [distanceOverride, setDistanceOverride] = useState<string>('');
    const [fromCoords, setFromCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [toCoords, setToCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [isFetchingKM, setIsFetchingKM] = useState(false);

    // Details
    const [days, setDays] = useState(1);

    const [customRate, setCustomRate] = useState(0);
    // Custom Table State for Quotation
    const [customLineItems, setCustomLineItems] = useState<{ description: string; sac: string; qty: number; rate: number; amount: number }[]>([
        { description: 'Service Charge', sac: '9966', qty: 1, rate: 0, amount: 0 }
    ]);

    // Local Package State
    const [hourlyPackage, setHourlyPackage] = useState<string>('8hr_80km');
    const [localPackageHours, setLocalPackageHours] = useState(8);
    const [localPackageKm, setLocalPackageKm] = useState(80);

    // Charges
    const [toll, setToll] = useState('0');
    const [parking, setParking] = useState('0');
    const [permit, setPermit] = useState('0');
    const [driverBatta, setDriverBatta] = useState('0');
    const [nightCharge, setNightCharge] = useState('0');
    const [hillStationCharge, setHillStationCharge] = useState('0');
    const [petCharge, setPetCharge] = useState('0');
    const [extraItems, setExtraItems] = useState<{ description: string; amount: number; qty?: number; rate?: number; sac?: string }[]>([]);

    // Manual Overrides
    const [manualDriverBatta, setManualDriverBatta] = useState(false);
    const [manualRate, setManualRate] = useState(false);
    const [manualToll, setManualToll] = useState(false);
    const [manualParking, setManualParking] = useState(false);
    const [manualPermit, setManualPermit] = useState(false);
    const [manualHillStation, setManualHillStation] = useState(false);
    const [garageBuffer, setGarageBuffer] = useState(false);

    // Other Charges Helper
    const [selectedChargeType, setSelectedChargeType] = useState('');
    const [customChargeName, setCustomChargeName] = useState('');
    const [customChargeAmount, setCustomChargeAmount] = useState('');

    // Customer
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerGst, setCustomerGst] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [includeGst, setIncludeGst] = useState(false);
    const [rcmEnabled, setRcmEnabled] = useState(false);
    // Fixed: Only 5% allowed for now
    const gstRate: GSTRate = 5;

    // Terms
    const [terms, setTerms] = useState<string[]>([]);
    const [newTerm, setNewTerm] = useState('');
    const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);

    // Previews
    const [showPreview, setShowPreview] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showMap, setShowMap] = useState(false);

    const handleMapSelect = (pickup: string, drop: string, dist: number, tollAmt?: number, pLat?: number, pLng?: number, dLat?: number, dLng?: number) => {
        setFromLoc(pickup);
        setToLoc(drop);
        setDistanceOverride(dist.toString());
        if (pLat && pLng) setFromCoords({ lat: pLat, lng: pLng });
        if (dLat && dLng) setToCoords({ lat: dLat, lng: dLng });

        if (tollAmt && tollAmt > 0) {
            let finalToll = tollAmt;
            if (mode === 'outstation') {
                // Multi-day round trip logic for toll
                finalToll = days > 1 ? tollAmt * 2 : Math.round(tollAmt * 1.6);
            }
            setToll(finalToll.toString());
        }
        setShowMap(false);
    };

    // --- Derived ---
    // Use TARIFFS directly based on type
    const currentVehicleData = useMemo(() => {
        if (!selectedVehicleType) return null;
        let cat = 'sedan';
        if (selectedVehicleType === 'innova') cat = 'premium_suv';
        else if (selectedVehicleType === 'tempo') cat = 'tempo';
        else if (selectedVehicleType === 'suv') cat = 'suv';

        return (TARIFFS.vehicles as Record<string, any>)[cat] || TARIFFS.vehicles.sedan;
    }, [selectedVehicleType]);

    // Local Time Log


    // Quotation Number Logic
    const nextQuotationNo = useMemo(() => {
        let prefix = 'QTN-';
        const datePart = new Date().toISOString().slice(2, 7).replace(/-/g, ''); // YYMM
        prefix += datePart + '-';

        if (!quotations || quotations.length === 0) return `${prefix}001`;

        const existingNums = quotations
            .map(q => q.quotationNo)
            .filter(n => n && n.startsWith(prefix))
            .map(n => parseInt(n.split('-').pop() || '0'))
            .filter(n => !isNaN(n));

        const max = Math.max(0, ...existingNums);
        return `${prefix}${(max + 1).toString().padStart(3, '0')}`;
    }, [quotations]);

    const minDays = useMemo(() => {
        if (mode !== 'outstation') return 1;
        const dist = parseFloat(distanceOverride) || 0;
        // Logic: (TotalKM - 50 buffer) / max_km_per_day
        return Math.max(1, Math.ceil((dist - 50) / TRIP_LIMITS.max_km_per_day));
    }, [mode, distanceOverride]);

    // --- Effects ---
    useEffect(() => {
        if (onStepChange) onStepChange(step);
    }, [step, onStepChange]);

    // Auto Distance Calculation
    useEffect(() => {
        const autoCalculateTrip = async () => {
            if (mode === 'local' || mode === 'custom') {
                setIsFetchingKM(false);
                return;
            }
            if (!fromLoc || !toLoc) return;

            setIsFetchingKM(true);
            try {
                // Resolved coords or fallback
                let startC = fromCoords;
                let endC = toCoords;

                if (!startC) {
                    const g = await geocodeAddress(fromLoc);
                    if (g) startC = { lat: g.lat, lng: g.lng };
                }
                if (!endC) {
                    const g = await geocodeAddress(toLoc);
                    if (g) endC = { lat: g.lat, lng: g.lng };
                }

                if (startC && endC) {
                    const advanced = await calculateAdvancedRoute(startC, endC);
                    if (advanced) {
                        const multiplier = mode === 'outstation' ? 2 : 1;
                        const distVal = advanced.distanceKm * multiplier;
                        setDistanceOverride(distVal.toString());

                        if (advanced.tollPrice > 0 && !manualToll) {
                            let baseToll = advanced.tollPrice;
                            if (selectedVehicleType.includes('tempo')) baseToll *= 1.6;
                            const finalToll = mode === 'drop' ? baseToll : (days > 1 ? baseToll * 2 : Math.round(baseToll * 1.6));
                            setToll(Math.round(finalToll).toString());
                        }
                    } else {
                        // Fallback
                        const res = await calculateDistance(fromLoc, toLoc);
                        if (res && res.distance) {
                            const multiplier = mode === 'outstation' ? 2 : 1;
                            setDistanceOverride((res.distance * multiplier).toString());
                        }
                    }
                } else {
                    const res = await calculateDistance(fromLoc, toLoc);
                    if (res && res.distance) {
                        const multiplier = mode === 'outstation' ? 2 : 1;
                        setDistanceOverride((res.distance * multiplier).toString());
                    }
                }

                if (!manualPermit && fromLoc && toLoc) {
                    // We might need formatted address for better permit check if available
                    // But assume fromLoc/toLoc from autocomplete are okay-ish
                    const permitEst = estimatePermitCharge(fromLoc, toLoc, selectedVehicleType);
                    setPermit(permitEst ? permitEst.amount.toString() : '0');
                }
                if (!manualParking && toLoc) {
                    const pInfo = estimateParkingCharge(toLoc);
                    setParking(pInfo ? pInfo.amount.toString() : '0');
                }

                // Auto Hill Station
                if (!manualHillStation && toLoc) {
                    if (isHillStationLocation(toLoc)) {
                        const isHeavy = selectedVehicleType === 'tempo';
                        setHillStationCharge(isHeavy ? '1000' : '500');
                    } else {
                        setHillStationCharge('0');
                    }
                }

            } catch (error) {
                console.error('Error calculating trip data:', error);
            } finally {
                setIsFetchingKM(false);
            }
        };

        const timer = setTimeout(autoCalculateTrip, 1000);
        return () => clearTimeout(timer);
    }, [fromLoc, toLoc, fromCoords, toCoords, mode, selectedVehicleType, manualPermit, manualParking, manualToll, manualHillStation]);

    // Enforce Min Days
    useEffect(() => {
        if (mode === 'outstation' && days < minDays) {
            setDays(minDays);
        }
    }, [minDays, mode, days]);

    // Auto Charges (Batta, Rate)
    useEffect(() => {
        const vehicle = currentVehicleData;
        if (vehicle) {
            // Update rate only if not manually overridden
            if (!manualRate) {
                setCustomRate(mode === 'outstation' ? vehicle.round_trip_rate : vehicle.one_way_rate);
            }

            if (!manualDriverBatta) {
                let batta = 0;
                const dist = parseFloat(distanceOverride) || 0;
                if (mode === 'outstation') {
                    batta = vehicle.driver_bata * days;
                } else if (mode === 'drop') {
                    const estDays = Math.max(1, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
                    batta = (dist > 40 || vehicle.is_heavy_vehicle) ? vehicle.driver_bata * estDays : 0;
                }
                setDriverBatta(batta.toString());
            }
        }
    }, [selectedVehicleType, mode, days, distanceOverride, manualDriverBatta, manualRate, currentVehicleData]);


    const performCalculation = async (): Promise<CalculationResult | null> => {
        if (mode !== 'custom' && !selectedVehicleType) return null;
        try {
            const serviceType = mode === 'outstation' ? 'round_trip' : (mode === 'local' ? 'local_hourly' : 'one_way');
            const dist = mode === 'local' ? localPackageKm : (parseFloat(distanceOverride) || 0);

            let calcExtraHours = 0;
            if (mode === 'local') {
                let base = 8;
                if (hourlyPackage === '2hr_20km') base = 2;
                if (hourlyPackage === '4hr_40km') base = 4;
                if (hourlyPackage === '12hr_120km') base = 12;
                calcExtraHours = Math.max(0, localPackageHours - base);
            }

            let customBaseTotal = 0;
            if (mode === 'custom') {
                customBaseTotal = customLineItems.reduce((acc, item) => acc + item.amount, 0);
            }

            const overrideRate = (customRate && customRate > 0) ? customRate : undefined;
            const finalDist = dist + (garageBuffer ? 20 : 0);

            const res = await calculateFareAsync(
                serviceType,
                selectedVehicleType || 'sedan',
                finalDist,
                mode === 'outstation' ? days : 1,
                calcExtraHours,
                manualHillStation && parseFloat(hillStationCharge) > 0,
                mode === 'custom' ? undefined : overrideRate,
                manualDriverBatta ? parseFloat(driverBatta) : undefined,
                manualHillStation ? parseFloat(hillStationCharge) : undefined,
                parseFloat(petCharge) || 0,
                parseFloat(nightCharge) || 0,
                hourlyPackage // Pass package type to worker
            );

            const otherExtras = (parseFloat(permit) || 0) + (parseFloat(parking) || 0) + (parseFloat(toll) || 0) + extraItems.reduce((a, b) => a + b.amount, 0);
            const subtotal = (mode === 'custom' ? customBaseTotal : res.totalFare) + otherExtras;

            // Integrated GST Logic
            const gstRes = calculateGST(subtotal, gstRate, settings.gstin, customerGst);
            const gstCalculated = includeGst ? gstRes.totalTax : 0;
            const total = subtotal + gstCalculated;

            return {
                total, gst: gstCalculated, gstBreakdown: includeGst ? gstRes : undefined, fare: subtotal, distance: dist, breakdown: res.breakdown,
                effectiveDistance: res.effectiveDistance || dist, rateUsed: res.rateUsed || 0, distanceCharge: res.details.fare,
                waitingHours: mode === 'local' ? localPackageHours : 0,
                hillStationCharges: res.details.hillStation, petCharges: res.details.petCharge, driverBatta: res.details.driverBatta, nightStay: 0
            };
        } catch (err) {
            console.error(err); return null;
        }
    };

    const handleNext = () => setStep(s => Math.min(4, s + 1));
    const handleBack = () => setStep(s => Math.max(1, s - 1));

    const handlePreview = async () => {
        const res = await performCalculation();
        if (!res) return;

        const qData: QuotationData = {
            customerName: customerName || 'Valued Customer',
            customerGstin: customerGst,
            customerAddress: billingAddress,
            pickup: fromLoc,
            drop: toLoc,

            subject: `${mode === 'drop' ? 'One Way Drop' : mode === 'outstation' ? 'Outstation Trip' : 'Cab Service'} Quote`,
            date: quotationDate,
            quotationNo: nextQuotationNo,
            gstEnabled: includeGst,
            rcmEnabled,
            terms,
            items: [{
                description: mode === 'drop' ? `Trip to ${toLoc}` : `Round Trip to ${toLoc}`,
                package: mode === 'local' ? (hourlyPackage === '8hr_80km' ? '8 Hrs / 80 KM' : hourlyPackage === '12hr_120km' ? '12 Hrs / 120 KM' : `${localPackageHours} Hrs / ${localPackageKm} KM`) : `${res.distance} KM Est.`,
                vehicleType: VEHICLE_CLASSES.find(v => v.id === selectedVehicleType)?.label || selectedVehicleType,
                rate: res.rateUsed.toString(),
                amount: res.fare.toString(),
                quantity: 1
            }],
            // We pass full structure to generating function via "Trip" mapping inside `generateQuotationPDF`?
            // Actually `generateQuotationPDF` takes `QuotationData`.
            // But `QuotationData` items are simple list.
            // The TripForm logic calculates complex breakdown (Hill, Permit, Toll).
            // We need to pass these as Items to `QuotationData` so they appear in table.
            gstRate: includeGst ? gstRate : undefined,
            gstType: includeGst ? (res.gstBreakdown?.type || 'CGST_SGST') : undefined,
        };

        // Construct items from breakdown
        const items = [];
        // Base Fare
        const baseRate = res.rateUsed;
        const baseDist = res.effectiveDistance || res.distance;
        let baseDesc = mode === 'local' ? `Local Rental` : (mode === 'outstation' ? `Round Trip` : `One Way Drop`);

        // Add calculation breakdown
        if (mode === 'local') {
            // ... existing local logic ...
            if (hourlyPackage === '8hr_80km') {
                baseDesc += ` [8 Hrs / 80 KM Package]`;
            } else if (hourlyPackage === '12hr_120km') {
                baseDesc += ` [12 Hrs / 120 KM Package]`;
            } else if (hourlyPackage === '4hr_40km') {
                baseDesc += ` [4 Hrs / 40 KM Package]`;
            } else if (hourlyPackage === '2hr_20km') {
                baseDesc += ` [2 Hrs / 20 KM Package]`;
            } else {
                baseDesc += ` [${localPackageHours} Hrs / ${localPackageKm} KM Package]`;
            }
            // Append actual usage
            if (localPackageHours > 0 || localPackageKm > 0) {
                baseDesc += ` (Journey: ${localPackageHours}hrs/${localPackageKm}km)`;
            }
        } else if (baseRate > 0) {
            baseDesc += ` [${baseDist} KM * ${baseRate}/KM]`;
        }

        if (mode === 'custom') {
            customLineItems.forEach(i => items.push({
                description: i.description,
                package: '',
                vehicleType: 'Custom',
                rate: i.rate.toString(),
                amount: i.amount.toString(),
                quantity: i.qty,
                sac: i.sac
            }));
        } else {
            items.push({
                description: baseDesc,
                package: 'Base Fare',
                vehicleType: VEHICLE_CLASSES.find(v => v.id === selectedVehicleType)?.label || selectedVehicleType,
                rate: baseRate > 0 ? `${baseRate}/KM` : `${res.distanceCharge}`,
                amount: res.distanceCharge.toString(),
                quantity: 1
            });
        }

        // Add Charges
        if (res.driverBatta > 0) {
            const dist = res.effectiveDistance || res.distance;
            let daysUsed = mode === 'outstation' ? Math.max(days, Math.ceil(dist / TRIP_LIMITS.max_km_per_day)) : 1;
            if (mode === 'drop') {
                daysUsed = Math.max(1, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
            }
            const battaRate = res.driverBatta / daysUsed;
            items.push({
                description: `Driver Batta [${daysUsed} Day${daysUsed > 1 ? 's' : ''} * ${battaRate}/Day]`,
                package: '', vehicleType: '', rate: `${battaRate}/Day`, amount: res.driverBatta.toString(), quantity: daysUsed
            });
        }
        if (parseFloat(toll) > 0) items.push({ description: 'Toll Charges', package: '', vehicleType: '', rate: toll, amount: toll, quantity: 1 });
        if (parseFloat(parking) > 0) items.push({ description: 'Parking Charges', package: '', vehicleType: '', rate: parking, amount: parking, quantity: 1 });
        if (parseFloat(permit) > 0) items.push({ description: 'Permit Charges', package: '', vehicleType: '', rate: permit, amount: permit, quantity: 1 });
        if (res.hillStationCharges > 0) items.push({ description: 'Hill Station Charges', package: '', vehicleType: '', rate: res.hillStationCharges.toString(), amount: res.hillStationCharges.toString(), quantity: 1 });
        if (parseFloat(nightCharge) > 0) {
            items.push({ description: 'Night Charges', package: '', vehicleType: '', rate: nightCharge, amount: nightCharge, quantity: 1 });
        }

        extraItems.forEach(i => items.push({ description: i.description, package: '', vehicleType: '', rate: '', amount: i.amount.toString(), sac: i.sac }));

        qData.items = items;

        const doc = await generateQuotationPDF(qData, { ...settings, vehicleNumber: 'N/A' });
        setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
        setShowPreview(true);
    };

    const handleShare = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await performCalculation();
            if (!res) {
                setIsSubmitting(false);
                return;
            }

            // Similar Items construction
            const items = [];
            // Base Fare
            const baseRate = res.rateUsed;
            const baseDist = res.effectiveDistance || res.distance;
            let baseDesc = mode === 'local' ? `Local Rental` : (mode === 'outstation' ? `Round Trip` : `One Way Drop`);

            if (mode === 'local') {
                if (hourlyPackage === '8hr_80km') {
                    baseDesc += ` [8 Hrs / 80 KM Package]`;
                } else if (hourlyPackage === '12hr_120km') {
                    baseDesc += ` [12 Hrs / 120 KM Package]`;
                } else if (hourlyPackage === '4hr_40km') {
                    baseDesc += ` [4 Hrs / 40 KM Package]`;
                } else if (hourlyPackage === '2hr_20km') {
                    baseDesc += ` [2 Hrs / 20 KM Package]`;
                } else {
                    baseDesc += ` [${localPackageHours} Hrs / ${localPackageKm} KM Package]`;
                }
            } else if (baseRate > 0) {
                baseDesc += ` [${baseDist} KM * ${baseRate}/KM]`;
            }

            if (mode === 'custom') {
                customLineItems.forEach(i => items.push({
                    description: i.description,
                    package: '',
                    vehicleType: 'Custom',
                    rate: i.rate.toString(),
                    amount: i.amount.toString(),
                    quantity: i.qty,
                    sac: i.sac
                }));
            } else {
                items.push({
                    description: baseDesc,
                    package: 'Base Fare',
                    vehicleType: VEHICLE_CLASSES.find(v => v.id === selectedVehicleType)?.label || selectedVehicleType,
                    rate: baseRate > 0 ? `${baseRate}/KM` : `${res.distanceCharge}`,
                    amount: res.distanceCharge.toString(),
                    quantity: 1
                });
            }

            if (res.driverBatta > 0) {
                let daysUsed = mode === 'outstation' ? days : 1;
                if (mode === 'drop') {
                    const dist = res.effectiveDistance || res.distance;
                    daysUsed = Math.max(1, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
                }
                const battaRate = res.driverBatta / daysUsed;
                items.push({ description: `Driver Batta [${daysUsed} Day${daysUsed > 1 ? 's' : ''} * ${battaRate}/Day]`, package: '', vehicleType: '', rate: `${battaRate}/Day`, amount: res.driverBatta.toString(), quantity: daysUsed });
            }
            if (parseFloat(toll) > 0) items.push({ description: 'Toll Charges', package: '', vehicleType: '', rate: toll, amount: toll, quantity: 1 });
            if (parseFloat(parking) > 0) items.push({ description: 'Parking Charges', package: '', vehicleType: '', rate: parking, amount: parking, quantity: 1 });
            if (parseFloat(permit) > 0) items.push({ description: 'Permit Charges', package: '', vehicleType: '', rate: permit, amount: permit, quantity: 1 });
            if (res.hillStationCharges > 0) items.push({ description: 'Hill Station Charges', package: '', vehicleType: '', rate: res.hillStationCharges.toString(), amount: res.hillStationCharges.toString(), quantity: 1 });
            if (parseFloat(nightCharge) > 0) items.push({ description: 'Night Charges', package: '', vehicleType: '', rate: nightCharge, amount: nightCharge, quantity: 1 });
            extraItems.forEach(i => items.push({ description: i.description, package: '', vehicleType: '', rate: i.amount.toString(), amount: i.amount.toString(), quantity: 1, sac: i.sac }));

            const qData: QuotationData = {
                customerName: customerName || 'Valued Customer',
                customerGstin: customerGst,
                customerAddress: billingAddress,
                pickup: fromLoc,
                drop: toLoc,
                subject: `${mode === 'drop' ? 'One Way Drop' : mode === 'outstation' ? 'Outstation Trip' : 'Cab Service'} Quote`,
                date: quotationDate,
                quotationNo: nextQuotationNo,
                gstEnabled: includeGst,
                rcmEnabled,
                gstRate: includeGst ? gstRate : undefined,
                gstType: includeGst ? (res.gstBreakdown?.type || 'CGST_SGST') : undefined,
                terms,
                items
            };
            await shareQuotation(qData, { ...settings, vehicleNumber: 'N/A' });

            if (onSaveQuotation) {
                onSaveQuotation({
                    id: crypto.randomUUID(),
                    ...qData,
                    quotationNo: qData.quotationNo!, // Assert exist
                    vehicleType: items[0].vehicleType
                });
            }

            // Log to Admin Analytics
            await Analytics.logActivity('quotation_created', {
                quotationNo: qData.quotationNo,
                customer: customerName,
                amount: res.total,
                mode: mode
            }, user?.id);

            Analytics.generateInvoice('quotation', res.total);

            setStep(1);
            if (onStepChange) onStepChange(1);
        } catch (error) {
            console.error('Error sharing quotation:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleAddCharge = () => {
        const desc = selectedChargeType === 'Custom' ? customChargeName : selectedChargeType;
        const amount = parseFloat(customChargeAmount);
        if (desc && amount > 0) {
            setExtraItems(prev => [...prev, { description: desc, amount }]);
            setCustomChargeName('');
            setCustomChargeAmount('');
            setSelectedChargeType('');
        }
    };

    const renderStep1 = () => (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight px-2">
                CREATE QUOTATION
            </h2>
            <div className="grid grid-cols-1 gap-2.5 px-2">
                {(['drop', 'outstation', 'local', 'custom'] as const).map((m) => (
                    <button key={m} onClick={() => {
                        if (mode !== m) {
                            setMode(m);
                            setFromLoc(''); setToLoc(''); setFromCoords(null); setToCoords(null);
                            setDistanceOverride('');
                            setDistanceOverride('');
                            setDays(1); setLocalPackageHours(8);
                            setExtraItems([]);
                            setToll('0'); setParking('0'); setPermit('0'); setDriverBatta('0');
                            setCustomLineItems([{ description: 'Service Charge', sac: '9966', qty: 1, rate: 0, amount: 0 }]);
                        }
                        handleNext();
                    }} className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${mode === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mode === m ? 'bg-white/20' : 'bg-slate-50'}`}>
                            {m === 'drop' && <MoveRight size={18} />}
                            {m === 'outstation' && <Repeat size={18} />}
                            {m === 'local' && <Clock size={18} />}
                            {m === 'custom' && <PenLine size={18} />}
                        </div>
                        <div className="text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest block">{m === 'drop' ? 'One Way Drop' : m === 'outstation' ? 'Round Trip' : m === 'local' ? 'Local Package' : 'Custom Manual'}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {mode === 'custom' ? (
                // Custom Invoice Table Mode
                <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><PenLine size={12} /> QUOTATION ITEMS</h3>
                        <input
                            type="date"
                            value={quotationDate}
                            onChange={(e) => setQuotationDate(e.target.value)}
                            className="tn-input h-8 bg-white border-slate-200 text-xs font-bold w-32"
                        />
                    </div>

                    <div className="space-y-3">
                        {customLineItems.map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex gap-2">
                                    <div className="flex-[3]">
                                        <div className="text-[8px] text-slate-400 uppercase font-black mb-0.5 ml-1">Description</div>
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) => {
                                                const newItems = [...customLineItems];
                                                newItems[idx].description = e.target.value;
                                                setCustomLineItems(newItems);
                                            }}
                                            className="w-full h-8 bg-white border-slate-200 rounded-lg px-2 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[8px] text-slate-400 uppercase font-black mb-0.5 ml-1">SAC Code</div>
                                        <input
                                            type="text"
                                            placeholder="SAC"
                                            value={item.sac}
                                            onChange={(e) => {
                                                const newItems = [...customLineItems];
                                                newItems[idx].sac = e.target.value;
                                                setCustomLineItems(newItems);
                                            }}
                                            className="w-full h-8 bg-white border-slate-200 rounded-lg px-2 text-xs text-center"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <div className="text-[8px] text-slate-400 uppercase font-black mb-0.5 ml-1">Qty</div>
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.qty}
                                            onChange={(e) => {
                                                const rawVal = e.target.value;
                                                const val = parseFloat(rawVal) || 0;
                                                const newItems = [...customLineItems];
                                                newItems[idx].qty = rawVal === '' ? 0 : val;
                                                newItems[idx].amount = (rawVal === '' ? 0 : val) * newItems[idx].rate;
                                                setCustomLineItems(newItems);
                                            }}
                                            className="w-full h-8 bg-white border-slate-200 rounded-lg px-2 text-xs font-bold text-center"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[8px] text-slate-400 uppercase font-black mb-0.5 ml-1">Rate</div>
                                        <input
                                            type="number"
                                            placeholder="Rate"
                                            value={item.rate}
                                            onChange={(e) => {
                                                const rawVal = e.target.value;
                                                const val = parseFloat(rawVal) || 0;
                                                const newItems = [...customLineItems];
                                                newItems[idx].rate = rawVal === '' ? 0 : val;
                                                newItems[idx].amount = newItems[idx].qty * (rawVal === '' ? 0 : val);
                                                setCustomLineItems(newItems);
                                            }}
                                            className="w-full h-8 bg-white border-slate-200 rounded-lg px-2 text-xs font-bold text-center"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[8px] text-slate-400 uppercase font-black mb-0.5 ml-1">Amount</div>
                                        <div className="w-full h-8 flex items-center justify-end px-2 text-xs font-black text-slate-700 bg-slate-100 rounded-lg">
                                            {item.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newItems = customLineItems.filter((_, i) => i !== idx);
                                            setCustomLineItems(newItems);
                                        }}
                                        className="h-8 w-8 flex items-center justify-center text-red-500 bg-white border border-red-100 text-xs font-bold rounded-lg hover:bg-red-50 mt-4"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => setCustomLineItems([...customLineItems, { description: '', sac: '9966', qty: 1, rate: 0, amount: 0 }])}
                            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 uppercase tracking-wider"
                        >
                            <Plus size={14} /> Add Line Item
                        </button>
                    </div>

                    {/* Vehicle Select for Custom Mode (Optional but good for ref) */}
                    <div className="space-y-1 pt-3 border-t border-slate-100">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Vehicle Type (For Record)</label>
                        <select
                            value={selectedVehicleType}
                            onChange={(e) => setSelectedVehicleType(e.target.value)}
                            className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                        >
                            <option value="">Select Vehicle Class (Optional)</option>
                            {VEHICLE_CLASSES.map((v) => (
                                <option key={v.id} value={v.id}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <>
                    {/* Journey Section */}
                    <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Journey Details</h3>
                        <div className="space-y-3">
                            <PlacesAutocomplete
                                label="Pickup"
                                value={fromLoc}
                                onChange={setFromLoc}
                                onPlaceSelected={(p) => { setFromLoc(p.address); setFromCoords({ lat: p.lat, lng: p.lng }); }}
                                onMapClick={() => setShowMap(true)}
                            />
                            {mode !== 'local' && (
                                <PlacesAutocomplete
                                    label="Drop"
                                    value={toLoc}
                                    onChange={setToLoc}
                                    onPlaceSelected={(p) => { setToLoc(p.address); setToCoords({ lat: p.lat, lng: p.lng }); }}
                                    onMapClick={() => setShowMap(true)}
                                />
                            )}
                        </div>

                        {showMap && (
                            <MapPicker
                                onLocationSelect={handleMapSelect}
                                onClose={() => setShowMap(false)}
                            />
                        )}

                    </div>



                    <div className="pt-1 border-t border-slate-50 space-y-3">
                        {mode !== 'local' && (
                            <div>
                                <input type="number" value={isFetchingKM ? '' : distanceOverride} onChange={(e) => setDistanceOverride(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder={isFetchingKM ? "Calculating..." : "0"} />
                            </div>
                        )}
                        {(mode === 'outstation' || (mode === 'drop' && parseFloat(distanceOverride) > 30)) && (
                            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit mt-2">
                                <input
                                    type="checkbox"
                                    checked={garageBuffer}
                                    onChange={(e) => setGarageBuffer(e.target.checked)}
                                    className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Add Garage Buffer (20km)</span>
                            </label>
                        )}
                    </div>


                    {/* Vehicle Section */}
                    <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Car size={12} /> VEHICLE CLASS (ESTIMATE)</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Select Class</label>
                                <select
                                    value={selectedVehicleType}
                                    onChange={(e) => { setSelectedVehicleType(e.target.value); setManualRate(false); }}
                                    className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                                >
                                    <option value="" disabled>Select Vehicle Class</option>
                                    {VEHICLE_CLASSES.map((v) => (
                                        <option key={v.id} value={v.id}>{v.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                                {mode !== 'local' && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Rate / KM</label>
                                            {manualRate && <button onClick={() => setManualRate(false)} className="text-indigo-600"><RotateCcw size={10} /></button>}
                                        </div>
                                        <input type="number" value={customRate || ''} onChange={e => { setCustomRate(parseFloat(e.target.value) || 0); setManualRate(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900`} placeholder="Rate" />
                                    </div>
                                )}
                                {mode === 'outstation' ? (
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Trip Days {minDays > 1 && <span className='text-red-500'>(Min {minDays})</span>}</label>
                                        <input type="number" min={minDays} value={days} onChange={e => setDays(parseFloat(e.target.value) || minDays)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder="1" />
                                    </div>
                                ) : mode === 'local' ? (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Local Package</label>
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
                                                        onClick={() => {
                                                            setHourlyPackage(pkg.id);
                                                            if (pkg.id === '8hr_80km') {
                                                                setLocalPackageHours(8); setLocalPackageKm(80); setDistanceOverride('80');
                                                            } else if (pkg.id === '12hr_120km') {
                                                                setLocalPackageHours(12); setLocalPackageKm(120); setDistanceOverride('120');
                                                            } else if (pkg.id === '4hr_40km') {
                                                                setLocalPackageHours(4); setLocalPackageKm(40); setDistanceOverride('40');
                                                            } else if (pkg.id === '2hr_20km') {
                                                                setLocalPackageHours(2); setLocalPackageKm(20); setDistanceOverride('20');
                                                            }
                                                        }}
                                                        className={`min-w-[70px] flex-shrink-0 flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all snap-start
                                                        ${hourlyPackage === pkg.id
                                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 ring-1 ring-indigo-600 ring-offset-1'
                                                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}
                                                        ${!selectedVehicleType ? 'opacity-50 cursor-not-allowed' : ''}
                                                    `}
                                                        disabled={!selectedVehicleType}
                                                    >
                                                        {pkg.label && (
                                                            <span className={`text-[8px] font-black uppercase tracking-wider mb-0.5 ${hourlyPackage === pkg.id ? 'text-indigo-200' : 'text-indigo-600'}`}>
                                                                {pkg.label}
                                                            </span>
                                                        )}
                                                        <span className="text-xs font-black uppercase tracking-wider leading-none">{pkg.hr}</span>
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider leading-none mt-1 ${hourlyPackage === pkg.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                            {pkg.km}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {hourlyPackage !== 'custom' ? (
                                            <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm mt-3">
                                                <div className="flex-1 text-center border-r border-slate-100">
                                                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Includes</p>
                                                    <p className="text-base font-black text-slate-700">{localPackageKm} KM</p>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Duration</p>
                                                    <p className="text-base font-black text-slate-700">{localPackageHours} HRS</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Hours</label>
                                                    <input type="number"
                                                        value={localPackageHours}
                                                        max={24}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const clamped = val > 24 ? 24 : val;
                                                            setLocalPackageHours(clamped);
                                                        }}
                                                        className="tn-input h-10 w-full font-black bg-slate-50 text-sm" placeholder="8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">KM</label>
                                                    <input type="number" value={localPackageKm} onChange={e => { setLocalPackageKm(parseFloat(e.target.value) || 0); setDistanceOverride(e.target.value); }} className="tn-input h-10 w-full font-black bg-slate-50 text-sm" placeholder="80" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="flex gap-2.5">
                <button onClick={handleBack} className="flex-1 h-12 border-2 border-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"><ChevronLeft size={14} /> Back</button>
                <div className="flex-[3] flex gap-2">
                    {mode === 'custom' && (
                        <button onClick={handlePreview} disabled={customLineItems.length === 0} className="flex-1 h-12 border-2 border-indigo-600 text-indigo-600 font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] flex items-center justify-center hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            PREVIEW
                        </button>
                    )}
                    <button onClick={handleNext} disabled={(mode !== 'custom' && ((!distanceOverride && mode !== 'local') || !selectedVehicleType)) || (mode === 'custom' && customLineItems.length === 0)} className="flex-1 bg-indigo-600 text-white h-12 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 hover:bg-indigo-700">CONTINUE</button>
                </div>
            </div>
        </div >
    );

    const renderStep3 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 px-2">
                <Plus className="text-indigo-600" size={14} /> Additional Charges
            </h2>

            <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Batta</label>
                            {manualDriverBatta && <button onClick={() => setManualDriverBatta(false)} className="text-indigo-600"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={driverBatta} onChange={e => { setDriverBatta(e.target.value); setManualDriverBatta(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 ${manualDriverBatta ? 'bg-indigo-50 text-indigo-700' : ''}`} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Tolls</label>
                            {manualToll && <button onClick={() => setManualToll(false)} className="text-indigo-600"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={toll} onChange={e => { setToll(e.target.value); setManualToll(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 ${manualToll ? 'bg-indigo-50 text-indigo-700' : ''}`} placeholder="0" />
                    </div>
                </div>
                {/* Simplified Grid for others */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Parking</label>
                        <input type="number" value={parking} onChange={e => { setParking(e.target.value); setManualParking(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 ${manualParking ? 'bg-indigo-50 text-indigo-700' : ''}`} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Permit</label>
                        <input type="number" value={permit} onChange={e => { setPermit(e.target.value); setManualPermit(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 ${manualPermit ? 'bg-indigo-50 text-indigo-700' : ''}`} placeholder="0" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-2">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Hill Station</label>
                        <input type="number" value={hillStationCharge} onChange={e => { setHillStationCharge(e.target.value); setManualHillStation(true); }} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder="0" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Pet Charge</label>
                        <input type="number" value={petCharge} onChange={e => setPetCharge(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder="0" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Night Drive</label>
                    <input type="number" value={nightCharge} onChange={e => setNightCharge(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder="0" />
                </div>

                {/* More Charges */}
                <div className="pt-2 border-t border-slate-50 space-y-3">
                    <div className="flex gap-2">
                        <select className="tn-input h-10 flex-1 bg-slate-50 border-slate-200 text-xs text-slate-900" value={selectedChargeType} onChange={(e) => { setSelectedChargeType(e.target.value); if (e.target.value !== 'Custom') setCustomChargeName(''); }}>
                            <option value="">+ Add Other Charge</option>
                            <option value="Custom">Custom Charge</option>
                            <option value="Airport Entry">Airport Entry</option>
                            <option value="Waiting Charge">Waiting Charge</option>
                        </select>
                    </div>
                    {selectedChargeType && (
                        <div className="flex gap-2">
                            {selectedChargeType === 'Custom' && <input placeholder="Name" className="tn-input h-10 flex-[2]" value={customChargeName} onChange={e => setCustomChargeName(e.target.value)} autoFocus />}
                            <input type="number" placeholder="Amt" className="tn-input h-10 flex-1 font-black" value={customChargeAmount} onChange={e => setCustomChargeAmount(e.target.value)} />
                            <button onClick={handleAddCharge} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Plus size={16} /></button>
                        </div>
                    )}
                    {extraItems.length > 0 && (
                        <div className="space-y-1">
                            {extraItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                    <span className="text-xs font-bold text-slate-600">{item.description}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black">₹{item.amount}</span>
                                        <button onClick={() => setExtraItems(p => p.filter((_, i) => i !== idx))}><Trash2 size={12} className="text-red-400" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2.5">
                <button onClick={handleBack} className="flex-1 h-12 border-2 border-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"><ChevronLeft size={14} /> Back</button>
                <div className="flex-[3] flex gap-2">
                    <button onClick={handleNext} className="flex-1 bg-indigo-600 text-white h-12 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] shadow-lg shadow-indigo-200 hover:bg-indigo-700">CONTINUE</button>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Customer Section */}
            <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserCheck size={12} /> Client Details</h3>
                    <div className="bg-slate-100 px-2 py-1 rounded-lg">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Quote #: <span className="text-indigo-600">{nextQuotationNo}</span></span>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Client Name</label>
                        <input placeholder="Client Name" className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Phone</label>
                        <input placeholder="Phone" className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Address</label>
                        <textarea placeholder="Address" className="tn-input h-16 w-full py-2 resize-none bg-slate-50 border-slate-200 text-xs text-slate-900" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">GSTIN (Optional)</label>
                        <input placeholder="GSTIN" className="tn-input h-10 w-full uppercase bg-slate-50 border-slate-200 text-xs text-slate-900" value={customerGst} onChange={e => setCustomerGst(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${includeGst ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center w-full">
                            <div><p className="text-[10px] font-black uppercase">GST Tax (Forward Charge)</p></div>
                            <button onClick={() => {
                                if (!settings.gstin) {
                                    alert('Please add your GSTIN in Settings to enable Forward Charge GST.');
                                    return;
                                }
                                const newState = !includeGst;
                                setIncludeGst(newState);
                                if (newState) setRcmEnabled(false);
                            }} className={`w-8 h-4 rounded-full relative ${includeGst ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${includeGst ? 'left-4.5' : 'left-0.5'}`} /></button>
                        </div>
                        {includeGst && (
                            <div className="flex items-center gap-2 pt-1 border-t border-indigo-100/50">
                                <span className="text-[9px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">5% Rate</span>
                                <span className="text-[8px] font-bold text-slate-400 ml-auto">
                                    {determineGSTType(settings.gstin, customerGst) === 'IGST' ? 'IGST (Inter-State)' : 'CGST+SGST (Intra)'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-2xl border flex justify-between items-center ${rcmEnabled ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div><p className="text-[10px] font-black uppercase">RCM (Reverse Charge)</p></div>
                        <button onClick={() => {
                            if (!settings.gstin) {
                                alert('Please add your GSTIN in Settings to enable RCM.');
                                return;
                            }
                            const newState = !rcmEnabled;
                            setRcmEnabled(newState);
                            if (newState) setIncludeGst(false);
                        }} className={`w-8 h-4 rounded-full relative ${rcmEnabled ? 'bg-orange-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${rcmEnabled ? 'left-4.5' : 'left-0.5'}`} /></button>
                    </div>
                </div>
            </div>

            {/* Terms Section */}
            <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><StickyNote size={12} /> QUOTATION TERMS</h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{terms.length} Selected</span>
                </div>

                {/* Quick Selection List (Checkboxes) */}
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Suggested Terms (Select to include)</label>
                    <div className="grid grid-cols-1 gap-2">
                        {DEFAULT_TERMS.map((term, idx) => {
                            const isSelected = terms.includes(term);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (isSelected) {
                                            setTerms(t => t.filter(x => x !== term));
                                        } else {
                                            setTerms(t => [...t, term]);
                                        }
                                    }}
                                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all text-left ${isSelected
                                        ? 'bg-indigo-50 border-indigo-200'
                                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${isSelected
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-slate-300'
                                        }`}>
                                        {isSelected && <Check size={10} strokeWidth={4} />}
                                    </div>
                                    <span className={`text-[11px] font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                                        {term}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active Terms List */}
                {terms.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-50">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Terms to appear in PDF</label>
                        <div className="space-y-2">
                            {terms.map((term, idx) => (
                                <div key={idx} className="flex gap-2 items-start group">
                                    <div className="mt-2 w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                                    <div className="flex-1 text-xs text-slate-600 leading-relaxed">{term}</div>
                                    <button
                                        onClick={() => setTerms(t => t.filter((_, i) => i !== idx))}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <input
                        placeholder="Add a custom term..."
                        className="tn-input h-9 flex-1 text-xs"
                        value={newTerm}
                        onChange={e => setNewTerm(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newTerm) { setTerms([...terms, newTerm]); setNewTerm(''); } }}
                    />
                    <button
                        onClick={() => { if (newTerm) { setTerms([...terms, newTerm]); setNewTerm(''); } }}
                        className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <div className="flex gap-2.5">
                <button onClick={handleBack} className="flex-1 h-12 border-2 border-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"><ChevronLeft size={14} /> Back</button>
                <div className="flex-[3] flex gap-2">
                    <button onClick={handlePreview} disabled={isSubmitting} className="flex-1 border-2 border-indigo-600 text-indigo-600 h-12 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] hover:bg-indigo-50 transition-colors disabled:opacity-50">PREVIEW</button>
                    <button onClick={handleShare} disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white h-12 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50">
                        {isSubmitting ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto" />
                        ) : (
                            onSaveQuotation ? 'SAVE & SHARE' : 'SHARE QUOTE'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto pb-24 relative touch-pan-y">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-4 px-4 pt-2">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step === s ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100' : (step > s ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400')}`}>
                            {step > s ? <Check size={14} /> : s}
                        </div>
                        {s < 4 && <div className={`h-1 w-6 sm:w-12 rounded-full ${step > s ? 'bg-green-500' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            <PDFPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                pdfUrl={previewPdfUrl}
                onShare={handleShare}
                title="Quotation Preview"
            />
        </div>
    );
};

export default QuotationForm;
