import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUpdate } from '../contexts/UpdateContext';

const GoogleOneTap: React.FC = () => {
    const { user, signInWithIdToken } = useAuth();
    const { needRefresh } = useUpdate();
    const initialized = useRef(false);

    useEffect(() => {
        // Only run if not logged in and no update is pending
        if (user || needRefresh || initialized.current) return;

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.warn('Google Client ID missing for One Tap');
            return;
        }

        const handleOneTapResponse = async (response: any) => {
            try {
                console.log('One Tap response received');
                await signInWithIdToken(response.credential);
            } catch (error: any) {
                console.error('One Tap Auth Failed:', error.message);
            }
        };

        const initializeGSI = () => {
            const google = (window as any).google;
            if (google?.accounts?.id) {
                try {
                    console.log('Initializing Google One Tap...');
                    google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleOneTapResponse,
                        auto_select: true,
                        cancel_on_tap_outside: false,
                        itp_support: true,
                        use_fedcm_for_prompt: true
                    });

                    google.accounts.id.prompt((notification: any) => {
                        if (notification.isNotDisplayed()) {
                            console.log('One Tap prompt not displayed:', notification.getNotDisplayedReason());
                        } else if (notification.isSkippedMoment()) {
                            console.log('One Tap prompt skipped:', notification.getSkippedReason());
                        }
                    });

                    initialized.current = true;
                } catch (err) {
                    console.error('GSI Initialization Error:', err);
                }
            }
        };

        // Poll for script loading if not immediately available
        const interval = setInterval(() => {
            if ((window as any).google?.accounts?.id) {
                clearInterval(interval);
                initializeGSI();
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (initialized.current) {
                const google = (window as any).google;
                if (google?.accounts?.id) {
                    google.accounts.id.cancel();
                }
            }
        };
    }, [user, needRefresh, signInWithIdToken]);

    return null; // Invisible component
};

export default GoogleOneTap;
