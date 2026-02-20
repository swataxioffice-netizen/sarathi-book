import React, { useState, useEffect, useMemo } from 'react';
import { generateId } from '../utils/uuid';

import { GSTService } from '../services/gst'; // Import Service
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
    User as UserIcon,
    Contact, Landmark, Car, FileText, ChevronRight,
    RefreshCw, X, Trash2, Sparkles, Crown, Cloud, Users, Download,
    Palette
} from 'lucide-react';

import { supabase } from '../utils/supabase';
import { VEHICLES } from '../config/vehicleRates';
import { validateVehicleNumber } from '../utils/validation';

// Sub-components (Lazy Loaded)
const DocumentVault = React.lazy(() => import('./DocumentVault'));
const SalaryManager = React.lazy(() => import('./SalaryManager'));
const BusinessCard = React.lazy(() => import('./BusinessCard'));
import { subscribeToPush } from '../utils/push';
import GoogleSignInButton from './GoogleSignInButton';

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

const Profile: React.FC = () => {
    // Contexts
    const { user, loading: authLoading } = useAuth();
    const { settings, updateSettings, saveSettings, docStats } = useSettings();

    // Local State
    const [activeTab, setActiveTab] = useState<'business' | 'payments' | 'vehicles' | 'docs'>('business');
    const [showCard, setShowCard] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [showStudio, setShowStudio] = useState(false);
    const [proView, setProView] = useState<'menu' | 'branding' | 'staff'>('menu');
    const [refreshing, setRefreshing] = useState(false);

    // Get refreshProfile from AuthContext
    const { refreshProfile } = useAuth();

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

    // Tab Navigation & Pro Studio Listener
    useEffect(() => {
        const handleTabChange = (e: CustomEvent) => {
            if (e.detail) {
                if (['business', 'payments', 'vehicles', 'docs'].includes(e.detail)) {
                    setActiveTab(e.detail);
                } else if (e.detail === 'staff') {
                   setProView('staff');
                   setShowStudio(true);
                } else if (e.detail === 'branding') {
                   setProView('branding');
                   setShowStudio(true);
                }
            }
        };

        const handleProStudio = () => {
            setProView('menu');
            setShowStudio(true);
        };

        // Check hash on mount (for deep linking from other components)
        if (window.location.hash === '#pro-studio') {
            setShowStudio(true);
            window.history.replaceState(null, '', window.location.pathname);
        }

        window.addEventListener('nav-tab-change', handleTabChange as EventListener);
        window.addEventListener('open-pro-studio', handleProStudio);
        
        return () => {
            window.removeEventListener('nav-tab-change', handleTabChange as EventListener);
            window.removeEventListener('open-pro-studio', handleProStudio);
        };
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

    const handleRefreshProfile = async () => {
        setRefreshing(true);
        try {
            await refreshProfile();
        } catch (err) {
            console.error('Manual profile refresh failed:', err);
            alert('Failed to sync profile with Google. Please try again.');
        } finally {
            setTimeout(() => setRefreshing(false), 1000); // Visual feedback
        }
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
                id: generateId(),
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

        // 1. Type Validation (Strict for PDF compatibility)
        // We avoid WEBP/SVG as they often break in PDF generation libraries
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Invalid file format. Please upload a PNG or JPG image for proper invoice branding.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
             alert('File too large. Please upload a logo under 2MB.');
             return;
        }

        setUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `logos/${user.id}/logo_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('public').upload(filePath, file, {
                upsert: true
            });

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);

            updateSettings({ logoUrl: publicUrl });
            await saveSettings();
        } catch (err: unknown) {
            console.error('Logo upload failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Please try again';
            alert(`Upload failed: ${errorMessage}`);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleDownloadLetterhead = async () => {
        try {
            const { downloadLetterhead } = await import('../utils/pdf');
            await downloadLetterhead({ ...settings, vehicleNumber: '' });
        } catch (error) {
            console.error('Error downloading letterhead:', error);
            alert('Could not generate letterhead. Please try again.');
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
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm relative overflow-hidden mb-3">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10 flex items-center gap-3">
                    {/* Avatar with Pro Badge */}
                    <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-slate-50 flex items-center justify-center overflow-hidden">
                            {(user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatarUrl) ? (
                                <img 
                                    src={user.user_metadata.avatar_url || user.user_metadata.picture || user.user_metadata.avatarUrl} 
                                    referrerPolicy="no-referrer" 
                                    alt="Profile" 
                                    width="48" 
                                    height="48" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <UserIcon size={20} className="text-slate-300" />
                            )}
                        </div>
                        
                        {/* Sync Toggle Button */}
                        <button 
                            onClick={handleRefreshProfile}
                            disabled={refreshing}
                            className={`absolute -top-1 -left-1 w-6 h-6 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all ${refreshing ? 'animate-spin text-blue-600' : ''}`}
                            title="Sync with Google"
                        >
                            <RefreshCw size={12} />
                        </button>

                        {settings.plan === 'super' ? (
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-amber-600 shadow-sm flex items-center gap-0.5">
                                <Crown size={8} className="fill-current" /> S
                            </div>
                        ) : settings.plan === 'pro' || settings.isPremium ? (
                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-blue-700 shadow-sm">
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
                            <span className={settings.plan === 'super' ? "text-amber-500 font-extrabold" : (settings.plan === 'pro' || settings.isPremium) ? "text-blue-600 font-extrabold" : "text-slate-500 font-bold"}>
                                {settings.plan === 'super' ? "SUPER PRO" : (settings.plan === 'pro' || settings.isPremium) ? "PRO MEMBER" : "FREE PLAN"}
                            </span>
                        </p>
                    </div>

                    {/* Completion Circle */}
                    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={100} strokeDashoffset={100 * (1 - completion / 100)} className="text-green-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-[9px] font-black text-slate-900">{completion}%</span>
                    </div>
                </div>
            </div>

            {/* Sync Banner (Guest Only) - Compact Horizontal Layout */}
            {!user && (
                <div className="mb-4 bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex items-center gap-3 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/50 rounded-full blur-xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                        <Cloud size={16} />
                    </div>
                    <div className="relative z-10 flex-1 min-w-0">
                        <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-wide">Business Management Tools</h3>
                        <p className="text-[9px] font-bold text-indigo-500 truncate">Quotes, Invoices, Attendance & Payroll in one place.</p>
                    </div>
                    <div className="relative z-10 shrink-0">
                        <GoogleSignInButton text="Sign In" className="py-2! px-3! rounded-lg! text-[9px]! w-auto! shadow-sm border-indigo-100" />
                    </div>
                </div>
            )}

            {/* 2. Upgrade Section - Only shown for free users */}
            {user && !settings.isPremium && (
                <div className="mb-6 animate-fade-in">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-pricing-modal'))}
                        className="w-full bg-linear-to-r from-pink-600 to-purple-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-pink-200 hover:shadow-xl transition-all group relative overflow-hidden"
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
                </div>
            )}


            {/* 2. Tabs Navigation - Sticky with no gap */}
            <div className="flex bg-white p-2 border-b border-slate-200 mb-6 sticky top-[-17px] z-30 gap-1 -mx-4 px-4 shadow-sm overflow-x-auto scrollbar-hide">
                {(['business', 'payments', 'vehicles', 'docs'] as const).map(tab => {
                    const isActive = activeTab === tab;
                    const icons = { 
                        business: <Contact size={14} />, 
                        payments: <Landmark size={14} />, 
                        vehicles: <Car size={14} />, 
                        docs: <FileText size={14} /> 
                    };
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center transition-all ${isActive ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <div className={isActive ? 'text-white' : 'text-blue-500'}>{icons[tab as keyof typeof icons]}</div>
                            <span className="text-[9px] font-black uppercase tracking-wider mt-1">{tab}</span>
                        </button>
                    );
                })}
            </div>

            {/* 3. Main Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'business' && (
                    <div className="space-y-4 animate-scale-in">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={12} className="text-blue-600" /> Business Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Business Name</label>
                                    <input value={settings.companyName} onChange={e => updateSettings({ companyName: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="e.g. Travels Name" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Business Phone (Primary)</label>
                                    <input value={settings.driverPhone} onChange={e => updateSettings({ driverPhone: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="+91 00000 00000" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Secondary Phone (Optional)</label>
                                    <input value={settings.secondaryPhone || ''} onChange={e => updateSettings({ secondaryPhone: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="+91 00000 00000" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Business Email (Optional)</label>
                                    <input value={settings.companyEmail || ''} onChange={e => updateSettings({ companyEmail: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="business@example.com" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Address</label>
                                    <input value={settings.companyAddress} onChange={e => updateSettings({ companyAddress: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="City, State" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 flex justify-between">
                                        GST Number (Optional)
                                    </label>
                                    <input
                                        value={settings.gstin || ''}
                                        onChange={e => updateSettings({ gstin: e.target.value.toUpperCase() })}
                                        className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900 uppercase"
                                        placeholder="29ABCDE1234F1Z5"
                                        maxLength={15}
                                    />
                                    <p className="text-[9px] text-slate-400 mt-1 font-medium ml-1">
                                        Must be a unique 15-digit GSTIN. We validate this on save.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Contact Person Name</label>
                                    <input value={settings.contactPerson || ''} onChange={e => updateSettings({ contactPerson: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="e.g. John Doe" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Company Website (Optional)</label>
                                    <input value={settings.websiteUrl || ''} onChange={e => updateSettings({ websiteUrl: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="www.example.com" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Services Offered (Comma Separated)</label>
                                    <input 
                                        value={settings.services ? settings.services.join(', ') : ''} 
                                        onChange={e => updateSettings({ services: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
                                        className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" 
                                        placeholder="e.g. Airport Drops, Outstation, Weddings" 
                                    />
                                    <p className="text-[8px] text-slate-400 mt-1 ml-1">These will appear on the back of your visiting card.</p>
                                </div>
                                <button onClick={() => handleSave('business')} className="w-full h-11 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">
                                    {savingSection === 'business' ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3">

                                {/* Pro Branding Tools */}
                                <div className="col-span-2 bg-slate-900 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => { if(settings.isPremium) { setProView('menu'); setShowStudio(true); } else { window.dispatchEvent(new CustomEvent('open-pricing-modal')); } }}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/10 p-2.5 rounded-xl text-pink-400 backdrop-blur-sm">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-sm uppercase tracking-wider mb-0.5">Pro Studio</h3>
                                                <p className="text-[10px] text-slate-300 font-medium">Branding, Staff & Watermarks</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 p-2 rounded-full">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Visiting Card */}
                                {/* Visiting Card */}
                                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm relative overflow-hidden group cursor-pointer hover:border-blue-300 transition-colors text-left" onClick={() => setShowCard(true)}>
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:bg-blue-50 transition-colors" />
                                    <div className="relative z-10">
                                        <div className="bg-slate-100 w-fit p-2 rounded-lg mb-3 group-hover:bg-blue-100 transition-colors">
                                            <Contact size={18} className="text-slate-600 group-hover:text-blue-600" />
                                        </div>
                                        <h3 className="font-black text-xs uppercase text-slate-800 mb-0.5">Visiting Card</h3>
                                        <p className="text-[9px] text-slate-400 mb-2">Share your digital card</p>
                                        <div className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            View <ChevronRight size={10} />
                                        </div>
                                    </div>
                                </div>

                                {/* Letterhead */}
                                <button className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm relative overflow-hidden group cursor-pointer hover:border-blue-300 transition-colors text-left" onClick={handleDownloadLetterhead}>
                                     <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:bg-blue-50 transition-colors" />
                                    <div className="relative z-10">
                                        <div className="bg-slate-100 w-fit p-2 rounded-lg mb-3 group-hover:bg-blue-100 transition-colors">
                                            <FileText size={18} className="text-slate-600 group-hover:text-blue-600" />
                                        </div>
                                        <h3 className="font-black text-xs uppercase text-slate-800 mb-0.5">Letterhead</h3>
                                        <p className="text-[9px] text-slate-400 mb-2">Download PDF format</p>
                                         <div className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            Download <Download size={10} />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="space-y-4 animate-scale-in">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Landmark size={12} className="text-green-600" /> Payment Info
                            </h3>

                            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl mb-2">
                                <button
                                    onClick={() => updateSettings({ preferredPaymentMethod: 'upi' })}
                                    className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${settings.preferredPaymentMethod === 'upi' ? 'bg-white shadow text-slate-900 border border-slate-100' : 'text-slate-400'}`}
                                >
                                    UPI ID
                                </button>
                                <button
                                    onClick={() => updateSettings({ preferredPaymentMethod: 'bank' })}
                                    className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${settings.preferredPaymentMethod === 'bank' ? 'bg-white shadow text-slate-900 border border-slate-100' : 'text-slate-400'}`}
                                >
                                    Bank Account
                                </button>
                            </div>

                            <div className="space-y-3">
                                {settings.preferredPaymentMethod === 'upi' ? (
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 flex justify-between items-center">
                                            UPI ID (GPay / PhonePe)
                                            <div className="flex items-center gap-2 cursor-pointer bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 hover:bg-white transition-colors" onClick={() => updateSettings({ showUpiOnPdf: !settings.showUpiOnPdf })}>
                                                <input type="checkbox" checked={settings.showUpiOnPdf} readOnly className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer" />
                                                <span className="text-[8px] text-slate-600 font-black uppercase tracking-wide">On Invoice</span>
                                            </div>
                                        </label>
                                        <input value={settings.upiId || ''} onChange={e => updateSettings({ upiId: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="mobile@upi" />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 flex justify-between items-center">
                                                Bank Name
                                                <div className="flex items-center gap-2 cursor-pointer bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 hover:bg-white transition-colors" onClick={() => updateSettings({ showBankOnPdf: !settings.showBankOnPdf })}>
                                                    <input type="checkbox" checked={settings.showBankOnPdf} readOnly className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer" />
                                                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-wide">On Invoice</span>
                                                </div>
                                            </label>
                                            <input value={settings.bankName || ''} onChange={e => updateSettings({ bankName: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="e.g. State Bank of India" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Account Number</label>
                                            <input value={settings.accountNumber || ''} onChange={e => updateSettings({ accountNumber: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="000000000000" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">IFSC Code</label>
                                            <input value={settings.ifscCode || ''} onChange={e => updateSettings({ ifscCode: e.target.value.toUpperCase() })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900 uppercase" placeholder="SBIN0001234" maxLength={11} />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-0.5 block">Account Holder</label>
                                    <input value={settings.holderName || ''} onChange={e => updateSettings({ holderName: e.target.value })} className="tn-input h-10 w-full bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" placeholder="Full Name" />
                                </div>
                            </div>
                            <button onClick={() => handleSave('payments')} className="w-full h-11 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition-colors">
                                {savingSection === 'payments' ? 'Saving...' : 'Save Payments'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'vehicles' && (
                    <div className="space-y-4 animate-scale-in">
                        <div className="grid gap-3">
                            {settings.vehicles.map(v => (
                                <div key={v.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><Car size={20} /></div>
                                        <div>
                                            <h4 className="font-black text-sm text-slate-900">{v.number}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{v.model}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => updateSettings({ vehicles: settings.vehicles.filter(x => x.id !== v.id) })} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Car size={12} /> Register Vehicle</h4>
                            <input value={newVehicleNumber} onChange={e => setNewVehicleNumber(e.target.value.toUpperCase())} placeholder="MH01AB1234" className="w-full h-10 px-4 rounded-xl border border-slate-200 font-bold text-sm transition-all focus:border-blue-500 uppercase" />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 font-bold text-xs bg-white">
                                    {VEHICLES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                                <button onClick={handleAddVehicle} className="h-10 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800">Add</button>
                            </div>
                            {!settings.isPremium && <p className="text-[9px] text-center font-bold text-slate-400">Unlimited vehicles in <span className="text-pink-600 font-black">PRO</span></p>}
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
                <div className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCard(false)}>
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
                <div className="fixed inset-0 z-110 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fade-in" onClick={() => setShowStudio(false)}>
                    <div className="bg-slate-50 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white">
                            <div className="flex items-center gap-3">
                                {proView !== 'menu' && (
                                    <button onClick={() => setProView('menu')} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                        <ChevronRight size={18} className="rotate-180" />
                                    </button>
                                )}
                                <h3 className="font-black uppercase text-sm tracking-widest">
                                    {proView === 'menu' ? 'Pro Studio' : proView === 'branding' ? 'Branding' : 'Staff Manager'}
                                </h3>
                            </div>
                            <button onClick={() => setShowStudio(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto relative">
                            
                            {/* MENU GRID */}
                            {proView === 'menu' && (
                                <div className="p-6 grid grid-cols-2 gap-4 content-start">
                                    <div 
                                        onClick={() => setProView('branding')}
                                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-3 aspect-square"
                                    >
                                        <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center">
                                            <Palette size={24} />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="font-black text-xs uppercase tracking-wide text-slate-800">Branding</h4>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1">Logo & Colors</p>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => setProView('staff')}
                                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-3 aspect-square"
                                    >
                                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                                            <Users size={24} />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="font-black text-xs uppercase tracking-wide text-slate-800">Staff</h4>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1">Salary & Drivers</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2 mt-4 p-4 bg-slate-100 rounded-2xl border border-slate-200 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">More features coming soon</p>
                                    </div>
                                </div>
                            )}

                            {/* BRANDING VIEW */}
                            {proView === 'branding' && (
                                <div className="p-6 space-y-8 animate-fade-in">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 pl-1">Your Branding Logo</label>
                                            <div className="flex items-center gap-6">
                                                <div className="w-24 h-24 rounded-3xl border-2 border-dashed flex items-center justify-center bg-slate-50 overflow-hidden relative">
                                                    {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain p-2" /> : <FileText className="text-slate-200" size={32} />}
                                                    {uploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><RefreshCw className="animate-spin text-blue-600" /></div>}
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <button onClick={() => document.getElementById('logoInput')?.click()} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase w-full">Upload Logo</button>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-center">PNG/JPG Only</p>
                                                    <input type="file" id="logoInput" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleLogoUpload} />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-4 pl-1">Brand Accent Color</label>
                                            <div className="grid grid-cols-5 gap-3">
                                                {['#0047AB', '#EF4444', '#10B981', '#F59E0B', '#6366F1'].map(c => (
                                                    <button key={c} onClick={() => updateSettings({ appColor: c })} className={`w-10 h-10 rounded-xl border-2 transition-all ${settings.appColor === c ? 'border-slate-900 shadow-lg scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <div>
                                                <p className="font-black uppercase text-xs">Remove Watermark</p>
                                                <p className="text-[9px] font-bold text-slate-400">Cleaner documents</p>
                                            </div>
                                            <input type="checkbox" checked={!settings.showWatermark} onChange={() => updateSettings({ showWatermark: !settings.showWatermark })} className="w-5 h-5 accent-pink-600 cursor-pointer" />
                                        </div>

                                        <button onClick={() => { handleSave('branding'); setShowStudio(false); }} className="w-full h-12 bg-pink-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-pink-200 hover:bg-pink-700 transition-all">
                                            Apply Changes
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-4 pl-1">Preview</label>
                                        <div className="bg-white rounded-3xl p-6 shadow-xl border relative overflow-hidden h-40">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain" /> : <div className="w-6 h-1 bg-slate-200" />}
                                                </div>
                                                <div className="w-16 h-4 rounded-full" style={{ backgroundColor: settings.appColor }} />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="w-full h-2 bg-slate-50 rounded-full" />
                                                <div className="w-3/4 h-2 bg-slate-50 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAFF VIEW */}
                            {proView === 'staff' && (
                                <div className="p-4 animate-slide-left">
                                     <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Staff Manager...</div>}>
                                        <SalaryManager />
                                    </React.Suspense>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* App Settings Modal */}
            {activeModal === 'settings' && (
                <div className="fixed inset-0 z-120 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveModal(null)}>
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
