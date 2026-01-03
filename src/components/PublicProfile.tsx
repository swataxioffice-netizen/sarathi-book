import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Phone, BadgeCheck, Car, Star, MessageSquare, Coffee, Shield, Zap, TrendingUp, ChevronRight, Award } from 'lucide-react';

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
    const whatsappMsg = `Hello ${company}, I found your profile on Sarathi Book. I'm interested in booking a trip!`;
    const whatsappLink = `https://wa.me/${settings.driverPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Immersive Header */}
            <div className="relative h-64 bg-[#0047AB] overflow-hidden">
                {/* Abstract Patterns */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }}></div>
                </div>

                {/* Gradient Gloss */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                {/* Floating Elements */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-blue-400/20 blur-3xl rounded-full animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full"></div>

                {/* Back Link */}
                <div className="absolute top-6 left-6 z-20">
                    <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-[9px] font-black uppercase tracking-widest">
                        Digital Profile
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-32 relative z-10 pb-20">
                {/* Main Identity Card */}
                <div className="bg-white rounded-[40px] shadow-2xl p-8 text-center border border-white relative overflow-hidden">
                    {/* Top Right ID Badge */}
                    {profile.driver_code && (
                        <div className="absolute top-6 right-6 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">Code: #{profile.driver_code}</span>
                        </div>
                    )}

                    {/* Avatar Circle */}
                    <div className="relative inline-block mb-6">
                        <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[35px] mx-auto p-1.5 shadow-xl rotate-3">
                            <div className="w-full h-full bg-white rounded-[30px] flex items-center justify-center text-3xl font-black text-[#0047AB] uppercase -rotate-3 overflow-hidden">
                                {company[0]}
                                <div className="absolute inset-0 bg-blue-50/50 flex flex-col items-center justify-center">
                                    <Car size={32} className="opacity-20 translate-y-2 translate-x-2" />
                                </div>
                            </div>
                        </div>
                        {/* Verified Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg">
                            <div className="bg-green-500 text-white p-1 rounded-full">
                                <BadgeCheck size={20} fill="currentColor" className="text-white" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">
                        {company}
                    </h1>

                    <div className="flex items-center justify-center gap-2 mb-8">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Partner</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center flex flex-col group hover:scale-105 transition-transform cursor-default">
                            <Star className="text-blue-600 mb-1" size={16} fill="currentColor" />
                            <span className="text-[14px] font-black text-blue-900 leading-none">5.0</span>
                            <span className="text-[8px] font-black text-blue-500 uppercase mt-1">Rating</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center flex flex-col group hover:scale-105 transition-transform cursor-default">
                            <Award className="text-indigo-600 mb-1" size={16} />
                            <span className="text-[14px] font-black text-indigo-900 leading-none">100%</span>
                            <span className="text-[8px] font-black text-indigo-500 uppercase mt-1">Safety</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 items-center justify-center flex flex-col group hover:scale-105 transition-transform cursor-default">
                            <TrendingUp className="text-slate-600 mb-1" size={16} />
                            <span className="text-[14px] font-black text-slate-900 leading-none">99%</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase mt-1">On-Time</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        <a href={`tel:${settings.driverPhone}`} className="w-full bg-[#0047AB] text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-blue-700">
                            <Phone size={18} /> Call for Booking
                        </a>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-[#128C7E]">
                            <MessageSquare size={18} /> Chat on WhatsApp
                        </a>
                    </div>
                </div>

                {/* About & Services */}
                <div className="mt-8 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Coffee className="text-orange-500" size={18} />
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Our Service Promises</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: <Shield size={16} />, label: 'Safety First', sub: 'Verified Drivers' },
                                { icon: <Zap size={16} />, label: 'Fast Pickups', sub: 'No Waiting Time' },
                                { icon: <Car size={16} />, label: 'Clean Fleet', sub: 'Daily Sanitized' },
                                { icon: <TrendingUp size={16} />, label: 'Fair Rates', sub: 'No Hidden Costs' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-0.5">{item.label}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Car className="text-blue-400" size={18} />
                                <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Premium Vehicle</h3>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:translate-x-1 transition-transform" size={16} />
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                <Car size={24} className="text-white opacity-80" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-white uppercase tracking-tight">
                                    {settings.vehicles?.[0]?.model || 'Luxury Category'}
                                </p>
                                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-1">
                                    A/C • Clean Interior • Music System
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="mt-12 text-center">
                    <div className="inline-block p-1 bg-slate-200/50 rounded-full px-4 mb-4">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Verified Digital Sarathi</p>
                    </div>
                    <h3 className="text-lg font-black text-slate-300 uppercase tracking-tighter flex items-center justify-center gap-2">
                        SARATHI <span className="text-blue-200">BOOK</span>
                    </h3>
                </div>
            </div>

            {/* Elegant Background Texture Layer */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
        </div>
    );
};

export default PublicProfile;
