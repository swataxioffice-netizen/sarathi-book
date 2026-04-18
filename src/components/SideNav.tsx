import React from 'react';
import {
    User, LogOut, ShieldCheck, Share2, Landmark,
    Zap, History, Palette,
    FileText, Contact, Settings, TrendingUp
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

    const isSuper = settings.plan === 'super';
    const isPro = settings.plan === 'pro' || settings.plan === 'super' || settings.isPremium;

    const handlePricing = () => window.dispatchEvent(new CustomEvent('open-pricing-modal'));

    const handleNav = (tab: string) => {
        if (tab === 'app-settings') {
            window.dispatchEvent(new CustomEvent('open-app-settings'));
            return;
        }
        if (['watermark', 'branding', 'visiting-card', 'letterhead'].includes(tab)) {
            if (!isPro && !isSuper) { handlePricing(); return; }
            if (tab === 'visiting-card') { window.dispatchEvent(new CustomEvent('open-visiting-card')); return; }
            if (tab === 'letterhead') {
                import('../utils/pdf').then(m => m.downloadLetterhead({ ...settings, vehicleNumber: '' })).catch(() => alert('Could not generate letterhead.'));
                return;
            }
            setActiveTab('profile');
            window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'branding' }));
            return;
        }
        if (tab === 'trending') {
            if (!isSuper) { handlePricing(); return; }
            setActiveTab('trending');
            return;
        }
        if (tab === 'staff') {
            setActiveTab('profile');
            window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'staff' }));
            return;
        }
        setActiveTab(tab);
    };

    const navItem = (id: string, Icon: React.ElementType, label: string, badge?: string) => (
        <button
            key={id}
            onClick={() => handleNav(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                activeTab === id ? 'bg-primary/8 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
            <Icon size={17} className={activeTab === id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'} />
            <span className="flex-1 text-sm font-semibold">{label}</span>
            {badge && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">{badge}</span>
            )}
            {activeTab === id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
        </button>
    );

    const avatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || user?.user_metadata?.avatarUrl;

    return (
        <aside className="h-full bg-white border-r border-slate-100 flex flex-col w-64">
            {/* Logo */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 bg-white rounded-xl border border-slate-100 p-1 flex items-center justify-center">
                    <img src="/logo.webp" alt="Sarathi Book" className="w-full h-full object-contain" />
                </div>
                <div>
                    <h1 className="text-base font-black text-slate-900 leading-none">Sarathi<span className="text-primary">Book</span></h1>
                    <p className={`text-[9px] font-bold mt-0.5 ${isSuper ? 'text-amber-600' : isPro ? 'text-primary' : 'text-slate-400'}`}>
                        {isSuper ? 'Super Pro' : isPro ? 'Pro Active' : 'Free Edition'}
                    </p>
                </div>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

                {/* User card — light */}
                {user && (
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                            {avatarUrl
                                ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                : <User size={16} className="text-slate-400" />
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{user.user_metadata?.full_name || 'Driver'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                {/* Upgrade — only if not Super */}
                {!isSuper && (
                    <button
                        onClick={handlePricing}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                    >
                        <Zap size={15} className="fill-white" />
                        {isPro ? 'Upgrade to Super' : 'Upgrade to Pro'}
                    </button>
                )}

                {/* Core */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">Account</p>
                    {navItem('profile', User, 'My Profile')}
                    {navItem('tariff', History, 'Tariff Cards')}
                </div>

                {/* Branding */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">Branding</p>
                    {navItem('visiting-card', Contact, 'Visiting Card', !isPro ? 'Pro' : undefined)}
                    {navItem('letterhead', FileText, 'Letterhead', !isPro ? 'Pro' : undefined)}
                    {navItem('watermark', ShieldCheck, 'Remove Watermark', !isPro ? 'Pro' : undefined)}
                    {navItem('branding', Palette, 'PDF Colour', !isPro ? 'Pro' : undefined)}
                </div>

                {/* Business */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">Business</p>
                    {navItem('trending', TrendingUp, 'Market Trends', !isSuper ? 'Super' : undefined)}
                    {navItem('finance', Landmark, 'Loan Center')}
                </div>

                {/* Help */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">Help</p>
                    {navItem('about', User, 'About Us')}
                    {navItem('contact', Contact, 'Contact Us')}
                    {navItem('privacy', ShieldCheck, 'Privacy Policy')}
                    {navItem('terms', FileText, 'Terms')}
                    {navItem('app-settings', Settings, 'App Settings')}
                </div>

                {isAdmin && (
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">System</p>
                        {navItem('admin', ShieldCheck, 'Admin Terminal')}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-slate-100 space-y-1">
                <button
                    onClick={async () => {
                        Analytics.shareApp('sidenav');
                        if (navigator.share) {
                            try { await navigator.share({ title: 'Sarathi Book', text: 'Driver Anna! Stop writing bills by hand. Use Sarathi Book app for professional invoices & fare calculation. Free app!', url: 'https://sarathibook.com' }); }
                            catch { /* cancelled */ }
                        } else { alert('Share not supported on this device/browser'); }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                >
                    <Share2 size={15} /> Share App
                </button>
                {user && (
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={15} /> Sign Out
                    </button>
                )}
            </div>
        </aside>
    );
};

export default SideNav;
