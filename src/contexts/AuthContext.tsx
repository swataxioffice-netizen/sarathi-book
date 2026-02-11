import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithIdToken: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync profile to database
    const ensureProfile = async (user: User) => {
        try {
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                name: user.user_metadata.full_name || user.email?.split('@')[0],
                avatar_url: user.user_metadata.avatar_url,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
        } catch (err) {
            console.error('Profile sync failed:', err);
        }
    };

    useEffect(() => {
        // Initial session check
        const initAuth = async () => {
            try {
                console.log('Auth: Initializing session check...');
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Auth: Session fetch error:', error);
                    return;
                }
                const current = session?.user ?? null;
                console.log('Auth: Initial user state:', current ? current.email : 'Guest');
                setUser(current);
                if (current) await ensureProfile(current);
            } catch (err) {
                console.error('Auth: Critical init failure:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth: State Change Event ->', event);
            const current = session?.user ?? null;

            if (event === 'SIGNED_IN') {
                console.log('Auth: User signed in:', current?.email);
                setUser(current);
                if (current) await ensureProfile(current);
            } else if (event === 'SIGNED_OUT') {
                console.log('Auth: User signed out');
                setUser(null);
            } else if (event === 'USER_UPDATED') {
                setUser(current);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            console.log('Auth: Starting Google OAuth flow with origin:', window.location.origin);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: { prompt: 'select_account' }
                }
            });
            if (error) {
                console.error('Auth: Google OAuth Error:', error.message);
                throw error;
            }
        } catch (err: any) {
            console.error('Auth: Google Sign-In failed:', err);
            // Check for common redirect errors
            if (err.message?.includes('redirect_uri')) {
                alert(`Auth Error: This URL (${window.location.origin}) might not be whitelisted in your Supabase Auth settings.`);
            } else {
                alert('Google Sign-In failed: ' + (err.message || 'Unknown error'));
            }
            throw err;
        }
    };

    const signInWithIdToken = async (token: string) => {
        const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: token,
        });
        if (error) throw error;
    };

    const signOut = async () => {
        setUser(null);
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
        window.location.href = '/';
    };

    const isAdmin = !!(user?.email && ['swa.taxioffice@gmail.com'].includes(user.email));

    const value = {
        user,
        loading,
        isAdmin,
        signInWithGoogle,
        signInWithIdToken,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
