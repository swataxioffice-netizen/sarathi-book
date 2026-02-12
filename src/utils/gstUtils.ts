export const GST_STATE_CODES: { [key: string]: string } = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman and Diu",
    "26": "Dadra and Nagar Haveli",
    "27": "Maharashtra",
    "28": "Andhra Pradesh (Old)",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh",
    "97": "Other Territory"
};

export type GSTRate = 5 | 12;

export interface GSTBreakdown {
    taxableAmount: number;
    gstRate: GSTRate;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    totalAmount: number;
    isInterState: boolean;
    type: 'IGST' | 'CGST_SGST';
}

export const getGSTStateCode = (gstin: string): string | null => {
    if (!gstin || gstin.length < 2) return null;
    return gstin.substring(0, 2);
};

export const getStateName = (code: string): string => {
    return GST_STATE_CODES[code] || 'Unknown State';
};

export const isValidGSTIN = (gstin: string): boolean => {
    if (!gstin) return true; // Optional, so empty is valid contextually, but strict validation fails
    // Strict Regex for GSTIN
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gstin.toUpperCase());
};

/**
 * Determines if the supply is Inter-State (IGST) or Intra-State (CGST+SGST).
 * 
 * Rules for Rent-a-Cab / Passenger Transport:
 * - B2B (Registered Customer): Place of Supply is location of Recipient.
 * - B2C (Unregistered): Place of Supply is where the passenger embarks (Start Location).
 * 
 * In this simple utility, we assume:
 * If Customer GSTIN is provided -> Compare Supplier State vs Customer State.
 * If Customer GSTIN is NOT provided -> Intra-State (CGST+SGST) is the safe default for local operators,
 * or it matches the Supplier's state. 
 * (For a highly accurate B2C Outstation check, we'd need Start Location State mapping, 
 * but usually Cab drivers operate from their home state).
 */
export const determineGSTType = (supplierGstin: string, customerGstin?: string): 'IGST' | 'CGST_SGST' => {
    if (!supplierGstin || supplierGstin.length < 2) return 'CGST_SGST'; // Default to Intra if supplier unknown

    // If Customer is registered (B2B)
    if (customerGstin && customerGstin.length >= 2) {
        const supCode = supplierGstin.substring(0, 2);
        const custCode = customerGstin.substring(0, 2);
        return supCode !== custCode ? 'IGST' : 'CGST_SGST';
    }

    // If Customer is Unregistered (B2C)
    // Default assumption: The service originates in the Supplier's state (Intra-state).
    // Technically for Outstation trips starting in another state, this might differ, 
    // but for the scope of this app, Intra-state is the standard default for B2C.
    return 'CGST_SGST';
};

export const calculateGST = (
    amount: number,
    rate: GSTRate = 5,
    supplierGstin?: string,
    customerGstin?: string
): GSTBreakdown => {
    const isInterState = determineGSTType(supplierGstin || '', customerGstin) === 'IGST';

    const totalTaxRaw = amount * (rate / 100);
    const totalTax = Math.round(totalTaxRaw);

    // For breakdown, we use the rounded total to ensure sum matches
    // But strict accounting might round components. Here we round components for display.

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
        igst = totalTax;
    } else {
        // Divide by 2
        cgst = Math.round(totalTaxRaw / 2);
        sgst = Math.round(totalTaxRaw / 2);
        // Adjust purely for rounding difference if any?
        // E.g. 5 is 2.5 + 2.5. 5% of 101 = 5.05 -> Total 5. CGST 2.525->3, SGST 3 = 6? No.
        // Let's rely on standard practice: Round the Total Tax, then split.
        // If odd, one gets more? No, usually calculate percentage on base.

        // Better approach: Calculate components and Sum them.
        cgst = Math.round(amount * (rate / 200));
        sgst = Math.round(amount * (rate / 200));
        // Recalculate totalTax to match sum of components
        // Wait, if amount=100, 5%. 2.5 + 2.5 = 5.
        // If amount = 10, 5% = 0.5. CGST = 0.25 -> 0. SGST -> 0. Total 0. Correct.
    }

    const finalTotalTax = isInterState ? igst : (cgst + sgst);

    return {
        taxableAmount: amount,
        gstRate: rate,
        cgst,
        sgst,
        igst,
        totalTax: finalTotalTax,
        totalAmount: amount + finalTotalTax,
        isInterState,
        type: isInterState ? 'IGST' : 'CGST_SGST'
    };
};

/**
 * Calculates the Indian Financial Year (FY) for a given date.
 * FY starts in April. 
 * Example: Feb 2026 -> "25-26", April 2026 -> "26-27"
 */
export const getFinancialYear = (date: Date): string => {
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;
    return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
};
