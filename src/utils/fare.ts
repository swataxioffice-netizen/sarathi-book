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

export interface Trip {
    id: string;
    customerName: string;
    customerPhone?: string;
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

export const VEHICLES: VehicleType[] = [
    { id: 'hatchback', name: 'Hatchback', popularModels: 'Indica, Swift', dropRate: 14, roundRate: 12, seats: 4, type: 'Hatchback', minKm: 250, batta: 400 },
    { id: 'sedan', name: 'Sedan', popularModels: 'Dzire, Etios, Aura', dropRate: 15, roundRate: 13, seats: 4, type: 'Sedan', minKm: 250, batta: 500 },
    { id: 'suv', name: 'SUV (7-Seater)', popularModels: 'Ertiga, Xylo', dropRate: 20, roundRate: 17, seats: 7, type: 'SUV', minKm: 250, batta: 600 },
    { id: 'premium_suv', name: 'Premium SUV', popularModels: 'Innova Crysta', dropRate: 26, roundRate: 20, seats: 7, type: 'SUV', minKm: 250, batta: 700 },
    { id: 'tempo', name: 'Tempo Traveller', popularModels: 'Force Traveller', dropRate: 35, roundRate: 28, seats: 12, type: 'Van', minKm: 300, batta: 900 },
    { id: 'minibus', name: 'Mini Bus (18-Seater)', popularModels: 'Swaraj Mazda', dropRate: 45, roundRate: 35, seats: 18, type: 'Van', minKm: 300, batta: 1100 },
    { id: 'bus', name: 'Large Bus (24-Seater)', popularModels: 'Ashok Leyland', dropRate: 55, roundRate: 45, seats: 24, type: 'Van', minKm: 300, batta: 1500 }
];

/**
 * THE REWRITTEN ALGORITHM (v3.0) - MARKET LEADER VERSION
 */
export const calculateFare = (params: {
    startKm: number;
    endKm: number;
    ratePerKm: number;
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
    nightBata?: number;
    hourlyRate?: number;
    durationHours?: number;
    extraItems?: { description: string; amount: number }[];
    packagePrice?: number;
    nightStay?: number;
}) => {
    const {
        startKm, endKm, ratePerKm, mode, vehicleId, days = 1,
        toll = 0, parking = 0, permit = 0, gstEnabled = false,
        waitingHours = 0, isHillStation = false, petCharge = false,
        nightBata = 0, hourlyRate = 0, durationHours = 0,
        extraItems = [], packagePrice = 0, nightStay = 0
    } = params;

    const actualDist = Math.max(0, endKm - startKm);
    const vehicle = VEHICLES.find(v => v.id === vehicleId);

    // 1. DYNAMIC RATE SELECTION
    const activeRate = (ratePerKm && ratePerKm > 0) ? ratePerKm : (vehicle ? (mode === 'outstation' ? vehicle.roundRate : vehicle.dropRate) : 15);
    const minKmRound = vehicle?.minKm || 250;
    const minKmDrop = 130;

    let distCharge = 0;
    let bBatta = 0;
    let effKm = actualDist;

    // 2. THE LOGIC ENGINE
    if (mode === 'drop') {
        // ONE-WAY TRIP
        effKm = Math.max(minKmDrop, actualDist);
        distCharge = effKm * activeRate;
        bBatta = (vehicle?.batta || 500);
    }
    else if (mode === 'outstation') {
        // ROUND TRIP (Always charging for return distance)
        // If the user entered start/end KM, we use that. 
        // If it's a quote where they only entered one-way distance, we double it.
        const minByDays = minKmRound * days;
        effKm = Math.max(minByDays, actualDist);
        distCharge = effKm * activeRate;
        bBatta = (vehicle?.batta || 500) * days;
    }
    else if (mode === 'hourly') {
        const hRate = hourlyRate || (vehicle?.type === 'SUV' ? 450 : 350);
        distCharge = durationHours * hRate;
        // Check for min hours (usually 5 or 10)
        if (durationHours <= 5) distCharge = Math.max(distCharge, (vehicle?.type === 'SUV' ? 2200 : 1800));
        else if (durationHours <= 10) distCharge = Math.max(distCharge, (vehicle?.type === 'SUV' ? 4000 : 3200));
    }
    else if (mode === 'custom') {
        distCharge = extraItems.reduce((acc, i) => acc + i.amount, 0);
    }
    else if (mode === 'fixed' || mode === 'package') {
        distCharge = packagePrice;
    }

    // 3. THE ADDITIVES (Taxable)
    let extraSum = nightBata + nightStay;
    if (waitingHours > 0) extraSum += (waitingHours * 150);
    if (isHillStation) extraSum += (vehicle?.type === 'SUV' ? 500 : 300);
    if (petCharge) extraSum += 500;

    // 4. FINAL SUMMATION
    const taxable = distCharge + bBatta + extraSum;
    const gst = gstEnabled ? (taxable * 0.05) : 0;
    const exempt = toll + parking + permit;

    return {
        total: Math.round(taxable + gst + exempt),
        gst: Math.round(gst),
        fare: Math.round(taxable + exempt),
        distance: actualDist,
        effectiveDistance: effKm,
        rateUsed: activeRate,
        distanceCharge: Math.round(distCharge),
        driverBatta: bBatta,
        waitingCharges: (waitingHours * 150),
        hillStationCharges: isHillStation ? (vehicle?.type === 'SUV' ? 500 : 300) : 0,
        petCharges: petCharge ? 500 : 0,
        taxableTotal: taxable,
        exemptTotal: exempt
    };
};
