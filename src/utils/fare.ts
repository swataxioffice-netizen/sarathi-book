export type FareMode = 'distance' | 'hourly' | 'outstation' | 'drop' | 'package' | 'fixed';

export interface VehicleType {
    id: string;
    name: string;
    dropRate: number;
    roundRate: number;
    seats: number;
    type: 'Sedan' | 'SUV' | 'Van';
    minKm: number;
    batta: number;
}

export const VEHICLES: VehicleType[] = [
    { id: 'swift', name: 'Sedan (Swift/Etios)', dropRate: 14, roundRate: 13, seats: 4, type: 'Sedan', minKm: 250, batta: 400 },
    { id: 'innova', name: 'SUV (Innova)', dropRate: 19, roundRate: 18, seats: 7, type: 'SUV', minKm: 300, batta: 500 },
    { id: 'crysta', name: 'Innova Crysta', dropRate: 22, roundRate: 20, seats: 7, type: 'SUV', minKm: 300, batta: 600 },
    { id: 'tempo', name: 'Tempo Traveller', dropRate: 28, roundRate: 28, seats: 12, type: 'Van', minKm: 300, batta: 600 }
];

export interface Trip {
    id: string;
    customerName: string;
    customerGst?: string;
    vehicleId?: string;
    passengers?: number;
    startKm: number;
    endKm: number;
    startTime: string;
    endTime: string;
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
    from?: string;
    to?: string;
    billingAddress?: string;
    notes?: string;
    waitingCharges?: number;
    waitingHours?: number;
    hillStationCharges?: number;
    petCharges?: number;
    packageName?: string;
    numberOfPersons?: number;
    packagePrice?: number;
}

export interface Expense {
    id: string;
    category: 'fuel' | 'maintenance' | 'food' | 'other';
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
 * Advanced Fare Calculation based on Tamil Nadu Industry Standards (DropTaxi logic)
 */
export const calculateFare = (
    params: {
        startKm: number;
        endKm: number;
        baseFare: number;
        ratePerKm: number;
        toll: number;
        parking: number;
        gstEnabled: boolean;
        mode: FareMode;
        vehicleId?: string;
        hourlyRate?: number;
        durationHours?: number;
        nightBata?: number; // Driver Batta
        waitingHours?: number;
        isHillStation?: boolean;
        petCharge?: boolean;
        packagePrice?: number;
        actualHours?: number;
        baseKmLimit?: number;
        baseHourLimit?: number;
        extraKmRate?: number;
        extraHourRate?: number;
        days?: number;
    }
) => {
    const {
        startKm, endKm, baseFare, ratePerKm, toll, parking,
        gstEnabled, mode, vehicleId, hourlyRate = 0, durationHours = 0, nightBata = 0,
        waitingHours = 0, isHillStation = false, petCharge = false,
        packagePrice = 0, actualHours = 0, baseKmLimit = 0, baseHourLimit = 0,
        extraKmRate = 0, extraHourRate = 0, days = 1
    } = params;

    const distance = Math.max(0, endKm - startKm);
    let taxableFare = 0;
    const waitingChargeRate = 150; // Standard TN industry rate

    // Use vehicle-specific rates if available
    const vehicle = VEHICLES.find(v => v.id === vehicleId);
    const activeRate = vehicle ? (mode === 'outstation' ? vehicle.roundRate : vehicle.dropRate) : ratePerKm;
    const activeBatta = vehicle ? vehicle.batta : (nightBata || 400);
    const activeMinKm = vehicle ? vehicle.minKm : (mode === 'outstation' ? 250 : 100);

    // TN Drop/Outstation Logic
    if (mode === 'drop') {
        const effectiveDistance = Math.max(100, distance);
        taxableFare = effectiveDistance * activeRate;
        taxableFare += activeBatta;

    } else if (mode === 'outstation') {
        const minKmForTotalDays = activeMinKm * days;
        const effectiveDistance = Math.max(minKmForTotalDays, distance);
        taxableFare = effectiveDistance * activeRate;
        taxableFare += (activeBatta * days);

    } else if (mode === 'package') {
        const extraKms = Math.max(0, distance - (baseKmLimit || 0));
        const extraHr = Math.max(0, (actualHours || 0) - (baseHourLimit || 0));

        taxableFare = packagePrice;
        taxableFare += extraKms * (extraKmRate || 0);
        taxableFare += extraHr * (extraHourRate || 0);
        taxableFare += nightBata;
    } else if (mode === 'fixed') {
        taxableFare = packagePrice; // Reuse manual price field
    } else if (mode === 'hourly') {
        taxableFare = baseFare + (durationHours * hourlyRate);
        taxableFare += nightBata;
    } else {
        // Standard distance (local)
        taxableFare = baseFare + (distance * ratePerKm);
        taxableFare += nightBata;
    }

    // Apply waiting charges to ALL taxable distance modes
    if (mode !== 'hourly') {
        taxableFare += (waitingHours * waitingChargeRate);
    }

    // Hill station charges (Rs. 300 for Sedan, we use 300 as default)
    if (isHillStation) {
        taxableFare += 300;
    }

    // Pet charges (Rs. 400 for Sedan)
    if (petCharge) {
        taxableFare += 400;
    }

    const gstValue = gstEnabled ? taxableFare * 0.05 : 0;
    const exemptFare = toll + parking;
    const total = taxableFare + gstValue + exemptFare;

    return {
        total: total,
        gst: gstValue,
        fare: taxableFare + exemptFare,
        distance: distance,
        waitingCharges: waitingHours * waitingChargeRate,
        hillStationCharges: isHillStation ? 300 : 0,
        petCharges: petCharge ? 400 : 0,
        extraKmCharges: mode === 'package' ? Math.max(0, distance - (baseKmLimit || 0)) * (extraKmRate || 0) : 0,
        extraHrCharges: mode === 'package' ? Math.max(0, (actualHours || 0) - (baseHourLimit || 0)) * (extraHourRate || 0) : 0
    };
};
