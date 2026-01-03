import { TARIFFS } from '../config/tariff_config';

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
    nightCharge?: number
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
    let breakdown: string[] = [];
    let effectiveKm = distance;
    let rateUsed = 0;
    let distanceCharge = 0;
    let calculatedBata = 0;

    // ============================================================
    // SCENARIO 1: LOCAL HOURLY (Rentals)
    // ============================================================
    if (serviceType === 'local_hourly') {
        const pkgPrice = vehicle.local_8hr_pkg;
        distanceCharge = pkgPrice;
        breakdown.push(`Base Package (8 Hr / 80 Km): ₹${pkgPrice}`);

        if (distance > 80) {
            const extraKm = distance - 80;
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
        const minBillable = minKm * durationDays;

        effectiveKm = Math.max(distance, minBillable);
        rateUsed = overrideRate || vehicle.round_trip_rate;

        distanceCharge = effectiveKm * rateUsed;

        breakdown.push(`Trip Charge (${effectiveKm} km x ₹${rateUsed}): ₹${distanceCharge.toLocaleString()}`);

        if (overrideBata !== undefined) {
            calculatedBata = overrideBata;
            breakdown.push(`Driver Bata (Manual): ₹${calculatedBata.toLocaleString()}`);
        } else {
            calculatedBata = vehicle.driver_bata * durationDays;
            breakdown.push(`Driver Bata (₹${vehicle.driver_bata} x ${durationDays} days): ₹${calculatedBata.toLocaleString()}`);
        }

        totalFare = distanceCharge + calculatedBata;

        if (effectiveKm > distance) {
            breakdown.push(`Note: Min ${minKm} km/day applied for ${durationDays} days`);
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
                breakdown.push(`Driver Bata (₹${vehicle.driver_bata} x ${estDays} days): ₹${calculatedBata.toLocaleString()}`);
            }

            totalFare = distanceCharge + calculatedBata;

            breakdown.push(`Note: One-Way is charged as Round-Trip for this vehicle`);
        }
        // Local Short Drop Rule (< 40km)
        else if (distance <= 40) {
            const baseKm = 10;
            const basePrice = (vehicleType === 'hatchback' || vehicleType === 'sedan') ? 250 : 400;

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
                calculatedBata = vehicle.driver_bata;
                breakdown.push(`Driver Bata: ₹${calculatedBata.toLocaleString()}`);
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

    return {
        totalFare: Math.round(totalFare),
        breakdown,
        effectiveDistance: effectiveKm,
        rateUsed,
        distance: distance,
        mode: serviceType,
        details: {
            fare: Math.round(distanceCharge),
            driverBatta: Math.round(calculatedBata),
            hillStation: Math.round(hillStationAmt),
            petCharge: Math.round(petAmt),
            nightCharge: Math.round(nightAmt)
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
