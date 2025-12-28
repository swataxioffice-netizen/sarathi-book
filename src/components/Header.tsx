import { useUpdate } from '../contexts/UpdateContext';
import { RefreshCw } from 'lucide-react';
import Notifications from './Notifications';

const Header: React.FC = () => {
    const { needRefresh, updateServiceWorker } = useUpdate();

    return (
        <header className="bg-white border-b-2 border-slate-100 px-5 py-3 flex-none sticky top-0 z-40">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="Sarathi Book"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl font-black text-[#0047AB] leading-none mb-0.5" style={{ fontFamily: 'Korkai', letterSpacing: '-0.02em' }}>
                            SARATHI BOOK
                        </h1>
                        <p className="text-[10px] font-semibold text-slate-500 leading-none tracking-wide" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                            Your digital office on car
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Toggle */}
                    <button
                        onClick={() => alert('Language selection coming soon!')}
                        className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all font-serif"
                        aria-label="Change Language"
                    >
                        A/अ
                    </button>

                    {needRefresh ? (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            aria-label="New version available. Click to update."
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100 animate-pulse shadow-sm"
                        >
                            <RefreshCw size={14} className="animate-spin-slow" aria-hidden="true" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => window.location.reload()}
                            aria-label="Refresh page"
                            className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full border border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <RefreshCw size={14} aria-hidden="true" />
                        </button>
                    )}
                    <Notifications />
                </div>
            </div>
        </header>
    );
};

export default Header;
