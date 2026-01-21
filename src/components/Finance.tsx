import React from 'react';
import { ShieldCheck, ExternalLink, Star } from 'lucide-react';
import { affiliateConfig } from '../config/affiliates';

interface LoanPartner {
    id: string;
    name: string;
    type: string;
    maxAmount: string;
    time: string;
    interest: string;
    description: string;
    idealFor: string;
    features: string[];
    logo: string;
    color: string;
    btnColor: string;
    popular?: boolean;
}

const Finance: React.FC = () => {
    const loanPartners: LoanPartner[] = [
        {
            id: 'kreditbee',
            name: 'KreditBee',
            type: 'Emergency Cash',
            maxAmount: '₹50,000',
            time: '10 Minutes',
            interest: '1.5% / month',
            description: 'Fastest way to get cash for fuel, repairs, or daily needs. No heavy paperwork.',
            idealFor: 'Urgent small expenses',
            features: ['Quick Disbursal', 'Just Pan & Aadhaar', 'Low Salary OK'],
            logo: '🐝',
            color: 'bg-amber-50 text-amber-700 border-amber-100',
            btnColor: 'bg-[#FFB300] hover:bg-[#ffca2c] text-slate-900',
            popular: true
        },
        {
            id: 'moneyview',
            name: 'MoneyView',
            type: 'Personal Loan',
            maxAmount: '₹5 Lakhs',
            time: '24 Hours',
            interest: '1.3% / month',
            description: 'Best for debt consolidation or family needs. Entire process is on your phone.',
            idealFor: 'Medium expenses & Family needs',
            features: ['100% Digital', 'Flexible EMI', 'No Collateral'],
            logo: '⚡',
            color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            btnColor: 'bg-[#00c9a7] hover:bg-[#00b092]',
            popular: true
        },
        {
            id: 'poonawalla',
            name: 'Poonawalla Fincorp',
            type: 'Personal Loan',
            maxAmount: '₹30 Lakhs',
            time: '24 Hours',
            interest: '9.99% / year',
            description: 'Zero pre-payment charges. Best for drivers who want to close loan early.',
            idealFor: 'Foreclosure Friendly',
            features: ['No Pre-closure Charges', '100% Digital', 'Low Interest'],
            logo: '℗',
            color: 'bg-red-50 text-red-700 border-red-100',
            btnColor: 'bg-[#D32F2F] hover:bg-[#b71c1c]'
        },
        {
            id: 'idfc',
            name: 'IDFC FIRST Bank',
            type: 'Bank Loan',
            maxAmount: '₹10 Lakhs',
            time: '48 Hours',
            interest: '10.49% / year',
            description: 'Paperless bank loan. Good approval rate for existing bank customers.',
            idealFor: 'Balance Transfer',
            features: ['Zero Paperwork', 'Fast Banking', 'Flexible Terms'],
            logo: '🏛️',
            color: 'bg-red-50 text-red-700 border-red-100',
            btnColor: 'bg-[#9f1b29] hover:bg-[#8a1420]'
        }
    ];

    return (
        <div className="space-y-4 animate-fade-in max-w-4xl mx-auto pb-24 px-4 pt-2">
            {/* Hero Section - Compact Mobile */}
            <div className="bg-gradient-to-r from-[#0047AB] to-[#003380] rounded-2xl p-5 md:p-8 text-white relative overflow-hidden shadow-lg">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 bg-blue-500/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3 border border-blue-400/30">
                        <ShieldCheck size={12} />
                        <span>Verified Partners</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black mb-2 leading-tight">Driver Finance Hub</h1>
                    <p className="text-blue-100 text-sm md:text-lg max-w-xl leading-relaxed opacity-90">
                        Handpicked lenders for Sarathi Partners. No hidden agents.
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {loanPartners.map((partner) => (
                    <div key={partner.id} className="bg-white rounded-2xl border border-slate-200 p-0 shadow-sm hover:shadow-lg transition-all overflow-hidden group">

                        {/* Card Header & Badge - Compact */}
                        <div className={`px-4 py-3 border-b border-slate-100 flex justify-between items-center ${partner.popular ? 'bg-slate-50' : ''}`}>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${partner.color}`}>
                                    {partner.type}
                                </span>
                                {partner.popular && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                        <Star size={8} fill="currentColor" /> POPULAR
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400">
                                10k+ Users
                            </div>
                        </div>

                        <div className="p-4 md:p-6 md:flex md:items-start md:gap-8">
                            {/* Logo & Main Info */}
                            <div className="flex-1">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0 ${partner.color}`}>
                                        {partner.logo}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 leading-tight">{partner.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2 md:hidden">
                                            <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-600">
                                                <span>Best For:</span>
                                                <span className="font-bold text-slate-700">{partner.idealFor}</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-xs mt-2 leading-relaxed hidden md:block">
                                            {partner.description}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-slate-500 text-xs mb-4 leading-relaxed md:hidden">
                                    {partner.description}
                                </p>

                                {/* Key Stats Grid - Compact */}
                                <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Max Amount</p>
                                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                                            {partner.maxAmount}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Interest</p>
                                        <p className="text-xs font-black text-slate-800">{partner.interest}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Time</p>
                                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                                            {partner.time}
                                        </p>
                                    </div>
                                </div>

                                {/* Ideal For Tag - Desktop Only */}
                                <div className="hidden md:inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg text-xs font-medium text-slate-600 mb-4 md:mb-0">
                                    <span className="text-slate-400">Best For:</span>
                                    <span className="font-bold text-slate-700">{partner.idealFor}</span>
                                </div>
                            </div>

                            {/* Action Section */}
                            <div className="md:w-64 shrink-0 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 md:min-h-full justify-center">
                                <ul className="flex flex-wrap gap-x-4 gap-y-2 md:block md:space-y-2 mb-4 md:mb-4">
                                    {partner.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-600 font-medium">
                                            <div className="w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`w-full py-3 md:py-4 rounded-xl text-white font-bold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all ${partner.btnColor}`}
                                    onClick={() => {
                                        const link = affiliateConfig[partner.id as keyof typeof affiliateConfig] || 'https://gromo.in';
                                        window.open(link, '_blank');
                                    }}
                                >
                                    <span>Check Eligibility</span>
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 text-center text-[10px] md:text-xs text-slate-400">
                <p>Ensure you read the lender's terms and conditions before applying. Interest rates may vary based on your profile.</p>
            </div>
        </div>
    );
};

export default Finance;
