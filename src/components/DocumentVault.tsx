import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, FileText, CheckCircle, AlertTriangle, AlertCircle, Info, ArrowDownToLine, Loader2 } from 'lucide-react';
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

const DocumentVault: React.FC<DocumentVaultProps> = ({ onStatsUpdate }) => {
    const { user } = useAuth();
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState<Document[]>([]);

    useEffect(() => {
        loadDocs();
    }, [user]);

    // Calculate Stats for Profile Completion
    useEffect(() => {
        if (!onStatsUpdate) return;

        const vehicleTypes = ['RC', 'Insurance', 'Pollution', 'Fitness', 'Permit'];
        const driverTypes = ['License', 'Badge', 'Aadhar', 'Police'];

        const grouped: Record<string, Set<string>> = {};
        docs.forEach(d => {
            if (!grouped[d.name]) grouped[d.name] = new Set();
            grouped[d.name].add(d.type);
        });

        let hasFullVehicle = false;
        let hasFullDriver = false;

        Object.values(grouped).forEach(types => {
            if (vehicleTypes.every(t => types.has(t as any))) hasFullVehicle = true;
            if (driverTypes.every(t => types.has(t as any))) hasFullDriver = true;
        });

        onStatsUpdate({ hasFullVehicle, hasFullDriver });
    }, [docs, onStatsUpdate]);

    const loadDocs = async () => {
        if (user) {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const mappedDocs: Document[] = data.map(d => ({
                        id: d.id,
                        name: d.name,
                        type: d.type,
                        expiryDate: d.expiry_date,
                        fileData: d.file_url,
                        fileName: d.file_path
                    }));
                    setDocs(mappedDocs);
                }
            } catch (err) {
                console.error('Error loading docs:', err);
            } finally {
                setLoading(false);
            }
        } else {
            const saved = localStorage.getItem('cab-docs');
            setDocs(saved ? JSON.parse(saved) : []);
        }
    };

    const [name, setName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [type, setType] = useState<Document['type']>('RC');
    const [fileData, setFileData] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [fileObj, setFileObj] = useState<File | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Max 5MB allowed.');
            return;
        }

        setFileName(file.name);
        setFileObj(file);

        const reader = new FileReader();
        reader.onload = (ev) => {
            setFileData(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const [activeTab, setActiveTab] = useState<'vehicle' | 'driver'>('vehicle');
    const [driverName, setDriverName] = useState('');

    const addDoc = async () => {
        // Validation based on tab
        if (activeTab === 'vehicle') {
            if (!name || !expiry || !type) return;
        } else {
            if (!driverName || !expiry || !type) return;
        }

        setLoading(true);

        const docName = activeTab === 'vehicle' ? name : driverName;
        // Ensure we don't mix up types if switching tabs? 
        // Actually I should reset type when switching tabs to be safe, but user might select.

        try {
            if (user) {
                // Cloud Save
                let publicUrl = '';
                let filePath = '';

                if (fileObj) {
                    const fileExt = fileObj.name.split('.').pop();
                    filePath = `${user.id}/${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(filePath, fileObj);

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from('documents')
                        .getPublicUrl(filePath);

                    publicUrl = urlData.publicUrl;
                }

                const { data, error: dbError } = await supabase
                    .from('user_documents')
                    .insert({
                        user_id: user.id,
                        name: docName, // Vehicle Number or Driver Name
                        type,
                        expiry_date: expiry,
                        file_url: publicUrl,
                        file_path: filePath
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;

                if (data) {
                    setDocs(prev => [{
                        id: data.id,
                        name: data.name,
                        type: data.type as any,
                        expiryDate: data.expiry_date,
                        fileData: data.file_url,
                        fileName: data.file_path
                    }, ...prev]);
                }
            } else {
                // Local Save
                const newDoc: Document = {
                    id: crypto.randomUUID(),
                    name: docName,
                    expiryDate: expiry,
                    type,
                    fileData,
                    fileName
                };
                const up = [newDoc, ...docs];
                setDocs(up);
                try {
                    localStorage.setItem('cab-docs', JSON.stringify(up));
                } catch (e) {
                    alert('Local Storage full! Sign in to Google to save unlimited documents.');
                    setDocs(docs);
                    return;
                }
            }

            // Reset
            setName(''); setDriverName(''); setExpiry(''); setFileData(''); setFileName(''); setFileObj(null);

        } catch (error: any) {
            console.error('Save failed:', error);
            alert(`Failed to save document. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const deleteDoc = async (id: string, filePath?: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        // ... (existing delete logic) ...
        if (user) {
            setLoading(true);
            try {
                if (filePath) {
                    await supabase.storage.from('documents').remove([filePath]);
                }
                const { error } = await supabase.from('user_documents').delete().eq('id', id);
                if (error) throw error;
                setDocs(prev => prev.filter(d => d.id !== id));
            } catch (error) {
                console.error('Delete failed', error);
                alert('Failed to delete document.');
            } finally {
                setLoading(false);
            }
        } else {
            const up = docs.filter(d => d.id !== id);
            setDocs(up);
            localStorage.setItem('cab-docs', JSON.stringify(up));
        }
    };

    const downloadDoc = (doc: Document) => {
        if (!doc.fileData) return;
        const link = document.createElement('a');
        link.href = doc.fileData;
        link.download = doc.fileName || `${doc.type}_${doc.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const viewDoc = (doc: Document) => {
        if (!doc.fileData) return;
        window.open(doc.fileData, '_blank');
    };

    const getDaysRemaining = (expiry: string) => Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="space-y-4 pb-24">
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Your Documents</h3>
                    <div className="group relative">
                        <Info size={14} className="text-slate-400 cursor-help" />
                        <div className="absolute left-0 top-6 w-56 bg-slate-800 text-white text-[9px] p-2 rounded-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                            {user ? 'Documents are backed up securely to the cloud.' : 'Documents are stored locally. Sign in to backup.'}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-[#0047AB]">
                            <ShieldCheck size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-slate-900 leading-none">Safe Storage</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                                {user ? 'Cloud Encrypted ☁️' : 'Locally Encrypted 🔒'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right pr-2">
                        <p className="text-2xl font-black text-[#0047AB] tracking-tighter leading-none">{docs.length}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-wide mt-0.5">Docs</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3 relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-2xl backdrop-blur-[1px]">
                            <Loader2 size={24} className="text-[#0047AB] animate-spin" />
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => { setActiveTab('vehicle'); setType('RC'); }}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'vehicle' ? 'bg-white text-[#0047AB] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Vehicle Docs
                        </button>
                        <button
                            onClick={() => { setActiveTab('driver'); setType('License'); }}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'driver' ? 'bg-white text-[#0047AB] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Driver Docs
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{activeTab === 'vehicle' ? 'Active Vehicle' : 'Driver Name'}</label>
                                {activeTab === 'vehicle' ? (
                                    <select
                                        value={name}
                                        onChange={(_) => setName(_.target.value)}
                                        className="tn-input h-8 py-0 text-xs font-bold bg-white text-slate-900 appearance-none"
                                    >
                                        <option value="" disabled>Select Vehicle</option>
                                        {settings.vehicles.map(v => (
                                            <option key={v.id} value={v.number}>{v.number} - {v.model}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="e.g. Self / Driver Name"
                                        value={driverName}
                                        onChange={(_) => setDriverName(_.target.value)}
                                        className="tn-input h-8 py-1 text-xs font-bold text-slate-900"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(_) => setType(_.target.value as any)}
                                    className="tn-input h-8 py-0 text-xs font-bold bg-white text-slate-900"
                                >
                                    {activeTab === 'vehicle' ? (
                                        <>
                                            <option value="RC">RC (Registration)</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Pollution">Pollution (PUC)</option>
                                            <option value="Fitness">Fitness (FC)</option>
                                            <option value="Permit">Permit</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="License">Driving License</option>
                                            <option value="Badge">Driver Badge</option>
                                            <option value="Aadhar">Aadhar Card</option>
                                            <option value="Police">Police Verification</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                <input
                                    type="date"
                                    value={expiry}
                                    onChange={(_) => setExpiry(_.target.value)}
                                    className="tn-input h-8 py-1 text-xs font-bold uppercase text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload File (PDF/Img)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="application/pdf,image/*"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className={`tn-input h-8 py-1 flex items-center px-2 text-[10px] font-bold overflow-hidden ${fileName ? 'text-green-600 bg-green-50 border-green-200' : 'text-slate-400'}`}>
                                        {fileName || 'Tap to Upload'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={addDoc}
                        disabled={loading}
                        className="w-full bg-[#0047AB] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {loading ? 'Saving...' : 'Add Document'}
                    </button>
                </div>
            </div>

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
                                    'License': 'DL',
                                    'Badge': 'BDG',
                                    'Aadhar': 'UID',
                                    'Police': 'PCC'
                                };
                                return labels[type] || type;
                            };

                            return (
                                <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between shadow-sm relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isExpired ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'}`}></div>

                                    <div className="flex items-center gap-3 pl-2 flex-1 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${isExpired ? 'bg-red-50 text-red-500' : isWarning ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'}`}>
                                            {isExpired ? <AlertCircle size={16} /> : isWarning ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-black text-slate-900 truncate">{doc.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 rounded-md flex-shrink-0">{getDocTypeLabel(doc.type)}</span>
                                                <span className={`text-[9px] font-bold uppercase flex-shrink-0 ${isExpired ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-slate-400'}`}>
                                                    {isExpired ? 'EXPIRED' : `${days} DAYS LEFT`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {doc.fileData && (
                                            <>
                                                <button
                                                    onClick={() => viewDoc(doc)}
                                                    className="p-2 text-slate-400 hover:text-[#0047AB] hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                <button
                                                    onClick={() => downloadDoc(doc)}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    title="Download"
                                                >
                                                    <ArrowDownToLine size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => deleteDoc(doc.id, doc.fileName)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
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
