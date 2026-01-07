import React, { useState } from 'react';
import { X, Check, Star, Zap, Crown, ShieldCheck, Sparkles } from 'lucide-react';
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

    if (!isOpen) return null;

    const plans = [
        {
            id: 'monthly',
            name: 'Pro Monthly',
            price: 199,
            savings: null,
            features: [
                'Unlimited Vehicles (Fleet Mode)',
                'Remove Sarathi Watermark',
                'Custom Business Logo',
                'Custom Brand Colors',
                'Financial Reports',
                'Premium Support'
            ]
        },
        {
            id: 'yearly',
            name: 'Pro Yearly',
            price: 999,
            originalPrice: 1999,
            savings: '50% OFF',
            popular: true,
            features: [
                'Everything in Monthly',
                'Priority Cloud Sync',
                'Advanced Fleet Analytics',
                'Expense Tracking',
                'Client Database',
                'Beta Feature Access'
            ]
        }
    ];

    const handleUpgrade = async (plan: typeof plans[0]) => {
        if (!user) {
            alert('Please sign in to upgrade');
            return;
        }

        setLoading(true);
        try {
            await initializePayment({
                amount: plan.price * 100, // paise
                description: `${plan.name} Subscription`,
                prefill: {
                    name: settings.companyName || user.user_metadata?.full_name || '',
                    email: user.email || '',
                    contact: settings.driverPhone || ''
                },
                handler: async (response: any) => {
                    console.log('Payment Success:', response);

                    // In a real app, you'd verify payment on backend
                    // For now, we update local/supabase state directly
                    updateSettings({ isPremium: true });
                    await saveSettings();

                    alert('Congratulations! You are now a Pro member.');
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-scale-in relative border border-white/20">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-md text-slate-500 rounded-full hover:bg-white transition-all shadow-sm"
                >
                    <X size={20} />
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-8 md:p-12">

                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                <Crown size={12} className="fill-current" /> Upgrade to Pro
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                                Professionalize Your <br /> <span className="text-blue-600">Cab Business</span>
                            </h2>
                            <p className="text-slate-500 font-bold mt-4 max-w-md mx-auto text-sm leading-relaxed">
                                Join 500+ professionals using Sarathi Book Pro to automate their growth and impress clients.
                            </p>
                        </div>

                        {/* Plans Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white rounded-[32px] p-8 border-2 transition-all duration-300 flex flex-col ${plan.popular
                                        ? 'border-blue-600 shadow-xl shadow-blue-500/10 scale-105 z-10'
                                        : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <Sparkles size={10} /> Most Popular
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">{plan.name}</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
                                            <span className="text-slate-400 font-bold text-sm">/ {plan.id === 'yearly' ? 'year' : 'month'}</span>
                                        </div>
                                        {plan.originalPrice && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-slate-400 font-bold text-xs line-through">₹{plan.originalPrice}</span>
                                                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-md text-[9px] font-black">{plan.savings}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3.5 mb-8 flex-1">
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleUpgrade(plan)}
                                        disabled={loading}
                                        className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${plan.popular
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95'
                                            : 'bg-slate-900 text-white hover:bg-black active:scale-95'
                                            }`}
                                    >
                                        {loading ? 'Processing...' : `Get ${plan.name}`}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-8">
                            <div className="text-center">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 mx-auto mb-2">
                                    <ShieldCheck size={20} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure Payments</p>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 mx-auto mb-2">
                                    <Zap size={20} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instant Activation</p>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 mx-auto mb-2">
                                    <Star size={20} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cancel Anytime</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bottom Note */}
                <div className="bg-white p-4 border-t border-slate-100 text-center shrink-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        Prices include all taxes. Powered by Razorpay secure checkout.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
