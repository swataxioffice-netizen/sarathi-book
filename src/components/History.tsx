import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { Trip } from '../utils/fare';
import { shareReceipt } from '../utils/pdf';
import { FileText, Share2, ChevronRight } from 'lucide-react';

interface HistoryProps {
    trips: Trip[];
}

const History: React.FC<HistoryProps> = ({ trips }) => {
    const { settings, currentVehicle } = useSettings();
    const [showAll, setShowAll] = useState(false);

    const sortedTrips = [...trips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const displayTrips = showAll ? sortedTrips : sortedTrips.slice(0, 5);

    return (
        <div className="space-y-4">
            <div className="flex justify-center items-center px-1 pb-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1.5 px-6">Saved Invoices</h3>
            </div>
            {trips.length > 5 && (
                <div className="flex justify-end -mt-9 mb-3 px-1">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-[9px] font-black uppercase tracking-tight text-[#0047AB] flex items-center gap-1 group bg-blue-50 px-2 py-1 rounded-full border border-blue-100"
                    >
                        {showAll ? 'Show Recent' : 'View All'}
                        <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}

            {sortedTrips.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No invoices recorded yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {displayTrips.map((trip) => (
                        <div key={trip.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden">
                            {/* Blue Accent Line */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0047AB]/20"></div>

                            <div className="flex items-center gap-3 pl-1">
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                                    <FileText size={16} />
                                </div>
                                <div className="leading-tight">
                                    <h4 className="text-xs font-black text-slate-900">{trip.customerName}</h4>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[9px] font-bold text-slate-400">
                                            {new Date(trip.date).toLocaleDateString()}
                                        </span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                        <span className="text-[8px] font-black text-[#0047AB] uppercase">
                                            {trip.mode}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">₹{Math.round(trip.totalFare).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => shareReceipt(trip, { ...settings, vehicleNumber: currentVehicle?.number || 'N/A' })}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-[#0047AB] hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1.5 group"
                                >
                                    <Share2 size={14} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">PDF</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
