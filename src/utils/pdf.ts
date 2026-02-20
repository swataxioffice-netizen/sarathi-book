import { type Trip } from './fare';
import { numberToWords } from './numberToWords';
import { toTitleCase, formatAddress } from './stringUtils';

import { getFinancialYear } from './gstUtils';
import type { Staff, Vehicle } from '../types/settings';


export interface PDFSettings {
    companyName: string;
    companyAddress: string;
    driverPhone: string;
    gstin: string;
    vehicleNumber: string;
    gstEnabled: boolean;
    vehicles?: Vehicle[];
    driverCode?: number;
    signatureUrl?: string;
    userId?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    holderName?: string;
    branchName?: string;
    upiId?: string;
    preferredPaymentMethod?: 'upi' | 'bank';
    appColor?: string;
    logoUrl?: string;
    showWatermark?: boolean;
    rcmEnabled?: boolean;
    showUpiOnPdf?: boolean;
    showBankOnPdf?: boolean;
    secondaryPhone?: string;
    companyEmail?: string;
}

export interface QuotationItem {
    description: string;
    package: string;
    vehicleType: string;
    rate: string;
    quantity?: number; // Added for auto-calculation
    amount: string;
    taxable?: boolean;
    sac?: string;
}

export interface QuotationData {
    customerName: string;
    customerAddress?: string;
    customerGstin?: string;
    subject: string;
    pickup?: string;
    drop?: string;
    startTime?: string; // Added for Local Package
    endTime?: string;   // Added for Local Package
    date: string;
    items: QuotationItem[];
    gstEnabled?: boolean;
    gstRate?: number; // Added
    gstType?: 'IGST' | 'CGST_SGST'; // Added
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
    gstRate?: number; // Added
    gstType?: 'IGST' | 'CGST_SGST'; // Added
    rcmEnabled?: boolean;
    terms?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateReceiptPDF = async (trip: any, settings: PDFSettings, isQuotation: boolean = false, existingDoc?: InstanceType<typeof import('jspdf').jsPDF>) => {
    const t = trip as Trip;
    const q = trip as SavedQuotation;
    // Dynamic Import for Code Splitting
    const { jsPDF } = await import('jspdf');

    let doc = existingDoc;
    if (!doc) {
        doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    }

    const margin = 15;
    let y = 0;

    // Safety checks for settings
    const companyName = String(settings?.companyName || 'SARATHI BOOK OWNER');
    const driverPhone = String(settings?.driverPhone || '');
    const gstin = settings?.gstin ? String(settings.gstin).toUpperCase() : '';
    const vehicleNumber = isQuotation ? 'N/A' : String((trip as Trip).vehicleNumber || settings?.vehicleNumber || (trip.mode === 'custom' ? '' : 'N/A'));
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

    // Dynamic height calculation for Address
    const addressY = 28;
    const addressLines = doc.splitTextToSize(companyAddress, 100);
    doc.text(addressLines, margin, addressY);

    // Position Contact info below address
    const contactY = addressY + (addressLines.length * 4.5) + 1; // 4.5mm per line + 1mm gap

    doc.setFontSize(10);
    doc.text(`Contact: ${driverPhone}${gstin ? `  |  GSTIN: ${gstin}` : ''}`, margin, contactY);
    if (settings?.driverCode) {
        doc.text(`Driver ID: #${settings.driverCode}`, 195, contactY, { align: 'right' });
    }

    // Divider Line
    const dividerY = contactY + 3;
    setDrawThemeColor();
    doc.setLineWidth(0.6);
    doc.line(margin, dividerY, 195, dividerY);
    doc.setDrawColor(200, 200, 200); // Reset

    // --- ZONE 2: INVOICE DETAILS & CUSTOMER INFO (Merged) ---
    y = dividerY + 8; // Margin after divider

    // 1. Center Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    if (isQuotation) {
        doc.text('QUOTATION / PROFORMA', 105, y, { align: 'center' });
    } else {
        const isRegistered = !!gstin;
        const title = (isRegistered && gstEnabled) ? 'TAX INVOICE' : (trip.mode === 'custom' ? 'INVOICE' : 'TRIP RECEIPT');
        doc.text(title, 105, y, { align: 'center' });
    }

    // Move Y down for content
    y += 10;
    const contentStartY = y;

    // LEFT COLUMN: BILL TO & JOURNEY (Now moved up)
    const leftColX = margin;

    // BILL TO Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', leftColX, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFont('helvetica', 'normal');
    // doc.text(toTitleCase(String(trip.customerName || 'Customer')), leftColX, y);
    const billToName = toTitleCase(String(trip.customerName || 'Customer'));
    const billToLines = doc.splitTextToSize(billToName, 90);
    doc.text(billToLines, leftColX, y);
    y += (billToLines.length * 5); // Dynamic gap

    if (trip.billingAddress) {
        doc.setFontSize(9);
        const addrText = formatAddress(String(trip.billingAddress));
        // Split by comma for cleaner lines, limit to 2 lines max here to save space
        const parts = addrText.split(',').map(p => p.trim());
        const displayAddr = parts.join(', ');
        const addrLines = doc.splitTextToSize(displayAddr, 90); // 90mm width
        doc.text(addrLines.slice(0, 2), leftColX, y);
        y += (Math.min(addrLines.length, 2) * 5) + 2;
    }

