import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { useUpdate } from './UpdateContext';



// ... existing imports ...

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // Safe to use here because UpdateProvider wraps AuthProvider now
    const { needRefresh } = useUpdate();

    const ensureProfile = async (user: User) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata.avatar_url,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (error) console.error('Error updating profile:', error);
        } catch (err) {
            console.error('Profile sync failed:', err);
        }
    };

    useEffect(() => {
        // Check active sessions and sets the user
        const checkUser = async () => {
            try {
                // Race condition: if getSession takes too long, we stop waiting
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null } }), 5000)
                );

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
                const currentUser = session?.user ?? null;
                // Only update if IDs change to avoid unnecessary re-renders loop
                setUser(prev => prev?.id === currentUser?.id ? prev : currentUser);
                if (currentUser) ensureProfile(currentUser);
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setLoading(false);
            }
        };

        checkUser();

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);
            if (currentUser) await ensureProfile(currentUser);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Helper for Google One Tap
    useEffect(() => {
        let isCancelled = false;
        let intervalId: any = null;

        const initializeOneTap = () => {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!clientId) {
                console.warn('Google Client ID not found in environment');
                return;
            }

            if (user) return; // Already logged in

            const initiate = () => {
                if (isCancelled) return;
                const google = (window as any).google;

                if (google?.accounts?.id) {
                    if (intervalId) clearInterval(intervalId);

                    try {
                        // Pre-emptively cancel any existing prompt to avoid "outstanding request" error
                        google.accounts.id.cancel();

                        google.accounts.id.initialize({
                            client_id: clientId,
                            callback: async (response: any) => {
                                try {
                                    console.log('One Tap callback received');
                                    const { error } = await supabase.auth.signInWithIdToken({
                                        provider: 'google',
                                        token: response.credential,
                                    });
                                    if (error) throw error;
                                    // Successfully signed in - state will update via onAuthStateChange
                                } catch (error: any) {
                                    console.error('One Tap Auth Error:', error.message || error);
                                }
                            },
                            auto_select: true,
                            cancel_on_tap_outside: false,
                            itp_support: true,
                            use_fedcm_for_prompt: true, // Use latest browser standard
                        });

                        // Show prompt
                        google.accounts.id.prompt((notification: any) => {
                            const reason = notification.getNotDisplayedReason();
                            const skippedReason = notification.getSkippedReason();

                            if (notification.isNotDisplayed()) {
                                console.warn('One Tap not displayed:', reason);
                                // If blocked by 'suppressed_by_user', don't retry too often
                            } else if (notification.isSkippedMoment()) {
                                console.warn('One Tap skipped:', skippedReason);
                            } else if (notification.isDismissedMoment()) {
                                console.log('One Tap dismissed by user');
                            }
                        });
                    } catch (err) {
                        console.error('Error during Google One Tap prompt:', err);
                    }
                }
            };

            // Check if script is already loaded
            if ((window as any).google?.accounts?.id) {
                initiate();
            } else {
                intervalId = setInterval(initiate, 1000);
            }
        };

        // We run this if not logged in. We don't strictly block on needRefresh 
        // because One Tap is less intrusive and auth is critical.
        if (!user) {
            initializeOneTap();
        }

        return () => {
            isCancelled = true;
            if (intervalId) clearInterval(intervalId);
            const google = (window as any).google;
            if (google?.accounts?.id) {
                try {
                    google.accounts.id.cancel();
                } catch (e) {
                    // Ignore
                }
            }
        };
    }, [user, needRefresh]);

    // ... existing content ...

    const signInWithGoogle = async () => {
        const redirectTo = window.location.origin;
        console.log('Initiating Google Sign-in with redirect:', redirectTo);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: 'offline',
                },
            }
        });

        if (error) {
            console.error('Supabase OAuth Error:', error);
            throw error;
        }

        console.log('OAuth initiated:', data);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const isAdmin = user?.email ? [
        'swa.taxioffice@gmail.com'
    ].includes(user.email) : false;

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
