import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { User as UserIcon, Car, Trash2, ShieldCheck, ChevronRight, Globe, Search, Mail, Phone, MapPin } from 'lucide-react';
import { validateGSTIN } from '../utils/validation';

const Profile: React.FC = () => {
    const { user, signOut } = useAuth();
    const { settings, updateSettings } = useSettings();
    const [newVehicleNumber, setNewVehicleNumber] = useState('');
    const [newVehicleModel, setNewVehicleModel] = useState('');

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

    return (
        <div className="space-y-6 pb-24">
            {/* Professional Operator Identifier */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                <div className="w-20 h-20 bg-[#0047AB] rounded-2xl flex items-center justify-center text-white shadow-inner">
                    <UserIcon size={36} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-black text-slate-900 leading-none">
                        {user?.user_metadata?.full_name?.toUpperCase() || 'OFFICIAL DRIVER'}
                    </h2>
                    <p className="text-[10px] font-black text-[#0047AB] uppercase tracking-[0.2em] mt-2 opacity-70">
                        OPERATOR ID: {user?.id?.slice(0, 8).toUpperCase()}
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail size={12} />
                            <span className="text-[10px] font-bold">{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fleet Directory */}
            <div className="space-y-3">
                <div className="flex flex-col items-center gap-2 px-1 pb-2">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 px-8">Vehicle Directory</h3>
                    <span className="text-[9px] font-black text-[#0047AB] bg-blue-50 px-3 py-1 rounded-full">{settings.vehicles.length} UNITS</span>
                </div>
                <div className="grid gap-3">
                    {settings.vehicles.map((v) => (
                        <div
                            key={v.id}
                            onClick={() => updateSettings({ currentVehicleId: v.id })}
                            className={`flex items-center justify-between p-5 bg-white border transition-all cursor-pointer rounded-2xl ${settings.currentVehicleId === v.id
                                ? 'border-[#0047AB] shadow-md ring-1 ring-[#0047AB]'
                                : 'border-slate-200 text-slate-400 opacity-60'
                                }`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`p-3 rounded-xl ${settings.currentVehicleId === v.id ? 'bg-blue-50 text-[#0047AB]' : 'bg-slate-50 text-slate-300'}`}>
                                    <Car size={24} />
                                </div>
                                <div className="leading-tight">
                                    <p className={`text-base font-black uppercase tracking-tight ${settings.currentVehicleId === v.id ? 'text-slate-900' : ''}`}>{v.model}</p>
                                    <p className={`text-[11px] font-black tracking-[0.2em] mt-1.5 ${settings.currentVehicleId === v.id ? 'text-[#0047AB]' : ''}`}>
                                        {v.number}
                                    </p>
                                </div>
                            </div>
                            {settings.currentVehicleId === v.id ? (
                                <ShieldCheck size={22} className="text-[#0047AB]" />
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteVehicle(v.id); }}
                                    className="p-3 text-slate-300 hover:text-red-500 active:scale-90 transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">MODEL NAME</label>
                            <input type="text" placeholder="e.g. DZIRE" value={newVehicleModel} onChange={(_) => setNewVehicleModel(_.target.value)} className="tn-input h-12 bg-white text-xs border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">PLATE NUMBER</label>
                            <input type="text" placeholder="TN 01 XX 0000" value={newVehicleNumber} onChange={(_) => setNewVehicleNumber(_.target.value)} className="tn-input h-12 bg-white text-xs border-slate-200" />
                        </div>
                    </div>
                    <button onClick={addVehicle} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-black active:scale-[0.98] transition-all">REGISTER UNIT</button>
                </div>
            </div>

            {/* Headquarters Configuration */}
            <div className="space-y-3">
                <div className="flex justify-center items-center px-1 pb-2">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 px-8">Business Protocol</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                <Globe size={12} /> ENTERPRISE NAME
                            </label>
                            <input type="text" value={settings.companyName} onChange={(_) => updateSettings({ companyName: _.target.value })} className="tn-input border-slate-200 h-14 font-black text-slate-900" placeholder="OFFICIAL FIRM NAME" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                <Phone size={12} /> DISPATCH CONTACT
                            </label>
                            <input type="text" value={settings.driverPhone} onChange={(_) => updateSettings({ driverPhone: _.target.value })} className="tn-input border-slate-200 h-14 font-black text-slate-900" placeholder="+91 00000 00000" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                            <MapPin size={12} /> REGISTERED OFFICE ADDRESS
                        </label>
                        <textarea value={settings.companyAddress} onChange={(_) => updateSettings({ companyAddress: _.target.value })} className="tn-input border-slate-200 min-h-[100px] font-bold text-sm bg-slate-50" placeholder="FULL BUSINESS ADDRESS" />
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">OFFICIAL GSTIN (15-DIGIT)</label>
                            <div className="flex gap-2">
                                <input type="text" value={settings.gstin} onChange={(_) => updateSettings({ gstin: _.target.value.toUpperCase() })} className={`tn-input h-14 font-black uppercase flex-1 border-slate-200 ${settings.gstin && !validateGSTIN(settings.gstin) ? 'border-red-500 ring-2 ring-red-100' : ''}`} placeholder="ENTER GSTIN" maxLength={15} />
                                <button onClick={() => window.open(`https://www.gst.gov.in/searchuser`, '_blank')} className="px-5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-200 active:scale-95 transition-all">
                                    <Search size={22} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl transition-all ${settings.gstEnabled ? 'bg-[#00965E] text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    <ShieldCheck size={24} strokeWidth={2.5} />
                                </div>
                                <div className="leading-none">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">AUTO GST LEVY</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">Apply 5% globally</p>
                                </div>
                            </div>
                            <button onClick={() => updateSettings({ gstEnabled: !settings.gstEnabled })} className={`w-14 h-8 rounded-full border-2 border-slate-200 relative transition-all ${settings.gstEnabled ? 'bg-[#00965E]' : 'bg-slate-200'}`}>
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${settings.gstEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Localization Controls */}
            <div className="space-y-3 pb-8">
                <div className="flex justify-center items-center px-1 pb-2">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 px-8">System Localization</h3>
                </div>
                <button
                    onClick={() => updateSettings({ language: settings.language === 'en' ? 'ta' : 'en' })}
                    className="w-full flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-[#0047AB] transition-all group"
                >
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[#0047AB] group-hover:scale-110 transition-transform">
                            <Globe size={24} />
                        </div>
                        <div className="text-left leading-none">
                            <p className="text-sm font-black text-slate-900 uppercase">Input Language</p>
                            <p className="text-[10px] font-black text-[#0047AB] uppercase mt-2 tracking-widest">{settings.language === 'en' ? 'ENGLISH (USA)' : 'தமிழ் (INDIA)'}</p>
                        </div>
                    </div>
                    <ChevronRight size={24} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <button onClick={signOut} className="w-full py-5 bg-white border-2 border-red-100 text-red-500 font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                EXIT OPERATOR PORTAL
            </button>
        </div>
    );
};

export default Profile;
