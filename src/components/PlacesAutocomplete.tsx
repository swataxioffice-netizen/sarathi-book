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
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
    value,
    onChange,
    onPlaceSelected,
    onMapClick,
    placeholder,
    className,
    label,
    icon
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
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={className || "tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs pr-10"}
                    placeholder={placeholder || "Start typing..."}
                />
                {onMapClick && (
                    <button
                        type="button"
                        onClick={onMapClick}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-md transition-colors"
                        title="Select on map"
                    >
                        <Map size={16} className="text-slate-500" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlacesAutocomplete;
