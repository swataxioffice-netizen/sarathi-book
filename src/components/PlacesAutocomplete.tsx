import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';
import { Map, Loader2, MapPin, X } from 'lucide-react';

interface PlacesAutocompleteProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    onPlaceSelected?: (place: { address: string; lat: number; lng: number }) => void;
    onMapClick?: () => void;
    placeholder?: string;
    className?: string;
    label?: string;
    icon?: React.ReactNode;
    rightContent?: React.ReactNode;
    onBlur?: () => void;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
    id,
    value,
    onChange,
    onPlaceSelected,
    onMapClick,
    placeholder,
    className,
    label,
    icon,
    rightContent,
    onBlur
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    // Sync internal state with prop value
    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value);
        }
    }, [value]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Smart Positioning and Scroll Logic
    const ensureVisibility = () => {
        // 1. Scroll into view (delayed for keyboard animation)
        // REMOVED auto-scroll on typing as it causes jumping and poor UX on mobile
        // setTimeout(() => {
        //     if (wrapperRef.current) {
        //         wrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        //     }
        // }, 300);

        // 2. Decide Dropdown Position (Top vs Bottom)
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If less than 200px (approx 3 items) below, and we have more space above, flip it
            if (spaceBelow < 200 && rect.top > 200) {
                setDropdownPosition('top');
            } else {
                setDropdownPosition('bottom');
            }
        }
    };

    const handleFocus = () => {
        if (inputValue && predictions.length > 0) {
            setIsOpen(true);
        }
        ensureVisibility();
        // Only scroll on explicit focus, not while typing
        setTimeout(() => {
            if (wrapperRef.current) {
                wrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    };

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val);

        if (!val || val.length < 3) {
            setPredictions([]);
            setIsOpen(false);
            return;
        }

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set a new timer (Debounce for 500ms)
        debounceTimerRef.current = setTimeout(async () => {
            // Re-check visibility (positioning only) when typing creates new results
            ensureVisibility();

            setIsLoading(true);

            try {
                const google = await loadGoogleMaps();
                if (!google) throw new Error("Google Maps SDK not available");

                // Initialize Session Token if needed
                if (!sessionTokenRef.current) {
                    sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
                }

                const service = new google.maps.places.AutocompleteService();
                const request: google.maps.places.AutocompletionRequest = {
                    input: val,
                    componentRestrictions: { country: 'in' },
                    sessionToken: sessionTokenRef.current,
                };

                service.getPlacePredictions(request, (results, status) => {
                    setIsLoading(false);
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        setPredictions(results);
                        setIsOpen(true);
                        ensureVisibility();
                    } else {
                        setPredictions([]);
                        setIsOpen(false);
                    }
                });
            } catch (error) {
                console.warn('[PlacesAutocomplete] API Error (Falling back to manual input):', error);
                setIsLoading(false);
                setPredictions([]);
                setIsOpen(false);
            }
        }, 500); // 500ms debounce delay
    };

    const handlePlaceSelect = async (placeId: string, description: string) => {
        setInputValue(description);
        onChange(description);
        setIsOpen(false);
        setPredictions([]);

        if (onPlaceSelected) {
            try {
                const google = await loadGoogleMaps();
                if (!google) return;

                // Use PlacesService to get details (concludes the billing session)
                if (!placesServiceRef.current) {
                    placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
                }

                const request: google.maps.places.PlaceDetailsRequest = {
                    placeId: placeId,
                    fields: ['geometry', 'formatted_address'],
                    sessionToken: sessionTokenRef.current || undefined
                };

                placesServiceRef.current.getDetails(request, (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        const formattedAddress = place.formatted_address || description;

                        onPlaceSelected({
                            address: formattedAddress,
                            lat,
                            lng
                        });

                        // Update input with full formatted address
                        setInputValue(formattedAddress);
                        onChange(formattedAddress);

                        // Reset Session Token for next search
                        sessionTokenRef.current = null;

                    } else {
                        console.error('Places Details fetch failed status:', status);
                    }
                });

            } catch (error) {
                console.error('Error fetching place details:', error);
            }
        }
    };

    return (
        <div className="space-y-1 w-full relative" ref={wrapperRef}>
            {/* ... label ... */}
            {label && (
                <label htmlFor={id} className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1.5">
                    {icon} {label}
                </label>
            )}

            <div className="relative group">
                {/* Removed duplicate internal MapPin icon */}


                {onMapClick && (
                    <button
                        type="button"
                        onClick={onMapClick}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors z-10"
                        title="Select on map"
                    >
                        <Map size={14} />
                    </button>
                )}

                <input
                    id={id}
                    name={id}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={onBlur}
                    className={className || `tn-input h-9 w-full bg-slate-50 border-slate-200 text-xs font-bold ${onMapClick ? 'pl-9' : 'pl-3'} pr-8`}
                    placeholder={placeholder || "Start typing..."}
                    autoComplete="off"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    {inputValue && (
                        <button
                            type="button"
                            onClick={() => {
                                setInputValue('');
                                onChange('');
                                setPredictions([]);
                                setIsOpen(false);
                            }}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                        >
                            <X size={14} />
                        </button>
                    )}
                    {rightContent}
                </div>

                {/* Custom Dropdown */}
                {isOpen && predictions.length > 0 && (
                    <div className={`absolute left-0 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto ${dropdownPosition === 'top'
                        ? 'bottom-full mb-1'
                        : 'top-full mt-1'
                        }`}>
                        {predictions.map((prediction) => (
                            <button
                                key={prediction.place_id}
                                type="button"
                                onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-start gap-2.5 transition-colors border-b border-slate-50 last:border-0"
                            >
                                <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                        {prediction.structured_formatting.main_text}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">
                                        {prediction.structured_formatting.secondary_text}
                                    </p>
                                </div>
                            </button>
                        ))}
                        <div className="px-3 py-1 bg-slate-50 text-[9px] text-slate-400 text-right uppercase tracking-widest font-bold">
                            Powered by Google
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlacesAutocomplete;
