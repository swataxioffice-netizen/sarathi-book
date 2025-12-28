import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Trash2, Plus, User as UserIcon, CheckCircle, Circle, Globe, Camera, LogOut, Landmark, MessageCircle, RefreshCw } from 'lucide-react';
import { validateGSTIN } from '../utils/validation';
import DocumentVault from './DocumentVault';
import GoogleSignInButton from './GoogleSignInButton';
import { supabase } from '../utils/supabase';

const Profile: React.FC = () => {
    const { user, signOut, loading: authLoading } = useAuth();
    const { settings, updateSettings, saveSettings } = useSettings();
    const [newVehicleNumber, setNewVehicleNumber] = useState('');
    const [newVehicleModel, setNewVehicleModel] = useState('');
    const [isEditingPhoto, setIsEditingPhoto] = useState(false);
    const [customPhotoUrl, setCustomPhotoUrl] = useState('');
    const [savingSection, setSavingSection] = useState<'business' | 'banking' | 'fleet' | 'language' | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<any>(settings.language || 'en'); // Use any to avoid import issue for now, or just string.
    const [profileLoading, setProfileLoading] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // Stats for Completion
    const [docStats, setDocStats] = useState({ hasFullVehicle: false, hasFullDriver: false });

    const addVehicle = () => {
        if (!newVehicleNumber || !newVehicleModel) return;
        updateSettings({ vehicles: [...settings.vehicles, { id: crypto.randomUUID(), number: newVehicleNumber, model: newVehicleModel }] });
        setNewVehicleNumber(''); setNewVehicleModel('');
    };

    const deleteVehicle = (id: string) => {
        if (settings.vehicles.length <= 1) return;
        updateSettings({
            vehicles: settings.vehicles.filter(v => v.id !== id),
            currentVehicleId: settings.currentVehicleId === id ? settings.vehicles[0].id : settings.currentVehicleId
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

    // Fetch existing profile data (phone) on load
    React.useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                setProfileLoading(true);
                try {
                    // Timeout promise to prevent infinite loading (15 seconds)
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Profile fetch timed out')), 15000)
                    );

                    const dbPromise = supabase
                        .from('profiles')
                        .select('phone')
                        .eq('id', user.id)
                        .single();

                    const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

                    if (error) {
                        console.error('Error fetching profile:', error);
                    } else if (data?.phone && !settings.driverPhone) {
                        updateSettings({ driverPhone: data.phone });
                    }
                } catch (err: any) {
                    console.error('Profile fetch failed:', err);
                } finally {
                    setProfileLoading(false);
                }
            }
        };

        fetchProfile();
    }, [user]);

    const operatorId = user ? `OP - ${user.id.slice(0, 6).toUpperCase()} -${new Date().getFullYear()} ` : 'GUEST-DRIVER';

    // -- Completion Logic --
    const getCompletion = () => {
        let score = 0;
        const totalSteps = 5;

        // 1. Business Profile
        if (settings.companyName && settings.companyAddress && settings.driverPhone) score++;

        // 2. Legal & Banking (Bank Details)
        if (settings.bankName && settings.accountNumber && settings.ifscCode && settings.holderName) score++;

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
        if (authLoading || profileLoading) {
            timer = setTimeout(() => setLoadingTimeout(true), 10000); // 10s timeout
        } else {
            setLoadingTimeout(false);
        }
        return () => clearTimeout(timer);
    }, [authLoading, profileLoading]);

    if (authLoading || profileLoading) {
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
                                {(customPhotoUrl || user?.user_metadata?.avatar_url) ? (
                                    <img
                                        src={customPhotoUrl || user?.user_metadata?.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : null}
                                {(!customPhotoUrl && !user?.user_metadata?.avatar_url) && (
                                    <UserIcon size={24} className="text-slate-300" />
                                )}
                            </div>
                            {user && (
                                <button
                                    onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                                    className="absolute bottom-0 right-0 p-1 bg-[#0047AB] text-white rounded-full shadow-md hover:bg-blue-700 transition-colors"
                                >
                                    <Camera size={10} />
                                </button>
                            )}
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
                            <div className="inline-block mt-1 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    ID: <span className="text-[#0047AB]">{operatorId}</span>
                                </p>
                            </div>
                        </div>

                        {/* Sign Out / Google - Compact */}
                        <div>
                            {user ? (
                                <button
                                    onClick={signOut}
                                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                                >
                                    <LogOut size={16} />
                                </button>
                            ) : (
                                <div className="w-28 opacity-100">
                                    {/* Using a smaller custom wrapper to force compactness if GoogleSignInButton allows */}
                                    <GoogleSignInButton className="w-full text-[10px] py-1 shadow-sm" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Completion Bar - Slim */}
                    <div className="w-full mt-4">
                        <div className="flex justify-between items-end mb-1 px-1">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Complete Profile</span>
                            <span className={`text-[9px] font-black ${completion === 100 ? 'text-green-500' : 'text-[#0047AB]'}`}>{completion}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${completion === 100 ? 'bg-green-500' : 'bg-[#0047AB]'}`}
                                style={{ width: `${completion}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Profile */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    {settings.companyName && settings.companyAddress && settings.driverPhone ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Travels Details</h3>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                    <div className="space-y-2">
                        <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Travels Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(_) => updateSettings({ companyName: _.target.value })}
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
                                className="tn-input h-10 font-bold placeholder:text-slate-500"
                                placeholder="State, City"
                            />
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
                                className="bg-green-700 text-white px-6 h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            >
                                {savingSection === 'business' ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={14} /> Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legal & Banking */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    {settings.bankName && settings.accountNumber && settings.ifscCode ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-green-500 underline-offset-4">Bank Details</h3>
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

                    {/* Bank Details - Simplified */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Landmark size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Payment Info</span>
                        </div>

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

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Account Name</label>
                                <input
                                    type="text"
                                    value={settings.holderName || ''}
                                    onChange={(_) => updateSettings({ holderName: _.target.value })}
                                    className="tn-input h-9 font-bold placeholder:text-slate-500"
                                    placeholder="Holder Name"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Bank Name</label>
                                <input
                                    type="text"
                                    value={settings.bankName || ''}
                                    onChange={(_) => updateSettings({ bankName: _.target.value })}
                                    className="tn-input h-9 font-bold"
                                    placeholder="Bank Name"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
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

            {/* Fleet Management */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    {settings.vehicles.length > 0 ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-purple-500 underline-offset-4">My Vehicles</h3>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                    <div className="space-y-2">
                        {settings.vehicles.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl group relative overflow-hidden">
                                <div className={`absolute left - 0 top - 0 bottom - 0 w - 1 ${settings.currentVehicleId === v.id ? 'bg-[#0047AB]' : 'bg-slate-300'} `}></div>
                                <div
                                    className="flex-1 pl-2 cursor-pointer"
                                    onClick={() => updateSettings({ currentVehicleId: v.id })}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-900">{v.number}</span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{v.model}</span>
                                    </div>
                                </div>

                                {settings.vehicles.length > 1 && (
                                    <button
                                        onClick={() => deleteVehicle(v.id)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                {settings.currentVehicleId === v.id && (
                                    <div className="mr-2 px-2 py-0.5 bg-[#0047AB] text-white text-[8px] font-black uppercase rounded-full tracking-widest">
                                        Active
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-100 mt-2">
                        <input
                            type="text"
                            value={newVehicleNumber}
                            onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                            className="flex-[2] tn-input h-9 text-[10px] font-bold uppercase"
                            placeholder="TN-00-AA-0000"
                        />
                        <input
                            type="text"
                            value={newVehicleModel}
                            onChange={(e) => setNewVehicleModel(e.target.value)}
                            className="flex-1 tn-input h-9 text-[10px] font-bold"
                            placeholder="Model"
                        />
                        <button
                            onClick={addVehicle}
                            disabled={!newVehicleNumber || !newVehicleModel}
                            className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <Plus size={16} />
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
                            className="bg-green-700 text-white px-6 h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                            {savingSection === 'fleet' ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={14} /> Save
                                </>
                            )}
                        </button>
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

            {/* 6. Documents */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    {docStats.hasFullVehicle && docStats.hasFullDriver ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Documents</h3>
                </div>
                <div className="pt-0">
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                        <DocumentVault onStatsUpdate={setDocStats} />
                    </div>
                </div>
            </div>

            {/* 7. Language */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    {settings.language ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-slate-300" />}
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Language</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                        {['English', 'Tamil', 'Kannada', 'Hindi'].map(lang => (
                            <div
                                key={lang}
                                onClick={() => setSelectedLanguage(lang)}
                                className={`p-2 border rounded-lg text-center cursor-pointer transition-colors ${selectedLanguage === lang
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                            >
                                <span className="text-xs font-bold">{lang}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={async () => {
                                setSavingSection('language');
                                updateSettings({ language: selectedLanguage });
                                const success = await saveSettings();
                                await new Promise(r => setTimeout(r, 500));
                                if (!success) alert('Failed to save settings. Please try again.');
                                setSavingSection(null);
                            }}
                            disabled={selectedLanguage === settings.language}
                            className="bg-green-700 text-white px-6 h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {savingSection === 'language' ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={14} /> Save Language
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 8. System Health */}
            <div className="pt-2">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <RefreshCw size={14} className="text-orange-500" />
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-orange-500 underline-offset-4">System Health</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
                    <p className="text-[10px] text-slate-500 font-bold mb-3">Updating issues or app acting slow? Try a hard refresh.</p>
                    <button
                        onClick={async () => {
                            if (window.confirm('This will refresh the app and clear cache to fix loading issues. Your data synced to cloud will be safe. Proceed?')) {
                                // 1. Unregister all service workers
                                if ('serviceWorker' in navigator) {
                                    const registrations = await navigator.serviceWorker.getRegistrations();
                                    for (const registration of registrations) {
                                        await registration.unregister();
                                    }
                                }
                                // 2. Clear caches
                                if ('caches' in window) {
                                    const keys = await caches.keys();
                                    for (const key of keys) {
                                        await caches.delete(key);
                                    }
                                }
                                // 3. Hard reload
                                window.location.href = window.location.origin + '?cache_bust=' + Date.now();
                            }
                        }}
                        className="w-auto px-8 bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
                    >
                        <RefreshCw size={14} /> Repair & Hard Refresh
                    </button>
                    <p className="text-[8px] text-slate-400 mt-2 text-center font-medium italic">Fixes "Cache not refreshing" and "Not saving" issues.</p>
                </div>
            </div>

            {/* 9. Help & Support */}
            <div className="pt-2">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-green-500 underline-offset-4">Support</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-[#25D366]/50 transition-colors">
                    <p className="text-xs text-slate-600 font-bold mb-4">Need help using Sarathi Book? Message our support team on WhatsApp.</p>
                    <a
                        href="https://wa.me/919952749408?text=I%20need%20help%20with%20Sarathi%20Book"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all hover:bg-[#20bd5a]"
                    >
                        <MessageCircle size={18} /> Chat on WhatsApp
                    </a>
                </div>
            </div>

            {/* 10. Legal & Compliance Footer */}
            <div className="pt-8 pb-4 text-center space-y-3">
                <div className="flex justify-center flex-wrap gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-full">
                    <span className="cursor-pointer hover:text-slate-600">Terms</span>
                    <span className="text-slate-200">•</span>
                    <span className="cursor-pointer hover:text-slate-600">Privacy</span>
                    <span className="text-slate-200">•</span>
                    <span className="cursor-pointer hover:text-slate-600">Compliance</span>
                </div>

                <div className="space-y-1 w-full">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4">
                        Designed for Indian Transport Operations
                    </p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter max-w-[250px] mx-auto leading-relaxed">
                        In compliance with Ministry of Road Transport & Highways (MoRTH) digital documentation guidelines.
                    </p>
                </div>

                <div className="pt-2">
                    <p className="text-[11px] font-black text-slate-900 tracking-tight">
                        © {new Date().getFullYear()} SARATHI BOOK
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        All Rights Reserved
                    </p>
                </div>

                <p className="text-[9px] text-slate-300 font-medium italic">
                    v1.0.5 - Heavy Duty Construction
                </p>
            </div>
        </div >
    );
};

export default Profile;
