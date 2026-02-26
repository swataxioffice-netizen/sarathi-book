import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { safeJSONParse } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

import type { 
    Vehicle, 
    Settings, 
    Staff, 
} from '../types/settings';
import { translations } from './translations';

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    currentVehicle: Vehicle | undefined;
    t: (key: string) => string;
    saveSettings: (newSettings?: Settings) => Promise<boolean>;
    docStats: { hasFullVehicle: boolean; hasFullDriver: boolean };
    setDocStats: React.Dispatch<React.SetStateAction<{ hasFullVehicle: boolean; hasFullDriver: boolean }>>;
    driverCode: number | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [docStats, setDocStats] = useState(() => safeJSONParse('doc-stats', { hasFullVehicle: false, hasFullDriver: false }));
    const [driverCode, setDriverCode] = useState<number | null>(null);
    const isInitialized = useRef(false);

    const [settings, setSettings] = useState<Settings>(() => {
        const parsed = safeJSONParse<Settings | null>('namma-cab-settings', null);
        if (parsed) {
            const legacy = parsed as unknown as { vehicleNumber?: string };
            if (!parsed.vehicles) {
                parsed.vehicles = [{ id: 'v1', number: legacy.vehicleNumber || '', model: '' }];
                parsed.currentVehicleId = 'v1';
                delete legacy.vehicleNumber;
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
            parsed.staff = parsed.staff.map((s: Staff) => ({
                ...s,
                attendance: s.attendance || {},
                deductions: s.deductions || []
            }));
            if (parsed.defaultSalaryConfig) {
                parsed.defaultSalaryConfig.isPfEnabled = parsed.defaultSalaryConfig.isPfEnabled ?? true;
                parsed.defaultSalaryConfig.isEsiEnabled = parsed.defaultSalaryConfig.isEsiEnabled ?? false;
            } else {
                parsed.defaultSalaryConfig = {
                    dutyPay: 800,
                    standbyPay: 400,
                    pfDeduction: 0,
                    advanceLimit: 5000,
                    isPfEnabled: true,
                    isEsiEnabled: false
                };
            }
            if (!parsed.preferredPaymentMethod) parsed.preferredPaymentMethod = 'upi';
            if (parsed.showUpiOnPdf === undefined) parsed.showUpiOnPdf = true;
            if (parsed.showBankOnPdf === undefined) parsed.showBankOnPdf = false;

            // Sync isPremium with plan (Legacy support)
            if (parsed.plan && parsed.plan !== 'free') {
                parsed.isPremium = true;
            } else if (parsed.isPremium && !parsed.plan) {
                parsed.plan = 'pro';
            }

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
            secondaryPhone: '',
            companyEmail: '',
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
                advanceLimit: 5000,
                isPfEnabled: true,
                isEsiEnabled: false
            },
            preferredPaymentMethod: 'upi',
            showUpiOnPdf: true,
            showBankOnPdf: false
        };
    });

    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

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
                        if (data.settings) {
                            const cloudSettings = data.settings;
                            // Dual-direction sync for legacy support
                            if (cloudSettings.plan && cloudSettings.plan !== 'free') {
                                cloudSettings.isPremium = true;
                            } else if (cloudSettings.isPremium && (!cloudSettings.plan || cloudSettings.plan === 'free')) {
                                cloudSettings.plan = 'pro';
                            }
                            setSettings(prev => ({ ...prev, ...cloudSettings }));
                        }
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
                        const docs = JSON.parse(saved) as { type: string }[];
                        const types = new Set(docs.map(d => d.type));
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
                        if (data.settings) {
                            const cloudSettings = data.settings;
                            if (cloudSettings.plan && cloudSettings.plan !== 'free') {
                                cloudSettings.isPremium = true;
                            }
                            setSettings(prev => ({ ...prev, ...cloudSettings }));
                        }
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

    // 5. Real-time Settings Sync for Simultaneous Devices
    useEffect(() => {
        let channel: RealtimeChannel | null = null;

        const initRealtime = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            channel = supabase
                .channel('public:profiles')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${session.user.id}`,
                    },
                    (payload) => {
                        console.log('Real-time settings sync:', payload);
                        if (payload.new && payload.new.settings) {
                            const newCloudSettings = payload.new.settings;
                            setSettings(prev => {
                                // Prevent infinite loops if local state is same as cloud
                                // Using a deep equal function instead of JSON.stringify to handle Postgres jsonb key reordering
                                const deepEqual = (obj1: unknown, obj2: unknown): boolean => {
                                    if (obj1 === obj2) return true;
                                    if (typeof obj1 !== "object" || typeof obj2 !== "object" || obj1 == null || obj2 == null) return false;
                                    const o1 = obj1 as Record<string, unknown>;
                                    const o2 = obj2 as Record<string, unknown>;
                                    const keys1 = Object.keys(o1);
                                    const keys2 = Object.keys(o2);
                                    if (keys1.length !== keys2.length) return false;
                                    for (const key of keys1) {
                                        if (!keys2.includes(key) || !deepEqual(o1[key], o2[key])) return false;
                                    }
                                    return true;
                                };
                                
                                if (deepEqual(prev, newCloudSettings)) return prev;
                                return { ...prev, ...newCloudSettings };
                            });
                        }
                        if (payload.new && payload.new.driver_code) {
                            setDriverCode(payload.new.driver_code);
                        }
                    }
                )
                .subscribe();
        };

        initRealtime();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') initRealtime();
            if (event === 'SIGNED_OUT' && channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
        });

        return () => {
            if (channel) supabase.removeChannel(channel);
            subscription.unsubscribe();
        };
    }, []);

    // Save to Cloud on Change (Debounced)
    // Manual Save Function
    const saveSettings = async (manualSettings?: Settings): Promise<boolean> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log('Saving settings to cloud...');
                const currentSettings = manualSettings || settingsRef.current;
                const { error, data } = await supabase
                    .from('profiles')
                    .update({ settings: currentSettings, updated_at: new Date().toISOString() })
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
                        settings: currentSettings,
                        updated_at: new Date().toISOString(),
                        email: session.user.email || null
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
        // Force Light Theme - User Request
        // if (settings.theme === 'dark') {
        //     document.documentElement.classList.add('dark');
        // } else {
            document.documentElement.classList.remove('dark');
        // }

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
        const en = translations['en'] as Record<string, string>;
        const langData = (translations as Record<string, Record<string, string>>)[settings.language];
        if (!langData) return en[key] || key;
        return langData[key] || en[key] || key;
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, currentVehicle, t, saveSettings, docStats, setDocStats, driverCode }}>
            {children}
        </SettingsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
