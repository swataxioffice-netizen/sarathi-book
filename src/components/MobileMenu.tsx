import React, { useRef, useEffect } from 'react';
import { X, User, Crown, Users, BadgeIndianRupee, LogOut, ChevronRight, Landmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
    const { user, signOut } = useAuth();
    const { settings } = useSettings();
    const menuRef = useRef<HTMLDivElement>(null);

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

    const handleNav = (tab: string) => {
        setActiveTab(tab);
        onClose();
    };

    const handlePricing = () => {
        window.dispatchEvent(new CustomEvent('open-pricing-modal'));
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Drawer */}
            <div
                ref={menuRef}
                className={`fixed inset-y-0 left-0 w-[280px] bg-white z-[70] transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header Section */}
                <div className="bg-[#0047AB] p-6 text-white pb-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="relative z-10 flex flex-col items-center text-center mt-4">
                        <div className="w-16 h-16 rounded-full bg-white p-1 mb-3 shadow-lg">
                            {user?.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-[#0047AB]">
                                    <User size={32} />
                                </div>
                            )}
                        </div>

                        {user ? (
                            <>
                                <h3 className="font-bold text-lg leading-tight">{user.user_metadata?.full_name || 'Driver Partner'}</h3>
                                <p className="text-xs text-blue-200 mt-1 font-medium">{user.email}</p>
                            </>
                        ) : (
                            <div className="w-full">
                                <h3 className="font-bold text-lg mb-1">Welcome Guest</h3>
                                <p className="text-xs text-blue-200 mt-1 font-medium">Sign in to sync data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Menu Items */}
                <div className="p-4 -mt-6 relative z-20 space-y-2">
                    {/* Subscription / Pro Card */}
                    <button
                        onClick={handlePricing}
                        className="w-full bg-white p-4 rounded-xl shadow-md border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                <Crown size={20} className={settings.isPremium ? 'fill-amber-600' : ''} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-900">Subscription</p>
                                <p className="text-[10px] text-slate-400 font-bold">{settings.isPremium ? 'Pro Active' : 'Upgrade to Pro'}</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                    </button>

                    <div className="h-4"></div>

                    {/* Navigation Links */}
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <button
                            onClick={() => handleNav('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeTab === 'profile' ? 'bg-blue-50 text-[#0047AB]' : 'text-slate-600'}`}
                        >
                            <User size={18} />
                            <span className="text-sm font-bold">My Profile</span>
                        </button>

                        <button
                            onClick={() => handleNav('staff')}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeTab === 'staff' ? 'bg-blue-50 text-[#0047AB]' : 'text-slate-600'}`}
                        >
                            <Users size={18} />
                            <span className="text-sm font-bold">Staff Management</span>
                        </button>



                        <button
                            onClick={() => handleNav('tariff')}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${activeTab === 'tariff' ? 'bg-blue-50 text-[#0047AB]' : 'text-slate-600'}`}
                        >
                            <BadgeIndianRupee size={18} />
                            <span className="text-sm font-bold">Tariff Card</span>
                        </button>

                        <button
                            onClick={() => handleNav('finance')}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${activeTab === 'finance' ? 'bg-blue-50 text-[#0047AB]' : 'text-slate-600'}`}
                        >
                            <Landmark size={18} />
                            <span className="text-sm font-bold">Easy Loans</span>
                        </button>
                    </div>

                    {/* Logout */}
                    {user && (
                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <button
                                onClick={() => { signOut(); onClose(); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-sm"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Version Footer */}
                <div className="absolute bottom-6 w-full text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">v2.5.0 App</p>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;
