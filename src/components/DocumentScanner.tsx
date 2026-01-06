import React, { useState, useRef } from 'react';
import { Camera, Scan, X, Loader2, FileImage } from 'lucide-react';
import { performOcr, parseReceipt, parseDocument } from '../utils/visionApi';

interface DocumentScannerProps {
    onScanComplete: (data: {
        amount?: number;
        date?: string;
        liters?: number;
        expiryDate?: string;
        docNumber?: string;
        fullText: string
    }) => void;
    onClose: () => void;
    label?: string;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete, onClose, label = "Scan Receipt" }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const startScan = async () => {
        if (!preview) return;

        setIsScanning(true);
        setError(null);

        try {
            const result = await performOcr(preview);
            if (!result.fullText) {
                throw new Error("Could not read any text from this image. Please try a clearer photo.");
            }

            const parsedReceipt = parseReceipt(result.lines);
            const parsedDoc = parseDocument(result.lines);

            onScanComplete({
                ...parsedReceipt,
                ...parsedDoc,
                fullText: result.fullText
            });
        } catch (err: any) {
            console.error('OCR Process failed:', err);
            setError(err.message || "Scanning failed. Please try again.");
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{label}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by Google Vision</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 text-center">
                    {!preview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                        >
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Camera size={32} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Take Photo / Upload</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Use clear lighting for best results</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg border-4 border-white">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                {isScanning && (
                                    <div className="absolute inset-0 bg-[#0047AB]/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-6">
                                        <div className="relative">
                                            <Loader2 size={48} className="animate-spin mb-4" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Scan size={24} className="opacity-50" />
                                            </div>
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-widest animate-pulse">Scanning Content...</p>
                                        <div className="mt-4 w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-white h-full animate-progress-indefinite rounded-full" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!isScanning && (
                                <button
                                    onClick={() => setPreview(null)}
                                    className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg active:scale-90 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                    />

                    {preview && !isScanning && (
                        <button
                            onClick={startScan}
                            className="w-full py-4 bg-[#0047AB] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Scan size={18} />
                            Start Smart Scan
                        </button>
                    )}

                    {!preview && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <FileImage size={18} />
                            Select File
                        </button>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-widest leading-relaxed">
                        RC Books, Licenses, and Fuel Bills are automatically recognized.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DocumentScanner;
