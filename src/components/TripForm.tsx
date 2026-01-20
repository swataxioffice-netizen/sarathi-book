import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { calculateFareAsync } from '../utils/fareWorkerWrapper';
import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';
import { Trip } from '../utils/fare';
import { estimateParkingCharge } from '../utils/parking';
import { estimatePermitCharge } from '../utils/permits';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
import { useAdProtection } from '../hooks/useAdProtection';
import {
    MoveRight, MapPin, Plus, Eye,
    CheckCircle2,
    Repeat, Clock, UserCheck,
    Camera, Car, ChevronLeft,
    RotateCcw, Trash2, Share2, StickyNote, Check, PenLine
} from 'lucide-react';
import { generateReceiptPDF, SavedQuotation, shareReceipt } from '../utils/pdf';
import { saveToHistory } from '../utils/history';
import { useAuth } from '../contexts/AuthContext';
import PDFPreviewModal from './PDFPreviewModal';
import { calculateDistance } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { performOcr, parseOdometer } from '../utils/visionApi';
import { calculateGST, determineGSTType, GSTRate, GSTBreakdown } from '../utils/gstUtils';

const InterstitialAd = React.lazy(() => import('./InterstitialAd'));

// --- Types ---
type TripMode = 'drop' | 'outstation' | 'local' | 'custom' | null;

interface CalculationResult {
    total: number;
    gst: number;
    fare: number;
    distance: number;
    effectiveDistance: number;
    rateUsed: number;
    distanceCharge: number;
    waitingCharges: number;
    waitingHours: number;
    hillStationCharges: number;
    petCharges: number;
    driverBatta: number;
    nightStay: number;
    gstBreakdown?: GSTBreakdown;
    breakdown: string[];
}

interface TripFormProps {
    onSaveTrip: (trip: Trip) => void;
    onStepChange?: (step: number) => void;
    invoiceTemplate?: SavedQuotation | null;
    trips?: Trip[];
}

const DEFAULT_TERMS = [
    "Kms and Time are calculated on a Garage-to-Garage basis.",
    "Reimbursable expenses like Toll and Parking have been added as per actuals.",
    "Payment is due immediately upon completion of the trip.",
    "Driver Batta/Allowance covers food and accommodation for the driver.",
    "All disputes are subject to our registered office jurisdiction.",
    "This is a computer-generated invoice and requires no physical signature."
];

