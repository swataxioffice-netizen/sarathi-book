import { useUpdate } from '../contexts/UpdateContext';
import { RefreshCw, User } from 'lucide-react';
import Notifications from './Notifications';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onMenuClick }) => {
    const { needRefresh, updateServiceWorker } = useUpdate();
    const { user } = useAuth();

    return (
        <header className="bg-white border-b-2 border-slate-100 px-3 py-1.5 flex-none sticky top-0 z-40 shadow-sm">
            <div className="flex justify-between items-center max-w-md mx-auto relative">
                {/* Left: Profile/Menu Button */}
                <div className="flex-1 flex justify-start">
                    <button
                        onClick={onMenuClick}
                        aria-label="Open Menu"
                        className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${activeTab === 'profile' ? 'bg-[#0047AB] text-white border-[#0047AB]' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url || user.user_metadata.picture} referrerPolicy="no-referrer" alt="Profile" width="36" height="36" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User size={18} />
                        )}
                    </button>
                </div>

                {/* Center: Logo + Title */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5">
                    <div className="w-9 h-9 flex-shrink-0 bg-white rounded-xl flex items-center justify-center border border-slate-50">
                        <img
                            src="/logo.png"
                            alt="Sarathi Book"
                            width="36"
                            height="36"
                            className="w-full h-full object-contain p-0.5"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-lg font-extrabold text-slate-900 leading-none tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Sarathi<span className="text-[#0047AB]">Book</span>
                        </h1>

                    </div>
                </div>

                {/* Right: Update + Notifications */}
                <div className="flex-1 flex justify-end items-center gap-3">
                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            aria-label="New version available. Click to update."
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100 animate-pulse shadow-sm"
                        >
                            <RefreshCw size={12} className="animate-spin-slow" aria-hidden="true" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Update</span>
                        </button>
                    )}

                    <Notifications />
                </div>
            </div>
        </header>
    );
};

export default Header;
