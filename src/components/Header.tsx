import React from 'react';
import { Menu, ShieldAlert, RotateCcw } from 'lucide-react';
import Notifications from './Notifications';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, originalUser, stopImpersonation } = useAuth();
    const isImpersonating = !!originalUser;

    return (
        <header className="bg-white border-b-2 border-slate-100 flex-none sticky top-0 z-40 shadow-sm">
            {isImpersonating && (
                <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={14} className="animate-pulse" />
                        <span>Impersonating: {user?.email}</span>
                    </div>
                    <button 
                        onClick={stopImpersonation}
                        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors border border-white/20"
                    >
                        <RotateCcw size={12} />
                        <span>Revert</span>
                    </button>
                </div>
            )}
            <div className="px-3 py-1.5">
            <div className="flex justify-between items-center max-w-md mx-auto relative">
                {/* Left: Settings Button */}
                <div className="flex-1 flex justify-start items-center gap-2">
                    <button
                        onClick={onMenuClick}
                        aria-label="Open Menu"
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                    >
                        <Menu size={22} className="text-slate-600" />
                    </button>
                </div>

                {/* Center: Logo + Title */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5">
                    <div className="w-9 h-9 shrink-0 bg-white rounded-xl flex items-center justify-center border border-slate-50">
                        <img
                            src="/logo.webp"
                            alt="Sarathi Book"
                            width="36"
                            height="36"
                            className="w-full h-full object-contain p-0.5"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Sarathi<span className="text-primary">Book</span>
                        </h1>
                    </div>
                </div>

                {/* Right: Notifications */}
                <div className="flex-1 flex justify-end items-center gap-2">
                    <Notifications />
                </div>
            </div>
        </div>
        </header>
    );
};

export default Header;
