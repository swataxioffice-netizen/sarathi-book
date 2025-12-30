import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Phone, MapPin, BadgeCheck, Car, Star } from 'lucide-react';

interface PublicProfileProps {
    userId: string;
}

interface ProfileData {
    settings: {
        companyName: string;
        driverPhone: string;
        companyAddress: string;
        vehicles: any[];
        companyLogo?: string;
    };
    full_name?: string;
    avatar_url?: string;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ userId }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch profile settings (public read access assumed/required on 'profiles' table for this to work)
                // If RLS is strict, we might need an Edge Function or RPC, but usually profiles are public readable
                const { data, error } = await supabase
                    .from('profiles')
                    .select('settings, id') // selecting minimal fields
                    .eq('id', userId)
                    .single();

                if (error || !data) throw error || new Error('Profile not found');

                // Parse if needed (supabase returns typed data, but settings is jsonb)
                setProfile(data as any);
            } catch (err) {
                console.error('Error fetching public profile:', err);
                setError('Profile not found or inaccessible.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchProfile();
    }, [userId]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#0047AB] border-t-transparent rounded-full"></div>
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
            <div>
                <h1 className="text-2xl font-black text-slate-300">404</h1>
                <p className="text-slate-500 font-medium">Driver page not found.</p>
            </div>
        </div>
    );

    const { settings } = profile;
    const company = settings.companyName || 'Private Driver';

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header / Cover */}
            <div className="bg-[#0047AB] h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-transparent"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-20 relative z-10 pb-20">
                {/* Profile Card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 text-center border border-slate-100">
                    <div className="w-24 h-24 bg-white rounded-full mx-auto -mt-16 p-1 shadow-lg mb-4">
                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-2xl font-black text-[#0047AB] uppercase">
                            {company[0]}
                        </div>
                    </div>

                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">
                        {company}
                    </h1>
                    <div className="flex items-center justify-center gap-1.5 mb-4">
                        <BadgeCheck size={16} className="text-green-500" fill="currentColor" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Partner</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <a href={`tel:${settings.driverPhone}`} className="bg-[#0047AB] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <Phone size={16} /> Call Now
                        </a>
                        <button disabled className="bg-slate-100 text-slate-400 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                            <MapPin size={16} /> Locate
                        </button>
                    </div>

                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                <Car size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle</p>
                                <p className="text-xs font-black text-slate-800 uppercase">
                                    {settings.vehicles?.[0]?.model || 'Luxury Cab'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                <Star size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rating</p>
                                <p className="text-xs font-black text-slate-800 uppercase">
                                    5.0 (Excellent)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon Form */}
                <div className="mt-6 text-center">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm opacity-70">
                        <div className="h-2 w-24 bg-slate-200 rounded-full mx-auto mb-6"></div>
                        <div className="space-y-4 mb-6 blur-[2px] select-none pointer-events-none">
                            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                            <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center z-20 top-60"> {/* Overlay on top of the blur div basically? No, needs relative parent */}
                            {/* Fix overlay: */}
                        </div>

                        {/* Actual Message */}
                        <div className="relative z-10 -mt-24">
                            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                Online Booking Coming Soon
                            </span>
                            <p className="mt-4 text-xs font-bold text-slate-500 max-w-[200px] mx-auto">
                                We are building a custom booking page for {company}. Stay tuned!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center opacity-40">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by</p>
                    <h3 className="text-lg font-black text-slate-600 uppercase tracking-tighter">SARATHI BOOK</h3>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
