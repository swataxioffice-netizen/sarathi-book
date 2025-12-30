import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, calculateDistance, getCurrentLocation } from '../utils/googleMaps';
import { calculateAdvancedRoute } from '../utils/routesApi';
import { MapPin, X, Search, Locate } from 'lucide-react';

interface MapPickerProps {
    onLocationSelect: (pickup: string, drop: string, distance: number, toll?: number) => void;
    onClose: () => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, onClose }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [pickupMarker, setPickupMarker] = useState<google.maps.Marker | null>(null);
    const [dropMarker, setDropMarker] = useState<google.maps.Marker | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [dropLocation, setDropLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [distance, setDistance] = useState<number>(0);
    const [tollEstimate, setTollEstimate] = useState<number>(0);
    const [mode, setMode] = useState<'pickup' | 'drop'>('pickup');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Initialize map
    useEffect(() => {
        let isMounted = true;

        const initMap = async () => {
            // Check if mapRef is available before proceeding
            if (!mapRef.current) {
                // Try again after a short delay
                setTimeout(() => {
                    if (isMounted && mapRef.current) {
                        initMap();
                    }
                }, 100);
                return;
            }

            try {
                const google = await loadGoogleMaps();

                if (!isMounted) return;

                if (!mapRef.current) return;

                // Get current location or default to India center
                let center = { lat: 20.5937, lng: 78.9629 }; // India center
                try {
                    center = await getCurrentLocation();
                } catch (e) {
                    // Ignore error and use default
                }

                const mapInstance = new google.maps.Map(mapRef.current, {
                    center,
                    zoom: 14,
                    mapTypeId: 'roadmap',
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    zoomControl: false,
                    clickableIcons: false,
                    gestureHandling: 'greedy',
                });

                // Add a small delay and force a resize trigger
                setTimeout(() => {
                    google.maps.event.trigger(mapInstance, 'resize');
                }, 500);

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

                if (!isMounted) return;
                setLoading(false);
            } catch (err) {
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

    // Initialize Autocomplete
    useEffect(() => {
        if (!map || !searchInputRef.current) return;

        const initAutocomplete = async () => {
            const google = await loadGoogleMaps();
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current!, {
                fields: ['geometry', 'formatted_address'],
                componentRestrictions: { country: 'in' }, // Restrict to India
            });
            autocomplete.bindTo('bounds', map);

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);
                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(17);
                }
            });
        };

        initAutocomplete();
    }, [map]);

    // Handle Map Events (Center Pin Logic)
    useEffect(() => {
        if (!map) return;

        const handleCenterChanged = () => {
            setIsDragging(true);
            // Clear current selection state while dragging to indicate liveness? 
            // Better to keep previous until settled to avoid flickering text.
        };

        const handleIdle = async () => {
            setIsDragging(false);
            const center = map.getCenter();
            if (!center) return;

            const lat = center.lat();
            const lng = center.lng();

            // Reverse geocode
            try {
                const google = await loadGoogleMaps();
                const geocoder = new google.maps.Geocoder();

                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const address = results[0].formatted_address;
                        const locationData = { lat, lng, address };

                        if (mode === 'pickup') {
                            setPickupLocation(locationData);
                        } else {
                            setDropLocation(locationData);
                        }
                    }
                });
            } catch (err) {
                console.error('Geocoding error:', err);
            }
        };

        const centerChangedListener = map.addListener('center_changed', handleCenterChanged);
        const idleListener = map.addListener('idle', handleIdle);

        return () => {
            google.maps.event.removeListener(centerChangedListener);
            google.maps.event.removeListener(idleListener);
        };
    }, [map, mode]);

    // Manage Markers (Only show static markers for inactive modes)
    useEffect(() => {
        if (!map) return;

        const updateMarkers = async () => {
            const google = await loadGoogleMaps();

            // Handle Pickup Marker
            if (pickupLocation && mode === 'drop') {
                if (!pickupMarker) {
                    const marker = new google.maps.Marker({
                        position: pickupLocation,
                        map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#00965E',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        },
                    });
                    setPickupMarker(marker);
                } else {
                    pickupMarker.setPosition(pickupLocation);
                    pickupMarker.setMap(map);
                }
            } else {
                // If in pickup mode, hide the static marker (we use center pin)
                if (pickupMarker) pickupMarker.setMap(null);
            }

            // Handle Drop Marker
            // We usually don't need a static drop marker until confirmation, 
            // but if we were to switch back to pickup, we might want to see where drop was LEFT.
            if (dropLocation && mode === 'pickup') {
                if (!dropMarker) {
                    const marker = new google.maps.Marker({
                        position: dropLocation,
                        map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#DC2626',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        },
                    });
                    setDropMarker(marker);
                } else {
                    dropMarker.setPosition(dropLocation);
                    dropMarker.setMap(map);
                }
            } else {
                if (dropMarker) dropMarker.setMap(null);
            }
        };

        updateMarkers();
    }, [map, mode, pickupLocation, dropLocation]);

    const handleMyLocation = async () => {
        if (!map) return;
        try {
            const location = await getCurrentLocation();
            map.setCenter(location);
            map.setZoom(17);
        } catch (e) {
            console.error('Error getting location', e);
        }
    };

    // Calculate distance and TOLLS when both locations are set
    useEffect(() => {
        if (pickupLocation && dropLocation && directionsRenderer) {
            const calculateRoute = async () => {
                try {
                    // 1. Get basic distance for immediate UI
                    const basicRes = await calculateDistance(
                        { lat: pickupLocation.lat, lng: pickupLocation.lng },
                        { lat: dropLocation.lat, lng: dropLocation.lng }
                    );

                    if (basicRes) {
                        setDistance(basicRes.distance);
                    }

                    // 2. Try Advanced Routes API for TOLL estimates
                    const advancedRes = await calculateAdvancedRoute(
                        { lat: pickupLocation.lat, lng: pickupLocation.lng },
                        { lat: dropLocation.lat, lng: dropLocation.lng }
                    );

                    if (advancedRes) {
                        setDistance(advancedRes.distanceKm);
                        setTollEstimate(advancedRes.tollPrice);
                    }

                    // 3. Draw route line on map
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
                } catch (err) {
                    console.error('Error calculating route:', err);
                }
            };

            calculateRoute();
        }
    }, [pickupLocation, dropLocation, directionsRenderer]);

    const handleConfirm = () => {
        if (pickupLocation && dropLocation) {
            onLocationSelect(pickupLocation.address, dropLocation.address, distance, tollEstimate);
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
                    <h3 className="text-lg font-black text-slate-900">Select Pickup & Drop</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {mode === 'pickup' ? '📍 Drag map to set pickup location' : '🎯 Drag map to set drop location'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Map Container with Overlays */}
            <div className="flex-1 relative">
                {/* Search Bar */}
                <div className="absolute top-4 left-4 right-4 z-10">
                    <div className="bg-white rounded-xl shadow-lg flex items-center p-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Search className="text-slate-400 w-5 h-5 mr-3" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search places..."
                            className="flex-1 outline-none text-slate-700 placeholder:text-slate-400 text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Map Div */}
                <div ref={mapRef} className="absolute inset-0 w-full h-full" />

                {/* Center Pin Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 -mt-[35px]">
                    <div className={`relative flex flex-col items-center transition-transform duration-200 ${isDragging ? '-translate-y-2' : ''}`}>
                        {/* Floating Label */}
                        <div className={`mb-1 px-3 py-1.5 rounded-full shadow-md text-xs font-bold text-white whitespace-nowrap
                           ${mode === 'pickup' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {isDragging ? 'Moving...' : (mode === 'pickup' ? 'Set Pickup' : 'Set Drop')}
                        </div>
                        {/* Pin Icon */}
                        <MapPin
                            size={40}
                            className={`drop-shadow-xl ${mode === 'pickup' ? 'text-green-600 fill-green-600' : 'text-red-600 fill-red-600'}`}
                        />
                        {/* Pin Shadow Dot */}
                        <div className="w-1.5 h-1.5 bg-black/20 rounded-full mt-[-2px] blur-[1px]"></div>
                    </div>
                </div>

                {/* My Location Button */}
                <button
                    onClick={handleMyLocation}
                    className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 active:scale-95 transition-all z-10"
                >
                    <Locate size={24} className="text-slate-700" />
                </button>
            </div>

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
                            <MapPin size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-red-700 uppercase tracking-wide">Drop</p>
                            <p className="text-sm text-slate-700 truncate">{dropLocation.address}</p>
                        </div>
                    </div>
                )}

                {(distance > 0 || tollEstimate > 0) && (
                    <div className="flex gap-2">
                        {distance > 0 && (
                            <div className="flex-1 flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                                <span className="text-[10px] font-bold text-blue-900 uppercase">Distance</span>
                                <span className="text-sm font-black text-blue-600">{distance} KM</span>
                            </div>
                        )}
                        {tollEstimate > 0 && (
                            <div className="flex-1 flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                                <span className="text-[10px] font-bold text-orange-900 uppercase">Est. Toll</span>
                                <span className="text-sm font-black text-orange-600">₹{tollEstimate}</span>
                            </div>
                        )}
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
