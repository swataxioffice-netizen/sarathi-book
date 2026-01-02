/**
 * Utility to estimate parking charges for common high-traffic locations in India.
 * Estimates are based on average commercial parking fees for Cabs.
 */

export interface ParkingInfo {
    amount: number;
    type: string;
    description: string;
}

export const estimateParkingCharge = (location: string): ParkingInfo | null => {
    const loc = (location || '').toLowerCase();

    // 1. Airports (Highest Priority)
    const isAirport = loc.includes('airport') ||
        loc.includes('aerodrome') ||
        loc.includes('terminal') ||
        loc.includes('meenambakkam') || // Chennai Airport Area
        loc.includes('kempegowda') || // Bangalore
        loc.includes('shamshabad'); // Hyderabad

    if (isAirport) {
        let amount = 150; // Standard Airport Entry/Parking for 30-60 mins
        if (loc.includes('bangalore') || loc.includes('kempegowda') || loc.includes('blr')) {
            amount = 250; // Bangalore airport is expensive
        }
        if (loc.includes('chennai') || loc.includes('maa') || loc.includes('meenambakkam')) {
            amount = 150;
        }
        return { amount, type: 'Airport', description: 'Airport Parking/Entry Fee' };
    }

    // 2. Malls
    if (loc.includes('mall') || loc.includes('phoenix') || loc.includes('forum') || loc.includes('nexus') || loc.includes('express avenue') || loc.includes('vr chennai')) {
        return { amount: 60, type: 'Mall', description: 'Mall Parking Fee' };
    }

    // 3. Railway Stations
    if (loc.includes('railway') || loc.includes('station') || loc.includes('junction') || loc.includes('central') || loc.includes('egmore')) {
        // Special case for Chennai Central/Egmore
        if (loc.includes('chennai central') || loc.includes('egmore')) {
            return { amount: 50, type: 'Railway', description: 'Railway Station Parking' };
        }
        // General station
        if (loc.includes('railway')) {
            return { amount: 40, type: 'Railway', description: 'Railway Station Parking' };
        }
    }

    // 4. Important Temples
    if (
        loc.includes('temple') || loc.includes('kovil') || loc.includes('church') || loc.includes('mosque') || loc.includes('dargah') ||
        loc.includes('basilica') || loc.includes('meenakshi') || loc.includes('rameshwaram') || loc.includes('palani') ||
        loc.includes('tiruchendur') || loc.includes('velankanni') || loc.includes('nagore') || loc.includes('srirangam') ||
        loc.includes('thanjavur')
    ) {
        return { amount: 50, type: 'Temple', description: 'Temple/Religious Place Parking' };
    }

    // 5. Tourist Spots
    if (
        loc.includes('ooty') || loc.includes('kodaikanal') || loc.includes('yercaud') || loc.includes('hogneakkal') ||
        loc.includes('courtallam') || loc.includes('pichavaram') || loc.includes('mahabalipuram') || loc.includes('beach') ||
        loc.includes('botanical') || loc.includes('boat house')
    ) {
        return { amount: 50, type: 'Tourist', description: 'Tourist Spot Parking' };
    }

    // 6. Hospitals
    if (loc.includes('hospital') || loc.includes('apollo') || loc.includes('fortis') || loc.includes('kauvery') || loc.includes('gleneagles') || loc.includes('medicity')) {
        return { amount: 40, type: 'Hospital', description: 'Hospital Parking Fee' };
    }

    return null;
};
