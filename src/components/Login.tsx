import React from 'react';
import { Briefcase, Smartphone, ShieldCheck, FileText } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import GoogleSignInButton from './GoogleSignInButton';

const Login: React.FC = () => {
    const { t } = useSettings();

    return (
        <div className="h-full w-full bg-[#F5F7FA] flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-[400px] p-6 md:p-10 bg-white border border-slate-200 rounded-[32px] md:rounded-[40px] shadow-xl md:shadow-2xl space-y-8 md:space-y-12 relative overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#0047AB]"></div>

                <div className="space-y-6 md:space-y-8 text-center pt-2 md:pt-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-[#0047AB] text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-900/20 rotate-3">
                        <Briefcase className="w-10 h-10 md:w-12 md:h-12" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight uppercase leading-none">{t('title') || 'SWA TAXI'}</h1>
                        <p className="text-[10px] text-[#0047AB] font-bold tracking-wide uppercase mt-4 opacity-70">CABIN LOGISTICS SYSTEM</p>
                    </div>
                </div>

                <div className="space-y-5 md:space-y-6 text-left border-y border-slate-100 py-8 md:py-10 px-2">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-10 h-10 bg-blue-50 text-[#0047AB] rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">GST Compliance</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 md:mt-1 block">AUTOMATED TAX FILINGS</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-10 h-10 bg-blue-50 text-[#0047AB] rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                            <FileText size={20} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">Smart Trip Sheets</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 md:mt-1 block">DIGITAL LOG ARCHIVE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-10 h-10 bg-blue-50 text-[#0047AB] rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">Mobile Control</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 md:mt-1 block">OFFICIAL OPERATOR PORTAL</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 md:space-y-8 text-center pb-2 md:pb-4">
                    <GoogleSignInButton className="w-full shadow-lg" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                        OFFICIAL SOFTWARE FOR<br />THE TRANSPORT GUILD
                    </p>
                </div>
            </div>

            {/* Version Badge */}
            <div className="mt-8 md:mt-12 px-5 py-2 bg-white border border-slate-200 rounded-full flex items-center gap-3 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">v2.4.0 • STABLE RELEASE</span>
            </div>
        </div>
    );
};

export default Login;
