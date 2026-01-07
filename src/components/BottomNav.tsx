import React from 'react';
import { LayoutDashboard, FileText, Wallet, Calculator, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onNoteClick?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onNoteClick }) => {
    const { isAdmin } = useAuth();

    const navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'HOME' },
        { id: 'trips', icon: <FileText size={20} />, label: 'TRIPS' },
        // Center Space is reserved
        { id: 'calculator', icon: <Calculator size={20} />, label: 'CALC' },
        { id: 'expenses', icon: <Wallet size={20} />, label: 'SPEND' },
    ];

    if (isAdmin) {
        navItems.push({ id: 'admin', icon: <ShieldCheck size={20} />, label: 'ADMIN' });
    }

    const firstHalf = navItems.slice(0, 2);
    const secondHalf = navItems.slice(2);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            {/* SVG Curve Effect for the center button (Optional, but gives the 'merged' look) */}
            <div className="relative bg-white border-t border-slate-200 h-[72px] flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">

                {/* Left Side */}
                <div className="flex-1 flex justify-evenly items-center">
                    {firstHalf.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center w-16 p-1 transition-all active:scale-95 ${activeTab === item.id ? 'text-[#0047AB]' : 'text-slate-400'}`}
                        >
                            <div className={`${activeTab === item.id ? 'scale-110' : ''}`}>{item.icon}</div>
                            <span className="text-[9px] font-black uppercase mt-1.5 tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Center Space Holder */}
                <div className="w-14 shrink-0"></div>

                {/* Center Button (Quick Notes) - Absolute Positioned */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-5 flex flex-col items-center">
                    <button
                        onClick={() => {
                            if (onNoteClick) onNoteClick();
                            else setActiveTab('notes');
                        }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl border-[4px] border-[#f8f9fa] transform transition-all duration-300 ${activeTab === 'notes' ? 'scale-110 bg-yellow-400 text-yellow-900 shadow-yellow-400/50' : 'bg-yellow-400 text-yellow-900 hover:scale-105'
                            }`}
                    >
                        {/* User requested Plus symbol */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                    <span className={`text-[9px] font-black uppercase mt-1 tracking-wider transition-colors ${activeTab === 'notes' ? 'text-yellow-600' : 'text-slate-400'}`}>
                        Notes
                    </span>
                </div>

                {/* Right Side */}
                <div className="flex-1 flex justify-evenly items-center">
                    {secondHalf.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center w-16 p-1 transition-all active:scale-95 ${activeTab === item.id ? 'text-[#0047AB]' : 'text-slate-400'}`}
                        >
                            <div className={`${activeTab === item.id ? 'scale-110' : ''}`}>{item.icon}</div>
                            <span className="text-[9px] font-black uppercase mt-1.5 tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BottomNav;
