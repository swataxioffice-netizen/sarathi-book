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

    it('should apply higher Minimum KM for SUV Round Trip (250km/day)', () => {
        // SUV Round Rate: 18. Min 250km (Updated).
        // 1 Day. Distance 200km.
        // Billable: 250km.
        // Dist Cost: 250 * 18 = 4500.
        // Bata: 500.
        // Total: 5000.

        const result = calculateFare(
            'round_trip',
            'suv',
            200,
            1
        );

        expect(result.totalFare).toBe(5000);
        expect(result.effectiveDistance).toBe(250);
    });

    it('should apply Heavy Vehicle Association Rule (Round Trip Logic) for Tempo Drop', () => {
        // Tempo Traveller. Min 250. Round Rate 24.
        // Drop Trip (One Way). Distance 150km.
        // Round Dist = 300km.
        // Days Required = Math.ceil(300 / 250) = 2 Days.
        // Min Billable = 2 * 250 = 500km.
        // Cost: 500 * 24 = 12000.
        // Bata: 800 * 2 = 1600.
        // Total: 13600.

        const result = calculateFare(
            'one_way',
            'tempo',
            150
        );

        expect(result.totalFare).toBe(13600);
        expect(result.breakdown).toContain('Note: One-Way is charged as Round-Trip for this vehicle');
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

