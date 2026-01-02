import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Trash2, Plus, User as UserIcon, CheckCircle, Circle, Globe, Camera, LogOut, Landmark, MessageCircle, RefreshCw, Phone, Contact, X, Car, FileText, Settings, ChevronRight, Copy, ExternalLink } from 'lucide-react';
import { validateGSTIN, validateVehicleNumber } from '../utils/validation';
import DocumentVault from './DocumentVault';
import GoogleSignInButton from './GoogleSignInButton';
import { supabase } from '../utils/supabase';
import { VEHICLES } from '../config/vehicleRates';
import { toTitleCase, formatAddress } from '../utils/stringUtils';

import BusinessCard from './BusinessCard';
import { subscribeToPush } from '../utils/push';
import { Bell } from 'lucide-react';

const Profile: React.FC = () => {
    const { user, signOut, loading: authLoading } = useAuth();
    const { settings, updateSettings, saveSettings, docStats, driverCode } = useSettings();
    const [newVehicleNumber, setNewVehicleNumber] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(VEHICLES[0].id);
    const [newVehicleModel, setNewVehicleModel] = useState('');
    const [isCustomModel, setIsCustomModel] = useState(false);
    const [isEditingPhoto, setIsEditingPhoto] = useState(false);
    const [customPhotoUrl, setCustomPhotoUrl] = useState('');
    const [savingSection, setSavingSection] = useState<'business' | 'banking' | 'fleet' | 'language' | 'services' | 'tax' | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<any>(settings.language || 'en');
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'support' | 'settings_menu' | null>(null);
    const [showCard, setShowCard] = useState(false);
    const [activeTab, setActiveTab] = useState<'business' | 'finance' | 'garage' | 'docs'>('business');

    const handleManualSave = async (section: 'business' | 'banking' | 'fleet' | 'language' | 'services') => {
        setSavingSection(section);
        const success = await saveSettings();
        await new Promise(r => setTimeout(r, 500));
        if (!success) alert('Failed to save settings. Please try again.');
        setSavingSection(null);
    };


    const addVehicle = () => {
        if (!newVehicleNumber || !selectedCategoryId || (!newVehicleModel && !isCustomModel)) return;

        // Validate Vehicle Number
        if (!validateVehicleNumber(newVehicleNumber)) {
            alert('Invalid Vehicle Number. Please enter a valid Indian Vehicle Number (e.g., MH01AB1234).');
            return;
        }

        const vehicleInfo = VEHICLES.find(v => v.id === selectedCategoryId);
        if (!vehicleInfo) return;

        updateSettings({
            vehicles: [...settings.vehicles, {
                id: crypto.randomUUID(),
                number: newVehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, ''), // Store clean format
                model: newVehicleModel || vehicleInfo.name,
                categoryId: vehicleInfo.id
            }]
        });
        setNewVehicleNumber('');
        setNewVehicleModel('');
        setIsCustomModel(false);
    };

    const deleteVehicle = (id: string) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
        const newVehicles = settings.vehicles.filter(v => v.id !== id);
        updateSettings({
            vehicles: newVehicles,
            currentVehicleId: settings.currentVehicleId === id
                ? (newVehicles.length > 0 ? newVehicles[0].id : '')
                : settings.currentVehicleId
        });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomPhotoUrl(url);
            setIsEditingPhoto(false);
        }
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateSettings({ signatureUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // Fetch existing profile data (phone) on load
    React.useEffect(() => {
        const fetchProfile = async () => {
            if (user?.id) {
                try {
                    // Timeout promise to prevent infinite loading (15 seconds)
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Profile fetch timed out')), 5000)
                    );

                    const dbPromise = supabase
                        .from('profiles')
                        .select('phone, driver_code')
                        .eq('id', user.id)
                        .single();

                    const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

                    if (error) {
                        console.error('Error fetching profile:', error);
                    } else if (data) {
                        if (data.phone && !settings.driverPhone) updateSettings({ driverPhone: data.phone });
                    }
                } catch (err: any) {
                    console.error('Profile fetch failed:', err);
                }
            }
        };

        fetchProfile();
    }, [user?.id]); // Only re-run if user ID changes, not object reference

    const operatorId = driverCode
        ? `#${driverCode}`
        : (user ? `OP-${user.id.slice(0, 6).toUpperCase()}` : 'GUEST');

    // -- Completion Logic --
    const getCompletion = () => {
        let score = 0;
        const totalSteps = 5;

        // 1. Business Profile
        if (settings.companyName && settings.companyAddress && settings.driverPhone) score++;

        // 2. Legal & Banking (Bank Account OR UPI ID)
        const hasBank = settings.bankName && settings.accountNumber && settings.ifscCode && settings.holderName;
        const hasUPI = !!settings.upiId;
        if (hasBank || hasUPI) score++;

        // 3. Fleet Manager (At least 1 vehicle)
        if (settings.vehicles.length > 0) score++;

        // 4. Vehicle Docs
        if (docStats.hasFullVehicle) score++;

        // 5. Driver Docs
        if (docStats.hasFullDriver) score++;

        return Math.min(100, Math.round((score / totalSteps) * 100));
    };

    const completion = getCompletion();

    // Show loading state while auth is initializing
    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (authLoading) {
            timer = setTimeout(() => setLoadingTimeout(true), 10000); // 10s timeout
        } else {
            setLoadingTimeout(false);
        }
        return () => clearTimeout(timer);
    }, [authLoading]);

    // CRITICAL FIX: Do not block UI for profileLoading, only for authLoading
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen pb-24">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-[#0047AB]/20 border-t-[#0047AB] rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-bold text-slate-500">Loading profile...</p>
                    {loadingTimeout && (
                        <div className="animate-fade-in space-y-3">
                            <p className="text-xs text-red-500 font-medium">Taking longer than expected...</p>
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-[#0047AB] text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                    Reload Page
                                </button>
                                <button
                                    onClick={signOut}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div key={user?.id || 'guest'} className="space-y-4 pb-24">

            {/* Profile Header Card - Compact */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#0047AB]/5 rounded-full -mr-10 -mt-10"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative group flex-shrink-0">
                            <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
                                {user?.user_metadata?.avatar_url || customPhotoUrl ? (
                                    <img
                                        src={user?.user_metadata?.avatar_url || customPhotoUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <UserIcon size={24} className="text-slate-300" />
                                )}
                            </div>
                            <button
                                onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                                className="absolute bottom-0 right-0 p-1 bg-[#0047AB] text-white rounded-full shadow-md hover:bg-blue-700 transition-colors"
                            >
                                <Camera size={10} />
                            </button>
                            {isEditingPhoto && (
                                <div className="absolute top-full left-0 mt-2 bg-white p-2 rounded-xl shadow-xl border border-slate-100 z-50 w-32 animate-fade-in">
                                    <label className="block text-[9px] font-bold text-center py-2 text-slate-600 hover:bg-slate-50 cursor-pointer rounded-lg uppercase tracking-wider">
                                        Upload
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                    <div className="border-t border-slate-100 my-1"></div>
                                    <button onClick={() => setCustomPhotoUrl('')} className="w-full text-[9px] font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg uppercase tracking-wider">Remove</button>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">
                                {user?.user_metadata?.full_name || 'Guest Driver'}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <div className="inline-block px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                        ID: <span className="text-[#0047AB]">{operatorId}</span>
                                    </p>
                                </div>
                                {completion === 100 && (
                                    <button
                                        onClick={() => setShowCard(true)}
                                        className="px-2 py-0.5 bg-[#0047AB] text-white rounded-md flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                                    >
                                        <Contact size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-wider">View Card</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Circular Progress */}
                        <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90 circle-progress">
                                <circle
                                    cx="28"
                                    cy="28"
                                    r="24"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-slate-100"
                                />
                                <circle
                                    cx="28"
                                    cy="28"
                                    r="24"
                                    stroke="currentColor"
                                    strokeWidth="5"
                                    fill="transparent"
                                    strokeDasharray={150.8}
                                    strokeDashoffset={150.8 * (1 - completion / 100)}
                                    strokeLinecap="round"
                                    className={`transition-all duration-1000 ease-out text-green-500`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center leading-none">
                                <span className={`text-[16px] font-black tracking-tighter ${completion === 100 ? 'text-green-600' : 'text-slate-900'}`}>{completion}%</span>
                            </div>
                        </div>

                        {/* Sign Out - Only show if logged in */}
                        {user && (
                            <div className="flex gap-2">
                                <button
                                    onClick={signOut}
                                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all shadow-sm active:scale-95"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* New Row for Google Sign In if Guest */}
                    {!user && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <GoogleSignInButton
                                variant="full"
                                text="Sign in to save records"
                                className="!w-full !shadow-sm !border-slate-200 hover:!border-blue-400"
                            />
                        </div>
                    )}
                </div>
            </div>




            {/* COMPACT TABS NAVIGATION */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mx-1 mb-6">
                {[
                    {
                        id: 'business',
                        label: 'Business',
                        icon: <Contact size={14} />,
                        color: 'blue',
                        isComplete: !!(settings.companyName && settings.driverPhone && (settings.services?.length ?? 0) > 0)
                    },
                    {
                        id: 'finance',
                        label: 'Finance',
                        icon: <Landmark size={14} />,
                        color: 'green',
                        isComplete: !!(settings.upiId || (settings.bankName && settings.holderName))
                    },
                    {
                        id: 'garage',
                        label: 'Garage',
                        icon: <Car size={14} />,
                        color: 'purple',
                        isComplete: settings.vehicles.length > 0
                    },
                    {
                        id: 'docs',
                        label: 'Expiry Date',
                        icon: <FileText size={14} />,
                        color: 'orange',
                        isComplete: docStats.hasFullVehicle && docStats.hasFullDriver
                    }
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const colorConfig: Record<string, string> = {
                        blue: 'text-blue-600',
                        green: 'text-green-600',
                        purple: 'text-purple-600',
                        orange: 'text-orange-600'
                    };

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${isActive
                                ? 'bg-white shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {/* Status Indicator */}
                            {tab.isComplete && (
                                <div className="absolute top-1 right-1">
                                    <CheckCircle size={8} className="text-green-500 fill-white" />
                                </div>
                            )}

                            <div className={`${isActive ? colorConfig[tab.color] : 'text-slate-400'}`}>
                                {tab.icon}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${isActive ? 'text-slate-900' : 'opacity-60'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT: BUSINESS */}
            {activeTab === 'business' && (
                <div className="space-y-6 animate-fade-in">

                    {/* Business Profile */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            {settings.companyName && settings.companyAddress && settings.driverPhone ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Business Details</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 px-1 font-medium">Your company info as seen on Invoices.</p>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Business Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={settings.companyName}
                                        onChange={(_) => updateSettings({ companyName: _.target.value })}
                                        onBlur={(_) => updateSettings({ companyName: toTitleCase(_.target.value) })}
                                        className="tn-input h-10 font-bold placeholder:text-slate-500"
                                        placeholder="e.g. Saravana Travels"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 ml-1">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">WhatsApp Number <span className="text-red-500">*</span></label>
                                        <MessageCircle size={10} className="text-[#25D366]" />
                                    </div>
                                    <input
                                        type="text"
                                        value={settings.driverPhone}
                                        onChange={(_) => {
                                            updateSettings({ driverPhone: _.target.value });
                                            if (user) {
                                                // Auto-sync phone to Supabase profile
                                                supabase.from('profiles').update({ phone: _.target.value }).eq('id', user.id).then(({ error }) => {
                                                    if (error) console.error('Failed to sync phone', error);
                                                });
                                            }
                                        }}
                                        className="tn-input h-10 font-bold placeholder:text-slate-500"
                                        placeholder="+91 99999 88888"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={settings.companyAddress}
                                        onChange={(_) => updateSettings({ companyAddress: _.target.value })}
                                        onBlur={(_) => updateSettings({ companyAddress: formatAddress(_.target.value) })}
                                        className="tn-input h-10 font-bold placeholder:text-slate-500"
                                        placeholder="State, City"
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-1 block">Digital Signature (Recommended: 400x150 px, White BG)</label>
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="flex-1">
                                            {settings.signatureUrl ? (
                                                <div className="relative group w-full h-20 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center p-2">
                                                    <img src={settings.signatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                                                    <button
                                                        onClick={() => updateSettings({ signatureUrl: undefined })}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-full h-20 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-white">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No Signature</div>
                                                    <p className="text-[8px] text-slate-400 mt-1 uppercase">Max Size: 400x150 px</p>
                                                </div>
                                            )}
                                        </div>
                                        <label className="flex-shrink-0 cursor-pointer">
                                            <div className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-blue-400 transition-all active:scale-95">
                                                {settings.signatureUrl ? 'Change' : 'Upload'}
                                            </div>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                                        </label>
                                    </div>
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={async () => {
                                            setSavingSection('business');
                                            const success = await saveSettings();
                                            await new Promise(r => setTimeout(r, 500));
                                            if (!success) alert('Failed to save settings. Please try again.');
                                            setSavingSection(null);
                                        }}
                                        className="bg-green-700 text-white px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                    >
                                        {savingSection === 'business' ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={12} /> Save
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            {(settings.services?.length ?? 0) > 0 ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Service Details</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 px-1 font-medium">Select services to display on your Visiting Card.</p>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                {['Local', 'Outstation', 'Tours', 'Airport', 'Hourly'].map((service) => (
                                    <label key={service} className="flex items-center gap-2 p-2.5 border border-slate-100 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={settings.services?.includes(service) || false}
                                            onChange={(e) => {
                                                const currentServices = settings.services || [];
                                                let newServices;
                                                if (e.target.checked) {
                                                    newServices = [...currentServices, service];
                                                } else {
                                                    newServices = currentServices.filter(s => s !== service);
                                                }
                                                updateSettings({ services: newServices });
                                            }}
                                        />
                                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{service}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-end pt-2 border-t border-slate-100 mt-1">
                                <button
                                    onClick={() => handleManualSave('services')}
                                    disabled={savingSection === 'services'}
                                    className="bg-green-700 text-white px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                                >
                                    {savingSection === 'services' ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={12} />
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB CONTENT: FINANCE */}
            {activeTab === 'finance' && (
                <div className="space-y-6 animate-fade-in">

                    {/* Tax Settings */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            {settings.gstEnabled && settings.gstin ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-green-500 underline-offset-4">Tax Settings</h3>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                            {/* GST Toggle */}
                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Enable GST Invoice</span>
                                <div
                                    onClick={() => updateSettings({ gstEnabled: !settings.gstEnabled })}
                                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.gstEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${settings.gstEnabled ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>

                            {user && !settings.gstEnabled && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 rounded-xl animate-fade-in relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Landmark size={48} className="text-blue-600" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        Need GST Registration?
                                    </h4>
                                    <p className="text-[9px] text-blue-600 font-bold mb-2 w-3/4">
                                        Get your GSTIN quickly to serve corporate clients and grow your business.
                                    </p>
                                    <div className="flex gap-2">
                                        <a
                                            href="https://wa.me/919941033990?text=Hi, I am running a Cab Transport Business and need help with GST Registration and Tax Filing."
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-green-600 transition-colors shadow-sm"
                                        >
                                            WhatsApp <MessageCircle size={10} />
                                        </a>
                                        <a
                                            href="tel:+919941033990"
                                            className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Call Now <Phone size={10} />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {settings.gstEnabled && (
                                <div className="space-y-2 animate-fade-in pl-1">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">GST Number</label>
                                        <input
                                            type="text"
                                            value={settings.gstin}
                                            onChange={(_) => updateSettings({ gstin: _.target.value.toUpperCase() })}
                                            className={`tn-input h-10 font-bold placeholder:text-slate-500 ${settings.gstin && !validateGSTIN(settings.gstin) ? 'border-red-300 bg-red-50' : ''}`}
                                            placeholder="22AAAAA0000A1Z5"
                                            maxLength={15}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end border-t border-slate-100">
                                <button
                                    onClick={async () => {
                                        setSavingSection('tax');
                                        const success = await saveSettings();
                                        await new Promise(r => setTimeout(r, 500));
                                        if (!success) alert('Failed to save settings. Please try again.');
                                        setSavingSection(null);
                                    }}
                                    className="bg-green-700 text-white px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                >
                                    {savingSection === 'tax' ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={12} /> Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Legal & Banking */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            {settings.upiId || (settings.bankName && settings.holderName) ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-green-500 underline-offset-4">Bank Details</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 px-1 font-medium">Add payment details to receive money from clients.</p>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">

                            {/* Bank Details - Simplified */}
                            <div className="space-y-2">

                                <div>
                                    <div className="flex items-center gap-1 ml-1">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">UPI ID (Primary)</label>
                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded uppercase">Main</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={settings.upiId || ''}
                                        onChange={(_) => updateSettings({ upiId: _.target.value })}
                                        className="tn-input h-10 font-bold placeholder:text-slate-500"
                                        placeholder="username@upi / phone@upi"
                                    />
                                    <p className="text-[8px] text-slate-400 ml-1 mt-0.5 font-bold italic">Payments will be sent to this ID</p>
                                </div>

                                <div className="grid grid-cols-1">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Account Holder Name</label>
                                        <input
                                            type="text"
                                            value={settings.holderName || ''}
                                            onChange={(_) => updateSettings({ holderName: _.target.value })}
                                            onBlur={(_) => updateSettings({ holderName: toTitleCase(_.target.value) })}
                                            className="tn-input h-10 font-bold placeholder:text-slate-500"
                                            placeholder="Holder Name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end border-t border-slate-100">
                                <button
                                    onClick={async () => {
                                        setSavingSection('banking');
                                        const success = await saveSettings();
                                        await new Promise(r => setTimeout(r, 500));
                                        if (!success) alert('Failed to save settings. Please try again.');
                                        setSavingSection(null);
                                    }}
                                    className="bg-green-700 text-white px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                >
                                    {savingSection === 'banking' ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={12} /> Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB CONTENT: GARAGE */}
            {activeTab === 'garage' && (
                <div className="space-y-6 animate-fade-in">



                    {/* Fleet Management */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            {settings.vehicles.length > 0 ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-green-500 underline-offset-4">My Vehicles</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 px-1 font-medium">Add vehicles to manage trips and track availability.</p>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                            <div className="space-y-2">
                                {settings.vehicles.map((v) => (
                                    <div key={v.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl group relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${settings.currentVehicleId === v.id ? 'bg-primary' : 'bg-slate-300'}`}></div>
                                        <div
                                            className="flex-1 pl-2 cursor-pointer"
                                            onClick={() => updateSettings({ currentVehicleId: v.id })}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900">{v.number}</span>
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{v.model}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => deleteVehicle(v.id)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        {settings.currentVehicleId === v.id && (
                                            <div className="mr-2 px-2 py-0.5 bg-primary text-white text-[8px] font-black uppercase rounded-full tracking-widest">
                                                Active
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Plus size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Add New Vehicle</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Vehicle Number</label>
                                        <input
                                            type="text"
                                            value={newVehicleNumber}
                                            onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                                            className="tn-input font-bold uppercase w-full placeholder:text-slate-500"
                                            placeholder="MH-01-AB-1234"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Category</label>
                                        <select
                                            value={selectedCategoryId}
                                            onChange={(e) => {
                                                setSelectedCategoryId(e.target.value);
                                                setNewVehicleModel('');
                                                setIsCustomModel(false);
                                            }}
                                            className="tn-input font-bold w-full bg-slate-50 text-black"
                                        >
                                            {VEHICLES.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Car Model</label>
                                        {!isCustomModel ? (
                                            <select
                                                value={newVehicleModel}
                                                onChange={(e) => {
                                                    if (e.target.value === 'CUSTOM') {
                                                        setIsCustomModel(true);
                                                        setNewVehicleModel('');
                                                    } else {
                                                        setNewVehicleModel(e.target.value);
                                                    }
                                                }}
                                                className="tn-input font-bold w-full bg-slate-50 text-black"
                                            >
                                                <option value="">Select Model...</option>
                                                {VEHICLES.find(v => v.id === selectedCategoryId)?.popularModels.split(', ').map(model => (
                                                    <option key={model} value={model}>{model}</option>
                                                ))}
                                                <option value="CUSTOM">+ Type Manual Model Name</option>
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={newVehicleModel}
                                                    onChange={(e) => setNewVehicleModel(e.target.value)}
                                                    className="tn-input font-bold w-full pr-16 placeholder:text-slate-500"
                                                    placeholder="Enter Car Model (e.g. Swift Dzire)"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => { setIsCustomModel(false); setNewVehicleModel(''); }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-primary uppercase"
                                                >
                                                    Back
                                                </button>
                                            </div>
                                        )}
                                    </div>


                                </div>

                                <button
                                    onClick={addVehicle}
                                    disabled={!newVehicleNumber || !selectedCategoryId || !newVehicleModel}
                                    className="w-full h-10 bg-slate-800 text-white rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900"
                                >
                                    <Plus size={14} /> Add Vehicle
                                </button>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={async () => {
                                        setSavingSection('fleet');
                                        const success = await saveSettings();
                                        await new Promise(r => setTimeout(r, 500));
                                        if (!success) alert('Failed to save settings. Please try again.');
                                        setSavingSection(null);
                                    }}
                                    className="bg-green-700 text-white px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                >
                                    {savingSection === 'fleet' ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={12} /> Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>



                </div>
            )}

            {/* TAB CONTENT: BUSINESS (Website) */}
            {activeTab === 'business' && (
                <div className="space-y-6 animate-fade-in">

                    {/* Public Profile URL Card */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Your Public Page</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 px-1 font-medium">This is your business profile URL. Share it on Google and WhatsApp to get bookings.</p>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl gap-3">
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Your Direct Link</span>
                                    <span className="text-[10px] font-bold text-slate-700 truncate">
                                        {window.location.origin}/?code={driverCode || '...'}
                                    </span>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/?code=${driverCode}`);
                                            alert('Link copied to clipboard!');
                                        }}
                                        className="p-2 bg-white text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="Copy Link"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <a
                                        href={`${window.location.origin}/?code=${driverCode}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 bg-white text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="Open Link"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {settings.websiteUrl && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-orange-500 underline-offset-4">Website</h3>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                                <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-100 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Globe size={14} className="text-orange-500" />
                                        <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]">{settings.websiteUrl}</span>
                                    </div>
                                    <a
                                        href={`https://${settings.websiteUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                                    >
                                        Visit
                                    </a >
                                </div >
                            </div >
                        </div >
                    )}

                </div>
            )}

            {/* TAB CONTENT: DOCUMENTS */}
            {activeTab === 'docs' && (
                <div className="space-y-6 animate-fade-in">

                    {/* 6. Documents */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            {docStats.hasFullVehicle && docStats.hasFullDriver ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Expiry Date</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 px-1 font-medium">Add expiry dates.</p>
                        <div className="pt-0">
                            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                                <DocumentVault />
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* 9. SETTINGS & TOOLS: Relocated to last before footer */}
            <div className="px-1 mt-8">
                <button
                    onClick={() => setActiveModal('settings_menu')}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-slate-300 active:scale-[0.98] transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-100">
                            <Settings size={20} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Settings & Tools</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">App Language, Support & Health</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Indicators if needed */}
                        {!settings.language && (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        )}
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </button>
            </div>

            {/* 10. Legal & Compliance Footer */}
            <div className="pt-12 pb-8 px-4 border-t border-slate-100 mt-8 text-center space-y-4">
                <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <button onClick={() => setActiveModal('terms')} className="hover:text-blue-600 transition-colors">Terms</button>
                    <button onClick={() => setActiveModal('privacy')} className="hover:text-blue-600 transition-colors">Privacy</button>
                    <button onClick={() => setActiveModal('support')} className="hover:text-blue-600 transition-colors">Support</button>
                </div>

                <div className="pt-2">
                    <p className="text-[10px] font-black text-slate-800 tracking-wider">
                        © {new Date().getFullYear()} SARATHI BOOK
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                        Professional Driver Solutions
                    </p>
                </div>
            </div>

            {/* Global Modal Overlay */}
            {activeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-slide-up border border-slate-100">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                    {activeModal === 'terms' && 'Terms of Service'}
                                    {activeModal === 'privacy' && 'Privacy Policy'}
                                    {activeModal === 'support' && 'Official Support'}
                                    {activeModal === 'settings_menu' && 'App Settings'}
                                </h3>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4 text-xs font-bold text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                                {activeModal === 'settings_menu' && (
                                    <div className="space-y-6">
                                        {/* Language Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Globe size={14} className="text-blue-500" />
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Select Language</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['English', 'Tamil', 'Kannada', 'Hindi'].map(lang => {
                                                    const isAvailable = lang === 'English';
                                                    return (
                                                        <button
                                                            key={lang}
                                                            onClick={() => isAvailable && setSelectedLanguage(lang)}
                                                            className={`relative p-2.5 border rounded-xl text-center transition-all ${selectedLanguage === lang
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                                : 'bg-slate-50 text-slate-700 border-slate-100'
                                                                } ${isAvailable ? 'hover:bg-slate-100 active:scale-95' : 'opacity-40 cursor-not-allowed'}`}
                                                        >
                                                            <span className="text-[10px] font-bold">{lang}</span>
                                                            {!isAvailable && (
                                                                <span className="block text-[7px] mt-0.5 opacity-60">Soon</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    setSavingSection('language');
                                                    updateSettings({ language: selectedLanguage });
                                                    await saveSettings();
                                                    await new Promise(r => setTimeout(r, 500));
                                                    setSavingSection(null);
                                                    setActiveModal(null);
                                                }}
                                                disabled={selectedLanguage === settings.language}
                                                className="w-full h-10 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                {savingSection === 'language' ? 'Saving...' : 'Apply Language'}
                                            </button>
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* Notifications Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Bell size={14} className="text-red-500" />
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Push Notifications</h4>
                                            </div>
                                            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] text-red-700 font-bold leading-tight">Get instant alerts for new bookings and system updates even when app is closed.</p>
                                                    <div
                                                        onClick={async () => {
                                                            const permission = await Notification.requestPermission();
                                                            if (permission === 'granted') {
                                                                await subscribeToPush();
                                                                alert('Push Notifications Enabled!');
                                                            } else {
                                                                alert('Permission denied. Please enable notifications in your browser settings.');
                                                            }
                                                        }}
                                                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${Notification.permission === 'granted' ? 'bg-red-500' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${Notification.permission === 'granted' ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* Support Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <MessageCircle size={14} className="text-[#25D366]" />
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Help & Support</h4>
                                            </div>
                                            <a
                                                href="https://wa.me/919952749408?text=I%20need%20help%20with%20Sarathi%20Book"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                                                        <MessageCircle size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-700">Chat on WhatsApp</span>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* System Health Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <RefreshCw size={14} className="text-orange-500" />
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Troubleshooting</h4>
                                            </div>
                                            <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                                                <p className="text-[9px] text-orange-700 font-bold mb-2 leading-tight">Syncing issues or app feeling slow? Repairing will clear cache and refresh data.</p>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('This will refresh the app and clear cache. Proceed?')) {
                                                            if ('serviceWorker' in navigator) {
                                                                const reg = await navigator.serviceWorker.getRegistrations();
                                                                for (const r of reg) await r.unregister();
                                                            }
                                                            if ('caches' in window) {
                                                                const keys = await caches.keys();
                                                                for (const k of keys) await caches.delete(k);
                                                            }
                                                            window.location.href = window.location.origin + '?cb=' + Date.now();
                                                        }
                                                    }}
                                                    className="w-full h-9 bg-white text-orange-600 border border-orange-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <RefreshCw size={12} /> Repair & Restart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeModal === 'terms' && (
                                    <>
                                        <p>1. Sarathi Book is a digital documentation tool for individual taxi operators and fleet owners. It is not a transport service provider.</p>
                                        <p>2. Users are responsible for the accuracy of invoices and trip sheets generated. We are not liable for any legal or tax misuse.</p>
                                        <p>3. While we strive for 100% uptime, Sarathi Book is provided "as is" without warranty for data loss due to browser cache clearing.</p>
                                    </>
                                )}
                                {activeModal === 'privacy' && (
                                    <>
                                        <p>1. <strong>Local First:</strong> Your trip data and documents are primarily stored in your phone's secure local storage.</p>
                                        <p>2. <strong>Cloud Sync:</strong> If you sign in with Google, your data is encrypted and synced to our secure database for multi-device access.</p>
                                        <p>3. <strong>Data Handling:</strong> We do not sell or share your billing information, passenger details, or personal ID documents with any advertising agencies.</p>
                                    </>
                                )}
                                {activeModal === 'support' && (
                                    <>
                                        <p>For any technical issues or feature requests, contact our engineering team directly.</p>
                                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-2">
                                            <p className="text-blue-900 mb-1">WhatsApp Support:</p>
                                            <p className="text-lg text-[#0047AB] font-black">+91 99527 49408</p>
                                            <p className="text-[10px] text-blue-400 mt-1 italic">Response time: Usually within 2 hours</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                            <button
                                onClick={() => setActiveModal(null)}
                                className="px-8 py-3 bg-[#0047AB] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Business Card Modal */}
            {showCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowCard(false)}>
                    <div className="bg-white p-4 rounded-3xl w-full max-w-sm relative shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowCard(false)}
                            className="absolute top-3 right-3 p-1.5 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-[60]"
                        >
                            <X size={16} />
                        </button>
                        <div className="mt-4">
                            <BusinessCard />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Profile;
