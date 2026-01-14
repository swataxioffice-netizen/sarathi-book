import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

            // Initialize Ad
            try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('AdSense error', e);
            }

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
                <div className="bg-slate-100 min-h-[250px] flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <ins className="adsbygoogle"
                        style={{ display: 'block', width: '100%' }}
                        data-ad-client="ca-pub-6322167461169822"
                        data-ad-slot="1232694108"
                        data-ad-format="auto"
                        data-full-width-responsive="true"></ins>
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
