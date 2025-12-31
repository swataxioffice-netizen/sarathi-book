import { VEHICLES } from '../config/vehicleRates';
import { PERMIT_CHARGES } from '../config/permitRates';

export type FareMode = 'distance' | 'hourly' | 'outstation' | 'drop' | 'package' | 'fixed' | 'custom';

export interface Trip {
    id: string;
    invoiceNo?: string;
    customerName: string;
    customerPhone?: string;
    customerGst?: string;
    vehicleId?: string;
    passengers?: number;
    startKm: number;
    endKm: number;
    startTime: string; // ISO String
    endTime: string;   // ISO String
    toll: number;
    parking: number;
    baseFare: number;
    ratePerKm: number;
    nightBata: number;
    totalFare: number;
    date: string;
    mode: FareMode;
    hourlyRate?: number;
    durationHours?: number;
    gst?: number;
    waitingCharges?: number;
    waitingHours?: number;
    hillStationCharges?: number;
    petCharges?: number;
    extraItems?: { description: string, amount: number }[];
    driverBatta?: number;
    nightStay?: number;
    from?: string;
    to?: string;
    billingAddress?: string;
    notes?: string;
    packageName?: string;
    numberOfPersons?: number;
    packagePrice?: number;
    permit?: number;
    days?: number;
}

export interface Expense {
    id: string;
    category: 'fuel' | 'maintenance' | 'food' | 'toll' | 'permit' | 'parking' | 'other';
    amount: number;
    date: string;
    description: string;
}

export interface Document {
    id: string;
    name: string;
    expiryDate: string;
    type: 'RC' | 'Insurance' | 'Permit' | 'License';
    imageUrl?: string;
}


/**
 * THE REWRITTEN ALGORITHM (v4.0) - CHENNAI STANDARD 2025
 */
