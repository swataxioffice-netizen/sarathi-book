import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * 🚀 Hook to automatically trigger Google One Tap Sign-In for guests
 */
export const useGoogleOneTap = () => {
    const { user, loading: authLoading, signInWithIdToken } = useAuth();
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 1. Dynamically load the Google Identity Services SDK script
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // If user is already logged in, no need to load the script or run One Tap
        if (user || authLoading) return;

        if (window.google?.accounts?.id) {
            setScriptLoaded(true);
            return;
        }

        // Check if script is already injected
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('[GoogleOneTap] GSI Client SDK loaded successfully');
            setScriptLoaded(true);
        };
        script.onerror = (err) => {
            console.error('[GoogleOneTap] Failed to load GSI Client SDK script:', err);
        };

        document.head.appendChild(script);

        return () => {
            // Keep the script loaded to avoid re-fetching, but cancel prompts if active
            if (window.google?.accounts?.id) {
                try {
                    window.google.accounts.id.cancel();
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        };
    }, [user, authLoading]);

    // 2. Initialize and trigger Google One Tap
    useEffect(() => {
        if (!scriptLoaded || !clientId || user || authLoading) return;
        if (!window.google?.accounts?.id) return;

        console.log('[GoogleOneTap] Initializing Google One Tap...');

        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    console.log('[GoogleOneTap] Received ID token from Google One Tap');
                    try {
                        await signInWithIdToken(response.credential);
                        console.log('[GoogleOneTap] Successfully authenticated with Supabase');
                    } catch (error: any) {
                        console.error('[GoogleOneTap] Supabase authentication failed:', error);
                        window.dispatchEvent(new CustomEvent('auth-error', {
                            detail: {
                                title: 'One Tap Sign-In Failed',
                                message: error.message || 'Failed to authenticate ID token with Supabase.',
                                type: 'error'
                            }
                        }));
                    }
                },
                itp_support: true,
                use_fedcm_for_prompt: true, // Crucial for modern Chrome FedCM updates
            });

            window.google.accounts.id.prompt((notification) => {
                console.log('[GoogleOneTap] Prompt notification:', notification);
                if (notification.isNotDisplayed()) {
                    console.warn('[GoogleOneTap] Prompt not displayed reason:', notification.getNotDisplayedReason());
                } else if (notification.isSkippedMoment()) {
                    console.warn('[GoogleOneTap] Prompt skipped reason:', notification.getSkippedReason());
                } else if (notification.isDismissedMoment()) {
                    console.warn('[GoogleOneTap] Prompt dismissed reason:', notification.getDismissedReason());
                }
            });

        } catch (err) {
            console.error('[GoogleOneTap] Error during One Tap initialization/prompt:', err);
        }

        return () => {
            if (window.google?.accounts?.id) {
                try {
                    window.google.accounts.id.cancel();
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        };
    }, [scriptLoaded, clientId, user, authLoading, signInWithIdToken]);
};
