// Imports moved to dynamic import inside functions
import { type Trip } from './fare';
import { VEHICLES } from '../config/vehicleRates';
import { numberToWords } from './numberToWords';
import { toTitleCase, formatAddress } from './stringUtils';

export interface PDFSettings {
    companyName: string;
    companyAddress: string;
    driverPhone: string;
    gstin: string;
    vehicleNumber: string;
    gstEnabled: boolean;
    vehicles?: any[];
    driverCode?: number;
    signatureUrl?: string;
    userId?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    holderName?: string;
    branchName?: string;
    upiId?: string;
    appColor?: string;
    logoUrl?: string;
    showWatermark?: boolean;
}

export interface QuotationItem {
    description: string;
    package: string;
    vehicleType: string;
    rate: string;
    quantity?: number; // Added for auto-calculation
    amount: string;
    taxable?: boolean;
}

export interface QuotationData {
    customerName: string;
    customerAddress?: string;
    customerGstin?: string;
    subject: string;
    date: string;
    items: QuotationItem[];
    gstEnabled?: boolean;
    rcmEnabled?: boolean;
    quotationNo?: string;
    terms?: string[];
}

export interface SavedQuotation {
    id: string;
    quotationNo: string;
    customerName: string;
    customerAddress?: string; // Added
    customerGstin?: string;   // Added
    subject: string;
    date: string;
    items: QuotationItem[];
    vehicleType: string;
    gstEnabled?: boolean;
    rcmEnabled?: boolean;
    terms?: string[];
}

