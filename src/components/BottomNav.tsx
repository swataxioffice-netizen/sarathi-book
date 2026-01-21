import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Wallet, Calculator, ShieldCheck, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    const { isAdmin } = useAuth();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                setIsVisible(false);
            }
        };

        const handleFocusOut = () => {
            // Small delay to check if focus moved to another input
            setTimeout(() => {
                const active = document.activeElement as HTMLElement;
                if (!active || !['INPUT', 'TEXTAREA'].includes(active.tagName)) {
                    setIsVisible(true);
                }
            }, 50);
        };

        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    const navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'DASHBOARD' },
        { id: 'trips', icon: <FileText size={20} />, label: 'INVOICES' },
        // Center Space is reserved
        { id: 'notes', icon: <Plus size={24} />, label: 'NOTES' },
        { id: 'expenses', icon: <Wallet size={20} />, label: 'SPEND' },
    ];

    if (isAdmin) {
        navItems.push({ id: 'admin', icon: <ShieldCheck size={20} />, label: 'ADMIN' });
    }

    const firstHalf = navItems.slice(0, 2);
    const secondHalf = navItems.slice(2);

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-[110%]'}`}>
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
                <div className="w-16 shrink-0"></div>

                {/* Center Button (Calculator) - Absolute Positioned */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center">
                    <button
                        onClick={() => setActiveTab('taxi-fare-calculator')}
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-[4px] border-white transform transition-all duration-300 ${activeTab === 'taxi-fare-calculator' || activeTab === 'calculator' ? 'scale-110 bg-[#0047AB] text-white shadow-blue-500/30' : 'bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-600 border-slate-50'
                            }`}
                    >
                        <Calculator size={20} strokeWidth={2.5} />
                    </button>
                    <span className={`text-[9px] font-black uppercase mt-1 tracking-wider transition-colors ${activeTab === 'taxi-fare-calculator' || activeTab === 'calculator' ? 'text-[#0047AB]' : 'text-slate-400'}`}>
                        <span className="sm:hidden">CALC</span>
                        <span className="hidden sm:inline">CALCULATOR</span>
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
