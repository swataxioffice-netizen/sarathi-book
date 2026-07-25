import { useState, useEffect } from 'react';
import { VEHICLES } from '../config/vehicleRates';
import { TARIFFS, TRIP_LIMITS } from '../config/tariff_config';
import SEOHead from './SEOHead';
import { useSettings } from '../contexts/SettingsContext';
import { downloadTariffPDF } from '../utils/pdf';
import {
    ArrowRight, Check, ShieldCheck, Clock,
    AlertTriangle, Moon, Car, Pencil, RotateCcw,
    Share2, Copy, Phone, MessageSquare, Download, CheckCircle, ArrowLeft, Plus, Trash2
} from 'lucide-react';

// Encode/decode helper functions
const encodeTariffData = (data: {
    companyName: string;
    driverPhone: string;
    secondaryPhone?: string;
    upiId?: string;
    companyAddress?: string;
    activeVehicles: string[];
    inclusions: string[];
    exclusions: string[];
    rates: Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }>;
}): string => {
    const compactRates: Record<string, [number, number, number, number, number, number, number]> = {};
    Object.entries(data.rates).forEach(([id, r]) => {
        compactRates[id] = [r.drop, r.round, r.bata, r.pkg4hr, r.pkg8hr, r.pkg12hr, r.extraHr];
    });

    const shareObj = {
        n: data.companyName,
        p: data.driverPhone,
        s: data.secondaryPhone || undefined,
        u: data.upiId || undefined,
        a: data.companyAddress || undefined,
        v: data.activeVehicles,
        i: data.inclusions,
        e: data.exclusions,
        r: compactRates
    };

    const jsonStr = JSON.stringify(shareObj);
    return btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
};

const decodeTariffData = (str: string) => {
    try {
        const jsonStr = decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const shareObj = JSON.parse(jsonStr);
        const rates: Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }> = {};
        
        if (shareObj.r) {
            Object.entries(shareObj.r).forEach(([id, arr]: [string, any]) => {
                rates[id] = {
                    drop: arr[0] ?? 0,
                    round: arr[1] ?? 0,
                    bata: arr[2] ?? 0,
                    pkg4hr: arr[3] ?? 0,
                    pkg8hr: arr[4] ?? 0,
                    pkg12hr: arr[5] ?? 0,
                    extraHr: arr[6] ?? 0
                };
            });
        }
        
        return {
            companyName: shareObj.n || '',
            driverPhone: shareObj.p || '',
            secondaryPhone: shareObj.s || '',
            upiId: shareObj.u || '',
            companyAddress: shareObj.a || '',
            activeVehicles: shareObj.v || [],
            inclusions: shareObj.i || ["Fuel charges", "Driver service & bata", "GST charges"],
            exclusions: shareObj.e || ["Toll charges (as per actual)", "Parking fees", "Interstate permit (if applicable)"],
            rates
        };
    } catch (e) {
        console.error("Failed to decode shared tariff data:", e);
        return null;
    }
};

