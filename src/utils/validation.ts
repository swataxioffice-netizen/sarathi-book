/**
 * Validates a 15-digit Indian GSTIN (GST Identification Number)
 * Format: 22AAAAA0000A1Z5
 */
export const validateGSTIN = (gstin: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstin) return false;
    const upperGst = gstin.trim().toUpperCase();
    if (upperGst.length !== 15) return false;
    return gstRegex.test(upperGst);
};

export const GST_STATE_CODES: Record<string, string> = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
    "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh"
};

export const getGSTState = (gstin: string): string => {
    if (!gstin || gstin.length < 2) return "";
    const code = gstin.substring(0, 2);
    return GST_STATE_CODES[code] || "Unknown State";
};
