import SEOHead from './SEOHead';
import { MessageCircle, Phone, ArrowRight, Mail } from 'lucide-react';

const ContactUs = () => {
    const whatsappNumber = '919952749408';

    const openWhatsApp = () => {
        window.open(`https://wa.me/${whatsappNumber}`, '_blank');
    };

    return (
        <div className="bg-white min-h-screen">
            <SEOHead
                title="Contact Us | Sarathi Book - Support & Feedback"
                description="Get in touch with the Sarathi Book team. We are here to help cab drivers and fleet owners across India."
            />

            {/* Header */}
            <div className="bg-slate-900 text-white py-16 px-6 text-center">
                <div className="max-w-3xl mx-auto space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Support Channel
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Get In Touch</h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Have questions or need assistance? Connect with our support team instantly.
                    </p>
                </div>
            </div>

            {/* Contact Options */}
            <div className="max-w-2xl mx-auto px-6 py-12 space-y-4">

                {/* WhatsApp */}
                <button
                    onClick={openWhatsApp}
                    className="w-full flex items-center gap-5 p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100 active:scale-[0.98] transition-all group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                        <MessageCircle size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Fastest Response</p>
                        <p className="text-base font-black text-slate-900">Chat on WhatsApp</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Instant support for drivers & fleet owners</p>
                    </div>
                    <ArrowRight size={18} className="text-emerald-500 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                {/* Phone Call */}
                <a
                    href={`tel:+${whatsappNumber}`}
                    className="w-full flex items-center gap-5 p-5 rounded-2xl bg-blue-50 border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-100 active:scale-[0.98] transition-all group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                        <Phone size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Call Us</p>
                        <p className="text-base font-black text-slate-900">Direct Helpline</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Available during business hours (IST)</p>
                    </div>
                    <ArrowRight size={18} className="text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </a>

                {/* Email */}
                <a
                    href="mailto:saravn.web@gmail.com"
                    className="w-full flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-slate-300 active:scale-[0.98] transition-all group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                        <Mail size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Support</p>
                        <p className="text-base font-black text-slate-900">saravn.web@gmail.com</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">We reply within 24 hours</p>
                    </div>
                    <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </a>

                {/* Info note */}
                <p className="text-center text-[11px] text-slate-400 font-medium pt-4">
                    WhatsApp is the fastest way to get help. Our team responds within minutes.
                </p>
            </div>
        </div>
    );
};

export default ContactUs;
