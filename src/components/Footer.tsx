import React from 'react';

interface FooterProps {
    setActiveTab: (tab: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 pt-12 pb-24 md:pb-12 mt-12">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl font-black text-white uppercase tracking-tighter">Sarathi<span className="text-blue-500">Book</span></span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                            Empowering taxi owners and drivers with professional tools for accurate fare calculation, invoicing, and business management.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 border-l-2 border-blue-500 pl-3">Services</h4>
                        <ul className="space-y-4">
                            <li><button onClick={() => setActiveTab('calculator')} className="text-slate-400 hover:text-white text-sm transition-colors font-semibold">Cab Fare Calculator</button></li>
                            <li><button onClick={() => setActiveTab('tariff')} className="text-slate-400 hover:text-white text-sm transition-colors font-semibold">Tariff List</button></li>
                            <li><button onClick={() => setActiveTab('routes')} className="text-slate-400 hover:text-white text-sm transition-colors font-semibold">Routes Directory</button></li>
                            <li><button onClick={() => setActiveTab('trending')} className="text-slate-400 hover:text-white text-sm transition-colors font-semibold">Trending Routes</button></li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 border-l-2 border-emerald-500 pl-3">Company</h4>
                        <ul className="space-y-4">
                            <li><button onClick={() => setActiveTab('about')} className="text-slate-400 hover:text-white text-sm transition-colors font-semibold">About Us</button></li>
                            <li><button onClick={() => setActiveTab('contact')} className="text-slate-400 hover:text-white text-sm transition-colors font-semibold">Contact Us</button></li>
                            <li><button onClick={() => setActiveTab('privacy')} className="text-slate-400 hover:text-white text-sm transition-colors font-semibold">Privacy Policy</button></li>
                            <li><button onClick={() => setActiveTab('terms')} className="text-slate-400 hover:text-white text-sm transition-colors font-semibold">Terms of Service</button></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 border-l-2 border-orange-500 pl-3">Newsletter</h4>
                        <p className="text-slate-400 text-xs leading-relaxed mb-4 font-medium">
                            Get latest updates on taxi rates and business tools.
                        </p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Email" className="bg-slate-800 border-none rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 flex-1" />
                            <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Join</button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} Sarathi Book. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <button className="text-slate-500 hover:text-blue-500 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </button>
                        <button className="text-slate-500 hover:text-blue-400 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
