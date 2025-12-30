export type FareMode = 'distance' | 'hourly' | 'outstation' | 'drop' | 'package' | 'fixed' | 'custom';

export interface VehicleType {
    id: string;
    name: string;
    popularModels: string;
    dropRate: number;
    roundRate: number;
    seats: number;
    type: 'Hatchback' | 'Sedan' | 'SUV' | 'Van';
    minKm: number;
    batta: number;
}

export const VEHICLES: VehicleType[] = [
    { id: 'hatchback', name: 'Hatchback', popularModels: 'Indica, WagonR, Celerio', dropRate: 12, roundRate: 11, seats: 4, type: 'Hatchback', minKm: 250, batta: 400 },
    { id: 'sedan', name: 'Sedan', popularModels: 'Etios, Swift Dzire, Aura, Xcent', dropRate: 14, roundRate: 12, seats: 4, type: 'Sedan', minKm: 250, batta: 500 },
    { id: 'suv', name: 'SUV / MUV', popularModels: 'Ertiga, Tavera, Xylo, Marazzo', dropRate: 18, roundRate: 16, seats: 7, type: 'SUV', minKm: 250, batta: 600 },
    { id: 'innova', name: 'Innova (Old)', popularModels: 'Toyota Innova (G/V models)', dropRate: 19, roundRate: 16, seats: 7, type: 'SUV', minKm: 250, batta: 600 },
    { id: 'premium_suv', name: 'Premium SUV', popularModels: 'Innova Crysta', dropRate: 22, roundRate: 18, seats: 7, type: 'SUV', minKm: 250, batta: 600 },
    { id: 'tempo_12', name: 'Tempo (12s)', popularModels: 'Force Traveller (12 Seater)', dropRate: 28, roundRate: 28, seats: 12, type: 'Van', minKm: 300, batta: 800 },
    { id: 'tempo_18', name: 'Tempo (18s)', popularModels: 'Force Traveller (18 Seater)', dropRate: 32, roundRate: 32, seats: 18, type: 'Van', minKm: 300, batta: 900 }
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
        nightBata?: number; // Manual extra Batta
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
        extraItems?: { description: string; amount: number }[];
    }
) => {
    const {
        startKm, endKm, baseFare, ratePerKm, toll, parking,
        gstEnabled, mode, vehicleId, hourlyRate = 0, durationHours = 0, nightBata = 0,
        waitingHours = 0, isHillStation = false, petCharge = false,
        packagePrice = 0, actualHours = 0, baseKmLimit = 0, baseHourLimit = 0,
        extraKmRate = 0, extraHourRate = 0, days = 1, extraItems = []
    } = params;

    const distance = Math.max(0, endKm - startKm);
    let taxableFare = 0;
    const waitingChargeRate = 150;

    const vehicle = VEHICLES.find(v => v.id === vehicleId);
    const activeRate = ratePerKm > 0 ? ratePerKm : (vehicle ? (mode === 'outstation' ? vehicle.roundRate : vehicle.dropRate) : 13);

    // Batta Rules based on industry standards
    let driverBatta = (vehicle ? vehicle.batta : 500);

    if (mode === 'drop') {
        // Drop Trip Batta: 400 (<400km), 600 (>400km)
        driverBatta = distance > 400 ? 600 : 400;
        if (vehicle?.type === 'Van') driverBatta = 800; // Tempo fix
    } else if (mode === 'outstation') {
        // Round Trip Batta: 500 (<500km/day), 600 (>500km/day)
        const kmPerDay = distance / (days || 1);
        if (vehicle?.type === 'Van') {
            driverBatta = kmPerDay > 800 ? 900 : 800;
        } else {
            driverBatta = kmPerDay > 500 ? 600 : 500;
        }
    }

    const activeMinKm = mode === 'outstation' ? 300 : 100;

    if (mode === 'drop') {
        if (distance <= 30) {
            // CHENNAI ASSOCIATION LOCAL RATE (Standard 2025)
            const baseLocalFare = (vehicle?.type === 'SUV' || vehicle?.type === 'Van') ? 350 : 250;
            const extraKm = Math.max(0, distance - 10);
            const extraKmRateLocal = (vehicle?.type === 'SUV' || vehicle?.type === 'Van') ? 35 : 25;
            taxableFare = baseLocalFare + (extraKm * extraKmRateLocal) + nightBata;
            driverBatta = 0;
        } else {
            // CHENNAI ASSOCIATION DROP RATE (Outstation One-Way)
            const activeMinKmDrop = 130;
            const associationRate = (vehicle?.type === 'SUV' || vehicle?.type === 'Van') ? 19 : 14;
            const associationBatta = (vehicle?.type === 'SUV' || vehicle?.type === 'Van') ? 600 : 500;

            const effectiveDistance = Math.max(activeMinKmDrop, distance);
            taxableFare = (effectiveDistance * associationRate) + associationBatta + nightBata;
            driverBatta = associationBatta;
        }
    } else if (mode === 'outstation') {
        const minKmForTotalDays = activeMinKm * days;

        // SMART FIX: If single day and short distance (< 150km), charge actuals instead of mandatory Min 250km
        // This prevents 12 km trips costing ₹3500
        let effectiveDistance = Math.max(minKmForTotalDays, distance);
        if (days === 1 && distance < 150) {
            effectiveDistance = distance;
        }

        // Use the driverBatta calculated above (Line 123-137) which handles the distance/vehicle logic
        taxableFare = (effectiveDistance * activeRate) + ((driverBatta + nightBata) * days);
        // driverBatta is already set correctly

    } else if (mode === 'hourly') {
        // CHENNAI ASSOCIATION FIXED RENTAL PACKAGES
        if (durationHours <= 5) {
            taxableFare = (vehicle?.type === 'SUV' || vehicle?.type === 'Van') ? 1900 : 1500;
        } else if (durationHours <= 10) {
            taxableFare = (vehicle?.type === 'SUV' || vehicle?.type === 'Van') ? 3600 : 2800;
        } else {
            taxableFare = (durationHours * (hourlyRate || 0)) + nightBata;
        }

        // Add extra KM if any (simple logic for now)
    } else if (mode === 'package') {
        const extraKms = Math.max(0, distance - (baseKmLimit || 0));
        const extraHr = Math.max(0, (actualHours || 0) - (baseHourLimit || 0));
        taxableFare = (packagePrice || 0) + (extraKms * (extraKmRate || 0)) + (extraHr * (extraHourRate || 0)) + nightBata;
    } else if (mode === 'fixed') {
        taxableFare = packagePrice || 0;
    } else if (mode === 'custom') {
        // Custom invoice: Sum of base fare + all items
        const customTotal = extraItems ? extraItems.reduce((acc, item) => acc + item.amount, 0) : 0;
        taxableFare = (baseFare || 0) + customTotal + nightBata;
        // Skip distance calculation
    } else {
        taxableFare = (baseFare || 0) + (distance * (ratePerKm || 0)) + nightBata;
    }

    if (mode !== 'hourly' && mode !== 'fixed' && mode !== 'package') {
        taxableFare += (waitingHours * waitingChargeRate);
    }

    // Hill station: 300 for Sedan/Hatch, 500 for SUV/Van
    if (isHillStation) {
        taxableFare += (vehicle?.type === 'SUV' || vehicle?.type === 'Van') ? 500 : 300;
    }

    if (petCharge) {
        taxableFare += 400;
    }

    const gstValue = gstEnabled ? taxableFare * 0.05 : 0;
    const exemptFare = (toll || 0) + (parking || 0);
    const total = taxableFare + gstValue + exemptFare;

    return {
        total: total,
        gst: gstValue,
        fare: taxableFare + exemptFare,
        distance: distance,
        waitingCharges: waitingHours * waitingChargeRate,
        hillStationCharges: isHillStation ? ((vehicle?.type === 'SUV' || vehicle?.type === 'Van') ? 500 : 300) : 0,
        petCharges: petCharge ? 400 : 0,
        extraKmCharges: mode === 'package' ? Math.max(0, distance - (baseKmLimit || 0)) * (extraKmRate || 0) : 0,
        extraHrCharges: mode === 'package' ? Math.max(0, (actualHours || 0) - (baseHourLimit || 0)) * (extraHourRate || 0) : 0,
        driverBatta: driverBatta
    };
};