export const generateReceiptPDF = async (trip: Trip, settings: PDFSettings, isQuotation: boolean = false) => {
    // Dynamic Import for Code Splitting (Memory Efficiency)
    const { jsPDF } = await import('jspdf');
    // @ts-ignore
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    // ... rest of the function remains identical, just ensuring imports are available ...

    // We need to re-implement the function body here since we are replacing.
    // Copying the logic from view_file output but wrapped in dynamic import.

    const margin = 15;
    let y = 0;

    // Safety checks for settings
    const companyName = String(settings?.companyName || 'SARATHI BOOK OWNER');
    const driverPhone = String(settings?.driverPhone || '');
    const gstin = settings?.gstin ? String(settings.gstin) : '';
    const vehicleNumber = String(settings?.vehicleNumber || 'N/A');
    const gstEnabled = !!settings?.gstEnabled;
    const themeColor = settings?.appColor || '#0047AB';
    const rgb = hexToRgb(themeColor);

    // Helper to apply theme color
    const setThemeColor = () => doc.setTextColor(rgb.r, rgb.g, rgb.b);
    const setDrawThemeColor = () => doc.setDrawColor(rgb.r, rgb.g, rgb.b);

    // --- ZONE 1: HEADER (Minimal / Sustainable) ---
    if (settings?.logoUrl) {
        try {
            // Add custom logo if available
            doc.addImage(settings.logoUrl, 'PNG', margin, 12, 18, 18, undefined, 'FAST');

            setThemeColor();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.text(companyName.toUpperCase(), margin + 22, 22);
            doc.setTextColor(0, 0, 0);
        } catch (e) {
            console.error('Failed to add custom logo to PDF', e);
            // Fallback to text header
            setThemeColor();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.text(companyName.toUpperCase(), margin, 20);
            doc.setTextColor(0, 0, 0);
        }
    } else {
        setThemeColor();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text(companyName.toUpperCase(), margin, 20);
        doc.setTextColor(0, 0, 0); // Reset for others
    }


    doc.setFontSize(9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const companyAddress = String(settings?.companyAddress || '');
    doc.text(companyAddress, margin, 27, { maxWidth: 100 });

    doc.setFontSize(10);
    doc.text(`Contact: ${driverPhone}${gstin ? `  |  GSTIN: ${gstin}` : ''}`, margin, 42);
    if (settings?.driverCode) {
        doc.text(`Driver ID: #${settings.driverCode}`, 195, 42, { align: 'right' });
    }

    // Divider Line
    setDrawThemeColor();
    doc.setLineWidth(0.6);
    doc.line(margin, 48, 195, 48);
    doc.setDrawColor(200, 200, 200); // Reset

    // --- ZONE 2: INVOICE INFO ---
    y = 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    if (isQuotation) {
        doc.text('QUOTATION / PROFORMA', margin, y);
    } else {
        const isRegistered = !!gstin;
        const title = (isRegistered && gstEnabled) ? 'TAX INVOICE' : 'TRIP RECEIPT';
        doc.text(title, margin, y);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // GST Compliant Invoice numbering (Simplified for Filing)
    const date = new Date(trip.date || Date.now());
    const yearPart = date.getFullYear().toString().substring(2); // e.g. 25
    const monthPart = (date.getMonth() + 1).toString().padStart(2, '0'); // e.g. 12
    // Use sequential number if available, else fallback to ID hash
    const serialPart = trip.invoiceNo || (trip.id || '0000').substring(0, 4).toUpperCase();

    let vehSuffix = 'TX';
    if (vehicleNumber && vehicleNumber !== 'N/A') {
        const digits = vehicleNumber.replace(/[^0-9]/g, '');
        if (digits.length >= 4) {
            vehSuffix = digits.substring(digits.length - 4);
        } else {
            vehSuffix = vehicleNumber.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
        }
    }

    // Format: 1234/2512/001 (Vehicle/YYMM/SEQ)
    const invoiceNo = isQuotation
        ? `QTN/${yearPart}${monthPart}/${serialPart}`
        : `${vehSuffix}/${yearPart}${monthPart}/${serialPart}`;

    doc.text(`${isQuotation ? 'Quotation' : 'Invoice'} No: ${invoiceNo}`, 195, y, { align: 'right' });

    y += 5;
    let dateStr = 'N/A';
    try {
        const d = new Date(trip.date);
        dateStr = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN');
    } catch (e) { }
    doc.text(`Date: ${dateStr}`, 195, y, { align: 'right' });

    y += 5;
    doc.text(`Vehicle No: ${vehicleNumber}`, 195, y, { align: 'right' });
    y += 5;
    doc.text(`Place of Supply: Tamil Nadu (33)`, 195, y, { align: 'right' });
    if (gstin) {
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`GSTIN: ${gstin}`, 195, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
    }

    // RCM Declaration
    y += 5;

    doc.text(`Tax Payable on Reverse Charge: ${gstEnabled ? 'NO' : 'YES'}`, 195, y, { align: 'right' }); // Logic simplified: If GST enabled (Forward Charge), RCM is NO. If not enabled but invoice generated by registered person to registered person, likely RCM YES or just Exempt. For now, simplistic.

    // --- ZONE 3: CUSTOMER & JOURNEY ---
    y += 12;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 195, y);
    y += 8;

    const leftColX = margin;
    const rightColX = 110;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BILL TO:', leftColX, y);
    doc.text('PICKUP & DROP:', rightColX, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(toTitleCase(String(trip.customerName || 'Customer')), leftColX, y);

    const fromAddr = String(trip.from || 'N/A');
    const toAddr = String(trip.to || 'N/A');
    const journeyLines = doc.splitTextToSize(toTitleCase(`${fromAddr} TO ${toAddr}`), 85);
    doc.text(journeyLines, rightColX, y);

    const leftStartY = y;
    let leftY = y + 5;
    if (trip.billingAddress) {
        doc.setFontSize(8);
        const addrText = formatAddress(String(trip.billingAddress));
        // Split by comma, then group parts to stay within 3 lines max
        const parts = addrText.split(',').map(p => p.trim());
        let lines: string[] = [];
        if (parts.length <= 3) {
            lines = parts;
        } else {
            // Group first N-2 parts into first line, then next, then last
            const line1 = parts.slice(0, parts.length - 2).join(', ');
            const line2 = parts[parts.length - 2];
            const line3 = parts[parts.length - 1];
            lines = [line1, line2, line3];
        }

        let combinedLines: string[] = [];
        lines.forEach((line, idx) => {
            if (idx < 2) { // Only wrap first 2 lines if needed, 3rd is last
                const wrapped = doc.splitTextToSize(line + (idx < lines.length - 1 ? ',' : ''), 55);
                combinedLines = [...combinedLines, ...wrapped];
            } else {
                combinedLines.push(line);
            }
        });

        // Final trim to exactly 3 lines if it exceeded due to wrapping
        const finalLines = combinedLines.slice(0, 3);
        doc.text(finalLines, leftColX, leftY);
        leftY += (finalLines.length * 3.5) + 2;
    }

    if (trip.customerGst) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`GSTIN: ${trip.customerGst}`, leftColX, leftY);
        leftY += 5;
    }

    const journeyHeight = journeyLines.length * 5;
    y = Math.max(leftY, leftStartY + journeyHeight) + 10;

    // --- ZONE 4: TABLE (Clean Lines) ---
    // Header Line Top
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.line(margin, y, 195, y);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('DESCRIPTION', margin + 2, y);
    doc.text('SAC', 95, y); // NEW COLUMN
    doc.text('QTY', 115, y);
    doc.text('RATE', 145, y);
    doc.text('AMOUNT', 195, y, { align: 'right' });

    y += 3;
    // Header Line Bottom
    doc.line(margin, y, 195, y);
    y += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    let runningSubtotal = 0;
    const addTableRow = (label: string, qty: string, rate: string, amount: number) => {
        const safeAmount = isNaN(amount) ? 0 : amount;

        // Description wrapping
        const descLines = doc.splitTextToSize(label, 75); // Reduced width for Desc to fit SAC
        doc.text(descLines, margin + 2, y);

        doc.text('9966', 95, y); // SAC Code Fixed
        doc.text(qty, 115, y);
        doc.text(rate, 145, y);
        doc.text(`${safeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, y, { align: 'right' });

        runningSubtotal += safeAmount;
        y += Math.max(8, descLines.length * 5); // Dynamic height
    };

    // --- CHENNAI ASSOCIATION 2025 LOGIC SYNC ---
    const dist = Math.max(0, (trip.endKm || 0) - (trip.startKm || 0));

    if (trip.mode === 'custom') {
        // --- CUSTOM INVOICE ITEMS ---
        if (trip.extraItems && trip.extraItems.length > 0) {
            trip.extraItems.forEach(item => {
                const desc = item.description || 'Service Charge';
                const amt = item.amount || 0;
                addTableRow(desc, '1', '-', amt);
            });
        } else {
            addTableRow('Custom Service', '1', '-', trip.baseFare || 0);
        }
    } else if (trip.mode === 'hourly') {
        const hrs = trip.durationHours || 0;
        if (hrs <= 5) {
            addTableRow('Rental Package (5 Hours / 50 KM)', '1', '-', trip.hourlyRate || 1500);
        } else if (hrs <= 10) {
            addTableRow('Rental Package (10 Hours / 100 KM)', '1', '-', trip.hourlyRate || 2800);
        } else {
            addTableRow('Local Rental (Hourly)', `${hrs} Hrs`, `${trip.hourlyRate}/Hr`, hrs * (trip.hourlyRate || 0));
        }
    } else if (trip.mode === 'package') {
        addTableRow(String(trip.packageName || 'TOUR PACKAGE').toUpperCase(), '1', '-', trip.packagePrice || 0);
    } else if (trip.mode === 'drop') {
        if (dist <= 30) {
            let isLarge = false;
            // Heuristic to check vehicle type
            if (trip.vehicleId) {
                const combinedVehicles = [...(settings.vehicles || []), ...VEHICLES];
                const v = combinedVehicles.find(x => x.id === trip.vehicleId);
                if (v && ((v as any).type === 'SUV' || (v as any).type === 'Van' || (v as any).name?.includes('SUV') || (v as any).name?.includes('Innova'))) {
                    isLarge = true;
                }
            }

            const baseFee = isLarge ? 350 : 250;
            const extraRate = isLarge ? 35 : 25;
            const extraKm = Math.max(0, dist - 10);

            addTableRow('Local Drop (Base First 10 KM)', '10 KM', `${baseFee}`, baseFee);
            if (extraKm > 0) {
                addTableRow('Extra Distance Charge', `${extraKm.toFixed(1)} KM`, `${extraRate}/KM`, extraKm * extraRate);
            }
        } else {
            const chargedKm = Math.max(130, dist);
            const rate = trip.ratePerKm || 14;
            addTableRow(`Outstation Drop Trip (${dist} KM)`, `${chargedKm} KM (Min)`, `${rate}/KM`, chargedKm * rate);
        }
    } else if (trip.mode === 'outstation') {
        const days = trip.days || 1;
        const chargedKm = Math.max((trip.mode === 'outstation' ? 250 : 300) * days, dist); // Syncing with 250KM min
        const rate = trip.ratePerKm || 14;
        addTableRow(`Round Trip (${dist} KM)`, `${chargedKm} KM (Min)`, `${rate}/KM`, chargedKm * rate);
    }



    // Night Batta (if separate) or additional allowance
    if ((trip.nightBata || 0) > 0) {
        // Night Batta is usually per night for outstation
        const payDays = (trip.mode === 'outstation' ? trip.days : 1) || 1;
        const nLabel = payDays > 1 ? `Night Allowance (${payDays} Nights)` : 'Night Allowance';
        addTableRow(nLabel, `${payDays}`, `${trip.nightBata}`, (trip.nightBata || 0) * payDays);
    }

    // Driver Batta
    if ((trip.driverBatta || 0) > 0) {
        const payDays = (trip.mode === 'outstation' ? trip.days : 1) || 1;
        const bLabel = payDays > 1 ? `Driver Batta (${payDays} Days)` : 'Driver Batta';
        addTableRow(bLabel, `${payDays}`, `${trip.driverBatta}`, (trip.driverBatta || 0) * payDays);
    }

    // Night Stay (Outstation)
    if ((trip.nightStay || 0) > 0) {
        addTableRow('Night Stay Charge', '-', `${trip.nightStay}`, trip.nightStay || 0);
    }

    if ((trip.waitingCharges || 0) > 0) addTableRow('Waiting Charges', `${trip.waitingHours} Hrs`, '150/Hr', trip.waitingCharges || 0);
    if ((trip.hillStationCharges || 0) > 0) addTableRow('Hill Station Charges', '1', '-', trip.hillStationCharges || 0);
    if ((trip.petCharges || 0) > 0) addTableRow('Pet Carrying Charges', '1', '-', trip.petCharges || 0);

    // --- EXEMPT CHARGES (Reimbursements) ---
    // We calculate these separately to not confuse the "Taxable Value"
    let reimbursements = 0;

    // --- TOTALS & PAYMENT SECTION (Side-by-Side) ---
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 195, y); // Start of new section
    y += 8;

    const sectionsStartY = y;

    // 1. Render Payment Details (Left Side)
    let paymentY = sectionsStartY;
    if (settings.holderName || settings.upiId) {
        doc.setFontSize(9);
        setThemeColor();
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT DETAILS:', margin, paymentY);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        paymentY += 5;
        if (settings.holderName) {
            doc.text(`Account Name : ${settings.holderName}`, margin, paymentY);
            paymentY += 4;
        }
        if (settings.upiId) {
            doc.text(`UPI ID       : ${settings.upiId}`, margin, paymentY);
            paymentY += 4;
        }
    }

    // 2. Render Totals (Right Side)
    let totalsY = sectionsStartY;
    const taxableValue = runningSubtotal;
    const gstValue = trip.gst || 0;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Taxable Amount:', 135, totalsY);
    doc.text(`${taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
    totalsY += 8;

    const isDriverRegistered = !!gstin;
    // const isCorporateClient = !!trip.customerGst; // Removed unused variable which caused build failure

    if (isDriverRegistered && gstValue > 0) {
        const halfGst = gstValue / 2;
        doc.text('CGST (2.5%):', 135, totalsY);
        doc.text(`${halfGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
        totalsY += 6;
        doc.text('SGST (2.5%):', 135, totalsY);
        doc.text(`${halfGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
        totalsY += 8;
    } else if (trip.customerGst && !gstEnabled) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Tax Payable on Reverse Charge:', 135, totalsY);
        doc.text('YES', 195, totalsY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        totalsY += 8;
    } else if (isDriverRegistered && gstValue === 0 && gstEnabled) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Tax: 0.00 (Nil Rated)', 135, totalsY);
        doc.setTextColor(0, 0, 0);
        totalsY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
    }

    // Add Reimbursements
    if ((trip.toll || 0) > 0 || (trip.parking || 0) > 0 || (trip.permit || 0) > 0) {
        totalsY += 2;
        if ((trip.toll || 0) > 0) {
            doc.text('Toll Charges:', 135, totalsY);
            doc.text(`${trip.toll}`, 195, totalsY, { align: 'right' });
            reimbursements += trip.toll || 0;
            totalsY += 6;
        }
        if ((trip.parking || 0) > 0) {
            doc.text('Parking Charges:', 135, totalsY);
            doc.text(`${trip.parking}`, 195, totalsY, { align: 'right' });
            reimbursements += trip.parking || 0;
            totalsY += 6;
        }
        if ((trip.permit || 0) > 0) {
            doc.text('Permit Charges:', 135, totalsY);
            doc.text(`${trip.permit}`, 195, totalsY, { align: 'right' });
            reimbursements += trip.permit || 0;
            totalsY += 8;
        }
    }

    const finalTotal = taxableValue + gstValue + reimbursements;

    // Grand Total Box
    totalsY += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(130, totalsY - 6, 195, totalsY - 6);
    doc.line(130, totalsY + 4, 195, totalsY + 4);

    setThemeColor();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL', 135, totalsY);
    doc.text(`Rs. ${finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    totalsY += 12;

    // Use max Y from both sides
    y = Math.max(paymentY, totalsY) + 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    // Center the Rupees in Words
    doc.text(`RUPEES IN WORDS: ${numberToWords(finalTotal).toUpperCase()}`, 105, y, { align: 'center', maxWidth: 180 });
    doc.setTextColor(0, 0, 0);

    y = 252;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('For ' + companyName.toUpperCase(), 195, y, { align: 'right' });

    if (settings?.signatureUrl) {
        try {
            // Positioned clearly between lines (For @ 252, Auth @ 268)
            doc.addImage(settings.signatureUrl, 'PNG', 160, 253, 35, 14, undefined, 'FAST');
        } catch (e) {
            console.error('Failed to add signature image', e);
        }
    }

    // Removed blue line as requested

    y = 268;
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text('Receiver\'s Signature', margin, y);
    doc.text('Authorized Signatory', 195, y, { align: 'right' });

    // Footer Disclaimer - Centered
    y = 276;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('Subject to Chennai Jurisdiction. Computer generated invoice, no signature required.', 105, y, { align: 'center' }); // Centered

    y = 278;
    setDrawThemeColor();
    doc.setLineWidth(0.5);
    doc.line(margin, y, 195, y);
    y += 3; // Adjusted for logo

    // Only show watermark if enabled
    if (settings.showWatermark !== false) {
        try {
            // Brand Logo and Name in Footer
            doc.addImage('/logo.png', 'PNG', margin, y, 10, 10, undefined, 'FAST');

            doc.setFont('times', 'bold');
            doc.setFontSize(10);
            setThemeColor();
            doc.text('SARATHI BOOK', margin + 12, y + 4.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text('Your digital office on car', margin + 12, y + 8);

            doc.setFontSize(8);
            setThemeColor();
            doc.setFont('helvetica', 'bold');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            doc.text('sarathibook.com', 195, y + 6, { align: 'right', url: 'https://sarathibook.com' } as any);
            doc.link(175, y, 20, 10, { url: 'https://sarathibook.com' });
        } catch (e) {
            // Fallback if logo fails
            doc.setFontSize(7);
            setThemeColor();
            doc.setFont('helvetica', 'bold');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            doc.text('SARATHIBOOK.COM', 105, y + 2, {
                align: 'center',
                url: 'https://sarathibook.com'
            } as any);

            doc.setFontSize(4);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            doc.text('PROFESSIONAL CAB BUSINESS SUITE | AUTOMATE YOUR GROWTH', 105, y + 5, { align: 'center' });

            doc.link(90, y, 30, 5, { url: 'https://sarathibook.com' });
        }
    } else {
        // Just show a small subtle note or nothing
        doc.setFontSize(6);
        doc.setTextColor(200, 200, 200);
        doc.text('Professional Business Invoice', margin, y + 5);
    }

    return doc;
};



// Sustainable Quotation Design (Refactored to match Professional Letterhead Standard)
export const generateQuotationPDF = async (data: QuotationData, settings: PDFSettings) => {
    const { jsPDF } = await import('jspdf');
    // @ts-ignore
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const margin = 15;
    let y = 15;

    const companyName = String(settings?.companyName || 'YOUR Business Name');
    const companyAddress = String(settings?.companyAddress || '');
    const driverPhone = String(settings?.driverPhone || '');
    const gstin = String(settings?.gstin || '');

    // Theme Color (Standard Blue if not set)
    const themeColor = settings?.appColor || '#0047AB';
    const rgb = hexToRgb(themeColor);
    const setBrandColor = () => doc.setTextColor(rgb.r, rgb.g, rgb.b);
    const setBlack = () => doc.setTextColor(0, 0, 0);
    const setGray = () => doc.setTextColor(100, 100, 100);

    // --- 1. LETTERHEAD HEADER ---
    if (settings?.logoUrl) {
        try {
            doc.addImage(settings.logoUrl, 'PNG', margin, y - 5, 20, 20, undefined, 'FAST');
            setBrandColor();
            doc.setFont('times', 'bold');
            doc.setFontSize(24);
            doc.text(companyName.toUpperCase(), margin + 25, y + 5);
        } catch (e) {
            console.error('Failed to add custom logo to Quotation', e);
            setBrandColor();
            doc.setFont('times', 'bold');
            doc.setFontSize(24);
            doc.text(companyName.toUpperCase(), margin, y);
        }
    } else {
        // Company Name
        setBrandColor();
        doc.setFont('times', 'bold');
        doc.setFontSize(24);
        doc.text(companyName.toUpperCase(), margin, y);
    }

    // Address & Contact Block
    y += 8;
    setGray();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const addrLines = doc.splitTextToSize(companyAddress, 120);
    doc.text(addrLines, margin, y);

    y += (addrLines.length * 4) + 2;
    setBlack();
    doc.setFont('helvetica', 'bold');
    doc.text(`Contact : ${driverPhone}`, margin, y);
    if (gstin) {
        doc.text(`GSTIN : ${gstin}`, margin + 60, y);
    }

    // Divider
    y += 5;
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y, 210 - margin, y);

    // --- 2. QUOTATION INFO & RECIPIENT ---
    y += 8;

    // Header Title at Top
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    // doc.setCharSpace(1.5); // jsPDF sometimes glitches with centering + charSpace
    // Instead of charSpace, I used manual spaces above for simpler logic, or stick to standard:

    // Let's stick to standard but use dynamic center
    const centerX = pageWidth / 2;
    doc.text('QUOTATION', centerX, y, { align: 'center', charSpace: 2 });

    // Underline for Title - Calculate real width approximation since getTextWidth might not catch charSpace params in all versions
    // Width ~= StandardWidth + (Chars * Space)
    // Actually, let's just draw a fixed width line that looks good, e.g. 40mm
    doc.setLineWidth(0.3);
    doc.line(centerX - 18, y + 1.5, centerX + 18, y + 1.5);

    // Reset CharSpace if any (though passed as option above so it shouldn't persist, but let's be safe)

    y += 10;

    // Right Side: Date & Ref No
    const dateObj = new Date(data.date);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    const qNo = data.quotationNo || `QT/${mm}${yyyy}/001`;

    doc.setFontSize(10);
    doc.text(`Date : ${dateObj.toLocaleDateString('en-IN')}`, 210 - margin, y, { align: 'right' });
    y += 5;
    doc.text(`Ref No : ${qNo}`, 210 - margin, y, { align: 'right' });

    // Left Side: To Address
    y -= 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('To,', margin, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(toTitleCase(data.customerName || '[Client\'s Name]'), margin, y);

    if (data.customerAddress) {
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const addrText = formatAddress(data.customerAddress);
        const parts = addrText.split(',').map(p => p.trim());
        // Simple 3 line wrap
        const maxLines = 3;
        let currentLine = 0;
        let currentY = y;

        // Primitive wrapping for address
        let buffer = '';
        parts.forEach((part, i) => {
            if (currentLine >= maxLines) return;
            const newBuffer = buffer ? `${buffer}, ${part}` : part;
            if (doc.getTextWidth(newBuffer) > 90) { // Max width for address col
                doc.text(buffer + (i < parts.length - 1 ? ',' : ''), margin, currentY);
                currentY += 5;
                currentLine++;
                buffer = part;
            } else {
                buffer = newBuffer;
            }
        });
        if (buffer && currentLine < maxLines) {
            doc.text(buffer, margin, currentY);
            currentY += 5;
        }
        y = Math.max(y + 10, currentY);
    } else {
        y += 10;
    }

    if (data.customerGstin) {
        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`GSTIN: ${data.customerGstin}`, margin, y);
        y += 8;
    }

    // --- 3. SUBJECT ---
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);

    let subject = toTitleCase(data.subject).trim();
    // Removed automatic ' - Reg.' as requested

    // Check for multi-line format (indicated by separator)
    if (subject.includes('|')) {
        const parts = subject.split('|').map(s => s.trim());
        // Line 1: SUB : <First Part>
        doc.text(`SUB : ${parts[0]}`, 105, y, { align: 'center' });
        y += 5;
        // Subsequent Lines
        for (let i = 1; i < parts.length; i++) {
            doc.text(parts[i], 105, y, { align: 'center' });
            y += 5;
        }
    } else {
        // Standard Single Block
        const subText = `SUB : ${subject}`;
        const subLines = doc.splitTextToSize(subText, 180);
        doc.text(subLines, 105, y, { align: 'center' });
        y += (subLines.length * 5);
    }

    // --- 4. TABLE ---
    y += 12;

    const headers = ['S.No', 'Description of Service', 'Vehicle', 'Pkg', 'Qty', 'Rate', 'Amount'];
    const colWidths = [10, 65, 20, 20, 12, 20, 33]; // Total 180 (Fits nicely within A4 margins)
    const tableX = margin;

    // Table Header
    setBrandColor();
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.3);
    doc.rect(tableX, y, 180, 8, 'S'); // Stroke Header Box

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    let xVal = tableX;
    headers.forEach((h, i) => {
        // center align text in cell
        doc.text(h, xVal + (colWidths[i] / 2), y + 5.5, { align: 'center' });
        // Draw vertical line after cell (except last)
        if (i < headers.length - 1) {
            doc.line(xVal + colWidths[i], y, xVal + colWidths[i], y + 8);
        }
        xVal += colWidths[i];
    });

    y += 8; // Row Height

    // Table Body
    setBlack();
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200, 200, 200); // Lighter grid lines

    let totalAmount = 0;

    data.items.forEach((item, index) => {
        const rowTopY = y;

        // Content Formatting
        const descText = item.description;
        // Ensure strictly wrapped lines
        const descLines = doc.splitTextToSize(descText, colWidths[1] - 4);

        // Calculate Row Max Height
        const rowHeight = Math.max(8, (descLines.length * 5) + 4);

        // Check for page break
        if (y + rowHeight > 270) {
            doc.addPage();
            y = 20;
            // Draw Header again... simplified for now assuming single page quotation usually
        }

        // Draw Row Cells
        let x = tableX;

        // S.No
        doc.text((index + 1).toString(), x + (colWidths[0] / 2), y + 5, { align: 'center' });
        x += colWidths[0];

        // Description
        // Explicitly align left to prevent justification artifacts and ensure wrapping
        doc.text(descLines, x + 2, y + 5, { align: 'left' });
        x += colWidths[1];

        // Vehicle
        doc.text(String(item.vehicleType || '-'), x + (colWidths[2] / 2), y + 5, { align: 'center' });
        x += colWidths[2];

        // Package
        const pkgText = doc.splitTextToSize(String(item.package || '-'), colWidths[3] - 4);
        doc.text(pkgText, x + (colWidths[3] / 2), y + 5, { align: 'center' });
        x += colWidths[3];

        // Qty
        doc.text(String(item.quantity || 1), x + (colWidths[4] / 2), y + 5, { align: 'center' });
        x += colWidths[4];

        // Rate
        doc.text(String(item.rate || ''), x + (colWidths[5] / 2), y + 5, { align: 'center' });
        x += colWidths[5];

        // Amount
        const amt = parseFloat(item.amount) || 0;
        doc.text(`${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, x + (colWidths[6] / 2), y + 5, { align: 'center' });
        totalAmount += amt;

        // Vertical Lines for this row
        doc.setDrawColor(220, 220, 220); // Light gray
        let vx = tableX;
        colWidths.forEach((cw, i) => {
            if (i < colWidths.length - 1) { // Skip last right edge
                doc.line(vx + cw, rowTopY, vx + cw, rowTopY + rowHeight);
            }
            vx += cw;
        });

        // Box around the row
        doc.rect(tableX, rowTopY, 180, rowHeight);

        y += rowHeight;
    });

    // --- 5. TOTALS SECTION ---
    y += 5;

    // We'll put Totals on the right

    // Separate Taxable and Exempt Amounts
    let taxableAmount = 0;
    let exemptAmount = 0;

    data.items.forEach(item => {
        const amt = parseFloat(item.amount) || 0;
        // Use explicit flag, default to TRUE if undefined
        if (item.taxable === false) {
            exemptAmount += amt;
        } else {
            taxableAmount += amt;
        }
    });

    const alignX = tableX + 180 - (33 / 2); // Center of Last Column (Width 33)

    // Show Taxable Value
    doc.setFont('helvetica', 'normal');
    doc.text('Taxable Value', 135, y);
    doc.text(taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), alignX, y, { align: 'center' });
    y += 6;

    // Show Exempt Value if any
    if (exemptAmount > 0) {
        doc.text('Reimbursements', 135, y);
        doc.text(exemptAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), alignX, y, { align: 'center' });
        y += 6;
    }

    // RCM / GST Logic
    let gstAmt = 0;

    if (data.rcmEnabled) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Tax Payable on RCM :', 135, y);
        doc.text('YES', alignX, y, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9); // Reset
        y += 6;
    } else if (data.gstEnabled) {
        gstAmt = (taxableAmount * 0.05);

        // Determine Inter-state (IGST) or Intra-state (CGST+SGST)
        const driverStateCode = settings.gstin ? settings.gstin.substring(0, 2) : '33'; // Default to TN (33)
        const clientStateCode = data.customerGstin ? data.customerGstin.substring(0, 2) : '';

        const isInterState = clientStateCode && driverStateCode !== clientStateCode;

        if (isInterState) {
            doc.text('IGST (5%)', 135, y);
            doc.text(gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }), alignX, y, { align: 'center' });
            y += 6;
        } else {
            const halfGst = gstAmt / 2;
            doc.text('CGST (2.5%)', 135, y);
            doc.text(halfGst.toLocaleString('en-IN', { minimumFractionDigits: 2 }), alignX, y, { align: 'center' });
            y += 6;
            doc.text('SGST (2.5%)', 135, y);
            doc.text(halfGst.toLocaleString('en-IN', { minimumFractionDigits: 2 }), alignX, y, { align: 'center' });
            y += 6;
        }
    }

    // Line
    doc.line(130, y - 2, alignX + 15, y - 2); // Underline extending a bit

    // Net Amount
    const netAmount = totalAmount + gstAmt;
    setBrandColor();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL AMOUNT', 135, y + 2);
    doc.text(netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), alignX, y + 2, { align: 'center' });
    y += 10;
    setBlack();

    // Amount in Words
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(`( ${numberToWords(netAmount).toUpperCase()} )`, alignX + 15, y, { align: 'right' });

    // --- 6. TERMS & FOOTER ---
    // Render Terms only if available
    if (data.terms && data.terms.length > 0) {
        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Terms & Conditions:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');

        data.terms.forEach(t => {
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(t, 180);
            doc.text(lines, margin, y);
            y += (lines.length * 4.5);
        });
    } else {
        // Just add some spacing if no terms
        y += 10;
    }

    // Bank Details (If available)
    if (settings.bankName && settings.accountNumber) {
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Bank Details:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`Bank: ${settings.bankName}`, margin, y);
        y += 4;
        doc.text(`A/c No: ${settings.accountNumber}`, margin, y);
        y += 4;
        doc.text(`IFSC: ${settings.ifscCode}`, margin, y);
        y += 6; // Space after bank details
    }

    // Thank You Message
    y += 10;
    setBrandColor();
    doc.setFontSize(12);
    doc.setFont('times', 'italic');
    doc.text('Thank You', 105, y, { align: 'center' });
    setBlack();

    // Signature
    // Ensure we have space at bottom but don't force it too far down if not needed
    if (y > 230) {
        doc.addPage();
        y = 20;
    } else {
        y += 15; // Small gap after Thank You
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`For ${companyName}`, 210 - margin, y, { align: 'right' });
    y += 15;

    if (settings?.signatureUrl) {
        try {
            doc.addImage(settings.signatureUrl, 'PNG', 160, y - 12, 35, 12, undefined, 'FAST');
        } catch (e) { }
    }

    doc.text('Authorized Signatory', 210 - margin, y, { align: 'right' });

    // --- FOOTER PROMOTION ---
    const footerY = 280;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, 210 - margin, footerY);

    if (settings.showWatermark !== false) {
        try {
            // Brand Logo and Name in Footer
            doc.addImage('/logo.png', 'PNG', margin, footerY + 3, 8, 8, undefined, 'FAST');

            doc.setFont('times', 'bold');
            doc.setFontSize(9);
            setBrandColor();
            doc.text('SARATHI BOOK', margin + 10, footerY + 7);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5);
            setGray();
            doc.text('Your digital office on car', margin + 10, footerY + 10);

            doc.setFontSize(7);
            setBrandColor();
            doc.setFont('helvetica', 'bold');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            doc.text('sarathibook.com', 210 - margin, footerY + 8, { align: 'right', url: 'https://sarathibook.com' } as any);
            doc.link(180, footerY + 2, 20, 10, { url: 'https://sarathibook.com' });
        } catch (e) { }
    } else {
        doc.setFontSize(6);
        doc.setTextColor(200, 200, 200);
        doc.text('Professional Business Document', 105, footerY + 7, { align: 'center' });
    }

    return doc;
};


