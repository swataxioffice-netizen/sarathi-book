import React, { useState, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { Trip } from '../utils/fare';
import { shareReceipt } from '../utils/pdf';
import { FileText, Share2, Eye, Trash2 } from 'lucide-react';

interface HistoryProps {
    trips: Trip[];
    onDeleteTrip?: (id: string) => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

const History: React.FC<HistoryProps> = ({ trips, onDeleteTrip }) => {
    const { settings } = useSettings();
    const [filter, setFilter] = useState<TimeFilter>('all');

    // Filter Logic
    const filteredTrips = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        return trips.filter(trip => {
            const tripDate = new Date(trip.date);
            const tripDateStr = tripDate.toISOString().split('T')[0];

            if (filter === 'today') return tripDateStr === today;
            if (filter === 'week') {
                const diffTime = Math.abs(now.getTime() - tripDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            }
            if (filter === 'month') {
                return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();
            }
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [trips, filter]);

    // Calculate Total Amount
    const totalAmount = useMemo(() => {
        return filteredTrips.reduce((sum, trip) => sum + trip.totalFare, 0);
    }, [filteredTrips]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-4 pt-2 pb-24">

            {/* Filter & Summary Section */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest underline decoration-2 decoration-blue-500 underline-offset-4">
                        Recent Invoices
                    </h3>
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                        {(['all', 'today', 'week', 'month'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Total Card */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total {filter === 'all' ? 'Revenue' : filter + ' Revenue'}</p>
                            <h2 className="text-2xl font-black tracking-tight">₹{totalAmount.toLocaleString('en-IN')}</h2>
                        </div>
                        <div className="mb-1">
                            <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full font-medium">{filteredTrips.length} Invoices</span>
                        </div>
                    </div>
                </div>
            </div>

            {
                filteredTrips.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-center">
                        <FileText className="text-slate-300 mb-2" size={24} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No invoices found for {filter}</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredTrips.map((trip) => (
                            <div key={trip.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${trip.mode === 'outstation' ? 'bg-purple-500' : 'bg-[#0047AB]'}`}></div>

                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3 pl-1.5">
                                        <div className={`p-2.5 rounded-xl border ${trip.mode === 'outstation' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-blue-50 border-blue-100 text-[#0047AB]'}`}>
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 leading-none">{trip.customerName || 'Unknown Customer'}</h4>

                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                    {formatDate(trip.date)}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${trip.mode === 'outstation' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {trip.mode === 'package' ? 'PACKAGE' : trip.mode === 'hourly' ? 'RENTAL' : trip.mode === 'outstation' ? 'OUTSTATION' : 'DROP'}
                                                </span>
                                            </div>

                                            <div className="mt-1 text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                                                {trip.from} {trip.to ? `➔ ${trip.to}` : ''}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-sm font-black text-slate-900">
                                            ₹{Math.round(trip.totalFare).toLocaleString('en-IN')}
                                        </span>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => shareReceipt(trip, { ...settings, vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A' })}
                                                className="p-2 rounded-lg bg-blue-50 text-[#0047AB] hover:bg-[#0047AB] hover:text-white transition-all border border-blue-100"
                                                title="View/Download PDF"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => shareReceipt(trip, { ...settings, vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || 'N/A' })}
                                                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all border border-green-100"
                                                title="Share Receipt"
                                            >
                                                <Share2 size={14} />
                                            </button>


                                            {/* Delete Button */}
                                            {onDeleteTrip && (
                                                <button
                                                    onClick={() => onDeleteTrip(trip.id)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                                    title="Delete Invoice"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
};

export default History;
