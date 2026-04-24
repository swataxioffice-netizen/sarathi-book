import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    type = 'danger'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            type === 'danger' ? 'bg-red-50 text-red-600' : 
                            type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                            <AlertTriangle size={24} />
                        </div>
                        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-wider"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 rounded-2xl text-xs font-black text-white shadow-lg active:scale-95 transition-all uppercase tracking-widest ${
                            type === 'danger' ? 'bg-red-600 shadow-red-500/30 hover:bg-red-700' : 
                            type === 'warning' ? 'bg-amber-600 shadow-amber-500/30 hover:bg-amber-700' : 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
