import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Car, Shield } from 'lucide-react';

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
        services?: string[];
    };
    full_name?: string;
    avatar_url?: string;
    driver_code?: number;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ userId }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('settings, id, driver_code')
                    .eq('id', userId)
                    .single();

                if (error || !data) throw error || new Error('Profile not found');
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
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
            <div className="tn-card max-w-sm">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield size={40} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Profile Not Found</h1>
                <p className="text-slate-500 font-medium mt-2">The driver profile you are looking for does not exist or has been removed.</p>
                <a href="/" className="mt-6 inline-block text-blue-600 font-black text-[10px] uppercase tracking-widest border-b-2 border-blue-600 pb-1">Back to Home</a>
            </div>
        </div>
    );

    const { settings } = profile;
    const company = settings.companyName || 'Premium Partner';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] z-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <div className="relative z-10 max-w-sm w-full bg-white rounded-3xl p-10 shadow-2xl border border-slate-100">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Car size={40} className="relative z-10" />
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping"></div>
                </div>

                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">
                    {company}
                </h2>
                <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Partner</span>
                </div>

                <div className="py-6 border-t border-b border-slate-50 mb-6">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Coming Soon</h1>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                        We are building an amazing digital profile for this driver. Stay tuned for seamless booking and verification features!
                    </p>
                </div>

                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Powered By</p>
                    <h3 className="text-lg font-black text-slate-300 uppercase tracking-tighter flex items-center justify-center gap-1.5">
                        SARATHI <span className="text-blue-500">BOOK</span>
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
