import * as Sentry from "@sentry/react";
import LogRocket from 'logrocket';

export const initMonitoring = () => {
    // Initialize Sentry
    // Ideally these DSNs come from environment variables
    const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

    if (SENTRY_DSN) {
        Sentry.init({
            dsn: SENTRY_DSN,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration(),
            ],
            // Performance Monitoring
            tracesSampleRate: 1.0, // Capture 100% of the transactions
            // Session Replay
            replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
            replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when an error occurs.
        });
        console.log('Sentry initialized');
    } else {
        console.log('Sentry DSN not found, skipping initialization');
    }

    // Initialize LogRocket
    const LOGROCKET_APP_ID = import.meta.env.VITE_LOGROCKET_APP_ID;

    if (LOGROCKET_APP_ID) {
        LogRocket.init(LOGROCKET_APP_ID);
        console.log('LogRocket initialized');
    } else {
        console.log('LogRocket App ID not found, skipping initialization');
    }
};
