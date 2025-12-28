import { jsPDF } from 'jspdf';
import type { Trip } from './fare';
import { numberToWords } from './numberToWords';

export interface PDFSettings {
    companyName: string;
    companyAddress: string;
    driverPhone: string;
    gstin: string;
    vehicleNumber: string;
    gstEnabled: boolean;
}

export interface QuotationItem {
    description: string;
    package: string;
    vehicleType: string;
    rate: string;
    amount: string;
}

export interface QuotationData {
    customerName: string;
    subject: string;
    date: string;
    items: QuotationItem[];
}

export const generateReceiptPDF = (trip: Trip, settings: PDFSettings, isQuotation: boolean = false) => {
    const doc = new jsPDF();
    const margin = 15;
    let y = 0;

    // Safety checks for settings
    const companyName = String(settings?.companyName || 'SARATHI BOOK OWNER');
    const driverPhone = String(settings?.driverPhone || '');
    const gstin = settings?.gstin ? String(settings.gstin) : '';
    const vehicleNumber = String(settings?.vehicleNumber || 'N/A');
    const gstEnabled = !!settings?.gstEnabled;

    // --- ZONE 1: HEADER (Blue) ---
    doc.setFillColor(30, 58, 138); // Premium Blue
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(companyName.toUpperCase(), margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const companyAddress = String(settings?.companyAddress || '');
    doc.text(companyAddress, margin, 28, { maxWidth: 100 });

    doc.setFontSize(11);
    doc.text(`Phone: ${driverPhone}`, margin, 38);
    if (gstin) {
        doc.text(`GSTIN: ${gstin}`, 80, 38);
    }

    // --- ZONE 2: INVOICE INFO ---
    y = 55;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    if (isQuotation) {
        doc.text('QUOTATION / PROFORMA', margin, y);
    } else {
        doc.text(gstEnabled ? 'TAX INVOICE' : 'TRIP RECEIPT', margin, y);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // GST Compliant Invoice numbering (Max 16 chars, alphanumeric)
    const date = new Date(trip.date || Date.now());
    const yearPart = date.getFullYear().toString().substring(2);
    const monthPart = (date.getMonth() + 1).toString().padStart(2, '0');
    const dayPart = date.getDate().toString().padStart(2, '0');
    const serialPart = (trip.id || '0000').substring(0, 4).toUpperCase();

    const invoiceNo = isQuotation ? `QTN/${yearPart}${monthPart}${dayPart}/${serialPart}` : `INV/${yearPart}${monthPart}${dayPart}/${serialPart}`;
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

    // --- ZONE 3: CUSTOMER & JOURNEY ---
    y += 12;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, 195, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BILL TO:', margin, y);
    doc.text('PICKUP & DROP:', 110, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(String(trip.customerName || 'Customer'), margin, y);

    const journeyText = `${String(trip.from || 'N/A')} TO ${String(trip.to || 'N/A')}`;
    doc.text(journeyText.toUpperCase(), 110, y, { maxWidth: 85 });

    if (trip.billingAddress) {
        y += 5;
        doc.setFontSize(8);
        doc.text(String(trip.billingAddress), margin, y, { maxWidth: 80 });
    }

    if (trip.customerGst) {
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`GSTIN: ${trip.customerGst}`, margin, y);
        doc.setFont('helvetica', 'normal');
    }

    y = Math.max(y + 15, 105);

    // --- TABLE HEADER ---
    doc.setFillColor(31, 41, 55);
    doc.rect(margin, y, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(trip.mode === 'package' ? 'TOUR PACKAGE' : 'DESCRIPTION', margin + 3, y + 6.5);
    doc.text(trip.mode === 'package' ? 'PERSONS' : 'QTY', 105, y + 6.5);
    doc.text('RATE', 135, y + 6.5);
    doc.text('AMOUNT', 190, y + 6.5, { align: 'right' });

    y += 16;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    let subtotalItems = 0;
    const addTableRow = (label: string, qty: string, rate: string, amount: number) => {
        const safeAmount = isNaN(amount) ? 0 : amount;
        doc.text(label, margin + 3, y);
        doc.text(qty, 105, y);
        doc.text(rate, 135, y);
        doc.text(`Rs. ${safeAmount.toFixed(2)}`, 190, y, { align: 'right' });
        subtotalItems += safeAmount;
        y += 8;
    };

    if (trip.mode === 'hourly') {
        const hrs = trip.durationHours || 0;
        const rate = trip.hourlyRate || 0;
        addTableRow('Local Rental (Hourly)', `${hrs} Hrs`, `Rs. ${rate}/Hr`, hrs * rate);
    } else if (trip.mode === 'package') {
        const pkgName = trip.packageName || 'Tour Package';
        const persons = trip.numberOfPersons || 1;
        const rate = trip.packagePrice || 0;
        addTableRow(pkgName.toUpperCase(), persons.toString(), `Rs. ${rate}`, rate);
    } else {
        const km = Math.max(0, (trip.endKm || 0) - (trip.startKm || 0));
        const rate = trip.ratePerKm || 0;
        addTableRow('Transport Service', `${km} KM`, `Rs. ${rate}/KM`, km * rate);
    }

    if ((trip.baseFare || 0) > 0) addTableRow('Base Fare / Minimum Charge', '1', `Rs. ${trip.baseFare}`, trip.baseFare || 0);
    if ((trip.nightBata || 0) > 0) addTableRow('Night / Stay Charge', '1', `Rs. ${trip.nightBata}`, trip.nightBata || 0);
    if ((trip.waitingCharges || 0) > 0) addTableRow(`Waiting Time (${trip.waitingHours} Hrs)`, trip.waitingHours ? `${trip.waitingHours} Hrs` : '1', 'Rs. 150/Hr', trip.waitingCharges || 0);
    if ((trip.hillStationCharges || 0) > 0) addTableRow('Hill Station Trip Charge', '1', `Rs. ${trip.hillStationCharges}`, trip.hillStationCharges || 0);
    if ((trip.petCharges || 0) > 0) addTableRow('Pet Carrying Charge', '1', `Rs. ${trip.petCharges}`, trip.petCharges || 0);

    let extraChargesExempt = 0;
    if ((trip.toll || 0) > 0 || (trip.parking || 0) > 0) {
        y += 2;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('Extra Charges (GST Exempt):', margin + 3, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if ((trip.toll || 0) > 0) {
            addTableRow('Toll Charges', 'Actuals', '-', trip.toll || 0);
            extraChargesExempt += (trip.toll || 0);
        }
        if ((trip.parking || 0) > 0) {
            addTableRow('Parking Charges', 'Actuals', '-', trip.parking || 0);
            extraChargesExempt += (trip.parking || 0);
        }
    }

    y += 5;
    doc.line(130, y, 195, y);
    y += 10;

    // --- TOTALS SECTION ---
    const gstValue = trip.gst || 0;
    const finalTotal = subtotalItems + gstValue;

    doc.setFontSize(10);
    doc.text('Subtotal:', 140, y);
    doc.text(`Rs. ${subtotalItems.toFixed(2)}`, 190, y, { align: 'right' });
    y += 6;

    if (gstEnabled && gstValue > 0) {
        doc.text('CGST (2.5%):', 140, y);
        doc.text(`Rs. ${(gstValue / 2).toFixed(2)}`, 190, y, { align: 'right' });
        y += 6;
        doc.text('SGST (2.5%):', 140, y);
        doc.text(`Rs. ${(gstValue / 2).toFixed(2)}`, 190, y, { align: 'right' });
        y += 8;
    } else {
        doc.setFontSize(8);
        doc.text('GST Reverse Charge Applicable', 140, y);
        y += 8;
    }

    doc.setFillColor(254, 240, 138); // Soft Yellow
    doc.rect(130, y - 6, 75, 12, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL:', 135, y + 2);
    doc.text(`Rs. ${finalTotal.toFixed(2)}`, 195, y + 2, { align: 'right' });

    y += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(75, 85, 99);
    const words = numberToWords(finalTotal);
    const cleanWords = String(words).toUpperCase().replace('RUPEES ONLY', '').trim();
    doc.text(`Amount in Words: ${cleanWords} RUPEES ONLY`, margin, y);

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('SAC 9966: Rental services of road vehicles with operators.', margin, y);

    y = 250;
    doc.line(margin, y, 195, y);
    y += 10;

    doc.setFontSize(9);
    doc.text('Receiver\'s Signature', margin, y);
    doc.text('Authorized Signatory', 195, y, { align: 'right' });

    y += 20;
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text('Subject to Chennai Jurisdiction. | Computer generated invoice no signature required.', 105, y, { align: 'center' });
    y += 4;
    doc.text(`Generated by Namma Cab Office App for ${companyName}`, 105, y, { align: 'center' });

    return doc;
};

export const generateQuotationPDF = (data: QuotationData, settings: PDFSettings) => {
    const doc = new jsPDF();
    const margin = 15;
    let y = 0;

    const companyName = String(settings?.companyName || 'YOUR TRAVELS NAME');
    const companyAddress = String(settings?.companyAddress || '');
    const driverPhone = String(settings?.driverPhone || '');
    const gstin = String(settings?.gstin || '');

    // --- HEADER ---
    doc.setTextColor(30, 58, 138); // Blue
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(companyName.toUpperCase(), margin, 20);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(companyAddress, margin, 28, { maxWidth: 120 });

    y = 38;
    doc.setFont('helvetica', 'bold');
    doc.text(`Contact  : ${driverPhone}`, margin, y);
    if (gstin) {
        y += 5;
        doc.text(`GSTIN   : ${gstin}`, margin, y);
    }

    doc.setDrawColor(150, 150, 150);
    doc.line(margin, y + 5, 195, y + 5);

    y += 12;
    doc.setFontSize(10);
    doc.text(`DATE : ${new Date(data.date).toLocaleDateString('en-IN')}`, 195, y, { align: 'right' });

    y += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', 105, y, { align: 'center' });
    doc.line(90, y + 1, 120, y + 1);

    y += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('To,', margin, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(data.customerName || '[Client\'s Name]', margin, y);

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`SUB : ${data.subject}`, 105, y, { align: 'center', maxWidth: 160 });

    y += 10;
    // --- TABLE ---
    const headers = ['S.No', 'Description of Service', 'Package', 'Vehicle', 'Rate', 'Amount'];
    const colWidths = [12, 60, 40, 25, 20, 23];
    const tableX = margin;

    // Header Fill
    doc.setFillColor(255, 255, 255);
    doc.rect(tableX, y, 180, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    let currentX = tableX;
    headers.forEach((h, i) => {
        doc.text(h, currentX + (colWidths[i] / 2), y + 6.5, { align: 'center' });
        currentX += colWidths[i];
    });

    // Draw table lines
    const startY = y;
    y += 10;

    data.items.forEach((item, index) => {
        doc.setFont('helvetica', 'normal');
        let currentX = tableX;

        // S.No
        doc.text((index + 1).toString(), currentX + (colWidths[0] / 2), y + 6, { align: 'center' });
        currentX += colWidths[0];

        // Desc
        doc.text(item.description, currentX + 2, y + 6, { maxWidth: colWidths[1] - 4 });
        currentX += colWidths[1];

        // Package
        doc.text(item.package, currentX + (colWidths[2] / 2), y + 6, { align: 'center' });
        currentX += colWidths[2];

        // Vehicle
        doc.text(item.vehicleType, currentX + (colWidths[3] / 2), y + 6, { align: 'center' });
        currentX += colWidths[3];

        // Rate
        doc.text(item.rate, currentX + (colWidths[4] / 2), y + 6, { align: 'center' });
        currentX += colWidths[4];

        // Amount
        doc.text(item.amount, currentX + (colWidths[5] - 2), y + 6, { align: 'right' });

        doc.rect(tableX, y, 180, 10); // Row border
        y += 10;
    });

    // Vertical lines for the table
    let xv = tableX;
    doc.line(xv, startY, xv, y); // left
    colWidths.forEach(w => {
        xv += w;
        doc.line(xv, startY, xv, y);
    });

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Note:', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notes = [
        '• Driver Beta, Toll, Permit, and Parking are additional charges and will be calculated based on actuals.',
        `• Rates are applicable for items listed above.`,
        '• Minimum 4 hours and 40 km apply for local usage.'
    ];
    notes.forEach(n => {
        doc.text(n, margin, y);
        y += 5;
    });

    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Yours Sincerely,', 195, y, { align: 'right' });
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`For ${companyName}`, 195, y, { align: 'right' });

    // Graphic at bottom
    doc.setFillColor(219, 39, 119); // Pinkish red
    doc.triangle(150, 297, 210, 297, 210, 260, 'F');
    doc.setFillColor(157, 23, 77); // Darker pink
    doc.triangle(170, 297, 210, 297, 210, 275, 'F');

    return doc;
};

export const shareQuotation = async (data: QuotationData, settings: PDFSettings) => {
    try {
        const doc = generateQuotationPDF(data, settings);
        const pdfBlob = doc.output('blob');
        const safeName = (data.customerName || 'customer').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `Quotation_${safeName}.pdf`;
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Travel Quotation',
                text: `Quotation for ${data.customerName}`,
            });
        } else {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Failed to share quotation:', error);
    }
};

export const shareReceipt = async (trip: Trip, settings: PDFSettings, isQuotation: boolean = false) => {
    try {
        const doc = generateReceiptPDF(trip, settings, isQuotation);
        const pdfBlob = doc.output('blob');
        const safeName = (trip.customerName || 'customer').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const tripId = (trip.id || '0000').substring(0, 4);
        const filename = `${isQuotation ? 'Quotation' : 'Invoice'}_${safeName}_${tripId}.pdf`;
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                const pickup = trip.from || 'N/A';
                const drop = trip.to || 'N/A';
                await navigator.share({
                    files: [file],
                    title: `${settings.companyName} ${isQuotation ? 'Quotation' : 'Invoice'}`,
                    text: `${isQuotation ? 'Quotation' : 'Invoice'} for ${trip.customerName} - Total: Rs. ${trip.totalFare}\nPickup: ${pickup}\nDrop: ${drop}`,
                });
                return;
            } catch (shareError) {
                console.warn('Web Share failed, falling back to download', shareError);
            }
        }

        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to generate or share PDF:', error);
        alert('Could not generate PDF. Please check your profile settings.');
    }
};

