import React from 'react';
import { Settings, User } from 'lucide-react';
import Notifications from './Notifications';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, setActiveTab }) => {
    const { user } = useAuth();
    const avatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || user?.user_metadata?.avatarUrl;

    return (
        <header className="bg-white border-b-2 border-slate-100 px-3 py-1.5 flex-none sticky top-0 z-40 shadow-sm">
            <div className="flex justify-between items-center max-w-md mx-auto relative">
                {/* Left: Settings Button */}
                <div className="flex-1 flex justify-start items-center gap-2">
                    <button
                        onClick={onMenuClick}
                        aria-label="Open Settings"
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                    >
                        <Settings size={22} className="text-slate-600" />
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

                {/* Right: Notifications + Profile */}
                <div className="flex-1 flex justify-end items-center gap-2">
                    <Notifications />
                    <button
                        onClick={() => setActiveTab?.('profile')}
                        aria-label="My Profile"
                        className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 hover:border-primary transition-colors focus:outline-none shrink-0 flex items-center justify-center bg-slate-100"
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                            <User size={16} className="text-slate-500" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
