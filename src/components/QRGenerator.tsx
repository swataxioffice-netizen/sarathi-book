import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings } from '../contexts/SettingsContext';
import { Share2, QrCode, Download } from 'lucide-react';

const QRGenerator: React.FC = () => {
    const { settings, t } = useSettings();

    // In a real app, this would be a deep link to a booking page or a vCard
    const bookingLink = `https://wa.me/${settings.driverPhone}?text=Hi ${settings.companyName}, I want to book a cab.`;

    const downloadQR = () => {
        const svg = document.getElementById('driver-qr');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `QR_${settings.companyName}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-driver-accent mb-2">
                <QrCode size={20} />
                <h3 className="font-bold uppercase tracking-widest text-xs">{t('qrTitle')}</h3>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl shadow-driver-accent/10">
                <QRCodeSVG
                    id="driver-qr"
                    value={bookingLink}
                    size={160}
                    level="H"
                    includeMargin={false}
                />
            </div>

            <div className="space-y-1">
                <h4 className="text-white font-bold">{settings.companyName}</h4>
                <p className="text-slate-400 text-[10px]">{t('qrSub')}</p>
            </div>

            <div className="flex gap-2 pt-2">
                <button
                    onClick={downloadQR}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-all"
                >
                    <Download size={18} />
                    Download
                </button>
                <button
                    onClick={() => navigator.share({ title: 'Book Me', url: bookingLink })}
                    className="flex-1 bg-driver-accent text-slate-950 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-all"
                >
                    <Share2 size={18} />
                    Share
                </button>
            </div>
        </div>
    );
};

export default QRGenerator;
