import React, { useState } from 'react';
import { X, Check, Star, Zap, Crown, ShieldCheck, Sparkles, Minus } from 'lucide-react';
import { initializePayment } from '../utils/payment';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings, saveSettings } = useSettings();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    if (!isOpen) return null;

    const tiers = [
        {
            id: 'free',
            name: 'Free Forever',
            price: { monthly: 0, yearly: 0 },
            description: 'Basic tools for manual drivers',
            icon: <Zap size={24} className="text-slate-400" />,
            features: ['Single Vehicle', 'Ad-supported', 'Standard Invoices', '10 Invoices / Month'],
            buttonText: 'Current Plan',
            popular: false
        },
        {
            id: 'pro',
            name: 'Pro',
            price: { monthly: 49, yearly: 499 },
            description: 'Powerful automated fleet management',
            icon: <Star size={24} className="text-blue-600" />,
            features: ['Unlimited Vehicles', 'No Ads (Instant)', 'Remove App Watermark', 'Custom Business Logo', 'Staff Management'],
            buttonText: 'Upgrade to Pro',
            popular: true
        },
        {
            id: 'super-pro',
            name: 'Super Pro',
            price: { monthly: 99, yearly: 999 },
            description: 'The ultimate business command center',
            icon: <Crown size={24} className="text-amber-500" />,
            features: ['Everything in Pro', 'Custom App Colors', 'Multi-Language Support', 'Advanced Analytics', 'Priority 24/7 Support'],
            buttonText: 'Get Super Pro',
            popular: false
        }
    ];

    const comparisonFeatures = [
        { name: 'Vehicle Management', free: '1 Vehicle', pro: 'Unlimited', super: 'Unlimited' },
        { name: 'Invoices / Month', free: '10', pro: 'Unlimited', super: 'Unlimited' },
        { name: 'Ad-free Experience', free: false, pro: true, super: true },
        { name: 'Remove App Watermark', free: false, pro: true, super: true },
        { name: 'Custom Business Logo', free: false, pro: true, super: true },
        { name: 'Staff & Salary Management', free: false, pro: true, super: true },
        { name: 'Custom App Theme', free: false, pro: false, super: true },
        { name: 'Multi-Language Expert', free: false, pro: false, super: true },
        { name: 'Analytics Dashboard', free: false, pro: false, super: true },
        { name: 'Support Level', free: 'Standard', pro: 'Priority', super: '24/7 Dedicated' },
    ];

    const handleUpgrade = async (tier: typeof tiers[0]) => {
        if (tier.id === 'free') return;
        if (!user) {
            alert('Please sign in to upgrade');
            return;
        }

        setLoading(true);
        const price = billingCycle === 'monthly' ? tier.price.monthly : tier.price.yearly;

        try {
            await initializePayment({
                amount: price * 100, // paise
                description: `${tier.name} (${billingCycle}) Subscription`,
                prefill: {
                    name: settings.companyName || user.user_metadata?.full_name || '',
                    email: user.email || '',
                    contact: settings.driverPhone || ''
                },
                handler: async (response: any) => {
                    console.log('Payment Success:', response);
                    updateSettings({
                        isPremium: true,
                        plan: tier.id === 'super-pro' ? 'super' : 'pro'
                    });
                    await saveSettings();
                    alert(`Congratulations! You are now a ${tier.name} member.`);
                    onClose();
                }
            });
        } catch (error) {
            console.error('Payment initialization failed:', error);
            alert('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">
            <div className="bg-white w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] rounded-3xl md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-scale-in relative border border-white/20">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 md:top-6 md:right-6 z-20 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm text-slate-500 rounded-full hover:bg-slate-200 transition-all shadow-sm"
                >
                    <X size={18} />
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-5 md:p-12">

                        {/* Header */}
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-2xl md:text-5xl font-black text-slate-900 leading-tight mb-3 md:mb-4">
                                Choose Your <span className="text-blue-600">Success Plan</span>
                            </h2>
                            <p className="text-slate-500 font-bold mb-6 md:mb-8 max-w-md mx-auto text-[11px] md:text-sm leading-relaxed">
                                Transparent pricing for businesses of all sizes. Professionalize your cab business today.
                            </p>

                            {/* Billing Switch */}
                            <div className="inline-flex items-center p-1.5 bg-slate-100 rounded-2xl mb-6 md:mb-8">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}
                                >
                                    Yearly <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg text-[9px] md:text-[10px]">Save ~15%</span>
                                </button>
                            </div>
                        </div>

                        {/* Plans Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
                            {tiers.map((tier) => (
                                <div
                                    key={tier.id}
                                    className={`relative bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 border-2 transition-all duration-300 flex flex-col ${tier.popular
                                        ? 'border-blue-600 shadow-xl shadow-blue-500/10 z-10'
                                        : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    {tier.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <Sparkles size={10} /> Most Popular
                                        </div>
                                    )}

                                    <div className="mb-6 md:mb-8">
                                        <div className="mb-4">{tier.icon}</div>
                                        <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wider mb-2">{tier.name}</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl md:text-4xl font-black text-slate-900">₹{billingCycle === 'monthly' ? tier.price.monthly : tier.price.yearly}</span>
                                            <span className="text-slate-400 font-bold text-xs md:text-sm">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                        </div>
                                        <p className="mt-3 md:mt-4 text-[10px] md:text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-wider">{tier.description}</p>
                                    </div>

                                    <div className="space-y-3 mb-8 md:mb-10 flex-1">
                                        {tier.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tier.id === 'super-pro' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-600">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleUpgrade(tier)}
                                        disabled={loading || (settings.plan === tier.id || (tier.id === 'pro' && (settings.plan === 'super' || settings.isPremium)) || (tier.id === 'free' && (settings.plan !== 'free' || settings.isPremium)))}
                                        className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${(settings.plan === tier.id || (tier.id === 'pro' && (settings.plan === 'super' || settings.isPremium)) || (tier.id === 'free' && (settings.plan !== 'free' || settings.isPremium)))
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : tier.popular
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95'
                                                : tier.id === 'super-pro'
                                                    ? 'bg-slate-900 text-white hover:bg-black active:scale-95 border-2 border-amber-500/20'
                                                    : 'bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-50 active:scale-95'
                                            }`}
                                    >
                                        {loading ? 'Processing...' :
                                            (settings.plan === tier.id || (tier.id === 'pro' && (settings.plan === 'super' || settings.isPremium)) || (tier.id === 'free' && (settings.plan !== 'free' || settings.isPremium)))
                                                ? 'Current Plan' : tier.buttonText}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Feature Comparison Table */}
                        <div className="hidden md:block">
                            <div className="text-center mb-10">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Deep Comparison</h3>
                                <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-wider underline decoration-blue-500/30">See why Super Pro is our best value</p>
                            </div>

                            <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Features</th>
                                            <th className="p-6 text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 decoration-slate-300">Free</th>
                                            <th className="p-6 text-xs font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 bg-blue-50/10">Pro</th>
                                            <th className="p-6 text-xs font-black text-amber-600 uppercase tracking-[0.2em] border-b border-slate-100">Super Pro</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {comparisonFeatures.map((f, i) => (
                                            <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="p-6 text-sm font-black text-slate-700 tracking-tight">{f.name}</td>
                                                <td className="p-6 text-xs font-bold text-slate-500">
                                                    {typeof f.free === 'boolean' ? (f.free ? <Check size={16} className="text-emerald-500" /> : <Minus size={16} className="text-slate-200" />) : f.free}
                                                </td>
                                                <td className="p-6 text-xs font-bold text-slate-700 bg-blue-50/5">
                                                    {typeof f.pro === 'boolean' ? (f.pro ? <Check size={16} className="text-blue-500" /> : <Minus size={16} className="text-slate-200" />) : f.pro}
                                                </td>
                                                <td className="p-6 text-xs font-bold text-slate-900">
                                                    {typeof f.super === 'boolean' ? (f.super ? <Check size={16} className="text-amber-500" /> : <Minus size={16} className="text-slate-200" />) : f.super}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bottom Trust Note */}
                <div className="bg-slate-50 p-4 md:p-6 border-t border-slate-100">
                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-6 max-w-4xl mx-auto">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-emerald-500" size={16} />
                            <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">100% Secure via Razorpay</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="text-blue-500" size={16} />
                            <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Instant Activation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="text-amber-500" size={16} />
                            <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Cancel Anytime</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
