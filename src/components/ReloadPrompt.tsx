import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(_r) {
            // eslint-disable-next-line prefer-template
        },
        onRegisterError(_error) {
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 animate-slide-up max-w-sm w-full shadow-2xl rounded-xl overflow-hidden glass-panel border border-blue-500/30">
            {/* Background Backdrop */}
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"></div>

            {/* Content */}
            <div className="relative p-4 flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg flex-shrink-0 animate-pulse">
                    <RefreshCw className="text-white w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm mb-1">
                        {offlineReady ? 'App Ready Offline' : 'New Update Available'}
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                        {offlineReady
                            ? 'Site works offline.'
                            : 'New features are available. Click refresh to update.'}
                    </p>

                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="mt-3 py-2 px-4 bg-white text-blue-900 text-xs font-black uppercase tracking-wider rounded-lg w-full hover:bg-blue-50 transition-colors"
                        >
                            Refresh Now
                        </button>
                    )}
                </div>

                <button onClick={close} className="text-slate-400 hover:text-white p-1">
                    <X size={16} />
                </button>
            </div>

            {/* Progress Bar Animation */}
            <div className="h-1 w-full bg-slate-800">
                <div className="h-full bg-blue-500 w-full animate-progress origin-left"></div>
            </div>
        </div>
    );
}

export default ReloadPrompt;
