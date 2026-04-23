import { useState } from 'react';
import { VEHICLES } from '../config/vehicleRates';
import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';
import SEOHead from './SEOHead';
import {
    ArrowRight, Check, ShieldCheck, BadgeIndianRupee, Clock,
    AlertTriangle, Moon, Car, ChevronDown, ChevronUp, Pencil, RotateCcw
} from 'lucide-react';

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

    const [customRates, setCustomRates] = useState<Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }>>(() => {
        try {
            const saved = localStorage.getItem('sarathi_custom_rates');
            if (saved) return JSON.parse(saved);
        } catch {}
        const rates: Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }> = {};
        VEHICLES.forEach(v => {
            const t = TARIFFS.vehicles[v.id as keyof typeof TARIFFS.vehicles];
            rates[v.id] = { drop: v.dropRate, round: v.roundRate, bata: v.batta, pkg4hr: t?.local_4hr_pkg ?? 0, pkg8hr: t?.local_8hr_pkg ?? 0, pkg12hr: t?.local_12hr_pkg ?? 0, extraHr: t?.extra_hr_rate ?? 0 };
        });
        return rates;
    });

    const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

    const handleRateChange = (vehicleId: string, type: 'drop' | 'round' | 'bata' | 'pkg4hr' | 'pkg8hr' | 'pkg12hr' | 'extraHr', value: string) => {
        const numValue = parseFloat(value) || 0;
        setCustomRates(prev => {
            const updated = { ...prev, [vehicleId]: { ...prev[vehicleId], [type]: numValue } };
            try { localStorage.setItem('sarathi_custom_rates', JSON.stringify(updated)); } catch {}
            return updated;
        });
    };

    const handleResetRates = () => {
        const defaults: Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }> = {};
        VEHICLES.forEach(v => {
            const t = TARIFFS.vehicles[v.id as keyof typeof TARIFFS.vehicles];
            defaults[v.id] = { drop: v.dropRate, round: v.roundRate, bata: v.batta, pkg4hr: t?.local_4hr_pkg ?? 0, pkg8hr: t?.local_8hr_pkg ?? 0, pkg12hr: t?.local_12hr_pkg ?? 0, extraHr: t?.extra_hr_rate ?? 0 };
        });
        setCustomRates(defaults);
        try { localStorage.removeItem('sarathi_custom_rates'); } catch {}
    };

    const isRateModified = (vehicleId: string) => {
        const v = VEHICLES.find(x => x.id === vehicleId);
        if (!v) return false;
        const t = TARIFFS.vehicles[vehicleId as keyof typeof TARIFFS.vehicles];
        const c = customRates[vehicleId];
        return c?.drop !== v.dropRate || c?.round !== v.roundRate || c?.bata !== v.batta
            || c?.pkg4hr !== t?.local_4hr_pkg || c?.pkg8hr !== t?.local_8hr_pkg || c?.pkg12hr !== t?.local_12hr_pkg || c?.extraHr !== t?.extra_hr_rate;
    };

    const hasAnyModified = VEHICLES.some(v => isRateModified(v.id));

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            <SEOHead
                title={title}
                description={description}
                schema={[priceSchema, tableSchema]}
            />

            {/* Hero Section */}
            <div className="bg-primary text-white pt-10 pb-4 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-wider mb-1">
                        Your Tariff Card
                    </h1>
                    <p className="text-blue-100 text-[10px] md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-2.5">
                        Set your own rates & bata. Share with customers instantly.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                        <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse"></div>
                        <span className="text-[8px] font-bold text-blue-50 tracking-wide uppercase">Tap any value below to edit</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-2 -mt-3">

                {/* Trust Indicators - Horizontal Scroller for Mobile */}
                <div className="flex md:grid md:grid-cols-3 overflow-x-auto gap-2 md:gap-4 mb-6 scrollbar-hide -mx-1 px-1">
                    {[
                        { icon: Pencil, text: "Edit Any Rate or Bata" },
                        { icon: BadgeIndianRupee, text: "Saved to Your Device" },
                        { icon: Check, text: "Your Prices, Your Control" }
                    ].map((item, i) => (
                        <div key={i} className="flex-none md:flex-1 bg-white p-2.5 md:p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2.5 md:gap-3 min-w-[150px] md:min-w-0 md:justify-center">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <item.icon size={14} className="md:w-4 md:h-4" />
                            </div>
                            <span className="font-bold text-slate-700 text-[9px] md:text-sm uppercase tracking-wide whitespace-nowrap md:whitespace-normal">{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Custom Rates Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 mb-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Pencil size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-blue-900 text-xs uppercase tracking-wide">Set Your Own Rates</h3>
                        <p className="text-[11px] text-blue-700 font-medium mt-0.5 leading-relaxed">
                            Tap any rate or bata value below to enter your own price. Changes are saved to this device automatically.
                        </p>
                    </div>
                    {hasAnyModified && (
                        <button
                            onClick={handleResetRates}
                            className="flex items-center gap-1 text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-wider border border-blue-200 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
                        >
                            <RotateCcw size={10} />
                            Reset
                        </button>
                    )}
                </div>

                {/* Rate Table (Desktop) */}
                <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Vehicle Type</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">
                                        <span className="flex items-center justify-end gap-1">One Way Drop <Pencil size={9} className="text-blue-400" /></span>
                                    </th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">
                                        <span className="flex items-center justify-end gap-1">Round Trip <Pencil size={9} className="text-blue-400" /></span>
                                    </th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right hidden md:table-cell">
                                        <span className="flex items-center justify-end gap-1">Driver Bata <Pencil size={9} className="text-blue-400" /></span>
                                    </th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right hidden md:table-cell">Min Km/Day</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {VEHICLES.map((v) => (
                                    <tr key={v.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-slate-800 text-base">{v.name}</div>
                                                {isRateModified(v.id) && (
                                                    <span className="text-[7px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Custom</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{v.popularModels}</div>
                                            <div className="md:hidden mt-1 text-xs text-slate-500">
                                                Bata: ₹{customRates[v.id]?.bata ?? v.batta} | Min: {v.minKm}km
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
                                            <div className="relative inline-block w-24">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={customRates[v.id]?.bata ?? v.batta}
                                                    onChange={(e) => handleRateChange(v.id, 'bata', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-1 py-1 text-sm font-black text-slate-800 outline-none focus:border-blue-400 text-center"
                                                />
                                            </div>
                                            <span className="block text-[8px] text-slate-400 font-bold uppercase mt-0.5">per day</span>
                                        </td>
                                        <td className="p-4 text-right hidden md:table-cell">
                                            <span className="font-bold text-slate-700">{v.minKm} KM</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <a
                                                href={`/calculator/cab`}
                                                className="inline-flex items-center gap-1 bg-primary text-white px-3 py-2.5 rounded-xl shadow-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all active:scale-[0.98]"
                                            >
                                                Calc
                                                <ArrowRight size={10} />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center flex items-center justify-between">
                        <span>* All fields are editable — set your own rates. Saved to this device.</span>
                        {hasAnyModified && (
                            <button onClick={handleResetRates} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 underline transition-colors">
                                <RotateCcw size={10} /> Reset to defaults
                            </button>
                        )}
                    </div>
                </div>



                {/* Mobile Rate Cards */}
                <div className="md:hidden space-y-2.5 mb-6">
                    {VEHICLES.map((v) => {
                        const isExpanded = expandedVehicleId === v.id;
                        return (
                        <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div 
                                className="p-3 flex justify-between items-center cursor-pointer"
                                onClick={() => setExpandedVehicleId(isExpanded ? null : v.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Car size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-sm text-slate-800">{v.name}</h3>
                                            {isRateModified(v.id) && (
                                                <span className="text-[7px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-1 py-0.5 rounded-full uppercase">Custom</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">₹{customRates[v.id]?.drop}/km (Drop) · tap to edit</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-slate-400">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-3 pt-0 animate-in slide-in-from-top-2">
                                    <div className="h-px bg-slate-100 mb-3" />
                                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                                        <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                                            <p className="text-[8px] font-bold text-blue-500 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">One Way <Pencil size={7} /></p>
                                            <div className="flex items-center gap-0.5">
                                                <span className="text-xs font-bold text-slate-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={customRates[v.id]?.drop}
                                                    onChange={(e) => handleRateChange(v.id, 'drop', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none"
                                                />
                                                <span className="text-[8px] text-slate-400">/km</span>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                                            <p className="text-[8px] font-bold text-blue-500 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">Round <Pencil size={7} /></p>
                                            <div className="flex items-center gap-0.5">
                                                <span className="text-xs font-bold text-slate-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={customRates[v.id]?.round}
                                                    onChange={(e) => handleRateChange(v.id, 'round', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none"
                                                />
                                                <span className="text-[8px] text-slate-400">/km</span>
                                            </div>
                                        </div>
                                        <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100">
                                            <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">Bata <Pencil size={7} /></p>
                                            <div className="flex items-center gap-0.5">
                                                <span className="text-xs font-bold text-slate-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={customRates[v.id]?.bata ?? v.batta}
                                                    onChange={(e) => handleRateChange(v.id, 'bata', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none"
                                                />
                                                <span className="text-[8px] text-slate-400">/day</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                        <div className="text-[9px] font-bold text-slate-500">
                                            Min: <span className="text-slate-700 font-bold">{v.minKm} KM</span>
                                        </div>
                                        <a
                                            href={`/calculator/cab`}
                                            className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98]"
                                        >
                                            Calc
                                            <ArrowRight size={10} />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
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
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right"><span className="flex items-center justify-end gap-1">4 Hr / 40 Km <Pencil size={9} className="text-blue-400" /></span></th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right"><span className="flex items-center justify-end gap-1">8 Hr / 80 Km <Pencil size={9} className="text-blue-400" /></span></th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right"><span className="flex items-center justify-end gap-1">12 Hr / 120 Km <Pencil size={9} className="text-blue-400" /></span></th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right"><span className="flex items-center justify-end gap-1">Extra Hr <Pencil size={9} className="text-blue-400" /></span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(TARIFFS.vehicles).map(([key, data]) => (
                                    <tr key={key} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 capitalize">{data.name}</div>
                                        </td>
                                        {(['pkg4hr', 'pkg8hr', 'pkg12hr'] as const).map(field => (
                                            <td key={field} className="p-4 text-right">
                                                <div className="relative inline-block w-24">
                                                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={customRates[key]?.[field] ?? 0}
                                                        onChange={(e) => handleRateChange(key, field, e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-1 py-1 text-sm font-black text-slate-800 outline-none focus:border-blue-400 text-center"
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                        <td className="p-4 text-right">
                                            <div className="relative inline-block w-24">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={customRates[key]?.extraHr ?? 0}
                                                    onChange={(e) => handleRateChange(key, 'extraHr', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-1 py-1 text-sm font-black text-slate-800 outline-none focus:border-blue-400 text-center"
                                                />
                                            </div>
                                            <span className="block text-[8px] text-slate-400 font-bold uppercase mt-0.5">/hr</span>
                                        </td>
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
                                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-lg">
                                            <span className="text-[8px] font-medium text-slate-500">Extra: ₹</span>
                                            <input
                                                type="number"
                                                value={customRates[key]?.extraHr ?? data.extra_hr_rate}
                                                onChange={(e) => handleRateChange(key, 'extraHr', e.target.value)}
                                                className="w-10 bg-transparent border-none p-0 text-[8px] font-bold text-slate-700 outline-none text-center"
                                            />
                                            <span className="text-[8px] font-medium text-slate-500">/hr</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {([['pkg4hr', '4 Hr'], ['pkg8hr', '8 Hr'], ['pkg12hr', '12 Hr']] as const).map(([field, label]) => (
                                            <div key={field} className="bg-blue-50/60 p-1.5 rounded-lg border border-blue-100">
                                                <p className="text-[8px] font-medium text-blue-500 uppercase mb-0.5 flex items-center justify-center gap-0.5">{label} <Pencil size={6} /></p>
                                                <div className="flex items-center justify-center gap-0.5">
                                                    <span className="text-[9px] font-bold text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={customRates[key]?.[field] ?? 0}
                                                        onChange={(e) => handleRateChange(key, field, e.target.value)}
                                                        className="w-14 bg-transparent border-none p-0 text-xs font-bold text-slate-700 outline-none text-center"
                                                    />
                                                </div>
                                            </div>
                                        ))}
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

        </div >
    );
};

export default TariffPage;
