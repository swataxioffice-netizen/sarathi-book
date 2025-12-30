import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Phone, Share2, Star, Award, Car, Download } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const BusinessCard: React.FC = () => {
    const { settings, currentVehicle } = useSettings();
    const { user } = useAuth();
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    // Public Profile URL
    const publicUrl = user ? `${window.location.origin}?u=${user.id}` : window.location.origin;

    // Generate VCard Data (For "Add to Contacts")
    const generateVCardData = () => {
        const name = settings.companyName || 'Driver';
        const phone = settings.driverPhone || '';
        const org = 'Sarathi Book'; // Organization name for searching

        return `BEGIN:VCARD
VERSION:3.0
FN:${name}
ORG:${org};${name}
TEL;TYPE=CELL:${phone}
URL:${publicUrl}
END:VCARD`;
    };

    const generateImage = async (scale = 3) => {
        if (!cardRef.current) return null;
        // Wait for fonts/images
        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(cardRef.current, {
            scale: scale, // Higher scale for better quality
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: false // Prevent tainted canvas
        });
        return canvas;
    };

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
                // Fallback if share not supported
                handleDownload();
            }
        } catch (error) {
            console.error('Error sharing card:', error);
            handleDownload(); // Try downloading if sharing fails
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = async () => {
        setGenerating(true);
        try {
            const canvas = await generateImage(4); // Scale 4 for High Res Print
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Digital Visiting Card</h3>

                <div className="flex gap-2">
                    <button
                        onClick={handleDownload}
                        disabled={generating}
                        className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all hover:bg-slate-900"
                        title="Download for Printing"
                    >
                        {generating ? (
                            <span className="animate-pulse">...</span>
                        ) : (
                            <>
                                <Download size={12} /> Save
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={generating}
                        className="flex items-center gap-1.5 bg-[#0047AB] text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all hover:bg-blue-700"
                        title="Share on WhatsApp"
                    >
                        {generating ? (
                            <span className="animate-pulse">Generating...</span>
                        ) : (
                            <>
                                <Share2 size={12} /> Share
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Business Card Container - Centered */}
            <div className="flex justify-center p-2 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                {/* THE CARD (This is what gets captured) */}
                <div
                    ref={cardRef}
                    className="w-[340px] h-[200px] bg-slate-900 rounded-xl relative overflow-hidden shadow-2xl flex flex-col justify-between p-5 text-white shrink-0"
                    style={{
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
                    }}
                >
                    {/* Background Accents (Gold/Blue) */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#0047AB]/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl -ml-5 -mb-5"></div>

                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '10px 10px' }}>
                    </div>

                    {/* Header: Company Name & Logo */}
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                {settings.companyName || 'SARATHI BOOK'}
                            </h2>
                            <p className="text-[9px] text-[#0047AB] font-bold uppercase tracking-[0.2em] mt-0.5 bg-white/90 px-1 py-0.5 rounded inline-block">
                                Sarathibook.com Partner
                            </p>
                        </div>
                        {/* QR Code - Link to Public Profile */}
                        <div className="bg-white p-1 rounded-lg shadow-lg">
                            <QRCodeCanvas
                                value={publicUrl}
                                size={48}
                                level="M"
                                fgColor="#0F172A"
                                bgColor="#FFFFFF"
                            />
                        </div>
                    </div>

                    {/* Middle: Car & Stats */}
                    <div className="relative z-10 flex items-center gap-3 my-2">
                        {currentVehicle ? (
                            <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                                <Car size={10} className="text-slate-400" />
                                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-300">
                                    {currentVehicle.model || 'Luxury Cab'}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                                <Star size={10} className="text-yellow-500" />
                                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-300">
                                    5-Star Rated Driver
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                            <Award size={10} className="text-yellow-500" />
                            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-300">
                                Verified
                            </span>
                        </div>
                    </div>

                    {/* Footer: Name & Phone */}
                    <div className="relative z-10 mt-auto">
                        <div className="w-8 h-0.5 bg-gradient-to-r from-[#0047AB] to-transparent mb-2"></div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Your Pilot</p>
                                <p className="text-sm font-bold text-white tracking-wide">
                                    {settings.companyName ? 'Authorised Partner' : 'Professional Driver'}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1.5 justify-end text-green-400 mb-0.5">
                                    <Phone size={10} fill="currentColor" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Booking Line</span>
                                </div>
                                <p className="text-lg font-black tracking-tight text-white tabular-nums leading-none">
                                    {settings.driverPhone || '+91 -'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-center text-slate-400 font-medium">
                Tip: Scan the QR code to view the driver's public profile.
            </p>
        </div>
    );
};

export default BusinessCard;
