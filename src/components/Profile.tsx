import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { User as UserIcon, Car, Trash2, ShieldCheck, ChevronRight, Globe, Search, Mail, Phone, MapPin, Camera, LogOut, LogIn, FileText } from 'lucide-react';
import { validateGSTIN } from '../utils/validation';
import DocumentVault from './DocumentVault';

const Profile: React.FC = () => {
    const { user, signInWithGoogle, signOut } = useAuth();
    const { settings, updateSettings } = useSettings();
    const [newVehicleNumber, setNewVehicleNumber] = useState('');
    const [newVehicleModel, setNewVehicleModel] = useState('');
    const [isEditingPhoto, setIsEditingPhoto] = useState(false);
    const [customPhotoUrl, setCustomPhotoUrl] = useState('');

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
            setCustomPhotoUrl(url); // Locally preview. In real app, upload to storage.
            setIsEditingPhoto(false);
        }
    };

    const operatorId = user ? `OP-${user.id.slice(0, 6).toUpperCase()}-${new Date().getFullYear()}` : 'GUEST-DRIVER';

    return (
        <div className="space-y-6 pb-24">

            {/* 1. Driver Card & Authentication */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0047AB]/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10 flex flex-col items-center text-center">

                    {/* Profile Photo */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                            {customPhotoUrl || user?.user_metadata?.avatar_url ? (
                                <img src={customPhotoUrl || user?.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={40} className="text-slate-300" />
                            )}
                        </div>
                        {user && (
                            <button
                                onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                                className="absolute bottom-0 right-0 p-2 bg-[#0047AB] text-white rounded-full shadow-md hover:bg-blue-700 transition-colors"
                            >
                                <Camera size={14} />
                            </button>
                        )}
                        {isEditingPhoto && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-2 rounded-xl shadow-xl border border-slate-100 z-50 w-48 animate-fade-in">
                                <label className="block text-[10px] font-bold text-center py-2 text-slate-600 hover:bg-slate-50 cursor-pointer rounded-lg">
                                    Upload New Photo
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button onClick={() => setCustomPhotoUrl('')} className="w-full text-[10px] font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg">Remove Photo</button>
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-black text-slate-900 mt-4 uppercase tracking-tight">
                        {user?.user_metadata?.full_name || 'Guest Driver'}
                    </h2>

                    <div className="mt-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            ID: <span className="text-[#0047AB]">{operatorId}</span>
                        </p>
                    </div>

                    <div className="mt-6 w-full">
                        {user ? (
                            <button
                                onClick={signOut}
                                className="w-full py-3 bg-red-50 text-red-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        ) : (
                            <button
                                onClick={signInWithGoogle}
                                className="w-full py-3 bg-[#0047AB] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                <LogIn size={16} /> Sign In with Google
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Business Details (Mandatory) */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 pb-1">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Business Details</h3>
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">* MANDATORY</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                                <Globe size={10} /> Enterprise Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(_) => updateSettings({ companyName: _.target.value })}
                                className="tn-input border-slate-200 font-bold text-slate-900"
                                placeholder="Your Travels Name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                                <Phone size={10} /> Contact Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={settings.driverPhone}
                                onChange={(_) => updateSettings({ driverPhone: _.target.value })}
                                className="tn-input border-slate-200 font-bold text-slate-900"
                                placeholder="+91 99999 88888"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                                <MapPin size={10} /> Registered Address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={settings.companyAddress}
                                onChange={(_) => updateSettings({ companyAddress: _.target.value })}
                                className="tn-input border-slate-200 min-h-[80px] font-bold text-xs bg-slate-50 resize-none pt-3"
                                placeholder="Full Street Address, City, Zip"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                                <ShieldCheck size={10} /> GSTIN (Optional)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.gstin}
                                    onChange={(_) => updateSettings({ gstin: _.target.value.toUpperCase() })}
                                    className={`tn-input font-black uppercase flex-1 border-slate-200 ${settings.gstin && !validateGSTIN(settings.gstin) ? 'border-red-300 bg-red-50' : ''}`}
                                    placeholder="GST Number"
                                    maxLength={15}
                                />
                                {settings.gstin && validateGSTIN(settings.gstin) && (
                                    <div className="w-10 flex items-center justify-center bg-green-50 rounded-xl border border-green-200 text-green-600">
                                        <ShieldCheck size={18} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Vehicle Directory */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 pb-1">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Fleet Management</h3>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <div className="space-y-3">
                    {settings.vehicles.map((v) => (
                        <div
                            key={v.id}
                            onClick={() => updateSettings({ currentVehicleId: v.id })}
                            className={`flex items-center justify-between p-4 bg-white border transition-all cursor-pointer rounded-2xl ${settings.currentVehicleId === v.id
                                ? 'border-[#0047AB] shadow-md ring-1 ring-[#0047AB]'
                                : 'border-slate-200 text-slate-400 opacity-60'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl ${settings.currentVehicleId === v.id ? 'bg-blue-50 text-[#0047AB]' : 'bg-slate-50 text-slate-300'}`}>
                                    <Car size={20} />
                                </div>
                                <div className="leading-tight">
                                    <p className={`text-sm font-black uppercase tracking-tight ${settings.currentVehicleId === v.id ? 'text-slate-900' : ''}`}>{v.model}</p>
                                    <p className={`text-[10px] font-black tracking-[0.1em] mt-0.5 ${settings.currentVehicleId === v.id ? 'text-[#0047AB]' : ''}`}>
                                        {v.number}
                                    </p>
                                </div>
                            </div>
                            {settings.currentVehicleId === v.id ? (
                                <div className="px-3 py-1 bg-[#0047AB] text-white text-[9px] font-black uppercase rounded-full tracking-wider">Active</div>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteVehicle(v.id); }}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Model (e.g. Innova)" value={newVehicleModel} onChange={(_) => setNewVehicleModel(_.target.value)} className="tn-input h-10 bg-white text-xs border-slate-200" />
                            <input type="text" placeholder="Number (TN 01 AB 1234)" value={newVehicleNumber} onChange={(_) => setNewVehicleNumber(_.target.value)} className="tn-input h-10 bg-white text-xs border-slate-200" />
                        </div>
                        <button onClick={addVehicle} className="w-full py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all">
                            + Add Vehicle
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Document Vault */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 pb-1">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Document Vault</h3>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <DocumentVault />
            </div>

            {/* 5. System Settings */}
            <div className="pt-4 border-t border-slate-100">
                <button
                    onClick={() => updateSettings({ language: settings.language === 'en' ? 'ta' : 'en' })}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl active:scale-[0.99] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <Globe size={18} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Interface Language</span>
                    </div>
                    <span className="text-[10px] font-black text-[#0047AB] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">{settings.language === 'en' ? 'English' : 'Tamil'}</span>
                </button>
            </div>
        </div>
    );
};

export default Profile;