    if (trip.customerPhone) {
        doc.setFontSize(9);
        doc.text(`Ph: ${trip.customerPhone}`, leftColX, y);
        y += 5;
    }

    if (trip.customerGst) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`GSTIN: ${String(trip.customerGst).toUpperCase()}`, leftColX, y);
        y += 6;
    }

    // PICKUP & DROP Section (Stretched, One line each)
    const hasFrom = !isQuotation && t.from && t.from !== 'N/A';
    const hasTo = !isQuotation && t.to && t.to !== 'N/A';
    const hasTime = !isQuotation && (t.startTime || t.endTime);
    const hasDist = !isQuotation && ((t.startKm && t.endKm) || t.distance || t.effectiveDistance);

    if (hasFrom || hasTo || hasTime || hasDist) {
        y += 4; // Gap between Bill To and Trip Details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('JOURNEY DETAILS:', leftColX, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        // 2. Pickup
        if (hasFrom) {
            const fromAddr = String(t.from).replace(/, India$/, '').replace(/, Tamil Nadu$/, '');
            const pickupText = `Pickup: ${fromAddr}`;
            const pickupLines = doc.splitTextToSize(pickupText, 95);
            doc.text(pickupLines, leftColX, y);
            y += (pickupLines.length * 5);
        }

        // 3. Drop / Time logic
        if (hasTime) {
            const sTime = t.startTime || 'N/A';
            const eTime = t.endTime || 'N/A';

            const sLines = doc.splitTextToSize(`Start Time: ${sTime}`, 95);
            doc.text(sLines, leftColX, y);
            y += (sLines.length * 5);

            const eLines = doc.splitTextToSize(`End Time:   ${eTime}`, 95);
            doc.text(eLines, leftColX, y);
            y += (eLines.length * 5);
        } else if (hasTo) {
            const toAddr = String(t.to).replace(/, India$/, '').replace(/, Tamil Nadu$/, '');
            const dropText = `Drop:   ${toAddr}`;
            const dropLines = doc.splitTextToSize(dropText, 95);
            doc.text(dropLines, leftColX, y);
            y += (dropLines.length * 5);
        }

        // 4. Distance
        let distStr = '';
        if (t.startKm && t.endKm) {
            distStr = `Distance: ${(t.endKm - t.startKm).toFixed(1)} km`;
        } else if (t.distance || t.effectiveDistance) {
            distStr = `Distance: ${t.distance || t.effectiveDistance} km`;
        }

        if (distStr) {
            doc.text(distStr, leftColX, y);
            y += 5;
        }
    }

    const leftEndY = y + 2;


    // RIGHT COLUMN: INVOICE DATA (Kept on Right, parallel to Left Col)
    y = contentStartY; // Reset Y to top of section for right column rendering
    const rightAlignX = 195;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Standard GST Format: INV/FY/SEQ (e.g., INV/25-26/001)
    const date = new Date(trip.date || Date.now());
    const fy = getFinancialYear(date);
    const prefix = `INV/${fy}/`;

    let invoiceNo = '';
    if (!isQuotation && t.invoiceNo && (t.invoiceNo.includes('/') || t.invoiceNo.startsWith('INV-'))) {
        invoiceNo = t.invoiceNo; // Use valid pre-existing sequence directly
    } else {
        const serialPart = (trip.id || '000').substring(0, 3).toUpperCase();
        invoiceNo = isQuotation
            ? (q.quotationNo || `QTN/${fy}/${serialPart}`)
            : `${prefix}${serialPart}`;
    }

    doc.text(`${isQuotation ? 'Quotation' : 'Invoice'} No: ${invoiceNo}`, rightAlignX, y, { align: 'right' });

    y += 5;
    let dateStr = 'N/A';
    try {
        const d = new Date(trip.date || Date.now());
        dateStr = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN');
    } catch {
        // Fallback to current date
        dateStr = new Date().toLocaleDateString('en-IN');
    }
    doc.text(`Date: ${dateStr}`, rightAlignX, y, { align: 'right' });

    y += 5;
    if (isQuotation) {
        // For Quotation, show "Valid Until" or "Vehicle Class" instead of specific Number
        const vType = (trip as SavedQuotation).vehicleType || 'Any';
        doc.text(`Vehicle Class: ${vType}`, rightAlignX, y, { align: 'right' });
    } else {
        doc.text(`Vehicle No: ${vehicleNumber}`, rightAlignX, y, { align: 'right' });
    }
    y += 5;
    // RCM Check
    let isRcm = false;
    if (settings.rcmEnabled) isRcm = true;
    if ((trip as Trip).rcmEnabled !== undefined) isRcm = !!(trip as Trip).rcmEnabled;

    if (gstEnabled || isRcm) {
        doc.text(`Place of Supply: Tamil Nadu (33)`, rightAlignX, y, { align: 'right' });
        y += 5;
    }

    if (isRcm && !gstEnabled) {
        doc.text(`Tax Payable on Reverse Charge: YES`, rightAlignX, y, { align: 'right' });
    } else {
        doc.text(`Tax Payable on Reverse Charge: NO`, rightAlignX, y, { align: 'right' });
    }

    const rightEndY = y + 5;


    // Set Y to the max of both columns for the table to start
    y = Math.max(leftEndY, rightEndY) + 5;

    // Subject Line (Centered above table)
    const tSubject = (t as unknown as { subject?: string }).subject;
    if (tSubject) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const subjectLines = doc.splitTextToSize(`Subject: ${tSubject}`, 180);
        doc.text(subjectLines, 105, y, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        y += (subjectLines.length * 5) + 3; // Dynamic height + padding
    }

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
    const addTableRow = (label: string, qty: string, rate: string, amount: number, sac: string = '9966') => {
        const safeAmount = isNaN(amount) ? 0 : amount;

        // Description wrapping
        const descLines = doc.splitTextToSize(label, 75); // Reduced width for Desc to fit SAC
        doc.text(descLines, margin + 2, y);

        doc.text(sac, 95, y); // SAC Code Fixed
        doc.text(qty, 115, y);
        doc.text(rate, 145, y);
        doc.text(`${safeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, y, { align: 'right' });

        runningSubtotal += safeAmount;
        y += Math.max(8, descLines.length * 5); // Dynamic height
    };

    // --- PRINT PRE-CALCULATED ITEMS ---
    const pStep = (t as unknown as { previewStep?: number }).previewStep || 4;
    const dist = t.distance !== undefined ? t.distance : Math.max(0, (t.endKm || 0) - (t.startKm || 0));
    const effectiveDist = t.effectiveDistance || dist;

    // Logic: distanceCharge is the basic trip/KM cost. fare is the total taxable subtotal.
    let mainAmount = t.distanceCharge;
    const hasExplicitDistanceCharge = mainAmount !== undefined;

    if (!hasExplicitDistanceCharge) {
        mainAmount = (t.fare || 0);
    }

    if (pStep >= 2 || (t.mode === 'custom' && pStep >= 1)) {
        if (t.mode === 'custom') {
            if (t.extraItems && t.extraItems.length > 0) {
                t.extraItems.forEach(item => {
                    const iQty = (item as unknown as { quantity?: number }).quantity || '1';
                    const iRate = (item as unknown as { rate?: number }).rate ? `${(item as unknown as { rate?: number }).rate}` : `${item.amount}`;
                    const iSac = (item as unknown as { sac?: string }).sac || '9966';
                    addTableRow(item.description || 'Service Charge', String(iQty), iRate, item.amount || 0, iSac);
                });
            } else if (hasExplicitDistanceCharge || t.fare) {
                addTableRow('Custom Invoice', '1', `${mainAmount}`, mainAmount || 0);
            }
        } else if (t.mode === 'hourly') {
            const hrs = t.waitingHours || 8;
            // Hourly usually has fixed package price, rate is package price
            addTableRow(`Local Rental / Hourly Package (${hrs} Hrs)`, '1', `${mainAmount || 0}`, mainAmount || 0);
        } else if (t.mode === 'package') {
            addTableRow(String(t.packageName || 'TOUR PACKAGE').toUpperCase(), '1', `${t.packagePrice || 0}`, t.packagePrice || 0);
        } else if (t.mode === 'drop') {
            if (dist <= 40) {
                addTableRow(`Local Drop Trip`, '1', `${mainAmount || 0}`, mainAmount || 0);
            } else {
                // Determine rate used
                const rateUsed = (t as unknown as { rateUsed?: number }).rateUsed || (t.ratePerKm) || ((mainAmount || 0) / (effectiveDist || 1));
                const pRate = isNaN(rateUsed) ? '-' : `${parseFloat(String(rateUsed)).toFixed(1)}/KM`;

                // For Outstation Drop, it's min dist * rate
                const calcDesc = `${effectiveDist} KM * ${pRate}`;
                addTableRow(`Outstation Drop Trip [${calcDesc}]`, `${effectiveDist} KM`, pRate, mainAmount || 0);
            }
        } else if (t.mode === 'outstation') {
            // Determine rate used
            const rateUsed = (t as unknown as { rateUsed?: number }).rateUsed || (t.ratePerKm) || ((mainAmount || 0) / (effectiveDist || 1));
            const pRate = isNaN(Number(rateUsed)) ? '-' : `${parseFloat(String(rateUsed)).toFixed(1)}/KM`;
            const calcDesc = `${effectiveDist} KM * ${pRate}`;
            addTableRow(`Round Trip [${calcDesc}]`, `${effectiveDist} KM`, pRate, mainAmount || 0);
        }
    }

    if (pStep >= 3) {
        // Only add these IF they weren't already bundled into 'mainAmount' (legacy fallback case)
        const shouldAddIndividual = hasExplicitDistanceCharge;

        if (shouldAddIndividual) {
            // Night Batta
            if ((t.nightBata || 0) > 0) {
                const payDays = (t.mode === 'outstation' ? t.days : 1) || 1;
                const perNightBatta = (t.nightBata || 0) / payDays;
                const nLabel = payDays > 1 ? `Night Allowance (${payDays} Nights * ${perNightBatta}/Night)` : 'Night Allowance';
                addTableRow(nLabel, `${payDays}`, `${perNightBatta}`, t.nightBata || 0);
            }

            // Driver Batta
            if ((t.driverBatta || 0) > 0) {
                const payDays = (t.mode === 'outstation' ? t.days : 1) || 1;
                const perDayBatta = (t.driverBatta || 0) / payDays;
                const bLabel = payDays > 1 ? `Driver Batta (${payDays} Days * ${perDayBatta}/Day)` : `Driver Batta`;
                addTableRow(bLabel, `${payDays}`, `${perDayBatta}`, t.driverBatta || 0);
            }

            // Night Stay
            if ((t.nightStay || 0) > 0) {
                addTableRow('Night Stay Charge', '1', `${t.nightStay}`, t.nightStay || 0);
            }

            if ((t.waitingCharges || 0) > 0) {
                const wRate = (t.waitingCharges || 0) / (t.waitingHours || 1);
                addTableRow(`Waiting Charges (${t.waitingHours} Hrs * ${wRate}/Hr)`, `${t.waitingHours} Hrs`, `${wRate}/Hr`, t.waitingCharges || 0);
            }
            if ((t.hillStationCharges || 0) > 0) addTableRow('Hill Station Charges', '1', `${t.hillStationCharges}`, t.hillStationCharges || 0);
            if ((t.petCharges || 0) > 0) addTableRow('Pet Carrying Charges', '1', `${t.petCharges}`, t.petCharges || 0);
        }

        // Tolls/Permits/Parking are ALWAYS separate even in legacy? No, usually they were separate fields.
        if ((t.permit || 0) > 0) addTableRow('Permit Charges', '1', `${t.permit}`, t.permit || 0);
        if ((t.parking || 0) > 0) addTableRow('Parking Charges', '1', `${t.parking}`, t.parking || 0);
        if ((t.toll || 0) > 0) addTableRow('Toll Charges', '1', `${t.toll}`, t.toll || 0);

        // Custom extra items from step 3
        if (t.extraItems && t.mode !== 'custom') {
            t.extraItems.forEach(item => {
                const iSac = (item as unknown as { sac?: string }).sac || '9966';
                if (item.amount > 0) addTableRow(item.description || 'Extra Item', '1', '-', item.amount, iSac);
            });
        }
    }





    // --- TOTALS & PAYMENT SECTION (Side-by-Side) ---
    // Reimbursements are now 0 as they are included in Taxes
    const reimbursements = 0;

    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 195, y); // Start of new section
    y += 8;

    const sectionsStartY = y;

    // 1. Render Payment Details (Left Side)
    let paymentY = sectionsStartY;
    if (settings.holderName || settings.upiId || settings.accountNumber) {
        doc.setFontSize(9);
        setThemeColor();
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT DETAILS:', margin, paymentY);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        paymentY += 5;

        const isBank = !!settings.showBankOnPdf;
        const isUpi = !!settings.showUpiOnPdf;

        if (isBank && settings.bankName) {
            doc.text(`Bank Name    : ${settings.bankName}`, margin, paymentY);
            paymentY += 4;
        }
        if (isBank && settings.accountNumber) {
            doc.text(`Account No   : ${settings.accountNumber}`, margin, paymentY);
            paymentY += 4;
        }
        if (isBank && settings.ifscCode) {
            doc.text(`IFSC Code    : ${settings.ifscCode}`, margin, paymentY);
            paymentY += 4;
        }
        if (isUpi && settings.upiId) {
            doc.text(`UPI ID       : ${settings.upiId}`, margin, paymentY);
            paymentY += 4;
        }
        if ((isBank || isUpi) && settings.holderName) {
            doc.text(`A/C Holder   : ${settings.holderName}`, margin, paymentY);
            paymentY += 4;
        }
    }

    // 2. Render Totals (Right Side) - USE VALUES FROM ENGINE DIRECTLY
    let totalsY = sectionsStartY;
    const taxableValue = t.fare !== undefined ? t.fare : runningSubtotal;
    const gstValue = pStep >= 4 ? (t.gst || 0) : 0;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Taxable Amount:', 135, totalsY);
    doc.text(`${taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
    totalsY += 8;

    const isDriverRegistered = !!gstin;

    if (isDriverRegistered && gstValue > 0) {
        const rate = t.gstRate || 5;
        const isIgst = t.gstType === 'IGST';

        if (isIgst) {
            doc.text(`IGST (${rate}%):`, 135, totalsY);
            doc.text(`${gstValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
            totalsY += 8;
        } else {
            const halfRate = rate / 2;
            const halfGst = gstValue / 2;
            doc.text(`CGST (${halfRate}%):`, 135, totalsY);
            doc.text(`${halfGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
            totalsY += 6;
            doc.text(`SGST (${halfRate}%):`, 135, totalsY);
            doc.text(`${halfGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
            totalsY += 8;
        }
    } else if ((settings.rcmEnabled || (t.rcmEnabled)) && !gstEnabled) {
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

    const finalTotal = trip.totalFare !== undefined ? trip.totalFare : (taxableValue + gstValue + reimbursements);

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

    y = Math.max(paymentY, totalsY) + 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    // Center the Rupees in Words
    doc.text(`RUPEES IN WORDS: ${numberToWords(finalTotal).toUpperCase()}`, 105, y, { align: 'center', maxWidth: 180 });
    doc.setTextColor(0, 0, 0);

    // --- TERMS & CONDITIONS ---
    if ((isQuotation ? q.terms : t.terms) && ((isQuotation ? q.terms : t.terms) || []).length > 0) {
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('TERMS & CONDITIONS:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        const terms = (isQuotation ? q.terms : t.terms) || [];
        terms.forEach((term: string) => {
            const bullet = '•';
            const cleanTerm = term.replace(/^•\s*/, ''); // Remove existing bullet if any
            const termLines = doc.splitTextToSize(`${bullet} ${cleanTerm}`, 180);
            doc.text(termLines, margin + 2, y);
            y += (termLines.length * 4) + 1;
        });
    }

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
    doc.text('Computer generated invoice, no signature required.', 105, y, { align: 'center' }); // Centered

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
        } catch {
            // Fallback if logo fails
            doc.setFontSize(7);
            setThemeColor();
            doc.setFont('helvetica', 'bold');

            doc.text('SARATHIBOOK.COM', 105, y + 2, {
                align: 'center',
                url: 'https://sarathibook.com'
            } as Record<string, unknown>);

            doc.setFontSize(4);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            doc.text('PROFESSIONAL CAB PRO FEATURES | AUTOMATE YOUR GROWTH', 105, y + 5, { align: 'center' });

            doc.link(90, y, 30, 5, { url: 'https://sarathibook.com' });
        }
    } else {
        // Just show nothing or a very small spacer if needed, but the request is to remove it.
    }

    return doc;
};



// Sustainable Quotation Design (Refactored to match Professional Letterhead Standard)
export const generateQuotationPDF = async (data: QuotationData, settings: PDFSettings) => {
    // Map QuotationData to Trip format to reuse the Receipt Generator
    const tripData: Record<string, unknown> = {
        id: 'QUOTATION',
        invoiceNo: data.quotationNo,
        date: data.date,
        customerName: data.customerName,
        customerAddress: data.customerAddress, // mapped to billingAddress logic if needed
        billingAddress: data.customerAddress,
        customerGst: data.customerGstin,
        from: data.pickup, // Correctly mapped
        to: data.drop,     // Correctly mapped
        startTime: data.startTime, // Map Start Time
        endTime: data.endTime,     // Map End Time
        subject: data.subject, // Passed for separate rendering
        // Better: Let's put Subject as the main "Description" line in the items table or as a specialized field.
        // Actually, generateReceiptPDF displays 'from' and 'to' in Journey Details.
        // For Quotation, 'to' (Client) is already in Bill To.
        // 'from' usually is empty or meaningless.
        // Let's repurpose 'from' to show 'Subject' if it's a quote?
        // In generateReceiptPDF: "Pickup: {trip.from}"
        // So it will show: "Pickup: Subject: ...". A bit weird.
        // Maybe we leave 'from/to' empty or dashed?

        // Let's set 'from' to the Subject directly, so it shows "Pickup: <Subject>" -> User might not like "Pickup:" label.
        // Limitation: generateReceiptPDF hardcodes "Pickup:" and "Drop:".
        // Use blank for now, relying on the Bill To section.
        // Removed override of 'to' property to allow data.drop mapping

        mode: 'custom',

        // Map items to extraItems so they appear in table
        extraItems: data.items.map(item => ({
            description: `${item.description} ${item.package ? `(${item.package})` : ''}`,
            amount: parseFloat(item.amount) || 0,
            rate: item.rate,
            quantity: item.quantity || 1,
            sac: item.sac || '9966'
        })),

        // Sum up total fare
        totalFare: data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) + (data.gstEnabled ? (data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) * ((data.gstRate || 5) / 100)) : 0),
        fare: data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),

        gst: data.gstEnabled ? (data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) * ((data.gstRate || 5) / 100)) : 0,
        gstRate: data.gstRate || 5,
        gstType: data.gstType || 'CGST_SGST',

        // Pass specific Quotation fields
        vehicleType: data.items[0]?.vehicleType || 'Any',
        terms: data.terms,
        previewStep: 4 // Ensure full render
    };

    // Call the master generator with isQuotation = true
    return generateReceiptPDF(tripData, { ...settings, gstEnabled: !!data.gstEnabled, rcmEnabled: !!data.rcmEnabled }, true);
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

    // Use Invoice Number for filename if available
    let fileName = 'Invoice';
    if (trip.invoiceNo) {
        fileName = trip.invoiceNo.replace(/[/\\:*?"<>|]/g, '-');
    } else {
        fileName = `Invoice_${trip.customerName?.replace(/\s/g, '_') || 'Trip'}`;
    }
    const fullFileName = `${fileName}.pdf`;

    const file = new File([pdfBlob], fullFileName, { type: 'application/pdf' });

    if (navigator.share) {
        try {
            await navigator.share({
                files: [file],
                title: 'Trip Invoice',
                text: `Invoice for trip by ${trip.customerName}`
            });
        } catch (err) {
            console.error('Error sharing invoice:', err);
            // Fallback to save if user cancels or share fails
            doc.save(fullFileName);
        }
    } else {
        doc.save(fullFileName);
    }
};

export const shareQuotation = async (data: QuotationData, settings: PDFSettings) => {
    const doc = await generateQuotationPDF(data, settings);
    const pdfBlob = doc.output('blob');

    let fileName = 'Quotation';
    if (data.quotationNo) {
        fileName = data.quotationNo.replace(/[/\\:*?"<>|]/g, '-');
    } else {
        const qLabel = new Date().getTime();
        fileName = `Quotation_${data.customerName.replace(/\s/g, '_')}_${qLabel}`;
    }
    const fullFileName = `${fileName}.pdf`;

    const file = new File([pdfBlob], fullFileName, { type: 'application/pdf' });

    if (navigator.share) {
        try {
            await navigator.share({
                files: [file],
                title: 'Trip Quotation',
                text: `Quotation for ${data.customerName} - ${data.subject}`
            });
        } catch (err) {
            console.error('Error sharing quotation:', err);
            doc.save(fullFileName);
        }
    } else {
        doc.save(fullFileName);
    }
};


export interface Expense {
    category: string;
    amount: number;
    [key: string]: unknown;
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

    doc.text('SARATHIBOOK.COM', 105, y + 2, {
        align: 'center',
        url: 'https://sarathibook.com'
    } as Record<string, unknown>);

    doc.setFontSize(4);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('PROFESSIONAL CAB PRO FEATURES | AUTOMATE YOUR GROWTH', 105, y + 5, { align: 'center' });

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

// Bulk Generation Logic
export const generateBulkReceiptsPDF = async (trips: Trip[], settings: PDFSettings) => {
    // Dynamic Import
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

    for (let i = 0; i < trips.length; i++) {
        const trip = trips[i];
        if (i > 0) doc.addPage();
        await generateReceiptPDF(trip, settings, false, doc);
    }
    return doc;
};

export interface PayrollSummary {
    dutyDays: number;
    dutyTotal: number;
    standbyDays: number;
    standbyTotal: number;
    pf: number;
    esi: number;
    advances: number;
    fines: number;
    gross: number;
    net: number;
}

export const generatePayslipPDF = async (staff: Staff, payroll: PayrollSummary, month: Date, settings: PDFSettings) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const margin = 15;
    let y = 15;
    const themeColor = settings?.appColor || '#0047AB';
    const rgb = hexToRgb(themeColor);
    const setThemeColor = () => doc.setTextColor(rgb.r, rgb.g, rgb.b);
    const setDrawColor = () => doc.setDrawColor(rgb.r, rgb.g, rgb.b);

    // --- HELPER: Draw Table Cell ---
    const drawCell = (x: number, y: number, w: number, h: number, text: string, align: 'left' | 'center' | 'right' = 'left', isBold = false) => {
        doc.rect(x, y, w, h);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        let textX = x + 2;
        if (align === 'center') textX = x + (w / 2);
        if (align === 'right') textX = x + w - 2;
        doc.text(text, textX, y + (h / 2) + 1.5, { align });
    };

    // --- 1. COMPANY LETTERHEAD ---
    setThemeColor();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text((settings?.companyName || 'SARATHI BOOK').toUpperCase(), margin, 20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const companyAddress = settings?.companyAddress || 'No Address Provided';
    const splitAddress = doc.splitTextToSize(companyAddress, 80);
    doc.text(splitAddress, margin, 26);
    
    doc.setTextColor(100, 100, 100);
    doc.text(`Contact: ${settings?.driverPhone || 'N/A'}`, margin, 26 + (splitAddress.length * 4));
    if (settings?.gstin) {
        doc.text(`GSTIN: ${settings.gstin}`, margin, 30 + (splitAddress.length * 4));
    }

    // Right side meta
    doc.setFont('helvetica', 'bold');
    doc.text('PAY SLIP', 195, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Month: ${new Date(month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).toUpperCase()}`, 195, 26, { align: 'right' });
    doc.text(`Dated: ${new Date().toLocaleDateString('en-IN')}`, 195, 31, { align: 'right' });

    y = 45;
    setDrawColor();
    doc.setLineWidth(0.8);
    doc.line(margin, y, 195, y);

    // --- 2. EMPLOYEE DETAILS GRID ---
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE INFORMATION', margin, y);
    
    y += 4;
    doc.setLineWidth(0.1);
    doc.setFontSize(8.5);
    
    const rowH = 7;
    const colW = 45;

    // Row 1
    drawCell(margin, y, colW, rowH, 'Employee Name', 'left', true);
    drawCell(margin + colW, y, colW, rowH, staff.name);
    drawCell(margin + (colW * 2), y, colW, rowH, 'Employee ID', 'left', true);
    drawCell(margin + (colW * 3), y, colW, rowH, staff.employeeId || 'SB-' + staff.id.slice(0, 4).toUpperCase());
    
    y += rowH;
    // Row 2
    drawCell(margin, y, colW, rowH, 'Designation', 'left', true);
    drawCell(margin + colW, y, colW, rowH, staff.designation || 'Driver');
    drawCell(margin + (colW * 2), y, colW, rowH, 'Date of Joining', 'left', true);
    drawCell(margin + (colW * 3), y, colW, rowH, staff.joinDate ? new Date(staff.joinDate).toLocaleDateString('en-IN') : 'N/A');

    y += rowH;
    // Row 3
    drawCell(margin, y, colW, rowH, 'PAN Number', 'left', true);
    drawCell(margin + colW, y, colW, rowH, staff.panNumber || 'N/A');
    drawCell(margin + (colW * 2), y, colW, rowH, 'Phone Number', 'left', true);
    drawCell(margin + (colW * 3), y, colW, rowH, staff.phone);

    y += rowH;
    // Row 4 (Bank)
    drawCell(margin, y, colW, rowH, 'Bank Name', 'left', true);
    drawCell(margin + colW, y, colW, rowH, staff.bankName || 'N/A');
    drawCell(margin + (colW * 2), y, colW, rowH, 'Account Number', 'left', true);
    drawCell(margin + (colW * 3), y, colW, rowH, staff.accountNumber || 'N/A');

    y += rowH;
    // Row 5 (Bank 2)
    drawCell(margin, y, colW, rowH, 'IFSC Code', 'left', true);
    drawCell(margin + colW, y, colW, rowH, staff.ifscCode || 'N/A');
    drawCell(margin + (colW * 2), y, colW, rowH, 'Payment Mode', 'left', true);
    drawCell(margin + (colW * 3), y, colW, rowH, settings.preferredPaymentMethod?.toUpperCase() || 'BANK TRANSFER');

    y += rowH;
    // Row 6 (Compliance)
    drawCell(margin, y, colW, rowH, 'UAN Number', 'left', true);
    drawCell(margin + colW, y, colW, rowH, staff.uan || 'N/A');
    drawCell(margin + (colW * 2), y, colW, rowH, 'ESI IP Number', 'left', true);
    drawCell(margin + (colW * 3), y, colW, rowH, staff.esiNumber || 'N/A');

    // --- 3. SALARY CALCULATION TABLE ---
    y += 15;
    doc.setFontSize(10);
    setThemeColor();
    doc.setFont('helvetica', 'bold');
    doc.text('SALARY BREAKDOWN', margin, y);
    
    y += 4;
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(margin, y, 90, 8, 'F');
    doc.rect(margin + 90, y, 90, 8, 'F');
    
    doc.text('EARNINGS', margin + 45, y + 5.5, { align: 'center' });
    doc.text('DEDUCTIONS', margin + 135, y + 5.5, { align: 'center' });

    y += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const itemsH = 8;

    // Earnings Column
    let earnY = y;
    drawCell(margin, earnY, 60, itemsH, `Duty Pay (${payroll.dutyDays} Days)`);
    drawCell(margin + 60, earnY, 30, itemsH, payroll.dutyTotal.toLocaleString('en-IN'), 'right');
    earnY += itemsH;
    
    if (payroll.standbyTotal > 0) {
        drawCell(margin, earnY, 60, itemsH, `Standby/Waiting (${payroll.standbyDays} Days)`);
        drawCell(margin + 60, earnY, 30, itemsH, payroll.standbyTotal.toLocaleString('en-IN'), 'right');
        earnY += itemsH;
    }
    
    // Fill empty earnings rows to sync with deductions if needed
    while (earnY < y + (itemsH * 5)) {
        drawCell(margin, earnY, 60, itemsH, '');
        drawCell(margin + 60, earnY, 30, itemsH, '', 'right');
        earnY += itemsH;
    }

    // Deductions Column
    let dedY = y;
    drawCell(margin + 90, dedY, 60, itemsH, 'EPF (12%)');
    drawCell(margin + 150, dedY, 30, itemsH, payroll.pf > 0 ? payroll.pf.toLocaleString('en-IN') : '0', 'right');
    dedY += itemsH;

    drawCell(margin + 90, dedY, 60, itemsH, 'ESI (0.75%)');
    drawCell(margin + 150, dedY, 30, itemsH, payroll.esi > 0 ? payroll.esi.toLocaleString('en-IN') : '0', 'right');
    dedY += itemsH;

    drawCell(margin + 90, dedY, 60, itemsH, 'Sal. Advances / Deductions');
    drawCell(margin + 150, dedY, 30, itemsH, (payroll.advances + payroll.fines).toLocaleString('en-IN'), 'right');
    dedY += itemsH;

    drawCell(margin + 90, dedY, 60, itemsH, 'Other Deductions');
    drawCell(margin + 150, dedY, 30, itemsH, '0', 'right');
    dedY += itemsH;

    y = Math.max(earnY, dedY);
    
    // Totals Row
    doc.setFont('helvetica', 'bold');
    drawCell(margin, y, 60, itemsH, 'GROSS EARNINGS', 'left', true);
    drawCell(margin + 60, y, 30, itemsH, payroll.gross.toLocaleString('en-IN'), 'right', true);
    
    const totalDeductions = payroll.pf + payroll.esi + payroll.advances + payroll.fines;
    drawCell(margin + 90, y, 60, itemsH, 'TOTAL DEDUCTIONS', 'left', true);
    drawCell(margin + 150, y, 30, itemsH, totalDeductions.toLocaleString('en-IN'), 'right', true);

    // --- 4. NET PAY ---
    y += itemsH + 10;
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, y, 180, 15, 'F');
    setDrawColor();
    doc.rect(margin, y, 180, 15, 'S');

    setThemeColor();
    doc.setFontSize(12);
    doc.text('NET SALARY PAYABLE', margin + 5, y + 9);
    doc.setFontSize(16);
    doc.text(`Rs. ${payroll.net.toLocaleString('en-IN')}`, 185, y + 10, { align: 'right' });

    y += 22;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(numberToWords(payroll.net), margin + 35, y);

    // --- 5. SIGNATURES ---
    y += 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('__________________________', margin, y);
    doc.text('Employee Signature', margin, y + 5);

    doc.text('__________________________', 195, y, { align: 'right' });
    doc.text(`For ${(settings?.companyName || 'SARATHI BOOK').toUpperCase()}`, 195, y + 5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('Authorised Signatory', 195, y + 15, { align: 'right' });

    // --- 6. FOOTER ---
    y = 275;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a highly confidential document. Any unauthorized reproduction is prohibited.', 105, y, { align: 'center' });
    doc.text('Generated via Sarathi Book - Your Digital Fleet Office', 105, y + 4, { align: 'center' });

    return doc;
};

export const generateLetterheadPDF = async (settings: PDFSettings) => {
    // Dynamic Import
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    
    const margin = 15;
    const themeColor = settings?.appColor || '#0047AB';
    const rgb = hexToRgb(themeColor);
    const setThemeColor = () => doc.setTextColor(rgb.r, rgb.g, rgb.b);
    const setDrawThemeColor = () => doc.setDrawColor(rgb.r, rgb.g, rgb.b);

    // --- HEADER ---
    if (settings?.logoUrl) {
        try {
            doc.addImage(settings.logoUrl, 'PNG', margin, 12, 18, 18, undefined, 'FAST');
            setThemeColor();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.text((settings.companyName || 'SARATHI BOOK').toUpperCase(), margin + 22, 22);
            doc.setTextColor(0, 0, 0);
        } catch {
            setThemeColor();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.text((settings.companyName || 'SARATHI BOOK').toUpperCase(), margin, 20);
            doc.setTextColor(0, 0, 0);
        }
    } else {
        setThemeColor();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text((settings.companyName || 'SARATHI BOOK').toUpperCase(), margin, 20);
        doc.setTextColor(0, 0, 0);
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const companyAddress = settings?.companyAddress || '';
    const addressY = 28;
    const addressLines = doc.splitTextToSize(companyAddress, 100);
    doc.text(addressLines, margin, addressY);
    
    // Contact Rendering
    const contactY = addressY + (addressLines.length * 4.5) + 2;
    doc.setFontSize(9);
    
    // Line 1: Phones
    const phoneText = `Phone: ${settings?.driverPhone || ''}${settings?.secondaryPhone ? `, ${settings?.secondaryPhone}` : ''}`;
    doc.text(phoneText, margin, contactY);
    
    // Line 2: Email and GSTIN
    const cEmail = settings?.companyEmail || '';
    const cGst = settings?.gstin ? String(settings.gstin).toUpperCase() : '';
    let line2 = '';
    if (cEmail) line2 += `Email: ${cEmail}`;
    if (cEmail && cGst) line2 += '  |  ';
    if (cGst) line2 += `GSTIN: ${cGst}`;
    
    if (line2) {
        doc.text(line2, margin, contactY + 5);
    }
    
    // Divider
    const dividerY = contactY + (line2 ? 9 : 4);
    setDrawThemeColor();
    doc.setLineWidth(0.6);
    doc.line(margin, dividerY, 195, dividerY);
    
    // Branding Footer (Simple)
    let y = 278;
    setDrawThemeColor();
    doc.setLineWidth(0.5);
    doc.line(margin, y, 195, y);
    y += 4;
    
    if (settings.showWatermark !== false) {
        doc.setFontSize(8);
        setThemeColor();
        doc.setFont('helvetica', 'bold');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.text('sarathibook.com', 195, y + 2, { align: 'right', url: 'https://sarathibook.com' } as any);
        
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('SARATHI BOOK', margin, y + 2);
    }
    
    return doc;
};

export const downloadLetterhead = async (settings: PDFSettings) => {
    const doc = await generateLetterheadPDF(settings);
    const filename = `Letterhead_${(settings.companyName || 'Company').replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(filename);
};
