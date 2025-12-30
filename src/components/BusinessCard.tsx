import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Phone, Share2, Star, Award, Car, Download } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const BusinessCard: React.FC = () => {
    const { settings, currentVehicle, driverCode } = useSettings();
    const { user } = useAuth();
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    // Public Profile URL
    const publicUrl = user ? `${window.location.origin}?u=${user.id}` : window.location.origin;

    // Generate VCard Data (For "Add to Contacts")


    const generateImage = async (scale = 3) => {
        if (!cardRef.current) return null;
        // Wait for images
        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(cardRef.current, {
            scale: scale,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: true,
        } as any);
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

    // Helper for styles to avoid Tailwind oklab issues
    const colors = {
        slate900: '#0f172a',
        slate800: '#1e293b',
        slate400: '#94a3b8',
        slate300: '#cbd5e1',
        blue: '#0047AB',
        gold: '#eab308',
        white: '#ffffff',
        green: '#4ade80'
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
                            <span className="animate-pulse">...</span>
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
                {/* THE CARD - ATM/Credit Card Style Layout */}
                <div
                    ref={cardRef}
                    className="w-[340px] h-[210px] relative overflow-hidden flex flex-col justify-between shrink-0"
                    style={{
                        backgroundColor: colors.slate900,
                        background: `linear-gradient(135deg, ${colors.slate900} 0%, ${colors.slate800} 100%)`,
                        color: colors.white,
                        borderRadius: '16px', // Standard card radius
                        padding: '20px', // Comfortable padding
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' // Manual shadow using safe rgba
                    }}
                >
                    {/* Background Accents (Subtle) */}
                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 rounded-full blur-3xl"
                        style={{ backgroundColor: colors.blue, opacity: 0.15 }}></div>
                    <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 rounded-full blur-2xl"
                        style={{ backgroundColor: colors.gold, opacity: 0.08 }}></div>

                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
                            backgroundSize: '12px 12px'
                        }}>
                    </div>

                    {/* Content Layer (z-10 to stay above bg) */}
                    <div className="relative z-10 flex flex-col h-full justify-between">

                        {/* TOP ROW: Company & QR */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col max-w-[210px]">
                                {/* Company Name */}
                                <h2 style={{ color: colors.white, lineHeight: '1.1' }} className="text-lg font-black uppercase tracking-wider break-words">
                                    {settings.companyName || 'SARATHI BOOK'}
                                </h2>
                                {/* Partner Tag & ID */}
                                <div className="mt-1.5 flex flex-wrap gap-2 items-center">
                                    <span style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: colors.blue }} className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                        Partner
                                    </span>
                                    {driverCode && (
                                        <span style={{ color: colors.slate400, letterSpacing: '0.05em' }} className="text-[8px] font-bold uppercase">
                                            ID: #{driverCode}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="bg-white p-1 rounded-md shrink-0 ml-2">
                                <QRCodeCanvas
                                    value={publicUrl}
                                    size={42}
                                    level="M"
                                    fgColor={colors.slate900}
                                    bgColor="#FFFFFF"
                                />
                            </div>
                        </div>

                        {/* MIDDLE ROW: Stats (Simulating Card details) */}
                        <div className="flex items-center gap-3 my-1">
                            {/* Ratings/Vehicle Badge */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    {currentVehicle ? (
                                        <>
                                            <Car size={10} style={{ color: colors.slate400 }} />
                                            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: colors.slate300 }}>
                                                {currentVehicle.model}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Star size={10} style={{ color: colors.gold }} />
                                            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: colors.slate300 }}>
                                                5-Star
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <Award size={10} style={{ color: colors.gold }} />
                                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: colors.slate300 }}>Verified</span>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM ROW: Footer Info (Services & Phone) */}
                        <div className="flex items-end justify-between mt-auto pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            {/* Left: Services */}
                            <div className="flex flex-col max-w-[55%]">
                                <span className="text-[7px] font-medium uppercase tracking-widest mb-0.5" style={{ color: colors.slate400 }}>
                                    Services
                                </span>
                                <span className="text-[10px] font-bold tracking-wide leading-tight truncate" style={{ color: colors.white }}>
                                    {settings.services && settings.services.length > 0
                                        ? settings.services.join(' • ')
                                        : 'Local • Outstation • Tours'}
                                </span>
                            </div>

                            {/* Right: Phone (Large like Card Number) */}
                            <div className="flex flex-col items-end text-right">
                                <div className="flex items-center gap-1 mb-0.5" style={{ color: colors.green }}>
                                    <Phone size={10} fill="currentColor" />
                                    <span className="text-[7px] font-black uppercase tracking-widest">Booking</span>
                                </div>
                                <span className="text-lg font-black tracking-tight tabular-nums leading-none" style={{ color: colors.white, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                    {settings.driverPhone || '+91 -'}
                                </span>
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
