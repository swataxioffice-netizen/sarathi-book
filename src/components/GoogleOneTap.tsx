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
        // We stop here to avoid script errors that could cause a white screen on mobile.
        if (isIP && !isLocalhost) {
            console.log('🛡️ GSI: Disabled on IP origin to ensure stability.');
            return;
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        // 2. Auth Handler
        const handleResponse = async (response: any) => {
            try {
                await signInWithIdToken(response.credential);
            } catch (err) {
                console.error('🛡️ GSI: Auth Failed', err);
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
                const isSecure = window.location.protocol === 'https:';

                google.accounts.id.initialize({
                    client_id: clientId.trim(),
                    callback: handleResponse,
                    use_fedcm_for_prompt: isSecure, // Only use FedCM on HTTPS (Production)
                    itp_support: true,
                    auto_select: false,
                    context: 'signin'
                });

                google.accounts.id.prompt();
                initialized.current = true;
                console.log('🛡️ GSI: One Tap initialized successfully.');
            } catch (err) {
                console.warn('🛡️ GSI: Background initialization suppressed.', err);
            }
        };

        loadAndInit();

        return () => {
            // No cleanup required for global script
        };
    }, [user, signInWithIdToken]);

    return null;
};

export default GoogleOneTap;
