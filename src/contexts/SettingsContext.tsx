import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeJSONParse } from '../utils/storage';

type Language = 'en' | 'ta';

interface Vehicle {
    id: string;
    number: string;
    model: string;
}

interface Settings {
    language: Language;
    gstEnabled: boolean;
    baseFare: number;
    ratePerKm: number;
    hourlyRate: number;
    nightBata: number;
    companyName: string;
    companyAddress: string;
    driverPhone: string;
    gstin: string;
    pan: string;
    vehicles: Vehicle[];
    currentVehicleId: string;
    theme: 'light' | 'dark';
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    currentVehicle: Vehicle | undefined;
    t: (key: string) => string;
}

const translations = {
    en: {
        title: 'Swa Taxi Office',
        dashboard: 'Dashboard',
        trips: 'Invoices',
        expenses: 'Expenses',
        docs: 'Documents',
        profile: 'Profile',
        startTrip: 'Start Trip',
        endTrip: 'End Trip',
        customer: 'Customer Name',
        startKm: 'Start KM',
        endKm: 'End KM',
        startTime: 'Start Time',
        endTime: 'End Time',
        toll: 'Toll',
        parking: 'Parking',
        nightBata: 'Driver Batta',
        calculate: 'Calculate Fare',
        saveTrip: 'Save Invoice',
        total: 'Total',
        receipt: 'Receipt',
        share: 'Share Invoice',
        dailySummary: 'Daily Summary',
        dailyProfit: 'Daily Profit',
        income: 'Total Income',
        spending: 'Total Spent',
        gst: 'Enable GST (5%)',
        companyName: 'Company Name',
        companyAddress: 'Address',
        gstin: 'GSTIN (Optional)',
        pan: 'PAN Number',
        vehicleNumber: 'Vehicle Number',
        phone: 'Phone Number',
        addExpense: 'Add Expense',
        fuel: 'Fuel',
        maintenance: 'Maintenance',
        food: 'Food',
        other: 'Other',
        docVault: 'Document Vault',
        expiring: 'Days Remaining',
        qrTitle: 'Booking Engine',
        qrSub: 'Manage bookings via external portal',
        voiceNotes: 'Voice Note',
        outstation: 'Round Trip',
        hourly: 'Hourly Rental',
        distance: 'Local Trip',
        drop: 'One Way Drop',
        addVehicle: 'Add Vehicle',
        vehicles: 'My Fleet',
        selectVehicle: 'Select Active Car',
        carModel: 'Car Model (e.g. Swift, Dzire)',
        waitingHours: 'Waiting Time (Hrs)',
        hillStation: 'Hill Station Trip',
        petCharge: 'Carrying Pets',
        billingAddress: 'Billing Address (optional)',
        partner: 'Partner',
        package: 'Tour Package',
        packageName: 'Package Name',
        numPersons: 'No. of Persons',
        packageRate: 'Package Rate'
    },
    ta: {
        title: 'ஸ்வா டாக்ஸி ஆபீஸ்',
        dashboard: 'டாஷ்போர்டு',
        trips: 'இன்வாய்ஸ்கள்',
        expenses: 'செலவுகள்',
        docs: 'ஆவணங்கள்',
        profile: 'சுயவிவரம்',
        partner: 'பார்ட்னர்',
        startTrip: 'பயணத்தைத் தொடங்கு',
        endTrip: 'பயணத்தை முடி',
        customer: 'வாடிக்கையாளர் பெயர்',
        startKm: 'ஆரம்ப கி.மீ',
        endKm: 'முடிவு கி.மீ',
        startTime: 'தொடங்கும் நேரம்',
        endTime: 'முடியும் நேரம்',
        toll: 'டோல்',
        parking: 'பார்க்கிங்',
        nightBata: 'டிரைவர் பட்டா',
        calculate: 'கட்டணம் கணக்கிடு',
        saveTrip: 'இன்வாய்ஸ் சேமி',
        total: 'மொத்தம்',
        receipt: 'ரசீது',
        share: 'இன்வாய்ஸ் பகிர்',
        dailySummary: 'தினசரி சுருக்கம்',
        dailyProfit: 'தினசரி லாபம்',
        income: 'மொத்த வருமானம்',
        spending: 'மொத்த செலவு',
        gst: 'ஜிஎஸ்டி (5%)',
        companyName: 'நிறுவனம் பெயர்',
        companyAddress: 'முகவரி',
        gstin: 'ஜிஎஸ்டி எண்',
        pan: 'பான் எண்',
        vehicleNumber: 'வண்டி எண்',
        phone: 'தொலைபேசி எண்',
        addExpense: 'செலவைச் சேர்',
        fuel: 'எரிபொருள்',
        maintenance: 'பராமரிப்பு',
        food: 'உணவு',
        other: 'மற்றவை',
        docVault: 'ஆவணக் காப்பகம்',
        expiring: 'நாட்கள் மீதமுள்ளன',
        qrTitle: 'புக்கிங் என்ஜின்',
        qrSub: 'புக்கிங் போர்டல் மூலம் நிர்வகிக்கவும்',
        voiceNotes: 'குரல் குறிப்பு',
        outstation: 'இருவழி பயணம்',
        hourly: 'மணிநேர வாடகை',
        distance: 'உள்ளூர் பயணம்',
        drop: 'ஒருவழி பயணம்',
        addVehicle: 'வண்டியைச் சேர்',
        vehicles: 'எனது வண்டிகள்',
        selectVehicle: 'வண்டியைத் தேர்ந்தெடு',
        carModel: 'வண்டி வகை (எ.கா: ஸ்விஃப்ட்)',
        waitingHours: 'காத்திருப்பு நேரம் (மணி)',
        hillStation: 'மலைப்பயணம் / ஹில்ஸ்',
        petCharge: 'செல்லப்பிராணிகள் / பெட்',
        billingAddress: 'பில்லிங் முகவரி (தேவைப்பட்டால்)',
        package: 'சுற்றுலா பேக்கேஜ்',
        packageName: 'பேக்கேஜ் பெயர்',
        numPersons: 'நபர்களின் எண்ணிக்கை',
        packageRate: 'பேக்கேஜ் விலை'
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        const parsed = safeJSONParse<Settings | null>('namma-cab-settings', null);
        if (parsed) {
            if (!parsed.vehicles) {
                parsed.vehicles = [{ id: 'v1', number: (parsed as any).vehicleNumber || 'TN-01-AB-1234', model: 'Standard Sedan' }];
                parsed.currentVehicleId = 'v1';
                delete (parsed as any).vehicleNumber;
            }
            if (!parsed.theme) {
                parsed.theme = 'light';
            }
            return parsed;
        }
        return {
            language: 'ta',
            gstEnabled: false,
            baseFare: 150,
            ratePerKm: 18,
            hourlyRate: 150,
            nightBata: 500,
            companyName: 'SWA TAXI SERVICES',
            companyAddress: 'Tamil Nadu, India',
            driverPhone: '+91 90000 00000',
            gstin: '',
            pan: '',
            vehicles: [{ id: 'v1', number: 'TN-01-AB-1234', model: 'Standard Sedan' }],
            currentVehicleId: 'v1',
            theme: 'light',
        };
    });

    useEffect(() => {
        localStorage.setItem('namma-cab-settings', JSON.stringify(settings));
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const currentVehicle = settings.vehicles.find(v => v.id === settings.currentVehicleId);

    const t = (key: string) => {
        return (translations[settings.language] as any)[key] || (translations['en'] as any)[key] || key;
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, currentVehicle, t }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
