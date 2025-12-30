import React from 'react';
import { X, Share2, Eye } from 'lucide-react';

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    onShare: () => void;
    title: string;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ isOpen, onClose, pdfUrl, onShare, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Eye size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">{title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Preview before sharing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* PDF Content */}
                <div className="flex-1 bg-slate-100 overflow-hidden p-2 md:p-4">
                    <iframe
                        src={`${pdfUrl}#toolbar=0&navpanes=0`}
                        className="w-full h-full rounded-2xl border-none shadow-inner bg-white"
                        title="PDF Preview"
                    />
                </div>

                {/* Footer Actions */}
                <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        Edit Details
                    </button>
                    <button
                        onClick={onShare}
                        className="flex-[2] h-12 bg-[#0047AB] text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Share2 size={18} />
                        Send to Client
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PDFPreviewModal;
