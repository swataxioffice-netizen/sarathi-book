import { describe, it, expect } from 'vitest';
import { calculateFare } from './fare';

describe('Comprehensive Trip Verification', () => {

    describe('1. Outstation Round Trip', () => {
        it('should enforce Minimum KM per Day for Sedan (250km)', () => {
            // 2 Days. Min = 500km.
            // Actual run: 400km.
            // Expected: 500 * Rate.
            const result = calculateFare({
                startKm: 0,
                endKm: 200, // Round trip dist = 400
                ratePerKm: 14,
                mode: 'outstation',
                vehicleId: 'sedan',
                days: 2
            });
            // 500 * 14 = 7000
            expect(result.distanceCharge).toBe(7000);
            expect(result.effectiveDistance).toBe(500);
        });

        it('should calculate correct Batta for multi-day trips', () => {
            // 3 Days SUV. Batta 400/day.
            const result = calculateFare({
                startKm: 0,
                endKm: 1000,
                ratePerKm: 18,
                mode: 'outstation',
                vehicleId: 'suv',
                days: 3
            });
            // Batta: 400 * 3 = 1200
            expect(result.driverBatta).toBe(1200);
        });

        it('should add Garage Buffer (20km) when enabled', () => {
            const result = calculateFare({
                startKm: 0,
                endKm: 300, // 600 total
                ratePerKm: 25,
                mode: 'outstation',
                vehicleId: 'tempo',
                days: 1,
                includeGarageBuffer: true
            });
            // Tempo Min 300. Actual 300 + 20 = 320.
            // 320 * 25 = 8000.
            expect(result.effectiveDistance).toBe(320);
            expect(result.distanceCharge).toBe(8000);
        });
    });

    describe('2. Outstation Drop (Cars)', () => {
        it('should enforce Minimum 130km rule for short One Way Drops', () => {
            // 80km Drop. Min 130 applies.
            // Rate 16 (Sedan).
            const result = calculateFare({
                startKm: 0,
                endKm: 80,
                ratePerKm: 16,
                mode: 'drop',
                vehicleId: 'sedan'
            });
            // 130 * 16 = 2080
            expect(result.distanceCharge).toBe(2080);
        });
    });

    describe('3. Special Charges', () => {
        it('should calculate Waiting Charges correctly', () => {
            // 2 Hours waiting. Sedan (100/hr).
            const result = calculateFare({
                startKm: 0,
                endKm: 50,
                mode: 'drop',
                vehicleId: 'sedan',
                waitingHours: 2
            });
            expect(result.waitingCharges).toBe(200);
        });

        it('should calculate Hill Station Charges (SUV)', () => {
            const result = calculateFare({
                startKm: 0,
                endKm: 50,
                mode: 'outstation',
                vehicleId: 'suv',
                isHillStation: true
            });
            // 7-Seater Hill Assist usually 300-500. 
            // Checking logic: (vehicle.seats > 7 ? 1500 : (vehicle.type === 'SUV' ? 500 : 300))
            expect(result.hillStationCharges).toBe(500);
        });
    });

});
