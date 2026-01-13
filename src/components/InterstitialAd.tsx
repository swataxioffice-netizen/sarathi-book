import React, { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';

interface InterstitialAdProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const InterstitialAd: React.FC<InterstitialAdProps> = ({ isOpen, onClose, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(5);
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(5);
            setCanSkip(false);
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanSkip(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">

                {/* Header / Top Bar */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Sponsor Ad
                    </span>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Ad Content Placeholder */}
                <div className="bg-slate-100 h-64 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group">
                    {/* Placeholder Pattern to look like an ad slot */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 z-10 text-blue-500">
                        <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-1 z-10">Sarathi Book Pro</h3>
                    <p className="text-xs font-semibold text-slate-500 max-w-[200px] z-10">
                        Upgrade to remove ads and unlock unlimited fleet management.
                    </p>
                    <div className="mt-4 px-3 py-1 bg-white/50 backdrop-blur rounded-full border border-slate-200 text-[9px] font-bold text-slate-400 z-10">
                        Advertisement
                    </div>
                </div>

                {/* Footer / Action Area */}
                <div className="p-4 bg-white">
                    <button
                        onClick={onComplete}
                        disabled={!canSkip}
                        className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center justify-center gap-2 ${canSkip
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {canSkip ? (
                            'Skip to Content'
                        ) : (
                            <>
                                <span>Wait {timeLeft}s</span>
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin ml-1" />
                            </>
                        )}
                    </button>
                    {!canSkip && (
                        <p className="text-[9px] text-center mt-3 text-slate-400 font-medium">
                            Please wait to download your file...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterstitialAd;
