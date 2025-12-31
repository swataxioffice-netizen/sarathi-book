import { describe, it, expect } from 'vitest';
import { calculateFare } from './fare';

describe('Master Test Plan - 2025 Market Rates', () => {

    // Test 1: The "Corporate Rental" (Local Hourly)
    it('Scenario 1: Corporate Rental (Local Hourly) - 8Hr/80Km + Extras', () => {
        // Base Package: 2300 (Input)
        // Extra Hr: 1 (at 250)
        // Extra Km: 10 (at 14)
        // Usage: 9 Hr, 90 Km.
        // Formula: 2300 + 250 + (10*14=140) = 2690.
        const result = calculateFare({
            startKm: 0,
            endKm: 90,
            ratePerKm: 14, // Extra KM Rate
            mode: 'hourly',
            vehicleId: 'sedan',
            packagePrice: 2300,
            durationHours: 9,
            waitingHours: 1, // Using waitingHours to represent Extra Hours
            hourlyRate: 250 // Extra Hour Rate
        });
        expect(result.distanceCharge).toBe(2690);
    });

    // Test 2: The "Airport Flat Rate" (Fixed Price)
    it('Scenario 2: Airport Pickup (Fixed Price) - Crysta', () => {
        // Flat Fare: 2500.
        // Parking: 100.
        // Total: 2600.
        const result = calculateFare({
            startKm: 0,
            endKm: 20,
            mode: 'fixed',
            vehicleId: 'premium_suv',
            packagePrice: 2500,
            parking: 100
        });
        expect(result.distanceCharge).toBe(2500); // Fare Part
        expect(result.total).toBe(2600); // Total with Parking
    });

    // Test 3: The "Tirupati Darshan" (Interstate + Permit)
    it('Scenario 3: Tirupati Darshan (Interstate) - SUV', () => {
        // SUV Min 300. Actual 320. Use 320.
        // Rate: 17.
        // Fare: 320 * 17 = 5440.
        // Bata: 400.
        // Permit (AP SUV): 1350.
        // Total: 5440 + 400 + 1350 = 7190.
        const result = calculateFare({
            startKm: 0,
            endKm: 320,
            ratePerKm: 17,
            mode: 'outstation',
            vehicleId: 'suv',
            days: 1,
            interstateState: 'andhra'
        });

        // Exempt Total contains Permit?
        // Note: verify_outstation.test.ts says result.exemptTotal should be permit.
        // Fare + Bata = Taxable? Or just Fare + Bata logic.
        const total = result.distanceCharge + result.driverBatta + result.exemptTotal;
        expect(result.distanceCharge).toBe(5440);
        expect(result.driverBatta).toBe(400);
        expect(result.exemptTotal).toBe(1350);
        expect(total).toBe(7190);
    });

    // Test 4: The "Temple Tour" (Multi-Day Bus)
    it('Scenario 4: Temple Tour (Multi-Day Bus) - Tempo', () => {
        // Tempo Min 300/day. 2 Days = 600 Minimum.
        // Actual: 500 KM.
        // Chargeable: 600 KM.
        // Rate: 25.
        // Fare: 600 * 25 = 15000.
        // Bata: 700 * 2 = 1400.
        // Total: 16400.
        const result = calculateFare({
            startKm: 0,
            endKm: 500,
            ratePerKm: 25,
            mode: 'outstation',
            vehicleId: 'tempo',
            days: 2
        });

        const total = result.distanceCharge + result.driverBatta;
        expect(result.distanceCharge).toBe(15000);
        expect(result.driverBatta).toBe(1400);
        expect(total).toBe(16400);
    });

});
