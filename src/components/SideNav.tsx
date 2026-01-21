import React from 'react';
import { LayoutDashboard, FileText, Wallet, User, LogOut, Calculator, ShieldCheck, Share2, TrendingUp, BadgeIndianRupee, Landmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/monitoring';

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
        { id: 'trending', icon: <TrendingUp size={20} />, label: 'Trending Routes' },
        { id: 'tariff', icon: <BadgeIndianRupee size={20} />, label: 'Tariff Card' },
        { id: 'finance', icon: <Landmark size={20} />, label: 'Easy Loans' },
        { id: 'profile', icon: <User size={20} />, label: 'Profile' },
    ];

    if (isAdmin) {
        navItems.push({ id: 'admin', icon: <ShieldCheck size={20} className="text-blue-600" />, label: 'Admin' });
    }

    return (
        <aside className="h-full bg-white border-r border-slate-200 flex flex-col w-64">
            <div className="p-6 border-b border-slate-100 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 flex-shrink-0 mb-2">
                    <img
                        src="/logo.png"
                        alt="Sarathi Book"
                        width="48"
                        height="48"
                        className="w-full h-full object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-xl font-black text-[#0047AB] leading-none tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                        SARATHI BOOK
                    </h1>
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
                <button
                    onClick={async () => {
                        Analytics.shareApp('sidenav');
                        if (navigator.share) {
                            try {
                                await navigator.share({
                                    title: 'Sarathi Book',
                                    text: 'Driver Anna! Stop writing bills by hand. Use Sarathi Book app for professional invoices & fare calculation. Free app!',
                                    url: 'https://sarathibook.com'
                                });
                            } catch (error) {
                                console.log('Error sharing:', error);
                            }
                        } else {
                            alert('Share not supported on this device/browser');
                        }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-[#0047AB] bg-blue-50/50 hover:bg-blue-50 hover:text-blue-700 mt-4 border border-blue-100 border-dashed"
                >
                    <Share2 size={20} />
                    <span>Share App</span>
                </button>
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
