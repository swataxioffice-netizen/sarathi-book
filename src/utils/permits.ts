/**
 * Utility to calculate estimate state entry permit charges for commercial vehicles in India.
 * Most drivers in this app are likely based in Tamil Nadu.
 * Charges vary by vehicle category (seating capacity).
 */

export interface PermitInfo {
    amount: number;
    state: string;
    description: string;
}

export const estimatePermitCharge = (
    pickup: string,
    drop: string,
    vehicleId?: string
): PermitInfo | null => {
    const pickupLower = (pickup || '').toLowerCase();
    const dropLower = (drop || '').toLowerCase();

    // Helper to check if a location is in a specific state
    const isState = (addr: string, keywords: string[]) =>
        keywords.some(k => addr.includes(k));

    const TN = ['tamil nadu', 'chennai', 'coimbatore', 'madurai', 'trichy', 'salem'];
    const KA = ['karnataka', 'bangalore', 'bengaluru', 'mysore', 'mangalore', 'hosur'];
    const KL = ['kerala', 'kochi', 'trivandrum', 'palakkad', 'kozhikode'];
    const AP = ['andhra', 'vijayawada', 'visakhapatnam', 'tirupati', 'chittoor'];
    const PY = ['puducherry', 'pondicherry', 'pondicherri'];

    const fromTN = isState(pickupLower, TN);

    if (!fromTN) return null;

    // Define vehicle category based on ID
    // hatchback/sedan = Small, suv/premium_suv = SUV, tempo/minibus/bus = Van/Heavy
    const isSUV = vehicleId === 'suv' || vehicleId === 'premium_suv';
    const isHeavy = vehicleId === 'tempo' || vehicleId === 'minibus' || vehicleId === 'bus';

    // Karnataka Permit Estimates
    if (isState(dropLower, KA)) {
        let amount = 850; // Small (Sedan/Hatchback)
        if (isSUV) amount = 1250;
        if (isHeavy) {
            amount = 1850; // Tempo
            if (vehicleId === 'minibus') amount = 2500;
            if (vehicleId === 'bus') amount = 3500;
        }
        return { amount, state: 'Karnataka', description: `KA Permit (${vehicleId || 'Commercial'})` };
    }

    // Kerala Permit Estimates
    if (isState(dropLower, KL)) {
        let amount = 750; // Small
        if (isSUV) amount = 1100;
        if (isHeavy) {
            amount = 1600;
            if (vehicleId === 'minibus' || vehicleId === 'bus') amount = 2800;
        }
        return { amount, state: 'Kerala', description: `KL Permit (${vehicleId || 'Commercial'})` };
    }

    // Andhra Permit Estimates
    if (isState(dropLower, AP)) {
        let amount = 900; // Small
        if (isSUV) amount = 1350;
        if (isHeavy) {
            amount = 1950;
            if (vehicleId === 'minibus' || vehicleId === 'bus') amount = 3200;
        }
        return { amount, state: 'Andhra Pradesh', description: `AP Permit (${vehicleId || 'Commercial'})` };
    }

    // Pondicherry Estimates
    if (isState(dropLower, PY)) {
        let amount = 100;
        if (isSUV) amount = 150;
        if (isHeavy) amount = 250;
        if (vehicleId === 'bus') amount = 500;
        return { amount, state: 'Puducherry', description: `PY Permit` };
    }

    return null;
};
