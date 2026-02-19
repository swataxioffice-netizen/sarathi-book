import React, { useMemo } from 'react';
import Calculator from './Calculator';
import SEOHead from './SEOHead';

interface RouteLandingPageProps {
    slug: string;
}

const RouteLandingPage: React.FC<RouteLandingPageProps> = ({ slug }) => {

    // Parse the slug: "chennai-to-bangalore-taxi" -> { from: "Chennai", to: "Bangalore", vehicle: ... }
    const routeData = useMemo(() => {
        try {
            // Remove leading slash if present
            const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;

            // Pattern 1: City to City (chennai-to-bangalore-taxi)
            const toIndex = cleanSlug.indexOf('-to-');
            if (toIndex !== -1) {
                const parts = cleanSlug.split('-');
                const toPartIndex = parts.indexOf('to');

                // Reconstruct city names (handling multi-word cities like "new-delhi")
                const fromParts = parts.slice(0, toPartIndex);
                const restParts = parts.slice(toPartIndex + 1);

                // Check for suffix like "-taxi", "-cab" at the end
                const vehicle = 'sedan'; // default
                const lastPart = restParts[restParts.length - 1];

                const suffixes = ['taxi', 'cab', 'cabs', 'rental'];
                if (suffixes.includes(lastPart)) {
                    restParts.pop(); // remove suffix
                }

                // Check for vehicle type in the rest (e.g. bangalore-innova-taxi)
                // This is a simple parser; can be enhanced.

                const fromCity = fromParts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                const toCity = restParts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

                return {
                    from: fromCity,
                    to: toCity,
                    vehicle
                };
            }

            // Pattern 2: Service (outstation-cabs) - fallback
            // We might just map this to the calculator with no specific route
            return null;
        } catch (error) {
            console.error("Failed to parse route slug", error);
            return null;
        }
    }, [slug]);

    if (!routeData) {
        // Fallback if parsing fails
        return <Calculator />;
    }

    const title = `${routeData.from} to ${routeData.to} Taxi Fare - Book Online | Sarathi Book`;
    const description = `Book Safe & Reliable Taxi from ${routeData.from} to ${routeData.to}. Check fare estimate, distance, and book ${routeData.vehicle} instantly. Best rates for outstation cabs.`;

    return (
        <div className="animate-fade-in">
            <SEOHead
                title={title}
                description={description}
                canonical={`https://sarathibook.com/${slug}`}
            />
            {/* We pass undefined for vehicle to let Calculator decide or use default, unless we parsed a specific vehicle */}
            <Calculator
                initialPickup={routeData.from}
                initialDrop={routeData.to}
            />

            {/* Additional Route Content for SEO/Ads */}
            <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-6 leading-none border-l-4 border-blue-600 pl-4">
                    About {routeData.from} to {routeData.to} Taxi Service
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            Traveling from {routeData.from} to {routeData.to} by road is a popular choice for many travelers in India. Whether you are traveling for business, a family vacation, or a quick weekend getaway, our taxi fare calculator provides the most accurate and transparent pricing for this route.
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            We offer a variety of vehicles including compact hatchbacks, comfortable sedans like Swift Dzire, spacious SUVs like Toyota Innova, and larger Tempo Travellers for group travel.
                        </p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">Trip Information</h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold uppercase tracking-wider">Estimated Distance</span>
                                <span className="text-slate-900 font-black uppercase tracking-wider">Calculated in real-time</span>
                            </li>
                            <li className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold uppercase tracking-wider">Best for</span>
                                <span className="text-slate-900 font-black uppercase tracking-wider underline decoration-blue-500">Outstation / Drop Trip</span>
                            </li>
                            <li className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold uppercase tracking-wider">Pricing model</span>
                                <span className="text-slate-900 font-black uppercase tracking-wider">Transparent per KM</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Safe Travel</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Verified professional drivers.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Fixed Price</h4>
                            <p className="text-[10px] text-slate-500 font-medium">No hidden surcharges or commissions.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Best Rates</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Compare and find the lowest fare.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteLandingPage;
