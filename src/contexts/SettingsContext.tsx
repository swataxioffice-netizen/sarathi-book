import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { safeJSONParse } from '../utils/storage';
import { supabase } from '../utils/supabase';

type Language = 'en' | 'ta' | 'kn' | 'hi';

interface Vehicle {
    id: string;
    number: string;
    model: string;
    categoryId?: string;
    expiryDate?: string;
    mileage?: string;
    fuelType?: 'petrol' | 'diesel' | 'cng' | 'ev';
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
}

export interface SalaryConfig {
    dutyPay: number;     // Daily Rate when generating revenue
    standbyPay: number;  // Daily Rate when idle
    pfDeduction: number; // Flat monthly deduction (smart default: 0 or 1800)
    advanceLimit: number; // Max advance allowed
}

export interface Staff {
    id: string;
    name: string;
    phone: string;
    role: 'driver' | 'manager';
    salaryConfig: SalaryConfig;
    joinDate: string;
    status: 'active' | 'inactive';
    balance: number; // Ledger Balance (Positive = Company owes Driver, Negative = Driver owes Company)
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    currentVehicle: Vehicle | undefined;
    t: (key: string) => string;
    saveSettings: () => Promise<boolean>;
    docStats: { hasFullVehicle: boolean; hasFullDriver: boolean };
    setDocStats: React.Dispatch<React.SetStateAction<{ hasFullVehicle: boolean; hasFullDriver: boolean }>>;
    driverCode: number | null;
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
    const [docStats, setDocStats] = useState(() => safeJSONParse('doc-stats', { hasFullVehicle: false, hasFullDriver: false }));
    const [driverCode, setDriverCode] = useState<number | null>(null);
    const isInitialized = useRef(false);

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
            parsed.appColor = parsed.appColor || '#0047AB';
            parsed.secondaryColor = parsed.secondaryColor || '#6366F1';
            parsed.showWatermark = parsed.showWatermark ?? true;
            // Force English to fix corrupted state
            parsed.language = 'en';

            // Ensure services array exists if missing
            if (!parsed.services) parsed.services = undefined;

            // Migration: Staff & Salary
            if (!parsed.staff) parsed.staff = [];
            if (!parsed.defaultSalaryConfig) {
                parsed.defaultSalaryConfig = {
                    dutyPay: 800,
                    standbyPay: 400,
                    pfDeduction: 0,
                    advanceLimit: 5000
                };
            }
            if (!parsed.preferredPaymentMethod) parsed.preferredPaymentMethod = 'upi';

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
            holderName: '',
            upiId: '',
            appColor: '#0047AB',
            secondaryColor: '#6366F1',
            showWatermark: true,
            isPremium: false,
            plan: 'free',
            services: ['Local', 'Outstation', 'Tours'], // Default Services
            staff: [],
            defaultSalaryConfig: {
                dutyPay: 800,
                standbyPay: 400,
                pfDeduction: 0,
                advanceLimit: 5000
            },
            preferredPaymentMethod: 'upi'
        };
    });

    // Cloud Sync Logic
    useEffect(() => {
        const syncSettings = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    // 1. Fetch Cloud Settings
                    const { data, error } = await supabase.from('profiles').select('settings, driver_code').eq('id', session.user.id).single();
                    if (error) {
                        console.error('Error fetching cloud settings:', error);
                    } else if (data) {
                        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
                        if (data.driver_code) setDriverCode(data.driver_code);
                    }

                    // 2. Fetch Document Stats
                    const { data: docs } = await supabase.from('user_documents').select('type').eq('user_id', session.user.id);
                    if (docs) {
                        const types = new Set(docs.map(d => d.type));
                        const hasFullVehicle = ['Insurance', 'Permit', 'Fitness', 'Pollution'].every(t => types.has(t));
                        const hasFullDriver = ['License'].every(t => types.has(t));
                        setDocStats({ hasFullVehicle, hasFullDriver });
                    }
                } else {
                    // Local Storage Fallback for Stats
                    const saved = localStorage.getItem('cab-docs');
                    if (saved) {
                        const docs = JSON.parse(saved);
                        const types = new Set(docs.map((d: any) => d.type));
                        const hasFullVehicle = ['Insurance', 'Permit', 'Fitness', 'Pollution'].every(t => types.has(t));
                        const hasFullDriver = ['License'].every(t => types.has(t));
                        setDocStats({ hasFullVehicle, hasFullDriver });
                    }
                }
            } catch (err) {
                console.error('Settings sync failed:', err);
            } finally {
                isInitialized.current = true;
            }
        };

        syncSettings();

        // Listen for Auth Changes to switch profiles
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                try {
                    const { data, error } = await supabase.from('profiles').select('settings, driver_code').eq('id', session.user.id).single();
                    if (error) {
                        console.error('Error fetching settings on sign in:', error);
                    } else if (data) {
                        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
                        if (data.driver_code) setDriverCode(data.driver_code);
                    }

                    // Fetch Docs on Sign In
                    const { data: docs } = await supabase.from('user_documents').select('type').eq('user_id', session.user.id);
                    if (docs) {
                        const types = new Set(docs.map(d => d.type));
                        const hasFullVehicle = ['Insurance', 'Permit', 'Fitness', 'Pollution'].every(t => types.has(t));
                        const hasFullDriver = ['License'].every(t => types.has(t));
                        setDocStats({ hasFullVehicle, hasFullDriver });
                    }
                } catch (err) {
                    console.error('Settings fetch on sign in failed:', err);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Save to Cloud on Change (Debounced)
    // Manual Save Function
    const saveSettings = async (): Promise<boolean> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log('Saving settings to cloud...');
                const { error, data } = await supabase
                    .from('profiles')
                    .update({ settings: settings, updated_at: new Date().toISOString() })
                    .eq('id', session.user.id)
                    .select();

                if (error) {
                    console.error('Error saving settings to cloud:', error);
                    return false;
                }

                if (data && data.length === 0) {
                    console.warn('No profile row found to update. Attempting upsert...');
                    // Fallback to upsert if update failed to find row
                    const { error: upsertError } = await supabase.from('profiles').upsert({
                        id: session.user.id,
                        settings: settings,
                        updated_at: new Date().toISOString(),
                        email: session.user.email // Try to provide email if possible, though it might be partial
                    }).select();

                    if (upsertError) {
                        console.error('Upsert failed:', upsertError);
                        return false;
                    }
                }
                return true;
            }
            return false;
        } catch (err) {
            console.error('Unexpected error saving settings:', err);
            return false;
        }
    };

    // Save to Cloud on Change (Debounced)
    useEffect(() => {
        localStorage.setItem('namma-cab-settings', JSON.stringify(settings));
        localStorage.setItem('doc-stats', JSON.stringify(docStats));
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Apply Color Theme
        if (settings.appColor) {
            document.documentElement.style.setProperty('--primary', settings.appColor);
            // Also update safe-area/meta theme color if possible
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) metaThemeColor.setAttribute('content', settings.appColor);
        }

        // Debounced Cloud Save
        // Prevent saving to cloud until we have verified/synced with cloud at least once to avoid overwriting with empty defaults
        if (!isInitialized.current) return;

        const saveToCloud = setTimeout(async () => {
            await saveSettings();
        }, 2000);

        return () => clearTimeout(saveToCloud);
    }, [settings, docStats]);

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
        <SettingsContext.Provider value={{ settings, updateSettings, currentVehicle, t, saveSettings, docStats, setDocStats, driverCode }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
