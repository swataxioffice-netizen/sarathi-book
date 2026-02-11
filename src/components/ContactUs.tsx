import SEOHead from './SEOHead';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const ContactUs = () => {
    return (
        <div className="bg-white min-h-screen">
            <SEOHead
                title="Contact Us | Sarathi Book - Support & Feedback"
                description="Get in touch with the Sarathi Book team. We are here to help you with any questions about our taxi management tools."
            />

            <div className="bg-[#0047AB] text-white py-20 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Get In Touch</h1>
                    <p className="text-blue-100 font-medium">Have questions or feedback? We'd love to hear from you.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Contact Information</h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email Us</p>
                                        <p className="text-lg font-bold text-slate-800">support@sarathibook.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Call Us</p>
                                        <p className="text-lg font-bold text-slate-800">+91 98765 43210</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Office</p>
                                        <p className="text-lg font-bold text-slate-800">Chennai, Tamil Nadu, India</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <h3 className="font-black text-slate-900 uppercase tracking-tight mb-4">Support Hours</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                Our support team is available Monday to Friday, 9:00 AM to 6:00 PM (IST). We typically respond to emails within 24 hours.
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Send Message</h2>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                    <input type="text" className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                    <input type="email" className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="john@example.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
                                <input type="text" className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="How can we help?" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Message</label>
                                <textarea rows={4} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Tell us more..."></textarea>
                            </div>
                            <button type="submit" className="w-full bg-[#0047AB] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-800 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                                <Send size={16} />
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
