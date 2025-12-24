import React, { useState } from 'react';
import { ShieldCheck, Plus, Calendar, Trash2, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Document { id: string; name: string; expiryDate: string; type: 'RC' | 'Insurance' | 'Permit' | 'License'; }

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
        <div className="space-y-6 pb-24">
            {/* Compliance Status Overview */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-[#0047AB]">
                        <ShieldCheck size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 leading-none uppercase tracking-tight">Vault Protocol</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">ENCRYPTED DOCUMENT STORAGE</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-[#0047AB] tracking-tighter leading-none">{docs.length}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">ACTIVE FILES</p>
                </div>
            </div>

            {/* Document Registry Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-6">
                <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-5 text-center">
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full flex items-center gap-1.5 opacity-60 mb-2">
                        <Plus size={12} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">New Slot</span>
                    </div>
                    <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Registry Entry</h3>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">FILE IDENTIFIER</label>
                            <input type="text" placeholder="e.g. INSURANCE" value={name} onChange={(_) => setName(_.target.value)} className="tn-input h-14 bg-slate-50 border-slate-200 font-bold text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">PROTOCOL TYPE</label>
                            <select value={type} onChange={(_) => setType(_.target.value as any)} className="tn-input h-14 bg-slate-50 border-slate-200 font-black text-[10px] uppercase">
                                {['RC', 'Insurance', 'Permit', 'License'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">EXPIRATION DATE</label>
                        <input type="date" value={expiry} onChange={(_) => setExpiry(_.target.value)} className="tn-input h-14 bg-slate-50 border-slate-200 font-black text-sm" />
                    </div>
                </div>

                <button onClick={addDoc} className="w-full bg-[#0047AB] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    <ShieldCheck size={18} /> UPDATE REGISTRY
                </button>
            </div>

            {/* Active Inventory Feed */}
            <div className="space-y-4">
                <div className="flex justify-center items-center px-1 pb-4">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 px-8">Active Inventory</h3>
                </div>
                {docs.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-3xl py-16 flex flex-col items-center justify-center text-center opacity-40">
                        <CreditCard size={48} className="text-slate-200 mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No documents found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {docs.map((doc) => {
                            const days = getDaysRemaining(doc.expiryDate);
                            const isExpired = days < 0;
                            const isWarning = days < 30;

                            return (
                                <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-[#0047AB] transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-xl transition-all ${isExpired ? 'bg-red-50 text-red-500' : isWarning ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-[#0047AB]'}`}>
                                            <CreditCard size={24} />
                                        </div>
                                        <div className="leading-tight">
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{doc.name}</h4>
                                            <div className="flex items-center gap-2 mt-1.5 font-bold">
                                                <Calendar size={12} className="text-slate-300" />
                                                <span className="text-[10px] text-slate-400 uppercase">EXP: {new Date(doc.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className={`flex items-center gap-1.5 justify-end mb-1 ${isExpired ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-[#00965E]'}`}>
                                                {isExpired ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                                <p className="text-[11px] font-black uppercase tracking-tight">
                                                    {isExpired ? 'EXPIRED' : isWarning ? 'EXPIRING' : 'SECURE'}
                                                </p>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {isExpired ? 'RENEW NOW' : `${days} DAYS LEFT`}
                                            </p>
                                        </div>
                                        <button onClick={() => deleteDoc(doc.id)} className="p-3 text-slate-200 hover:text-red-500 active:scale-95 transition-all">
                                            <Trash2 size={22} />
                                        </button>
                                    </div>
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
