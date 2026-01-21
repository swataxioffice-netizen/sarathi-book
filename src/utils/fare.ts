import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';

// Keep types for compatibility
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
    gstRate?: number; // 5 or 12
    gstType?: 'IGST' | 'CGST_SGST';
    fare?: number; // Subtotal before GST (Taxable Amount)
    distanceCharge?: number; // Base trip charge (distance/pkg)
    distance?: number; // Actual KM travelled
    effectiveDistance?: number; // KM charged (Distance or Min KM)
    waitingCharges?: number;
    waitingHours?: number;
    hillStationCharges?: number;
    petCharges?: number;
    extraItems?: { description: string, amount: number, qty?: number, rate?: number, sac?: string }[];
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
    rcmEnabled?: boolean;
    terms?: string[];
    vehicleNumber?: string; // Snapshot
    vehicleModel?: string;  // Snapshot
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

export const calculateFare = (
    serviceType: string, // 'one_way', 'round_trip', 'local_hourly'
    vehicleType: string, // 'hatchback', 'sedan', 'suv', 'tempo'
    distance: number,
    durationDays: number = 1,
    extraHours: number = 0, // For Local Hourly
    isHillStation: boolean = false,
    overrideRate?: number, // NEW: Allows UI to dictate the rate per km
    overrideBata?: number, // NEW: Allows UI to dictate total driver bata
    overrideHillStation?: number,
    petCharge?: number,
    nightCharge?: number,
    hourlyPackage?: string // NEW: '4hr_40km', '8hr_80km', '12hr_120km'
) => {

    const vehicle = TARIFFS.vehicles[vehicleType as keyof typeof TARIFFS.vehicles];

    // Safety Fallback
    if (!vehicle) {
        return {
            totalFare: 0,
            breakdown: ["Error: Invalid Vehicle Type"],
            distance: distance,
            mode: serviceType,
            details: {
                fare: 0,
                driverBatta: 0,
                hillStation: 0,
                petCharge: 0,
                nightCharge: 0
            }
        };
    }

    let totalFare = 0;
    const breakdown: string[] = [];
    let effectiveKm = distance;
    let rateUsed = 0;
    let distanceCharge = 0;
    let calculatedBata = 0;

    // ============================================================
    // SCENARIO 1: LOCAL HOURLY (Rentals)
    // ============================================================
    if (serviceType === 'local_hourly') {
        let pkgPrice = vehicle.local_8hr_pkg;
        let baseKm = 80;
        let pkgName = "8 Hr / 80 Km";

        if (hourlyPackage === '4hr_40km') {
            pkgPrice = vehicle.local_4hr_pkg;
            baseKm = 40;
            pkgName = "4 Hr / 40 Km";
        } else if (hourlyPackage === '12hr_120km') {
            pkgPrice = vehicle.local_12hr_pkg;
            baseKm = 120;
            pkgName = "12 Hr / 120 Km";
        } else if (hourlyPackage === '2hr_20km') {
            pkgPrice = vehicle.local_2hr_pkg;
            baseKm = 20;
            pkgName = "2 Hr / 20 Km";
        }

        distanceCharge = pkgPrice;
        breakdown.push(`Base Package (${pkgName}): ₹${pkgPrice}`);

        if (distance > baseKm) {
            const extraKm = distance - baseKm;
            const eRate = overrideRate || vehicle.one_way_rate;
            const extraKmCost = extraKm * eRate;
            distanceCharge += extraKmCost;
            breakdown.push(`Extra Distance (${extraKm} km x ₹${eRate}): ₹${extraKmCost.toLocaleString()}`);
        }

        if (extraHours > 0) {
            const extraHrCost = extraHours * vehicle.extra_hr_rate;
            distanceCharge += extraHrCost;
            breakdown.push(`Extra Time (${extraHours} hrs x ₹${vehicle.extra_hr_rate}): ₹${extraHrCost.toLocaleString()}`);
        }
        totalFare = distanceCharge;
    }

    // ============================================================
    // SCENARIO 2: ROUND TRIP (Outstation)
    // ============================================================
    else if (serviceType === 'round_trip') {
        const minKm = vehicle.min_km_per_day;
        // Apply maximum trip distance per day limit to determine actual billable days
        const estDays = Math.max(durationDays, Math.ceil(distance / TRIP_LIMITS.max_km_per_day));
        const minBillable = minKm * estDays;

        effectiveKm = Math.max(distance, minBillable);
        rateUsed = overrideRate || vehicle.round_trip_rate;

        distanceCharge = effectiveKm * rateUsed;

        breakdown.push(`Trip Charge (${effectiveKm} km x ₹${rateUsed}): ₹${distanceCharge.toLocaleString()}`);

        if (overrideBata !== undefined) {
            calculatedBata = overrideBata;
            breakdown.push(`Driver Bata (Manual): ₹${calculatedBata.toLocaleString()}`);
        } else {
            calculatedBata = vehicle.driver_bata * estDays;
            breakdown.push(`Driver Bata [${estDays} Day${estDays > 1 ? 's' : ''} * ${vehicle.driver_bata}/Day]: ₹${calculatedBata.toLocaleString()}`);
        }

        totalFare = distanceCharge + calculatedBata;

        if (effectiveKm > distance) {
            breakdown.push(`Note: Min ${minKm} km/day applied for ${estDays} days`);
        }
    }

    // ============================================================
    // SCENARIO 3: ONE WAY (Drops)
    // ============================================================
    else {
        // Heavy Vehicle Rule: Always calculated as Round Trip
        if (vehicle.is_heavy_vehicle) {
            const roundDist = distance * 2;
            const minKmDay = vehicle.min_km_per_day;

            const estDays = Math.max(durationDays, Math.ceil(roundDist / minKmDay));
            const minBillable = minKmDay * estDays;

            effectiveKm = Math.max(roundDist, minBillable);
            rateUsed = overrideRate || vehicle.round_trip_rate;

            distanceCharge = effectiveKm * rateUsed;

            breakdown.push(`Trip Charge (${effectiveKm} km x ₹${rateUsed}): ₹${distanceCharge.toLocaleString()}`);

            if (overrideBata !== undefined) {
                calculatedBata = overrideBata;
                breakdown.push(`Driver Bata (Manual): ₹${calculatedBata.toLocaleString()}`);
            } else {
                calculatedBata = vehicle.driver_bata * estDays;
                breakdown.push(`Driver Bata [${estDays} Day${estDays > 1 ? 's' : ''} * ${vehicle.driver_bata}/Day]: ₹${calculatedBata.toLocaleString()}`);
            }

            totalFare = distanceCharge + calculatedBata;

            breakdown.push(`Note: One-Way is charged as Round-Trip for this vehicle`);
        }
        // Local Short Drop Rule (< 40km)
        else if (distance <= 40) {
            const baseKm = 10;
            let basePrice = 300; // Default (Sedan)
            if (vehicleType === 'hatchback') basePrice = 250;
            if (vehicleType === 'suv') basePrice = 500;
            if (vehicleType === 'premium_suv') basePrice = 700;

            if (distance <= baseKm) {
                distanceCharge = basePrice;
                breakdown.push(`Local Minimum Fare (upto 10km): ₹${basePrice}`);
            } else {
                const extraKm = distance - baseKm;
                rateUsed = overrideRate || vehicle.one_way_rate;
                const extraCost = extraKm * rateUsed;
                distanceCharge = basePrice + extraCost;
                breakdown.push(`Base Fare (10km): ₹${basePrice}`);
                breakdown.push(`Extra Distance: ${extraKm} km x ₹${rateUsed} = ₹${extraCost}`);
            }
            totalFare = distanceCharge;
        }
        // Outstation Drop
        else {
            const minDrop = vehicle.min_drop_km || 130;
            effectiveKm = Math.max(distance, minDrop);
            rateUsed = overrideRate || vehicle.one_way_rate;

            distanceCharge = effectiveKm * rateUsed;

            breakdown.push(`Trip Charge (${effectiveKm} km x ₹${rateUsed}): ₹${distanceCharge.toLocaleString()}`);

            if (overrideBata !== undefined) {
                calculatedBata = overrideBata;
                breakdown.push(`Driver Bata (Manual): ₹${calculatedBata.toLocaleString()}`);
            } else {
                // Calculate estimated days for drop trip based on safe driving limits
                const estDays = Math.max(1, Math.ceil(distance / TRIP_LIMITS.max_km_per_day));
                calculatedBata = vehicle.driver_bata * estDays;

                breakdown.push(`Driver Bata [${estDays} Day${estDays > 1 ? 's' : ''} * ${vehicle.driver_bata}/Day]: ₹${calculatedBata.toLocaleString()}`);
            }

            totalFare = distanceCharge + calculatedBata;

            if (effectiveKm > distance) {
                breakdown.push(`Note: Minimum ${minDrop} km applies for drop trips`);
            }
        }
    }

    // ============================================================
    // FINAL ADDITIONS (Applied to all scenarios)
    // ============================================================

    // Hill Station Logic
    let hillStationAmt = 0;
    if (overrideHillStation !== undefined && overrideHillStation > 0) {
        hillStationAmt = overrideHillStation;
    } else if (isHillStation) {
        hillStationAmt = (vehicleType === 'tempo' || vehicleType === 'minibus' || vehicleType === 'bus') ? 1000 : 500;
    }

    if (hillStationAmt > 0) {
        totalFare += hillStationAmt;
        breakdown.push(`Hill Station Charge: ₹${hillStationAmt}`);
    }

    // Pet Charge
    const petAmt = petCharge || 0;
    if (petAmt > 0) {
        totalFare += petAmt;
        breakdown.push(`Pet Charge: ₹${petAmt}`);
    }

    // Night Charge
    const nightAmt = nightCharge || 0;
    if (nightAmt > 0) {
        totalFare += nightAmt;
        breakdown.push(`Night Charge: ₹${nightAmt}`);
    }

    const roundedFare = Math.round(distanceCharge);
    const roundedBatta = Math.round(calculatedBata);
    const roundedHill = Math.round(hillStationAmt);
    const roundedPet = Math.round(petAmt);
    const roundedNight = Math.round(nightAmt);

    return {
        totalFare: roundedFare + roundedBatta + roundedHill + roundedPet + roundedNight,
        breakdown,
        effectiveDistance: effectiveKm,
        rateUsed,
        distance: distance,
        mode: serviceType,
        details: {
            fare: roundedFare,
            driverBatta: roundedBatta,
            hillStation: roundedHill,
            petCharge: roundedPet,
            nightCharge: roundedNight
        }
    };
};

/**
 * Fallback heuristic to estimate tolls in India based on distance and vehicle type.
 * NHAI rates are roughly ₹100-150 per 60km (i.e. ~₹2/km) for cars.
 */
export const estimateTolls = (distanceKm: number, vehicleType: string): number => {
    if (distanceKm < 50) return 0; // Likely no major tolls for short city trips

    // Base rates per KM (Association market estimates)
    let rate = 1.8; // Hatchback/Sedan
    if (vehicleType === 'suv' || vehicleType === 'premium_suv') rate = 2.4;
    if (vehicleType === 'tempo') rate = 3.8;
    if (vehicleType === 'minibus' || vehicleType === 'bus') rate = 7.5;

    return Math.round(distanceKm * rate);
};
