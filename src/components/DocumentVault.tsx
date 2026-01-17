import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Trash2,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Scan,
    Calendar,
    Pencil,
    ChevronDown,
    Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { useSettings } from '../contexts/SettingsContext';
import DocumentScanner from './DocumentScanner';

interface VaultDoc {
    id: string;
    name: string;
    type: string;
    expiryDate: string;
    fileUrl?: string;
    filePath?: string;
}

const VEHICLE_DOC_TYPES = [
    { id: 'Insurance', label: 'Insurance Policy', desc: 'Valid comprehensive or 3rd party policy' },
    { id: 'Permit', label: 'Permit Copy', desc: 'State or National Taxi Permit' },
    { id: 'Fitness', label: 'FC (Fitness)', desc: 'Current Fitness Certificate' },
    { id: 'Pollution', label: 'Pollution (PUC)', desc: 'Emission Test Certificate' }
];



const DocumentVault: React.FC<{ onStatsUpdate?: (stats: any) => void }> = ({ onStatsUpdate }) => {
    const { user } = useAuth();
    const { settings, setDocStats } = useSettings();

    const [allDocs, setAllDocs] = useState<VaultDoc[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [editingType, setEditingType] = useState<string | null>(null);
    const [scannerType, setScannerType] = useState<string | null>(null);
    const [formDate, setFormDate] = useState('');

    const currentVehicle = useMemo(() =>
        settings.vehicles.find(v => v.id === selectedVehicleId) || settings.vehicles[0],
        [settings.vehicles, selectedVehicleId]);

    useEffect(() => {
        if (settings.vehicles.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(settings.vehicles[0].id);
        }
    }, [settings.vehicles, selectedVehicleId]);

    const fetchDocuments = useCallback(async () => {
        // Force loader off after 5 seconds max to prevent hanging
        const safeParams = { timeout: 5000 };
        const timer = setTimeout(() => setIsLoading(false), safeParams.timeout);

        try {
            if (user) {
                // Race Supabase against a timeout logic internally to avoid hanging promise
                const fetchPromise = supabase.from('user_documents').select('*').eq('user_id', user.id);
                const { data, error } = await fetchPromise;

                if (error) throw error;
                if (data) {
                    setAllDocs(data.map(d => ({
                        id: d.id, name: d.name, type: d.type, expiryDate: d.expiry_date,
                        fileUrl: d.file_url, filePath: d.file_path
                    })));
                }
            } else {
                const localData = localStorage.getItem('cab-docs');
                if (localData) setAllDocs(JSON.parse(localData));
            }
        } catch (err) {
            console.error('[DocumentVault] Fetch Error:', err);
        } finally {
            clearTimeout(timer);
            setIsLoading(false);
        }
    }, [user?.id]); // Depend on ID string, not object reference

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const stats = useMemo(() => {
        const relevantDocs = allDocs;
        const vNumber = currentVehicle?.number;
        const hasFullVehicle = VEHICLE_DOC_TYPES.every(req =>
            relevantDocs.some(d => d.type === req.id && d.name === vNumber));
        return { hasFullVehicle, hasFullDriver: true };
    }, [allDocs, currentVehicle]);

    useEffect(() => {
        setDocStats(prev => {
            if (prev.hasFullVehicle === stats.hasFullVehicle && prev.hasFullDriver === stats.hasFullDriver) return prev;
            return stats;
        });
        if (onStatsUpdate) onStatsUpdate(stats);
    }, [stats, setDocStats, onStatsUpdate]);

    // OPTIMISTIC SAVE
    const handleSave = async (docType: string, category: 'vehicle' | 'driver') => {
        if (!formDate) { alert('Please select an expiry date first.'); return; }

        const docName = category === 'vehicle' ? (currentVehicle?.number || '') : (settings.holderName || 'Driver');
        if (!docName) { alert('Missing vehicle or driver information.'); return; }

        const newDocData: VaultDoc = {
            id: crypto.randomUUID(), name: docName, type: docType, expiryDate: formDate
        };

        const previousDocs = [...allDocs];

        // IMMEDIATE UPDATE
        setAllDocs(prev => {
            const others = prev.filter(d => !(d.type === docType && d.name === docName));
            const updated = [...others, newDocData];
            if (!user) localStorage.setItem('cab-docs', JSON.stringify(updated));
            return updated;
        });
        setEditingType(null);

        // BACKGROUND SYNC
        if (user) {
            const syncToDb = async () => {
                try {
                    // Check DB for existing record to avoid ID mismatches or duplicates
                    const { data: dbRecord, error: fetchError } = await supabase
                        .from('user_documents')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('name', docName)
                        .eq('type', docType)
                        .maybeSingle();

                    if (fetchError) throw fetchError;

                    // Preserve existing file connection if updating
                    const existingLocal = previousDocs.find(d => d.type === docType && d.name === docName);
                    const payload = {
                        user_id: user.id, name: docName, type: docType, expiry_date: formDate,
                        file_url: existingLocal?.fileUrl || null, file_path: existingLocal?.filePath || null
                    };

                    let result;
                    if (dbRecord) {
                        result = await supabase
                            .from('user_documents')
                            .update(payload)
                            .eq('id', dbRecord.id)
                            .select()
                            .single();
                    } else {
                        result = await supabase
                            .from('user_documents')
                            .insert(payload)
                            .select()
                            .single();
                    }

                    if (result.error) throw result.error;

                    // Update the local state with the REAL database ID to ensure future updates work
                    if (result.data) {
                        setAllDocs(current => current.map(d =>
                            (d.type === docType && d.name === docName) ? { ...d, id: result.data.id } : d
                        ));
                    }
                } catch (err: any) {
                    console.error('Background Save Failed:', err);
                    setAllDocs(previousDocs); // Revert
                    alert(`Save failed: ${err.message || 'Network error'}`);
                }
            };
            syncToDb();
        }
    };

    // OPTIMISTIC DELETE
    const handleDelete = async (doc: VaultDoc) => {
        if (!confirm('Delete this date?')) return;
        const previousDocs = [...allDocs];

        setAllDocs(prev => {
            const updated = prev.filter(d => d.id !== doc.id);
            if (!user) localStorage.setItem('cab-docs', JSON.stringify(updated));
            return updated;
        });

        if (user) {
            const syncDelete = async () => {
                try {
                    const { error } = await supabase.from('user_documents').delete().eq('id', doc.id);
                    if (error) throw error;
                } catch (err) {
                    console.error('Delete Failed:', err);
                    setAllDocs(previousDocs); // Revert
                    alert('Delete failed. Please check connection.');
                }
            };
            syncDelete();
        }
    };

    const handleScanComplete = (data: any) => {
        const rawDate = data.expiryDate || data.date;
        if (rawDate) {
            let normalized = rawDate.replace(/\//g, '-');
            const parts = normalized.split('-');
            if (parts.length === 3 && parts[2].length === 4) normalized = `${parts[2]}-${parts[1]}-${parts[0]}`;
            setFormDate(normalized);
        }
        setScannerType(null);
    };

    const getExpiryStatus = (dateStr: string) => {
        const today = new Date();
        const exp = new Date(dateStr);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { label: 'EXPIRED', color: 'text-red-500', bg: 'bg-red-50', badge: 'bg-red-500' };
        if (diffDays <= 30) return { label: `${diffDays} DAYS LEFT`, color: 'text-orange-500', bg: 'bg-orange-50', badge: 'bg-orange-500' };
        return { label: 'ACTIVE', color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' };
    };

    const renderCard = (def: { id: string, label: string, desc: string }, category: 'vehicle' | 'driver') => {
        const isEditing = editingType === def.id;
        const targetName = category === 'vehicle' ? currentVehicle?.number : (settings.holderName || 'Driver');
        const doc = allDocs.find(d => d.type === def.id && (category === 'vehicle' ? d.name === targetName : true));
        const status = doc ? getExpiryStatus(doc.expiryDate) : null;

        if (isEditing) {
            return (
                <div key={def.id} className="bg-white border-2 border-blue-500 rounded-3xl p-5 shadow-xl animate-fade-in relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{def.label}</h4>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Set Expiry Date</p>
                        </div>
                        <button onClick={() => { setEditingType(null); setFormDate(''); }} className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"><Calendar size={18} /></div>
                            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setScannerType(def.id)} className="flex-1 h-12 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                                <Scan size={16} /> Scan
                            </button>
                            <button onClick={() => handleSave(def.id, category)} className="flex-1 h-12 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                <CheckCircle size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={def.id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${doc ? status?.bg : 'bg-slate-50'} transition-colors`}>
                        {doc ? (status?.label === 'EXPIRED' ? <AlertCircle size={22} className="text-red-500" /> : <CheckCircle size={22} className="text-green-600" />) : <FileText size={22} className="text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">{def.label}</h4>
                        {!doc ? <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">{def.desc}</p> : (
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${status?.badge} ${status?.label === 'ACTIVE' ? 'text-white bg-green-500' : ''}`}>{status?.label}</span>
                                <span className="text-[10px] font-bold text-slate-700">{doc.expiryDate}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {!doc ? (
                            <button onClick={() => { setEditingType(def.id); setFormDate(''); }} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"><Plus size={18} strokeWidth={2.5} /></button>
                        ) : (
                            <>
                                <button onClick={() => { setEditingType(def.id); setFormDate(doc.expiryDate); }} className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"><Pencil size={16} /></button>
                                <button onClick={() => handleDelete(doc)} className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"><Trash2 size={16} /></button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isLoading && (
                <div className="flex justify-center p-4">
                    <Loader2 size={24} className="text-blue-600 animate-spin" />
                </div>
            )}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">Vehicle Documents {isLoading && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />}</h3>
                        {currentVehicle && <p className="text-[8px] font-bold text-blue-600 mt-1 uppercase tracking-widest">{currentVehicle.model}</p>}
                    </div>
                    {settings.vehicles.length > 0 ? (
                        <div className="relative group">
                            <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} className="appearance-none bg-slate-900 text-white pl-4 pr-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer shadow-lg hover:bg-slate-800 transition-colors">
                                {settings.vehicles.map(v => <option key={v.id} value={v.id}>{v.number}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none group-hover:text-white transition-colors" />
                        </div>
                    ) : (
                        <button className="px-3 py-1.5 bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-100">No Vehicle</button>
                    )}
                </div>
                {settings.vehicles.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center"><AlertCircle size={24} className="text-slate-300" /></div>
                        <div><p className="text-xs font-black text-slate-700 uppercase">No Fleet Found</p><p className="text-[10px] text-slate-400 font-medium mt-1">Add a vehicle in the 'Garage' tab first.</p></div>
                    </div>
                ) : (
                    <div className="space-y-3">{VEHICLE_DOC_TYPES.map(def => renderCard(def, 'vehicle'))}</div>
                )}
            </section>
            {scannerType && <DocumentScanner label="Scan Expiry Date" onClose={() => setScannerType(null)} onScanComplete={handleScanComplete} />}
        </div >
    );
};

export default DocumentVault;
