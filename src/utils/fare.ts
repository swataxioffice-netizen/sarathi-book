export type FareMode = 'distance' | 'hourly' | 'outstation' | 'drop' | 'package';

export interface Trip {
    id: string;
    customerName: string;
    customerGst?: string;
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
    }
) => {
    const {
        startKm, endKm, baseFare, ratePerKm, toll, parking,
        gstEnabled, mode, hourlyRate = 0, durationHours = 0, nightBata = 0,
        waitingHours = 0, isHillStation = false, petCharge = false,
        packagePrice = 0, actualHours = 0, baseKmLimit = 0, baseHourLimit = 0,
        extraKmRate = 0, extraHourRate = 0
    } = params;

    const distance = Math.max(0, endKm - startKm);
    let taxableFare = 0;
    const waitingChargeRate = 150; // Standard TN industry rate

    // TN Drop/Outstation Logic
    if (mode === 'drop') {
        // Minimum 100km for drop trips
        const effectiveDistance = Math.max(100, distance);
        taxableFare = effectiveDistance * ratePerKm;

        // Driver Batta for Drop: Rs. 400 (Rs. 600 if > 400km)
        // We use the provided nightBata as base but apply TN logic if it's default
        let actualBatta = nightBata;
        if (actualBatta === 0 || actualBatta === 250) { // If user hasn't customized or is using old logic
            actualBatta = distance > 400 ? 600 : 400;
        }
        taxableFare += actualBatta;

    } else if (mode === 'outstation') {
        // Minimum 250km per day for round trips
        const effectiveDistance = Math.max(250, distance);
        taxableFare = effectiveDistance * ratePerKm;

        // Driver Batta for Round: Rs. 500 (Rs. 600 if > 500km)
        let actualBatta = nightBata;
        if (actualBatta === 0 || actualBatta === 250) {
            actualBatta = distance > 500 ? 600 : 500;
        }
        taxableFare += actualBatta;

    } else if (mode === 'package') {
        const extraKms = Math.max(0, distance - (baseKmLimit || 0));
        const extraHr = Math.max(0, (actualHours || 0) - (baseHourLimit || 0));

        taxableFare = packagePrice;
        taxableFare += extraKms * (extraKmRate || 0);
        taxableFare += extraHr * (extraHourRate || 0);
        taxableFare += nightBata;
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
