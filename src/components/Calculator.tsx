import React from 'react';
import { Calculator as CalcIcon } from 'lucide-react';

const Calculator: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <div className="w-20 h-20 bg-blue-50 text-[#0047AB] rounded-2xl flex items-center justify-center">
                <CalcIcon size={40} strokeWidth={1.5} />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Rate Calculator</h2>
                <p className="text-sm font-bold text-slate-400 mt-2">Calculate trip fares and estimates.</p>
                <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Module Loading...</p>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
