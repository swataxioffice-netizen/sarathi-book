import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeJSONParse } from '../utils/storage';

type Language = 'en';

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
    vehicles: Vehicle[];
    currentVehicleId: string;
    theme: 'light' | 'dark';
    websiteUrl?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    holderName?: string;
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
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        const parsed = safeJSONParse<Settings | null>('namma-cab-settings', null);
        if (parsed) {
            if (!parsed.vehicles) {
                parsed.vehicles = [{ id: 'v1', number: (parsed as any).vehicleNumber || '', model: '' }];
                parsed.currentVehicleId = 'v1';
                delete (parsed as any).vehicleNumber;
            }
            if (!parsed.theme) {
                parsed.theme = 'light';
            }
            // Force English to fix corrupted state
            parsed.language = 'en';
            return parsed;
        }
        return {
            language: 'en',
            gstEnabled: false,
            baseFare: 100,
            ratePerKm: 13,
            hourlyRate: 150,
            nightBata: 400,
            companyName: '',
            companyAddress: '',
            driverPhone: '',
            gstin: '',
            vehicles: [],
            currentVehicleId: '',
            theme: 'light',
            websiteUrl: '',
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            branchName: '',
            holderName: ''
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
        const langData = (translations as any)[settings.language];
        if (!langData) return (translations['en'] as any)[key] || key;
        return langData[key] || (translations['en'] as any)[key] || key;
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
