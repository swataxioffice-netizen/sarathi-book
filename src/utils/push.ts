import { getMessagingInstance } from './firebase';
import type { MessagePayload } from 'firebase/messaging';
import { supabase } from './supabase';

export async function subscribeToPush() {
    // RATE LIMIT: Prevent spamming FCM registration
    const lastPrompt = sessionStorage.getItem('fcm_prompt_timestamp');
    const now = Date.now();
    if (lastPrompt && (now - parseInt(lastPrompt) < 60000)) { // 1 minute debounce
        return;
    }
    sessionStorage.setItem('fcm_prompt_timestamp', now.toString());

    if (!('serviceWorker' in navigator)) {
        return;
    }

    try {
        // Initialize messaging only when user explicitly requests push (user gesture)
        const messaging = await getMessagingInstance();
        if (!messaging) {
            return;
        }

        // Only request permission after messaging is confirmed available
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return;
        }

        if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
            return;
        }

        // Wait for Service Worker to be ready
        const registration = await navigator.serviceWorker.ready;

        const { getToken } = await import('firebase/messaging');

        // Get FCM Token
        const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (currentToken) {
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
        }
    } catch (err: unknown) {
        const error = err as { code?: string; message?: string; name?: string };
        if (error.code === 'messaging/permission-blocked' || error.message?.includes('permission')) {
            // Permission blocked - silent fail
        } else if (error.name === 'AbortError' || error.message?.includes('Registration failed')) {
            // Network or VAPID issue - silent fail
        }
        // All errors are swallowed silently in production
    }
}

// Listen for foreground messages - only set up after push has been subscribed
export async function setupForegroundMessages(
    onMessage: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
    try {
        const messaging = await getMessagingInstance();
        if (!messaging) return null;

        const { onMessage: firebaseOnMessage } = await import('firebase/messaging');
        const unsubscribe = firebaseOnMessage(messaging, onMessage);
        return unsubscribe;
    } catch {
        return null;
    }
}
