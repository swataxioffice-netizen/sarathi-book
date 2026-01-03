// Google Maps API Key
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface RouteTollData {
    tollPrice: number;
    currencyCode: string;
    distanceKm: number;
    durationMin: number;
}

/**
 * Advanced Route Calculation using the Google Routes API (v2)
 * Specifically supports Toll Prices for India.
 */
export const calculateAdvancedRoute = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
): Promise<RouteTollData | null> => {
    if (!API_KEY) return null;

    try {
        const body = {
            origin: {
                location: {
                    latLng: {
                        latitude: origin.lat,
                        longitude: origin.lng
                    }
                }
            },
            destination: {
                location: {
                    latLng: {
                        latitude: destination.lat,
                        longitude: destination.lng
                    }
                }
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
            departureTime: new Date(Date.now() + 300000).toISOString(), // 5 mins in future
            extraComputations: ['TOLLS']
            // Note: tollPasses filtered removed for higher reliability/cash rates
        };

        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[RoutesAPI] Error:', errorText);
            return null;
        }

        const data = await response.json();
        console.log('[RoutesAPI] Response:', data);

        if (!data.routes || data.routes.length === 0) {
            return null;
        }

        const route = data.routes[0];
        const tollInfo = route.travelAdvisory?.tollInfo;

        let totalToll = 0;
        let currency = 'INR';

        // FIX: estimatedPrice is an array in Google Routes API v2
        if (tollInfo && tollInfo.estimatedPrice && Array.isArray(tollInfo.estimatedPrice) && tollInfo.estimatedPrice.length > 0) {
            const price = tollInfo.estimatedPrice[0];
            const units = parseInt(price.units || '0');
            const nanos = (price.nanos || 0) / 1000000000;

            totalToll = units + nanos;
            currency = price.currencyCode || 'INR';
        }

        return {
            tollPrice: Math.round(totalToll),
            currencyCode: currency,
            distanceKm: Math.round(route.distanceMeters / 1000),
            durationMin: Math.round(parseInt(route.duration?.replace('s', '') || '0') / 60)
        };
    } catch (error) {
        console.error('Error fetching Advanced Route Data:', error);
        return null;
    }
};
