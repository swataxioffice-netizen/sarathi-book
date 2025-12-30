import React, { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';
import { Map } from 'lucide-react';

interface PlacesAutocompleteProps {
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
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        const initAutocomplete = async () => {
            try {
                const google = await loadGoogleMaps();

                if (!inputRef.current) return;

                // Initialize autocomplete
                autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
                    componentRestrictions: { country: 'in' }, // Restrict to India
                    fields: ['formatted_address', 'geometry', 'name'],
                });

                // Listen for place selection
                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current?.getPlace();

                    if (place && place.geometry && place.geometry.location) {
                        const address = place.formatted_address || place.name || '';
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();

                        onChange(address);

                        if (onPlaceSelected) {
                            onPlaceSelected({ address, lat, lng });
                        }
                    }
                });

            } catch (error) {
                console.error('Failed to initialize Places Autocomplete:', error);
            }
        };

        initAutocomplete();

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-1 w-full">
            {label && (
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    {icon} {label}
                </label>
            )}
            <div className="relative">
                {onMapClick && (
                    <button
                        type="button"
                        onClick={onMapClick}
                        className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors z-10"
                        title="Select on map"
                    >
                        <Map size={18} />
                    </button>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    className={className || `tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs ${onMapClick ? 'pl-10' : 'pl-3'} pr-10`}
                    placeholder={placeholder || "Start typing..."}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {rightContent}
                </div>
            </div>
        </div>
    );
};

export default PlacesAutocomplete;
