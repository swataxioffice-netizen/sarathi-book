import { useUpdate } from '../contexts/UpdateContext';
import { RefreshCw, Share2 } from 'lucide-react';
import Notifications from './Notifications';
import { Analytics } from '../utils/monitoring';

const Header: React.FC = () => {
    const { needRefresh, updateServiceWorker } = useUpdate();

    return (
        <header className="bg-white border-b-2 border-slate-100 px-5 py-2 flex-none sticky top-0 z-40">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="Sarathi Book"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-xl font-black text-[#0047AB] leading-none mb-0.5" style={{ letterSpacing: '-0.02em' }}>
                            SARATHI BOOK
                        </h1>
                        <p className="text-[10px] font-semibold text-slate-500 leading-none tracking-wide" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                            Your digital office on car
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Toggle */}


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
                    <button
                        onClick={async () => {
                            Analytics.shareApp('header');
                            if (navigator.share) {
                                try {
                                    await navigator.share({
                                        title: 'Sarathi Book',
                                        text: 'Driver Anna! Stop writing bills by hand. Use Sarathi Book app for professional invoices & fare calculation. Free app!',
                                        url: 'https://sarathibook.com'
                                    });
                                } catch (error) {
                                    console.log('Error sharing:', error);
                                }
                            } else {
                                alert('Share not supported on this device/browser');
                            }
                        }}
                        aria-label="Share App"
                        className="w-9 h-9 flex items-center justify-center bg-blue-50 text-[#0047AB] rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                        <Share2 size={16} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                    <Notifications />
                </div>
            </div>
        </header>
    );
};

export default Header;
