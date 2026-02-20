import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Car, Shield, AlertCircle, RefreshCw, Phone, MessageCircle } from 'lucide-react';

interface PublicProfileProps {
    userId: string;
}

interface ProfileData {
    settings: {
        companyName: string;
        driverPhone: string;
        companyAddress: string;
        vehicles: { model: string; type: string; seatCapacity?: number }[];
        companyLogo?: string;
        services?: string[];
        secondaryPhone?: string;
        companyEmail?: string;
        websiteUrl?: string;
        contactPerson?: string;
    } | null;
    id: string;
    full_name?: string;
    avatar_url?: string;
    picture?: string;
    avatarUrl?: string;
    driver_code?: number;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ userId }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProfile = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Timeout promise to prevent infinite loading (15 seconds)
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out. Please check your internet connection.')), 15000)
            );

            const dbPromise = supabase
                .from('profiles')
                .select('settings, id, full_name, avatar_url, picture, avatarUrl, driver_code') // Ensure all fields are explicitly selected
                .eq('id', userId)
                .single();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (Promise.race([dbPromise, timeoutPromise]) as Promise<{ data: ProfileData; error: any }>);

            if (error || !data) throw error || new Error('Profile not found');
            setProfile(data);
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error('Error fetching public profile:', error);
            setError(error.message || 'Profile not found or inaccessible.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) fetchProfile();
    }, [userId, fetchProfile]);

    if (loading) return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                    <AlertCircle size={40} />
                </div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">Unavailable</h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                    {error === 'Profile not found or inaccessible.'
                        ? 'The driver profile you are looking for does not exist or has been removed.'
                        : error}
                </p>

                <button
                    onClick={fetchProfile}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 mb-3"
                >
                    <RefreshCw size={14} /> Retry
                </button>

                <a href="/" className="inline-block text-blue-600 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent hover:border-blue-600 transition-all">
                    Go to Home
                </a>
            </div>
        </div>
    );

    // Safe access to nested properties
    const settings = profile.settings || {
        companyName: '',
        driverPhone: '',
        companyAddress: '',
        vehicles: [],
        services: []
    };
    const full_name = profile.full_name;
    const avatar_url = profile.avatar_url || profile.picture || profile.avatarUrl;

    // Fallbacks
    const company = settings.companyName || full_name || 'Professional Driver';
    const phone = settings.driverPhone;
    const vehicles = settings.vehicles || [];
    const services = settings.services || ['Outstation', 'Local Hourly', 'Airport Transfer'];

    // Operator ID
    const operatorId = profile.driver_code ? `#${profile.driver_code}` : null;

    const handleBookNow = () => {
        if (!phone) {
            alert('Contact number not available.');
            return;
        }
        const message = `Hi, I saw your profile on SarathiBook. I would like to enquire about a trip.`;
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <div className="relative z-10 max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-y-auto pb-24">
                {/* Header / Cover */}
                <div className="bg-[#0047AB] p-6 pt-12 pb-16 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

                    <div className="relative z-10">
                        <div className="w-28 h-28 bg-white p-1.5 rounded-full mx-auto mb-4 shadow-xl ring-4 ring-white/10">
                            {avatar_url ? (
                                <img src={avatar_url} alt={company} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                    <Car size={40} />
                                </div>
                            )}
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight mb-2 text-white drop-shadow-md leading-tight">{company}</h1>
                        <div className="flex items-center justify-center gap-3 text-blue-200">
                            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                                <Shield size={12} className="text-green-400 fill-current" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Verified</span>
                            </div>
                            {operatorId && (
                                <span className="text-[10px] font-bold text-white/60 tracking-widest">{operatorId}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="-mt-8 px-6 relative z-20 space-y-6">

                    {/* Action Card */}
                    <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 flex gap-3">
                        <button
                            onClick={() => phone ? window.open(`tel:${phone}`) : alert('Phone number not available')}
                            disabled={!phone}
                            className={`flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-900 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest border border-slate-200 transition-colors ${!phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Phone size={14} className="text-slate-900" /> Call
                        </button>
                        <button
                            onClick={handleBookNow}
                            disabled={!phone}
                            className={`flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1faa53] text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-500/30 transition-all active:scale-95 ${!phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <MessageCircle size={14} className="text-white" /> WhatsApp
                        </button>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Services Offered</h3>
                        <div className="flex flex-wrap gap-2">
                            {services.map((service, i) => (
                                <span key={i} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 shadow-sm">
                                    {service}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Fleet */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Our Fleet</h3>
                        {vehicles.length > 0 ? (
                            <div className="space-y-3">
                                {vehicles.map((v, i) => (
                                    <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{v.model}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{v.type} • {v.seatCapacity || 4 + 1} Seater</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">AC</span>
                                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Music</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <Car size={24} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400 font-medium">No vehicles listed yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Branding */}
                    <div className="pt-8 pb-4 text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Powered By</p>
                        <h3 className="text-sm font-black text-slate-300 uppercase tracking-tighter flex items-center justify-center gap-1.5 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                            SARATHI<span className="text-blue-500">BOOK</span>
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
