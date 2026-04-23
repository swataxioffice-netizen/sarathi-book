import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Analytics } from '../utils/monitoring';
import { calculateFareAsync } from '../utils/fareWorkerWrapper';
import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';
import { Trip } from '../utils/fare';
import { estimateParkingCharge } from '../utils/parking';
import { estimatePermitCharge } from '../utils/permits';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
// import { useAdProtection } from '../hooks/useAdProtection';
import {
    MoveRight, MapPin, Plus, CheckCircle2,
    Repeat, Clock, UserCheck,
    Car, ChevronLeft, ChevronDown, ChevronUp,
    RotateCcw, Trash2, PenLine,
    StickyNote, Check, Share2,
    Camera, Eye, Settings
} from 'lucide-react';
import { generateId } from '../utils/uuid';
import type { SavedQuotation } from '../utils/pdf';
import { saveToHistory } from '../utils/history';
import { useAuth } from '../contexts/AuthContext';
import PDFPreviewModal from './PDFPreviewModal';
import { useNotifications } from '../contexts/NotificationContext';
import { calculateDistance } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { performOcr, parseOdometer } from '../utils/visionApi';
import { calculateGST, GSTRate, GSTBreakdown, getFinancialYear } from '../utils/gstUtils';
import { canCreateTrip, tripLimitForPlan, isPro, openUpgradeModal } from '../utils/planGate';

// --- Types ---


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

interface TariffVehicle {
    name: string;
    is_heavy_vehicle: boolean;
    min_km_per_day: number;
    round_trip_rate: number;
    one_way_rate: number;
    driver_bata: number;
    local_2hr_pkg: number;
    local_4hr_pkg: number;
    local_8hr_pkg: number;
    local_12hr_pkg: number;
    extra_hr_rate: number;
    min_drop_km: number;
}

interface TripFormProps {
    onSaveTrip: (trip: Trip) => Promise<void> | void;
    onStepChange?: (step: number) => void;
    invoiceTemplate?: SavedQuotation | null;
    trips?: Trip[];
    onViewHistory?: () => void;
    editingTrip?: Trip | null;
}

const DEFAULT_TERMS = [
    "Kms and Time are calculated on a Garage-to-Garage basis.",
    "Reimbursable expenses like Toll and Parking have been added as per actuals.",
    "Payment is due immediately upon completion of the trip.",
    "Driver Batta/Allowance covers food and accommodation for the driver.",
    "All disputes are subject to our registered office jurisdiction.",
    "This is a computer-generated invoice and requires no physical signature."
];

