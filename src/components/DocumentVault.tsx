import React, { useState, useEffect } from 'react';
import { Trash2, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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

    const saveDoc = async (type: string, category: 'vehicle' | 'driver', dateStr: string) => {
        if (!dateStr) return;

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
                id: crypto.randomUUID(), name: docName, type: type as any, expiryDate: dateStr,
            };

            if (user) {
                // Check if we need to update or insert
                const existing = docs.find(d => d.type === type && d.name === docName);

                const payload = {
                    user_id: user.id,
                    name: docName,
                    type,
                    expiry_date: dateStr
                };

                let res;
                if (existing) {
                    // Note: Ensure you have an UPDATE policy in Supabase for this to work
                    res = await supabase.from('user_documents').update(payload).eq('id', existing.id).select().single();
                } else {
                    res = await supabase.from('user_documents').insert(payload).select().single();
                }

                if (res.error) throw res.error;
                if (res.data) newDoc = { ...newDoc, id: res.data.id };
            }

            const updatedDocs = docs.filter(d => !(d.type === type && d.name === docName));
            const finalDocs = [newDoc, ...updatedDocs];
            setDocs(finalDocs);
            if (!user) localStorage.setItem('cab-docs', JSON.stringify(finalDocs));

        } catch (error: any) {
            console.error(error);
            alert('Save failed: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
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

    // Helper
    const getDays = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (86400000));
    const selectedVehicle = settings.vehicles.find(v => v.id === selectedVehicleId);

    const renderDocItem = (req: { type: string, label: string, helper: string }, category: 'vehicle' | 'driver') => {
        const existingDoc = docs.find(d => {
            if (d.type !== req.type) return false;
            if (category === 'vehicle') return d.name === selectedVehicle?.number;
            return true;
        });

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
                                    {isExpired ? `Expired ${Math.abs(daysLeft)} days ago` : `Expires in ${daysLeft} days`}
                                    <span className="ml-2 lowercase font-medium text-slate-400">({existingDoc.expiryDate})</span>
                                </p>
                            ) : (
                                <p className="text-[9px] font-medium text-slate-500">No date added</p>
                            )}
                        </div>
                    </div>
                    <div>
                        {existingDoc ? (
                            <button onClick={() => deleteDoc(existingDoc)} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-lg shadow-sm active:scale-95 transition-all">
                                <Trash2 size={14} />
                            </button>
                        ) : (
                            <div className="relative">
                                <input
                                    type="date"
                                    id={`date-input-${category}-${req.type}`}
                                    className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                            saveDoc(req.type, category, val);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.getElementById(`date-input-${category}-${req.type}`) as any;
                                        if (input) {
                                            try {
                                                if (input.showPicker) {
                                                    input.showPicker();
                                                } else {
                                                    input.click();
                                                }
                                            } catch (e) {
                                                input.click();
                                            }
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-[#0047AB] bg-[#0047AB] text-white shadow-md text-[9px] font-black uppercase tracking-wider flex items-center gap-2 active:scale-95"
                                >
                                    Add Expiry Date
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
