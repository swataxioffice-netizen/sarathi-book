import { VEHICLES } from '../config/vehicleRates';
import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';
import SEOHead from './SEOHead';
import { ArrowRight, Check, ShieldCheck, BadgeIndianRupee, Clock, AlertTriangle, Moon } from 'lucide-react';

const TariffPage = () => {
    const title = "Chennai Cab Tariff & Rates | 2025 Official Price List - Sarathi Book";
    const description = "Transparent cab tariff in Chennai. Check official rates for Hatchback, Sedan, SUV, and Tempo Traveller. One-way drop from ₹13/km. No hidden charges.";

    // Generate Price Specification Schema
    const priceSchema = {
        "@context": "https://schema.org",
        "@type": "PriceSpecification",
        "priceCurrency": "INR",
        "eligibleQuantity": {
            "@type": "QuantitativeValue",
            "value": 1,
            "unitCode": "KMT"
        }
    };

    const tableSchema = {
        "@context": "https://schema.org",
        "@type": "Table",
        "about": "Cab Services Tariff",
        "description": "Standard rates for different vehicle types including drop and round trip charges."
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            <SEOHead
                title={title}
                description={description}
                schema={[priceSchema, tableSchema]}
            />

            {/* Hero Section */}
            <div className="bg-[#0047AB] text-white pt-24 pb-12 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider mb-4">
                        Transparent Tariff
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Official Union Rates. Zero Commission. 100% Direct to Drivers.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 -mt-8">

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { icon: ShieldCheck, text: "Government Verified Rates" },
                        { icon: BadgeIndianRupee, text: "No Hidden Charges" },
                        { icon: Check, text: "Includes Toll & Permit Estimates" }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <item.icon size={16} />
                            </div>
                            <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Rate Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Vehicle Type</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">One Way Drop</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Round Trip</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right hidden md:table-cell">Driver Bata</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right hidden md:table-cell">Min Km/Day</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {VEHICLES.map((v) => (
                                    <tr key={v.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 text-base">{v.name}</div>
                                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{v.popularModels}</div>
                                            <div className="md:hidden mt-1 text-xs text-slate-500">
                                                Bata: ₹{v.batta} | Min: {v.minKm}km
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="block font-black text-slate-800 text-lg">₹{v.dropRate}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">per km</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="block font-black text-slate-800 text-lg">₹{v.roundRate}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">per km</span>
                                        </td>
                                        <td className="p-4 text-right hidden md:table-cell">
                                            <span className="font-bold text-slate-700">₹{v.batta}</span>
                                        </td>
                                        <td className="p-4 text-right hidden md:table-cell">
                                            <span className="font-bold text-slate-700">{v.minKm} KM</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <a
                                                href={`/calculator/cab`}
                                                className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-colors"
                                            >
                                                Calculate
                                                <ArrowRight size={12} />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                        * Rates are subject to change based on fuel prices. Hill station charges extra.
                    </div>
                </div>



                {/* Local Hourly Packages Table (NEW) */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-12">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <Clock size={20} className="text-blue-600" />
                            Local Hourly Rentals
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">Perfect for city usage, shopping, and business meetings.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-blue-50/50 border-b border-blue-100">
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Vehicle</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">4 Hr / 40 Km</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">8 Hr / 80 Km</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">12 Hr / 120 Km</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Extra Hr</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(TARIFFS.vehicles).map(([key, data]) => (
                                    <tr key={key} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 capitalize">{data.name}</div>
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-700">₹{data.local_4hr_pkg}</td>
                                        <td className="p-4 text-right font-bold text-slate-700">₹{data.local_8hr_pkg}</td>
                                        <td className="p-4 text-right font-bold text-slate-700">₹{data.local_12hr_pkg}</td>
                                        <td className="p-4 text-right font-bold text-slate-500">₹{data.extra_hr_rate}/hr</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Rental Policies & Limits */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <ShieldCheck size={20} className="text-green-600" />
                            Rental Policies & Limits
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">Max Driving Limit</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        For safety reasons, a single driver is limited to driving a maximum of <span className="font-black text-slate-900">{TRIP_LIMITS.max_km_per_day} KM per day</span>.
                                        For trips exceeding this limit, a second driver or identifying a layover is mandatory.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Moon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">Night Charges</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Driver Night Allowance is applicable if the trip happens between <span className="font-black text-slate-900">10:00 PM and 6:00 AM</span>.
                                        This ensures our drivers are compensated for late-night shifts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                        <h3 className="font-black text-orange-900 uppercase tracking-wide mb-2">Did you know?</h3>
                        <p className="text-sm text-orange-800 leading-relaxed">
                            For one-way drop trips, you only pay for the distance travelled one way! Most other operators charge round-trip fare for one-way drops. Sarathi Book saves you up to 40%.
                        </p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                        <h3 className="font-black text-green-900 uppercase tracking-wide mb-2">Zero Commission</h3>
                        <p className="text-sm text-green-800 leading-relaxed">
                            We don't take a cut from drivers. This ensures you get the lowest possible market rate and drivers earn their fair share. It's a win-win.
                        </p>
                    </div>
                </div>
            </main >
        </div >
    );
};

export default TariffPage;
