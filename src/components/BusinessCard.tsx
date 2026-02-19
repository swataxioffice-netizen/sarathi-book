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
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

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
            link.download = `Business_Card_${activeSide}_${(settings.companyName || 'My_Business').replace(/[^a-z0-9]/gi, '_')}.png`;
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
        });
        return canvas;
    };

    const handleSaveContact = () => {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${settings.companyName || 'Travel Partner'}
TEL:${settings.driverPhone}
ORG:${settings.companyName || 'Travel Services'}
URL:${publicUrl}
END:VCARD`;

        const blob = new Blob([vcard], { type: "text/vcard" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${(settings.companyName || 'Contact').replace(/\s+/g, '_')}.vcf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {activeSide === 'front' ? 'Front Side' : 'Back Side'}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveSide(s => s === 'front' ? 'back' : 'front')}
                            className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider"
                        >
                            Turn Over ⟳
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={generating}
                            className="bg-slate-100 text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all active:scale-90"
                            title="Download Side"
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

                {/* STANDARD GOVERNMENT STYLE CARD */}
                <div className="flex justify-center perspective-1000 group">
                    <div
                        ref={cardRef}
                        className="relative w-[340px] h-[200px] bg-white border border-slate-300 flex flex-col justify-between shadow-md overflow-hidden select-none"
                    >
                        {activeSide === 'front' ? (
                            <>
                                {/* FRONT SIDE CONTENT */}
                                <div className="h-2 w-full bg-[#1e3a8a]"></div>

                                <div className="flex-1 p-5 flex gap-4">
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-1 leading-none">
                                            {settings.companyName || 'Travel Partner'}
                                        </h1>
                                        {settings.contactPerson && (
                                             <p className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-wide">
                                                {settings.contactPerson}
                                            </p>
                                        )}
                                        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                            Trusted Travel Service
                                        </p>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-none">{settings.driverPhone || '+91 ••••• •••••'}</p>
                                                    {settings.secondaryPhone && (
                                                        <p className="text-[10px] font-medium text-slate-600 mt-0.5">{settings.secondaryPhone}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {(settings.websiteUrl || settings.companyEmail) && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                                                        <Globe size={10} className="text-slate-700" />
                                                    </div>
                                                    <p className="text-[10px] font-medium text-slate-700 truncate max-w-[150px]">
                                                        {settings.websiteUrl || settings.companyEmail}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center border-l w-24 border-slate-200 pl-2">
                                        <div className="p-1 bg-white border border-slate-200 rounded">
                                            <QRCodeCanvas
                                                value={`https://${publicUrl}`}
                                                size={70}
                                                level="H"
                                                fgColor="#1e3a8a"
                                                bgColor="#FFFFFF"
                                            />
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Scan Me</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 border-t border-slate-200 px-5 py-2">
                                    <p className="text-[9px] font-medium text-slate-600 text-center uppercase tracking-wide">
                                        • Airport Drops • Outstation • 24x7 Cab Service •
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* BACK SIDE CONTENT */}
                                <div className="h-full flex flex-col">
                                    <div className="bg-slate-900 text-white px-5 py-2 flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Our Services</span>
                                        <span className="text-[8px] font-medium opacity-75">{settings.contactPerson || settings.companyName}</span>
                                    </div>
                                    
                                    <div className="flex-1 p-5 grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-[9px] font-bold text-[#1e3a8a] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">We Offer</h4>
                                            <ul className="text-[9px] font-medium text-slate-600 space-y-1.5 list-disc list-inside">
                                                {settings.services && settings.services.length > 0 ? (
                                                    settings.services.slice(0, 5).map((service, index) => (
                                                        <li key={index} className="truncate">{service}</li>
                                                    ))
                                                ) : (
                                                    <>
                                                        <li>Local & Outstation Trips</li>
                                                        <li>Airport Pick & Drop</li>
                                                        <li>Corporate Staff Transport</li>
                                                        <li>Wedding Events</li>
                                                        <li>Tour Packages</li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-[9px] font-bold text-[#1e3a8a] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Fleet Available</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {settings.vehicles && settings.vehicles.length > 0 ? (
                                                    [...new Set(settings.vehicles.map(v => v.model))].slice(0, 4).map((model, i) => (
                                                        <span key={i} className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                                                            {model}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[8px] text-slate-400 italic">Sedan, SUV, Tempo Traveller available on request.</span>
                                                )}
                                            </div>

                                            {settings.companyAddress && (
                                                <div className="mt-4">
                                                    <h4 className="text-[9px] font-bold text-[#1e3a8a] uppercase tracking-wider mb-1">Office</h4>
                                                    <p className="text-[8px] font-medium text-slate-500 leading-snug">
                                                        {settings.companyAddress}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-[#1e3a8a] text-white px-5 py-1.5 flex justify-between items-center">
                                        <span className="text-[8px] font-medium tracking-wide">For Bookings Call:</span>
                                        <span className="text-[10px] font-bold tracking-wider">{settings.driverPhone}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Actions for User Interface */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleSaveContact}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 h-11 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        <UserPlus size={14} /> Save Contact
                    </button>
                    <a
                        href={publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-slate-900 h-11 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-md hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Car size={14} /> Visit Profile
                    </a>
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex gap-3 items-start">
                <div className="bg-white border border-slate-200 text-slate-500 p-1.5 rounded shadow-sm mt-0.5">
                    <Zap size={14} />
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-slate-700 uppercase">Interactive Card</h4>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                        Customers can scan the QR code to view your items, check rates, and book directly.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BusinessCard;
