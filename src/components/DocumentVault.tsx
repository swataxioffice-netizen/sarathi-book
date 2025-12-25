import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, FileText, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface Document { id: string; name: string; expiryDate: string; type: 'RC' | 'Insurance' | 'Permit' | 'License' | 'Pollution' | 'Fitness'; }

const DocumentVault: React.FC = () => {
    const [docs, setDocs] = useState<Document[]>(() => {
        const saved = localStorage.getItem('cab-docs');
        return saved ? JSON.parse(saved) : [{ id: '1', name: 'Registration Certificate', expiryDate: '2026-12-31', type: 'RC' }];
    });

    const [name, setName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [type, setType] = useState<Document['type']>('RC');

    const addDoc = () => {
        if (!name || !expiry) return;
        const up = [{ id: crypto.randomUUID(), name, expiryDate: expiry, type }, ...docs];
        setDocs(up);
        localStorage.setItem('cab-docs', JSON.stringify(up));
        setName(''); setExpiry('');
    };

    const deleteDoc = (id: string) => {
        const up = docs.filter(d => d.id !== id);
        setDocs(up);
        localStorage.setItem('cab-docs', JSON.stringify(up));
    };

    const getDaysRemaining = (expiry: string) => Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="space-y-4 pb-24">

            {/* Header Section */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Your Documents</h3>
                </div>

                {/* Compliance Status Overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-[#0047AB]">
                            <ShieldCheck size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-slate-900 leading-none">Safe Storage</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Locally Encrypted 🔒</p>
                        </div>
                    </div>
                    <div className="text-right pr-2">
                        <p className="text-2xl font-black text-[#0047AB] tracking-tighter leading-none">{docs.length}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-wide mt-0.5">Docs</p>
                    </div>
                </div>
            </div>

            {/* Document Registry Form */}
            <div className="space-y-2">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Insurance"
                                    value={name}
                                    onChange={(_) => setName(_.target.value)}
                                    className="tn-input h-10 text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(_) => setType(_.target.value as any)}
                                    className="tn-input h-10 text-xs font-bold bg-white"
                                >
                                    <option value="RC">Registration (RC)</option>
                                    <option value="Insurance">Insurance</option>
                                    <option value="Pollution">Pollution</option>
                                    <option value="Fitness">Fitness</option>
                                    <option value="Permit">Permit</option>
                                    <option value="License">License</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                            <input
                                type="date"
                                value={expiry}
                                onChange={(_) => setExpiry(_.target.value)}
                                className="tn-input h-10 text-xs font-bold uppercase"
                            />
                        </div>
                    </div>

                    <button
                        onClick={addDoc}
                        className="w-full bg-[#0047AB] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={14} /> Add Document
                    </button>
                </div>
            </div>

            {/* Active Inventory List */}
            <div className="space-y-2">
                {docs.length > 0 && (
                    <div className="flex items-center gap-2 px-1">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-slate-300 underline-offset-4">Saved Docs</h3>
                    </div>
                )}

                {docs.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl py-8 flex flex-col items-center justify-center text-center">
                        <FileText size={32} className="text-slate-300 mb-2" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">No documents yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {docs.map((doc) => {
                            const days = getDaysRemaining(doc.expiryDate);
                            const isExpired = days < 0;
                            const isWarning = days < 30;

                            const getDocTypeLabel = (type: string) => {
                                const labels: Record<string, string> = {
                                    'RC': 'RC',
                                    'Insurance': 'INS',
                                    'Pollution': 'PUC',
                                    'Fitness': 'FIT',
                                    'Permit': 'PER',
                                    'License': 'DL'
                                };
                                return labels[type] || type;
                            };

                            return (
                                <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between shadow-sm relative overflow-hidden group">
                                    {/* Status Bar Indicator */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isExpired ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'}`}></div>

                                    <div className="flex items-center gap-3 pl-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isExpired ? 'bg-red-50 text-red-500' : isWarning ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'}`}>
                                            {isExpired ? <AlertCircle size={16} /> : isWarning ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900">{doc.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 rounded-md">{getDocTypeLabel(doc.type)}</span>
                                                <span className={`text-[9px] font-bold uppercase ${isExpired ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-slate-400'}`}>
                                                    {isExpired ? 'EXPIRED' : `${days} DAYS LEFT`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => deleteDoc(doc.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentVault;
