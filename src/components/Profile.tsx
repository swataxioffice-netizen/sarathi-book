import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
    User as UserIcon, LogOut,
    Contact, Landmark, Car, FileText, ChevronRight,
    RefreshCw, X, Trash2, Sparkles, Crown
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { VEHICLES } from '../config/vehicleRates';
import { validateVehicleNumber } from '../utils/validation';

// Sub-components
import DocumentVault from './DocumentVault';
import BusinessCard from './BusinessCard';
import { subscribeToPush } from '../utils/push';

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

const Profile: React.FC = () => {
    // Contexts
    const { user, signOut, loading: authLoading } = useAuth();
    const { settings, updateSettings, saveSettings, docStats } = useSettings();

    // Local State
    const [activeTab, setActiveTab] = useState<'business' | 'payments' | 'vehicles' | 'docs'>('business');
    const [showCard, setShowCard] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [showStudio, setShowStudio] = useState(false);

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
        await saveSettings();
        await new Promise(r => setTimeout(r, 400));
        setSavingSection(null);
    };

    const handleAddVehicle = () => {
        if (!newVehicleNumber || !selectedCategoryId) return;

        if (!settings.isPremium && settings.vehicles.length >= 1) {
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
            <div className="bg-white border border-slate-200 rounded-[32px] p-5 shadow-sm relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-white shadow-md bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={24} className="text-slate-300" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-black text-slate-900 uppercase tracking-tight truncate flex items-center gap-2">
                            {user?.user_metadata?.full_name || 'Driver'}
                            {settings.isPremium && (
                                <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black border border-amber-200">PRO</span>
                            )}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            ID: <span className="text-blue-600">{user?.id?.slice(0, 6).toUpperCase() || 'GUEST'}</span>
                        </p>
                        <div className="flex gap-4 mt-2">
                            <button onClick={() => setShowStudio(true)} className="flex items-center gap-1 text-[10px] font-black text-pink-600 uppercase tracking-widest hover:text-pink-700 transition-colors">
                                <Sparkles size={12} /> Pro Features
                            </button>
                            <button onClick={signOut} className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                                <LogOut size={12} /> Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150.8} strokeDashoffset={150.8 * (1 - completion / 100)} className="text-green-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xs font-black text-slate-900">{completion}%</span>
                    </div>
                </div>
            </div>

            {/* 2. Tabs Navigation */}
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-6 sticky top-2 z-20 gap-1">
                {(['business', 'payments', 'vehicles', 'docs'] as const).map(tab => {
                    const isActive = activeTab === tab;
                    const icons = { business: <Contact size={14} />, payments: <Landmark size={14} />, vehicles: <Car size={14} />, docs: <FileText size={14} /> };
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
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">GST Number (Optional)</label>
                                    <input value={settings.gstin || ''} onChange={e => updateSettings({ gstin: e.target.value.toUpperCase() })} className="w-full h-12 border-b-2 border-slate-100 font-bold text-sm focus:border-blue-500 outline-none transition-colors uppercase" placeholder="GSTIN" maxLength={15} />
                                </div>
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

                {activeTab === 'docs' && (
                    <div className="animate-scale-in">
                        <DocumentVault />
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
                        <BusinessCard />
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