// --- HELPER ---
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 71, b: 171 }; // Default blue
};

export const shareReceipt = async (trip: Trip, settings: PDFSettings) => {
    const doc = await generateReceiptPDF(trip, settings);
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `Invoice_${trip.customerName?.replace(/\s/g, '_') || 'Trip'}.pdf`, { type: 'application/pdf' });

    if (navigator.share) {
        navigator.share({
            files: [file],
            title: 'Trip Invoice',
            text: `Invoice for trip by ${trip.customerName}`
        }).catch(err => {
            console.error('Error sharing invoice:', err);
            doc.save(`Invoice_${trip.customerName?.replace(/\s/g, '_') || 'Trip'}.pdf`);
        });
    } else {
        doc.save(`Invoice_${trip.customerName?.replace(/\s/g, '_') || 'Trip'}.pdf`);
    }
};

export const shareQuotation = async (data: QuotationData, settings: PDFSettings) => {
    const doc = await generateQuotationPDF(data, settings);
    const pdfBlob = doc.output('blob');
    const qLabel = data.quotationNo ? data.quotationNo.replace(/\//g, '-') : new Date().getTime();
    const filename = `Quotation_${data.customerName.replace(/\s/g, '_')}_${qLabel}.pdf`;
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    if (navigator.share) {
        try {
            await navigator.share({
                files: [file],
                title: 'Trip Quotation',
                text: `Quotation for ${data.customerName} - ${data.subject}`
            });
        } catch (err) {
            console.error('Error sharing quotation:', err);
            doc.save(filename);
        }
    } else {
        doc.save(filename);
    }
};


export interface Expense {
    category: string;
    amount: number;
    [key: string]: any;
}

export const generateFinancialReportPDF = async (trips: Trip[], expenses: Expense[], settings: PDFSettings, periodLabel: string) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ compress: true });
    const margin = 15;
    let y = 15;
    const themeColor = settings?.appColor || '#0047AB';
    const rgb = hexToRgb(themeColor);
    const setThemeColor = () => doc.setTextColor(rgb.r, rgb.g, rgb.b);
    const setDrawColor = () => doc.setDrawColor(rgb.r, rgb.g, rgb.b);

    // --- HEADER ---
    setThemeColor();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text((settings?.companyName || 'MY BUSINESS').toUpperCase(), margin, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 195, 20, { align: 'right' });

    // --- QR CODE (Business Profile) ---
    if (settings.userId) {
        try {
            const QRCode = await import('qrcode'); // Dynamic Import
            const publicUrl = `${window.location.origin}/?u=${settings.userId}`;
            const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 100 });
            doc.addImage(qrDataUrl, 'PNG', 170, 8, 18, 18, undefined, 'FAST');
        } catch (e) {
            console.error('QR Generation failed', e);
        }
    }

    y = 30;
    setDrawColor();
    doc.setLineWidth(0.6);
    doc.line(margin, y, 195, y);

    y += 10;
    setThemeColor();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('STATEMENT OF ACCOUNTS', 105, y, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Period: ${periodLabel}`, 105, y + 6, { align: 'center' });

    // --- FINANCIAL SUMMARY ---
    y += 20;
    const totalIncome = trips.reduce((sum, t) => sum + t.totalFare, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpense;

    doc.setFillColor(rgb.r, rgb.g, rgb.b, 0.05);
    doc.rect(margin, y, 180, 40, 'F');
    setDrawColor();
    doc.rect(margin, y, 180, 40, 'S');

    y += 10;
    setThemeColor();
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL SUMMARY', margin + 5, y);

    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text('Total Income (Revenue)', margin + 10, y);
    doc.text(`${totalIncome.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`, 185, y, { align: 'right' });

    y += 8;
    doc.text('Total Expenses', margin + 10, y);
    doc.text(`- ${totalExpense.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`, 185, y, { align: 'right' });

    y += 10;
    doc.setLineWidth(0.3);
    doc.line(margin + 5, y - 5, 185, y - 5);
    setThemeColor();
    doc.setFontSize(12);
    doc.text('NET PROFIT / (LOSS)', margin + 10, y);
    doc.text(`${netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`, 185, y, { align: 'right' });

    // --- INCOME BREAKDOWN (Simplified) ---
    y += 25;
    setThemeColor();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INCOME STATISTICS', margin, y);
    doc.line(margin, y + 2, 195, y + 2);

    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Trips Completed: ${trips.length}`, margin, y);
    y += 6;
    const totalKms = trips.reduce((sum, t) => sum + (t.endKm - t.startKm), 0);
    doc.text(`Total Distance Covered: ${totalKms.toLocaleString()} KM`, margin, y);

    // --- EXPENSE BREAKDOWN ---
    y += 15;
    setThemeColor();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('EXPENSE BREAKDOWN', margin, y);
    doc.line(margin, y + 2, 195, y + 2);
    y += 10;

    // Group expenses properly
    const catTotals: Record<string, number> = {};
    expenses.forEach(e => {
        catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });

    const categories = Object.keys(catTotals);
    if (categories.length === 0) {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.text('No expenses recorded for this period.', margin, y);
    } else {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        categories.forEach(cat => {
            doc.text(cat.toUpperCase(), margin, y);
            doc.text(`${catTotals[cat].toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`, 195, y, { align: 'right' });
            y += 6;
        });
    }

    // --- FOOTER ---
    y = 278;
    setDrawColor();
    doc.setLineWidth(0.5);
    doc.line(margin, y, 195, y);
    y += 4;

    doc.setFontSize(7);
    setThemeColor();
    doc.setFont('helvetica', 'bold');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc.text('SARATHIBOOK.COM', 105, y + 2, {
        align: 'center',
        url: 'https://sarathibook.com'
    } as any);

    doc.setFontSize(4);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('PROFESSIONAL CAB BUSINESS SUITE | AUTOMATE YOUR GROWTH', 105, y + 5, { align: 'center' });

    doc.link(90, y, 30, 5, { url: 'https://sarathibook.com' });

    return doc;
};

export const shareFinancialReport = async (trips: Trip[], expenses: Expense[], settings: PDFSettings, periodLabel: string) => {
    const doc = await generateFinancialReportPDF(trips, expenses, settings, periodLabel);
    const pdfBlob = doc.output('blob');
    const filename = `Financial_Report_${periodLabel.replace(/\s/g, '_')}_${new Date().getTime()}.pdf`;
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    if (navigator.share) {
        try {
            await navigator.share({
                files: [file],
                title: 'Business Financial Report',
                text: `Find attached the financial statement for ${periodLabel}`
            });
        } catch (err) {
            console.error('Error sharing report:', err);
            doc.save(filename);
        }
    } else {
        doc.save(filename);
    }
};
