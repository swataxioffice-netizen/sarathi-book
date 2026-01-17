import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Car, ArrowRight, RotateCcw } from 'lucide-react';
import SEOHead from './SEOHead';

const TrendingRoutes: React.FC = () => {
    const [trendingRoutes, setTrendingRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const { data, error } = await supabase
                    .from('route_searches')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;

                if (data && data.length > 0) {
                    const counts: Record<string, any> = {};

                    data.forEach(row => {
                        const key = `${row.pickup_location?.trim()}-${row.drop_location?.trim()}`;
                        if (!row.pickup_location || !row.drop_location) return;

                        if (!counts[key]) {
                            counts[key] = {
                                from: row.pickup_location,
                                to: row.drop_location,
                                type: row.trip_type === 'roundtrip' ? 'Round Trip' : 'One Way',
                                mode: row.trip_type,
                                dist: row.distance_km,
                                fare: row.estimated_fare,
                                veh: row.vehicle_type,
                                count: 0
                            };
                        }
                        counts[key].count++;
                    });

                    const sorted = Object.values(counts)
                        .sort((a: any, b: any) => b.count - a.count);

                    setTrendingRoutes(sorted);
                }
            } catch (err) {
                console.error('Error fetching trending routes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, []);

    return (
        <div className="space-y-6 pb-24 animate-fade-in">
            <SEOHead
                title="Most Calculated Cab Routes | Popular Taxi Fares India"
                description="View the most popular cab routes and taxi fare estimates in India. Check prices for trending outstation and local trips."
            />

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0047AB]">
                        <RotateCcw size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">Most Calculated Routes</h2>
                        <p className="text-xs text-slate-500 font-medium">Top trending routes searched by other users</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trendingRoutes.map((route, idx) => (
                            <a
                                key={idx}
                                href={`/calculator/cab?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&dist=${route.dist}&veh=${route.veh?.toLowerCase()}&type=${route.mode === 'roundtrip' ? 'roundtrip' : 'oneway'}`}
                                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer active:scale-[0.99] group block"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-800 text-sm truncate flex-1">
                                            {route.from}
                                        </h4>
                                        <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <h4 className="font-bold text-slate-800 text-sm truncate flex-1 text-right">
                                            {route.to}
                                        </h4>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                                <Car size={10} />
                                                {route.veh}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${route.mode === 'roundtrip' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                {route.mode === 'roundtrip' ? 'Round Trip' : 'Drop Trip'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-end">
                                    <span className="text-[10px] font-medium text-slate-400">{route.dist} km approx</span>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-slate-900 block leading-none">₹{route.fare.toLocaleString()}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 text-center pb-8">
                <a href="/routes" className="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider bg-blue-50 px-6 py-3 rounded-full hover:bg-blue-100">
                    View Full Routes Directory <ArrowRight size={16} />
                </a>
            </div>
        </div>
    );
};

export default TrendingRoutes;