export const calculateFare = (params: {
    startKm: number;
    endKm: number;
    ratePerKm?: number;
    mode: FareMode;
    vehicleId?: string;
    days?: number;
    toll?: number;
    parking?: number;
    permit?: number;
    gstEnabled?: boolean;
    waitingHours?: number;
    isHillStation?: boolean;
    petCharge?: boolean;
    nightBata?: number; // Manual override amount
    hourlyRate?: number;
    durationHours?: number;
    extraItems?: { description: string; amount: number }[];
    packagePrice?: number;
    nightStay?: number;
    // NEW PARAMS
    includeGarageBuffer?: boolean;
    manualBataMode?: 'auto' | 'single' | 'double'; // 'auto', 'single', 'double'
    interstateState?: string; // 'karnataka', 'andhra', etc.
    isNightDrive?: boolean; // For auto-adding night charge
    includedKm?: number;
    includedHours?: number;
    extraHourRate?: number;
}) => {
    const {
        startKm, endKm, ratePerKm, mode, vehicleId, days = 1,
        toll = 0, parking = 0, permit = 0, gstEnabled = false,
        waitingHours = 0, isHillStation = false, petCharge = false,
        nightBata = 0, hourlyRate = 0, durationHours = 0,
        extraItems = [], packagePrice = 0, nightStay = 0,
        includeGarageBuffer = false, manualBataMode = 'auto', interstateState = '', isNightDrive = false,
        includedKm = 0, includedHours = 0, extraHourRate = 0
    } = params;

    const vehicle = VEHICLES.find(v => v.id === vehicleId);
    if (!vehicle) {
        // Fallback or early return if no vehicle logic
        return { total: 0, gst: 0, fare: 0, distance: 0, effectiveDistance: 0, rateUsed: 0, distanceCharge: 0, driverBatta: 0, waitingCharges: 0, hillStationCharges: 0, petCharges: 0, taxableTotal: 0, exemptTotal: 0, mode, nightBata: 0, nightStay: 0, warningMessage: '' };
    }

    const rawDist = Math.max(0, endKm - startKm);
    let effectiveDist = rawDist;
    let calcMode = mode;

    // HILL STATION LOGIC: Always treated as Round Trip
    if (isHillStation) {
        if (mode === 'drop') {
            effectiveDist = rawDist * 2; // Convert One-Way to Round Trip Distance
        }
        calcMode = 'outstation'; // Enforce Round Trip Logic
    }

    // 1. GARAGE BUFFER LOGIC
    if (includeGarageBuffer && calcMode === 'outstation') {
        effectiveDist += 20;
    }

    // 2. HEAVY VEHICLE ROUND TRIP LOGIC (Tempo/Bus always billed Round Trip distance)
    // If it's a "drop" but using a Tempo/Bus, standard practice is often to charge round trip distance or standard round trip logic
    // But per BLS: "Heave Vehicle Rule: For Tempo/Bus, always calculate distance as Round Trip (Distance x 2), even for drops."
    // We will handle this in rate selection or distance calculation.

    // 3. DYNAMIC RATE SELECTION
    let activeRate = (ratePerKm && ratePerKm > 0) ? ratePerKm : (calcMode === 'outstation' ? vehicle.roundRate : vehicle.dropRate);

    // Override for Heavy Vehicles on Drop -> Treat as Round Trip logic usually
    // Or simply: Distance * 2 * RoundTripRate?
    // Let's stick to the text: "Calculated as Round Trip (Distance x 2)" implies we double the distance and use Round Trip Rate.
    // Old Heavy Logic Removed (Replaced by Package Price)

    let minKmDrop = 0;
    let distCharge = 0;
    let bBatta = 0;
    let effKmForCalc = effectiveDist;
    let warningMessage = '';

    // 4. THE LOGIC ENGINE
    if (calcMode === 'drop') {
        // Check if forced round trip (Heavy)
        // Check if forced round trip (Heavy) OR Minimum Package
        // Check if forced round trip (Heavy) OR Minimum Package
        if (vehicle.minLocalPackage) {
            if (rawDist <= 50) {
                // HEAVY VEHICLE: MINIMUM PACKAGE RULE (5 Hr / 50 KM)
                distCharge = vehicle.minLocalPackage;
                warningMessage = "Standard Minimum Charge (5 Hrs / 50 KM) applied for Heavy Vehicles.";
            } else {
                // HEAVY VEHICLE: LONG DISTANCE DROP (> 50 KM)
                // Calculated as Round Trip (Distance x 2) with Min 300 KM
                const minKm = vehicle.minKm; // 300
                effKmForCalc = Math.max(minKm, rawDist * 2);

                // Force Round Trip Rate if not provided?? 
                // Previous logic forced it.
                // But let's respect input rate if provided, else round rate.
                const appliedRate = (ratePerKm && ratePerKm > 0) ? ratePerKm : vehicle.roundRate;
                activeRate = appliedRate;

                distCharge = effKmForCalc * activeRate;
                warningMessage = "Heavy Vehicle Drop calculated as Round Trip (Distance x 2)";
            }
        } else {
            // CARS Logic
            const isLocal = rawDist <= 30; // 30KM Local threshold
            if (isLocal) {
                // LOCAL DROP LOGIC (Point-to-Point)
                // IF Distance <= Base_KM (10): Price = Base_Fare
                // ELSE: Price = Base_Fare + ((Distance - Base_KM) * Input_Rate)
                const BASE_KM = 10;
                const isLarge = vehicle.type === 'SUV' || vehicle.type === 'Van';
                const baseFee = isLarge ? 350 : 250;

                const extraKm = Math.max(0, rawDist - BASE_KM);

                distCharge = baseFee + (extraKm * activeRate);
                bBatta = 0;
                effKmForCalc = rawDist;
            } else {
                // OUTSTATION DROP
                minKmDrop = 130;
                effKmForCalc = Math.max(minKmDrop, effectiveDist);
                distCharge = effKmForCalc * activeRate;
                // Single Bata usually
            }
        }
    }
    else if (calcMode === 'outstation') {
        // ROUND TRIP
        const minByDays = vehicle.minKm * days;
        effKmForCalc = Math.max(minByDays, effectiveDist);
        distCharge = effKmForCalc * activeRate;
    }
    else if (calcMode === 'hourly') {
        // Corporate / Local Hourly Logic
        // Price = Package_Price
        // IF Actual_KM > Package_KM: Price += (Actual_KM - Package_KM) * Extra_KM_Rate
        // IF Actual_Hours > Package_Hours: Price += (Actual_Hours - Package_Hours) * Extra_Hour_Rate

        if (packagePrice && packagePrice > 0) {
            // 1. Base Package Price
            distCharge = packagePrice;

            // 2. Extra Hours
            // Use 'durationHours' as Actual Hours vs 'includedHours'
            const actualHours = durationHours || 0;
            const limitHours = includedHours || 8; // Default to 8 if not passed
            const excessHours = Math.max(0, actualHours - limitHours);

            if (excessHours > 0) {
                // Use passed extraHourRate, OR hourlyRate, OR fallback 250
                const eRate = extraHourRate || hourlyRate || 250;
                distCharge += (excessHours * eRate);
            }

            // 3. Extra KM
            const actualKm = effectiveDist; // This comes from startKm/endKm diff
            const limitKm = includedKm || 80; // Default to 80 if not passed
            const excessKm = Math.max(0, actualKm - limitKm);

            if (excessKm > 0 && activeRate > 0) {
                distCharge += (excessKm * activeRate);
            }

        } else {
            // Fallback for custom hourly without package price
            const hRate = hourlyRate || (vehicle.type === 'SUV' ? 450 : 350);
            distCharge = durationHours * hRate;
            let minCharge = 0;
            if (durationHours <= 5) minCharge = (vehicle.type === 'SUV' ? 2200 : 1800);
            else if (durationHours <= 10) minCharge = (vehicle.type === 'SUV' ? 4000 : 3200);
            distCharge = Math.max(distCharge, minCharge);
        }
    }
    else if (mode === 'fixed' || mode === 'package') {
        distCharge = packagePrice;
    }
    else if (mode === 'custom') {
        distCharge = extraItems.reduce((acc, i) => acc + i.amount, 0);
    }

    // 5. DRIVER BATTA LOGIC
    if (mode === 'outstation' || (mode === 'drop' && rawDist > 30)) {
        const baseBata = vehicle.batta;
        let bataCount = days; // Default 1 per day

        if (manualBataMode === 'single') {
            bataCount = 1 * days;
        } else if (manualBataMode === 'double') {
            bataCount = 2 * days;
        } else {
            // AUTO MODE
            // High Mileage Rule: > 400km/day avg implies long driving hours (2 shifts or double batta)
            // APPLIES MOSTLY TO ROUND TRIPS. For Drops, usually 1 Bata is charged as return is empty/included in rate.
            const avgKm = effKmForCalc / days;

            // Only apply High Mileage Double Batta for Round Trips (Outstation)
            if (mode === 'outstation' && avgKm > 400) {
                bataCount = 2 * days;
            }
        }
        bBatta = baseBata * bataCount;
    }

    // 6. ADDITIVES (Taxable)
    let extraSum = nightStay;

    // Night Drive Charge
    let finalNightBata = nightBata;
    if (isNightDrive && nightBata === 0) {
        finalNightBata = vehicle.nightCharge;
    }
    extraSum += finalNightBata;

    if (waitingHours > 0) {
        // ₹100/hr (Sedan) to ₹300/hr (Bus)
        const waitRate = vehicle.seats > 7 ? 300 : 100;
        extraSum += (waitingHours * waitRate);
    }

    if (isHillStation) {
        // Car: 300-500, Bus: 1000-3000
        const hillRate = vehicle.seats > 7 ? 1500 : (vehicle.type === 'SUV' ? 500 : 300);
        extraSum += hillRate;
    }

    if (petCharge) extraSum += 500;

    // 7. PERMIT CHARGES
    let autoPermit = 0;
    if (interstateState) {
        const stateKey = interstateState.toLowerCase();
        if (PERMIT_CHARGES[stateKey]) {
            // Match vehicle type to key
            let typeKey = vehicle.type;
            if (vehicle.id === 'tempo') typeKey = 'Van'; // Map specific IDs if needed
            if (vehicle.id === 'minibus' || vehicle.id === 'bus') typeKey = 'Van'; // Simplified mapping for now, or expand PERMIT object

            // Adjust mapping for Permit Object
            const pCharges = PERMIT_CHARGES[stateKey];
            // Safe fallback
            autoPermit = pCharges[typeKey] || pCharges['Van'] || 2000;
        }
    }

    const totalPermit = permit + autoPermit;

    // 8. FINAL SUMMATION
    const taxable = distCharge + bBatta + extraSum;
    const gst = gstEnabled ? (taxable * 0.05) : 0;
    const exempt = toll + parking + totalPermit;

    return {
        total: Math.round(taxable + gst + exempt),
        gst: Math.round(gst),
        fare: Math.round(taxable + exempt),
        distance: rawDist,
        effectiveDistance: effKmForCalc,
        rateUsed: activeRate,
        distanceCharge: Math.round(distCharge),
        driverBatta: bBatta,
        waitingCharges: (waitingHours * (vehicle.seats > 7 ? 300 : 100)),
        hillStationCharges: isHillStation ? (vehicle.seats > 7 ? 1500 : (vehicle.type === 'SUV' ? 500 : 300)) : 0,
        petCharges: petCharge ? 500 : 0,
        taxableTotal: taxable,
        exemptTotal: exempt,
        mode,
        nightBata: finalNightBata,
        nightStay,
        warningMessage
    };
};
