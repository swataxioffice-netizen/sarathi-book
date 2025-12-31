import { describe, it, expect } from 'vitest';
import { calculateFare } from './fare';

describe('Chennai Fare Business Logic 2025', () => {

    it('should calculate Local Drop correctly for Hatchback (<30km)', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 25,
            ratePerKm: 0,
            mode: 'drop',
            vehicleId: 'hatchback',
            includeGarageBuffer: false
        });

        // Base Fee (10km) = 250
        // Extra (15km) * 25 = 375
        // Total Distance Charge = 475
        // No Bata
        expect(result.distanceCharge).toBe(475);
        expect(result.driverBatta).toBe(0);
    });

    it('should calculate Outstation Drop correctly for Sedan (>30km)', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 150,
            ratePerKm: 0, // Should pick default Drop Rate: 16
            mode: 'drop',
            vehicleId: 'sedan',
            includeGarageBuffer: false
        });

        // Distance: 150km (Min 130 satisfied)
        // Rate: 16
        // Charge: 150 * 16 = 2400
        // Bata: 300
        expect(result.distanceCharge).toBe(2400);
        expect(result.driverBatta).toBe(300);
    });

    it('should apply Double Bata for High Mileage SUV Round Trip', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 500,
            ratePerKm: 0, // Round Rate: 18
            mode: 'outstation',
            vehicleId: 'suv',
            days: 1
        });

        // Min 300km satisfied.
        // Distance: 500km
        // Charge: 500 * 18 = 9000
        // Avg Check: 500/1 > 400 => Double Bata
        // Bata: 400 * 2 = 800
        expect(result.distanceCharge).toBe(9000);
        expect(result.driverBatta).toBe(800);
    });

    it('should enforce Minimum KM for Outstation Round Trip', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 200,
            ratePerKm: 0, // Round Rate: 18
            mode: 'outstation',
            vehicleId: 'suv',
            days: 1
        });

        // Actual 200. Min 300. Used 300.
        // Charge: 300 * 18 = 5400.
        // Avg: 300/1 < 400 => Single Bata (400)
        expect(result.distanceCharge).toBe(5400);
        expect(result.driverBatta).toBe(400);
    });

    it('should apply Heavy Vehicle Rule (Round Trip Logic) for Tempo Drop', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 100, // One way distance
            ratePerKm: 0, // Round Rate: 25
            mode: 'drop',
            vehicleId: 'tempo'
        });

        // Rule: Treat as Round Trip Distance => 100 * 2 = 200km.
        // Min KM for Van = 300.
        // Effective = max(200, 300) = 300.
        // Charge: 300 * 25 = 7500.
        expect(result.distanceCharge).toBe(7500);
    });

    it('should add Garage Buffer for Outstation', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 400,
            ratePerKm: 0,
            mode: 'outstation',
            vehicleId: 'sedan',
            includeGarageBuffer: true // +20km
        });

        // Distance: 400 + 20 = 420.
        // Rate (Round Sedan): 14
        // Charge: 420 * 14 = 5880
        expect(result.effectiveDistance).toBe(420);
        expect(result.distanceCharge).toBe(5880);
    });

    it('should add Interstate Permit Charges', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 100,
            ratePerKm: 0,
            mode: 'drop',
            vehicleId: 'suv',
            interstateState: 'karnataka'
        });

        // SUV Karnataka Permit = 1250
        // Permit is part of exemptTotal
        expect(result.exemptTotal).toBe(1250);
    });
    it('should use Custom Rate for Local Drop extra km', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 25,
            ratePerKm: 18, // User Input
            mode: 'drop',
            vehicleId: 'hatchback'
        });

        // Base 250.
        // Extra 15km * 18 = 270.
        // Total = 520.
        expect(result.distanceCharge).toBe(520);
    });

});
