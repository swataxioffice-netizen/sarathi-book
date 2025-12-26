import React from 'react';
import { LayoutDashboard, FileText, Wallet, User, LogOut, Calculator, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SideNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const SideNav: React.FC<SideNavProps> = ({ activeTab, setActiveTab }) => {
    const { user, signOut, signInWithGoogle, isAdmin } = useAuth();

    const navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { id: 'trips', icon: <FileText size={20} />, label: 'Invoices' },
        { id: 'expenses', icon: <Wallet size={20} />, label: 'Expenses' },
        { id: 'calculator', icon: <Calculator size={20} />, label: 'Calculator' },
        { id: 'profile', icon: <User size={20} />, label: 'Profile' },
    ];

    if (isAdmin) {
        navItems.push({ id: 'admin', icon: <ShieldCheck size={20} className="text-blue-600" />, label: 'Admin' });
    }

    return (
        <aside className="h-full bg-white border-r border-slate-200 flex flex-col w-64">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="Sarathi Book"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-[#0047AB] leading-none tracking-tight mb-0.5" style={{ fontFamily: 'Korkai', letterSpacing: '-0.02em' }}>
                            SARATHI BOOK
                        </h1>
                        <p className="text-[10px] font-semibold text-slate-500 leading-none tracking-wide" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                            Your digital office on car
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === item.id
                            ? 'bg-blue-50 text-[#0047AB] shadow-sm ring-1 ring-blue-100'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {activeTab === item.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
                {user ? (
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                ) : (
                    <button
                        onClick={() => signInWithGoogle()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#0047AB] bg-blue-50 hover:bg-blue-100 transition-all font-bold text-sm"
                    >
                        <User size={20} />
                        <span>Sign In</span>
                    </button>
                )}
                <div className="mt-4 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">v2.4.0 Stable</p>
                </div>
            </div>
        </aside>
    );
};

export default SideNav;
