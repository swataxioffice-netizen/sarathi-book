import { useState } from 'react';
import { VEHICLES, type VehicleType } from '../config/vehicleRates';
import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';
import SEOHead from './SEOHead';
import {
    ArrowRight, Check, ShieldCheck, BadgeIndianRupee, Clock,
    AlertTriangle, Moon, Share2, FileDown, User, X
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { generateQuotationPDF } from '../utils/pdf';
import { format } from 'date-fns';
import { generateId } from '../utils/uuid';

import { useAuth } from '../contexts/AuthContext';

const TariffPage = () => {
    const title = "Chennai Cab Tariff & Rates | 2025 Official Price List - Sarathi Book";
    const description = "Transparent cab tariff in Chennai. Check official rates for Hatchback, Sedan, SUV, Tempo Traveller, and Load Vehicles (Tata Ace, Bada Dost). One-way drop from ₹13/km. No hidden charges.";

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

    const { settings } = useSettings();
    const { user } = useAuth();
    const [customRates, setCustomRates] = useState<Record<string, { drop: number; round: number }>>(() => {
        const rates: Record<string, { drop: number; round: number }> = {};
        VEHICLES.forEach(v => {
            rates[v.id] = { drop: v.dropRate, round: v.roundRate };
        });
        return rates;
    });

    // Quotation Modal State
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleRateChange = (vehicleId: string, type: 'drop' | 'round', value: string) => {
        const numValue = parseFloat(value) || 0;
        setCustomRates(prev => ({
            ...prev,
            [vehicleId]: {
                ...prev[vehicleId],
                [type]: numValue
            }
        }));
    };

    const handleGenerateQuote = async () => {
        if (!selectedVehicle || !customerName) return;
        setIsGenerating(true);
        try {
            const rates = customRates[selectedVehicle.id];
            const doc = await generateQuotationPDF({
                customerName,
                customerAddress: `Phone: ${customerPhone}`,
                subject: `Tariff Quote for ${selectedVehicle.name}`,
                date: format(new Date(), 'yyyy-MM-dd'),
                quotationNo: `QT-${generateId().slice(0, 6).toUpperCase()}`,
                items: [
                    {
                        description: `${selectedVehicle.name} - One Way Drop Rate`,
                        package: 'One Way',
                        vehicleType: selectedVehicle.name,
                        rate: `${rates.drop}/km`,
                        amount: '0', // It's a tariff card, not a fixed bill
                        sac: '9966'
                    },
                    {
                        description: `${selectedVehicle.name} - Round Trip Rate`,
                        package: 'Round Trip',
                        vehicleType: selectedVehicle.name,
                        rate: `${rates.round}/km`,
                        amount: '0',
                        sac: '9966'
                    },
                    {
                        description: `Driver Batta (Per Day)`,
                        package: 'Mandatory',
                        vehicleType: selectedVehicle.name,
                        rate: `₹${selectedVehicle.batta}`,
                        amount: '0'
                    }
                ],
                terms: [
                    `Minimum running ${selectedVehicle.minKm} KM per day for round trips.`,
                    `Toll, Parking and State Permit charges extra at actuals.`,
                    `Night driving allowance (10PM-6AM) ₹${selectedVehicle.nightCharge} applicable.`,
                    `Kilometer and time will be calculated from shed to shed.`
                ]
            }, {
                companyName: settings.companyName,
                companyAddress: settings.companyAddress,
                driverPhone: settings.driverPhone,
                gstin: settings.gstin,
                gstEnabled: settings.gstEnabled,
                appColor: settings.appColor,
                signatureUrl: settings.signatureUrl,
                userId: user?.id || '',
                showWatermark: settings.showWatermark,
                vehicleNumber: ''
            });
            doc.save(`Quote_${customerName.replace(/\s+/g, '_')}_${selectedVehicle.name}.pdf`);
            setIsQuoteModalOpen(false);
            setCustomerName('');
            setCustomerPhone('');
        } catch (error) {
            console.error('Error generating quote:', error);
            alert('Failed to generate quotation. Please check your settings and try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            <SEOHead
                title={title}
                description={description}
                schema={[priceSchema, tableSchema]}
            />

            {/* Hero Section */}
            <div className="bg-[#0047AB] text-white pt-10 pb-4 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-wider mb-1">
                        Tamil Nadu Tariff
                    </h1>
                    <p className="text-blue-100 text-[10px] md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-2.5">
                        Official Union Rates. Zero Commission. 100% Direct to Drivers.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                        <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse"></div>
                        <span className="text-[8px] font-bold text-blue-50 tracking-wide uppercase">Other states coming soon</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-2 -mt-3">

                {/* Trust Indicators - Horizontal Scroller for Mobile */}
                <div className="flex md:grid md:grid-cols-3 overflow-x-auto gap-2 md:gap-4 mb-6 scrollbar-hide -mx-1 px-1">
                    {[
                        { icon: ShieldCheck, text: "Government Verified Rates" },
                        { icon: BadgeIndianRupee, text: "No Hidden Charges" },
                        { icon: Check, text: "Includes Toll & Permit Estimates" }
                    ].map((item, i) => (
                        <div key={i} className="flex-none md:flex-1 bg-white p-2.5 md:p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2.5 md:gap-3 min-w-[150px] md:min-w-0 md:justify-center">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <item.icon size={14} className="md:w-4 md:h-4" />
                            </div>
                            <span className="font-bold text-slate-700 text-[9px] md:text-sm uppercase tracking-wide whitespace-nowrap md:whitespace-normal">{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Rate Table (Desktop) */}
                <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
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
                                            <div className="relative inline-block w-20">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                                <input 
                                                    type="number" 
                                                    value={customRates[v.id]?.drop}
                                                    onChange={(e) => handleRateChange(v.id, 'drop', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-1 py-1 text-sm font-black text-slate-800 outline-none focus:border-blue-400 text-center"
                                                />
                                            </div>
                                            <span className="block text-[8px] text-slate-400 font-bold uppercase mt-0.5">per km</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="relative inline-block w-20">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                                <input 
                                                    type="number" 
                                                    value={customRates[v.id]?.round}
                                                    onChange={(e) => handleRateChange(v.id, 'round', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-1 py-1 text-sm font-black text-slate-800 outline-none focus:border-blue-400 text-center"
                                                />
                                            </div>
                                            <span className="block text-[8px] text-slate-400 font-bold uppercase mt-0.5">per km</span>
                                        </td>
                                        <td className="p-4 text-right hidden md:table-cell">
                                            <span className="font-bold text-slate-700">₹{v.batta}</span>
                                        </td>
                                        <td className="p-4 text-right hidden md:table-cell">
                                            <span className="font-bold text-slate-700">{v.minKm} KM</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <a
                                                    href={`/calculator/cab`}
                                                    className="inline-flex items-center gap-1 bg-[#0047AB] text-white px-3 py-2.5 rounded-xl shadow-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all active:scale-[0.98]"
                                                >
                                                    Calc
                                                    <ArrowRight size={10} />
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setSelectedVehicle(v);
                                                        setIsQuoteModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-2.5 rounded-xl shadow-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-[0.98]"
                                                >
                                                    <Share2 size={10} />
                                                    Quote
                                                </button>
                                            </div>
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



                {/* Mobile Rate Cards */}
                <div className="md:hidden space-y-2.5 mb-6">
                    {VEHICLES.map((v) => (
                        <div key={v.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-2.5">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-700">{v.name}</h3>
                                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{v.popularModels}</p>
                                </div>
                                <div className="bg-blue-50 px-2 py-0.5 rounded text-right">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Min Km/Day</p>
                                    <p className="font-bold text-slate-700 text-xs">{v.minKm} KM</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-2.5">
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">One Way</p>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-slate-400">₹</span>
                                        <input 
                                            type="number" 
                                            value={customRates[v.id]?.drop}
                                            onChange={(e) => handleRateChange(v.id, 'drop', e.target.value)}
                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none"
                                        />
                                        <span className="text-[8px] text-slate-400 font-medium whitespace-nowrap">/ km</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Round Trip</p>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-slate-400">₹</span>
                                        <input 
                                            type="number" 
                                            value={customRates[v.id]?.round}
                                            onChange={(e) => handleRateChange(v.id, 'round', e.target.value)}
                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none"
                                        />
                                        <span className="text-[8px] text-slate-400 font-medium whitespace-nowrap">/ km</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="text-[9px] font-bold text-slate-500">
                                    Driver Bata: <span className="text-slate-700 font-bold">₹{v.batta}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/taxi-fare-calculator`}
                                        className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98]"
                                    >
                                        Calc
                                        <ArrowRight size={10} />
                                    </a>
                                    <button
                                        onClick={() => {
                                            setSelectedVehicle(v);
                                            setIsQuoteModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-sm text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-[0.98]"
                                    >
                                        <Share2 size={10} />
                                        Quote
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Local Hourly Packages Table (Desktop) */}
                <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-12">
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

                {/* Mobile Hourly Cards */}
                <div className="md:hidden space-y-3 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                <Clock size={16} className="text-blue-600" />
                                Local Packages
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Hourly rentals for city use</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {Object.entries(TARIFFS.vehicles).map(([key, data]) => (
                                <div key={key} className="p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-slate-700 capitalize text-sm">{data.name}</h3>
                                        <span className="text-[8px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-lg">
                                            Extra: ₹{data.extra_hr_rate}/hr
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-blue-50/50 p-1.5 rounded-lg border border-blue-100">
                                            <p className="text-[8px] font-medium text-blue-500 uppercase mb-0.5">4 Hr</p>
                                            <p className="font-bold text-slate-700 text-xs">₹{data.local_4hr_pkg}</p>
                                        </div>
                                        <div className="bg-blue-50/50 p-1.5 rounded-lg border border-blue-100">
                                            <p className="text-[8px] font-medium text-blue-500 uppercase mb-0.5">8 Hr</p>
                                            <p className="font-bold text-slate-700 text-xs">₹{data.local_8hr_pkg}</p>
                                        </div>
                                        <div className="bg-blue-50/50 p-1.5 rounded-lg border border-blue-100">
                                            <p className="text-[8px] font-medium text-blue-500 uppercase mb-0.5">12 Hr</p>
                                            <p className="font-bold text-slate-700 text-xs">₹{data.local_12hr_pkg}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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

            {/* Quotation Modal */}
            {isQuoteModalOpen && selectedVehicle && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsQuoteModalOpen(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl animate-zoom-in" onClick={e => e.stopPropagation()}>
                        <div className="bg-emerald-600 p-6 text-white text-center relative">
                            <button 
                                onClick={() => setIsQuoteModalOpen(false)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                                <FileDown size={32} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Generate Quote</h3>
                            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">Professional Letterhead Export</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Selected Model</p>
                                    <p className="text-sm font-black text-slate-800 uppercase">{selectedVehicle.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-600">₹{customRates[selectedVehicle.id].drop}/km</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Custom Rate</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Customer Name</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                                        <User size={16} />
                                    </span>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="w-full h-12 bg-slate-50 rounded-2xl pl-10 pr-4 font-bold text-sm border-2 border-transparent focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    placeholder="e.g. 9876543210"
                                    className="w-full h-12 bg-slate-50 rounded-2xl px-4 font-bold text-sm border-2 border-transparent focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={handleGenerateQuote}
                                disabled={!customerName || isGenerating}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[18px] font-black uppercase text-[12px] tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                            >
                                {isGenerating ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Designing...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Share2 size={18} />
                                        Share PDF Quote
                                    </>
                                )}
                            </button>
                            <p className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-wider">Includes terms & signature automatically</p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default TariffPage;
