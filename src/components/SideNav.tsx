import React from 'react';
import {
    LayoutDashboard, FileText, Wallet, User, LogOut, Calculator,
    ShieldCheck, Share2, Landmark,
    Crown, Zap, ChevronRight, History, StickyNote, Users, Palette, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Analytics } from '../utils/monitoring';

interface SideNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const SideNav: React.FC<SideNavProps> = ({ activeTab, setActiveTab }) => {
    const { user, signOut, isAdmin } = useAuth();
    const { settings } = useSettings();

    const isPro = settings.plan === 'pro' || settings.isPremium;
    const isSuper = settings.plan === 'super';

    const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});

    const toggleSection = (title: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handlePricing = () => {
        window.dispatchEvent(new CustomEvent('open-pricing-modal'));
    };

    const handleNav = (tab: string) => {
        if (tab === 'watermark' || tab === 'branding') {
            if (!isPro && !isSuper) {
                handlePricing();
                return;
            }
            setActiveTab('profile');
            // Trigger Branding tab in Profile
            window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'branding' }));
            return;
        }
        if (tab === 'staff') {
            setActiveTab('profile');
            // Trigger Staff tab in Profile
            window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'staff' }));
            return;
        }
        setActiveTab(tab);
    };

    const navSections = [
        {
            title: 'Account & Overview',
            items: [
                { id: 'profile', icon: User, label: 'Profile' },
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            ]
        },
        {
            title: 'Trip Tools',
            items: [
                { id: 'tariff', icon: History, label: 'Tariff Cards' },
                { id: 'notes', icon: StickyNote, label: 'Quick Notes' },
                { id: 'taxi-fare-calculator', icon: Calculator, label: 'Calculator' },
            ]
        },
        {
            title: 'Business Management',
            items: [
                 { id: 'trips', icon: FileText, label: 'Invoices' },
                 { id: 'expenses', icon: Wallet, label: 'Expenses' },
                 { id: 'staff', icon: Users, label: 'Staff Manager', isPro: true },
                 { id: 'finance', icon: Landmark, label: 'Loan Center' },
            ]
        },
        {
             title: 'App Customization',
             items: [
                { id: 'watermark', icon: ShieldCheck, label: 'Remove Watermark', isPro: true },
                { id: 'branding', icon: Palette, label: 'Custom Branding', isPro: true },
             ]
        }
    ];

    if (isAdmin) {
        navSections.push({
            title: 'System',
            items: [{ id: 'admin', icon: ShieldCheck, label: 'Admin Terminal' }]
        });
    }

    return (
        <aside className="h-full bg-white border-r border-slate-200 flex flex-col w-72 transition-all duration-300">
            {/* Logo Section */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm border border-slate-100 p-1.5 flex items-center justify-center relative overflow-hidden">
                        <img
                            src="/logo.png"
                            alt="Sarathi Book"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-[#0047AB] leading-none tracking-tight uppercase">
                            SARATHI BOOK
                        </h1>
                        <div className={`mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${isSuper ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                            isPro ? 'bg-blue-600/10 border-blue-600/20 text-[#0047AB]' :
                                'bg-slate-100 border-slate-200 text-slate-400'
                            }`}>
                            {isSuper ? 'Super Pro' : isPro ? 'Pro Active' : 'Free Edition'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-1">
                {/* Subscription Callout - More subtle */}
                {user ? (
                    <div className="w-full mb-6 p-4 bg-slate-900 rounded-2xl text-white relative overflow-hidden shadow-lg shadow-slate-200">
                         {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <div className="relative z-10">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden bg-slate-800 shrink-0">
                                    {user.user_metadata?.picture || user.user_metadata?.avatar_url || user.user_metadata?.avatarUrl ? (
                                        <img 
                                            src={user.user_metadata?.picture || user.user_metadata?.avatar_url || user.user_metadata?.avatarUrl} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Welcome</p>
                                    <p className="text-xs font-bold truncate text-white" title={user.email}>{user.email}</p>
                                </div>
                             </div>

                            {!isSuper && (
                                <button
                                    onClick={handlePricing}
                                    className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Zap size={14} className="text-amber-500" />
                                    {isPro ? 'Upgrade to Super' : 'Upgrade to Pro'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    !isSuper && (
                        <button
                            onClick={handlePricing}
                            className={`w-full mb-6 p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${isPro ? 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200' :
                                'bg-[#0047AB] border-[#0047AB] text-white shadow-lg shadow-blue-500/10 active:scale-[0.98]'
                                }`}
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`p-1.5 rounded-lg ${isPro ? 'bg-white text-[#0047AB] shadow-sm' : 'bg-white/20 text-white'}`}>
                                    {isPro ? <Crown size={14} /> : <Zap size={14} />}
                                </div>
                                <div className="text-left">
                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isPro ? 'text-slate-400' : 'text-blue-100'}`}>
                                        {isPro ? 'Unlock Master' : 'Go Premium'}
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-tight">
                                        {isPro ? 'Get Super Pro' : 'Upgrade to Pro'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={12} className={isPro ? 'text-slate-300' : 'text-white/40'} />
                        </button>
                    )
                )}

                <div className="space-y-6">
                    {navSections.map((section, index) => {
                        const isCollapsed = collapsedSections[section.title];
                        
                        return (
                            <div key={index}>
                                <button 
                                    onClick={() => toggleSection(section.title)}
                                    className="w-full flex items-center justify-between px-4 mb-2 group cursor-pointer hover:bg-slate-50 py-1 rounded-lg transition-colors"
                                >
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                                        {section.title}
                                    </h4>
                                    <ChevronDown 
                                        size={14} 
                                        className={`text-slate-300 group-hover:text-slate-500 transition-all duration-200 ${isCollapsed ? '-rotate-90' : ''}`} 
                                    />
                                </button>
                                
                                <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                                    {section.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNav(item.id)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                                ? 'bg-blue-50 text-[#0047AB]'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon size={18} className={`transition-colors ${activeTab === item.id ? 'text-[#0047AB]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black uppercase tracking-tight">{item.label}</span>
                                                    {item.isPro && !isPro && !isSuper && (
                                                        <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Pro</span>
                                                    )}
                                                </div>
                                            </div>
                                            {activeTab === item.id && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#0047AB] shadow-sm" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-100 space-y-2">
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
                    className="w-full h-10 flex items-center gap-3 px-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest text-[#0047AB] bg-blue-50/50 hover:bg-blue-50 border border-blue-100 border-dashed"
                >
                    <Share2 size={16} />
                    <span>Share App</span>
                </button>

                {user && (
                    <button
                        onClick={() => signOut()}
                        className="w-full h-10 flex items-center gap-3 px-4 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                )}

                <div className="pt-2 text-center border-t border-slate-50 mt-2">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">v2.5.0 Gold Edition</p>
                </div>
            </div>
        </aside>
    );
};

export default SideNav;
