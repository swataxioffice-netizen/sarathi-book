import { useUpdate } from '../contexts/UpdateContext';
import { RefreshCw, User } from 'lucide-react';
import Notifications from './Notifications';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
    const { needRefresh, updateServiceWorker } = useUpdate();
    const { user } = useAuth();

    return (
        <header className="bg-white border-b-2 border-slate-100 px-5 py-2 flex-none sticky top-0 z-40">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 bg-white rounded-xl flex items-center justify-center">
                        <img
                            src="/logo.png"
                            alt="Sarathi Book"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-extrabold text-slate-900 leading-none tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Sarathi<span className="text-[#0047AB]">Book</span>
                        </h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Digital Office on Car
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Toggle */}


                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            aria-label="New version available. Click to update."
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100 animate-pulse shadow-sm"
                        >
                            <RefreshCw size={14} className="animate-spin-slow" aria-hidden="true" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                        </button>
                    )}
                    <Notifications />

                    {/* Profile Button */}
                    <button
                        onClick={() => setActiveTab?.('profile')}
                        aria-label="Profile"
                        className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${activeTab === 'profile' ? 'bg-[#0047AB] text-white border-[#0047AB]' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User size={18} />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
