import SEOHead from './SEOHead';
import { ShieldCheck, Users, Zap, Award } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="bg-white min-h-screen">
            <SEOHead
                title="About Us | Sarathi Book - Professional Cab Management Tools"
                description="Learn more about Sarathi Book, our mission to empower taxi drivers and owners with advanced business tools, and our commitment to fair pricing and transparency."
            />

            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-20 px-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6 leading-none">
                        Empowering the <span className="text-blue-500">Taxi Community</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Sarathi Book is the ultimate business companion for taxi owners and acting drivers across India, providing professional estimation and invoicing tools.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-6 leading-tight">Our Mission</h2>
                        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
                            The taxi industry in India is massive but often lacks the professional tools needed for growth. Drivers frequently struggle with manual calculations, paper-based invoices, and price disputes with customers.
                        </p>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Our mission is to digitalize the taxi business by providing easy-to-use, accurate, and professional tools that help drivers win customer trust and manage their finances better.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col items-center text-center">
                            <Zap className="text-blue-600 mb-4" size={32} />
                            <h4 className="font-black text-blue-900 text-lg leading-tight uppercase tracking-tight">Fast</h4>
                            <p className="text-[10px] text-blue-700/70 font-bold uppercase tracking-widest mt-1">Estimations</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                            <ShieldCheck className="text-emerald-600 mb-4" size={32} />
                            <h4 className="font-black text-emerald-900 text-lg leading-tight uppercase tracking-tight">Trusted</h4>
                            <p className="text-[10px] text-emerald-700/70 font-bold uppercase tracking-widest mt-1">By Drivers</p>
                        </div>
                        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex flex-col items-center text-center">
                            <Users className="text-orange-600 mb-4" size={32} />
                            <h4 className="font-black text-orange-900 text-lg leading-tight uppercase tracking-tight">Active</h4>
                            <p className="text-[10px] text-orange-700/70 font-bold uppercase tracking-widest mt-1">Community</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 flex flex-col items-center text-center">
                            <Award className="text-purple-600 mb-4" size={32} />
                            <h4 className="font-black text-purple-900 text-lg leading-tight uppercase tracking-tight">Premium</h4>
                            <p className="text-[10px] text-purple-700/70 font-bold uppercase tracking-widest mt-1">Experience</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-12">
                    <section>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 border-l-4 border-blue-600 pl-4 uppercase leading-none">Why Sarathi Book?</h3>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Unlike traditional bookkeeping, Sarathi Book offers real-time fare calculation based on official union tariffs, dynamic route planning with Google Maps integration, and professional PDF generation for quotations and invoices. We believe that every driver deserves professional-grade software to run their business.
                        </p>
                    </section>

                    <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Our Commitment</h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                </div>
                                <p className="text-sm text-slate-600 font-medium">Accuracy: We constantly update our tariff logic to match the current market rates.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                </div>
                                <p className="text-sm text-slate-600 font-medium">Privacy: Your business data is saved securely on your device and synced privately to your account.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                </div>
                                <p className="text-sm text-slate-600 font-medium">Transparency: No hidden fees or commissions. Our tools are built for you.</p>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
