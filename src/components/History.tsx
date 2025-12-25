import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { Trip } from '../utils/fare';
import { shareReceipt } from '../utils/pdf';
import { FileText, Share2 } from 'lucide-react';

interface HistoryProps {
    trips: Trip[];
}

const History: React.FC<HistoryProps> = ({ trips }) => {
    const { settings } = useSettings();
    const [showAll, setShowAll] = useState(false);

    const sortedTrips = [...trips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const displayTrips = showAll ? sortedTrips : sortedTrips.slice(0, 5);

    return (
        <div className="space-y-2 pt-2 pb-24">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">Recent Invoices</h3>
                {trips.length > 5 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-[9px] font-black uppercase tracking-tight text-[#0047AB] bg-blue-50 px-2 py-1 rounded-full border border-blue-100"
                    >
                        {showAll ? 'Show Less' : 'View All'}
                    </button>
                )}
            </div>

            {sortedTrips.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed rounded-xl py-6 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No invoices yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {displayTrips.map((trip) => (
                        <div key={trip.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0047AB]/20"></div>

                            <div className="flex items-center gap-3 pl-1">
                                <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-[#0047AB]">
                                    <FileText size={16} />
                                </div>
                                <div className="leading-tight">
                                    <h4 className="text-xs font-black text-slate-900">{trip.customerName || 'Unknown Customer'}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[9px] font-bold text-slate-400">
                                            {new Date(trip.date).toLocaleDateString()}
                                        </span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                        <span className="text-[8px] font-black text-[#0047AB] uppercase">
                                            {trip.mode === 'package' ? 'PKG' : trip.mode === 'hourly' ? 'RENT' : trip.mode === 'outstation' ? 'RT' : 'ONE'}
                                        </span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                        <span className="text-[9px] font-black text-slate-600">
                                            ₹{Math.round(trip.totalFare).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => shareReceipt(trip, settings)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-[#0047AB] hover:text-white transition-colors"
                            >
                                <Share2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
