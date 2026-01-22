import { type Trip } from './fare';
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
    rcmEnabled?: boolean;
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
    const vehicleNumber = String(trip.vehicleNumber || settings?.vehicleNumber || 'N/A');
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

    if (trip.customerGst) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`GSTIN: ${trip.customerGst}`, leftColX, y);
        y += 6;
    }

    // PICKUP & DROP Section (Stretched, One line each)
    y += 4; // Gap between Bill To and Trip Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('JOURNEY DETAILS:', leftColX, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Journey Details Content
    // 2. Pickup
    // Journey Details Content
    // 2. Pickup
    const fromAddr = String(trip.from || 'N/A').replace(/, India$/, '').replace(/, Tamil Nadu$/, '');
    const pickupText = `Pickup: ${fromAddr}`;
    const pickupLines = doc.splitTextToSize(pickupText, 95); // safe width
    doc.text(pickupLines, leftColX, y);
    y += (pickupLines.length * 5); // Dynamic gap based on lines

    // 3. Drop / Time logic
    // Check if start/end time exists to decide rendering (Local Package Logic)
    if ((trip as any).startTime || (trip as any).endTime) {
        const sTime = (trip as any).startTime || 'N/A';
        const eTime = (trip as any).endTime || 'N/A';

        // Ensure Start Time doesn't overlap if it somehow wraps (unlikely but safe)
        const sLines = doc.splitTextToSize(`Start Time: ${sTime}`, 95);
        doc.text(sLines, leftColX, y);
        y += (sLines.length * 5);

        const eLines = doc.splitTextToSize(`End Time:   ${eTime}`, 95);
        doc.text(eLines, leftColX, y);
        y += (eLines.length * 5);
    } else {
        const toAddr = String(trip.to || 'N/A').replace(/, India$/, '').replace(/, Tamil Nadu$/, '');
        const dropText = `Drop:   ${toAddr}`;
        const dropLines = doc.splitTextToSize(dropText, 95);
        doc.text(dropLines, leftColX, y);
        y += (dropLines.length * 5);
    }

    // 4. Distance (New)
    let distStr = '';
    // If start/end KM exists, show usage
    if ((trip as any).startKm && (trip as any).endKm) {
        distStr = `Distance: ${((trip as any).endKm - (trip as any).startKm).toFixed(1)} km`;
    } else if ((trip as any).distance || (trip as any).effectiveDistance) {
        distStr = `Distance: ${(trip as any).distance || (trip as any).effectiveDistance} km`;
    }

    if (distStr) {
        doc.text(distStr, leftColX, y);
        y += 5;
    }


    const leftEndY = y + 2; // Reduced buffer since we added full height


    // RIGHT COLUMN: INVOICE DATA (Kept on Right, parallel to Left Col)
    y = contentStartY; // Reset Y to top of section for right column rendering
    const rightAlignX = 195;

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
    let invoiceNo = '';
    if (trip.invoiceNo && trip.invoiceNo.startsWith('INV-')) {
        invoiceNo = trip.invoiceNo; // Use valid pre-existing sequence directly
    } else {
        invoiceNo = isQuotation
            ? (trip.invoiceNo || `QTN/${yearPart}${monthPart}/${serialPart}`) // Use passed QTN no or generate
            : `${vehSuffix}/${yearPart}${monthPart}/${serialPart}`;
    }

    doc.text(`${isQuotation ? 'Quotation' : 'Invoice'} No: ${invoiceNo}`, rightAlignX, y, { align: 'right' });

    y += 5;
    let dateStr = 'N/A';
    try {
        const d = new Date(trip.date);
        dateStr = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN');
    } catch (e) { }
    doc.text(`Date: ${dateStr}`, rightAlignX, y, { align: 'right' });

    y += 5;
    if (isQuotation) {
        // For Quotation, show "Valid Until" or "Vehicle Class" instead of specific Number
        const vType = (trip as any).vehicleType || 'Any'; // Cast for Quotation field
        doc.text(`Vehicle Class: ${vType}`, rightAlignX, y, { align: 'right' });
    } else {
        const vehText = trip.vehicleModel ? `${vehicleNumber} (${trip.vehicleModel})` : vehicleNumber;
        doc.text(`Vehicle No: ${vehText}`, rightAlignX, y, { align: 'right' });
    }

    // Add Service Type below Vehicle info
    const serviceTypeMap: Record<string, string> = {
        'drop': 'One Way Drop',
        'outstation': 'Round Trip',
        'local': 'Local Package',
        'custom': 'Custom Service',
        'package': 'Tour Package',
        'hourly': 'Local Rental'
    };
    const serviceName = serviceTypeMap[trip.mode] || trip.mode || 'N/A';
    y += 5;
    doc.text(`Service Type: ${serviceName.toUpperCase()}`, rightAlignX, y, { align: 'right' });
    y += 5;
    // RCM Check
    let isRcm = false;
    if (settings.rcmEnabled) isRcm = true;
    if ((trip as any).rcmEnabled !== undefined) isRcm = (trip as any).rcmEnabled;

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
    if ((trip as any).subject) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        // doc.text(`Subject: ${(trip as any).subject}`, 105, y, { align: 'center', maxWidth: 180 });
        const subjectText = `Subject: ${(trip as any).subject}`;
        const subjectLines = doc.splitTextToSize(subjectText, 180);
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
    const pStep = (trip as any).previewStep || 4;
    const dist = (trip as any).distance !== undefined ? (trip as any).distance : Math.max(0, (trip.endKm || 0) - (trip.startKm || 0));
    const effectiveDist = (trip as any).effectiveDistance || dist;

    // Logic: distanceCharge is the basic trip/KM cost. fare is the total taxable subtotal.
    let mainAmount = (trip as any).distanceCharge;
    const hasExplicitDistanceCharge = mainAmount !== undefined;

    if (!hasExplicitDistanceCharge) {
        mainAmount = (trip as any).fare || 0;
    }

    if (pStep >= 2) {
        if (trip.mode === 'custom') {
            if (trip.extraItems && trip.extraItems.length > 0) {
                trip.extraItems.forEach(item => {
                    const iQty = (item as any).quantity || '1';
                    const iRate = (item as any).rate ? `${(item as any).rate}` : `${item.amount}`;
                    const iSac = (item as any).sac || '9966';
                    addTableRow(item.description || 'Service Charge', String(iQty), iRate, item.amount || 0, iSac);
                });
            } else if (hasExplicitDistanceCharge || (trip as any).fare) {
                addTableRow('Custom Service', '1', `${mainAmount}`, mainAmount);
            }
        } else if (trip.mode === 'hourly') {
            const hrs = trip.waitingHours || 8;
            // Hourly usually has fixed package price, rate is package price
            addTableRow(`Local Rental / Hourly Package (${hrs} Hrs)`, '1', `${mainAmount}`, mainAmount);
        } else if (trip.mode === 'package') {
            addTableRow(String(trip.packageName || 'TOUR PACKAGE').toUpperCase(), '1', `${trip.packagePrice}`, trip.packagePrice || 0);
        } else if (trip.mode === 'drop') {
            if (dist <= 40) {
                addTableRow(`Local Drop Trip`, '1', `${mainAmount}`, mainAmount);
            } else {
                // Determine rate used
                const rateUsed = (trip as any).rateUsed || ((trip as any).ratePerKm) || (mainAmount / (effectiveDist || 1));
                const pRate = isNaN(rateUsed) ? '-' : `${parseFloat(rateUsed).toFixed(1)}/KM`;

                // For Outstation Drop, it's min dist * rate
                const calcDesc = `${effectiveDist} KM * ${pRate}`;
                addTableRow(`Outstation Drop Trip [${calcDesc}]`, `${effectiveDist} KM`, pRate, mainAmount);
            }
        } else if (trip.mode === 'outstation') {
            // Determine rate used
            const rateUsed = (trip as any).rateUsed || ((trip as any).ratePerKm) || (mainAmount / (effectiveDist || 1));
            const pRate = isNaN(rateUsed) ? '-' : `${parseFloat(rateUsed).toFixed(1)}/KM`;
            const calcDesc = `${effectiveDist} KM * ${pRate}`;
            addTableRow(`Round Trip [${calcDesc}]`, `${effectiveDist} KM`, pRate, mainAmount);
        }
    }

    if (pStep >= 3) {
        // Only add these IF they weren't already bundled into 'mainAmount' (legacy fallback case)
        const shouldAddIndividual = hasExplicitDistanceCharge;

        if (shouldAddIndividual) {
            // Night Batta
            if ((trip.nightBata || 0) > 0) {
                const payDays = (trip.mode === 'outstation' ? trip.days : 1) || 1;
                const perNightBatta = (trip.nightBata || 0) / payDays;
                const nLabel = payDays > 1 ? `Night Allowance (${payDays} Nights * ${perNightBatta}/Night)` : 'Night Allowance';
                addTableRow(nLabel, `${payDays}`, `${perNightBatta}`, trip.nightBata || 0);
            }

            // Driver Batta
            if ((trip.driverBatta || 0) > 0) {
                const payDays = (trip.mode === 'outstation' ? trip.days : 1) || 1;
                const perDayBatta = (trip.driverBatta || 0) / payDays;
                const bLabel = payDays > 1 ? `Driver Batta (${payDays} Days * ${perDayBatta}/Day)` : `Driver Batta`;
                addTableRow(bLabel, `${payDays}`, `${perDayBatta}`, trip.driverBatta || 0);
            }

            // Night Stay
            if ((trip.nightStay || 0) > 0) {
                // If we have days, maybe we can calc rate? usually night stay is bulk or per night?
                // Trip form doesn't strictly track # of night stays separately from days, but usually 1-to-1 or manually entered total.
                // Use total as rate if single, else just total.
                addTableRow('Night Stay Charge', '1', `${trip.nightStay}`, trip.nightStay || 0);
            }

            if ((trip.waitingCharges || 0) > 0) {
                const wRate = (trip.waitingCharges || 0) / (trip.waitingHours || 1);
                addTableRow(`Waiting Charges (${trip.waitingHours} Hrs * ${wRate}/Hr)`, `${trip.waitingHours} Hrs`, `${wRate}/Hr`, trip.waitingCharges || 0);
            }
            if ((trip.hillStationCharges || 0) > 0) addTableRow('Hill Station Charges', '1', `${trip.hillStationCharges}`, trip.hillStationCharges || 0);
            if ((trip.petCharges || 0) > 0) addTableRow('Pet Carrying Charges', '1', `${trip.petCharges}`, trip.petCharges || 0);
        }

        // Tolls/Permits/Parking are ALWAYS separate even in legacy? No, usually they were separate fields.
        if ((trip.permit || 0) > 0) addTableRow('Permit Charges', '1', `${trip.permit}`, trip.permit || 0);
        if ((trip.parking || 0) > 0) addTableRow('Parking Charges', '1', `${trip.parking}`, trip.parking || 0);
        if ((trip.toll || 0) > 0) addTableRow('Toll Charges', '1', `${trip.toll}`, trip.toll || 0);

        // Custom extra items from step 3
        if (trip.extraItems && trip.mode !== 'custom') {
            trip.extraItems.forEach(item => {
                const iSac = (item as any).sac || '9966';
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

    // 2. Render Totals (Right Side) - USE VALUES FROM ENGINE DIRECTLY
    let totalsY = sectionsStartY;
    const taxableValue = (trip as any).fare !== undefined ? (trip as any).fare : runningSubtotal;
    const gstValue = pStep >= 4 ? (trip.gst || 0) : 0;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Taxable Amount:', 135, totalsY);
    doc.text(`${taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 195, totalsY, { align: 'right' });
    totalsY += 8;

    const isDriverRegistered = !!gstin;

    if (isDriverRegistered && gstValue > 0) {
        const rate = (trip as any).gstRate || 5;
        const isIgst = (trip as any).gstType === 'IGST';

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
    } else if ((settings.rcmEnabled || (trip as any).rcmEnabled) && !gstEnabled) {
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
    if ((trip as any).terms && (trip as any).terms.length > 0) {
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('TERMS & CONDITIONS:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        const terms = (trip as any).terms as string[];
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
    // Map QuotationData to Trip format to reuse the Receipt Generator
    const tripData: any = {
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
        fileName = trip.invoiceNo.replace(/[\/\\:*?"<>|]/g, '-');
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
        fileName = data.quotationNo.replace(/[\/\\:*?"<>|]/g, '-');
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
