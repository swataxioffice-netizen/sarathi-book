
import React, { useState } from 'react';
import { X, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface AdditionalChargesDrawerProps {
    isOpen: boolean;
    onClose: () => void;

    // Context for logic
    tripType: string;
    days: string;

    // States & Setters
    driverBata: string;
    setDriverBata: (v: string) => void;
    manualDriverBata: boolean;
    setManualDriverBata: (v: boolean) => void;

    toll: string;
    setToll: (v: string) => void;
    manualToll: boolean;
    setManualToll: (v: boolean) => void;

    parking: string;
    setParking: (v: string) => void;
    manualParking: boolean;
    setManualParking: (v: boolean) => void;

    permit: string;
    setPermit: (v: string) => void;
    manualPermit: boolean;
    setManualPermit: (v: boolean) => void;

    hillStationCharge: string;
    setHillStationCharge: (v: string) => void;
    manualHillStation: boolean;
    setManualHillStation: (v: boolean) => void;

    petCharge: string;
    setPetCharge: (v: string) => void;
    manualPet: boolean;
    setManualPet: (v: boolean) => void;

    nightCharge: string;
    setNightCharge: (v: string) => void;
    manualNight: boolean;
    setManualNight: (v: boolean) => void;

    // Custom Charges
    extraItems: { description: string; amount: number }[];
    setExtraItems: React.Dispatch<React.SetStateAction<{ description: string; amount: number }[]>>;
}

const AdditionalChargesDrawer: React.FC<AdditionalChargesDrawerProps> = ({
    isOpen, onClose,
    tripType, days,
    driverBata, setDriverBata, manualDriverBata, setManualDriverBata,
    toll, setToll, manualToll, setManualToll,
    parking, setParking, manualParking, setManualParking,
    permit, setPermit, manualPermit, setManualPermit,
    hillStationCharge, setHillStationCharge, manualHillStation, setManualHillStation,
    petCharge, setPetCharge, manualPet, setManualPet,
    nightCharge, setNightCharge, manualNight, setManualNight,
    extraItems, setExtraItems
}) => {
    const [selectedChargeType, setSelectedChargeType] = useState('');
    const [customChargeName, setCustomChargeName] = useState('');
    const [customChargeAmount, setCustomChargeAmount] = useState('');

    const handleAddCharge = () => {
        const desc = selectedChargeType === 'Custom' ? customChargeName : selectedChargeType;
        const amount = parseFloat(customChargeAmount);

        if (desc && amount > 0) {
            setExtraItems(prev => [...prev, { description: desc, amount }]);
            setCustomChargeName('');
            setCustomChargeAmount('');
            setSelectedChargeType('');
            // Keep drawer open
        }
    };

    const handleDeleteCharge = (index: number) => {
        setExtraItems(prev => prev.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-[110] backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white z-[120] rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[85vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Additional Charges</h3>
                        <p className="text-[10px] text-slate-500">Add tolls, parking, beta & more</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 space-y-5 overflow-y-auto pb-8 flex-1">

                    {/* Driver Bata */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Driver Bata {tripType === 'roundtrip' ? `(x${days} Days)` : ''}</label>
                            {manualDriverBata && (
                                <button onClick={() => setManualDriverBata(false)} className="text-[10px] text-blue-600 flex items-center gap-1 font-medium" title="Reset to Auto">
                                    <RotateCcw size={10} /> Reset
                                </button>
                            )}
                        </div>
                        <input
                            type="number"
                            value={driverBata}
                            onChange={e => { setDriverBata(e.target.value); setManualDriverBata(true); }}
                            className={`tn-input h-10 w-full text-sm ${manualDriverBata ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-slate-50 border-slate-200'}`}
                            placeholder="0"
                        />
                    </div>

                    {/* Toll Charges */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Toll Charges</label>
                            {manualToll && (
                                <button onClick={() => setManualToll(false)} className="text-[10px] text-blue-600 flex items-center gap-1 font-medium" title="Reset to Auto">
                                    <RotateCcw size={10} /> Reset
                                </button>
                            )}
                        </div>
                        <input
                            type="number"
                            value={toll}
                            onChange={e => { setToll(e.target.value); setManualToll(true); }}
                            className={`tn-input h-10 w-full text-sm ${manualToll ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-slate-50 border-slate-200'}`}
                            placeholder="0"
                        />
                    </div>

                    {/* Parking & Permit Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Parking</label>
                                {manualParking && (
                                    <button onClick={() => setManualParking(false)} className="text-blue-600" title="Reset"><RotateCcw size={10} /></button>
                                )}
                            </div>
                            <input
                                type="number"
                                value={parking}
                                onChange={e => { setParking(e.target.value); setManualParking(true); }}
                                className={`tn-input h-10 w-full text-sm ${manualParking ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-slate-50 border-slate-200'}`}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Permit</label>
                                {manualPermit && (
                                    <button onClick={() => setManualPermit(false)} className="text-blue-600" title="Reset"><RotateCcw size={10} /></button>
                                )}
                            </div>
                            <input
                                type="number"
                                value={permit}
                                onChange={e => { setPermit(e.target.value); setManualPermit(true); }}
                                className={`tn-input h-10 w-full text-sm ${manualPermit ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-slate-50 border-slate-200'}`}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Hill / Pet Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Hill Station</label>
                                {manualHillStation && (
                                    <button onClick={() => { setHillStationCharge('0'); setManualHillStation(false); }} className="text-blue-600"><RotateCcw size={10} /></button>
                                )}
                            </div>
                            <input
                                type="number"
                                value={hillStationCharge}
                                onChange={e => { setHillStationCharge(e.target.value); setManualHillStation(true); }}
                                className={`tn-input h-10 w-full text-sm ${manualHillStation ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-slate-50 border-slate-200'}`}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pet Charge</label>
                                {manualPet && (
                                    <button onClick={() => { setPetCharge('0'); setManualPet(false); }} className="text-blue-600"><RotateCcw size={10} /></button>
                                )}
                            </div>
                            <input
                                type="number"
                                value={petCharge}
                                onChange={e => { setPetCharge(e.target.value); setManualPet(true); }}
                                className={`tn-input h-10 w-full text-sm ${manualPet ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-slate-50 border-slate-200'}`}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Night Charge */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Night Drive (11 PM - 5 AM)</label>
                            {manualNight && (
                                <button onClick={() => { setNightCharge('0'); setManualNight(false); }} className="text-[10px] text-blue-600 flex items-center gap-1 font-medium" title="Reset">
                                    <RotateCcw size={10} /> Reset
                                </button>
                            )}
                        </div>
                        <input
                            type="number"
                            value={nightCharge}
                            onChange={e => { setNightCharge(e.target.value); setManualNight(true); }}
                            className={`tn-input h-10 w-full text-sm ${manualNight ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-slate-50 border-slate-200'}`}
                            placeholder="0"
                        />
                    </div>

                    {/* Other Charges */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 -mx-4 -mb-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Other Charges</label>

                        <div className="flex gap-2">
                            <select
                                className="tn-input h-10 flex-1 text-sm bg-white border-slate-200"
                                value={selectedChargeType}
                                onChange={(e) => {
                                    setSelectedChargeType(e.target.value);
                                    if (e.target.value !== 'Custom') setCustomChargeName('');
                                }}
                            >
                                <option value="">Select Charge Type</option>
                                <option value="Custom">Custom Charge</option>
                                <option value="Cleaning Fee">Cleaning Fee</option>
                                <option value="Driver Allowance">Driver Allowance</option>
                                <option value="Guide Fee">Guide Fee</option>
                                <option value="Luggage Charge">Luggage Charge</option>
                                <option value="Airport Entry">Airport Entry</option>
                                <option value="FastTag Recharge">FastTag Recharge</option>
                                <option value="Decoration">Decoration</option>
                                <option value="Waiting Charge">Waiting Charge</option>
                            </select>
                        </div>

                        {selectedChargeType && (
                            <div className="flex gap-2 animate-in slide-in-from-top-2">
                                {selectedChargeType === 'Custom' && (
                                    <input
                                        placeholder="Charge Name"
                                        className="tn-input h-10 flex-[2] bg-white"
                                        value={customChargeName}
                                        onChange={e => setCustomChargeName(e.target.value)}
                                        autoFocus
                                    />
                                )}
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    className="tn-input h-10 flex-1 bg-white"
                                    value={customChargeAmount}
                                    onChange={e => setCustomChargeAmount(e.target.value)}
                                />
                                <button
                                    onClick={handleAddCharge}
                                    className="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-slate-200 active:scale-95 transition-all"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        )}

                        {/* List of added items */}
                        <div className="space-y-2">
                            {extraItems.map((item, idx) => (
                                // Only show if amount > 0 or meaningful description, to avoid showing the 'empty' init item if step 2 created one
                                (item.amount > 0 || item.description) && (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                                        <span className="text-xs font-bold text-slate-700">{item.description || 'Item'}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-900">₹{item.amount}</span>
                                            <button onClick={() => handleDeleteCharge(idx)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Button */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-blue-200 hover:shadow-lg transition-all active:scale-95">
                        Done
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdditionalChargesDrawer;
