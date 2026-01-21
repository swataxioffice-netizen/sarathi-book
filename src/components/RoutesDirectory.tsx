import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import SEOHead from './SEOHead';
import { Search, MapPin, ExternalLink } from 'lucide-react';

interface RouteData {
    pickup_location: string;
    drop_location: string;
    vehicle_type: string;
    trip_type: string;
    distance_km: number;
}

const RoutesDirectory = () => {
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAllRoutes = async () => {
            try {
                // Fetch last 1000 searches to build a decent directory
                // We use 'distinct' logically by processing client side for now as Supabase distinct() is specific
                const { data, error } = await supabase
                    .from('route_searches')
                    .select('pickup_location, drop_location, vehicle_type, trip_type, distance_km')
                    .order('created_at', { ascending: false })
                    .limit(1000);

                if (error) throw error;

                if (data) {
                    setRoutes(data);
                }
            } catch (err) {
                console.error("Failed to fetch routes directory:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllRoutes();
    }, []);

    // Group Routes by Pickup City
    const groupedRoutes = useMemo(() => {
        const uniqueKeys = new Set();
        const groups: Record<string, RouteData[]> = {};

        routes.forEach(route => {
            if (!route.pickup_location || !route.drop_location) return;

            // Create a unique key to avoid duplicate links in the list
            const key = `${route.pickup_location.toLowerCase()}-${route.drop_location.toLowerCase()}-${route.vehicle_type}`;
            if (uniqueKeys.has(key)) return;
            uniqueKeys.add(key);

            const city = route.pickup_location.split(',')[0].trim();
            if (!groups[city]) {
                groups[city] = [];
            }
            groups[city].push(route);
        });

        // Filter by Search
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            const filteredGroups: Record<string, RouteData[]> = {};

            Object.keys(groups).forEach(city => {
                // Match City Name OR Any destination in that city's group
                const cityMatch = city.toLowerCase().includes(lowerSearch);
                const matchingRoutes = groups[city].filter(r =>
                    cityMatch ||
                    r.drop_location.toLowerCase().includes(lowerSearch)
                );

                if (matchingRoutes.length > 0) {
                    filteredGroups[city] = matchingRoutes;
                }
            });
            return filteredGroups;
        }

        return groups;
    }, [routes, searchTerm]);

    const normalize = (str: string) => encodeURIComponent(str || '');

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <SEOHead
                title="All Cab Routes Directory | Sarathi Book"
                description="Browse our complete directory of taxi routes and fare estimates. Find cabs from Chennai, Bangalore, Coimbatore, and more to any destination."
            />

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full -ml-10 -mb-10 blur-3xl"></div>

                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4 relative z-10">
                    Route Directory
                </h1>
                <p className="text-slate-400 font-medium max-w-2xl mx-auto mb-8 relative z-10">
                    Explore our extensive network of cab routes. Compare fares and book instantly for thousands of destinations across South India.
                </p>

                <div className="max-w-md mx-auto relative z-10">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search city or destination..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 transition-all font-bold"
                        />
                    </div>
                </div>
            </div>

            {/* Directory Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                </div>
            ) : Object.keys(groupedRoutes).length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <p>No routes found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {Object.keys(groupedRoutes).sort().map(city => (
                        <div key={city} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <MapPin size={20} />
                                </div>
                                <span className="uppercase tracking-wide">From {city}</span>
                                <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                                    {groupedRoutes[city].length} Routes
                                </span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {groupedRoutes[city].map((route, idx) => (
                                    <a
                                        key={idx}
                                        href={`/taxi-fare-calculator?from=${normalize(route.pickup_location)}&to=${normalize(route.drop_location)}&distance=${route.distance_km}&vehicle=${route.vehicle_type?.toLowerCase() || 'sedan'}&type=${route.trip_type || 'oneway'}`}
                                        className="group block p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all bg-slate-50/50 hover:bg-white"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-500 transition-colors">
                                                To {route.drop_location.split(',')[0]}
                                            </span>
                                            <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors line-clamp-1 mb-1">
                                            {route.drop_location.split(',')[0]}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                            <span>{Math.round(route.distance_km)} km</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="capitalize">{route.vehicle_type || 'Cab'}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoutesDirectory;
