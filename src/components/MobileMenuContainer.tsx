import React, { useEffect } from 'react';
import { 
    X, User, History, StickyNote, LayoutDashboard, FileText, 
    Wallet, Calculator, Users, ShieldCheck, Palette, 
    Landmark, Share2, LogOut, Zap, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Analytics } from '../utils/monitoring';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const MobileMenuContainer: React.FC<MobileMenuProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
    const { user, signOut, isAdmin, signInWithGoogle } = useAuth();
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

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handlePricing = () => {
        onClose();
        window.dispatchEvent(new CustomEvent('open-pricing-modal'));
    };

    const navSections = [
        {
            title: 'Account & Overview',
            items: [
                { id: 'profile', icon: User, label: 'My Profile', subtitle: 'Company details & bank info' },
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', subtitle: 'Earnings & performance overview' },
            ]
        },
        {
            title: 'Trip Tools',
            items: [
                { id: 'tariff', icon: History, label: 'Tariff Cards', subtitle: 'Preset rate lists for customers' },
                { id: 'notes', icon: StickyNote, label: 'Quick Notes', subtitle: 'Important trip & customer notes' },
                { id: 'taxi-fare-calculator', icon: Calculator, label: 'Fare Calculator', subtitle: 'Smart distance-based pricing' },
            ]
        },
        {
            title: 'Business Management',
            items: [
                 { id: 'trips', icon: FileText, label: 'Invoices & Quotes', subtitle: 'Create & manage documents' },
                 { id: 'expenses', icon: Wallet, label: 'Expense Tracker', subtitle: 'Track fuel, repairs & maintenance' },
                 { id: 'staff', icon: Users, label: 'Staff Manager', subtitle: 'Driver salaries & management', isPro: true },
                 { id: 'finance', icon: Landmark, label: 'Loan Center', subtitle: 'Get loans for your business' },
            ]
        },
        {
             title: 'App Customization',
             items: [
                { id: 'watermark', icon: ShieldCheck, label: 'Remove Watermark', subtitle: 'Clean professional invoices', isPro: true },
                { id: 'branding', icon: Palette, label: 'Custom Branding', subtitle: 'Add your business logo to PDF', isPro: true },
             ]
        }
    ];

    if (isAdmin) {
        navSections.push({
            title: 'System',
            items: [{ id: 'admin', icon: ShieldCheck, label: 'Admin Terminal', subtitle: 'System control panel' }]
        });
    }

    const handleNav = (tab: string) => {
        if (tab === 'watermark' || tab === 'branding') {
            if (!isPro && !isSuper) {
                handlePricing();
                return;
            }
            setActiveTab('profile');
            // Trigger Branding tab in Profile
            window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'branding' }));
        } else if (tab === 'staff') {
            setActiveTab('profile');
            // Trigger Staff tab in Profile
            window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'staff' }));
        } else {
            setActiveTab(tab);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 transition-opacity duration-300 z-10"
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div 
                className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col animate-slide-right overflow-hidden z-20"
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* BLUE HERO HEADER */}
                <div className="bg-[#0047AB] p-4 text-center relative shrink-0">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute top-4 right-4 p-2.5 bg-white/20 text-white hover:bg-white/30 active:bg-white/40 rounded-full transition-all z-60 flex items-center justify-center cursor-pointer shadow-lg"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center pt-2 pb-2 relative z-50">
                        {user ? (
                            <>
                                <div className="w-14 h-14 bg-white rounded-xl shadow-lg border-2 border-white/20 mb-3 overflow-hidden p-0.5">
                                    {user.user_metadata?.picture || user.user_metadata?.avatar_url || user.user_metadata?.avatarUrl ? (
                                        <img 
                                            src={user.user_metadata?.picture || user.user_metadata?.avatar_url || user.user_metadata?.avatarUrl} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover rounded-lg"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 rounded-lg">
                                            <User size={24} />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-sm font-bold text-white tracking-tight mb-0.5">
                                    {user.user_metadata?.full_name || 'Welcome Driver'}
                                </h2>
                                <p className="text-xs font-medium text-blue-200 mb-3 truncate w-full max-w-[200px]">
                                    {user.email}
                                </p>
                                
                                {!isSuper && (
                                    <button
                                        onClick={handlePricing}
                                        className="w-full py-3 bg-white text-[#0047AB] rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Zap size={14} className="fill-current" />
                                        {isPro ? 'Upgrade to Super' : 'Upgrade to Pro'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-white rounded-xl shadow-lg border-2 border-white/20 mb-3 flex items-center justify-center text-[#0047AB]">
                                    <User size={24} />
                                </div>
                                <h2 className="text-sm font-bold text-white tracking-tight mb-1">
                                    Welcome Guest
                                </h2>
                                <p className="text-[9px] font-bold text-blue-200 mb-4 uppercase tracking-wider leading-relaxed px-4">
                                    Generate Invoices, Quotations & Pay Slips. Track Attendance & Salaries instantly.
                                </p>
                                <div className="w-full relative z-100 px-4" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Mobile menu: Sign in clicked');
                                            try {
                                               await signInWithGoogle();
                                            } catch (err: any) {
                                               alert('Login failed: ' + err.message);
                                            }
                                        }}
                                        className="group relative flex items-center justify-center gap-3 w-full py-3 px-6 bg-white text-[#0047AB] border border-white shadow-xl rounded-2xl cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all duration-300 z-50 pointer-events-auto"
                                    >
                                        <svg className="w-5 h-5 shrink-0 relative z-10" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                        </svg>
                                        <span className="text-xs font-bold uppercase tracking-wide relative z-10">Secure Login</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none"></div>
                </div>

                {/* Nav Items */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
                    
                    {/* Main Actions Group */}
                    <div className="space-y-6">
                        {navSections.map((section, index) => {
                            const isCollapsed = collapsedSections[section.title];
                            
                            return (
                                <div key={index}>
                                    <button 
                                        onClick={() => toggleSection(section.title)}
                                        className="w-full flex items-center justify-between px-2 mb-2 group"
                                    >
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">
                                            {section.title}
                                        </h4>
                                        <ChevronDown 
                                            size={16} 
                                            className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                                        />
                                    </button>
                                    
                                    <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                                        {section.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNav(item.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                                                    activeTab === item.id ? 'bg-blue-50 text-[#0047AB]' : 'hover:bg-slate-50 text-slate-500'
                                                }`}
                                            >
                                                <item.icon size={18} className={`transition-colors ${
                                                    activeTab === item.id ? 'text-[#0047AB]' : 'text-slate-400 group-hover:text-slate-600'
                                                }`} />
                                                
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-semibold tracking-tight ${
                                                            activeTab === item.id ? 'text-[#0047AB]' : 'text-slate-700'
                                                        }`}>
                                                            {item.label}
                                                        </span>
                                                        {item.isPro && !isPro && !isSuper && (
                                                            <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded">Pro</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate mt-0.5">
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                                {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-[#0047AB] shadow-sm ml-2" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                    <button
                        onClick={async () => {
                            Analytics.shareApp('mobile_menu');
                            if (navigator.share) {
                                try {
                                    await navigator.share({
                                        title: 'Sarathi Book',
                                        text: 'Driver Anna! Stop writing bills by hand. Use Sarathi Book app for professional invoices & fare calculation. Free app!',
                                        url: 'https://sarathibook.com'
                                    });
                                } catch (error) { console.log('Error sharing:', error); }
                            } else { alert('Share not supported'); }
                        }}
                        className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-xl font-bold text-sm text-[#0047AB] bg-blue-100/50 hover:bg-blue-100 border border-blue-200 border-dashed transition-all"
                    >
                        <Share2 size={16} />
                        <span>Share App With Friends</span>
                    </button>

                    {user && (
                        <button
                            onClick={() => {
                                onClose();
                                signOut();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-red-600 font-bold text-sm transition-colors"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    )}
                    
                    <div className="text-center pt-1">
                         <p className="text-[10px] font-medium text-slate-300">v2.5.0 Gold Edition</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileMenuContainer;
