import React from 'react';
import { LayoutDashboard, FileText, Wallet, ShieldCheck, User } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'DASHBOARD' },
        { id: 'trips', icon: <FileText size={20} />, label: 'INVOICES' },
        { id: 'expenses', icon: <Wallet size={20} />, label: 'EXPENSES' },
        { id: 'docs', icon: <ShieldCheck size={20} />, label: 'DOCUMENTS' },
        { id: 'profile', icon: <User size={20} />, label: 'PROFILE' },
    ];

    return (
        <nav className="bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 w-16 transition-all relative ${activeTab === item.id ? 'text-[#0047AB]' : 'text-slate-400'
                        }`}
                >
                    <div className="mb-1">
                        {item.icon}
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-tight transition-all ${activeTab === item.id ? 'opacity-100' : 'opacity-60'
                        }`}>
                        {item.label}
                    </span>
                    {activeTab === item.id && (
                        <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#0047AB]"></div>
                    )}
                </button>
            ))}
        </nav>
    );
};

export default BottomNav;
