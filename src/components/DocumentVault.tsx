import { useState, useEffect } from 'react';
import { Trash2, FileText, CheckCircle, AlertCircle, Loader2, X, Scan } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { useSettings } from '../contexts/SettingsContext';
import DocumentScanner from './DocumentScanner';
import { parseDocument } from '../utils/visionApi';

interface Document {
    id: string;
    name: string;
    expiryDate: string;
    type: 'RC' | 'Insurance' | 'Permit' | 'License' | 'Pollution' | 'Fitness' | 'Badge' | 'Aadhar' | 'Police';
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
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState<Document[]>([]);

    // Selection State
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [editingDocType, setEditingDocType] = useState<string | null>(null);
    const [tempDate, setTempDate] = useState('');
    const [newDocDates, setNewDocDates] = useState<Record<string, string>>({});
    const [showScanner, setShowScanner] = useState<string | null>(null);

    // Initialize selected vehicle
    useEffect(() => {
        if (settings.vehicles.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(settings.vehicles[0].id);
        }
    }, [settings.vehicles, selectedVehicleId]);

    // Load Docs Effect
    useEffect(() => {
        loadDocs();
    }, [user]);

    // Stats Effect
    useEffect(() => {
        const vehicleTypes = REQUIRED_VEHICLE_DOCS.map(d => d.type);
        const mandatoryDriverTypes = REQUIRED_DRIVER_DOCS.filter(d => d.type === 'License').map(d => d.type);
        const currentTypes = new Set(docs.map(d => d.type));

        const hasFullVehicle = vehicleTypes.every(t => currentTypes.has(t as any));
        const hasFullDriver = mandatoryDriverTypes.every(t => currentTypes.has(t as any));

        setDocStats({ hasFullVehicle, hasFullDriver });
        if (onStatsUpdate) onStatsUpdate({ hasFullVehicle, hasFullDriver });
    }, [docs, onStatsUpdate, setDocStats]);

