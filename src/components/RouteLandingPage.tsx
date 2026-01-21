import React, { useMemo } from 'react';
import Calculator from './Calculator';
import SEOHead from './SEOHead';

interface RouteLandingPageProps {
    slug: string;
}

const RouteLandingPage: React.FC<RouteLandingPageProps> = ({ slug }) => {

    // Parse the slug: "chennai-to-bangalore-taxi" -> { from: "Chennai", to: "Bangalore", vehicle: ... }
    const routeData = useMemo(() => {
        try {
            // Remove leading slash if present
            const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;

            // Pattern 1: City to City (chennai-to-bangalore-taxi)
            const toIndex = cleanSlug.indexOf('-to-');
            if (toIndex !== -1) {
                const parts = cleanSlug.split('-');
                const toPartIndex = parts.indexOf('to');

                // Reconstruct city names (handling multi-word cities like "new-delhi")
                const fromParts = parts.slice(0, toPartIndex);
                const restParts = parts.slice(toPartIndex + 1);

                // Check for suffix like "-taxi", "-cab" at the end
                let vehicle = 'sedan'; // default
                let lastPart = restParts[restParts.length - 1];

                const suffixes = ['taxi', 'cab', 'cabs', 'rental'];
                if (suffixes.includes(lastPart)) {
                    restParts.pop(); // remove suffix
                }

                // Check for vehicle type in the rest (e.g. bangalore-innova-taxi)
                // This is a simple parser; can be enhanced.

                const fromCity = fromParts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                const toCity = restParts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

                return {
                    from: fromCity,
                    to: toCity,
                    vehicle
                };
            }

            // Pattern 2: Service (outstation-cabs) - fallback
            // We might just map this to the calculator with no specific route
            return null;
        } catch (e) {
            console.error("Failed to parse route slug", e);
            return null;
        }
    }, [slug]);

    if (!routeData) {
        // Fallback if parsing fails
        return <Calculator />;
    }

    const title = `${routeData.from} to ${routeData.to} Taxi Fare - Book Online | Sarathi Book`;
    const description = `Book Safe & Reliable Taxi from ${routeData.from} to ${routeData.to}. Check fare estimate, distance, and book ${routeData.vehicle} instantly. Best rates for outstation cabs.`;

    return (
        <div className="animate-fade-in">
            <SEOHead
                title={title}
                description={description}
                canonical={`https://sarathibook.com/${slug}`}
            />
            {/* We pass undefined for vehicle to let Calculator decide or use default, unless we parsed a specific vehicle */}
            <Calculator
                initialPickup={routeData.from}
                initialDrop={routeData.to}
            />
        </div>
    );
};

export default RouteLandingPage;
