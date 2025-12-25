import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, calculateDistance, getCurrentLocation } from '../utils/googleMaps';
import { MapPin, Navigation as NavigationIcon, X } from 'lucide-react';

interface MapPickerProps {
    onLocationSelect: (pickup: string, drop: string, distance: number) => void;
    onClose: () => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, onClose }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [pickupMarker, setPickupMarker] = useState<google.maps.Marker | null>(null);
    const [dropMarker, setDropMarker] = useState<google.maps.Marker | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [dropLocation, setDropLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [distance, setDistance] = useState<number>(0);
    const [mode, setMode] = useState<'pickup' | 'drop'>('pickup');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Initialize map
    useEffect(() => {
        let isMounted = true;

        const initMap = async () => {
            console.log('[MapPicker] Starting map initialization...');

            // Check if mapRef is available before proceeding
            if (!mapRef.current) {
                console.log('[MapPicker] mapRef.current is null at start, waiting...');
                // Try again after a short delay
                setTimeout(() => {
                    if (isMounted && mapRef.current) {
                        initMap();
                    }
                }, 100);
                return;
            }

            try {
                console.log('[MapPicker] Calling loadGoogleMaps...');
                const google = await loadGoogleMaps();
                console.log('[MapPicker] loadGoogleMaps returned:', google);

                if (!isMounted) {
                    console.log('[MapPicker] Component unmounted, aborting');
                    return;
                }

                if (!mapRef.current) {
                    console.log('[MapPicker] mapRef.current is null after load, aborting');
                    return;
                }

                console.log('[MapPicker] mapRef.current exists, creating map...');

                // Get current location or default to India center
                let center = { lat: 20.5937, lng: 78.9629 }; // India center
                try {
                    center = await getCurrentLocation();
                    console.log('[MapPicker] Got current location:', center);
                } catch (e) {
                    console.log('[MapPicker] Using default location');
                }

                const mapInstance = new google.maps.Map(mapRef.current, {
                    center,
                    zoom: 12,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                console.log('[MapPicker] Map instance created:', mapInstance);

                if (!isMounted) return;
                setMap(mapInstance);

                // Initialize directions renderer
                const renderer = new google.maps.DirectionsRenderer({
                    map: mapInstance,
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: '#0047AB',
                        strokeWeight: 4,
                    },
                });

                if (!isMounted) return;
                setDirectionsRenderer(renderer);

                console.log('[MapPicker] Setting loading to false');
                if (!isMounted) return;
                setLoading(false);
            } catch (err) {
                console.error('[MapPicker] Error during initialization:', err);
                if (!isMounted) return;
                setError('Failed to load Google Maps. Please check your API key.');
                setLoading(false);
            }
        };

        initMap();

        return () => {
            isMounted = false;
        };
    }, []);

    // Handle map click
    useEffect(() => {
        if (!map) return;

        const clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;

            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            // Reverse geocode to get address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                if (status === 'OK' && results && results[0]) {
                    const address = results[0].formatted_address;

                    if (mode === 'pickup') {
                        // Remove old pickup marker
                        if (pickupMarker) pickupMarker.setMap(null);

                        // Create new pickup marker (green)
                        const marker = new google.maps.Marker({
                            position: { lat, lng },
                            map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: '#00965E',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                            },
                            draggable: true,
                        });

                        setPickupMarker(marker);
                        setPickupLocation({ lat, lng, address });
                        setMode('drop'); // Switch to drop mode
                    } else {
                        // Remove old drop marker
                        if (dropMarker) dropMarker.setMap(null);

                        // Create new drop marker (red)
                        const marker = new google.maps.Marker({
                            position: { lat, lng },
                            map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: '#DC2626',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                            },
                            draggable: true,
                        });

                        setDropMarker(marker);
                        setDropLocation({ lat, lng, address });
                    }
                }
            });
        });

        return () => {
            google.maps.event.removeListener(clickListener);
        };
    }, [map, mode, pickupMarker, dropMarker]);

    // Calculate distance when both locations are set
    useEffect(() => {
        if (pickupLocation && dropLocation && directionsRenderer) {
            const calculateRoute = async () => {
                try {
                    const result = await calculateDistance(
                        { lat: pickupLocation.lat, lng: pickupLocation.lng },
                        { lat: dropLocation.lat, lng: dropLocation.lng }
                    );

                    if (result) {
                        setDistance(result.distance);

                        // Draw route on map
                        const google = await loadGoogleMaps();
                        const directionsService = new google.maps.DirectionsService();

                        directionsService.route(
                            {
                                origin: { lat: pickupLocation.lat, lng: pickupLocation.lng },
                                destination: { lat: dropLocation.lat, lng: dropLocation.lng },
                                travelMode: google.maps.TravelMode.DRIVING,
                            },
                            (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
                                if (status === 'OK' && result) {
                                    directionsRenderer.setDirections(result);
                                }
                            }
                        );
                    }
                } catch (err) {
                    console.error('Error calculating distance:', err);
                }
            };

            calculateRoute();
        }
    }, [pickupLocation, dropLocation, directionsRenderer]);

    const handleConfirm = () => {
        if (pickupLocation && dropLocation) {
            onLocationSelect(pickupLocation.address, dropLocation.address, distance);
            onClose();
        }
    };

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md">
                    <h3 className="text-lg font-black text-red-600 mb-2">Error</h3>
                    <p className="text-sm text-slate-600 mb-4">{error}</p>
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white z-[60] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-sm font-bold text-slate-600">Loading Map...</p>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900">Select Locations</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {mode === 'pickup' ? '📍 Tap to set pickup location' : '🎯 Tap to set drop location'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Map Container */}
            <div ref={mapRef} className="flex-1" />

            {/* Location Info */}
            <div className="bg-white border-t border-slate-200 p-4 space-y-3">
                {pickupLocation && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-green-700 uppercase tracking-wide">Pickup</p>
                            <p className="text-sm text-slate-700 truncate">{pickupLocation.address}</p>
                        </div>
                    </div>
                )}

                {dropLocation && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <NavigationIcon size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-red-700 uppercase tracking-wide">Drop</p>
                            <p className="text-sm text-slate-700 truncate">{dropLocation.address}</p>
                        </div>
                    </div>
                )}

                {distance > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <span className="text-sm font-bold text-blue-900">Distance</span>
                        <span className="text-lg font-black text-blue-600">{distance} KM</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode(mode === 'pickup' ? 'drop' : 'pickup')}
                        className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm"
                    >
                        Switch to {mode === 'pickup' ? 'Drop' : 'Pickup'}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!pickupLocation || !dropLocation}
                        className="flex-1 bg-[#0047AB] text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm ({distance} KM)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapPicker;
