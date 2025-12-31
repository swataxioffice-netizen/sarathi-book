import { describe, it, expect } from 'vitest';
import { calculateFare } from './fare';

describe('Heavy Vehicle Minimum Package Rule', () => {

    it('should charge Tempo Local Drop as Fixed Package (3500)', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 18,
            mode: 'drop',
            vehicleId: 'tempo',
            ratePerKm: 25 // Dummy rate, should be ignored
        });
        expect(result.distanceCharge).toBe(3500);
        expect(result.warningMessage).toContain('Standard Minimum Charge');
    });

    it('should charge Bus Local Drop as Fixed Package (5500)', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 18,
            mode: 'drop',
            vehicleId: 'bus',
            ratePerKm: 50 // Dummy rate
        });
        expect(result.distanceCharge).toBe(5500);
        expect(result.warningMessage).toContain('5 Hrs / 50 KM');
    });

    it('should charge Car Local Drop normally (Standard Logic)', () => {
        const result = calculateFare({
            startKm: 0,
            endKm: 18,
            ratePerKm: 15,
            mode: 'drop',
            vehicleId: 'hatchback'
        });
        // Base 250 + (8 * 15) = 370
        expect(result.distanceCharge).toBe(370);
        expect(result.warningMessage).toBe('');
    });

    it('should charge Tempo Drop > 50km as Round Trip (Distance x 2)', () => {
        // Dist 100km.
        // Rule: > 50km uses Round Trip Logic.
        // 100 * 2 = 200km.
        // Min KM: 300.
        // Effective: 300km.
        // Rate: Round Rate (25).
        // Cost: 300 * 25 = 7500.
        const result = calculateFare({
            startKm: 0,
            endKm: 100,
            mode: 'drop',
            vehicleId: 'tempo',
            ratePerKm: 0
        });
        expect(result.distanceCharge).toBe(7500);
        expect(result.warningMessage).toContain('Round Trip');
    });

});
