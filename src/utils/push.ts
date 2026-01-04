import { messaging, getToken, onMessage } from './firebase';
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

        // Wait for Service Worker to be ready to avoid "Registration failed" errors
        const registration = await navigator.serviceWorker.ready;

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
    } catch (err: any) {
        if (err.code === 'messaging/permission-blocked' || err.message?.includes('permission')) {
            console.warn('Notification permission blocked.');
        } else if (err.name === 'AbortError' || err.message?.includes('Registration failed')) {
            console.error('FCM Registration Failed (Network or VAPID issue):', err.message);
        } else {
            console.error('An error occurred while retrieving token:', err);
        }
    }
}

// Listen for foreground messages
export function onMessageListener() {
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            resolve(payload);
        });
    });
}
