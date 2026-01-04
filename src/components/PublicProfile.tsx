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

    const { settings, full_name, avatar_url } = profile;
    const company = settings.companyName || full_name || 'Professional Driver';
    const phone = settings.driverPhone;
    const vehicles = settings.vehicles || [];
    const services = settings.services || ['Outstation', 'Local Hourly', 'Airport Transfer', 'One Way Drop'];

    const handleBookNow = () => {
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
                        <div className="w-28 h-28 bg-white p-1 rounded-full mx-auto mb-4 shadow-xl">
                            {avatar_url ? (
                                <img src={avatar_url} alt={company} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                    <Car size={40} />
                                </div>
                            )}
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">{company}</h1>
                        <div className="flex items-center justify-center gap-2 text-blue-200">
                            <Shield size={14} className="text-green-400 fill-current" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Verified Partner</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="-mt-8 px-6 relative z-20 space-y-6">

                    {/* Action Card */}
                    <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 flex gap-3">
                        <button
                            onClick={() => window.open(`tel:${phone}`)}
                            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-900 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest border border-slate-200 transition-colors"
                        >
                            Call Now
                        </button>
                        <button
                            onClick={handleBookNow}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-500/30 transition-colors"
                        >
                            WhatsApp
                        </button>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Services Offered</h3>
                        <div className="flex flex-wrap gap-2">
                            {services.map((service, i) => (
                                <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
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
                                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{v.model}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{v.type} • {v.seatCapacity || 4} Seater</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No vehicles listed yet.</p>
                        )}
                    </div>

                    {/* Footer Branding */}
                    <div className="pt-8 pb-4 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Book with</p>
                        <h3 className="text-base font-black text-slate-300 uppercase tracking-tighter flex items-center justify-center gap-1.5 grayscale opacity-70">
                            SARATHI <span className="text-blue-500">BOOK</span>
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
