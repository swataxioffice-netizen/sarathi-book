import { VEHICLES } from '../config/vehicleRates';
import SEOHead from './SEOHead';
import { ArrowRight, Check, ShieldCheck, BadgeIndianRupee } from 'lucide-react';

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
                                                href={`/calculator?vehicle=${v.id}`}
                                                className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-colors"
                                            >
                                                Book
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
            </main>
        </div>
    );
};

export default TariffPage;