const TariffPage = () => {
    const { settings } = useSettings();
    const title = "Cab Tariff & Price List | Transparent Cab Rates - Sarathi Book";
    const description = "Transparent taxi rates. Check per-km outstation pricing and hourly rentals. Setup your own tariff card and share instantly.";

    // Schema settings
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
        "about": "Taxi Tariff",
        "description": "Standard cab tariffs for outstation and local hourly city rentals."
    };

    // View state
    const [isCustomerView, setIsCustomerView] = useState(false);

    // Customer View specific state (parsed from shared URL query string)
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerSecondaryPhone, setCustomerSecondaryPhone] = useState('');
    const [customerUpiId, setCustomerUpiId] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    // Fleet selection & custom rates details
    const [activeVehicles, setActiveVehicles] = useState<string[]>([]);
    const [inclusions, setInclusions] = useState<string[]>([]);
    const [exclusions, setExclusions] = useState<string[]>([]);

    const [customRates, setCustomRates] = useState<Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }>>(() => {
        const rates: Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }> = {};
        VEHICLES.forEach(v => {
            const t = TARIFFS.vehicles[v.id as keyof typeof TARIFFS.vehicles];
            rates[v.id] = { drop: v.dropRate, round: v.roundRate, bata: v.batta, pkg4hr: t?.local_4hr_pkg ?? 0, pkg8hr: t?.local_8hr_pkg ?? 0, pkg12hr: t?.local_12hr_pkg ?? 0, extraHr: t?.extra_hr_rate ?? 0 };
        });
        return rates;
    });

    const [copyTooltip, setCopyTooltip] = useState(false);

    // Initial load logic
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sharedStr = params.get('s');

        if (sharedStr) {
            const decoded = decodeTariffData(sharedStr);
            if (decoded) {
                setIsCustomerView(true);
                setCustomerName(decoded.companyName);
                setCustomerPhone(decoded.driverPhone);
                setCustomerSecondaryPhone(decoded.secondaryPhone || '');
                setCustomerUpiId(decoded.upiId || '');
                setCustomerAddress(decoded.companyAddress || '');
                setCustomRates(decoded.rates);
                setActiveVehicles(decoded.activeVehicles);
                setInclusions(decoded.inclusions);
                setExclusions(decoded.exclusions);
                return;
            }
        }

        // Editor mode: Load from settings and localstorage
        setIsCustomerView(false);

        // Load active vehicles preference
        const savedVehicles = localStorage.getItem('tariff_active_vehicles');
        if (savedVehicles) {
            setActiveVehicles(JSON.parse(savedVehicles));
        } else if (settings.vehicles && settings.vehicles.length > 0) {
            // Default to categories configured in settings
            const profileVehIds = Array.from(new Set(settings.vehicles.map(v => v.id)));
            setActiveVehicles(profileVehIds);
        } else {
            // Default check standard options
            setActiveVehicles(['hatchback', 'sedan', 'suv']);
        }

        // Load Inclusions / Exclusions
        const savedInc = localStorage.getItem('tariff_inclusions');
        setInclusions(savedInc ? JSON.parse(savedInc) : ["Fuel charges", "Driver service & bata", "GST charges"]);

        const savedExc = localStorage.getItem('tariff_exclusions');
        setExclusions(savedExc ? JSON.parse(savedExc) : [
            "Toll charges (as per actual)",
            "Parking fees",
            "Interstate permit (if applicable)",
            "Hill station tax (if applicable)"
        ]);

        try {
            const savedRates = localStorage.getItem('sarathi_custom_rates');
            if (savedRates) {
                setCustomRates(JSON.parse(savedRates));
            } else {
                const defaults: Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }> = {};
                VEHICLES.forEach(v => {
                    const t = TARIFFS.vehicles[v.id as keyof typeof TARIFFS.vehicles];
                    defaults[v.id] = { drop: v.dropRate, round: v.roundRate, bata: v.batta, pkg4hr: t?.local_4hr_pkg ?? 0, pkg8hr: t?.local_8hr_pkg ?? 0, pkg12hr: t?.local_12hr_pkg ?? 0, extraHr: t?.extra_hr_rate ?? 0 };
                });
                setCustomRates(defaults);
            }
        } catch (e) {
            console.error(e);
        }
    }, [settings]);

    const handleRateChange = (vehicleId: string, type: 'drop' | 'round' | 'bata' | 'pkg4hr' | 'pkg8hr' | 'pkg12hr' | 'extraHr', value: string) => {
        if (isCustomerView) return;
        const numValue = parseFloat(value) || 0;
        setCustomRates(prev => {
            const updated = { ...prev, [vehicleId]: { ...prev[vehicleId], [type]: numValue } };
            try { localStorage.setItem('sarathi_custom_rates', JSON.stringify(updated)); } catch (e) { console.error(e); }
            return updated;
        });
    };

    const handleVehicleToggle = (id: string) => {
        if (isCustomerView) return;
        setActiveVehicles(prev => {
            const next = prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id];
            localStorage.setItem('tariff_active_vehicles', JSON.stringify(next));
            return next;
        });
    };

    const handleResetRates = () => {
        if (isCustomerView) return;
        const defaults: Record<string, { drop: number; round: number; bata: number; pkg4hr: number; pkg8hr: number; pkg12hr: number; extraHr: number }> = {};
        VEHICLES.forEach(v => {
            const t = TARIFFS.vehicles[v.id as keyof typeof TARIFFS.vehicles];
            defaults[v.id] = { drop: v.dropRate, round: v.roundRate, bata: v.batta, pkg4hr: t?.local_4hr_pkg ?? 0, pkg8hr: t?.local_8hr_pkg ?? 0, pkg12hr: t?.local_12hr_pkg ?? 0, extraHr: t?.extra_hr_rate ?? 0 };
        });
        setCustomRates(defaults);
        try { localStorage.removeItem('sarathi_custom_rates'); } catch (e) { console.error(e); }
    };

    // Inclusions List Handlers
    const handleAddInclusion = () => {
        setInclusions(prev => {
            const next = [...prev, ''];
            localStorage.setItem('tariff_inclusions', JSON.stringify(next));
            return next;
        });
    };

    const handleEditInclusion = (index: number, val: string) => {
        setInclusions(prev => {
            const next = [...prev];
            next[index] = val;
            localStorage.setItem('tariff_inclusions', JSON.stringify(next));
            return next;
        });
    };

    const handleDeleteInclusion = (index: number) => {
        setInclusions(prev => {
            const next = prev.filter((_, i) => i !== index);
            localStorage.setItem('tariff_inclusions', JSON.stringify(next));
            return next;
        });
    };

    // Exclusions List Handlers
    const handleAddExclusion = () => {
        setExclusions(prev => {
            const next = [...prev, ''];
            localStorage.setItem('tariff_exclusions', JSON.stringify(next));
            return next;
        });
    };

    const handleEditExclusion = (index: number, val: string) => {
        setExclusions(prev => {
            const next = [...prev];
            next[index] = val;
            localStorage.setItem('tariff_exclusions', JSON.stringify(next));
            return next;
        });
    };

    const handleDeleteExclusion = (index: number) => {
        setExclusions(prev => {
            const next = prev.filter((_, i) => i !== index);
            localStorage.setItem('tariff_exclusions', JSON.stringify(next));
            return next;
        });
    };

    const getShareableUrl = () => {
        const encoded = encodeTariffData({
            companyName: settings.companyName || 'Driver',
            driverPhone: settings.driverPhone || '',
            secondaryPhone: settings.secondaryPhone || '',
            upiId: settings.upiId || '',
            companyAddress: settings.companyAddress || '',
            activeVehicles,
            inclusions,
            exclusions,
            rates: customRates
        });
        return `${window.location.origin}/tariff?s=${encoded}`;
    };

    const handleCopyLink = () => {
        const url = getShareableUrl();
        navigator.clipboard.writeText(url).then(() => {
            setCopyTooltip(true);
            setTimeout(() => setCopyTooltip(false), 2000);
        });
    };

    const handleWhatsAppShare = () => {
        const url = getShareableUrl();
        const text = encodeURIComponent(`Hi, here is our Taxi Tariff & Rates quotation sheet. Tap the link to view per-km charges and local hourly packages:\n\n${url}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    const handleDownloadPDF = () => {
        downloadTariffPDF({
            companyName: settings.companyName || 'Driver',
            driverPhone: settings.driverPhone || '',
            secondaryPhone: settings.secondaryPhone || '',
            upiId: settings.upiId || '',
            companyAddress: settings.companyAddress || '',
            activeVehicles,
            inclusions,
            exclusions,
            rates: customRates,
            appColor: settings.appColor
        });
    };

    const handleEditProfile = (e: React.MouseEvent) => {
        e.preventDefault();
        window.history.pushState({}, '', '/profile');
        window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'profile' }));
    };

    const filteredVehicles = VEHICLES.filter(v => activeVehicles.includes(v.id));

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
        <div className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-12 text-slate-800">
            <SEOHead
                title={isCustomerView ? `${customerName || 'Cab'} Tariff Card | Official Price List` : title}
                description={description}
                schema={[priceSchema, tableSchema]}
            />

            {/* Customer Banner - Header for customers to see */}
            {isCustomerView && (
                <div className="bg-emerald-600 text-white py-2 px-4 text-center text-xs font-bold flex items-center justify-between shadow-md select-none">
                    <span className="flex items-center gap-1.5 mx-auto">
                        <CheckCircle size={14} className="text-emerald-200" />
                        Viewing direct transparent rates set by {customerName || 'the operator'}.
                    </span>
                    <a
                        href="/tariff"
                        className="hidden sm:inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider border border-white/20 hover:bg-white/20 transition-colors shrink-0 font-sans"
                    >
                        Create My Card
                        <ArrowRight size={10} />
                    </a>
                </div>
            )}

            {/* Header Section */}
            <div className="bg-slate-900 text-white pt-10 pb-6 px-4 relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full -mr-40 -mt-40 pointer-events-none"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-xl md:text-3xl font-extrabold uppercase tracking-wide mb-2">
                        {isCustomerView ? `${customerName || 'Cab Operator'}` : 'Taxi Tariff & Pricing'}
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm font-medium max-w-xl mx-auto leading-relaxed">
                        {isCustomerView 
                            ? 'Fixed, transparent taxi rates. No surge pricing. No hidden charges.' 
                            : 'Set rates for your fleet, customize exclusions, and instantly share direct WhatsApp or PDF quotes.'}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 -mt-4">

                {/* Profile Card / Header Details */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-5 md:p-6 mb-6">
                    {isCustomerView ? (
                        /* Customer View mode header */
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                            <div className="space-y-2">
                                <span className="inline-block bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-blue-100">Official Rates Card</span>
                                <h2 className="text-xl font-extrabold text-slate-800 uppercase leading-none tracking-tight">{customerName || 'Taxi Services'}</h2>
                                {customerAddress && (
                                    <p className="text-xs text-slate-500 font-bold leading-normal max-w-md">{customerAddress}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1.5 text-xs font-bold text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <Phone size={13} className="text-slate-400" />
                                        <span>{customerPhone}</span>
                                    </div>
                                    {customerSecondaryPhone && (
                                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                            <Phone size={13} className="text-slate-400" />
                                            <span>{customerSecondaryPhone}</span>
                                        </div>
                                    )}
                                    {customerUpiId && (
                                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                            <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200">UPI</span>
                                            <span>{customerUpiId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 shrink-0">
                                <a 
                                    href={`tel:${customerPhone}`}
                                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-sm text-xs font-black uppercase tracking-wider hover:bg-black active:scale-[0.98] transition-all"
                                >
                                    <Phone size={14} />
                                    Call Operator
                                </a>
                                <a 
                                    href={`https://wa.me/91${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm checking your cab rates card. I would like to book a ride.`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-sm text-xs font-black uppercase tracking-wider hover:bg-emerald-700 active:scale-[0.98] transition-all"
                                >
                                    <MessageSquare size={14} />
                                    Book on WhatsApp
                                </a>
                            </div>
                        </div>
                    ) : (
                        /* Driver Editor mode Business details summary (Settings read-only) */
                        <div className="space-y-5">
                            <div className="bg-slate-50 rounded-xl p-4.5 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black bg-slate-200/85 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">Your Business Profile (From Settings)</span>
                                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight leading-none mt-1.5">
                                        {settings.companyName || 'No Company Name Set'}
                                    </h3>
                                    {settings.companyAddress && (
                                        <p className="text-[10px] text-slate-500 font-bold leading-normal mt-0.5">{settings.companyAddress}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 pt-1">
                                        <span>Phone: {settings.driverPhone || 'N/A'}</span>
                                        {settings.secondaryPhone && <span className="border-l border-slate-200 pl-3">Sec: {settings.secondaryPhone}</span>}
                                        {settings.upiId && <span className="border-l border-slate-200 pl-3">UPI: {settings.upiId}</span>}
                                    </div>
                                </div>
                                <button 
                                    onClick={handleEditProfile}
                                    className="inline-flex items-center gap-1 bg-white text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm shrink-0 self-start sm:self-center"
                                >
                                    <Pencil size={11} />
                                    Edit Settings
                                </button>
                            </div>

                            {/* Active Fleet Selector Checklist */}
                            <div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Choose Vehicles in Your Active Fleet</h3>
                                <div className="flex flex-wrap gap-2">
                                    {VEHICLES.map(v => {
                                        const isActive = activeVehicles.includes(v.id);
                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => handleVehicleToggle(v.id)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 ${
                                                    isActive 
                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                                {v.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-slate-450 font-medium mt-2">Unchecked vehicle types will be completely hidden from the shared customer page and PDF export.</p>
                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button 
                                    onClick={handleDownloadPDF}
                                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-[0.98]"
                                >
                                    <Download size={12} />
                                    Download PDF
                                </button>
                                <button 
                                    onClick={handleCopyLink}
                                    className={`flex items-center gap-1.5 border px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                                        copyTooltip 
                                            ? 'bg-slate-800 border-slate-800 text-white' 
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {copyTooltip ? <Check size={12} /> : <Copy size={12} />}
                                    {copyTooltip ? 'Copied!' : 'Copy Quote Link'}
                                </button>
                                <button 
                                    onClick={handleWhatsAppShare}
                                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-[0.98]"
                                >
                                    <Share2 size={12} />
                                    Share on WhatsApp
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* OUTSTATION CARD LIST SECTION */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                            <Car size={18} className="text-slate-900" />
                            Outstation Rates (Per KM)
                        </h2>
                        {!isCustomerView && hasAnyModified && (
                            <button onClick={handleResetRates} className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-slate-700 underline uppercase tracking-wider">
                                <RotateCcw size={10} /> Reset Default Rates
                            </button>
                        )}
                    </div>

                    {filteredVehicles.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs font-bold">
                            No vehicles selected. Toggle active fleet checkboxes in the editor above to display vehicles.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredVehicles.map(v => {
                                const rate = customRates[v.id] || { drop: v.dropRate, round: v.roundRate, bata: v.batta };
                                return (
                                    <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4.5 space-y-4 relative hover:shadow transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-extrabold text-sm text-slate-850 uppercase tracking-tight leading-none">{v.name}</h3>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1.5">{v.popularModels}</p>
                                            </div>
                                            {!isCustomerView && isRateModified(v.id) && (
                                                <span className="text-[7px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Customized</span>
                                            )}
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* Rate Cards Grid */}
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                                                <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">One Way Drop</span>
                                                {isCustomerView ? (
                                                    <span className="text-sm font-extrabold text-slate-800">₹{rate.drop}/km</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <span className="text-xs font-bold text-slate-450">₹</span>
                                                        <input 
                                                            type="number"
                                                            value={rate.drop}
                                                            onChange={(e) => handleRateChange(v.id, 'drop', e.target.value)}
                                                            className="w-14 bg-transparent border-none text-center p-0 text-sm font-extrabold text-slate-800 outline-none"
                                                        />
                                                        <span className="text-[9px] text-slate-450">/km</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                                                <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">Round Trip</span>
                                                {isCustomerView ? (
                                                    <span className="text-sm font-extrabold text-slate-800">₹{rate.round}/km</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <span className="text-xs font-bold text-slate-450">₹</span>
                                                        <input 
                                                            type="number"
                                                            value={rate.round}
                                                            onChange={(e) => handleRateChange(v.id, 'round', e.target.value)}
                                                            className="w-14 bg-transparent border-none text-center p-0 text-sm font-extrabold text-slate-800 outline-none"
                                                        />
                                                        <span className="text-[9px] text-slate-450">/km</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                                                <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">Driver Batta</span>
                                                {isCustomerView ? (
                                                    <span className="text-sm font-extrabold text-slate-800">₹{rate.bata}/day</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <span className="text-xs font-bold text-slate-450">₹</span>
                                                        <input 
                                                            type="number"
                                                            value={rate.bata}
                                                            onChange={(e) => handleRateChange(v.id, 'bata', e.target.value)}
                                                            className="w-16 bg-transparent border-none text-center p-0 text-sm font-extrabold text-slate-800 outline-none"
                                                        />
                                                        <span className="text-[9px] text-slate-450">/day</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-center items-center">
                                                <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">Min Distance</span>
                                                <span className="text-sm font-extrabold text-slate-700 mt-0.5">{v.minKm} KM/Day</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* LOCAL CITY HOURLY PACKAGES SECTION */}
                <div className="space-y-4 mb-8">
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <Clock size={18} className="text-slate-900" />
                        Local City Packages
                    </h2>

                    {filteredVehicles.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs font-bold">
                            No vehicles selected. Toggle active fleet checkboxes in the editor above to display hourly packages.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredVehicles.map(v => {
                                const t = TARIFFS.vehicles[v.id as keyof typeof TARIFFS.vehicles];
                                const rate = customRates[v.id] || { pkg4hr: t?.local_4hr_pkg ?? 0, pkg8hr: t?.local_8hr_pkg ?? 0, pkg12hr: t?.local_12hr_pkg ?? 0, extraHr: t?.extra_hr_rate ?? 0 };
                                return (
                                    <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">{v.name}</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{v.popularModels}</p>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 flex-1 max-w-xl">
                                            {([
                                                ['pkg4hr', '4H / 40K'],
                                                ['pkg8hr', '8H / 80K'],
                                                ['pkg12hr', '12H / 120K']
                                            ] as const).map(([field, label]) => (
                                                <div key={field} className="bg-slate-50 border border-slate-100 p-1.5 rounded-xl text-center">
                                                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">{label}</span>
                                                    {isCustomerView ? (
                                                        <span className="text-xs font-extrabold text-slate-700">
                                                            {rate[field] && rate[field] > 0 ? `₹${rate[field]}` : 'N/A'}
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                                            <span className="text-[10px] font-bold text-slate-450">₹</span>
                                                            <input
                                                                type="number"
                                                                value={rate[field]}
                                                                onChange={(e) => handleRateChange(v.id, field, e.target.value)}
                                                                className="w-10 bg-transparent border-none text-center p-0 text-xs font-extrabold text-slate-800 outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-xl text-center">
                                                <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">Extra Hr</span>
                                                {isCustomerView ? (
                                                    <span className="text-xs font-extrabold text-slate-700">₹{rate.extraHr}/hr</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                                        <span className="text-[10px] font-bold text-slate-450">₹</span>
                                                        <input
                                                            type="number"
                                                            value={rate.extraHr}
                                                            onChange={(e) => handleRateChange(v.id, 'extraHr', e.target.value)}
                                                            className="w-8 bg-transparent border-none text-center p-0 text-xs font-extrabold text-slate-800 outline-none"
                                                        />
                                                        <span className="text-[9px] text-slate-450">/h</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* INCLUSIONS & EXCLUSIONS BULLETED LISTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    
                    {/* Inclusions Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                            <h3 className="font-extrabold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Check size={14} className="text-blue-500" />
                                Inclusions / Rates Cover
                            </h3>
                            {!isCustomerView && (
                                <button 
                                    onClick={handleAddInclusion}
                                    className="text-[9px] font-black text-blue-500 border border-blue-200 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors uppercase tracking-wider flex items-center gap-0.5"
                                >
                                    <Plus size={10} /> Add
                                </button>
                            )}
                        </div>

                        <ul className="space-y-2">
                            {inclusions.map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    {isCustomerView ? (
                                        <span>{item}</span>
                                    ) : (
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <input 
                                                type="text"
                                                value={item}
                                                onChange={(e) => handleEditInclusion(index, e.target.value)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition-all"
                                                placeholder="e.g. Fuel Charges included"
                                            />
                                            <button 
                                                onClick={() => handleDeleteInclusion(index)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Exclusions Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                            <h3 className="font-extrabold text-xs text-orange-700 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle size={14} className="text-orange-500" />
                                Exclusions / Additional Charges
                            </h3>
                            {!isCustomerView && (
                                <button 
                                    onClick={handleAddExclusion}
                                    className="text-[9px] font-black text-orange-500 border border-orange-200 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors uppercase tracking-wider flex items-center gap-0.5"
                                >
                                    <Plus size={10} /> Add
                                </button>
                            )}
                        </div>

                        <ul className="space-y-2">
                            {exclusions.map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                    {isCustomerView ? (
                                        <span>{item}</span>
                                    ) : (
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <input 
                                                type="text"
                                                value={item}
                                                onChange={(e) => handleEditExclusion(index, e.target.value)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition-all"
                                                placeholder="e.g. Toll Charges as per actual"
                                            />
                                            <button 
                                                onClick={() => handleDeleteExclusion(index)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Rental Policies & Limits */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200">
                        <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-wide flex items-center gap-2">
                            <ShieldCheck size={18} className="text-green-600" />
                            Rental Policies & Limits
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        <div className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                                    <AlertTriangle size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xs text-slate-800 mb-1">Max Driving Limit</h3>
                                    <p className="text-[11px] text-slate-550 leading-normal font-semibold">
                                        For safety reasons, a single driver is limited to driving a maximum of <span className="font-black text-slate-900">{TRIP_LIMITS.max_km_per_day} KM per day</span>.
                                        For trips exceeding this, a second driver or layover is mandatory.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                                    <Moon size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xs text-slate-800 mb-1">Night Charges</h3>
                                    <p className="text-[11px] text-slate-550 leading-normal font-semibold">
                                        Driver Night Allowance is applicable if the trip happens between <span className="font-black text-slate-900">10:00 PM and 6:00 AM</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer View Back Option */}
                {isCustomerView && (
                    <div className="text-center pb-12 pt-4">
                        <a
                            href="/tariff"
                            className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest border border-slate-200 bg-white px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all"
                        >
                            <ArrowLeft size={14} />
                            Create Your Own Free Tariff Card
                        </a>
                    </div>
                )}
            </main >

        </div>
    );
};

export default TariffPage;