const TripForm: React.FC<TripFormProps> = ({ onSaveTrip, onStepChange, invoiceTemplate, trips, onViewHistory, editingTrip }) => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    // const { triggerAction } = useAdProtection();
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
    const [step, setStep] = useState(0);

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
    const [customTripType, setCustomTripType] = useState('Taxi Service');

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
    const [includeGst, setIncludeGst] = useState(true);

    // Auto-disable GST if not configured
    useEffect(() => {
        if (!settings?.gstin) {
            setIncludeGst(false);
        }
    }, [settings?.gstin]);
    const [rcmEnabled, setRcmEnabled] = useState(false);
    const [terms, setTerms] = useState<string[]>([]);
    const [newTerm, setNewTerm] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNo, setInvoiceNo] = useState('');
    // 5% fixed as per requirement
    const gstRate: GSTRate = 5;

    // Results
    const [showPreview, setShowPreview] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);




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

    const handleSwapRoute = () => {
        const tempLoc = fromLoc;
        const tempCoords = pickupCoords;
        setFromLoc(toLoc);
        setPickupCoords(dropCoords);
        setToLoc(tempLoc);
        setDropCoords(tempCoords);
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
            if (category.includes('tata ace') || category.includes('tata_ace')) return 'tata_ace';
            if (category.includes('bada dost') || category.includes('bada_dost')) return 'bada_dost';
            if (category.includes('bolero') || category.includes('pickup')) return 'bolero_pickup';
            return 'sedan';
        }

        // Handle case where selectedVehicleId is directly the category key (e.g. from templates)
        if (selectedVehicleId && (TARIFFS.vehicles as Record<string, TariffVehicle>)[selectedVehicleId]) {
            return selectedVehicleId;
        }

        return 'sedan';
    }, [selectedVehicleId, userVehicles]);

    const currentVehicleData = useMemo(() => {
        if (!vehicleCategory) return null;
        return (TARIFFS.vehicles as Record<string, TariffVehicle>)[vehicleCategory] || TARIFFS.vehicles.sedan;
    }, [vehicleCategory]);

    const nextInvoiceNo = useMemo(() => {
        // Standard GST Format: INV/FY/SEQ vs Non-GST: BILL/FY/SEQ
        const date = new Date(invoiceDate);
        const fy = getFinancialYear(date);
        
        // Use separate prefixes to maintain respective ordering
        // INV - for Valid GST Tax Invoices (Primary)
        // BILL - for Non-GST / Bill of Supply
        const prefix = includeGst ? `INV/${fy}/` : `BILL/${fy}/`;

        if (!trips || trips.length === 0) return `${prefix}001`;

        const sequences = trips
            .map(t => t.invoiceNo)
            .filter((n): n is string => !!n && n.startsWith(prefix))
            .map(n => {
                const parts = n.split('/');
                return parseInt(parts[parts.length - 1]);
            })
            .filter(n => !isNaN(n));

        const max = sequences.length > 0 ? Math.max(...sequences) : 0;
        return `${prefix}${(max + 1).toString().padStart(3, '0')}`;
    }, [invoiceDate, trips, includeGst]);

    useEffect(() => {
        setInvoiceNo(nextInvoiceNo);
    }, [nextInvoiceNo]);

    // --- Side Effects ---

    useEffect(() => {
        if (onStepChange) onStepChange(step);
    }, [step, onStepChange]);

    useEffect(() => {
        if (editingTrip) {
            sessionTripId.current = editingTrip.id;
            sessionInvoiceNo.current = editingTrip.invoiceNo || null;
            if (editingTrip.invoiceNo) setInvoiceNo(editingTrip.invoiceNo);
            
            setCustomerName(editingTrip.customerName || '');
            setCustomerPhone(editingTrip.customerPhone || '');
            setCustomerGst(editingTrip.customerGst || '');
            setBillingAddress(editingTrip.billingAddress || '');
            
            setFromLoc(editingTrip.from || '');
            setToLoc(editingTrip.to || '');
            setDistanceOverride(editingTrip.effectiveDistance?.toString() || editingTrip.distance?.toString() || '0');
            
            setIncludeGst(!!editingTrip.gstRate && editingTrip.gstRate > 0);
            setRcmEnabled(!!editingTrip.rcmEnabled);
            setInvoiceDate(editingTrip.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
            
            setStartKm(editingTrip.startKm || 0);
            setEndKm(editingTrip.endKm || 0);
            setIsOdometerMode(!!(editingTrip.startKm || editingTrip.endKm));
            
            if (editingTrip.mode) setMode(editingTrip.mode as TripMode);
            if (editingTrip.vehicleId) setSelectedVehicleId(editingTrip.vehicleId);
            
            setToll(editingTrip.toll?.toString() || '0');
            setParking(editingTrip.parking?.toString() || '0');
            setPermit(editingTrip.permit?.toString() || '0');
            setDriverBatta(editingTrip.driverBatta?.toString() || '0');
            setNightCharge(editingTrip.nightBata?.toString() || '0');
            setHillStationCharge(editingTrip.hillStationCharges?.toString() || '0');
            setPetCharge(editingTrip.petCharges?.toString() || '0');
            
            if (editingTrip.mode === 'local') {
                setStartTimeLog(editingTrip.startTime || '');
                setEndTimeLog(editingTrip.endTime || '');
                setLocalPackageHours(editingTrip.waitingHours || 0);
                if (editingTrip.packageName) setHourlyPackage(editingTrip.packageName);
            }
            
            if (editingTrip.terms) setTerms(editingTrip.terms);
            
            // Restore Custom Line Items or Manual Extra Items
            if (editingTrip.extraItems && editingTrip.extraItems.length > 0) {
                if (editingTrip.mode === 'custom') {
                    setCustomLineItems(editingTrip.extraItems.map(item => ({
                        description: item.description,
                        sac: item.sac || '9966',
                        qty: item.qty || 1,
                        rate: item.rate || item.amount,
                        amount: item.amount
                    })));
                } else {
                    // Filter out standard ones to populate manual extra items
                    const standardDescriptions = [
                        'Toll Charges', 'Parking Charges', 'Permit Charges', 
                        'Hill Station Charges', 'Night Charges', 'Pet Carrying Charges',
                        'Driver Batta', 'One Way Drop', 'Round Trip', 'Local Rental'
                    ];
                    const manualExtras = editingTrip.extraItems.filter(item => 
                        !standardDescriptions.some(sd => item.description.startsWith(sd))
                    );
                    setExtraItems(manualExtras.map(item => ({
                        description: item.description,
                        amount: item.amount,
                        qty: item.qty,
                        rate: item.rate,
                        sac: item.sac
                    })));
                }
            }
            
            setManualDriverBatta(editingTrip.driverBatta !== undefined);
            setManualToll(editingTrip.toll !== undefined);
            setManualParking(editingTrip.parking !== undefined);
            setManualPermit(editingTrip.permit !== undefined);
            setManualHillStation(editingTrip.hillStationCharges !== undefined);
            
            setStep(1); 
        } else if (invoiceTemplate) {
            sessionTripId.current = null;
            setCustomerName(invoiceTemplate.customerName);
            if (invoiceTemplate.customerAddress) setBillingAddress(invoiceTemplate.customerAddress);
            if (invoiceTemplate.customerGstin) setCustomerGst(invoiceTemplate.customerGstin);
            // Re-map category correctly if template has specific vehicleType
            if (invoiceTemplate.vehicleType) setSelectedVehicleId(invoiceTemplate.vehicleType);
            if (invoiceTemplate.gstEnabled) setIncludeGst(true);
            // If template has date use it, otherwise default to today
            if (invoiceTemplate.date) setInvoiceDate(invoiceTemplate.date.split('T')[0]);
            setMode('drop'); // Default from template if unknown
            setStep(1);
        } else {
            // New Trip - Reset session if editingTrip and invoiceTemplate are both null
            sessionTripId.current = null;
        }
    }, [editingTrip, invoiceTemplate]);

    // Auto Distance Calculation
    useEffect(() => {
        const autoCalculateTrip = async () => {
            if (mode === 'local' || isOdometerMode) {
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
                        const multiplier = (mode === 'outstation') ? 2 : 1;
                        const distVal = advanced.distanceKm * multiplier;
                        setDistanceOverride(distVal.toString());

                        if (advanced.tollPrice > 0 && !manualToll) {
                            let baseToll = advanced.tollPrice;
                            const isHeavy = selectedVehicleId.includes('tempo') || ['tata_ace', 'bada_dost', 'bolero_pickup'].includes(vehicleCategory || '');
                            if (isHeavy) baseToll *= 1.6;
                            const finalToll = mode === 'drop' ? baseToll : (days > 1 ? baseToll * 2 : Math.round(baseToll * 1.6));
                            setToll(Math.round(finalToll).toString());
                        }
                    } else {
                        const res = await calculateDistance(origin, destination);
                        if (res && res.distance) {
                            const multiplier = (mode === 'outstation') ? 2 : 1;
                            setDistanceOverride((res.distance * multiplier).toString());
                        }
                    }
                } else {
                    const res = await calculateDistance(fromLoc, toLoc);
                    if (res && res.distance) {
                        const multiplier = (mode === 'outstation') ? 2 : 1;
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
    }, [fromLoc, toLoc, pickupCoords, dropCoords, mode, isOdometerMode, selectedVehicleId, vehicleCategory, days, manualPermit, manualParking, manualToll]);

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
                    addNotification('Scan Failed', 'Could not detect odometer reading. Please enter manually.', 'warning');
                }
            } catch (err) {
                console.error('OCR Error:', err);
                addNotification('Camera Error', 'Scan failed. Please type manually.', 'error');
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

            const otherExtras = (mode === 'custom' ? 0 : (parseFloat(permit) || 0) + (parseFloat(parking) || 0) + (parseFloat(toll) || 0)) + extraItems.reduce((a, b) => a + b.amount, 0);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, selectedVehicleId, distanceOverride, days, localPackageHours, hourlyPackage, customRate, toll, parking, permit, driverBatta, nightCharge, hillStationCharge, petCharge, extraItems, includeGst, manualDriverBatta, manualHillStation, customLineItems]);

    const handleNext = () => {
        if (step === 1 && mode === 'custom') {
            setStep(3);
        } else {
            setStep(s => Math.min(3, s + 1));
        }
    };
    
    const handleBack = () => {
        if (step === 3 && mode === 'custom') {
            setStep(1);
        } else if (step === 1) {
            setMode(null);
            setStep(0);
        } else {
            setStep(s => Math.max(0, s - 1));
        }
    };

    // --- Unified Trip Data Construction ---
    const constructTripData = (res: CalculationResult, isPreview: boolean = false): Trip => {
        const currentV = userVehicles.find(v => v.id === selectedVehicleId);
        
        // 1. Construct unified items for the PDF table
        // This ensures the table in the PDF matches the calculated totals exactly.
        const pdfItems: NonNullable<Trip['extraItems']> = [];
        
        // Step 1: Base Fare / Custom Items
        if (mode === 'custom') {
            customLineItems.forEach(i => {
                if (i.amount > 0 || i.description) {
                    pdfItems.push({
                        description: i.description,
                        amount: i.amount,
                        rate: i.rate,
                        qty: i.qty,
                        sac: i.sac
                    });
                }
            });
        } else {
            const baseRate = res.rateUsed;
            const baseDist = res.effectiveDistance || res.distance;
            let baseDesc = mode === 'local' ? `Local Rental` : (mode === 'outstation' ? `Round Trip` : `One Way Drop`);

            if (mode === 'local') {
                if (hourlyPackage === '8hr_80km') baseDesc += ` [8 Hrs / 80 KM Package]`;
                else if (hourlyPackage === '12hr_120km') baseDesc += ` [12 Hrs / 120 KM Package]`;
                else if (hourlyPackage === '4hr_40km') baseDesc += ` [4 Hrs / 40 KM Package]`;
                else if (hourlyPackage === '2hr_20km') baseDesc += ` [2 Hrs / 20 KM Package]`;
                else baseDesc += ` [${localPackageHours} Hrs / ${localPackageKm} KM Package]`;
                
                if (localPackageHours > 0 || localPackageKm > 0) {
                    baseDesc += ` (Journey: ${localPackageHours}hrs/${localPackageKm}km)`;
                }
            } else if (baseRate > 0) {
                baseDesc += ` [${baseDist} KM * ${baseRate}/KM]`;
            }

            pdfItems.push({
                description: baseDesc,
                amount: res.distanceCharge,
                rate: baseRate > 0 ? baseRate : res.distanceCharge,
                qty: 1
            });
        }

        // Step 2: Auto-calculated Extras (Batta, Hill Station, etc.)
        // Skip these in 'custom' mode as users expect to control all items manually via the list
        if (mode !== 'custom' && res.driverBatta > 0) {
            const dist = res.effectiveDistance || res.distance;
            let daysUsed = mode === 'outstation' ? Math.max(days, Math.ceil(dist / TRIP_LIMITS.max_km_per_day)) : 1;
            if (mode === 'drop') daysUsed = Math.max(1, Math.ceil(dist / TRIP_LIMITS.max_km_per_day));
            const battaRate = res.driverBatta / daysUsed;
            pdfItems.push({
                description: `Driver Batta [${daysUsed} Day${daysUsed > 1 ? 's' : ''} * ${battaRate}/Day]`,
                amount: res.driverBatta,
                rate: battaRate,
                qty: daysUsed
            });
        }
        
        if (mode !== 'custom') {
            if (parseFloat(toll) > 0) pdfItems.push({ description: 'Toll Charges', amount: parseFloat(toll), rate: parseFloat(toll), qty: 1 });
            if (parseFloat(parking) > 0) pdfItems.push({ description: 'Parking Charges', amount: parseFloat(parking), rate: parseFloat(parking), qty: 1 });
            if (parseFloat(permit) > 0) pdfItems.push({ description: 'Permit Charges', amount: parseFloat(permit), rate: parseFloat(permit), qty: 1 });
        }
        
        if (mode !== 'custom' && res.hillStationCharges > 0) {
            pdfItems.push({ 
                description: 'Hill Station Charges', 
                amount: res.hillStationCharges, 
                rate: res.hillStationCharges, 
                qty: 1 
            });
        }
        
        if (parseFloat(nightCharge) > 0) {
            pdfItems.push({ 
                description: 'Night Charges', 
                amount: parseFloat(nightCharge), 
                rate: parseFloat(nightCharge), 
                qty: 1 
            });
        }
        
        if (mode !== 'custom' && res.petCharges > 0) {
            pdfItems.push({ 
                description: 'Pet Carrying Charges', 
                amount: res.petCharges, 
                rate: res.petCharges, 
                qty: 1 
            });
        }

        // Step 3: Manual Extra Items (Step 3 Additionals)
        extraItems.forEach(i => {
            if (i.amount > 0) {
                pdfItems.push({
                    description: i.description,
                    amount: i.amount,
                    rate: i.amount,
                    qty: 1
                });
            }
        });

        const tripData: Trip = {
            id: isPreview ? (sessionTripId.current || generateId()) : (sessionTripId.current || generateId()),
            invoiceNo: isPreview ? (invoiceNo || nextInvoiceNo) : (invoiceNo || nextInvoiceNo),
            customerName: customerName || 'Cash Guest',
            customerPhone,
            customerGst,
            billingAddress,
            from: fromLoc,
            to: toLoc,
            startKm: isOdometerMode ? startKm : 0,
            endKm: isOdometerMode ? endKm : (parseFloat(distanceOverride) || 0),
            startTime: mode === 'local' ? startTimeLog : '',
            endTime: mode === 'local' ? endTimeLog : '',
            totalFare: res.total,
            fare: res.fare,
            gst: res.gst,
            gstRate: includeGst ? gstRate : 0,
            gstType: includeGst ? (res.gstBreakdown?.type || 'CGST_SGST') : undefined,
            distance: res.distance,
            effectiveDistance: res.effectiveDistance,
            ratePerKm: res.rateUsed,
            distanceCharge: res.distanceCharge,
            driverBatta: res.driverBatta,
            hillStationCharges: res.hillStationCharges,
            petCharges: res.petCharges,
            nightBata: parseFloat(nightCharge) || 0,
            toll: parseFloat(toll) || 0,
            parking: parseFloat(parking) || 0,
            permit: parseFloat(permit) || 0,
            days,
            waitingHours: mode === 'local' ? localPackageHours : 0,
            waitingCharges: 0,
            extraItems: pdfItems,
            mode: (mode || 'custom') as 'drop' | 'outstation' | 'local' | 'custom',
            date: invoiceDate ? (invoiceDate.includes('T') ? invoiceDate : `${invoiceDate}T12:00:00Z`) : new Date().toISOString(),
            rcmEnabled,
            terms: terms.length > 0 ? terms : DEFAULT_TERMS,
            vehicleId: selectedVehicleId,
            vehicleNumber: currentV?.number,
            vehicleModel: currentV?.model,
            packageName: mode === 'local' ? hourlyPackage : undefined,
            baseFare: settings.baseFare
        };

        return tripData;
    };

    const handlePreview = async () => {
        const res = await performCalculation();
        if (!res) return;
        const tripData = constructTripData(res, true);
        const { generateReceiptPDF } = await import('../utils/pdf');
        const doc = await generateReceiptPDF(tripData, { ...settings, gstEnabled: includeGst, rcmEnabled, userId: user?.id, vehicleNumber: tripData.vehicleNumber || '' });
        setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
        setShowPreview(true);
    };

    const handleShare = async (calcRes?: CalculationResult) => {
        const res = calcRes || await performCalculation();
        if (!res) return;

        const tripData = constructTripData(res);

        try {
            const { shareReceipt } = await import('../utils/pdf');
            await shareReceipt(tripData, { ...settings, gstEnabled: includeGst, rcmEnabled, userId: user?.id, vehicleNumber: tripData.vehicleNumber || '' });
        } catch (err) {
            console.error('Sharing failed, falling back to preview', err);
            handlePreview();
        }
    };


    // ... (existing helper imports) ...

    const handleSave = async (calcRes?: CalculationResult) => {
        const res = calcRes || await performCalculation();
        if (!res) return null;

        // Enforce monthly invoice limit (skip when editing an existing trip)
        if (!editingTrip && !canCreateTrip(settings, trips || [])) {
            const limit = tripLimitForPlan(settings);
            const next = isPro(settings) ? 'Super Pro' : 'Pro';
            addNotification('Limit Reached', `Monthly limit reached (${limit}). Upgrade to ${next} for more.`, 'info');
            openUpgradeModal();
            return null;
        }

        if (customerName) saveToHistory('customer_name', customerName);
        if (customerPhone) saveToHistory('customer_phone', customerPhone);
        if (fromLoc) saveToHistory('location', fromLoc);
        if (toLoc) saveToHistory('location', toLoc);

        // LOCK IN the ID and Invoice Number for this session
        if (!sessionTripId.current) sessionTripId.current = generateId();

        // Log to Admin Analytics (Non-blocking)
        Analytics.logActivity('invoice_created', {
            invoiceNo: invoiceNo,
            customer: customerName,
            amount: res.total,
            mode: mode
        }, user?.id);

        Analytics.generateInvoice('invoice', res.total);

        const tripData = constructTripData(res);

        await onSaveTrip(tripData);
        return tripData;
    };

    const handleSaveAndShare = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const res = await performCalculation();
            if (!res) {
                setIsSubmitting(false);
                return;
            }

            // Lock IDs now so they are ready for background save/share
            if (!sessionTripId.current) sessionTripId.current = generateId();
            // if (!sessionInvoiceNo.current) sessionInvoiceNo.current = nextInvoiceNo; // Use state now

            // Pre-warm PDF dependencies
            import('jspdf');

            // Direct execution instead of nested triggerAction for reliability
            try {
                // Start saving and wait for it
                await handleSave(res);

                // Immediately trigger share (more likely to succeed on gesture)
                await handleShare(res);

                // RESET SESSION REFS so next trip gets new ID
                sessionTripId.current = null;
                sessionInvoiceNo.current = null;

                setStep(0);
                setMode(null);
                if (onStepChange) onStepChange(0);
            } catch (error) {
                console.error('Save/Share Error:', error);
                setIsSubmitting(false);
                addNotification('Connection Error', 'An error occurred while saving or sharing.', 'error');
            } finally {
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Save & Share setup failed:', error);
            setIsSubmitting(false);
        }
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
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full" />
                Create Invoice
            </h2>
            <div className="flex flex-col gap-3 px-0.5">
                {(['drop', 'local', 'outstation', 'custom'] as const).map((m) => (
                    <button 
                        key={m} 
                        onClick={() => {
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
                            setStep(1);
                        }} 
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${mode === m ? 'bg-primary border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/10' : 'bg-white border-slate-200 hover:border-primary/40 shadow-sm active:scale-[0.98]'}`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${mode === m ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                            {m === 'drop' && <MoveRight size={22} />}
                            {m === 'outstation' && <Repeat size={22} />}
                            {m === 'local' && <Clock size={22} />}
                            {m === 'custom' && <PenLine size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-[13px] font-black uppercase tracking-wider leading-tight ${mode === m ? 'text-white' : 'text-slate-800'}`}>
                                {m === 'drop' ? 'One Way' : m === 'outstation' ? 'Outstation' : m === 'local' ? 'Local' : 'Custom Bill'}
                            </h3>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${mode === m ? 'text-white/70' : 'text-slate-400'}`}>
                                {m === 'drop' && 'Point to Point Drop'}
                                {m === 'outstation' && 'Round Trip Journey'}
                                {m === 'local' && 'Hourly Rental Package'}
                                {m === 'custom' && 'Add your own charges'}
                            </p>
                        </div>
                        <div className={`shrink-0 transition-transform group-hover:translate-x-1 ${mode === m ? 'text-white/50' : 'text-slate-300'}`}>
                            <MoveRight size={18} />
                        </div>
                    </button>
                ))}
            </div>
            {onViewHistory && (
                <button
                    onClick={onViewHistory}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl active:bg-primary/10 transition-colors"
                >
                    View Invoice History
                </button>
            )}
        </div >
    );

    const renderStep2 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {mode === 'custom' ? (
                <>
                    {/* 1. Primary Focus: Invoice Items (The "Excel/Word" feel) */}
                    {/* 1. Invoice Meta Details - Separated for clarity */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <StickyNote size={12} className="text-primary" /> Invoice Details
                            </h3>
                            <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${includeGst ? 'bg-primary/10 border-primary/20 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${includeGst ? 'text-primary' : 'text-slate-400'}`}>
                                    {includeGst ? 'GST Invoice' : 'Non-GST Bill'}
                                </span>
                                <button onClick={() => {
                                    if (!settings.gstin) {
                                        addNotification('GST Required', 'Please add your GSTIN in Settings to enable GST.', 'info');
                                        return;
                                    }
                                    const newState = !includeGst;
                                    setIncludeGst(newState);
                                    if (newState) setRcmEnabled(false);
                                }} className={`w-9 h-5 rounded-full relative transition-colors ${includeGst ? 'bg-green-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${includeGst ? 'left-5' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 space-y-0.5">
                                <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Invoice No</label>
                                <input
                                    type="text"
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    className="tn-input h-10 w-full text-xs font-bold text-center uppercase rounded-lg"
                                    placeholder="INV-001"
                                />
                            </div>
                            <div className="flex-1 space-y-0.5">
                                <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Date</label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="tn-input h-10 w-full text-xs font-bold text-center rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-50 mt-2 space-y-0.5">
                             <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Trip Description</label>
                             <select 
                                 value={customTripType} 
                                 onChange={(e) => {
                                     setCustomTripType(e.target.value);
                                     // Optional: Auto-update the first line item description if it's generic
                                     if (customLineItems.length > 0 && (customLineItems[0].description === 'Service Charge' || customLineItems[0].description.includes('Charges'))) {
                                         const newItems = [...customLineItems];
                                         newItems[0].description = `${e.target.value} Charges`;
                                         setCustomLineItems(newItems);
                                     }
                                 }}
                                 className="tn-input h-10 w-full text-xs font-bold rounded-lg px-2"
                             >
                                 <option value="Taxi Service">General Taxi Service</option>
                                 <option value="One Way Drop">One Way Drop</option>
                                 <option value="Round Trip">Round Trip</option>
                                 <option value="Local Rental">Local Rental</option>
                                 <option value="Airport Transfer">Airport Transfer</option>
                                 <option value="Corporate Duty">Corporate Duty</option>
                                 <option value="Wedding Event">Wedding Event</option>
                             </select>
                        </div>
                    </div>

                    {/* 2. Billable Items List */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-center mb-0.5">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <PenLine size={12} className="text-primary" /> Billable Items
                                </h3>
                            </div>
                            <div className="bg-slate-100 px-2 py-0.5 rounded-md">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                    {customLineItems.length} Item{customLineItems.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            {customLineItems.map((item, idx) => (
                                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-2 group">
                                    {/* Top Row: Description & SAC */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Item Description"
                                            value={item.description}
                                            onChange={(e) => {
                                                const newItems = [...customLineItems];
                                                newItems[idx].description = e.target.value;
                                                setCustomLineItems(newItems);
                                            }}
                                            className="flex-1 h-10 tn-input rounded-lg px-2.5 text-xs font-bold focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-slate-300"
                                        />
                                        <input
                                            type="text"
                                            placeholder="SAC"
                                            value={item.sac}
                                            onChange={(e) => {
                                                const newItems = [...customLineItems];
                                                newItems[idx].sac = e.target.value;
                                                setCustomLineItems(newItems);
                                            }}
                                            className="w-14 h-10 tn-input rounded-lg px-1 text-[10px] text-center font-bold placeholder:text-slate-300"
                                            title="SAC Code"
                                        />
                                    </div>

                                    {/* Bottom Row: Qty x Rate = Amount */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-14 group/input shrink-0">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold uppercase pointer-events-none group-focus-within/input:text-green-500">Qty</span>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={item.qty === 0 ? '' : item.qty}
                                                onChange={(e) => {
                                                    const rawVal = e.target.value;
                                                    const val = parseFloat(rawVal) || 0;
                                                    const newItems = [...customLineItems];
                                                    newItems[idx].qty = rawVal === '' ? 0 : val;
                                                    newItems[idx].amount = (rawVal === '' ? 0 : val) * newItems[idx].rate;
                                                    setCustomLineItems(newItems);
                                                }}
                                                className="w-full h-10 tn-input rounded-lg pl-6 pr-1 text-xs font-bold text-center focus:border-green-500 transition-colors"
                                            />
                                        </div>

                                        <span className="text-slate-300 font-bold text-xs shrink-0">×</span>

                                        <div className="relative w-24 group/input shrink-0">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold uppercase pointer-events-none group-focus-within/input:text-green-500">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Rate"
                                                value={item.rate === 0 ? '' : item.rate}
                                                onChange={(e) => {
                                                    const rawVal = e.target.value;
                                                    const val = parseFloat(rawVal) || 0;
                                                    const newItems = [...customLineItems];
                                                    newItems[idx].rate = rawVal === '' ? 0 : val;
                                                    newItems[idx].amount = newItems[idx].qty * (rawVal === '' ? 0 : val);
                                                    setCustomLineItems(newItems);
                                                }}
                                                className="w-full h-8 bg-white border-slate-200 rounded-lg pl-5 pr-1 text-xs font-bold text-center focus:border-green-500 transition-colors"
                                            />
                                        </div>

                                        <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />

                                        <div className="flex-1 min-w-[50px] text-right font-black text-slate-900 text-sm">
                                            ₹{item.amount.toLocaleString()}
                                        </div>

                                        <button
                                            onClick={() => {
                                                const newItems = customLineItems.filter((_, i) => i !== idx);
                                                setCustomLineItems(newItems);
                                            }}
                                            className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                            title="Remove Item"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setCustomLineItems([...customLineItems, { description: '', sac: '9966', qty: 1, rate: 0, amount: 0 }])}
                                className="w-full py-2.5 flex items-center justify-center gap-2 text-[9px] font-black text-primary bg-primary/5 rounded-xl border-2 border-dashed border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all uppercase tracking-widest mt-2"
                            >
                                <Plus size={12} strokeWidth={3} /> Add Another Line Item
                            </button>

                            <div className="flex justify-between items-center px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl mt-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Amount</span>
                                <span className="text-xl font-black tracking-tight text-slate-900">
                                    ₹{customLineItems.reduce((acc, item) => acc + item.amount, 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Optional: Journey Section for Record */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-center mb-0.5">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-primary" /> Route (Optional)</h3>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setIsOdometerMode(false)}
                                    className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md transition-all ${!isOdometerMode ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                                >
                                    Address
                                </button>
                                <button
                                    onClick={() => setIsOdometerMode(true)}
                                    className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md transition-all ${isOdometerMode ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                                >
                                    Odometer
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 relative">
                            <PlacesAutocomplete
                                label="From"
                                value={fromLoc}
                                onChange={setFromLoc}
                                onPlaceSelected={(p) => { setFromLoc(p.address); setPickupCoords({ lat: p.lat, lng: p.lng }); }}
                                onMapClick={() => setShowMap(true)}
                            />

                            {/* Swap Button */}
                            <div className="absolute right-10 top-9 z-10">
                                <button
                                    onClick={handleSwapRoute}
                                    className="w-7 h-7 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
                                    title="Swap Route"
                                >
                                    <Repeat size={12} className="rotate-90" />
                                </button>
                            </div>

                            <PlacesAutocomplete
                                label="To"
                                value={toLoc}
                                onChange={setToLoc}
                                onPlaceSelected={(p) => { setToLoc(p.address); setDropCoords({ lat: p.lat, lng: p.lng }); }}
                                onMapClick={() => setShowMap(true)}
                            />
                        </div>

                        {!isOdometerMode && (
                            <div className="pt-2 border-t border-slate-50 space-y-0.5">
                                <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Distance Travelled (KM)</label>
                                <input
                                    type="number"
                                    value={distanceOverride}
                                    onChange={(e) => setDistanceOverride(e.target.value)}
                                    className="tn-input h-10 w-full text-xs font-bold rounded-lg"
                                    placeholder="e.g. 120"
                                />
                            </div>
                        )}

                        {isOdometerMode && (
                            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-50">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase ml-1 flex justify-between items-center">Start KM <button onClick={() => { setIsScanning('start'); fileInputRef.current?.click(); }} className="text-primary"><Camera size={10} /></button></p>
                                    <input type="number" value={startKm || ''} onChange={(e) => setStartKm(parseFloat(e.target.value) || 0)} className="tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-950 font-bold rounded-lg" placeholder="0" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase ml-1 flex justify-between items-center">End KM <button onClick={() => { setIsScanning('end'); fileInputRef.current?.click(); }} className="text-primary"><Camera size={10} /></button></p>
                                    <input type="number" value={endKm || ''} onChange={(e) => setEndKm(parseFloat(e.target.value) || 0)} className="tn-input h-10 w-full text-xs font-bold rounded-lg" placeholder="0" />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Standard Journey Details for Automated Modes */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-primary" /> Journey Details</h3>
                        <div className="space-y-2 relative">
                            <PlacesAutocomplete
                                label="Pickup"
                                value={fromLoc}
                                onChange={setFromLoc}
                                onPlaceSelected={(p) => { setFromLoc(p.address); setPickupCoords({ lat: p.lat, lng: p.lng }); }}
                                onMapClick={() => setShowMap(true)}
                            />

                            {mode !== 'local' && (
                                <>
                                    {/* Swap Button */}
                                    <div className="absolute right-10 top-9 z-10">
                                        <button
                                            onClick={handleSwapRoute}
                                            className="w-7 h-7 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
                                            title="Swap Route"
                                        >
                                            <Repeat size={12} className="rotate-90" />
                                        </button>
                                    </div>
                                    <PlacesAutocomplete
                                        label="Drop"
                                        value={toLoc}
                                        onChange={setToLoc}
                                        onPlaceSelected={(p) => { setToLoc(p.address); setDropCoords({ lat: p.lat, lng: p.lng }); }}
                                        onMapClick={() => setShowMap(true)}
                                    />
                                </>
                            )}
                        </div>

                        {mode !== 'local' && (
                            <div className="flex justify-end -mt-1">
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => setIsOdometerMode(false)}
                                        className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md transition-all ${!isOdometerMode ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Direct KM
                                    </button>
                                    <button
                                        onClick={() => setIsOdometerMode(true)}
                                        className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md transition-all ${isOdometerMode ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Odometer
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="pt-0.5 border-t border-slate-50 space-y-2">
                            {!isOdometerMode && mode !== 'local' && (
                                <div className="space-y-0.5">
                                    <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Trip Distance (KM)</label>
                                    <input type="number"
                                        value={isFetchingKM ? '' : distanceOverride}
                                        onChange={(e) => setDistanceOverride(e.target.value)}
                                        className="tn-input h-10 w-full text-xs font-bold rounded-lg"
                                        placeholder={isFetchingKM ? "Calculating..." : "0"}
                                    />
                                </div>
                            )}
                            {(isOdometerMode || (mode === 'outstation' || (mode === 'drop' && parseFloat(distanceOverride) > 30))) && mode !== 'local' && (
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase ml-1 flex justify-between items-center">Start KM <button onClick={() => { setIsScanning('start'); fileInputRef.current?.click(); }} className="text-primary"><Camera size={10} /></button></p>
                                        <input type="number" value={startKm || ''} onChange={(e) => setStartKm(parseFloat(e.target.value) || 0)} className="tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 font-bold rounded-lg" placeholder="0" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase ml-1 flex justify-between items-center">End KM <button onClick={() => { setIsScanning('end'); fileInputRef.current?.click(); }} className="text-primary"><Camera size={10} /></button></p>
                                        <input type="number" value={endKm || ''} onChange={(e) => setEndKm(parseFloat(e.target.value) || 0)} className="tn-input h-10 w-full text-xs font-bold rounded-lg" placeholder="0" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {mode === 'local' && (
                            <div className="pt-2 border-t border-slate-50 space-y-2.5">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="space-y-0.5">
                                        <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Start Time</label>
                                        <input type="time" value={startTimeLog} onChange={e => setStartTimeLog(e.target.value)} className="tn-input h-9 w-full font-bold text-xs bg-slate-50 border-slate-100 rounded-lg px-2" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">End Time</label>
                                        <input type="time" value={endTimeLog} onChange={e => setEndTimeLog(e.target.value)} className="tn-input h-10 w-full font-bold text-xs rounded-lg px-2" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-2.5 py-1.5 bg-green-50/50 rounded-lg border border-green-100/50">
                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Calculated:</span>
                                    <div className="flex gap-4">
                                        <span className="text-xs font-black text-green-700">{localPackageHours} Hrs</span>
                                        <span className="text-xs font-black text-green-700">{localPackageKm} KM</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {showMap && (
                <MapPicker
                    onLocationSelect={handleMapSelect}
                    onClose={() => setShowMap(false)}
                />
            )}

            {/* Vehicle Section */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Car size={12} className="text-slate-600" /> Vehicle Branding</h3>

                <div className="space-y-2.5">
                    <div className="space-y-0.5">
                        <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Select Cab</label>
                        <select
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            className="tn-input h-10 w-full text-xs font-bold rounded-lg px-2"
                        >
                            <option value="">Choose from Fleet</option>
                            {userVehicles.map((v) => (
                                <option key={v.id} value={v.id}>{v.model} - {v.number}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-1">
                        {mode === 'outstation' ? (
                            <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Trip Days</label>
                                <input type="number" value={days} onChange={e => setDays(parseFloat(e.target.value) || 1)} className="tn-input h-9 w-full bg-slate-50 border-slate-100 text-xs text-slate-900 font-bold rounded-lg px-3" placeholder="1" />
                            </div>
                        ) : mode === 'local' ? (
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Rental Package</label>
                                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-none snap-x">
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
                                                className={`min-w-[64px] shrink-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border transition-all snap-start
                                                        ${hourlyPackage === pkg.id
                                                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                                        : 'bg-white border-slate-100 text-slate-500 hover:border-primary/20 active:bg-slate-50'}
                                                        ${!selectedVehicleId ? 'opacity-40 grayscale cursor-not-allowed' : ''}
                                                    `}
                                                disabled={!selectedVehicleId}
                                            >
                                                {pkg.label && (
                                                    <span className={`text-[7px] font-black uppercase tracking-wider mb-0.5 ${hourlyPackage === pkg.id ? 'text-white/70' : 'text-primary'}`}>
                                                        {pkg.label}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-black uppercase tracking-wider leading-none">{pkg.hr}</span>
                                                <span className={`text-[8px] font-bold uppercase tracking-wider leading-none mt-0.5 ${hourlyPackage === pkg.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    {pkg.km}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {hourlyPackage !== 'custom' ? (
                                    <div className="flex items-center gap-3 p-2 bg-slate-50/50 rounded-lg border border-slate-100 mt-1">
                                        <div className="flex-1 text-center border-r border-slate-100">
                                            <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Includes</p>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{hourlyPackage === '8hr_80km' ? 80 : hourlyPackage === '12hr_120km' ? 120 : hourlyPackage === '4hr_40km' ? 40 : 20} KM</p>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Duration</p>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{hourlyPackage === '8hr_80km' ? 8 : hourlyPackage === '12hr_120km' ? 12 : hourlyPackage === '4hr_40km' ? 4 : 2} HRS</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 mt-1 text-center">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider italic">Input Time & KM in Journey Details</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div >

            <div className="flex gap-2">
                <button onClick={handleBack} className="flex-1 h-11 border border-slate-200 text-slate-500 font-black rounded-xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 active:bg-slate-50 transition-colors"><ChevronLeft size={14} /> Back</button>
                <div className="flex-[2.5] flex gap-2">
                    {mode === 'custom' && (
                        <button onClick={handlePreview} disabled={customLineItems.length === 0} className="flex-1 h-11 border-2 border-primary text-primary font-black rounded-xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:bg-primary/5 disabled:opacity-30 transition-colors">
                            <Eye size={14} strokeWidth={2.5} /> PREVIEW
                        </button>
                    )}
                    <button onClick={handleNext} disabled={(mode !== 'custom' && (!selectedVehicleId || (!distanceOverride && mode !== 'local'))) || (mode === 'custom' && customLineItems.length === 0)} className="flex-1 tn-button-primary h-11 text-[10px] tracking-widest font-black uppercase shadow-lg shadow-primary/20 disabled:opacity-50">CONTINUE</button>
                </div>
            </div>
        </div >
    );

    const renderStep3 = () => (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-1">
                <Plus className="text-primary" size={14} strokeWidth={3} /> Extra Charges
            </h2>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                {/* Main Charges Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-0.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Batta</label>
                            {manualDriverBatta && <button onClick={() => setManualDriverBatta(false)} className="text-primary"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={driverBatta} onChange={e => { setDriverBatta(e.target.value); setManualDriverBatta(true); }} className={`tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 font-bold rounded-lg ${manualDriverBatta ? 'bg-primary/5 text-primary' : ''}`} placeholder="0" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Tolls</label>
                            {manualToll && <button onClick={() => setManualToll(false)} className="text-primary"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={toll} onChange={e => { setToll(e.target.value); setManualToll(true); }} className={`tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 font-bold rounded-lg ${manualToll ? 'bg-primary/5 text-primary' : ''}`} placeholder="0" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Parking</label>
                            {manualParking && <button onClick={() => setManualParking(false)} className="text-primary"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={parking} onChange={e => { setParking(e.target.value); setManualParking(true); }} className={`tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 font-bold rounded-lg ${manualParking ? 'bg-primary/5 text-primary' : ''}`} placeholder="0" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Permit</label>
                            {manualPermit && <button onClick={() => setManualPermit(false)} className="text-primary"><RotateCcw size={10} /></button>}
                        </div>
                        <input type="number" value={permit} onChange={e => { setPermit(e.target.value); setManualPermit(true); }} className={`tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 font-bold rounded-lg ${manualPermit ? 'bg-primary/5 text-primary' : ''}`} placeholder="0" />
                    </div>
                </div>

                <div className="h-px bg-slate-50 my-0.5" />

                <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full py-2.5 px-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50/50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100"
                >
                    <span className="flex items-center gap-2"><Settings size={14} className="text-slate-400" /> Advanced Options</span>
                    {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isAdvancedOpen && (
                    <div className="space-y-3 pt-2 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Hill Station</label>
                                <input type="number" value={hillStationCharge} onChange={e => { setHillStationCharge(e.target.value); setManualHillStation(true); }} className="tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 font-bold rounded-lg" placeholder="0" />
                            </div>
                            <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Pet Charge</label>
                                <input type="number" value={petCharge} onChange={e => setPetCharge(e.target.value)} className="tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 font-bold rounded-lg" placeholder="0" />
                            </div>
                        </div>

                        <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Night Drive (11 PM - 5 AM)</label>
                            <input type="number" value={nightCharge} onChange={e => setNightCharge(e.target.value)} className="tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs text-slate-900 font-bold rounded-lg" placeholder="0" />
                        </div>

                        <div className="pt-3 border-t border-slate-50 space-y-2.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Misc Charges</label>
                            <div className="flex gap-2">
                                <select className="tn-input h-9 flex-1 bg-slate-100 border-none text-[10px] text-slate-900 font-black uppercase tracking-wider rounded-lg" value={selectedChargeType} onChange={(e) => { setSelectedChargeType(e.target.value); if (e.target.value !== 'Custom') setCustomChargeName(''); }}>
                                    <option value="">Select Type</option>
                                    <option value="Custom">Custom</option>
                                    <option value="Cleaning Fee">Cleaning</option>
                                    <option value="Driver Allowance">Allowance</option>
                                    <option value="Guide Fee">Guide</option>
                                    <option value="Luggage Charge">Luggage</option>
                                    <option value="Airport Entry">Airport</option>
                                    <option value="FastTag Recharge">FastTag</option>
                                    <option value="Decoration">Decoration</option>
                                    <option value="Waiting Charge">Waiting</option>
                                </select>
                            </div>

                            {selectedChargeType && (
                                <div className="flex gap-2 animate-in slide-in-from-top-2">
                                    {selectedChargeType === 'Custom' && <input placeholder="Name" className="tn-input h-9 flex-2 bg-white border-slate-200 font-bold text-xs rounded-lg" value={customChargeName} onChange={e => setCustomChargeName(e.target.value)} autoFocus />}
                                    <input type="number" placeholder="Amt" className="tn-input h-9 flex-1 bg-white border-slate-200 font-bold text-xs rounded-lg text-center" value={customChargeAmount} onChange={e => setCustomChargeAmount(e.target.value)} />
                                    <button onClick={handleAddCharge} className="w-9 h-9 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-200 flex items-center justify-center shrink-0">
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            )}

                            {extraItems.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    {extraItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group/item border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{item.description}</span>
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[11px] font-black text-slate-900">₹{item.amount.toLocaleString()}</span>
                                                <button onClick={() => setExtraItems(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button onClick={handleBack} className="flex-1 h-11 border border-slate-200 text-slate-500 font-black rounded-xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 active:bg-slate-50"><ChevronLeft size={14} /> Back</button>
                <div className="flex-[2.5] flex gap-2">
                    <button onClick={handlePreview} className="flex-1 border-2 border-primary text-primary h-11 rounded-xl text-[9px] uppercase font-black tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"><Eye size={14} strokeWidth={2.5} /> PREVIEW</button>
                    <button onClick={handleNext} className="flex-1 tn-button-primary h-11 text-[9px] tracking-widest font-black uppercase rounded-xl">CONTINUE</button>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Customer Section */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserCheck size={12} className="text-primary" /> Client Details</h3>
                </div>
                <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Client Name</label>
                            <input placeholder="Name" className="tn-input h-9 w-full bg-slate-50 border-slate-100 text-xs text-slate-900 font-bold rounded-lg px-2.5" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Phone</label>
                            <input 
                                placeholder="10-digit Mobile Number" 
                                className={`tn-input h-9 w-full bg-slate-50 border-slate-100 text-xs text-slate-900 font-bold rounded-lg px-2.5 ${customerPhone && customerPhone.length !== 10 ? 'border-red-300 focus:border-red-400' : ''}`} 
                                value={customerPhone} 
                                type="tel"
                                maxLength={10}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setCustomerPhone(val);
                                }} 
                            />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Business Address</label>
                        <textarea placeholder="Line 1, City, State..." className="tn-input h-14 w-full py-2 resize-none bg-slate-50 border-slate-100 text-xs text-slate-900 font-bold rounded-lg px-2.5 leading-snug" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} />
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[8px] font-bold text-slate-500 uppercase ml-1">Client GSTIN (For B2B Credit)</label>
                        <input 
                            placeholder="Leave empty for B2C/Consumer" 
                            className={`tn-input h-9 w-full uppercase bg-slate-50 border-slate-100 text-xs text-slate-900 font-bold rounded-lg px-2.5 ${customerGst && customerGst.length !== 15 ? 'border-red-300 focus:border-red-400' : ''}`} 
                            value={customerGst} 
                            maxLength={15}
                            onChange={e => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                setCustomerGst(val);
                            }} 
                        />
                        {customerGst && customerGst.length > 0 && customerGst.length !== 15 && (
                            <p className="text-[9px] text-red-500 font-bold px-1">GSTIN must be 15 characters</p>
                        )}
                    </div>
                </div>


            </div>

            {/* Terms Section */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><StickyNote size={12} className="text-slate-600" /> INVOICE TERMS</h3>
                    <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">{terms.length} Active</span>
                </div>

                <div className="space-y-2">
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-lg max-h-60 overflow-y-auto custom-scrollbar flex-col">
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
                                    className={`flex items-start gap-2 p-2 rounded-md transition-all text-left text-[10px] font-bold leading-tight ${isSelected
                                        ? 'bg-white shadow-sm border border-primary/10 text-primary'
                                        : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-white border-slate-200'
                                        }`}>
                                        {isSelected && <Check size={8} strokeWidth={5} />}
                                    </div>
                                    <span className="flex-1">{term}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-50">
                    <input
                        placeholder="Add manual term..."
                        className="tn-input h-8 flex-1 text-[10px] font-bold rounded-lg border-slate-100 bg-slate-50 px-2.5"
                        value={newTerm}
                        onChange={e => setNewTerm(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newTerm) { setTerms([...terms, newTerm]); setNewTerm(''); } }}
                    />
                    <button
                        onClick={() => { if (newTerm) { setTerms([...terms, newTerm]); setNewTerm(''); } }}
                        className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center active:scale-95 transition-all"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div className="flex gap-2 h-11 mt-4">
                <button 
                    onClick={handleBack} 
                    className="w-20 bg-white border border-slate-200 text-slate-500 font-black rounded-xl uppercase text-[9px] tracking-widest hover:bg-slate-50 active:scale-95 transition-all text-center"
                >
                    BACK
                </button>
                <div className="flex-1 flex gap-2">
                    <button 
                        onClick={handlePreview} 
                        disabled={isSubmitting} 
                        className="flex-1 border-2 border-primary text-primary bg-white rounded-xl text-[9px] uppercase font-black tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Eye size={14} strokeWidth={2.5} /> PREVIEW
                    </button>
                    <button
                        onClick={handleSaveAndShare}
                        disabled={isSubmitting}
                        className="flex-[1.5] bg-primary text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <>
                                <Share2 size={14} strokeWidth={2.5} />
                                SAVE & SHARE
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto space-y-4 pb-32 px-2 sm:px-0">
            {/* Progress Header - Only show if mode selected */}
            {mode && (
                <div className="flex items-center justify-between mb-4 px-6 bg-white py-3 rounded-2xl border border-slate-100 shadow-sm mx-1">
                    {(mode === 'custom' ? [1, 3] : [1, 2, 3]).map((s, idx, arr) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${step === s ? 'bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/10' : (step > s ? 'bg-primary/80 text-white' : 'bg-slate-100 text-slate-300')}`}>
                                {step > s ? <CheckCircle2 size={12} strokeWidth={3} /> : idx + 1}
                            </div>
                            {idx < arr.length - 1 && <div className={`h-0.5 w-8 sm:w-16 rounded-full transition-colors ${step > s ? 'bg-primary/80' : 'bg-slate-100'}`} />}
                        </div>
                    ))}
                </div>
            )}

            {!mode && renderStep1()}
            {mode && step === 1 && renderStep2()}
            {mode && step === 2 && renderStep3()}
            {mode && step === 3 && renderStep4()}

            {/* Hidden Cloud Vision Input */}
            <input type="file" ref={fileInputRef} onChange={handleOdometerScan} accept="image/*" className="hidden" capture="environment" />



            <Suspense fallback={null}>
                {showPreview && <PDFPreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} pdfUrl={previewPdfUrl} title="Invoice Preview" />}
            </Suspense>


        </div>
    );
};

export default TripForm;
