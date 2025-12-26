import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Trash2, Plus, User as UserIcon, CheckCircle, Circle, Globe, Camera, LogOut, Landmark, HelpCircle, MessageCircle } from 'lucide-react';
import { validateGSTIN } from '../utils/validation';
import DocumentVault from './DocumentVault';
import GoogleSignInButton from './GoogleSignInButton';
import { supabase } from '../utils/supabase';

const Profile: React.FC = () => {
    const { user, signOut } = useAuth();
    const { settings, updateSettings, saveSettings } = useSettings();
    const [newVehicleNumber, setNewVehicleNumber] = useState('');
    const [newVehicleModel, setNewVehicleModel] = useState('');
    const [isEditingPhoto, setIsEditingPhoto] = useState(false);
    const [customPhotoUrl, setCustomPhotoUrl] = useState('');
    const [savingSection, setSavingSection] = useState<'business' | 'banking' | 'fleet' | 'language' | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<any>(settings.language || 'en'); // Use any to avoid import issue for now, or just string.


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
        if (user) {
            supabase.from('profiles').select('phone').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data?.phone && !settings.driverPhone) {
                        updateSettings({ driverPhone: data.phone });
                    }
                });
        }
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

    return (
        <div key={user?.id || 'guest'} className="space-y-4 pb-24">

            {/* Profile Header Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0047AB]/5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10 flex flex-col items-center text-center">

                    {/* Completion Bar */}
                    <div className="w-full mb-4">
                        <div className="flex justify-between items-end mb-1 px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Completion</span>
                            <span className={`text - xs font - black ${completion === 100 ? 'text-green-500' : 'text-[#0047AB]'} `}>{completion}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h - full rounded - full transition - all duration - 1000 ease - out ${completion === 100 ? 'bg-green-500' : 'bg-[#0047AB]'} `}
                                style={{ width: `${completion}% ` }}
                            ></div>
                        </div>
                        {completion < 100 && (
                            <p className="text-[9px] text-slate-400 mt-1 text-left font-bold">
                                Finish your profile to unlock full potential!
                            </p>
                        )}
                    </div>

                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
                            {(customPhotoUrl || user?.user_metadata?.avatar_url) ? (
                                <img
                                    src={customPhotoUrl || user?.user_metadata?.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : null}
                            {(!customPhotoUrl && !user?.user_metadata?.avatar_url) && (
                                <UserIcon size={32} className="text-slate-300" />
                            )}
                        </div>
                        {user && (
                            <button
                                onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                                className="absolute bottom-0 right-0 p-1.5 bg-[#0047AB] text-white rounded-full shadow-md hover:bg-blue-700 transition-colors"
                            >
                                <Camera size={12} />
                            </button>
                        )}
                        {isEditingPhoto && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-2 rounded-xl shadow-xl border border-slate-100 z-50 w-40 animate-fade-in">
                                <label className="block text-[10px] font-bold text-center py-2 text-slate-600 hover:bg-slate-50 cursor-pointer rounded-lg uppercase tracking-wider">
                                    Upload Photo
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button onClick={() => setCustomPhotoUrl('')} className="w-full text-[10px] font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg uppercase tracking-wider">Remove Photo</button>
                            </div>
                        )}
                    </div>

                    <h2 className="text-lg font-black text-slate-900 mt-2 uppercase tracking-tight">
                        {user?.user_metadata?.full_name || 'Guest Driver'}
                    </h2>

                    <div className="mt-1 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 mb-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            ID: <span className="text-[#0047AB]">{operatorId}</span>
                        </p>
                    </div>

                    <div className="w-full px-2">
                        {user ? (
                            <button
                                onClick={signOut}
                                className="w-full py-2.5 bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut size={14} /> Sign Out {user.email?.split('@')[0]}
                            </button>
                        ) : (
                            <GoogleSignInButton className="w-full shadow-md" />
                        )}
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
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Travels Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(_) => updateSettings({ companyName: _.target.value })}
                                className="tn-input h-10 text-xs font-bold"
                                placeholder="e.g. Saravana Travels"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-1 ml-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Number <span className="text-red-500">*</span></label>
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
                                className="tn-input h-10 text-xs font-bold"
                                placeholder="+91 99999 88888"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={settings.companyAddress}
                                onChange={(_) => updateSettings({ companyAddress: _.target.value })}
                                className="tn-input h-10 text-xs font-bold"
                                placeholder="State, City"
                            />
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={async () => {
                                    setSavingSection('business');
                                    await saveSettings();
                                    await new Promise(r => setTimeout(r, 500));
                                    setSavingSection(null);
                                }}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
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
                            className={`w - 10 h - 5 rounded - full relative cursor - pointer transition - colors ${settings.gstEnabled ? 'bg-green-500' : 'bg-slate-300'} `}
                        >
                            <div className={`absolute top - 1 w - 3 h - 3 bg - white rounded - full shadow - sm transition - all ${settings.gstEnabled ? 'left-6' : 'left-1'} `}></div>
                        </div>
                    </div>

                    {settings.gstEnabled && (
                        <div className="space-y-2 animate-fade-in pl-1">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number</label>
                                <input
                                    type="text"
                                    value={settings.gstin}
                                    onChange={(_) => updateSettings({ gstin: _.target.value.toUpperCase() })}
                                    className={`tn - input h - 10 text - xs font - bold ${settings.gstin && !validateGSTIN(settings.gstin) ? 'border-red-300 bg-red-50' : ''} `}
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                />
                            </div>
                        </div>
                    )}

                    {/* Bank Details */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Landmark size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Bank Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                                <input
                                    type="text"
                                    value={settings.holderName || ''}
                                    onChange={(_) => updateSettings({ holderName: _.target.value })}
                                    className="tn-input h-9 text-xs font-bold"
                                    placeholder="Name on Passbook"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                                <input
                                    type="text"
                                    value={settings.bankName || ''}
                                    onChange={(_) => updateSettings({ bankName: _.target.value })}
                                    className="tn-input h-9 text-xs font-bold"
                                    placeholder="e.g. SBI"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account No.</label>
                                <input
                                    type="text"
                                    value={settings.accountNumber || ''}
                                    onChange={(_) => updateSettings({ accountNumber: _.target.value })}
                                    className="tn-input h-9 text-xs font-bold"
                                    placeholder="XXXX XXXX"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-1 ml-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</label>
                                    <HelpCircle size={10} className="text-slate-300" />
                                </div>
                                <input
                                    type="text"
                                    value={settings.ifscCode || ''}
                                    onChange={(_) => updateSettings({ ifscCode: _.target.value.toUpperCase() })}
                                    className="tn-input h-9 text-xs font-bold uppercase"
                                    placeholder="SBIN000...."
                                />
                                <p className="text-[8px] text-slate-400 ml-1 mt-0.5 font-bold italic">Find this in your passbook</p>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 ml-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UPI ID (Optional)</label>
                                <HelpCircle size={10} className="text-slate-300" />
                            </div>
                            <input
                                type="text"
                                value={settings.upiId || ''}
                                onChange={(_) => updateSettings({ upiId: _.target.value })}
                                className="tn-input h-9 text-xs font-bold"
                                placeholder="e.g. 9999999999@upi"
                            />
                            <p className="text-[8px] text-slate-400 ml-1 mt-0.5 font-bold italic">PhonePe / GPay / Paytm ID for direct payment</p>
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={async () => {
                                setSavingSection('banking');
                                await saveSettings();
                                await new Promise(r => setTimeout(r, 500));
                                setSavingSection(null);
                            }}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            {savingSection === 'banking' ? (
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
                            className="w-9 h-9 flex items-center justify-center bg-slate-900 text-white rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={async () => {
                                setSavingSection('fleet');
                                await saveSettings();
                                await new Promise(r => setTimeout(r, 500));
                                setSavingSection(null);
                            }}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
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
                                await saveSettings();
                                await new Promise(r => setTimeout(r, 500));
                                setSavingSection(null);
                            }}
                            disabled={selectedLanguage === settings.language}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* 8. Help & Support */}
            <div className="pt-2">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-green-500 underline-offset-4">Support</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-600 font-bold mb-4">Need help using Sarathi Book? Message our support team on WhatsApp.</p>
                    <a
                        href="https://wa.me/919952749408?text=I%20need%20help%20with%20Sarathi%20Book"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-[#25D366] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                    >
                        <MessageCircle size={16} /> Chat on WhatsApp
                    </a>
                </div>
            </div>

            {/* 9. Sign Out */}
            <div className="pt-4">
                <button
                    onClick={signOut}
                    className="w-full bg-red-50 text-red-500 border border-red-100 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
        </div >
    );
};

export default Profile;
