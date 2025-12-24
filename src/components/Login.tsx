import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Smartphone, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Login: React.FC = () => {
    const { signInWithGoogle } = useAuth();
    const { t } = useSettings();

    return (
        <div className="h-full w-full bg-[#F5F7FA] flex flex-col items-center justify-center p-8">
            <div className="max-w-xs w-full p-10 bg-white border border-slate-200 rounded-[40px] shadow-2xl space-y-12 relative overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#0047AB]"></div>

                <div className="space-y-8 text-center pt-4">
                    <div className="w-24 h-24 bg-[#0047AB] text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-900/20 rotate-3">
                        <Briefcase size={48} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">{t('title') || 'SWA TAXI'}</h1>
                        <p className="text-[10px] text-[#0047AB] font-black tracking-[0.4em] uppercase mt-4 opacity-70">CABIN LOGISTICS SYSTEM</p>
                    </div>
                </div>

                <div className="space-y-6 text-left border-y border-slate-100 py-10 px-2">
                    <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-blue-50 text-[#0047AB] rounded-xl flex items-center justify-center border border-blue-100">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">GST Compliance</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">AUTOMATED TAX FILINGS</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-blue-50 text-[#0047AB] rounded-xl flex items-center justify-center border border-blue-100">
                            <FileText size={20} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">Smart Trip Sheets</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">DIGITAL LOG ARCHIVE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-blue-50 text-[#0047AB] rounded-xl flex items-center justify-center border border-blue-100">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">Mobile Control</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">OFFICIAL OPERATOR PORTAL</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 text-center pb-4">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full bg-[#0047AB] text-white font-black py-6 rounded-3xl flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/20"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5 bg-white rounded-lg p-0.5" />
                        OPEN WORKPLACE
                        <ArrowRight size={18} />
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        OFFICIAL SOFTWARE FOR<br />THE TRANSPORT GUILD
                    </p>
                </div>
            </div>

            {/* Version Badge */}
            <div className="mt-12 px-5 py-2 bg-white border border-slate-200 rounded-full flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">v2.4.0 • STABLE RELEASE</span>
            </div>
        </div>
    );
};

export default Login;
