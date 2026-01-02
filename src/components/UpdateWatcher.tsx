import React, { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useUpdate } from '../contexts/UpdateContext';
import { useNotifications } from '../contexts/NotificationContext';

const UpdateWatcher: React.FC = () => {
    const { needRefresh, updateServiceWorker } = useUpdate();
    const { addNotification } = useNotifications();
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (needRefresh && !notifiedRef.current) {
            addNotification(
                'New Update Available!',
                'A new version of Sarathi Book is available. Please update now to access new features and fixes.',
                'warning'
            );
            notifiedRef.current = true;
        } else if (!needRefresh) {
            notifiedRef.current = false;
        }
    }, [needRefresh, addNotification]);

    if (!needRefresh) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500">
                <div className="bg-[#0047AB] p-6 text-center relative overflow-hidden">
                    {/* Animated Background Effect */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                            <RefreshCw size={32} className="text-white animate-spin-slow" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Version Update</h3>
                        <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest mt-1">Faster • Better • Newer</p>
                    </div>
                </div>

                <div className="p-8 text-center">
                    <p className="text-slate-600 text-sm font-medium mb-8 leading-relaxed">
                        A new version of <span className="font-black text-slate-900">Sarathi Book</span> is ready. We've improved the layout and fixed reported issues.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="w-full py-4 bg-[#0047AB] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <RefreshCw size={16} />
                            Reload & Update Now
                        </button>

                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Update takes only 2 seconds
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateWatcher;
