import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Share2, Car, Download, UserPlus, Zap, Globe } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const BusinessCard: React.FC = () => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    // Public Profile URL
    const publicUrl = user ? `${window.location.origin}/public/${user.id}` : window.location.origin;

    const handleShare = async () => {
        setGenerating(true);
        try {
            const canvas = await generateImage(3);
            if (!canvas) throw new Error('Canvas generation failed');

            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Blob generation failed');

            const file = new File([blob], 'My_Business_Card.png', { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: 'My Digital Visiting Card',
                    text: `Book your next trip with ${settings.companyName || 'me'}! Visit Profile: ${publicUrl}`
                });
            } else {
                handleDownload();
            }
        } catch (error) {
            console.error('Error sharing card:', error);
            handleDownload();
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = async () => {
        setGenerating(true);
        try {
            const canvas = await generateImage(4);
            if (!canvas) throw new Error('Canvas generation failed');

            const link = document.createElement('a');
            link.download = `Business_Card_${(settings.companyName || 'SarathiBook').replace(/[^a-z0-9]/gi, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error downloading card:', error);
            alert(`Could not download image: ${(error as Error).message}`);
        } finally {
            setGenerating(false);
        }
    };

    const generateImage = async (scale = 3) => {
        if (!cardRef.current) return null;
        // Wait for images
        await new Promise(resolve => setTimeout(resolve, 200));

        const html2canvas = (await import('html2canvas')).default;

        const canvas = await html2canvas(cardRef.current, {
            scale: scale,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: true,
        } as any);
        return canvas;
    };

    const handleSaveContact = () => {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${settings.companyName || 'Sarathi Driver'}
TEL:${settings.driverPhone}
ORG:Sarathi Book Profile
URL:${publicUrl}
END:VCARD`;

        const blob = new Blob([vcard], { type: "text/vcard" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${(settings.companyName || 'Driver').replace(/\s+/g, '_')}.vcf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visiting Card Preview</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            disabled={generating}
                            className="bg-slate-100 text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all active:scale-90"
                            title="Download PNG"
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={generating}
                            className="bg-blue-50 text-[#0047AB] p-2 rounded-xl hover:bg-blue-100 transition-all active:scale-90"
                            title="Share Card"
                        >
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>

                {/* CLASSIC INDIAN CORPORATE CARD STYLE */}
                <div className="flex justify-center perspective-1000 group">
                    <div
                        ref={cardRef}
                        className="relative w-[340px] h-[200px] border flex flex-col justify-between shadow-xl overflow-hidden transition-all duration-700 select-none hover:scale-[1.02]"
                        style={{
                            backgroundColor: '#FDFBF7',
                            borderColor: '#E7E5E4',
                            borderRadius: '12px',
                            fontFamily: 'Arial, sans-serif'
                        }}
                    >
                        {/* Premium Paper Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                        {/* Main Body */}
                        <div className="flex-1 flex p-4 gap-4 items-center">
                            {/* Left Content */}
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="mb-3">
                                    <h1 className="text-lg font-bold leading-tight uppercase" style={{ color: '#1e3a8a' }}>
                                        {settings.companyName || 'Sarathi Partner'}
                                    </h1>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Globe size={10} color="#6B7280" />
                                        <span className="text-[9px] font-bold tracking-wider" style={{ color: '#6B7280' }}>www.sarathibook.com</span>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1e3a8a' }}>
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="#FFFFFF" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                        </div>
                                        <span className="text-sm font-bold tracking-wide" style={{ color: '#111827' }}>{settings.driverPhone || '+91 ••••• •••••'}</span>
                                    </div>
                                    <p className="text-[9px] font-medium pl-6" style={{ color: '#374151' }}>
                                        • Airport Drops • Outstation<br />
                                        • Tour Packages • 24x7 Service
                                    </p>
                                </div>
                            </div>

                            {/* Right Content - QR */}
                            <div className="flex flex-col items-center justify-center border-l pl-3" style={{ borderColor: '#F3F4F6' }}>
                                <div className="p-1 border rounded-lg" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
                                    <QRCodeCanvas
                                        value={`https://${publicUrl}`}
                                        size={65}
                                        level="H"
                                        fgColor="#1e3a8a" // Navy Blue QR
                                        bgColor="#FFFFFF"
                                    />
                                </div>
                                <span className="text-[8px] font-bold mt-1.5 uppercase tracking-wide" style={{ color: '#1e3a8a' }}>Scan to Book</span>
                            </div>
                        </div>

                        {/* Footer Strip - Saffron Accent */}
                        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(to right, #F97316, #FFFFFF, #16A34A)' }}></div>
                    </div>
                </div>

                {/* Quick Actions for User Interface */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleSaveContact}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        <UserPlus size={16} /> Add to Contacts
                    </button>
                    <a
                        href={publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#0047AB] h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Car size={16} /> Visit Profile
                    </a>
                </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex gap-3 items-center">
                <div className="bg-blue-500 text-white p-2 rounded-lg">
                    <Zap size={16} />
                </div>
                <p className="text-[10px] text-blue-900 font-bold leading-relaxed">
                    Show this card to customrs. They can scan the QR code to see your ratings, fleet and book directly!
                </p>
            </div>
        </div>
    );
};

export default BusinessCard;
