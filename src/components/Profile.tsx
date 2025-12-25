import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { User as UserIcon, Trash2, Camera, LogOut, LogIn, Globe, Plus } from 'lucide-react';
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
        <div key={user?.id || 'guest'} className="space-y-4 pb-24">

            {/* 1. Driver Card & Authentication */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0047AB]/5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10 flex flex-col items-center text-center">

                    {/* Profile Photo */}
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

                    <div className="mt-1 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            ID: <span className="text-[#0047AB]">{operatorId}</span>
                        </p>
                    </div>

                    <div className="mt-4 w-full px-2">
                        {user ? (
                            <button
                                onClick={signOut}
                                className="w-full py-2.5 bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut size={14} /> Sign Out {user.email?.split('@')[0]}
                            </button>
                        ) : (
                            <button
                                onClick={signInWithGoogle}
                                className="w-full py-2.5 bg-[#0047AB] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-900/10"
                            >
                                <LogIn size={14} /> Sign In with Google
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Business Details */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Business Profile</h3>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                    <div className="space-y-2">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(_) => updateSettings({ companyName: _.target.value })}
                                className="tn-input h-10 text-xs font-bold"
                                placeholder="Your Travels Name"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={settings.driverPhone}
                                onChange={(_) => updateSettings({ driverPhone: _.target.value })}
                                className="tn-input h-10 text-xs font-bold"
                                placeholder="+91 99999 88888"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address / Location</label>
                            <input
                                type="text"
                                value={settings.companyAddress}
                                onChange={(_) => updateSettings({ companyAddress: _.target.value })}
                                className="tn-input h-10 text-xs font-bold"
                                placeholder="State, City"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. GST & Bank */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-green-500 underline-offset-4">Legal & Banking</h3>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
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
                        <div className="space-y-2 animate-fade-in">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number</label>
                                <input
                                    type="text"
                                    value={settings.gstin}
                                    onChange={(_) => updateSettings({ gstin: _.target.value.toUpperCase() })}
                                    className={`tn-input h-10 text-xs font-bold ${settings.gstin && !validateGSTIN(settings.gstin) ? 'border-red-300 bg-red-50' : ''}`}
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                />
                                {settings.gstin && !validateGSTIN(settings.gstin) && (
                                    <p className="text-[8px] text-red-500 font-bold mt-1 ml-1">Invalid GST Format</p>
                                )}
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Number</label>
                                <input
                                    type="text"
                                    value={settings.pan}
                                    onChange={(_) => updateSettings({ pan: _.target.value.toUpperCase() })}
                                    className="tn-input h-10 text-xs font-bold"
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Fleet Management */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-purple-500 underline-offset-4">Fleet Manager</h3>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                    <div className="space-y-2">
                        {settings.vehicles.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl group relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${settings.currentVehicleId === v.id ? 'bg-[#0047AB]' : 'bg-slate-300'}`}></div>
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
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Documents */}
            <DocumentVault />
        </div>
    );
};

export default Profile;
