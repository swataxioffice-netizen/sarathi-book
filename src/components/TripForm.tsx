import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useSettings } from '../contexts/SettingsContext';
import { calculateFare, VEHICLES } from '../utils/fare';
import type { Trip } from '../utils/fare';
import { shareReceipt } from '../utils/pdf';
import PlacesAutocomplete from './PlacesAutocomplete';
import MapPicker from './MapPicker';
import { calculateDistance } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { estimatePermitCharge } from '../utils/permits';
import { estimateParkingCharge } from '../utils/parking';
import { Clock, Navigation, Save, UserPlus, Receipt, Star, History, MapPin, Camera, Mic, MessageCircle, Plus, Trash2, Edit, Moon, Eye } from 'lucide-react';
import { validateGSTIN } from '../utils/validation';
import { generateReceiptPDF } from '../utils/pdf';
import PDFPreviewModal from './PDFPreviewModal';
import { saveToHistory, getHistory } from '../utils/history';

// --- Zod Schemas (Defined Outside Component) ---

const TripDetailsSchema = z.object({
    fromLoc: z.string().min(1, 'Please enter Pickup Location'),
    toLoc: z.string().min(1, 'Please enter Drop Location'),
    startKm: z.number().min(0, 'Please enter valid Start KM'),
    endKm: z.number().min(0, 'Please enter valid End KM'),
    mode: z.string(),
    days: z.number().optional(),
}).refine((data) => data.endKm > data.startKm, {
    message: "End KM must be greater than Start KM",
    path: ["endKm"]
}).refine((data) => {
    if (data.endKm === data.startKm) return false;
    return true;
}, {
    message: "Car has not moved? End KM is same as Start KM",
    path: ["endKm"]
}).refine((data) => {
    // Outstation Round Trip Logic
    if (data.mode === 'outstation') {
        if (!data.days || data.days < 1) return false;
    }
    return true;
}, {
    message: "Please enter number of days for Outstation Trip",
    path: ["days"]
}).refine((data) => {
    // Warning for short Outstation trips
    if (data.mode === 'outstation' && (data.endKm - data.startKm) < 10) {
        return false;
    }
    return true;
}, {
    message: "Distance too short for Outstation (min 10 KM)",
    path: ["endKm"]
});

const HourlySchema = z.object({
    waitingHours: z.number().gt(0, 'Please enter valid Duration (Hours) for Hourly Rental')
});

const PackageSchema = z.object({
    packageName: z.string().min(1, 'Please enter Package Name'),
    packagePrice: z.number().gt(0, 'Please enter Valid Package Price')
});

const PassengerInfoSchema = z.object({
    customerName: z.string().min(1, 'Please enter Customer Name'),
    customerPhone: z.string().optional().refine((val) => {
        if (!val) return true; // Optional
        const clean = val.replace(/\D/g, '').slice(-10);
        return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
    }, 'Please enter a valid 10-digit Indian Mobile Number'),
    customerGst: z.string().optional().refine((val) => {
        if (!val) return true; // Optional
        return validateGSTIN(val);
    }, 'Invalid GSTIN Format'),
    billingAddress: z.string().optional()
}).refine((data) => {
    // GST implies Mandatory Billing Address
    if (data.customerGst && data.customerGst.length > 0) {
        return !!data.billingAddress && data.billingAddress.trim().length > 0;
    }
    return true;
}, {
    message: "Billing Address is MANDATORY for B2B/GST Invoices",
    path: ["billingAddress"]
});

interface TripFormProps {
    onSaveTrip: (trip: Trip) => void;
    onStatusChange?: (isOngoing: boolean) => void;
    onStepChange?: (step: number) => void;
}

