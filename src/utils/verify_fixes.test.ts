import { describe, it, expect } from 'vitest';
import { calculateFare } from './fare';

describe('Verification of Fixes for Hatchback & Bus', () => {

    it('should calculate Hatchback Local Drop with correct Input Rate (Fix Verification)', () => {
        // Hatchback: 18km. Input Rate: 15.
        // Base (10km): 250
        // Extra (8km): 8 * 15 = 120
        // Total: 370
        const result = calculateFare({
            startKm: 0,
            endKm: 18,
            ratePerKm: 15, // Explicit Input Rate
            mode: 'drop',
            vehicleId: 'hatchback'
        });
        expect(result.distanceCharge).toBe(370);
    });

    it('should calculate Bus Drop using Min KM logic (Fail-safe check)', () => {
        // Even if UI blocks it, logic should handle it "safely" or as round trip
        // Bus: 18km. Input Rate 45.
        // Rule: Heavy Vehicle = Round Trip Distance (18*2=36). 
        // Min KM: 300.
        // Effective: 300km.
        // Cost: 300 * 45 = 13,500.
        // (Wait, user said 13500 is confusing for local drop, but this IS the correct calculation for a bus rental)
        // Cost: Package Price 5500.
        const result = calculateFare({
            startKm: 0,
            endKm: 18,
            ratePerKm: 45,
            mode: 'drop',
            vehicleId: 'bus'
        });

        // This confirms that IF a bus is calculated, it uses 5500 Package Price.
        expect(result.distanceCharge).toBe(5500);
        // Also check warning
        expect(result.warningMessage).toBeTruthy();
    });

});
