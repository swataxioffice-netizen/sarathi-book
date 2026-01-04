import React from 'react';
import { LayoutDashboard, FileText, Wallet, PlusCircle, Calculator, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    const { isAdmin } = useAuth();

    const navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'DASHBOARD' },
        { id: 'trips', icon: <FileText size={20} />, label: 'INVOICES' },
        { id: 'calculator', icon: <Calculator size={20} />, label: 'CALCULATOR' },
        { id: 'expenses', icon: <Wallet size={20} />, label: 'EXPENSES' },
        { id: 'notes', icon: <PlusCircle size={24} />, label: 'ADD NOTE' },
    ];

    if (isAdmin) {
        navItems.push({ id: 'admin', icon: <ShieldCheck size={20} />, label: 'ADMIN' });
    }

    return (
        <nav className="bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50" aria-label="Main Navigation">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    aria-label={item.label}
                    aria-current={activeTab === item.id ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center py-3 px-1 w-full h-full transition-all duration-300 relative ${activeTab === item.id ? 'text-[#0047AB] scale-105' : 'text-slate-400'
                        }`}
                >
                    <div className={`mb-1 transition-transform ${activeTab === item.id ? '-translate-y-0.5' : ''}`} aria-hidden="true">
                        {item.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tight transition-all ${activeTab === item.id ? 'opacity-100' : 'opacity-70 font-medium'
                        }`}>
                        {item.label}
                    </span>
                    {activeTab === item.id && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0047AB]" aria-hidden="true"></div>
                    )}
                </button>
            ))}
        </nav>
    );
};

export default BottomNav;
