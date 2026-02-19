import { supabase } from './supabase';

// Wrapper for Google Analytics 4 (GA4)
// This ensures type safety and centralizes all analytics logic

declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: unknown[];
    }
}

export const initMonitoring = () => {
    // GA4 is initialized in index.html
    console.log('Analytics initialized');
};

export const trackEvent = (
    eventName: string,
    params?: Record<string, string | number | boolean>
) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
    } else {
        console.warn('GA4 not loaded, event missed:', eventName, params);
    }
};

export const trackError = (
    errorDescription: string,
    fatal: boolean = false
) => {
    trackEvent('exception', {
        description: errorDescription,
        fatal: fatal
    });
};

// Specific Business Events (Use these in components)
export const Analytics = {
    // 1. Core Actions
    calculateFare: async (mode: string, vehicle: string, distance: number, pickup: string, drop: string, fare: number) => {
        // 1. Track in Google Analytics
        trackEvent('calculate_fare', {
            trip_mode: mode,
            vehicle_type: vehicle,
            distance_km: distance,
            origin: pickup,
            destination: drop,
            value: fare,
            currency: 'INR'
        });

        // 2. Save to Supabase for "Trending Routes"
        try {
            const { error } = await supabase.from('route_searches').insert({
                pickup_location: pickup,
                drop_location: drop,
                vehicle_type: vehicle,
                trip_type: mode,
                distance_km: distance,
                estimated_fare: fare,
                created_at: new Date().toISOString()
            });

            if (error) {
                console.warn('Failed to log route search to Supabase:', error.message);
            }
        } catch (e) {
            console.error('Error logging search:', e);
        }

        // 3. Log to Admin Analytics for Activity Feed
        Analytics.logActivity('fare_calculated', {
            mode, vehicle, distance, pickup, drop, fare
        });
    },


    generateInvoice: (type: 'invoice' | 'quotation', amount: number) => {
        trackEvent('generate_pdf', {
            document_type: type,
            value: amount,
            currency: 'INR'
        });
    },

    shareApp: (location: 'header' | 'sidenav' | 'mobile_menu') => {
        trackEvent('share_app', {
            source_location: location
        });
    },

    // 2. Engagement
    copyQuote: () => trackEvent('copy_whatsapp_quote'),

    // 3. User Journey
    viewPage: (pageName: string) => {
        trackEvent('screen_view', {
            screen_name: pageName
        });
    },

    // 4. Admin Analytics (Supabase)
    logActivity: (
        type: 'invoice_created' | 'quotation_created' | 'fare_calculated' | 'login' | 'share' |
            'expense_logged' | 'expense_deleted' | 'document_uploaded' | 'document_deleted' |
            'staff_added' | 'payslip_generated' | 'ai_query' | 'note_created' | 'note_updated',
        details: Record<string, unknown>,
        userId?: string
    ) => {
        // Fire and forget in a truly async block
        (async () => {
            try {
                const { error } = await supabase.from('admin_analytics').insert({
                    event_type: type,
                    details: details,
                    user_id: userId || null,
                    created_at: new Date().toISOString()
                });
                if (error) console.warn('Analytics Log Error:', error.message);
            } catch (err) {
                console.error('Analytics Log Exception:', err);
            }
        })();
    }
};

