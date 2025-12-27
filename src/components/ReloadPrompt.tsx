import { useRegisterSW } from 'virtual:pwa-register/react';
// import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady],
        needRefresh: [needRefresh],
        // updateServiceWorker,
    } = useRegisterSW({
        onRegistered(_r) {
            // eslint-disable-next-line prefer-template
        },
        onRegisterError(_error) {
        },
    });

    /*
    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };
    */

    if (!offlineReady && !needRefresh) return null;

    // User requested to remove the popup.
    // The hook logic is kept to ensure SW registration still happens, 
    // but we won't show the UI.
    return null;

    /* Original UI temporarily disabled
    return (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 animate-slide-up max-w-sm w-full shadow-2xl rounded-xl overflow-hidden glass-panel border border-blue-500/30">
            ...
        </div>
    ); 
    */
}

export default ReloadPrompt;
