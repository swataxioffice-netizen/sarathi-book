import { Loader } from '@googlemaps/js-api-loader';

// Google Maps API Key
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let googleMapsLoader: Loader | null = null;

/**
 * Initialize Google Maps Loader
 */
export const initGoogleMaps = (): Loader => {
    if (!googleMapsLoader) {
        if (!API_KEY) {
            console.warn('[GoogleMaps] API Key is missing. Maps will run in development mode with watermarks.');
        }
        googleMapsLoader = new Loader({
            apiKey: API_KEY || '',
            version: 'quarterly', // Use more stable version
            libraries: ['places', 'geometry', 'marker']
        });
    }
    return googleMapsLoader;
};

/**
 * Load Google Maps API
 */
export const loadGoogleMaps = async (): Promise<typeof google> => {
    try {
        const loader = initGoogleMaps();
        const google = await loader.load();
        return google;
    } catch (error) {
        console.error('[GoogleMaps] Failed to load Google Maps:', error);
        throw error;
    }
};

/**
 * Calculate distance between two locations using Distance Matrix API
 */
export const calculateDistance = async (
    origin: string | google.maps.LatLngLiteral,
    destination: string | google.maps.LatLngLiteral
): Promise<{ distance: number; duration: number; distanceText: string; durationText: string } | null> => {
    try {
        const google = await loadGoogleMaps();
        const service = new google.maps.DistanceMatrixService();

        return new Promise((resolve, reject) => {
            service.getDistanceMatrix(
                {
                    origins: [origin],
                    destinations: [destination],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                },
                (response: google.maps.DistanceMatrixResponse | null, status: google.maps.DistanceMatrixStatus) => {
                    if (status === 'OK' && response) {
                        const result = response.rows[0]?.elements[0];
                        if (result && result.status === 'OK') {
                            resolve({
                                distance: Math.round(result.distance.value / 1000), // Convert to KM
                                duration: Math.round(result.duration.value / 60), // Convert to minutes
                                distanceText: result.distance.text,
                                durationText: result.duration.text,
                            });
                        } else {
                            resolve(null);
                        }
                    } else {
                        reject(new Error(`Distance Matrix request failed: ${status}`));
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error calculating distance:', error);
        return null;
    }
};

/**
 * Get directions between two locations
 */
export const getDirections = async (
    origin: string | google.maps.LatLngLiteral,
    destination: string | google.maps.LatLngLiteral
): Promise<google.maps.DirectionsResult | null> => {
    try {
        const google = await loadGoogleMaps();
        const service = new google.maps.DirectionsService();

        return new Promise((resolve, reject) => {
            service.route(
                {
                    origin,
                    destination,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
                    if (status === 'OK' && result) {
                        resolve(result);
                    } else {
                        reject(new Error(`Directions request failed: ${status}`));
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error getting directions:', error);
        return null;
    }
};

/**
 * Geocode an address to get coordinates
 */
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> => {
    try {
        const google = await loadGoogleMaps();
        const geocoder = new google.maps.Geocoder();

        return new Promise((resolve, reject) => {
            geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                        formattedAddress: results[0].formatted_address
                    });
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
};

/**
 * Get current user location
 */
export const getCurrentLocation = (): Promise<google.maps.LatLngLiteral> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
};
