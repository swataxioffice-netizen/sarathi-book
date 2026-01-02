import { describe, it, expect } from 'vitest';
import { calculateFare } from './fare';


describe('Chennai Fare Business Logic 2025', () => {

    it('should calculate Local Drop correctly for Hatchback (< 40km)', () => {
        // Hatchback: One Way 14.5 (or config dependent).
        // 25km distance.
        // Base KM: 10. Base Fare: 250.
        // Extra KM: 15. Rate: 14.5.
        // 15 * 14.5 = 217.5.
        // Total: 467.5 -> 468.

        const result = calculateFare(
            'one_way',
            'hatchback',
            25
        );

        // Check against config dynamically or hardcoded if 2025 standard is fixed
        // Base 250. Extra 15 * 14.5 = 217.5. Total = 467.5.
        expect(result.totalFare).toBe(468);
    });

    it('should calculate Outstation Drop correctly for Sedan (> 40km)', () => {
        // Sedan One Way: 15.5.
        // Distance: 150km.
        // Min Drop: 130km (Satisfied).
        // Fare: 150 * 15.5 = 2325.
        // Bata: 300.
        // Total: 2625.

        const result = calculateFare(
            'one_way',
            'sedan',
            150
        );

        expect(result.totalFare).toBe(2625);
    });

    it('should apply higher Minimum KM for SUV Round Trip (300/day)', () => {
        // SUV Round Rate: 18. Min 300km.
        // 1 Day. Distance 200km.
        // Billable: 300km.
        // Dist Cost: 300 * 18 = 5400.
        // Bata: 500.
        // Total: 5900.

        const result = calculateFare(
            'round_trip',
            'suv',
            200,
            1
        );

        expect(result.totalFare).toBe(5900);
        expect(result.effectiveDistance).toBe(300);
    });

    it('should apply Heavy Vehicle Rule (Round Trip Logic) for Tempo Drop', () => {
        // Tempo. Min 300. Round Rate 24.
        // Drop Trip Requested (One Way).
        // Distance 100km.
        // Logic: Round Trip Dist = 200km.
        // Min Check: Max(200, 300) = 300km.
        // Cost: 300 * 24 = 7200.
        // Bata: 800.
        // Total: 8000.

        const result = calculateFare(
            'one_way',
            'tempo',
            100
        );

        expect(result.totalFare).toBe(8000);
        expect(result.breakdown).toContain('Heavy Vehicle Rule: One-Way charged as Round Trip');
    });

    it('should use Custom Rate when provided', () => {
        // Hatchback Drop.
        // Distance 25km.
        // Custom Rate: 18.
        // Base 250 (10km).
        // Extra 15 * 18 = 270.
        // Total: 520.

        const result = calculateFare(
            'one_way',
            'hatchback',
            25,
            1,
            0,
            false,
            18 // Override
        );

        expect(result.totalFare).toBe(520);
        expect(result.rateUsed).toBe(18);
    });

});