const TripForm: React.FC<TripFormProps> = ({ onSaveTrip, onStepChange }) => {
    const { settings, currentVehicle } = useSettings();
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerGst, setCustomerGst] = useState('');
    const [startKm, setStartKm] = useState<number>(0);
    const [endKm, setEndKm] = useState<number>(0);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [toll, setToll] = useState<number>(0);
    const [parking, setParking] = useState<number>(0);
    const [nightBata, setNightBata] = useState(false);
    const [isCalculated, setIsCalculated] = useState(false);
    const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);

    const [result, setResult] = useState<{
        total: number; gst: number; fare: number; distance: number;
        effectiveDistance: number; rateUsed: number;
        waitingCharges: number; waitingHours?: number;
        hillStationCharges: number; petCharges: number;
        driverBatta: number; nightStay?: number
    } | null>(null);
    const [notes, setNotes] = useState('');
    const [mode, setMode] = useState<Trip['mode']>('drop');
    const [fromLoc, setFromLoc] = useState('');
    const [toLoc, setToLoc] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [localGst, setLocalGst] = useState(false);

    const [waitingHours, setWaitingHours] = useState<number>(0);
    const [isHillStation, setIsHillStation] = useState(false);
    const [petCharge, setPetCharge] = useState(false);

    const [permitCharge, setPermitCharge] = useState(0);
    const [nightStay, setNightStay] = useState(0);


    // Custom Mode State

    // Custom Mode State
    const [extraItems, setExtraItems] = useState<{ description: string, amount: number }[]>([
        { description: '', amount: 0 }
    ]);

    // Package details
    const [packageName, setPackageName] = useState('');
    const [numPersons, setNumPersons] = useState<number>(4);
    const [packagePrice, setPackagePrice] = useState<number>(0);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>(currentVehicle?.id || VEHICLES[0].id);
    const [days, setDays] = useState<number>(1);
    const [customRate, setCustomRate] = useState<number>(14);
    const [currentStep, setCurrentStep] = useState(1);
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // History States
    const [history, setHistory] = useState({
        names: getHistory('customer_name'),
        phones: getHistory('customer_phone'),
        gstins: getHistory('customer_gstin'),
        addresses: getHistory('customer_address'),
        locations: getHistory('location')
    });

    // Notify parent of step change
    useEffect(() => {
        if (onStepChange) onStepChange(currentStep);
    }, [currentStep, onStepChange]);

    const totalSteps = 5;

    // Map State
    const [showMap, setShowMap] = useState(false);
    const [activeMapField, setActiveMapField] = useState<'from' | 'to'>('from');
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [driverBatta, setDriverBatta] = useState<number>(0);
    const [visibleCharges, setVisibleCharges] = useState<string[]>(['toll', 'parking']); // Default common ones

    // Sync which charges should be visible based on values and mode
    useEffect(() => {
        const initialVisible = new Set(visibleCharges);
        if (toll > 0) initialVisible.add('toll');
        if (parking > 0) initialVisible.add('parking');
        if (driverBatta > 0) initialVisible.add('batta');
        if (nightStay > 0) initialVisible.add('stay');
        if (permitCharge > 0) initialVisible.add('permit');
        if (waitingHours > 0) initialVisible.add('waiting');

        if (mode === 'outstation') {
            initialVisible.add('batta');
            initialVisible.add('stay');
        }

        setVisibleCharges(Array.from(initialVisible));
    }, [mode]);

    // Sync Driver Batta when mode/days change (Auto-calc based on Vehicle)
    useEffect(() => {
        if (mode === 'outstation') {
            const veh = (settings.vehicles || []).find(v => v.id === selectedVehicleId) || currentVehicle;
            const model = (veh?.model || '').toLowerCase();
            let batta = 500; // Default Sedan/Mid
            if (model.includes('innova') || model.includes('suv') || model.includes('ertiga') || model.includes('xylo') || model.includes('tavera') || model.includes('marazzo') || model.includes('scorpio')) {
                batta = 600;
            } else if (model.includes('tempo') || model.includes('traveller')) {
                batta = 800;
            } else if (model.includes('hatchback') || model.includes('indica') || model.includes('wagon') || model.includes('celerio')) {
                batta = 400;
            }
            setDriverBatta(days * batta);
        } else {
            setDriverBatta(0);
        }
    }, [mode, days, selectedVehicleId, currentVehicle, settings.vehicles]);



    const validateStep = (step: number) => {
        try {
            if (step === 2) {
                // Pre-fill logic for schema validation
                let effectiveToLoc = toLoc;
                if (mode === 'outstation' && !toLoc?.trim()) {
                    effectiveToLoc = fromLoc;
                    setToLoc(fromLoc); // State update for UI
                }

                const data = {
                    fromLoc: mode === 'custom' ? 'Custom' : fromLoc, // Bypass validation
                    toLoc: mode === 'custom' ? 'Invoice' : effectiveToLoc,
                    startKm: mode === 'custom' ? 0 : (startKm ?? -1),
                    endKm: mode === 'custom' ? 1 : (endKm ?? -1),
                    mode,
                    days
                };

                TripDetailsSchema.parse(data);

                // Mode specific sub-schemas
                if (mode === 'hourly') HourlySchema.parse({ waitingHours });
                if (mode === 'package' || mode === 'fixed') PackageSchema.parse({ packageName: mode === 'package' ? packageName : 'Fixed', packagePrice: mode === 'fixed' ? packagePrice : (mode === 'package' ? packagePrice : 1) }); // quick fix for shared schema
                if (mode === 'fixed' && (!packagePrice || packagePrice <= 0)) throw new Error("Please enter Fixed Amount");

                // Custom Mode Validation
                if (mode === 'custom') {
                    if (extraItems.length === 0 || extraItems.every(i => !i.description || i.amount <= 0)) {
                        throw new Error("Please add at least one valid item");
                    }
                }
            }

            if (step === 4) {
                PassengerInfoSchema.parse({
                    customerName,
                    customerPhone,
                    customerGst,
                    billingAddress
                });
            }

            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                // ZodError contains an array of issues
                alert(error.issues[0].message);
            } else if (error instanceof Error) {
                alert(error.message);
            }
            return false;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            // Recalculate if moving to Final Step (Step 5) to ensure latest values
            if (currentStep === 4) {
                handleCalculate();
            }
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleMapSelect = (pickupAddr: string, dropAddr: string, dist: number, tollAmt?: number) => {
        if (activeMapField === 'from') {
            setFromLoc(pickupAddr);
        } else {
            setToLoc(dropAddr || pickupAddr);
            if (dist > 0) {
                const multiplier = mode === 'outstation' ? 2 : 1;
                setEndKm(startKm + Math.round(dist * multiplier));
            }
            if (tollAmt && tollAmt > 0) {
                setToll(tollAmt);
                if (!visibleCharges.includes('toll')) {
                    setVisibleCharges(prev => [...prev, 'toll']);
                }
            }
        }
        setShowMap(false);
    };

    // Helper function to get state name from GSTIN
    const getStateFromGSTIN = (gstin: string): string => {
        if (!gstin || gstin.length < 2) return '';
        const stateCode = gstin.substring(0, 2);
        const stateMap: Record<string, string> = {
            '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
            '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
            '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
            '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
            '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
            '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
            '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra', '28': 'Andhra Pradesh',
            '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
            '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana',
            '37': 'Andhra Pradesh', '38': 'Ladakh'
        };
        return stateMap[stateCode] || '';
    };

    // Auto-calculate distance AND TOLLS AND PERMITS AND PARKING from coords
    useEffect(() => {
        const autoTripData = async () => {
            if (pickupCoords && dropCoords) {
                try {
                    // 1. Estimate Permit based on states & vehicle
                    const permitEst = estimatePermitCharge(fromLoc, toLoc, selectedVehicleId);
                    if (permitEst) {
                        setPermitCharge(permitEst.amount);
                        if (!visibleCharges.includes('permit')) {
                            setVisibleCharges(prev => [...prev, 'permit']);
                        }
                    } else {
                        setPermitCharge(0);
                    }

                    // 2. Estimate Parking based on location keywords
                    const pickupParking = estimateParkingCharge(fromLoc);
                    const dropParking = estimateParkingCharge(toLoc);
                    const totalParking = (pickupParking?.amount || 0) + (dropParking?.amount || 0);
                    if (totalParking > 0) {
                        setParking(totalParking);
                        if (!visibleCharges.includes('parking')) {
                            setVisibleCharges(prev => [...prev, 'parking']);
                        }
                    }

                    // 3. Try Advanced Routes API (Tolls + Better distance)
                    const advanced = await calculateAdvancedRoute(pickupCoords, dropCoords);
                    if (advanced) {
                        const multiplier = mode === 'outstation' ? 2 : 1;
                        const finalDist = advanced.distanceKm * multiplier;
                        setEstimatedDistance(finalDist);

                        if (advanced.tollPrice > 0) {
                            // Doubling toll for outstation (Round Trip)
                            setToll(advanced.tollPrice * multiplier);
                            if (!visibleCharges.includes('toll')) {
                                setVisibleCharges(prev => [...prev, 'toll']);
                            }
                        }
                    } else {
                        // 4. Fallback to basic
                        const result = await calculateDistance(pickupCoords, dropCoords);
                        if (result) {
                            const finalDist = mode === 'outstation' ? result.distance * 2 : result.distance;
                            setEstimatedDistance(finalDist);
                        }
                    }
                } catch (e) {
                    console.error("Auto calculation failed", e);
                }
            }
        };
        autoTripData();
    }, [pickupCoords, dropCoords, mode, fromLoc, toLoc, selectedVehicleId]);

    // Update End KM based on Estimated Distance
    useEffect(() => {
        if (estimatedDistance !== null) {
            setEndKm(startKm + estimatedDistance);
        }
    }, [startKm, estimatedDistance]);

    useEffect(() => {
        if (customerGst.trim().length === 15 && validateGSTIN(customerGst)) {
            setLocalGst(true);
            // Auto-fill billing address with state name if address is empty
            if (!billingAddress.trim()) {
                const stateName = getStateFromGSTIN(customerGst);
                if (stateName) {
                    setBillingAddress(stateName);
                }
            }
        } else {
            setLocalGst(false);
        }
    }, [customerGst]);



    useEffect(() => {
        if (numPersons === 12) {
            setSelectedVehicleId('tempo');
        } else if (numPersons === 7) {
            if (!['innova', 'crysta', 'tempo'].includes(selectedVehicleId)) {
                setSelectedVehicleId('innova');
            }
        }
    }, [numPersons]);

    // Auto-suggest rate based on vehicle and mode, but keep it editable
    useEffect(() => {
        const vehicle = VEHICLES.find(v => v.id === selectedVehicleId);
        if (vehicle) {
            const suggestedRate = mode === 'outstation' ? vehicle.roundRate : vehicle.dropRate;
            setCustomRate(suggestedRate);
        }
    }, [selectedVehicleId, mode]);

    // Auto-calculate duration for Hourly Mode
    useEffect(() => {
        if (mode === 'hourly' && startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);

            // Handle cross-day (e.g., 10 PM to 2 AM)
            if (end < start) {
                end.setDate(end.getDate() + 1);
            }

            const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Hours
            if (diff > 0) {
                setWaitingHours(parseFloat(diff.toFixed(1))); // Set as duration
            }
        }
    }, [startTime, endTime, mode]);

    const handleImportContact = async () => {
        try {
            // Check if Contact Picker API is available
            if ('contacts' in navigator && 'ContactsManager' in window) {
                const props = ['name', 'tel'];
                const opts = { multiple: false };
                // @ts-ignore
                const contacts = await navigator.contacts.select(props, opts);
                if (contacts && contacts.length > 0) {
                    const contact = contacts[0];
                    if (contact.name && contact.name.length > 0) {
                        setCustomerName(contact.name[0]);
                    }
                    if (contact.tel && contact.tel.length > 0) {
                        setCustomerPhone(contact.tel[0]);
                    }
                }
            } else {
                alert('Contact picker not supported on this device');
            }
        } catch (error) {
            // Contact selection cancelled or failed
        }
    };

    // Voice Input Helper (Simple implementation using Web Speech API if available)
    const startListening = (setField: (val: string) => void) => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US'; // Default to English, could be made dynamic
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.start();

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setField(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
            };
        } else {
            alert('Voice input not supported in this browser.');
        }
    };



    const handleCalculate = () => {
        const activeRate = (mode === 'distance' || mode === 'drop' || mode === 'outstation') ? customRate : (mode === 'hourly' ? settings.hourlyRate : 0);

        const res = calculateFare({
            startKm,
            endKm,
            ratePerKm: activeRate,
            mode,
            vehicleId: selectedVehicleId,
            days: mode === 'outstation' ? days : 1,
            toll: toll,
            parking: parking,
            permit: permitCharge,
            gstEnabled: localGst,
            waitingHours: mode === 'hourly' ? 0 : waitingHours,
            isHillStation,
            petCharge,
            nightBata: nightBata ? settings.nightBata : 0,
            hourlyRate: settings.hourlyRate,
            durationHours: mode === 'hourly' ? waitingHours : 0,
            packagePrice: (mode === 'package' || mode === 'fixed') ? packagePrice : 0,
            nightStay: nightStay,
            extraItems: mode === 'custom' ? extraItems : []
        });

        // Use Manual Batta only if user explicitly overrode it in the form
        const finalDriverBatta = driverBatta > 0 ? driverBatta : res.driverBatta;

        // If batta was overridden, we need a small adjustment
        const diffBatta = finalDriverBatta - res.driverBatta;

        setResult({
            ...res,
            total: res.total + diffBatta,
            fare: res.fare + diffBatta,
            driverBatta: finalDriverBatta,
            nightStay // already in res but good to be explicit
        });
        setIsCalculated(true);
    };

    const handlePreview = () => {
        if (!result) return;
        const selectedVehObj = (settings.vehicles || []).find(v => v.id === selectedVehicleId) || currentVehicle;
        const finalVehicleNum = selectedVehObj?.number || currentVehicle?.number || 'N/A';

        const tripData: any = {
            id: crypto.randomUUID(),
            customerName: customerName || 'Valued Customer',
            customerPhone,
            customerGst,
            billingAddress,
            from: fromLoc,
            to: toLoc,
            date: new Date(invoiceDate).toISOString(),
            mode,
            totalFare: result.total,
            fare: result.fare,
            gst: result.gst,
            startKm,
            endKm,
            waitingCharges: result.waitingCharges,
            waitingHours,
            hillStationCharges: result.hillStationCharges,
            petCharges: result.petCharges,
            permit: permitCharge,
            ratePerKm: customRate,
            baseFare: settings.baseFare,
            nightBata: nightBata ? settings.nightBata : 0,
            toll: toll,
            parking: parking,
            days: days,
            driverBatta: result.driverBatta,
            nightStay: nightStay,
            extraItems: mode === 'custom' ? extraItems : undefined
        };

        const doc = generateReceiptPDF(tripData, {
            companyName: settings.companyName,
            companyAddress: settings.companyAddress,
            driverPhone: settings.driverPhone,
            gstin: settings.gstin,
            vehicleNumber: finalVehicleNum,
            gstEnabled: localGst,
            vehicles: settings.vehicles,
            signatureUrl: settings.signatureUrl
        });

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
        setShowPreview(true);
    };

    const handleWhatsAppShare = () => {
        if (!result) return;
        const selectedVehObj = (settings.vehicles || []).find(v => v.id === selectedVehicleId) || currentVehicle;
        const finalVehicleNum = selectedVehObj?.number || currentVehicle?.number || 'N/A';

        const tripData: any = {
            id: crypto.randomUUID(),
            customerName: customerName || 'Valued Customer',
            customerPhone,
            customerGst,
            billingAddress,
            from: fromLoc,
            to: toLoc,
            date: new Date(invoiceDate).toISOString(),
            mode,
            totalFare: result.total,
            fare: result.fare,
            gst: result.gst,
            startKm,
            endKm,
            waitingCharges: result.waitingCharges,
            waitingHours,
            hillStationCharges: result.hillStationCharges,
            petCharges: result.petCharges,
            permit: permitCharge,
            ratePerKm: customRate,
            baseFare: settings.baseFare,
            nightBata: nightBata ? settings.nightBata : 0,
            toll: toll,
            parking: parking,
            days: days,
            driverBatta: result.driverBatta,
            nightStay: nightStay,
            extraItems: mode === 'custom' ? extraItems : undefined
        };
        if (customerName) saveToHistory('customer_name', customerName);
        if (customerPhone) saveToHistory('customer_phone', customerPhone);
        if (customerGst) saveToHistory('customer_gstin', customerGst);
        if (billingAddress) saveToHistory('customer_address', billingAddress);
        if (fromLoc) saveToHistory('location', fromLoc);
        if (toLoc) saveToHistory('location', toLoc);

        shareReceipt(tripData, {
            companyName: settings.companyName,
            companyAddress: settings.companyAddress,
            driverPhone: settings.driverPhone,
            gstin: settings.gstin,
            vehicleNumber: finalVehicleNum,
            gstEnabled: localGst,
            vehicles: settings.vehicles,
            signatureUrl: settings.signatureUrl
        });
        setShowPreview(false);
    };

    const handleSave = () => {
        if (!result) return;
        const activeRate = (mode === 'distance' || mode === 'drop' || mode === 'outstation') ? customRate : (mode === 'hourly' ? settings.hourlyRate : 0);

        if (customerName) saveToHistory('customer_name', customerName);
        if (customerPhone) saveToHistory('customer_phone', customerPhone);
        if (customerGst) saveToHistory('customer_gstin', customerGst);
        if (billingAddress) saveToHistory('customer_address', billingAddress);
        if (fromLoc) saveToHistory('location', fromLoc);
        if (toLoc) saveToHistory('location', toLoc);

        // Update local history state to reflect changes without reload
        setHistory({
            names: getHistory('customer_name'),
            phones: getHistory('customer_phone'),
            gstins: getHistory('customer_gstin'),
            addresses: getHistory('customer_address'),
            locations: getHistory('location')
        });

        onSaveTrip({
            id: crypto.randomUUID(),
            customerName: customerName || 'Cash Guest',
            customerPhone,
            customerGst,
            from: fromLoc,
            to: toLoc,
            billingAddress,
            startKm,
            endKm,
            startTime,
            endTime,
            toll: toll,
            parking: parking,
            nightBata: nightBata ? settings.nightBata : 0,
            baseFare: settings.baseFare,
            ratePerKm: activeRate,
            totalFare: result.total,
            gst: result.gst,
            date: new Date(invoiceDate).toISOString(),
            mode,
            durationHours: mode === 'hourly' ? waitingHours : undefined,
            hourlyRate: mode === 'hourly' ? settings.hourlyRate : undefined,
            notes: notes || '',
            waitingHours: mode === 'hourly' ? 0 : waitingHours,
            waitingCharges: result.waitingCharges,
            hillStationCharges: result.hillStationCharges,
            petCharges: result.petCharges,
            packageName: mode === 'package' ? packageName : undefined,
            packagePrice: mode === 'package' ? packagePrice : undefined,
            permit: permitCharge,
            days: days,
            driverBatta: result.driverBatta,
            extraItems: mode === 'custom' ? extraItems : undefined
        });
        setCustomerName(''); setCustomerPhone(''); setCustomerGst(''); setBillingAddress(''); setFromLoc(''); setToLoc(''); setNotes(''); setStartKm(0); setEndKm(0); setToll(0); setParking(0); setWaitingHours(0); setNightBata(false); setIsHillStation(false); setPetCharge(false); setPermitCharge(0); setIsCalculated(false); setResult(null);
        setPackageName(''); setNumPersons(1); setPackagePrice(0);
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setCurrentStep(1);
    };

    const handleClear = () => {
        setCustomerName(''); setCustomerPhone(''); setCustomerGst(''); setBillingAddress(''); setFromLoc(''); setToLoc(''); setNotes(''); setStartKm(0); setEndKm(0); setToll(0); setParking(0); setWaitingHours(0); setNightBata(false); setIsHillStation(false); setPetCharge(false); setPermitCharge(0); setIsCalculated(false); setResult(null);
        setPackageName(''); setNumPersons(1); setPackagePrice(0);
        setInvoiceDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <div className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-300 ${s <= currentStep ? (s === currentStep ? 'w-8 bg-blue-600' : 'w-4 bg-blue-400') : 'w-4 bg-slate-200'
                                }`}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Step {currentStep} of {totalSteps}</span>
            </div>

            <div className="tn-card overflow-hidden">
                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Choose Service</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">What kind of trip is this?</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'drop', label: 'Outstation Drop (1-Way)', desc: 'One-way drop to other city', icon: Navigation },
                                { id: 'outstation', label: 'Outstation Round Trip', desc: 'Return trip to origin city', icon: History },
                                { id: 'hourly', label: 'Local Hourly', desc: 'City rental by hours', icon: Clock },
                                { id: 'custom', label: 'Custom Invoice', desc: 'Create manual bill (Excel)', icon: Edit },
                                // { id: 'package', label: 'Tour Package', desc: 'Fixed rate packages', icon: Star },
                                // { id: 'fixed', label: 'Fixed Price', desc: 'Pre-negotiated rate', icon: Receipt }
                            ].map((s) => {
                                const Icon = s.icon;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => { setMode(s.id as any); nextStep(); }}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${mode === s.id ? 'bg-slate-50 border-primary shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-xl ${mode === s.id ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-xs font-black uppercase tracking-wider ${mode === s.id ? 'text-primary' : 'text-slate-900'}`}>{s.label}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">{s.desc}</p>
                                        </div>
                                        {mode === s.id && (
                                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>


                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Trip Details</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Enter route and timing</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            {/* CUSTOM INVOICE FORM */}
                            {mode === 'custom' && (
                                <div className="col-span-2 space-y-4">
                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-black text-orange-800 uppercase tracking-widest">Bill Items</label>
                                            <button
                                                onClick={() => setExtraItems([...extraItems, { description: '', amount: 0 }])}
                                                className="px-2 py-1 bg-white border border-orange-200 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-orange-100"
                                            >
                                                <Plus size={12} /> Add Row
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {extraItems.map((item, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Description (e.g. Innova Rent)"
                                                        value={item.description}
                                                        onChange={(e) => {
                                                            const newItems = [...extraItems];
                                                            newItems[index].description = e.target.value;
                                                            setExtraItems(newItems);
                                                        }}
                                                        className="tn-input h-9 flex-1 font-bold text-xs"
                                                    />
                                                    <div className="relative w-24">
                                                        <span className="absolute left-2 top-2.5 text-xs font-bold text-slate-400">₹</span>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={item.amount || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...extraItems];
                                                                newItems[index].amount = parseFloat(e.target.value) || 0;
                                                                setExtraItems(newItems);
                                                            }}
                                                            className="tn-input h-9 pl-5 font-black text-xs"
                                                        />
                                                    </div>
                                                    {extraItems.length > 1 && (
                                                        <button
                                                            onClick={() => {
                                                                const newItems = extraItems.filter((_, i) => i !== index);
                                                                setExtraItems(newItems);
                                                            }}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between items-center px-1">
                                            <span className="text-xs font-bold text-orange-800 uppercase tracking-wide">Total</span>
                                            <span className="text-lg font-black text-orange-900 tracking-tight">
                                                ₹{extraItems.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="col-span-2">
                                {mode !== 'custom' && (
                                    <PlacesAutocomplete
                                        label="Pickup"
                                        icon={<MapPin size={16} />}
                                        value={fromLoc}
                                        onChange={setFromLoc}
                                        onPlaceSelected={(place) => {
                                            setFromLoc(place.address);
                                            setPickupCoords({ lat: place.lat, lng: place.lng });
                                        }}
                                        onMapClick={() => { setActiveMapField('from'); setShowMap(true); }}
                                        placeholder="e.g. Chennai Airport"
                                        className="tn-input pl-10 pr-10 transition-all focus:ring-2 focus:ring-blue-500/20"
                                        rightContent={
                                            <button
                                                onClick={() => startListening(setFromLoc)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Voice Input"
                                            >
                                                <Mic size={16} />
                                            </button>
                                        }
                                    />
                                )}
                            </div>

                            <div className="col-span-2">
                                {mode !== 'custom' && (
                                    <PlacesAutocomplete
                                        label="Drop"
                                        icon={<MapPin size={16} />}
                                        value={toLoc}
                                        onChange={setToLoc}
                                        onPlaceSelected={(place) => {
                                            setToLoc(place.address);
                                            setDropCoords({ lat: place.lat, lng: place.lng });
                                        }}
                                        onMapClick={() => { setActiveMapField('to'); setShowMap(true); }}
                                        placeholder="e.g. Pondicherry"
                                        className="tn-input pl-10 pr-10"
                                        rightContent={
                                            <button
                                                onClick={() => startListening(setToLoc)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Mic size={16} />
                                            </button>
                                        }
                                    />
                                )}
                            </div>

                            {/* Distance Badge */}
                            {estimatedDistance !== null && (
                                <div className="col-span-2 flex justify-center -mt-2 mb-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-full flex items-center gap-2">
                                        <MapPin size={12} className="text-blue-600" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                                            Est. Distance: {estimatedDistance} KM {mode === 'outstation' ? '(Round Trip)' : ''}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {mode !== 'custom' && (
                                <>
                                    <div>
                                        <label className="tn-label flex items-center justify-between">
                                            Start KM
                                            <label className="text-[9px] text-blue-600 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100">
                                                <Camera size={10} /> Photo
                                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => alert('Photo attached!')} />
                                            </label>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="tn-input flex-1"
                                                value={startKm || ''}
                                                onChange={(e) => setStartKm(Number(e.target.value))}
                                                placeholder="KM"
                                            />
                                            {mode === 'hourly' && (
                                                <input
                                                    type="time"
                                                    className="tn-input w-24 px-1 text-center text-xs"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="tn-label flex items-center justify-between">
                                            End KM
                                            <label className="text-[9px] text-blue-600 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100">
                                                <Camera size={10} /> Photo
                                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => alert('Photo attached!')} />
                                            </label>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="tn-input flex-1"
                                                value={endKm || ''}
                                                onChange={(e) => setEndKm(Number(e.target.value))}
                                                placeholder="KM"
                                            />
                                            {mode === 'hourly' && (
                                                <input
                                                    type="time"
                                                    className="tn-input w-24 px-1 text-center text-xs"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {mode === 'outstation' && (
                                <div className="col-span-2">
                                    <label className="tn-label">Trip Duration (Days)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="number"
                                            className="tn-input pl-11"
                                            placeholder="e.g. 2"
                                            value={days || ''}
                                            onChange={(e) => setDays(Number(e.target.value))}
                                            min={1}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 pl-1">Min 300 KM per day & Daily Driver Batta applies</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={prevStep} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-2xl">Back</button>
                            <button onClick={nextStep} className="flex-[2] tn-button-primary">Continue</button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Additional Charges</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Tolls, parking, and extras</p>
                        </div>

                        <div className="space-y-4">
                            {mode !== 'custom' && (
                                <>
                                    {/* Charge Selector Dropdown */}
                                    <div className="relative">
                                        <select
                                            className="tn-input bg-slate-100 border-none font-black text-[10px] uppercase tracking-widest pl-10 h-12 rounded-2xl appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                if (id && !visibleCharges.includes(id)) {
                                                    setVisibleCharges([...visibleCharges, id]);
                                                }
                                                e.target.value = ''; // Reset
                                            }}
                                        >
                                            <option value="">+ Add Charge (Batta, Stay, Permit...)</option>
                                            {[
                                                { id: 'toll', label: 'Toll Fees' },
                                                { id: 'parking', label: 'Parking Fees' },
                                                { id: 'batta', label: 'Driver Batta' },
                                                { id: 'stay', label: 'Night Stay' },
                                                { id: 'waiting', label: mode === 'hourly' ? 'Extra Hours' : 'Waiting Time' },
                                                { id: 'permit', label: 'Permit Charge' }
                                            ].filter(c => {
                                                if (mode === 'outstation' && c.id === 'waiting') return false;
                                                return !visibleCharges.includes(c.id);
                                            }).map(c => (
                                                <option key={c.id} value={c.id}>{c.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <Plus size={16} />
                                        </div>
                                    </div>

                                    {/* Active Charge Inputs */}
                                    <div className="space-y-3">
                                        {[
                                            { id: 'toll', label: 'Toll Fees', input: toll, setInput: setToll, icon: Receipt },
                                            { id: 'parking', label: 'Parking Fees', input: parking, setInput: setParking, icon: MapPin },
                                            { id: 'batta', label: 'Driver Batta', input: driverBatta, setInput: setDriverBatta, icon: UserPlus, hint: 'Daily Allowance' },
                                            { id: 'stay', label: 'Night Stay', input: nightStay, setInput: setNightStay, icon: Moon, hint: 'Hotel/Lodging' },
                                            { id: 'waiting', label: mode === 'hourly' ? 'Extra Hours' : 'Waiting Time', input: waitingHours, setInput: setWaitingHours, unit: 'Hrs', icon: Clock },
                                            { id: 'permit', label: 'Permit Charge', input: permitCharge, setInput: setPermitCharge, icon: Star }
                                        ].filter(item => visibleCharges.includes(item.id))
                                            .map((item) => {
                                                const Icon = item.icon;
                                                return (
                                                    <div key={item.id} className="animate-in zoom-in-95 duration-200 flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                                                                <Icon size={16} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">{item.label}</span>
                                                                {/* @ts-ignore */}
                                                                {item.hint && <span className="text-[8px] font-bold text-slate-400 leading-none">{item.hint}</span>}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                                                {!item.unit && <span className="text-slate-400 font-bold text-[10px]">₹</span>}
                                                                <input
                                                                    type="number"
                                                                    className="w-14 text-right font-black text-sm text-slate-900 bg-transparent outline-none"
                                                                    placeholder="0"
                                                                    value={item.input || ''}
                                                                    onChange={(e) => item.setInput(Number(e.target.value))}
                                                                />
                                                                {item.unit && <span className="text-[8px] font-bold text-slate-400 uppercase">{item.unit}</span>}
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    item.setInput(0);
                                                                    setVisibleCharges(visibleCharges.filter(id => id !== item.id));
                                                                }}
                                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </>
                            )}

                            {mode === 'custom' && (
                                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-center">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">Total Bill Amount</p>
                                    <p className="text-4xl font-black text-orange-900 tracking-tighter">
                                        ₹{extraItems.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-orange-400 font-bold mt-2 uppercase tracking-wide">
                                        {extraItems.length} items added in Step 2
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={prevStep} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-2xl">Back</button>
                            <button onClick={nextStep} className="flex-[2] tn-button-primary">Continue</button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Passenger Info</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">For PDF invoice generation</p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="tn-label">Customer Name</label>
                                    <div className="relative">
                                        <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="tn-input pl-11"
                                            placeholder="Guest Name"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            list="history-names"
                                        />
                                        <datalist id="history-names">
                                            {history.names.map(name => <option key={name} value={name} />)}
                                        </datalist>
                                        <button
                                            onClick={handleImportContact}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 text-primary p-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-1"
                                        >
                                            <UserPlus size={14} /> Pick Contact
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="tn-label">Phone Number (Optional)</label>
                                    <input
                                        type="tel"
                                        className="tn-input"
                                        placeholder="e.g. 9876543210"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        list="history-phones"
                                    />
                                    <datalist id="history-phones">
                                        {history.phones.map(phone => <option key={phone} value={phone} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="tn-label">Customer GSTIN (For Corporate)</label>
                                    <input
                                        type="text"
                                        className={`tn-input uppercase ${customerGst && !validateGSTIN(customerGst) ? 'border-orange-300 bg-orange-50' : ''}`}
                                        placeholder="33XXXXX0000X1ZX"
                                        value={customerGst}
                                        onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                                        maxLength={15}
                                        list="history-gstins"
                                    />
                                    <datalist id="history-gstins">
                                        {history.gstins.map(gst => <option key={gst} value={gst} />)}
                                    </datalist>
                                    {customerGst && !validateGSTIN(customerGst) && (
                                        <p className="text-[9px] text-orange-600 font-bold mt-1 uppercase">Invalid GSTIN Format</p>
                                    )}
                                </div>
                                <div>
                                    <label className="tn-label">Billing Address</label>
                                    <input
                                        type="text"
                                        className="tn-input"
                                        placeholder="Company Address or Local Address"
                                        value={billingAddress}
                                        onChange={(e) => setBillingAddress(e.target.value)}
                                        list="history-addresses"
                                    />
                                    <datalist id="history-addresses">
                                        {history.addresses.map(addr => <option key={addr} value={addr} />)}
                                    </datalist>
                                </div>
                            </div>



                            {mode !== 'custom' && (
                                <>
                                    <div>
                                        <label className="tn-label">Select Vehicle from Fleet</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(settings.vehicles.length > 0 ? settings.vehicles : VEHICLES).map((v) => {
                                                // Find rate info based on categoryId if it's a saved vehicle, or use v directly if it's from VEHICLES
                                                const vInfo = 'categoryId' in v
                                                    ? VEHICLES.find(cat => cat.id === v.categoryId) || VEHICLES[1] // Fallback to Sedan
                                                    : v as typeof VEHICLES[0];

                                                const isActive = selectedVehicleId === v.id;
                                                const rate = mode === 'outstation' ? vInfo.roundRate : vInfo.dropRate;

                                                return (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => {
                                                            setSelectedVehicleId(v.id);
                                                            setCustomRate(rate);
                                                        }}
                                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${isActive ? 'bg-slate-50 border-primary text-primary shadow-sm' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-widest truncate w-full text-center">
                                                            {'number' in v ? v.number : v.name}
                                                        </span>
                                                        <span className="text-[11px] font-bold">
                                                            {'number' in v ? (v as any).model : `₹${rate}/KM`}
                                                        </span>
                                                        {'number' in v && (
                                                            <span className="text-[9px] font-black text-primary uppercase">₹{rate}/KM</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {settings.vehicles.length === 0 && (
                                            <p className="text-[9px] text-orange-500 font-bold mt-2 uppercase tracking-wide">
                                                Tip: Add your vehicles in Profile for faster selection
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="tn-label">Rate/KM (Editable)</label>
                                            <input
                                                type="number"
                                                className="tn-input"
                                                value={customRate || ''}
                                                onChange={(e) => setCustomRate(Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex items-end h-full pb-1">
                                            {/* Night Batta was here, moved to Step 3 */}
                                        </div>
                                    </div>
                                </>
                            )}

                            {settings.gstin ? (
                                <div className="flex items-end h-full">
                                    <label className={`w-full py-3 px-4 rounded-xl border-2 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between ${localGst ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={localGst}
                                                onChange={() => setLocalGst(!localGst)}
                                                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                            />
                                            <span>Apply GST (5.0%)</span>
                                        </div>
                                        <Receipt size={14} />
                                    </label>
                                </div>
                            ) : customerGst ? (
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-tight flex items-center gap-2">
                                        <Star size={12} fill="currentColor" />
                                        Corporate Client: RCM Label will be auto-added
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={prevStep} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-2xl">Back</button>
                            <button
                                onClick={() => { handleCalculate(); nextStep(); }}
                                className="flex-[2] tn-button-primary"
                            >
                                Calculate Fare
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {isCalculated && result && (
                            <div className="space-y-6">
                                <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                                    {/* Glassmorphism Effect */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -mr-10 -mt-10" />

                                    <div className="relative z-10">
                                        <div className="flex flex-col items-center text-center mb-6">
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Final Amount</p>
                                            <h4 className="text-5xl font-black mb-1">₹{result.total.toLocaleString()}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Includes Distance & All Taxes</p>
                                        </div>

                                        <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 mb-6">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="font-bold text-slate-400 uppercase">Trip Type</span>
                                                <span className="font-black text-white uppercase">
                                                    {mode === 'drop' ? (result.distance <= 30 ? 'Local Market Rate' : 'One Way (Empty Return Fee Included)') : mode === 'outstation' ? 'Round Trip (Return KM Included)' : mode}
                                                </span>
                                            </div>
                                            {result.distance <= 30 && mode === 'drop' ? (
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="font-bold text-slate-400 uppercase">Local Base Fare</span>
                                                    <span className="font-black text-white">₹{result.fare - result.waitingCharges - (toll + parking + permitCharge + result.petCharges + result.hillStationCharges)}</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="font-bold text-slate-400 uppercase">
                                                        {mode === 'hourly' ? 'Rental Charge' : (mode === 'custom' ? 'Custom Items' : 'Distance Charge')}
                                                    </span>

                                                    {mode === 'custom' ? (
                                                        <span className="font-black text-white">
                                                            {extraItems.length} Items = ₹{extraItems.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
                                                        </span>
                                                    ) : mode === 'hourly' ? (
                                                        <span className="font-black text-white">
                                                            {waitingHours} Hrs Package = ₹{result.fare.toLocaleString()}
                                                        </span>
                                                    ) : mode === 'drop' ? (
                                                        <span className="font-black text-white">
                                                            {result.effectiveDistance} KM (Min 130) × ₹{result.rateUsed} = ₹{(result.effectiveDistance * result.rateUsed).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="font-black text-white">
                                                            {result.effectiveDistance} KM (Total Run) × ₹{result.rateUsed} = ₹{(result.effectiveDistance * result.rateUsed).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {result.waitingCharges > 0 && (
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="font-bold text-slate-400 uppercase">Waiting Charges</span>
                                                    <span className="font-black text-white">₹{result.waitingCharges}</span>
                                                </div>
                                            )}
                                            {result.driverBatta > 0 && (
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="font-bold text-slate-400 uppercase">Driver Batta</span>
                                                    <span className="font-black text-white">₹{result.driverBatta}</span>
                                                </div>
                                            )}
                                            {(toll > 0 || parking > 0 || permitCharge > 0) && (
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="font-bold text-slate-400 uppercase">Tolls & Other</span>
                                                    <span className="font-black text-white">₹{toll + parking + permitCharge}</span>
                                                </div>
                                            )}
                                            {result.gst > 0 && (
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="font-bold text-slate-400 uppercase">GST (5%)</span>
                                                    <span className="font-black text-white">₹{result.gst}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 w-full gap-4">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Actual KM</p>
                                                <p className="text-sm font-bold text-white">{result.distance} KM</p>
                                            </div>
                                            <div className="text-center border-x border-white/10">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fare/KM</p>
                                                <p className="text-sm font-bold text-white">₹{customRate}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                                <p className="text-sm font-bold text-green-400 uppercase">Calculated</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={handleSave} className="tn-button-primary w-full bg-primary hover:bg-blue-600 h-16 rounded-2xl shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1">
                                        <Save size={20} />
                                        <span>Save Invoice</span>
                                    </button>
                                    <button
                                        onClick={handlePreview}
                                        className="w-full py-4 rounded-2xl border-2 border-slate-200 bg-white font-black text-[11px] uppercase tracking-widest text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                                    >
                                        <Eye size={18} />
                                        Preview Invoice
                                    </button>
                                    <button
                                        onClick={handleWhatsAppShare}
                                        className="w-full py-4 rounded-2xl border-2 border-[#25D366] bg-[#25D366]/5 font-black text-[11px] uppercase tracking-widest text-[#25D366] flex items-center justify-center gap-2 hover:bg-[#25D366]/10"
                                    >
                                        <MessageCircle size={18} />
                                        Share on WhatsApp
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={prevStep} className="w-full py-4 font-bold text-slate-400 uppercase tracking-widest text-[11px] border-2 border-slate-100 rounded-xl">Back</button>
                                        <button
                                            onClick={() => {
                                                setCurrentStep(1);
                                                handleClear();
                                            }}
                                            className="w-full py-4 font-bold text-red-400 uppercase tracking-widest text-[11px] border-2 border-red-50 rounded-xl"
                                        >
                                            Start Over
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {
                showMap && (
                    <MapPicker
                        onLocationSelect={handleMapSelect}
                        onClose={() => setShowMap(false)}
                    />
                )
            }

            <PDFPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                pdfUrl={previewPdfUrl || ''}
                onShare={handleWhatsAppShare}
                title="Invoice Preview"
            />
        </div >
    );
};


export default TripForm;