const TripForm: React.FC<TripFormProps> = ({ onSaveTrip, onStepChange, invoiceTemplate, trips }) => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const { triggerAction, onAdComplete, showAd, setShowAd } = useAdProtection();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track if this session has already saved a trip to prevent duplicates
    const sessionTripId = useRef<string | null>(null);
    const sessionInvoiceNo = useRef<string | null>(null);

    // Reset session refs when component unmounts or explicitly reset (if we had a reset function)
    useEffect(() => {
        sessionTripId.current = null;
        sessionInvoiceNo.current = null;
    }, []); // Only on mount, but actually we want to reset if user starts "New" trip? 
    // Since TripForm is likely remounted or step reset, for now relying on mount/unmount is okay 
    // BUT if the user clears the form without unmounting, we might have an issue. 
    // Given the current architecture (Wizard), a full reset usually reloads the component or resets state.
    // Let's ensure we reset if 'invoiceTemplate' changes or some clear signal? 
    // Actually, just init is fine for now as per user flow.

    // --- Wizard State ---
    const [step, setStep] = useState(1);

    // --- Form State ---
    const [mode, setMode] = useState<TripMode>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');

    // Journey
    const [fromLoc, setFromLoc] = useState('');
    const [toLoc, setToLoc] = useState('');
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [startKm, setStartKm] = useState(0);
    const [endKm, setEndKm] = useState(0);
    const [distanceOverride, setDistanceOverride] = useState<string>('');
    const [isOdometerMode, setIsOdometerMode] = useState(false);
    const [isFetchingKM, setIsFetchingKM] = useState(false);
    const [isScanning, setIsScanning] = useState<'start' | 'end' | null>(null);

    // Details
    const [days, setDays] = useState(1);

    const [customRate, setCustomRate] = useState(0);
    // Custom Table State for Invoice
    const [customLineItems, setCustomLineItems] = useState<{ description: string; sac: string; qty: number; rate: number; amount: number }[]>([
        { description: 'Service Charge', sac: '9966', qty: 1, rate: 0, amount: 0 }
    ]);

    // Local Package State
    const [hourlyPackage, setHourlyPackage] = useState<string>('');
    const [localPackageHours, setLocalPackageHours] = useState(0);
    const [localPackageKm, setLocalPackageKm] = useState(0);

    // Charges
    const [toll, setToll] = useState('0');
    const [parking, setParking] = useState('0');
    const [permit, setPermit] = useState('0');
    const [driverBatta, setDriverBatta] = useState('0');
    const [nightCharge, setNightCharge] = useState('0');
    const [hillStationCharge, setHillStationCharge] = useState('0');
    const [petCharge, setPetCharge] = useState('0');
    const [extraItems, setExtraItems] = useState<{ description: string; amount: number; qty?: number; rate?: number; sac?: string }[]>([]);

    // Manual Overrides Flags
    const [manualDriverBatta, setManualDriverBatta] = useState(false);
    const [manualToll, setManualToll] = useState(false);
    const [manualParking, setManualParking] = useState(false);
    const [manualPermit, setManualPermit] = useState(false);
    const [manualHillStation, setManualHillStation] = useState(false);

    // Other Charges Helper State
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
    const [terms, setTerms] = useState<string[]>([]);
    const [newTerm, setNewTerm] = useState('');
    // 5% fixed as per requirement
    const gstRate: GSTRate = 5;

    // Results
    const [showPreview, setShowPreview] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState('');



    // Local Trip Log
    const [startTimeLog, setStartTimeLog] = useState('');
    const [endTimeLog, setEndTimeLog] = useState('');
    const [showMap, setShowMap] = useState(false);

    const handleMapSelect = (pickup: string, drop: string, dist: number, tollAmt?: number, pLat?: number, pLng?: number, dLat?: number, dLng?: number) => {
        setFromLoc(pickup);
        setToLoc(drop);
        setDistanceOverride(dist.toString());
        if (pLat && pLng) setPickupCoords({ lat: pLat, lng: pLng });
        if (dLat && dLng) setDropCoords({ lat: dLat, lng: dLng });

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

    // --- Derived Values ---
    const userVehicles = useMemo(() => settings.vehicles || [], [settings.vehicles]);

    const vehicleCategory = useMemo(() => {
        if (!selectedVehicleId) return null;

        const userV = userVehicles.find(v => v.id === selectedVehicleId);
        if (userV) {
            const category = (userV.model || '').toLowerCase();
            if (category.includes('hatchback')) return 'hatchback';
            if (category.includes('innova crysta')) return 'premium_suv';
            if (category.includes('suv') || category.includes('ertiga') || category.includes('innova')) return 'suv';
            if (category.includes('tempo') || category.includes('traveller')) return 'tempo';
            if (category.includes('mini bus') || category.includes('minibus')) return 'minibus';
            if (category.includes('bus')) return 'bus';
            return 'sedan';
        }

        // Handle case where selectedVehicleId is directly the category key (e.g. from templates)
        if (selectedVehicleId && (TARIFFS.vehicles as any)[selectedVehicleId]) {
            return selectedVehicleId;
        }

        return 'sedan';
    }, [selectedVehicleId, userVehicles]);

    const currentVehicleData = useMemo(() => {
        if (!vehicleCategory) return null;
        return (TARIFFS.vehicles as Record<string, any>)[vehicleCategory] || TARIFFS.vehicles.sedan;
    }, [vehicleCategory]);

    const nextInvoiceNo = useMemo(() => {
        const vehicle = userVehicles.find(v => v.id === selectedVehicleId);
        let prefix = 'INV-';

        if (vehicle && vehicle.number) {
            // Use last 4 digits of vehicle number for the series
            const vNum = vehicle.number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const shortNum = vNum.length > 4 ? vNum.slice(-4) : vNum;
            prefix = `INV-${shortNum}-`;
        } else {
            // General series fallback
            prefix = 'INV-GEN-';
        }

        if (!trips || trips.length === 0) return `${prefix}001`;

        const sequences = trips
            .map(t => t.invoiceNo)
            .filter((n): n is string => !!n && n.startsWith(prefix))
            .map(n => {
                const parts = n.split('-');
                return parseInt(parts[parts.length - 1]);
            })
            .filter(n => !isNaN(n));

        const max = sequences.length > 0 ? Math.max(...sequences) : 0;
        return `${prefix}${(max + 1).toString().padStart(3, '0')}`;
    }, [selectedVehicleId, trips, userVehicles]);

    // --- Side Effects ---

    useEffect(() => {
        if (onStepChange) onStepChange(step);
    }, [step, onStepChange]);

    useEffect(() => {
        if (invoiceTemplate) {
            setCustomerName(invoiceTemplate.customerName);
            if (invoiceTemplate.customerAddress) setBillingAddress(invoiceTemplate.customerAddress);
            if (invoiceTemplate.customerGstin) setCustomerGst(invoiceTemplate.customerGstin);
            if (invoiceTemplate.vehicleType) setSelectedVehicleId(invoiceTemplate.vehicleType);
            if (invoiceTemplate.gstEnabled) setIncludeGst(true);
            setStep(1);
        }
    }, [invoiceTemplate]);

    // Auto Distance Calculation
    useEffect(() => {
        const autoCalculateTrip = async () => {
            if (mode === 'local' || mode === 'custom' || isOdometerMode) {
                setIsFetchingKM(false);
                return;
            }
            if (!fromLoc || !toLoc) return;

            setIsFetchingKM(true);
            try {
                const origin = pickupCoords || fromLoc;
                const destination = dropCoords || toLoc;

                if (pickupCoords && dropCoords) {
                    const advanced = await calculateAdvancedRoute(pickupCoords, dropCoords);
                    if (advanced) {
                        const multiplier = mode === 'outstation' ? 2 : 1;
                        const distVal = advanced.distanceKm * multiplier;
                        setDistanceOverride(distVal.toString());

                        if (advanced.tollPrice > 0 && !manualToll) {
                            let baseToll = advanced.tollPrice;
                            if (selectedVehicleId.includes('tempo')) baseToll *= 1.6;
                            let finalToll = mode === 'drop' ? baseToll : (days > 1 ? baseToll * 2 : Math.round(baseToll * 1.6));
                            setToll(Math.round(finalToll).toString());
                        }
                    } else {
                        const res = await calculateDistance(origin, destination);
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

                if (!manualPermit) {
                    const permitEst = estimatePermitCharge(fromLoc, toLoc, selectedVehicleId);
                    setPermit(permitEst ? permitEst.amount.toString() : '0');
                }
                if (!manualParking) {
                    const pInfo = estimateParkingCharge(toLoc);
                    setParking(pInfo ? pInfo.amount.toString() : '0');
                }
            } catch (error) {
                console.error('Error calculating trip data:', error);
            } finally {
                setIsFetchingKM(false);
            }
        };

        const timer = setTimeout(autoCalculateTrip, 1000);
        return () => clearTimeout(timer);
    }, [fromLoc, toLoc, pickupCoords, dropCoords, mode, isOdometerMode, selectedVehicleId, days, manualPermit, manualParking, manualToll]);

    // Odometer sync
    useEffect(() => {
        if (isOdometerMode) {
            const dist = Math.max(0, endKm - startKm);
            setDistanceOverride(dist.toString());
        }
    }, [isOdometerMode, startKm, endKm]);

    // Odometer OCR Handler
    const handleOdometerScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isScanning) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            try {
                const { lines } = await performOcr(base64);
                const { mileage } = parseOdometer(lines);
                if (mileage) {
                    if (isScanning === 'start') {
                        setStartKm(mileage);
                        // Auto-calculate End KM if distance exists and End KM is not yet set
                        if (distanceOverride && (!endKm || endKm <= mileage)) {
                            setEndKm(mileage + (parseFloat(distanceOverride) || 0));
                        }
                    }
                    if (isScanning === 'end') setEndKm(mileage);
                    setIsOdometerMode(true);
                } else {
                    alert('Could not detect odometer reading. Please enter manually.');
                }
            } catch (err) {
                console.error('OCR Error:', err);
                alert('Scan failed. Please type manually.');
            } finally {
                setIsScanning(null);
            }
        };
        reader.readAsDataURL(file);
    };

    // Auto Charges
    // Auto Rate Update
    useEffect(() => {
        const vehicle = currentVehicleData;
        if (vehicle) {
            setCustomRate(mode === 'outstation' ? vehicle.round_trip_rate : vehicle.one_way_rate);
        } else if (!selectedVehicleId) {
            setCustomRate(0);
        }
    }, [currentVehicleData, mode, selectedVehicleId]);

    // Auto Batta Update
    useEffect(() => {
        const vehicle = currentVehicleData;
        if (vehicle && !manualDriverBatta) {
            let batta = 0;
            const dist = parseFloat(distanceOverride) || 0;
            if (mode === 'outstation') {
                const estDays = Math.max(days, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
                batta = vehicle.driver_bata * estDays;
            } else if (mode === 'drop') {
                const estDays = Math.max(1, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
                batta = (dist > 40 || vehicle.is_heavy_vehicle) ? vehicle.driver_bata * estDays : 0;
            }
            setDriverBatta(batta.toString());
        }
    }, [selectedVehicleId, mode, days, distanceOverride, manualDriverBatta, currentVehicleData]);

    // Simplified Odometer Sync
    useEffect(() => {
        if (isOdometerMode && endKm > startKm) {
            const dist = endKm - startKm;
            setDistanceOverride(dist.toString());
            if (mode === 'local') setLocalPackageKm(dist);
        }
    }, [startKm, endKm, isOdometerMode, mode]);

    useEffect(() => {
        if (mode === 'local' && startTimeLog && endTimeLog) {
            const start = new Date(`2000-01-01T${startTimeLog}`);
            let end = new Date(`2000-01-01T${endTimeLog}`);
            if (end < start) {
                end = new Date(`2000-01-02T${endTimeLog}`);
            }
            const diffMs = end.getTime() - start.getTime();
            const diffHrs = diffMs / (1000 * 60 * 60);
            if (diffHrs > 0) {
                const hours = parseFloat(diffHrs.toFixed(1));
                setLocalPackageHours(hours);

                // Auto-select package
                if (hours <= 2) setHourlyPackage('2hr_20km');
                else if (hours <= 4) setHourlyPackage('4hr_40km');
                else if (hours <= 8) setHourlyPackage('8hr_80km');
                else setHourlyPackage('12hr_120km');
            }
        }
    }, [startTimeLog, endTimeLog, mode]);

    const performCalculation = async (): Promise<CalculationResult | null> => {
        if (mode !== 'custom' && (!selectedVehicleId || !vehicleCategory)) return null;
        if (mode === 'local' && !hourlyPackage) return null;
        try {
            let serviceType = mode === 'outstation' ? 'round_trip' : (mode === 'local' ? 'local_hourly' : 'one_way');
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
            const finalDist = dist;

            const res = await calculateFareAsync(
                serviceType,
                vehicleCategory || 'sedan',
                finalDist,
                mode === 'outstation' ? days : 1,
                calcExtraHours,
                manualHillStation && parseFloat(hillStationCharge) > 0,
                mode === 'custom' ? undefined : overrideRate,
                manualDriverBatta ? parseFloat(driverBatta) : undefined,
                manualHillStation ? parseFloat(hillStationCharge) : undefined,
                parseFloat(petCharge) || 0,
                parseFloat(nightCharge) || 0,
                hourlyPackage
            );

            const otherExtras = (parseFloat(permit) || 0) + (parseFloat(parking) || 0) + (parseFloat(toll) || 0) + extraItems.reduce((a, b) => a + b.amount, 0);
            const subtotal = (mode === 'custom' ? customBaseTotal : res.totalFare) + otherExtras;

            const gstRes = calculateGST(subtotal, gstRate, settings.gstin, customerGst);
            const gstCalculated = includeGst ? gstRes.totalTax : 0;
            const total = subtotal + gstCalculated;

            const calcRes: CalculationResult = {
                total, gst: gstCalculated, gstBreakdown: includeGst ? gstRes : undefined,
                fare: subtotal, distance: dist, breakdown: res.breakdown,
                effectiveDistance: res.effectiveDistance || dist, rateUsed: res.rateUsed || 0, distanceCharge: res.details.fare,
                waitingCharges: 0, waitingHours: mode === 'local' ? localPackageHours : 0,
                hillStationCharges: res.details.hillStation, petCharges: res.details.petCharge, driverBatta: res.details.driverBatta, nightStay: 0
            };
            return calcRes;
        } catch (err) {
            console.error(err); return null;
        }
    };

    useEffect(() => {
        const timer = setTimeout(performCalculation, 300);
        return () => clearTimeout(timer);
    }, [mode, selectedVehicleId, distanceOverride, days, localPackageHours, hourlyPackage, customRate, toll, parking, permit, driverBatta, nightCharge, hillStationCharge, petCharge, extraItems, includeGst, manualDriverBatta, manualHillStation, customLineItems]);

    const handleNext = () => setStep(s => Math.min(4, s + 1));
    const handleBack = () => setStep(s => Math.max(1, s - 1));

    const handlePreview = async () => {
        const res = await performCalculation();
        if (!res) return;
        const currentV = userVehicles.find(v => v.id === selectedVehicleId);

        // Use existing session ID/Invoice if available, or generate purely for preview (don't set session yet? or should we?)
        // For preview, we don't necessarily want to "lock in" the invoice number unless saved.
        // But to be consistent with what WILL be saved:
        const previewId = sessionTripId.current || crypto.randomUUID();
        const previewInvoiceNo = sessionInvoiceNo.current || nextInvoiceNo;



        // Construct items for Consistent PDF Format
        const pdfItems = [];

        // 1. Base Fare
        if (mode !== 'custom') {
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

            pdfItems.push({
                description: baseDesc,
                amount: res.distanceCharge,
                rate: baseRate > 0 ? `${baseRate}/KM` : `${res.distanceCharge}`,
                quantity: 1
            });
        }

        // 2. Add Charges
        if (res.driverBatta > 0) {
            const dist = res.effectiveDistance || res.distance;
            let daysUsed = mode === 'outstation' ? Math.max(days, Math.ceil(dist / TRIP_LIMITS.max_km_per_day)) : 1;
            if (mode === 'drop') {
                daysUsed = Math.max(1, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
            }
            const battaRate = res.driverBatta / daysUsed;
            pdfItems.push({
                description: `Driver Batta [${daysUsed} Day${daysUsed > 1 ? 's' : ''} * ${battaRate}/Day]`,
                amount: res.driverBatta,
                rate: `${battaRate}/Day`,
                quantity: daysUsed
            });
        }
        if (parseFloat(toll) > 0) pdfItems.push({ description: 'Toll Charges', amount: parseFloat(toll), rate: toll, quantity: 1 });
        if (parseFloat(parking) > 0) pdfItems.push({ description: 'Parking Charges', amount: parseFloat(parking), rate: parking, quantity: 1 });
        if (parseFloat(permit) > 0) pdfItems.push({ description: 'Permit Charges', amount: parseFloat(permit), rate: permit, quantity: 1 });
        if (res.hillStationCharges > 0) pdfItems.push({ description: 'Hill Station Charges', amount: res.hillStationCharges, rate: res.hillStationCharges.toString(), quantity: 1 });
        if (parseFloat(nightCharge) > 0) pdfItems.push({ description: 'Night Charges', amount: parseFloat(nightCharge), rate: nightCharge, quantity: 1 });

        // 3. User Added Extra Items
        if (mode === 'custom') {
            customLineItems.forEach(i => pdfItems.push({
                description: i.description,
                amount: i.amount,
                rate: i.rate.toString(),
                quantity: i.qty,
                sac: i.sac
            }));
        } else {
            // Standard Base Calculation added above
        }

        extraItems.forEach(i => pdfItems.push({ description: i.description, amount: i.amount, rate: i.amount.toString(), quantity: 1 }));

        const tripData: any = {
            id: previewId, invoiceNo: previewInvoiceNo, customerName: customerName || 'Valued Customer',
            customerPhone, customerGst, billingAddress, from: fromLoc, to: toLoc, date: new Date().toISOString().split('T')[0],
            mode: 'custom',
            totalFare: res.total, fare: res.fare, gst: res.gst,
            extraItems: pdfItems,
            previewStep: step,
            vehicleNumber: currentV?.number,
            vehicleModel: currentV?.model,
            gstRate: includeGst ? gstRate : 0,
            gstType: includeGst ? (res.gstBreakdown?.type || 'CGST_SGST') : undefined,
            rcmEnabled: rcmEnabled,
            terms: terms,
            waitingHours: res.waitingHours, days, vehicleType: vehicleCategory,
            startKm, endKm, distance: res.effectiveDistance || res.distance
        };
        const doc = await generateReceiptPDF(tripData, { ...settings, gstEnabled: includeGst, rcmEnabled, userId: user?.id, vehicleNumber: currentV?.number || settings.vehicles?.[0]?.number || 'N/A' });
        setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
        setShowPreview(true);
    };

    const handleShare = async () => {
        const res = await performCalculation();
        if (!res) return;

        // Ensure we have a session ID/Invoice if not already saved
        if (!sessionTripId.current) sessionTripId.current = crypto.randomUUID();
        if (!sessionInvoiceNo.current) sessionInvoiceNo.current = nextInvoiceNo;

        const currentV = userVehicles.find(v => v.id === selectedVehicleId);

        // Construct items for Consistent PDF Format (Same as Quotation)
        const pdfItems = [];

        if (mode !== 'custom') {
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
                // Append actual usage
                if (localPackageHours > 0 || localPackageKm > 0) {
                    baseDesc += ` (Journey: ${localPackageHours}hrs/${localPackageKm}km)`;
                }
            } else if (baseRate > 0) {
                baseDesc += ` [${baseDist} KM * ${baseRate}/KM]`;
            }

            pdfItems.push({
                description: baseDesc,
                amount: res.distanceCharge,
                rate: baseRate > 0 ? `${baseRate}/KM` : `${res.distanceCharge}`,
                quantity: 1
            });
        }

        if (res.driverBatta > 0) {
            const dist = res.effectiveDistance || res.distance;
            let daysUsed = mode === 'outstation' ? Math.max(days, Math.ceil(dist / TRIP_LIMITS.max_km_per_day)) : 1;
            if (mode === 'drop') {
                daysUsed = Math.max(1, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
            }
            const battaRate = res.driverBatta / daysUsed;
            pdfItems.push({
                description: `Driver Batta [${daysUsed} Day${daysUsed > 1 ? 's' : ''} * ${battaRate}/Day]`,
                amount: res.driverBatta,
                rate: `${battaRate}/Day`,
                quantity: daysUsed
            });
        }
        if (parseFloat(toll) > 0) pdfItems.push({ description: 'Toll Charges', amount: parseFloat(toll), rate: toll, quantity: 1 });
        if (parseFloat(parking) > 0) pdfItems.push({ description: 'Parking Charges', amount: parseFloat(parking), rate: parking, quantity: 1 });
        if (parseFloat(permit) > 0) pdfItems.push({ description: 'Permit Charges', amount: parseFloat(permit), rate: permit, quantity: 1 });
        if (res.hillStationCharges > 0) pdfItems.push({ description: 'Hill Station Charges', amount: res.hillStationCharges, rate: res.hillStationCharges.toString(), quantity: 1 });
        if (parseFloat(nightCharge) > 0) pdfItems.push({ description: 'Night Charges', amount: parseFloat(nightCharge), rate: nightCharge, quantity: 1 });

        if (mode === 'custom') {
            customLineItems.forEach(i => pdfItems.push({
                description: i.description,
                amount: i.amount,
                rate: i.rate.toString(),
                quantity: i.qty,
                sac: i.sac
            }));
        }

        extraItems.forEach(i => pdfItems.push({ description: i.description, amount: i.amount, rate: i.amount.toString(), quantity: 1 }));

        const tripData: any = {
            id: sessionTripId.current, invoiceNo: sessionInvoiceNo.current, customerName: customerName || 'Valued Customer',
            customerPhone, customerGst, billingAddress, from: fromLoc, to: toLoc, date: new Date().toISOString().split('T')[0],
            startTime: mode === 'local' ? startTimeLog : undefined,
            endTime: mode === 'local' ? endTimeLog : undefined,
            mode: 'custom',
            totalFare: res.total, fare: res.fare, gst: res.gst,
            extraItems: pdfItems,
            vehicleNumber: currentV?.number,
            vehicleModel: currentV?.model,
            gstRate: includeGst ? gstRate : 0,
            gstType: includeGst ? (res.gstBreakdown?.type || 'CGST_SGST') : undefined,
            rcmEnabled: rcmEnabled,
            terms: terms,
            waitingHours: res.waitingHours, days, vehicleType: vehicleCategory,
            startKm, endKm, distance: res.effectiveDistance || res.distance
        };

        try {
            await shareReceipt(tripData, { ...settings, gstEnabled: includeGst, rcmEnabled, userId: user?.id, vehicleNumber: currentV?.number || settings.vehicles?.[0]?.number || 'N/A' });
        } catch (err) {
            console.error('Sharing failed, falling back to preview', err);
            handlePreview();
        }
    };

    const handleSave = async () => {
        const res = await performCalculation();
        if (!res) return;
        if (customerName) saveToHistory('customer_name', customerName);
        if (customerPhone) saveToHistory('customer_phone', customerPhone);
        if (fromLoc) saveToHistory('location', fromLoc);
        if (toLoc) saveToHistory('location', toLoc);
        const currentV = userVehicles.find(v => v.id === selectedVehicleId);

        // LOCK IN the ID and Invoice Number for this session
        if (!sessionTripId.current) sessionTripId.current = crypto.randomUUID();
        if (!sessionInvoiceNo.current) sessionInvoiceNo.current = nextInvoiceNo;

        onSaveTrip({
            id: sessionTripId.current, invoiceNo: sessionInvoiceNo.current, customerName: customerName || 'Cash Guest', customerPhone, customerGst,
            from: fromLoc, to: toLoc, billingAddress, startKm: isOdometerMode ? startKm : 0, endKm: isOdometerMode ? endKm : (parseFloat(distanceOverride) || 0),
            startTime: '', endTime: '', toll: parseFloat(toll) || 0, parking: parseFloat(parking) || 0, nightBata: parseFloat(nightCharge) || 0,
            baseFare: settings.baseFare, ratePerKm: res.rateUsed, totalFare: res.total, fare: res.fare, distanceCharge: res.distanceCharge,
            distance: res.distance, effectiveDistance: res.effectiveDistance, gst: res.gst, date: new Date().toISOString(),
            mode: mode as any, notes: '', waitingHours: res.waitingHours, waitingCharges: 0, hillStationCharges: res.hillStationCharges,
            petCharges: res.petCharges, permit: parseFloat(permit) || 0, days, driverBatta: res.driverBatta, extraItems,
            rcmEnabled, // Save RCM status
            terms, // Save Terms
            gstRate: includeGst ? gstRate : 0, // Save Rate
            gstType: includeGst ? (res.gstBreakdown?.type || 'CGST_SGST') : undefined,
            vehicleId: selectedVehicleId,
            vehicleNumber: currentV?.number,
            vehicleModel: currentV?.model
        });
    };

    const handleSaveAndShare = async () => {
        const res = await performCalculation();
        if (!res) return;
        // Proceed with fresh res but share logic will reuse the session IDs from handleSave
        await handleSave();
        await handleShare();

        setStep(1);
        if (onStepChange) onStepChange(1);
    };

    // --- Helper Functions ---
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
                Select Trip Type
            </h2>
            <div className="grid grid-cols-1 gap-2.5 px-2">
                {(['drop', 'outstation', 'local', 'custom'] as const).map((m) => (
                    <button key={m} onClick={() => {
                        if (mode !== m) {
                            setMode(m);
                            // Reset Data on Mode Switch
                            setFromLoc(''); setToLoc('');
                            setStartKm(0); setEndKm(0); setDistanceOverride('');
                            setDays(1); setLocalPackageHours(8);
                            setExtraItems([]);
                            setToll('0'); setParking('0'); setPermit('0'); setDriverBatta('0');
                            setNightCharge('0'); setHillStationCharge('0'); setPetCharge('0');
                            setCustomLineItems([{ description: 'Service Charge', sac: '9966', qty: 1, rate: 0, amount: 0 }]);
                            setIsOdometerMode(false);
                            setManualDriverBatta(false); setManualToll(false); setManualParking(false);
                            setManualPermit(false); setManualHillStation(false);
                        }
                        handleNext();
                    }} className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${mode === m ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mode === m ? 'bg-white/20' : 'bg-slate-50'}`}>
                            {m === 'drop' && <MoveRight size={18} />}
                            {m === 'outstation' && <Repeat size={18} />}
                            {m === 'local' && <Clock size={18} />}
                            {m === 'custom' && <PenLine size={18} />}
                        </div>
                        <div className="text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest block">{m === 'drop' ? 'One Way Drop' : m === 'outstation' ? 'Round Trip' : m === 'local' ? 'Local Package' : 'Custom Service'}</span>
                            <span className={`text-[8px] font-bold uppercase opacity-60 tracking-tight ${mode === m ? 'text-white' : 'text-slate-400'}`}>
                                {m === 'drop' && 'Point to point drop'}
                                {m === 'outstation' && 'Multi-day outstation'}
                                {m === 'local' && 'Local hourly packages'}
                                {m === 'custom' && 'Manual price entry'}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Journey Section */}
            <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Journey Details</h3>
                <div className="space-y-3">
                    <PlacesAutocomplete
                        label="Pickup"
                        value={fromLoc}
                        onChange={setFromLoc}
                        onPlaceSelected={(p) => { setFromLoc(p.address); setPickupCoords({ lat: p.lat, lng: p.lng }); }}
                        onMapClick={() => setShowMap(true)}
                    />
                    {mode !== 'local' && (
                        <PlacesAutocomplete
                            label="Drop"
                            value={toLoc}
                            onChange={setToLoc}
                            onPlaceSelected={(p) => { setToLoc(p.address); setDropCoords({ lat: p.lat, lng: p.lng }); }}
                            onMapClick={() => setShowMap(true)}
                        />
                    )}
                </div>

                {/* Odometer Toggle Moved Here */}
                {mode !== 'local' && (
                    <div className="flex justify-end pt-1">
                        <button onClick={() => setIsOdometerMode(!isOdometerMode)} className="px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black rounded-lg uppercase">
                            Use {isOdometerMode ? 'Direct KM' : 'Odometer'}
                        </button>
                    </div>
                )}

                <div className="pt-1 border-t border-slate-50 space-y-3">
                    {!isOdometerMode && mode !== 'local' && (
                        <input type="number"
                            value={isFetchingKM ? '' : distanceOverride}
                            onChange={(e) => {
                                setDistanceOverride(e.target.value);
                            }}
                            className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                            placeholder={isFetchingKM ? "Calculating..." : "0"}
                        />
                    )}
                    {isOdometerMode && mode !== 'local' && (
                        <div className="mt-2"></div>
                    )}
                    {(isOdometerMode || (mode === 'outstation' || (mode === 'drop' && parseFloat(distanceOverride) > 30))) && mode !== 'local' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase ml-1 flex justify-between items-center">Start KM <button onClick={() => { setIsScanning('start'); fileInputRef.current?.click(); }} className="text-blue-600"><Camera size={10} /></button></p>
                                <input
                                    type="number"
                                    value={startKm || ''}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setStartKm(val);
                                        // Auto-calculate End KM if distance exists and End KM is not yet set
                                        if (val > 0 && distanceOverride && (!endKm || endKm <= val)) {
                                            const d = parseFloat(distanceOverride) || 0;
                                            setEndKm(val + d);
                                        }
                                    }}
                                    className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase ml-1 flex justify-between items-center">End KM <button onClick={() => { setIsScanning('end'); fileInputRef.current?.click(); }} className="text-blue-600"><Camera size={10} /></button></p>
                                <input type="number" value={endKm || ''} onChange={(e) => setEndKm(parseFloat(e.target.value) || 0)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder="0" />
                            </div>
                        </div>
                    )}
                </div>

                {showMap && (
                    <MapPicker
                        onLocationSelect={handleMapSelect}
                        onClose={() => setShowMap(false)}
                    />
                )}

                <div className="pt-1 border-t border-slate-50 space-y-3">
                    {/* Redundant Journey Details Header Removed */}


                    {mode === 'custom' && (
                        <div className="pt-2">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Invoice Items</h3>
                            <div className="space-y-2">
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
                                                        // Update rate with raw value to allow clearing to empty string if needed, or handle 0
                                                        // Ideally, we persist the number, but React number inputs can be tricky with 0.
                                                        // Let's store direct value for inputs if we changed the type, but here we can just use valueAsNumber or handle string.
                                                        // FIX: Cast to any or change type to string | number in definition. For now, we will assume strict number but allow empty string handling via controlled input logic if we changed the type.
                                                        // Since we are using type="number", we can use e.target.valueAsNumber.

                                                        // Simpler fix: Allow the input to be empty string in UI logic if we could, 
                                                        // but state is typed number.
                                                        // Best approach for "unable to delete 0":
                                                        // If the user clears the input, it becomes "", parseFloat becomes NaN or 0.
                                                        // If we set state to 0, it shows "0".
                                                        // To fix, we should likely allow the string value in the input, OR handle the "0" case better.
                                                        // But the user says "unable to delete the 0". This implies they backspace and it stays 0.
                                                        // This happens because `value={item.rate}` where rate is 0.
                                                        // We can change value to `{item.rate === 0 ? '' : item.rate}` but that hides actual 0 rates.
                                                        // Better: check if the string is empty.

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
                        </div>
                    )}

                    {mode === 'local' && (
                        <div className="pt-3 border-t border-slate-50 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Start Time</label>
                                    <input type="time" value={startTimeLog} onChange={e => setStartTimeLog(e.target.value)} className="tn-input h-10 w-full font-bold text-xs bg-slate-50 border-slate-200" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">End Time</label>
                                    <input type="time" value={endTimeLog} onChange={e => setEndTimeLog(e.target.value)} className="tn-input h-10 w-full font-bold text-xs bg-slate-50 border-slate-200" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-2 py-1 bg-blue-50 rounded-lg">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Calculated:</span>
                                <div className="flex gap-3">
                                    <span className="text-xs font-black text-slate-700">{localPackageHours} Hrs</span>
                                    <span className="text-xs font-black text-slate-700">{localPackageKm} KM</span>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </div >

            {/* Vehicle Section */}
            < div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4" >
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Car size={12} /> Fleet Profile</h3>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Select Cab</label>
                        <select
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900"
                        >
                            <option value="">Choose from Fleet</option>
                            {userVehicles.map((v) => (
                                <option key={v.id} value={v.id}>{v.model} - {v.number}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                        {mode !== 'local' && (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Base Rate / KM</label>
                                <input type="number" value={customRate || ''} onChange={e => setCustomRate(parseFloat(e.target.value) || 0)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder="0" />
                            </div>
                        )}
                        {mode === 'outstation' ? (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Trip Days</label>
                                <input type="number" value={days} onChange={e => setDays(parseFloat(e.target.value) || 1)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder="1" />
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
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 ring-1 ring-blue-600 ring-offset-1'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}
                                                        ${!selectedVehicleId ? 'opacity-50 cursor-not-allowed' : ''}
                                                    `}
                                                disabled={!selectedVehicleId}
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
                                    <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm mt-3">
                                        <div className="flex-1 text-center border-r border-slate-100">
                                            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Includes</p>
                                            <p className="text-base font-black text-slate-700">{hourlyPackage === '8hr_80km' ? 80 : hourlyPackage === '12hr_120km' ? 120 : hourlyPackage === '4hr_40km' ? 40 : 20} KM</p>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Duration</p>
                                            <p className="text-base font-black text-slate-700">{hourlyPackage === '8hr_80km' ? 8 : hourlyPackage === '12hr_120km' ? 12 : hourlyPackage === '4hr_40km' ? 4 : 2} HRS</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm mt-3 text-center">
                                        <p className="text-[10px] text-slate-400 italic">Enter Start/End Time & KM in Journey Details above</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div >

            <div className="flex gap-2.5">
                <button onClick={handleBack} className="flex-1 h-12 border-2 border-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"><ChevronLeft size={14} /> Back</button>
                <div className="flex-[3] flex gap-2">
                    {mode === 'custom' && (
                        <button onClick={handlePreview} disabled={customLineItems.length === 0} className="flex-1 h-12 border-2 border-indigo-600 text-indigo-600 font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] flex items-center justify-center hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            PREVIEW
                        </button>
                    )}
                    <button onClick={handleNext} disabled={(mode !== 'custom' && (!selectedVehicleId || (!distanceOverride && mode !== 'local'))) || (mode === 'custom' && customLineItems.length === 0)} className="flex-1 tn-button-primary h-12 text-[10px] tracking-[0.2em]">CONTINUE</button>
                </div>
            </div>
        </div >
    );

    const renderStep3 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 px-2">
                <Plus className="text-blue-600" size={14} /> Additional Charges
            </h2>

            <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                {/* Main Charges Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Batta</label>
                            {manualDriverBatta && <button onClick={() => setManualDriverBatta(false)} className="text-blue-600"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={driverBatta} onChange={e => { setDriverBatta(e.target.value); setManualDriverBatta(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 ${manualDriverBatta ? 'bg-blue-50 text-blue-700' : ''}`} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Tolls</label>
                            {manualToll && <button onClick={() => setManualToll(false)} className="text-blue-600"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={toll} onChange={e => { setToll(e.target.value); setManualToll(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 ${manualToll ? 'bg-blue-50 text-blue-700' : ''}`} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Parking</label>
                            {manualParking && <button onClick={() => setManualParking(false)} className="text-blue-600"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={parking} onChange={e => { setParking(e.target.value); setManualParking(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 ${manualParking ? 'bg-blue-50 text-blue-700' : ''}`} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Permit</label>
                            {manualPermit && <button onClick={() => setManualPermit(false)} className="text-blue-600"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={permit} onChange={e => { setPermit(e.target.value); setManualPermit(true); }} className={`tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 ${manualPermit ? 'bg-blue-50 text-blue-700' : ''}`} placeholder="0" />
                    </div>
                </div>

                <div className="h-px bg-slate-50 my-1" />

                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Night Drive (11 PM - 5 AM)</label>
                    <input type="number" value={nightCharge} onChange={e => setNightCharge(e.target.value)} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs text-slate-900" placeholder="0" />
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">More Charges</label>
                    <div className="flex gap-2">
                        <select className="tn-input h-10 flex-1 bg-slate-50 border-slate-200 text-xs text-slate-900 shadow-none" value={selectedChargeType} onChange={(e) => { setSelectedChargeType(e.target.value); if (e.target.value !== 'Custom') setCustomChargeName(''); }}>
                            <option value="">Select Charge Type</option>
                            <option value="Custom">Custom Charge</option>
                            <option value="Cleaning Fee">Cleaning Fee</option>
                            <option value="Driver Allowance">Driver Allowance</option>
                            <option value="Guide Fee">Guide Fee</option>
                            <option value="Luggage Charge">Luggage Charge</option>
                            <option value="Airport Entry">Airport Entry</option>
                            <option value="FastTag Recharge">FastTag Recharge</option>
                            <option value="Decoration">Decoration</option>
                            <option value="Waiting Charge">Waiting Charge</option>
                        </select>
                    </div>

                    {selectedChargeType && (
                        <div className="flex gap-2 animate-in slide-in-from-top-2">
                            {selectedChargeType === 'Custom' && <input placeholder="Charge Name" className="tn-input h-10 flex-[2] bg-white font-bold text-xs" value={customChargeName} onChange={e => setCustomChargeName(e.target.value)} autoFocus />}
                            <input type="number" placeholder="Amt" className="tn-input h-10 flex-1 bg-white font-black text-xs" value={customChargeAmount} onChange={e => setCustomChargeAmount(e.target.value)} />
                            <button onClick={handleAddCharge} className="w-10 h-10 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center shrink-0">
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {extraItems.length > 0 && (
                        <div className="space-y-2 pt-1">
                            {extraItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl group/item">
                                    <span className="text-[10px] font-bold text-slate-600">{item.description}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-900">₹{item.amount.toLocaleString()}</span>
                                        <button onClick={() => setExtraItems(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
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
                    <button onClick={handlePreview} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-colors"><Eye size={20} /></button>
                    <button onClick={handleNext} className="flex-1 tn-button-primary h-12 text-[10px] tracking-[0.2em]">CONTINUE</button>
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
                        <span className="text-[9px] font-black text-slate-500 uppercase">Invoice #: <span className="text-blue-600">{nextInvoiceNo}</span></span>
                    </div>
                </div>
                <div className="space-y-3">
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${includeGst ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
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
                            }} className={`w-8 h-4 rounded-full relative ${includeGst ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${includeGst ? 'left-4.5' : 'left-0.5'}`} /></button>
                        </div>
                        {includeGst && (
                            <div className="flex items-center gap-2 pt-1 border-t border-blue-100/50">
                                <span className="text-[9px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">5% Rate</span>
                                <span className="text-[8px] font-bold text-slate-400 ml-auto uppercase">
                                    {determineGSTType(settings.gstin, customerGst) === 'IGST' ? 'IGST (Inter-State)' : 'CGST+SGST (Intra)'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${rcmEnabled ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center w-full">
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
            </div>

            {/* Terms Section */}
            <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><StickyNote size={12} /> INVOICE TERMS</h3>
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
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-slate-300'
                                        }`}>
                                        {isSelected && <Check size={10} strokeWidth={4} />}
                                    </div>
                                    <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>
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
                                    <div className="mt-2 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
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
                <button onClick={handleBack} className="flex-1 h-12 border-2 border-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[9px] tracking-widest">Back</button>
                <div className="flex-[3] flex gap-2">
                    <button onClick={handlePreview} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-colors"><Eye size={20} /></button>
                    <button onClick={() => triggerAction(handleSaveAndShare)} className="flex-1 bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"><Share2 size={16} /> SAVE & SHARE</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto space-y-4 pb-32 px-2 sm:px-0">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-1 px-4">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step === s ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' : (step > s ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400')}`}>
                            {step > s ? <CheckCircle2 size={14} /> : s}
                        </div>
                        {s < 4 && <div className={`h-1 w-6 sm:w-12 rounded-full ${step > s ? 'bg-green-500' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Hidden Cloud Vision Input */}
            <input type="file" ref={fileInputRef} onChange={handleOdometerScan} accept="image/*" className="hidden" capture="environment" />



            <Suspense fallback={null}>
                {showPreview && <PDFPreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} pdfUrl={previewPdfUrl} title="Invoice Preview" onShare={() => triggerAction(handleShare)} />}
                {showAd && <InterstitialAd isOpen={showAd} onClose={() => setShowAd(false)} onComplete={onAdComplete} />}
            </Suspense>
        </div>
    );
};

export default TripForm;
