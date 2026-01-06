import { useState, useEffect, useMemo, useCallback } from 'react';
import { Trash2, FileText, CheckCircle, AlertCircle, Loader2, X, Scan, Calendar, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { useSettings } from '../contexts/SettingsContext';
import DocumentScanner from './DocumentScanner';

interface UserDoc {
    id: string;
    name: string;
    expiryDate: string;
    type: string;
    fileData?: string;
    fileName?: string;
}

interface DocumentVaultProps {
    onStatsUpdate?: (stats: { hasFullVehicle: boolean; hasFullDriver: boolean }) => void;
}

const REQUIRED_VEHICLE_DOCS = [
    { type: 'Insurance', label: 'Insurance Policy', helper: 'Comprehensive or Third Party' },
    { type: 'Permit', label: 'Permit Copy', helper: 'State or All India Permit' },
    { type: 'Fitness', label: 'FC (Fitness)', helper: 'Fitness Certificate Copy' },
    { type: 'Pollution', label: 'Pollution (PUC)', helper: 'Current Emission Certificate' }
];

const REQUIRED_DRIVER_DOCS = [
    { type: 'License', label: 'Driving License', helper: 'Original or DigiLocker copy' },
    { type: 'Badge', label: 'Driver Badge (Optional)', helper: 'Public Service Badge' },
    { type: 'Police', label: 'Police Verification (Optional)', helper: 'Safety Background Check' }
];

const DocumentVault: React.FC<DocumentVaultProps> = ({ onStatsUpdate }) => {
    const { user } = useAuth();
    const { settings, setDocStats } = useSettings();
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [docs, setDocs] = useState<UserDoc[]>([]);

    // Selection State
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [editingDocType, setEditingDocType] = useState<string | null>(null);
    const [tempDate, setTempDate] = useState('');
    const [newDocDates, setNewDocDates] = useState<Record<string, string>>({});
    const [showScanner, setShowScanner] = useState<string | null>(null);

    const vehicleNumber = useMemo(() => {
        const v = settings.vehicles.find(v => v.id === selectedVehicleId);
        return v?.number || '';
    }, [settings.vehicles, selectedVehicleId]);

    // Initialize selected vehicle
    useEffect(() => {
        if (settings.vehicles.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(settings.vehicles[0].id);
        }
    }, [settings.vehicles, selectedVehicleId]);

    // Load Docs Effect
    const loadDocs = useCallback(async () => {
        if (!user) {
            const saved = localStorage.getItem('cab-docs');
            setDocs(saved ? JSON.parse(saved) : []);
            return;
        }

        setIsFetching(true);
        try {
            const { data, error } = await supabase.from('user_documents').select('*').eq('user_id', user.id);
            if (error) throw error;
            if (data) {
                setDocs(data.map(d => ({
                    id: d.id, name: d.name, type: d.type, expiryDate: d.expiry_date,
                    fileData: d.file_url, fileName: d.file_path
                })));
            }
        } catch (err) {
            console.error('Doc load failed:', err);
        } finally {
            setIsFetching(false);
        }
    }, [user]);

    useEffect(() => {
        loadDocs();
    }, [loadDocs]);

    // Calculate completion stats locally
    const stats = useMemo(() => {
        const vTypes = REQUIRED_VEHICLE_DOCS.map(d => d.type);
        const dTypes = REQUIRED_DRIVER_DOCS.filter(d => d.type === 'License').map(d => d.type);

        const currentTypes = new Set(docs.filter(d => {
            const isVehicleDoc = REQUIRED_VEHICLE_DOCS.some(r => r.type === d.type);
            if (isVehicleDoc) {
                return d.name === vehicleNumber;
            }
            return true;
        }).map(d => d.type));

        return {
            hasFullVehicle: vTypes.every(t => currentTypes.has(t as any)),
            hasFullDriver: dTypes.every(t => currentTypes.has(t as any))
        };
    }, [docs, vehicleNumber]);

    // Sync stats to context
    useEffect(() => {
        setDocStats(prev => {
            if (prev.hasFullVehicle === stats.hasFullVehicle && prev.hasFullDriver === stats.hasFullDriver) {
                return prev;
            }
            return stats;
        });
        if (onStatsUpdate) onStatsUpdate(stats);
    }, [stats.hasFullVehicle, stats.hasFullDriver, onStatsUpdate, setDocStats]);

    const handleSave = async (reqType: string, category: 'vehicle' | 'driver', dateValue: string) => {
        if (!dateValue) {
            alert('Please select an expiry date');
            return;
        }

        let docName = 'Driver';
        if (category === 'vehicle') {
            if (!vehicleNumber) {
                alert('No vehicle found. Please add a vehicle in Garage first.');
                return;
            }
            docName = vehicleNumber;
        } else {
            docName = settings.holderName || 'Driver';
        }

        setIsActionLoading(reqType);

        // Timeout Protection (15 seconds)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Please check your internet connection.')), 15000)
        );

        try {
            let newDoc: UserDoc = {
                id: crypto.randomUUID(), name: docName, type: reqType, expiryDate: dateValue,
            };

            if (user) {
                const existing = docs.find(d => d.type === reqType && d.name === docName);
                const payload = {
                    user_id: user.id,
                    name: docName,
                    type: reqType,
                    expiry_date: dateValue,
                };

                let fileUrl = existing?.fileData || null;
                let filePath = existing?.fileName || null;

                if (fileUrl) {
                    (payload as any).file_url = fileUrl;
                    (payload as any).file_path = filePath;
                }

                // Race the DB request against the timeout
                const dbRequest = existing
                    ? supabase.from('user_documents').update(payload).eq('id', existing.id).select().single()
                    : supabase.from('user_documents').insert(payload).select().single();

                const res = await Promise.race([dbRequest, timeoutPromise]) as any;

                if (res.error) throw res.error;

                if (res.data) {
                    newDoc = {
                        ...newDoc,
                        id: res.data.id,
                        fileData: res.data.file_url,
                        fileName: res.data.file_path
                    };
                }
            }

            setDocs(prev => {
                const refreshed = prev.filter(d => !(d.type === reqType && d.name === docName));
                const final = [newDoc, ...refreshed];
                if (!user) localStorage.setItem('cab-docs', JSON.stringify(final));
                return final;
            });

            // Clear inputs
            setEditingDocType(null);
            setTempDate('');
            setNewDocDates(prev => ({ ...prev, [reqType]: '' }));

        } catch (error: any) {
            console.error('Save error:', error);
            alert(`Unable to save: ${error.message || 'Network error'}. Please try again.`);
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleScanComplete = (reqType: string, data: any) => {
        const expiryDate = data.expiryDate || data.date;
        if (expiryDate) {
            let formattedDate = expiryDate.replace(/\//g, '-');
            const parts = formattedDate.split('-');
            if (parts.length === 3 && parts[2].length === 4) {
                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            if (editingDocType === reqType) {
                setTempDate(formattedDate);
            } else {
                setNewDocDates(prev => ({ ...prev, [reqType]: formattedDate }));
            }
        }
        setShowScanner(null);
    };

    const deleteDoc = async (doc: UserDoc) => {
        if (!confirm('Remove this document record?')) return;
        setIsActionLoading(doc.type);
        try {
            if (user) {
                await supabase.from('user_documents').delete().eq('id', doc.id);
            }
            setDocs(prev => {
                const updated = prev.filter(d => d.id !== doc.id);
                if (!user) localStorage.setItem('cab-docs', JSON.stringify(updated));
                return updated;
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsActionLoading(null);
        }
    };

    const renderDocItem = (req: { type: string, label: string, helper: string }, category: 'vehicle' | 'driver') => {
        const existingDoc = docs.find(d => d.type === req.type && (category === 'vehicle' ? d.name === vehicleNumber : true));
        const isEditing = editingDocType === req.type;
        const isProcessing = isActionLoading === req.type;

        const daysLeft = existingDoc ? Math.ceil((new Date(existingDoc.expiryDate).getTime() - new Date().getTime()) / 86400000) : 0;
        const isExpired = daysLeft < 0;
        const isWarning = daysLeft < 30;

        if (isEditing) {
            return (
                <div key={req.type} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-lg animate-fade-in relative ring-2 ring-blue-500/20">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-sm font-black text-blue-900">{req.label}</h4>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Edit Expiry Date</p>
                        </div>
                        <button onClick={() => setEditingDocType(null)} className="p-1.5 bg-white/50 text-blue-500 rounded-full hover:bg-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="text-[9px] font-black text-blue-700 uppercase tracking-widest ml-1 mb-1 block">Expiry Date <span className="text-red-500">*</span></label>
                            <div className="flex items-center bg-white rounded-xl border border-blue-200 overflow-hidden shadow-sm">
                                <div className="pl-3 py-2 text-blue-400"><Calendar size={16} /></div>
                                <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} className="flex-1 h-12 bg-transparent text-sm font-bold px-3 focus:outline-none text-slate-800" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowScanner(req.type)} className="flex-1 h-12 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:border-blue-300 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Scan size={16} /> Scan Photo
                            </button>
                            <button onClick={() => handleSave(req.type, category, tempDate)} disabled={isProcessing} className="flex-1 h-12 bg-[#0047AB] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                {isProcessing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                    {showScanner === req.type && <DocumentScanner onClose={() => setShowScanner(null)} onScanComplete={(data: any) => handleScanComplete(req.type, data)} label={`Scan ${req.label}`} />}
                </div>
            );
        }

        return (
            <div key={req.type} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${existingDoc ? (isExpired ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600 shadow-inner') : 'bg-slate-50 text-slate-300'}`}>
                            {existingDoc ? (isExpired ? <AlertCircle size={22} strokeWidth={2.5} /> : <CheckCircle size={22} strokeWidth={2.5} />) : <FileText size={22} strokeWidth={2.5} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{req.label}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{req.helper}</p>
                            {existingDoc ? (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${isExpired ? 'bg-red-500 text-white' : isWarning ? 'bg-orange-500 text-white' : 'bg-green-100 text-green-700'}`}>
                                        {isExpired ? `EXPIRED` : isWarning ? `${daysLeft} DAYS LEFT` : `ACTIVE`}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-900">{existingDoc.expiryDate}</span>
                                </div>
                            ) : (
                                <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex-1 relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"><Calendar size={14} /></div>
                                        <input type="date" value={newDocDates[req.type] || ''} onChange={(e) => setNewDocDates(prev => ({ ...prev, [req.type]: e.target.value }))} className="h-10 w-full pl-9 pr-3 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                                    </div>
                                    <button onClick={() => setShowScanner(req.type)} className="h-10 w-10 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white active:scale-95 transition-all shadow-sm"><Scan size={18} /></button>
                                    {newDocDates[req.type] && (
                                        <button onClick={() => handleSave(req.type, category, newDocDates[req.type])} disabled={isProcessing} className="h-10 px-4 bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 flex items-center gap-2 transition-all disabled:opacity-50">
                                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                            {isProcessing ? 'Saving' : 'Save'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {existingDoc && (
                        <div className="flex gap-2 ml-4">
                            <button onClick={() => { setTempDate(existingDoc.expiryDate); setEditingDocType(req.type); }} className="p-3 text-slate-400 hover:text-[#0047AB] hover:bg-blue-50 bg-white border border-slate-100 rounded-2xl shadow-sm transition-all active:scale-90 flex items-center gap-1.5" title="Edit date">
                                <Pencil size={14} strokeWidth={2.5} />
                                <span className="text-[8px] font-black uppercase hidden sm:block">Edit</span>
                            </button>
                            <button onClick={() => deleteDoc(existingDoc)} disabled={isProcessing} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 bg-white border border-slate-100 rounded-2xl shadow-sm transition-all active:scale-90 disabled:opacity-30" title="Delete record">
                                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2.5} />}
                            </button>
                        </div>
                    )}
                </div>
                {showScanner === req.type && <DocumentScanner onClose={() => setShowScanner(null)} onScanComplete={(data: any) => handleScanComplete(req.type, data)} label={`Scan ${req.label}`} />}
            </div>
        );
    };

    return (
        <div className="space-y-0">
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle Docs</h4>
                            {isFetching && <Loader2 size={10} className="text-blue-500 animate-spin" />}
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">FOR ACTIVE TAXI UNITS</p>
                    </div>
                    {settings.vehicles.length > 0 && (
                        <div className="relative">
                            <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} aria-label="Select vehicle for documentation" className="bg-slate-900 border-none text-[10px] font-black uppercase tracking-wider text-white py-2.5 pl-4 pr-10 rounded-2xl shadow-lg cursor-pointer outline-none appearance-none hover:bg-slate-800 transition-colors">
                                {settings.vehicles.map(v => <option key={v.id} value={v.id}>{v.number}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg></div>
                        </div>
                    )}
                </div>
                {settings.vehicles.length === 0 ? (
                    <div className="p-10 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[40px] text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-200"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg></div>
                        <div className="space-y-1"><p className="text-xs font-black text-slate-800 uppercase tracking-wider">No Vehicles Found</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Add your fleet in the 'Garage' tab<br />to start tracking documents.</p></div>
                    </div>
                ) : (
                    <div className="space-y-4">{REQUIRED_VEHICLE_DOCS.map(req => renderDocItem(req, 'vehicle'))}</div>
                )}
            </div>
            <div className="space-y-6 pt-10 mt-10 border-t-2 border-slate-50">
                <div className="px-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator Profile</h4>
                    <p className="text-[8px] font-bold text-slate-400 mt-0.5">PERSONAL DRIVING CREDENTIALS</p>
                </div>
                <div className="space-y-4">{REQUIRED_DRIVER_DOCS.map(req => renderDocItem(req, 'driver'))}</div>
            </div>
        </div>
    );
};

export default DocumentVault;
