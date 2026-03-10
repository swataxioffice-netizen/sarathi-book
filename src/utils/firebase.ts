import { initializeApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app (lightweight - does NOT trigger notification permission)
const app = initializeApp(firebaseConfig);

// Lazily initialize Firebase Cloud Messaging only when explicitly needed.
// NOT at module load time — avoids triggering Notification.requestPermission() on page load,
// which would cause Lighthouse Best Practices "notification-on-start" failure.
let _messaging: Messaging | null = null;
let _messagingInitialized = false;

export async function getMessagingInstance(): Promise<Messaging | null> {
    if (_messagingInitialized) return _messaging;
    _messagingInitialized = true;
    try {
        const { getMessaging } = await import("firebase/messaging");
        _messaging = getMessaging(app);
        return _messaging;
    } catch {
        return null;
    }
}

export { app };
export type { Messaging };
