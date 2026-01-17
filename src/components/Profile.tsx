import React, { useState, useEffect, useMemo } from 'react';
import { GSTService } from '../services/gst'; // Import Service
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
    User as UserIcon, LogOut,
    Contact, Landmark, Car, FileText, ChevronRight,
    RefreshCw, X, Trash2, Sparkles, Crown, Cloud, Users
} from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import { supabase } from '../utils/supabase';
import { VEHICLES } from '../config/vehicleRates';
import { validateVehicleNumber } from '../utils/validation';

// Sub-components (Lazy Loaded)
const DocumentVault = React.lazy(() => import('./DocumentVault'));
const BusinessCard = React.lazy(() => import('./BusinessCard'));
import { subscribeToPush } from '../utils/push';

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

const Profile: React.FC = () => {
    // Contexts
    const { user, signOut, loading: authLoading } = useAuth();
    const { settings, updateSettings, saveSettings, docStats } = useSettings();

    // Local State
    const [activeTab, setActiveTab] = useState<'business' | 'payments' | 'vehicles' | 'docs' | 'staff'>('business');
    const [showCard, setShowCard] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [showStudio, setShowStudio] = useState(false);

    // GST State
    // Validation is done on Save


    // Garage State
    const [newVehicleNumber, setNewVehicleNumber] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(VEHICLES[0].id);

    // Profile Data Sync
    useEffect(() => {
        if (!user?.id) return;
        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('phone')
                .eq('id', user.id)
                .single();

            if (data && data.phone && !settings.driverPhone) {
                updateSettings({ driverPhone: data.phone });
            }
        };
        fetchProfile();
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Tab Navigation Listener
    useEffect(() => {
        const handleTabChange = (e: CustomEvent) => {
            if (e.detail && ['business', 'payments', 'vehicles', 'docs', 'staff'].includes(e.detail)) {
                setActiveTab(e.detail);
            }
        };
        window.addEventListener('nav-tab-change', handleTabChange as EventListener);
        return () => window.removeEventListener('nav-tab-change', handleTabChange as EventListener);
    }, []);

    // Computed Completion
    const completion = useMemo(() => {
        let score = 0;
        if (settings.companyName && settings.driverPhone) score++;
        if (settings.upiId || settings.bankName) score++;
        if (settings.vehicles.length > 0) score++;
        if (docStats.hasFullVehicle) score++;
        if (docStats.hasFullDriver) score++;
        return Math.round((score / 5) * 100);
    }, [settings, docStats]);

    // ------------------------------------------------------------------
    // HANDLERS
    // ------------------------------------------------------------------

    const handleSave = async (section: string) => {
        setSavingSection(section);

        // GST Validation (Business Section Only)
        if (section === 'business' && settings.gstin) {
            // 1. Format Check
            if (!GSTService.isValidFormat(settings.gstin)) {
                alert('Invalid GSTIN Format. Example: 33ABCDE1234F1Z5');
                setSavingSection(null);
                return;
            }

            // 2. Uniqueness Check
            if (user?.id) {
                const isUnique = await GSTService.isUnique(settings.gstin, user.id);
                if (!isUnique) {
                    alert('This GSTIN is already linked to another account.\n\nGSTIN must be unique per account.');
                    setSavingSection(null);
                    return;
                }
            }
        }

        await saveSettings();
        await new Promise(r => setTimeout(r, 400));
        setSavingSection(null);
    };

    const handleAddVehicle = () => {
        if (!newVehicleNumber || !selectedCategoryId) return;

        if (!settings.isPremium && settings.vehicles.length >= 4) {
            window.dispatchEvent(new CustomEvent('open-pricing-modal'));
            return;
        }

        if (!validateVehicleNumber(newVehicleNumber)) {
            alert('Invalid Vehicle Number');
            return;
        }

        const cat = VEHICLES.find(v => v.id === selectedCategoryId);
        if (!cat) return;

        updateSettings({
            vehicles: [...settings.vehicles, {
                id: crypto.randomUUID(),
                number: newVehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                model: cat.name,
                categoryId: cat.id,
                mileage: '15',
                fuelType: 'diesel'
            }]
        });
        setNewVehicleNumber('');
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `logos/${user.id}/logo_${Date.now()}.${fileExt}`;

            await supabase.storage.from('public').upload(filePath, file);
            const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);

            updateSettings({ logoUrl: publicUrl });
            await saveSettings();
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingLogo(false);
        }
    };



    if (authLoading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="pb-40 animate-fade-in max-w-lg mx-auto px-4 pt-6">

            {/* 1. Header Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden mb-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10 flex items-center gap-4">
                    {/* Avatar with Pro Badge */}
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full border-2 border-white shadow-md bg-slate-50 flex items-center justify-center overflow-hidden">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url || user.user_metadata.picture} referrerPolicy="no-referrer" alt="Profile" width="56" height="56" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={20} className="text-slate-300" />
                            )}
                        </div>
                        {settings.isPremium ? (
                            <div className="absolute -bottom-1 -right-1 bg-amber-100 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-amber-200 shadow-sm">
                                PRO
                            </div>
                        ) : (
                            <div className="absolute -bottom-1 -right-1 bg-slate-100 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                                FREE
                            </div>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate mb-0.5">
                            {user?.user_metadata?.full_name || 'Guest Driver'}
                        </h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            ID: <span className="text-blue-600">{user?.id?.slice(0, 6).toUpperCase() || 'GUEST'}</span>
                            <span className="mx-1.5 opacity-30">|</span>
                            <span className={settings.isPremium ? "text-amber-600" : "text-slate-500"}>{settings.isPremium ? "PRO MEMBER" : "FREE PLAN"}</span>
                        </p>

                        {!user ? (
                            <GoogleSignInButton text="Sign In" className="!w-fit !py-1.5 !px-3 !text-[10px] !rounded-lg !shadow-sm !border-slate-200 !gap-2" />
                        ) : (
                            <button onClick={signOut} className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit">
                                <LogOut size={12} /> Sign Out
                            </button>
                        )}
                    </div>

                    {/* Completion Circle */}
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - completion / 100)} className="text-green-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-[10px] font-black text-slate-900">{completion}%</span>
                    </div>
                </div>
            </div>

            {/* 2. Pro Feature / Upgrade Section */}
            <div className="mb-6 animate-fade-in">
                {settings.isPremium ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowStudio(true)}
                            className="bg-slate-900 text-white p-4 rounded-xl flex flex-col justify-between shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all group min-h-[100px]"
                        >
                            <div className="p-2 bg-white/10 rounded-lg text-pink-400 w-fit mb-3">
                                <Sparkles size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-wider">Business Suite</p>
                                <p className="text-[8px] text-slate-400 font-medium leading-tight mt-1">Logo & Branding</p>
                            </div>
                        </button>

                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'staff' }))}
                            className="bg-white text-slate-900 border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-sm hover:border-blue-500 transition-all group min-h-[100px]"
                        >
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 w-fit mb-3">
                                <Users size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-wider">Staff Manager</p>
                                <p className="text-[8px] text-slate-400 font-medium leading-tight mt-1">Salary & Attendance</p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-pricing-modal'))}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-pink-200 hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Crown size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-wider">Upgrade to Pro</p>
                                <p className="text-[9px] text-white/80 font-medium">Unlock Unlimited Vehicles</p>
                            </div>
                        </div>
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm relative z-10">
                            <ChevronRight size={16} />
                        </div>
                    </button>
                )}
            </div>

            {/* Sync Banner (Guest Only) */}
            {!user && (
                <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-4 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-2xl -mr-12 -mt-12"></div>
                    <div className="relative z-10 w-10 h-10 bg-indigo-100/80 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                        <Cloud size={20} />
                    </div>
                    <div className="relative z-10 flex-1">
                        <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wide mb-0.5">Sync Your Data</h3>
                        <p className="text-[10px] font-medium text-indigo-600/80 leading-relaxed">
                            Sign in to sync your trips & invoices across devices.
                        </p>
                    </div>
                </div>
            )}

            {/* 2. Tabs Navigation */}
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-6 sticky top-2 z-20 gap-1">
                {(['business', 'payments', 'vehicles', 'docs', 'staff'] as const).map(tab => {
                    const isActive = activeTab === tab;
                    const icons = { business: <Contact size={14} />, payments: <Landmark size={14} />, vehicles: <Car size={14} />, staff: <Users size={14} />, docs: <FileText size={14} /> };
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center transition-all ${isActive ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <div className={isActive ? 'text-white' : 'text-blue-500'}>{icons[tab]}</div>
                            <span className="text-[9px] font-black uppercase tracking-wider mt-1">{tab}</span>
                        </button>
                    );
                })}
            </div>

            {/* 3. Main Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'business' && (
                    <div className="space-y-6 animate-scale-in">
                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Business Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Business Name</label>
                                    <input value={settings.companyName} onChange={e => updateSettings({ companyName: e.target.value })} className="w-full h-12 border-b-2 border-slate-100 font-bold text-sm focus:border-blue-500 outline-none transition-colors" placeholder="e.g. Travels Name" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Number</label>
                                    <input value={settings.driverPhone} onChange={e => updateSettings({ driverPhone: e.target.value })} className="w-full h-12 border-b-2 border-slate-100 font-bold text-sm focus:border-blue-500 outline-none transition-colors" placeholder="+91 00000 00000" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                                    <input value={settings.companyAddress} onChange={e => updateSettings({ companyAddress: e.target.value })} className="w-full h-12 border-b-2 border-slate-100 font-bold text-sm focus:border-blue-500 outline-none transition-colors" placeholder="City, State" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                                        GST Number (Optional)
                                    </label>
                                    <input
                                        value={settings.gstin || ''}
                                        onChange={e => updateSettings({ gstin: e.target.value.toUpperCase() })}
                                        className="w-full h-12 border-b-2 border-slate-100 font-bold text-sm focus:border-blue-500 outline-none transition-colors uppercase"
                                        placeholder="29ABCDE1234F1Z5"
                                        maxLength={15}
                                    />
                                    <p className="text-[9px] text-slate-400 mt-1 font-medium">
                                        Must be a unique 15-digit GSTIN. We validate this on save.
                                    </p>
                                </div>
                                <button onClick={() => handleSave('business')} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100">
                                    {savingSection === 'business' ? 'Saving...' : 'Save Details'}
                                </button>
                            </div>

                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => setShowCard(true)}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                                <div className="relative z-10">
                                    <h3 className="font-black text-xl uppercase italic">Digital Card</h3>
                                    <p className="text-xs opacity-90 mb-6">Your professional visiting card is ready</p>
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                                        View Card <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="space-y-6 animate-scale-in">
                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Payment Info</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">UPI ID (GPay / PhonePe)</label>
                                    <input value={settings.upiId || ''} onChange={e => updateSettings({ upiId: e.target.value })} className="w-full h-12 border-b-2 border-slate-100 font-bold text-sm focus:border-green-500 outline-none transition-colors" placeholder="mobile@upi" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Account Holder</label>
                                    <input value={settings.holderName || ''} onChange={e => updateSettings({ holderName: e.target.value })} className="w-full h-12 border-b-2 border-slate-100 font-bold text-sm focus:border-green-500 outline-none transition-colors" placeholder="Full Name" />
                                </div>
                            </div>
                            <button onClick={() => handleSave('payments')} className="w-full h-14 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100">
                                {savingSection === 'payments' ? 'Saving...' : 'Save Payments'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'vehicles' && (
                    <div className="space-y-6 animate-scale-in">
                        <div className="grid gap-4">
                            {settings.vehicles.map(v => (
                                <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><Car size={24} /></div>
                                        <div>
                                            <h4 className="font-black text-slate-900">{v.number}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{v.model}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => updateSettings({ vehicles: settings.vehicles.filter(x => x.id !== v.id) })} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-dashed border-slate-200 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Register New Vehicle</h4>
                            <input value={newVehicleNumber} onChange={e => setNewVehicleNumber(e.target.value.toUpperCase())} placeholder="MH01AB1234" className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold text-sm transition-all focus:border-blue-500" />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="h-12 px-3 rounded-xl border border-slate-200 font-bold text-xs bg-white">
                                    {VEHICLES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                                <button onClick={handleAddVehicle} className="h-12 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Add Vehicle</button>
                            </div>
                            {!settings.isPremium && <p className="text-[10px] text-center font-bold text-slate-400">Unlimited vehicles in <span className="text-pink-600">PRO</span></p>}
                        </div>
                    </div>
                )}

                {activeTab === 'staff' && (
                    <div className="animate-scale-in bg-white p-8 rounded-[32px] border border-slate-200 text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
                            <Users size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase">Staff Manager</h3>
                            <p className="text-xs text-slate-500 font-bold mt-1">Manage Drivers, Salaries & Attendance</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coming Soon in Next Update</p>
                        </div>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="animate-scale-in">
                        <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Documents...</div>}>
                            <DocumentVault />
                        </React.Suspense>
                    </div>
                )}
            </div>

            {/* 4. Footer & Modals */}
            <div className="mt-12 text-center">
                <button onClick={() => setActiveModal('settings')} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">App Settings</button>
            </div>

            {/* Visit Card Modal */}
            {showCard && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCard(false)}>
                    <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowCard(false)} className="absolute -top-12 right-0 text-white"><X size={32} /></button>
                        <React.Suspense fallback={<div className="bg-white p-8 rounded-2xl text-center font-bold text-slate-500">Loading Card Editor...</div>}>
                            <BusinessCard />
                        </React.Suspense>
                    </div>
                </div>
            )}

            {/* Pro Studio Modal */}
            {showStudio && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fade-in" onClick={() => setShowStudio(false)}>
                    <div className="bg-slate-50 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left" onClick={e => e.stopPropagation()}>
                        <div className="p-6 bg-white border-b flex justify-between items-center">
                            <h3 className="font-black uppercase text-sm tracking-widest">Pro Studio</h3>
                            <button onClick={() => setShowStudio(false)} className="text-slate-400"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 relative">
                            {!settings.isPremium && (
                                <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                                    <div className="bg-white p-10 rounded-[40px] shadow-2xl border">
                                        <Crown size={48} className="mx-auto text-pink-500 mb-6" />
                                        <h4 className="font-black uppercase mb-2">Upgrade Required</h4>
                                        <button onClick={() => window.dispatchEvent(new CustomEvent('open-pricing-modal'))} className="bg-pink-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px]">Unlock Now</button>
                                    </div>
                                </div>
                            )}

                            <div className={!settings.isPremium ? 'opacity-20 blur-[2px] pointer-events-none' : ''}>
                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-3">Your Branding Logo</label>
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 rounded-3xl border-2 border-dashed flex items-center justify-center bg-white overflow-hidden relative">
                                                {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain p-2" /> : <FileText className="text-slate-200" size={32} />}
                                                {uploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><RefreshCw className="animate-spin text-blue-600" /></div>}
                                            </div>
                                            <button onClick={() => document.getElementById('logoInput')?.click()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase">Upload Logo</button>
                                            <input type="file" id="logoInput" className="hidden" onChange={handleLogoUpload} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-4">Brand Accent Color</label>
                                        <div className="grid grid-cols-5 gap-3">
                                            {['#0047AB', '#EF4444', '#10B981', '#F59E0B', '#6366F1'].map(c => (
                                                <button key={c} onClick={() => updateSettings({ appColor: c })} className={`w-10 h-10 rounded-xl border-2 ${settings.appColor === c ? 'border-slate-900 shadow-lg scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white rounded-3xl border flex items-center justify-between">
                                        <div>
                                            <p className="font-black uppercase text-xs">Remove Watermark</p>
                                            <p className="text-[9px] font-bold text-slate-400">Cleaner documents for your business</p>
                                        </div>
                                        <input type="checkbox" checked={!settings.showWatermark} onChange={() => updateSettings({ showWatermark: !settings.showWatermark })} className="w-5 h-5 accent-pink-600" />
                                    </div>

                                    <div className="pt-8 border-t">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-6">Document Preview</label>
                                        <div className="bg-white rounded-3xl p-6 shadow-xl border relative overflow-hidden h-40">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">{settings.logoUrl ? <img src={settings.logoUrl} className="w-full" /> : <div className="w-6 h-1 bg-slate-200" />}</div>
                                                <div className="w-16 h-4 rounded-full" style={{ backgroundColor: settings.appColor }} />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="w-full h-2 bg-slate-50 rounded-full" />
                                                <div className="w-3/4 h-2 bg-slate-50 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t">
                            <button onClick={() => { handleSave('branding'); setShowStudio(false); }} className="w-full h-14 bg-pink-600 text-white rounded-2xl font-black uppercase shadow-xl shadow-pink-100">Apply Branding</button>
                        </div>
                    </div>
                </div>
            )}

            {/* App Settings Modal */}
            {activeModal === 'settings' && (
                <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveModal(null)}>
                    <div className="bg-white w-full max-w-xs rounded-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-black uppercase text-sm mb-4">Settings</h3>
                        <button onClick={() => subscribeToPush().then(() => alert('Subscribed'))} className="w-full py-4 bg-orange-50 text-orange-600 rounded-xl font-black uppercase text-[10px]">Enable Notifications</button>
                        <button onClick={() => window.location.reload()} className="w-full py-4 border rounded-xl font-black uppercase text-[10px]">Refresh Application</button>
                        <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px]">Close</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;
