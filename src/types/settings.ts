export type Language = 'en' | 'ta' | 'kn' | 'hi';

export interface Vehicle {
    id: string;
    number: string;
    model: string;
    categoryId?: string;
    expiryDate?: string;
    mileage?: string;
    fuelType?: 'petrol' | 'diesel' | 'cng' | 'ev';
}

export interface SalaryConfig {
    dutyPay: number;     // Daily Rate when generating revenue
    standbyPay: number;  // Daily Rate when idle
    pfDeduction: number; // Flat monthly deduction (smart default: 0 or 1800)
    advanceLimit: number; // Max advance allowed
    isPfEnabled?: boolean;
    isEsiEnabled?: boolean;
}

export interface DeductionRecord {
    id: string;
    date: string;
    amount: number;
    reason: string;
    type: 'advance' | 'fine' | 'other';
}

export type AttendanceStatus = 'duty' | 'standby' | 'leave' | 'holiday';

export interface Staff {
    id: string;
    name: string;
    phone: string;
    role: 'driver' | 'manager';
    salaryConfig: SalaryConfig;
    joinDate: string;
    status: 'active' | 'inactive';
    balance: number; // Ledger Balance (Positive = Company owes Driver, Negative = Driver owes Company)
    designation?: string;
    employeeId?: string;
    panNumber?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    uan?: string;
    esiNumber?: string;
    attendance: Record<string, AttendanceStatus>; // Key: YYYY-MM-DD
    deductions: DeductionRecord[];
}

export interface Settings {
    language: Language;
    gstEnabled: boolean;
    baseFare: number;
    ratePerKm: number;
    hourlyRate: number;
    nightBata: number;
    companyName: string;
    companyAddress: string;
    driverPhone: string;
    secondaryPhone?: string;
    companyEmail?: string;
    contactPerson?: string;
    gstin: string;
    vehicles: Vehicle[];
    currentVehicleId: string;
    theme: 'light' | 'dark';
    websiteUrl?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    holderName?: string;
    upiId?: string;
    appColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    showWatermark: boolean;
    isPremium?: boolean;
    plan?: 'free' | 'pro' | 'super';
    services?: string[];
    signatureUrl?: string;

    // --- Staff & Salary Management (Pro) ---
    staff: Staff[];
    defaultSalaryConfig: SalaryConfig;
    preferredPaymentMethod?: 'upi' | 'bank';
    showUpiOnPdf?: boolean;
    showBankOnPdf?: boolean;
}