    const loadDocs = async () => {
        if (user) {
            setLoading(true);
            try {
                const { data, error } = await supabase.from('user_documents').select('*').eq('user_id', user.id);
                if (error) throw error;
                if (data) {
                    setDocs(data.map(d => ({
                        id: d.id, name: d.name, type: d.type, expiryDate: d.expiry_date,
                        fileData: d.file_url, fileName: d.file_path
                    })));
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        } else {
            const saved = localStorage.getItem('cab-docs');
            setDocs(saved ? JSON.parse(saved) : []);
        }
    };

    const handleSave = async (reqType: string, category: 'vehicle' | 'driver', dateValue: string) => {
        if (!dateValue) {
            alert('Please select an expiry date');
            return;
        }

        let docName = 'Driver';
        if (category === 'vehicle') {
            let v = settings.vehicles.find(v => v.id === selectedVehicleId);
            if (!v && settings.vehicles.length > 0) {
                v = settings.vehicles[0];
                setSelectedVehicleId(v.id);
            }
            if (!v) {
                alert('No vehicle found. Please add a vehicle in Garage first.');
                return;
            }
            docName = v.number;
        } else {
            docName = settings.holderName || 'Driver';
        }

        setLoading(true);
        try {
            let newDoc: Document = {
                id: crypto.randomUUID(), name: docName, type: reqType as any, expiryDate: dateValue,
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

                let res;
                if (existing) {
                    res = await supabase.from('user_documents').update(payload).eq('id', existing.id).select().single();
                } else {
                    res = await supabase.from('user_documents').insert(payload).select().single();
                }

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

            const updatedDocs = docs.filter(d => !(d.type === reqType && d.name === docName));
            setDocs([newDoc, ...updatedDocs]);
            if (!user) localStorage.setItem('cab-docs', JSON.stringify([newDoc, ...updatedDocs]));

            setEditingDocType(null);
            setTempDate('');
            setNewDocDates(prev => ({ ...prev, [reqType]: '' }));
        } catch (error: any) {
            console.error(error);
            alert('Save failed: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleScanComplete = (reqType: string, data: { fullText: string }) => {
        const parsed = parseDocument(data.fullText.split('\n'));
        if (parsed.expiryDate) {
            let formattedDate = parsed.expiryDate.replace(/\//g, '-');
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

    const deleteDoc = async (doc: Document) => {
        if (!confirm('Remove this document record?')) return;
        setLoading(true);
        try {
            if (user) {
                await supabase.from('user_documents').delete().eq('id', doc.id);
            }
            const updated = docs.filter(d => d.id !== doc.id);
            setDocs(updated);
            if (!user) localStorage.setItem('cab-docs', JSON.stringify(updated));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const getDays = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (86400000));
    const selectedVehicle = settings.vehicles.find(v => v.id === selectedVehicleId);

    const renderDocItem = (req: { type: string, label: string, helper: string }, category: 'vehicle' | 'driver') => {
        const existingDoc = docs.find(d => {
            if (d.type !== req.type) return false;
            if (category === 'vehicle') return d.name === selectedVehicle?.number;
            return true;
        });

        const isEditing = editingDocType === req.type;
        const daysLeft = existingDoc ? getDays(existingDoc.expiryDate) : 0;
        const isExpired = daysLeft < 0;
        const isWarning = daysLeft < 30;

        if (isEditing) {
            return (
                <div key={req.type} className="bg-blue-50 border border-blue-200 rounded-2xl p-3 shadow-md animate-fade-in relative">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="text-xs font-black text-blue-900">{req.label}</h4>
                            <p className="text-[10px] text-blue-600">Update Expiry Date</p>
                        </div>
                        <button onClick={() => setEditingDocType(null)} className="p-1 hover:bg-white/50 rounded-full">
                            <X size={14} className="text-blue-500" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[9px] font-bold text-blue-700 uppercase">Expiry Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={tempDate}
                                onChange={(e) => setTempDate(e.target.value)}
                                className="w-full h-9 rounded-lg border-blue-200 text-xs font-bold px-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowScanner(req.type)}
                                className="flex-1 h-10 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Scan size={14} /> Scan Photo
                            </button>
                            <button
                                onClick={() => handleSave(req.type, category, tempDate)}
                                className="flex-1 h-10 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={14} /> Update
                            </button>
                        </div>
                    </div>

                    {showScanner === req.type && (
                        <DocumentScanner
                            onClose={() => setShowScanner(null)}
                            onScanComplete={(data) => handleScanComplete(req.type, data)}
                            label={`Scan ${req.label}`}
                        />
                    )}
                </div>
            );
        }

        return (
            <div key={req.type} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-sm transition-all hover:border-slate-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${existingDoc ? (isExpired ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600') : 'bg-white border border-slate-100 text-slate-400'}`}>
                            {existingDoc ? (isExpired ? <AlertCircle size={16} /> : <CheckCircle size={16} />) : <FileText size={16} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-black text-slate-800">{req.label}</h4>
                            <p className="text-[9px] font-medium text-slate-400">{req.helper}</p>

                            {existingDoc ? (
                                <div className="flex flex-col mt-0.5">
                                    <p className={`text-[9px] font-bold uppercase ${isExpired ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-green-600'}`}>
                                        {isExpired ? `Expired ${Math.abs(daysLeft)} days ago` : `Expires in ${daysLeft} days`}
                                    </p>
                                    <span className="text-[9px] font-medium text-slate-500">Date: {existingDoc.expiryDate}</span>
                                </div>
                            ) : (
                                <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                    <input
                                        type="date"
                                        value={newDocDates[req.type] || ''}
                                        onChange={(e) => setNewDocDates(prev => ({ ...prev, [req.type]: e.target.value }))}
                                        className="h-10 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    />
                                    <button
                                        onClick={() => setShowScanner(req.type)}
                                        className="h-10 w-10 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 active:scale-95 transition-all"
                                        title="Scan document"
                                    >
                                        <Scan size={16} />
                                    </button>
                                    {newDocDates[req.type] && (
                                        <button
                                            onClick={() => handleSave(req.type, category, newDocDates[req.type])}
                                            className="h-10 px-4 bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-green-800 active:scale-95 flex items-center gap-2 transition-all"
                                        >
                                            <CheckCircle size={14} /> Save
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {showScanner === req.type && (
                        <DocumentScanner
                            onClose={() => setShowScanner(null)}
                            onScanComplete={(data) => handleScanComplete(req.type, data)}
                            label={`Scan ${req.label}`}
                        />
                    )}
                    <div>
                        {existingDoc && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setTempDate(existingDoc.expiryDate);
                                        setEditingDocType(req.type);
                                    }}
                                    className="p-2 text-slate-500 hover:text-blue-600 bg-white border border-slate-100 rounded-lg shadow-sm"
                                >
                                    <CheckCircle size={14} />
                                </button>
                                <button onClick={() => deleteDoc(existingDoc)} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-lg shadow-sm">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-0">
            {loading && (
                <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
                    <Loader2 size={32} className="text-[#0047AB] animate-spin" />
                </div>
            )}

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">For Vehicle</h4>
                    {settings.vehicles.length > 0 && (
                        <select
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            aria-label="Select vehicle for documentation"
                            className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-wider text-slate-700 py-1.5 pl-3 pr-8 rounded-lg focus:ring-0 cursor-pointer outline-none"
                        >
                            {settings.vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.number} - {v.model}</option>
                            ))}
                        </select>
                    )}
                </div>

                {settings.vehicles.length === 0 ? (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-orange-600">Please add a vehicle in 'Garage' first.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {REQUIRED_VEHICLE_DOCS.map(req => renderDocItem(req, 'vehicle'))}
                    </div>
                )}
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Driver Documents</h4>
                </div>
                <div className="space-y-3">
                    {REQUIRED_DRIVER_DOCS.map(req => renderDocItem(req, 'driver'))}
                </div>
            </div>
        </div>
    );
};

export default DocumentVault;
