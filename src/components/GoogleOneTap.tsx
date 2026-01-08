import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * 🛡️ Google One Tap (Dynamic Shielded Version)
 * - Only loads the Google Script on valid origins (localhost or production).
 * - Prevents crashes on mobile/IP-based development (192.168.x.x).
 * - Manual Sign-In button remains as the primary backup.
 */
const GoogleOneTap: React.FC = () => {
    const { user, signInWithIdToken } = useAuth();
    const initialized = useRef(false);

    useEffect(() => {
        // 1. Initial State Checks
        if (user || initialized.current) return;

        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

        // 🛡️ STOP: Google prevents One Tap on IP addresses. 
        if (isIP && !isLocalhost) {
            console.log('🛡️ GSI: One Tap is disabled on IP-based origins (use localhost or a domain).');
            return;
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.warn('🛡️ GSI: Missing VITE_GOOGLE_CLIENT_ID in environment variables.');
            return;
        }

        // 2. Auth Handler
        const handleResponse = async (response: any) => {
            console.log('🛡️ GSI: Credential received, signing in with token...');
            try {
                await signInWithIdToken(response.credential);
            } catch (err) {
                console.error('🛡️ GSI: Supabase Auth failed', err);
            }
        };

        // 3. Dynamic Script Loading & Init
        const loadAndInit = () => {
            if ((window as any).google?.accounts?.id) {
                initGSI();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initGSI;
            document.head.appendChild(script);
        };

        const initGSI = () => {
            const google = (window as any).google;
            if (!google?.accounts?.id || initialized.current) return;

            try {
                // 🔍 DIAGNOSTIC: Check Client ID format
                if (!clientId.includes('.apps.googleusercontent.com')) {
                    console.error('🛡️ GSI: Client ID looks invalid. It should end with .apps.googleusercontent.com');
                }

                google.accounts.id.initialize({
                    client_id: clientId.trim(),
                    callback: handleResponse,
                    use_fedcm_for_prompt: false, // 🛠️ FIX: Disable FedCM as it requires complex server setup (.well-known/fedcm.json)
                    itp_support: true,
                    auto_select: false,
                    cancel_on_tap_outside: false, // Prevent accidental dismissal
                    context: 'signin'
                });

                // Display the prompt & log the status
                google.accounts.id.prompt((notification: any) => {
                    if (notification.isNotDisplayed()) {
                        console.warn('🛡️ GSI: Prompt hidden -', notification.getNotDisplayedReason());
                    } else if (notification.isSkippedMoment()) {
                        console.log('🛡️ GSI: Prompt skipped -', notification.getSkippedReason());
                    } else if (notification.isDismissedMoment()) {
                        console.log('🛡️ GSI: Prompt dismissed -', notification.getDismissedReason());
                    }
                });

                initialized.current = true;
                console.log('🛡️ GSI: One Tap initialized and prompt requested.');
            } catch (err) {
                console.error('🛡️ GSI: Initialization error', err);
            }
        };

        loadAndInit();
    }, [user, signInWithIdToken]);

    return null;
};

export default GoogleOneTap;
