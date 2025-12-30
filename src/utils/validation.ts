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

/**
 * Validates Indian Vehicle Registration Number (RC Number)
 * Supports formats: TN01AB1234, TN-01-AB-1234, TN 01 AB 1234, TN01 1234
 * Regex explanation:
 * ^[A-Z]{2} : First 2 characters must be uppercase state code (e.g., TN, KA)
 * [ -]?     : Optional separator (space or hyphen)
 * [0-9]{1,2}: District code (1 or 2 digits, e.g., 01, 1, 99)
 * [ -]?     : Optional separator
 * [A-Z]{0,3}: Optional series code (0-3 chars, e.g., A, AB, ABC)
 * [ -]?     : Optional separator
 * [0-9]{4}  : 4 digit unique number (0001 to 9999)
 */
export const validateVehicleNumber = (vehicleNumber: string): boolean => {
    if (!vehicleNumber) return false;

    // Normalize: Remove spaces, dashes, and make uppercase
    const cleanNumber = vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Basic length check (Min: TN1A1234 = 8 chars, Max: TN01ABC1234 = 11 chars)
    if (cleanNumber.length < 6 || cleanNumber.length > 11) return false;

    // Strict Regex for standard consumer/commercial vehicles
    // State Code (2) + District (2) + Optional Series (0-3) + Number (4)
    // Note: This regex covers most standard cases but might exclude some very old or special formats.
    // For a broad validation we use:
    const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

    return vehicleRegex.test(cleanNumber);
};
