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
 * 
 * NOTE: This requires the "Routes API" to be enabled in your Google Cloud Console.
 */
export const calculateAdvancedRoute = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
): Promise<RouteTollData | null> => {
    if (!API_KEY) {
        console.warn('Routes API: Missing API Key');
        return null;
    }

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
            routingPreference: 'TRAFFIC_AWARE',
            extraComputations: ['TOLLS'],
            routeModifiers: {
                vehicleInfo: {
                    emissionType: 'GASOLINE'
                },
                tollPasses: [
                    'IN_FASTAG'
                ]
            }
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
            throw new Error(`Routes API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            return null;
        }

        const route = data.routes[0];
        const tollInfo = route.travelAdvisory?.tollInfo;

        // Sum up all estimated tolls
        let totalToll = 0;
        let currency = 'INR';

        if (tollInfo && tollInfo.estimatedPrice) {
            const price = tollInfo.estimatedPrice;
            totalToll = parseInt(price.units || '0') + (price.nanos || 0) / 1000000000;
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
