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
            mode: serviceType
        };
    }

    let totalFare = 0;
    let breakdown: string[] = [];
    let effectiveKm = distance;
    let rateUsed = 0;

    // ============================================================
    // SCENARIO 1: LOCAL HOURLY (Rentals)
    // ============================================================
    if (serviceType === 'local_hourly') {
        // Base Package
        const pkgPrice = vehicle.local_8hr_pkg;
        totalFare = pkgPrice;
        breakdown.push(`Base Package (8 Hr / 80 Km): ₹${pkgPrice}`);

        // Extra KM
        // Note: For hourly, 'distance' IS the actual usage.
        if (distance > 80) {
            const extraKm = distance - 80;
            const eRate = overrideRate || vehicle.one_way_rate; // Fallback to one way rate for extra km
            const extraKmCost = extraKm * eRate;
            totalFare += extraKmCost;
            breakdown.push(`Extra Distance: ${extraKm} km x ₹${eRate} = ₹${extraKmCost}`);
        }

        // Extra Hours
        if (extraHours > 0) {
            const extraHrCost = extraHours * vehicle.extra_hr_rate;
            totalFare += extraHrCost;
            breakdown.push(`Extra Time: ${extraHours} hrs x ₹${vehicle.extra_hr_rate} = ₹${extraHrCost}`);
        }
    }

    // ============================================================
    // SCENARIO 2: ROUND TRIP (Outstation)
    // ============================================================
    else if (serviceType === 'round_trip') {
        const minKm = vehicle.min_km_per_day;
        const minBillable = minKm * durationDays;

        effectiveKm = Math.max(distance, minBillable);
        rateUsed = overrideRate || vehicle.round_trip_rate;

        const distCost = effectiveKm * rateUsed;

        let bataCost = 0;
        if (overrideBata !== undefined) {
            bataCost = overrideBata;
            breakdown.push(`Driver Bata (Manual): ₹${bataCost}`);
        } else {
            bataCost = vehicle.driver_bata * durationDays;
            breakdown.push(`Driver Bata: ₹${vehicle.driver_bata} x ${durationDays} days = ₹${bataCost}`);
        }

        totalFare = distCost + bataCost;

        breakdown.push(`Min KM Rule: ${minKm} km/day x ${durationDays} days = ${minBillable} km`);
        breakdown.push(`Billable Distance: ${effectiveKm} km (Actual: ${distance} km)`);
        breakdown.push(`Distance Charge: ${effectiveKm} km x ₹${rateUsed} = ₹${distCost}`);

        if (overrideHillStation !== undefined && overrideHillStation > 0) {
            totalFare += overrideHillStation;
            breakdown.push(`Hill Station Charge: ₹${overrideHillStation}`);
        } else if (isHillStation) {
            const hillCharge = (vehicleType === 'tempo' || vehicleType === 'minibus' || vehicleType === 'bus') ? 1000 : 500;
            totalFare += hillCharge;
            breakdown.push(`Hill Station Charge: ₹${hillCharge}`);
        }
    }

    // ============================================================
    // SCENARIO 3: ONE WAY (Drops)
    // ============================================================
    else {
        // Heavy Vehicle Rule: Always calculated as Round Trip
        if (vehicle.is_heavy_vehicle) {
            const roundDist = distance * 2;
            const minHeavy = vehicle.min_km_per_day; // e.g. 300
            effectiveKm = Math.max(roundDist, minHeavy);

            rateUsed = overrideRate || vehicle.round_trip_rate; // Use Round Trip Rate!

            const distCost = effectiveKm * rateUsed;

            let bata = 0;
            if (overrideBata !== undefined) {
                bata = overrideBata;
                breakdown.push(`Driver Bata (Manual): ₹${bata}`);
            } else {
                bata = vehicle.driver_bata;
                breakdown.push(`Driver Bata: ₹${bata}`);
            }

            totalFare = distCost + bata;

            breakdown.push(`Heavy Vehicle Rule: One-Way charged as Round Trip`);
            breakdown.push(`Billable Distance: ${effectiveKm} km (Actual x 2 vs Min ${minHeavy})`);
            breakdown.push(`Distance Charge: ${effectiveKm} km x ₹${rateUsed} = ₹${distCost}`);
        }
        // Local Short Drop Rule (< 40km)
        else if (distance <= 40) {
            const baseKm = 10;
            const basePrice = (vehicleType === 'hatchback' || vehicleType === 'sedan') ? 250 : 400; // Base Fare

            if (distance <= baseKm) {
                totalFare = basePrice;
                breakdown.push(`Local Minimum Fare (upto 10km): ₹${basePrice}`);
            } else {
                const extraKm = distance - baseKm;
                rateUsed = overrideRate || vehicle.one_way_rate;
                const extraCost = extraKm * rateUsed;
                totalFare = basePrice + extraCost;
                breakdown.push(`Base Fare (10km): ₹${basePrice}`);
                breakdown.push(`Extra Distance: ${extraKm} km x ₹${rateUsed} = ₹${extraCost}`);
            }
        }
        // Outstation Drop
        else {
            const minDrop = vehicle.min_drop_km || 130;
            effectiveKm = Math.max(distance, minDrop);
            rateUsed = overrideRate || vehicle.one_way_rate;

            const distCost = effectiveKm * rateUsed;

            let bata = 0;
            if (overrideBata !== undefined) {
                bata = overrideBata;
                breakdown.push(`Driver Bata (Manual): ₹${bata}`);
            } else {
                bata = vehicle.driver_bata;
                breakdown.push(`Driver Bata: ₹${bata}`);
            }

            totalFare = distCost + bata;

            if (effectiveKm > distance) {
                breakdown.push(`Minimum Drop Distance Applied: ${minDrop} km`);
            }
            breakdown.push(`Distance Charge: ${effectiveKm} km x ₹${rateUsed} = ₹${distCost}`);
        }
    }

    // Final Additions for Pet / Night if passed
    if (petCharge && petCharge > 0) {
        totalFare += petCharge;
        breakdown.push(`Pet Charge: ₹${petCharge}`);
    }

    if (nightCharge && nightCharge > 0) {
        totalFare += nightCharge;
        breakdown.push(`Night Charge: ₹${nightCharge}`);
    }

    return {
        totalFare: Math.round(totalFare),
        breakdown,
        effectiveDistance: effectiveKm,
        rateUsed,
        distance: distance,
        mode: serviceType
    };
};
