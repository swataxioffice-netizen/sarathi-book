import { describe, it, expect } from 'vitest';
import { calculateFare } from './fare';


describe('Master Test Plan - 2025 Market Rates (New Logic)', () => {

    // Test 1: The "Corporate Rental" (Local Hourly)
    it('Scenario 1: Corporate Rental (Local Hourly) - 8Hr/80Km + Extras', () => {
        // Config: Sedan 8hr/80km = 2200. Extra Hr = 250. Extra Km = 15.5 (One Way Rate).
        // Usage: 9 Hr, 90 Km.
        // Base: 2200.
        // Extra Hr: 1 * 250 = 250.
        // Extra Km: 10 * 15.5 = 155.
        // Total: 2200 + 250 + 155 = 2605.

        const result = calculateFare(
            'local_hourly',
            'sedan',
            90, // distance
            1,  // days (N/A)
            1,  // extraHours (9-8=1)
            false // hillStation
        );
        expect(result.totalFare).toBeLessThanOrEqual(2605 + 5); // Allowing small float diffs or rounding
        expect(result.totalFare).toBeGreaterThanOrEqual(2605 - 5);
        expect(result.breakdown).toContain('Base Package (8 Hr / 80 Km): ₹2200');
    });

    // Test 2: The "Airport Flat Rate" (Fixed Price) -- NOT SUPPORTED in new logic 
    // The new logic only handles One Way, Round Trip, Local Hourly.
    // We can skip this or test One Way Drop instead.
    it('Scenario 2: One Way Drop (Airport equivalent) - Premium SUV', () => {
        // Crysta Drop. Local Short Rule (<40km).
        // Distance: 20km.
        // Base (10km): 700.
        // Extra (10km): 10 * 25 = 250.
        // Total: 950.
        // Bata: 0 (Local short drop).

        const result = calculateFare(
            'one_way',
            'premium_suv',
            20
        );
        expect(result.effectiveDistance).toBe(20);
        expect(result.totalFare).toBe(950);
    });

    // Test 3: The "Tirupati Darshan" (Interstate)
    it('Scenario 3: Tirupati Darshan (Outstation Round Trip) - SUV', () => {
        // SUV Round Trip Rate: 18.
        // Min: 300km.
        // Actual: 320km.
        // Dist Cost: 320 * 18 = 5760.
        // Bata: 500.
        // Total: 6260.
        // Note: New logic does not add permit or parking internally.

        const result = calculateFare(
            'round_trip',
            'suv',
            320,
            1 // 1 day
        );

        expect(result.totalFare).toBe(5760 + 500);
        expect(result.effectiveDistance).toBe(320);
    });

    // Test 4: The "Temple Tour" (Multi-Day Bus) - Tempo
    it('Scenario 4: Temple Tour (Multi-Day) - Tempo', () => {
        // Tempo Round Trip Rate: 24.
        // Min: 250km/day (Updated Config). Days: 2 => Min 500km.
        // Actual: 500km. Effective: 500km.
        // Dist Cost: 500 * 24 = 12000.
        // Bata: 800 * 2 = 1600.
        // Total: 13600.

        const result = calculateFare(
            'round_trip',
            'tempo',
            500,
            2 // 2 days
        );

        expect(result.totalFare).toBe(12000 + 1600);
        expect(result.effectiveDistance).toBe(500);
    });

    // Test 5: The "Hatchback Min Rule"
    it('Scenario 5: Hatchback 2-Day Round Trip (Min check)', () => {
        // Hatchback Round Trip Rate: 13.
        // Min: 250km/day. Days: 2 => Min 500km.
        // Actual: 400km. Effective: 500km.
        // Dist Cost: 500 * 13 = 6500.
        // Bata: 300 * 2 = 600.
        // Total: 7100.

        const result = calculateFare(
            'round_trip',
            'hatchback',
            400,
            2
        );

        expect(result.totalFare).toBe(6500 + 600);
        expect(result.effectiveDistance).toBe(500);
    });

    // Test 6: Override Rate Check
    it('Scenario 6: Custom Rate Override', () => {
        // Sedan One Way. Config Rate: 15.5.
        // Custom Rate: 20.
        // Distance: 200km.
        // Cost: 200 * 20 = 4000.
        // Bata: 300.
        // Total: 4300.

        const result = calculateFare(
            'one_way',
            'sedan',
            200,
            1,
            0,
            false,
            20 // Override Rate
        );

        expect(result.rateUsed).toBe(20);
        expect(result.totalFare).toBe(4000 + 300);
    });

});
