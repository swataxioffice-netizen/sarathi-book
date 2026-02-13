import { useRef, useEffect } from 'react';
import {
    X, User, Crown, Users, LogOut, ChevronRight, Landmark,
    LayoutDashboard, FileText, Wallet, Calculator, StickyNote, ShieldCheck,
    Info, PhoneCall, ShieldAlert, History, Star, Zap, Palette, Paintbrush
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import GoogleSignInButton from './GoogleSignInButton';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const MenuItem = ({ id, icon: Icon, label, description, isPro: proFeature, isSuper: superFeature, onClick, className, activeTab, handleNav, userIsPro, userIsSuper }: any) => (
    <button
        onClick={onClick || (() => handleNav(id))}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group ${activeTab === id ? 'bg-blue-50 text-[#0047AB]' : 'text-slate-600 hover:bg-slate-50'} ${className || ''}`}
    >
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg transition-colors ${activeTab === id ? 'bg-white shadow-sm text-[#0047AB]' : 'bg-slate-100/50 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}`}>
                <Icon size={16} />
            </div>
            <div className="text-left">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
                    {proFeature && !userIsPro && !userIsSuper && (
                        <span className="bg-blue-100 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Pro</span>
                    )}
                    {superFeature && !userIsSuper && (
                        <span className="bg-amber-100 text-amber-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Super</span>
                    )}
                </div>
                {description && <p className="text-[9px] font-bold text-slate-400 mt-0.5 leading-none">{description}</p>}
            </div>
        </div>
        <ChevronRight size={14} className={`transition-transform duration-200 ${activeTab === id ? 'text-[#0047AB] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
    </button>
);

const SectionHeader = ({ label }: { label: string }) => (
    <p className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 mt-3">{label}</p>
);

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
    const { user, signOut, isAdmin } = useAuth();
    const { settings } = useSettings();
    const menuRef = useRef<HTMLDivElement>(null);

    const isPro = settings.plan === 'pro' || settings.isPremium;
    const isSuper = settings.plan === 'super';

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handlePricing = () => {
        window.dispatchEvent(new CustomEvent('open-pricing-modal'));
        onClose();
    };

    const handleNav = (tab: string) => {
        if (tab === 'watermark' || tab === 'branding' || tab === 'colors') {
            const isSuperFeature = tab === 'colors';
            const hasAccess = isSuperFeature ? isSuper : (isPro || isSuper);

            if (!hasAccess) {
                handlePricing();
                return;
            }

            // All these features are managed in the Profile/Settings area
            setActiveTab('profile');
            onClose();
            return;
        }

        setActiveTab(tab);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Drawer */}
            <div
                ref={menuRef}
                className={`fixed inset-y-0 left-0 w-[300px] bg-white z-[70] transform transition-transform duration-300 shadow-2xl overflow-y-auto custom-scrollbar ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header Section */}
                <div className="bg-[#0047AB] p-5 text-white pt-8 pb-8 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="relative mb-3">
                            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-2xl rotate-3 scale-105">
                                {user?.user_metadata?.avatar_url ? (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full rounded-[22px] object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-[22px] bg-blue-50 flex items-center justify-center text-[#0047AB]">
                                        <User size={32} />
                                    </div>
                                )}
                            </div>
                            {(isPro || isSuper) && (
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${isSuper ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                    {isSuper ? <Crown size={12} className="text-white fill-current" /> : <Star size={12} className="text-white fill-current" />}
                                </div>
                            )}
                        </div>

                        {user ? (
                            <>
                                <h3 className="font-bold text-lg leading-tight uppercase tracking-tight">{user.user_metadata?.full_name || 'Driver Partner'}</h3>
                                <div className="flex flex-col items-center gap-2 mt-1">
                                    <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wide opacity-80">{user.email}</p>
                                    <button
                                        onClick={handlePricing}
                                        className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-wide border flex items-center gap-2 transition-all active:scale-95 ${isSuper ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' :
                                            isPro ? 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/20' :
                                                'bg-white text-[#0047AB] border-white shadow-lg'
                                            }`}
                                    >
                                        {isSuper ? <Crown size={10} /> : <Zap size={10} />}
                                        <span>{isSuper ? 'Super Pro Active' : isPro ? 'Pro Member' : 'Upgrade to Pro'}</span>
                                        {!isSuper && <ChevronRight size={10} />}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="w-full">
                                <h3 className="font-bold text-lg mb-1 uppercase tracking-tight">Welcome Guest</h3>
                                <p className="text-[10px] text-blue-200 mt-1 font-bold uppercase tracking-wide mb-4 opacity-80">Sign in to sync your data</p>
                                <GoogleSignInButton
                                    text="Secure Login"
                                    className="!w-full !py-2.5 !px-4 !text-[11px] !bg-white/10 !text-white !border-white/20 hover:!bg-white/20 !shadow-none !rounded-xl !font-bold !uppercase !tracking-wide"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-3 relative z-20 space-y-0.5 pb-8">
                    {/* Navigation Items grouped */}

                    {/* Navigation Items grouped */}
                    <MenuItem id="profile" icon={User} label="My Profile" description="Company details & bank info" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="tariff" icon={History} label="Tariff Cards" description="Preset rate lists for customers" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="notes" icon={StickyNote} label="Quick Notes" description="Important trip & customer notes" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />


                    <SectionHeader label="Main Actions" />
                    <MenuItem id="dashboard" icon={LayoutDashboard} label="Dashboard" description="Earnings & performance overview" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="trips" icon={FileText} label="Invoices & Quotes" description="Create & manage documents" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="expenses" icon={Wallet} label="Expense Tracker" description="Track fuel, repairs & maintenance" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="taxi-fare-calculator" icon={Calculator} label="Fare Calculator" description="Smart distance-based pricing" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />

                    <SectionHeader label="Pro Features" />
                    <MenuItem id="watermark" icon={ShieldCheck} label="Remove Watermark" description="Clean professional invoices" isPro activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="branding" icon={Palette} label="Custom Branding" description="Add your business logo to PDF" isPro activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="staff" icon={Users} label="Staff Manager" description="Driver salaries & management" isPro activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="colors" icon={Paintbrush} label="App Theme Colors" description="Personalize your workspace" isSuper activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />

                    <SectionHeader label="Business Tools" />
                    <MenuItem id="finance" icon={Landmark} label="Loan Center" description="Business growth capital options" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />

                    <SectionHeader label="Support & Info" />
                    <MenuItem id="about" icon={Info} label="About Sarathi" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="contact" icon={PhoneCall} label="Support Center" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                    <MenuItem id="privacy" icon={ShieldAlert} label="Privacy Policy" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />

                    {isAdmin && (
                        <>
                            <SectionHeader label="Administration" />
                            <MenuItem id="admin" icon={ShieldCheck} label="Admin Terminal" description="System configuration & logs" activeTab={activeTab} handleNav={handleNav} userIsPro={isPro} userIsSuper={isSuper} />
                        </>
                    )}

                    {/* Sign Out */}
                    {user && (
                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <button
                                onClick={() => { signOut(); onClose(); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 font-bold uppercase tracking-wide text-[10px]"
                            >
                                <div className="p-1.5 bg-red-50 rounded-lg">
                                    <LogOut size={16} />
                                </div>
                                <span>Logout Session</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Version Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">Sarathi Book</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Version 2.5.0 Gold</p>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Global Server</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;
