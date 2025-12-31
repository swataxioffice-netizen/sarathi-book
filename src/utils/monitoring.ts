
// Wrapper for Google Analytics 4 (GA4)
// This ensures type safety and centralizes all analytics logic

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
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
    calculateFare: (mode: string, vehicle: string, distance: number) => {
        trackEvent('calculate_fare', {
            trip_mode: mode,
            vehicle_type: vehicle,
            distance_km: distance
        });
    },

    generateInvoice: (type: 'invoice' | 'quotation', amount: number) => {
        trackEvent('generate_pdf', {
            document_type: type,
            value: amount,
            currency: 'INR'
        });
    },

    shareApp: (location: 'header' | 'sidenav') => {
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
    }
};
