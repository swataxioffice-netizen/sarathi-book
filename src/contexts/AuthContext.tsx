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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
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

    // Helper for Google One Tap - separated to avoid re-subscribing to auth changes
    useEffect(() => {
        const initializeOneTap = () => {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!clientId) {
                console.warn('Google Client ID not found in environment variables (VITE_GOOGLE_CLIENT_ID)');
                return;
            }
            if (user) return;

            // Wait for script to load if it hasn't yet
            const interval = setInterval(() => {
                const google = (window as any).google;
                if (google?.accounts?.id) {
                    clearInterval(interval);
                    google.accounts.id.initialize({
                        client_id: clientId,
                        callback: async (response: any) => {
                            const { data, error } = await supabase.auth.signInWithIdToken({
                                provider: 'google',
                                token: response.credential,
                            });
                            if (error) console.error('One Tap Error:', error);
                            if (data.user) {
                                setUser(data.user);
                                await ensureProfile(data.user);
                            }
                        },
                        auto_select: true,
                        cancel_on_tap_outside: false,
                    });
                    google.accounts.id.prompt();
                }
            }, 1000);

            return () => clearInterval(interval);
        };

        const cleanupOneTap = initializeOneTap();
        return () => {
            if (cleanupOneTap) cleanupOneTap();
        };
    }, [user]);

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
