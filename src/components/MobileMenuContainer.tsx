import React, { useEffect } from 'react';
import { 
    X, User, History, StickyNote, LayoutDashboard, FileText, 
    Wallet, Calculator, Users, ShieldCheck, Palette, 
    Landmark, Share2, LogOut, Zap, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Analytics } from '../utils/monitoring';
import GoogleSignInButton from './GoogleSignInButton';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const MobileMenuContainer: React.FC<MobileMenuProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
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
            window.history.pushState(null, '', '#pro-studio');
            window.dispatchEvent(new CustomEvent('open-pro-studio'));
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col animate-slide-right overflow-hidden">
                
                {/* BLUE HERO HEADER */}
                <div className="bg-[#0047AB] p-4 text-center relative shrink-0">
                    <button 
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex flex-col items-center pt-2 pb-2 relative z-10">
                        {user ? (
                            <>
                                <div className="w-14 h-14 bg-white rounded-xl shadow-lg border-2 border-white/20 mb-3 overflow-hidden p-0.5">
                                    {user.user_metadata?.picture || user.user_metadata?.avatar_url ? (
                                        <img 
                                            src={user.user_metadata?.picture || user.user_metadata?.avatar_url} 
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
                                <p className="text-xs font-medium text-blue-200 mb-4">
                                    Sign in to sync your data
                                </p>
                                <div className="w-full relative z-50 pointer-events-auto">
                                    <GoogleSignInButton 
                                        text="Secure Login" 
                                        className="py-3! text-xs! bg-[#0047AB]! text-white! border-white/30! hover:bg-blue-700! shadow-xl" 
                                    />
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
