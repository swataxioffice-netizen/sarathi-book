import { messaging, getToken, onMessage } from './firebase';
import type { MessagePayload } from 'firebase/messaging';
import { supabase } from './supabase';

export async function subscribeToPush() {
    // RATE LIMIT: Prevent spamming FCM registration
    const lastPrompt = sessionStorage.getItem('fcm_prompt_timestamp');
    const now = Date.now();
    if (lastPrompt && (now - parseInt(lastPrompt) < 60000)) { // 1 minute debouce
        console.log('FCM Registration debounced');
        return;
    }
    sessionStorage.setItem('fcm_prompt_timestamp', now.toString());

    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker is not supported');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission was not granted');
            return;
        }

        if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
            console.warn('VITE_FIREBASE_VAPID_KEY is missing. Push notifications will not work.');
            return;
        }

        // Wait for Service Worker to be ready
        const registration = await navigator.serviceWorker.ready;

        if (!messaging) {
            console.warn('Firebase Messaging instance is not available.');
            return;
        }

        // Get FCM Token
        const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (currentToken) {
            console.log('FCM Token:', currentToken);

            // Avoid re-saving if already up to date in session
            const savedToken = sessionStorage.getItem('fcm_token_saved');
            if (savedToken === currentToken) return currentToken;

            // Save token to Supabase profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('profiles')
                    .update({
                        fcm_token: currentToken,
                        notifications_enabled: true
                    })
                    .eq('id', user.id);

                sessionStorage.setItem('fcm_token_saved', currentToken);
            }

            return currentToken;
        } else {
            console.warn('No registration token available. Request permission to generate one.');
        }
    } catch (err: unknown) {
        const error = err as { code?: string; message?: string; name?: string };
        if (error.code === 'messaging/permission-blocked' || error.message?.includes('permission')) {
            console.warn('Notification permission blocked.');
        } else if (error.name === 'AbortError' || error.message?.includes('Registration failed')) {
            console.error('FCM Registration Failed (Network or VAPID issue):', error.message);
        } else {
            if (error.message?.includes('403') || error.code?.includes('permission-denied')) {
                console.error('🔥 Firebase Permission Error (403): Check your Google Cloud Console.');
                console.error('   1. Ensure "Firebase Installations API" is ENABLED.');
                console.error('   2. Check if your API Key has strict "HTTP Referrer" restrictions (add localhost).');
            }
            console.error('An error occurred while retrieving token:', err);
        }
    }
}

// Listen for foreground messages
export function onMessageListener(): Promise<MessagePayload> {
    return new Promise<MessagePayload>((resolve) => {
        try {
            if (messaging) {
                onMessage(messaging, (payload) => {
                    console.log('Foreground message received:', payload);
                    resolve(payload);
                });
            } else {
                console.warn('Firebase Messaging not initialized, skipping listener.');
            }
        } catch (e: unknown) {
            console.warn('Failed to listen for messages:', e);
        }
    });
}
