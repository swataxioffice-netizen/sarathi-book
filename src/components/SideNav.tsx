import React from 'react';
import { LayoutDashboard, FileText, Wallet, User, LogOut, Calculator } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SideNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const SideNav: React.FC<SideNavProps> = ({ activeTab, setActiveTab }) => {
    const { user, signOut, signInWithGoogle } = useAuth();

    const navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { id: 'trips', icon: <FileText size={20} />, label: 'Invoices' },
        { id: 'expenses', icon: <Wallet size={20} />, label: 'Expenses' },
        { id: 'calculator', icon: <Calculator size={20} />, label: 'Calculator' },
        { id: 'profile', icon: <User size={20} />, label: 'Profile' },
    ];

    return (
        <aside className="h-full bg-white border-r border-slate-200 flex flex-col w-64">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0047AB] rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                        <BriefcaseIcon />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 leading-none tracking-tight">
                            SARATHI
                        </h1>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">PRO MANAGER</span>
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

function BriefcaseIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    );
}

export default SideNav;
