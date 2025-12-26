import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { useSettings } from '../contexts/SettingsContext';

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
    { type: 'RC', label: 'RC Book (Original)', helper: 'Registration Certificate' },
    { type: 'Insurance', label: 'Insurance Policy', helper: 'Comprehensive or Third Party' },
    { type: 'Permit', label: 'Permit Copy', helper: 'State or All India Permit' },
    { type: 'Fitness', label: 'FC (Fitness)', helper: 'Fitness Certificate Copy' },
    { type: 'Pollution', label: 'Pollution (PUC)', helper: 'Current Emission Certificate' }
];

const REQUIRED_DRIVER_DOCS = [
    { type: 'License', label: 'Driving License', helper: 'Original or DigiLocker copy' },
    { type: 'Badge', label: 'Driver Badge', helper: 'Public Service Badge' },
    { type: 'Aadhar', label: 'Aadhar Card', helper: 'Front and Back copy' },
    { type: 'Police', label: 'Police Verification', helper: 'Safety Background Check' }
];

const DocumentVault: React.FC<DocumentVaultProps> = ({ onStatsUpdate }) => {
    const { user } = useAuth();
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState<Document[]>([]);
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null); // 'type' of doc currently expanding

    // Selection State
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

    // Upload Form State
    const [expiry, setExpiry] = useState('');
    const [fileData, setFileData] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [fileObj, setFileObj] = useState<File | null>(null);

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
        if (!onStatsUpdate) return;
        const vehicleTypes = REQUIRED_VEHICLE_DOCS.map(d => d.type);
        const driverTypes = REQUIRED_DRIVER_DOCS.map(d => d.type);
        const currentTypes = new Set(docs.map(d => d.type));
        const hasFullVehicle = vehicleTypes.every(t => currentTypes.has(t as any));
        const hasFullDriver = driverTypes.every(t => currentTypes.has(t as any));
        onStatsUpdate({ hasFullVehicle, hasFullDriver });
    }, [docs, onStatsUpdate]);

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
        setFileName(file.name);
        setFileObj(file);
        const reader = new FileReader();
        reader.onload = (ev) => setFileData(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const saveDoc = async (type: string, category: 'vehicle' | 'driver') => {
        if (!expiry || !fileData) { alert('Please select a file and expiry date'); return; }

        let docName = 'Driver';
        if (category === 'vehicle') {
            const v = settings.vehicles.find(v => v.id === selectedVehicleId);
            if (!v) { alert('Select a vehicle first'); return; }
            docName = v.number;
        } else {
            docName = settings.holderName || 'Driver';
        }

        setLoading(true);
        try {
            let newDoc: Document = {
                id: crypto.randomUUID(), name: docName, type: type as any, expiryDate: expiry, fileData, fileName,
            };

            if (user) {
                let publicUrl = '';
                let filePath = '';
                if (fileObj) {
                    const fileExt = fileObj.name.split('.').pop();
                    filePath = `${user.id}/${Date.now()}.${fileExt}`;
                    await supabase.storage.from('documents').upload(filePath, fileObj);
                    const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
                    publicUrl = data.publicUrl;
                }
                const { data, error } = await supabase.from('user_documents').insert({
                    user_id: user.id, name: docName, type, expiry_date: expiry,
                    file_url: publicUrl, file_path: filePath
                }).select().single();
                if (error) throw error;
                newDoc = { ...newDoc, id: data.id, fileData: publicUrl, fileName: filePath };
            }

            // Remove old doc of same type AND same name (for vehicles) or just same type (for driver)
            // Actually simpler: just remove same type? No, a user might have RC for Car A and Car B.
            // So we must match 'type' AND 'name' if it's a vehicle doc, or just 'id'?
            // The previous logic filtered by type only: `docs.filter(d => d.type !== type)`.
            // This is BUGGY if multiple cars.
            // Correct logic: remove any existing doc that matches this update's intent.
            const updatedDocs = docs.filter(d => !(d.type === type && d.name === docName));

            const finalDocs = [newDoc, ...updatedDocs];
            setDocs(finalDocs);
            if (!user) localStorage.setItem('cab-docs', JSON.stringify(finalDocs));

            setExpandedDoc(null);
            setExpiry(''); setFileName(''); setFileObj(null); setFileData('');

        } catch (error: any) {
            console.error(error);
            alert('Save failed');
        } finally {
            setLoading(false);
        }
    };

    const deleteDoc = async (doc: Document) => {
        if (!confirm('Delete this document?')) return;
        setLoading(true);
        try {
            if (user && doc.fileName) {
                await supabase.storage.from('documents').remove([doc.fileName]);
                await supabase.from('user_documents').delete().eq('id', doc.id);
            }
            const updated = docs.filter(d => d.id !== doc.id);
            setDocs(updated);
            if (!user) localStorage.setItem('cab-docs', JSON.stringify(updated));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // Helper
    const getDays = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (86400000));
    const selectedVehicle = settings.vehicles.find(v => v.id === selectedVehicleId);

    const renderDocItem = (req: { type: string, label: string, helper: string }, category: 'vehicle' | 'driver') => {
        // Find existing doc. 
        // For vehicle: match type AND vehicle number.
        // For driver: match type only (assuming single driver profile for now).
        const existingDoc = docs.find(d => {
            if (d.type !== req.type) return false;
            if (category === 'vehicle') return d.name === selectedVehicle?.number;
            return true;
        });

        const isExpanded = expandedDoc === req.type;
        const daysLeft = existingDoc ? getDays(existingDoc.expiryDate) : 0;
        const isExpired = daysLeft < 0;
        const isWarning = daysLeft < 30;

        return (
            <div key={req.type} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-sm transition-all">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${existingDoc ? (isExpired ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600') : 'bg-white border border-slate-100 text-slate-400'}`}>
                            {existingDoc ? (isExpired ? <AlertCircle size={16} /> : <CheckCircle size={16} />) : <FileText size={16} />}
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-800">{req.label}</h4>
                            <p className="text-[9px] font-medium text-slate-400">{req.helper}</p>
                            {existingDoc ? (
                                <p className={`text-[9px] font-bold uppercase ${isExpired ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-green-600'}`}>
                                    {isExpired ? 'Expired' : `Expires in ${daysLeft} days`}
                                </p>
                            ) : (
                                <p className="text-[9px] font-medium text-slate-400">Not Uploaded Yet</p>
                            )}
                        </div>
                    </div>
                    <div>
                        {existingDoc ? (
                            <div className="flex items-center gap-2">
                                <button onClick={() => window.open(existingDoc.fileData, '_blank')} className="p-2 text-slate-400 hover:text-[#0047AB] bg-white border border-slate-100 rounded-lg">
                                    <FileText size={14} />
                                </button>
                                <button onClick={() => deleteDoc(existingDoc)} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-lg">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (isExpanded) { setExpandedDoc(null); }
                                    else { setExpandedDoc(req.type); setExpiry(''); setFileName(''); }
                                }}
                                className={`px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${isExpanded ? 'bg-white border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:border-[#0047AB] hover:text-[#0047AB]'}`}
                            >
                                {isExpanded ? <X size={12} /> : <Upload size={12} />}
                                {isExpanded ? 'Cancel' : 'Upload'}
                            </button>
                        )}
                    </div>
                </div>

                {isExpanded && !existingDoc && (
                    <div className="mt-3 pt-3 border-t border-slate-200 animate-fade-in">
                        <div className="space-y-3">
                            <div>
                                <label htmlFor={`expiry-${req.type}`} className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                <input
                                    id={`expiry-${req.type}`}
                                    type="date"
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    className="tn-input h-9 w-full text-xs font-medium uppercase text-slate-900 bg-white"
                                />
                            </div>
                            <div>
                                <label htmlFor={`file-${req.type}`} className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Document File</label>
                                <div className="relative">
                                    <input
                                        id={`file-${req.type}`}
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileUpload}
                                        aria-label={`Upload ${req.label}`}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className={`tn-input h-9 flex items-center px-3 text-[10px] font-medium bg-white ${fileName ? 'text-green-600 bg-green-50' : 'text-slate-400'}`} aria-hidden="true">
                                        {fileName ? <><CheckCircle size={12} className="mr-2" /> {fileName}</> : 'Tap to Take Photo / Choose File'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => saveDoc(req.type, REQUIRED_VEHICLE_DOCS.some(doc => doc.type === req.type) ? 'vehicle' : 'driver')}
                                disabled={loading}
                                className="w-full bg-[#0047AB] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                Save {req.label}
                            </button>
                        </div>
                    </div>
                )}
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



            {/* Vehicle Section */}
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
                        <p className="text-[10px] font-bold text-orange-600">Please add a vehicle in 'Fleet Management' first.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {REQUIRED_VEHICLE_DOCS.map(req => renderDocItem(req, 'vehicle'))}
                    </div>
                )}
            </div>

            {/* Driver Section */}
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
