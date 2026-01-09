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
                const { data: { session } } = await supabase.auth.getSession();
                const current = session?.user ?? null;
                setUser(current);
                if (current) ensureProfile(current);
            } catch (err) {
                console.error('Auth init failed:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event);
            const current = session?.user ?? null;
            setUser(current);
            setLoading(false);
            if (current) await ensureProfile(current);

            // Handle cross-tab/external sign out
            if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: { prompt: 'select_account' }
            }
        });
        if (error) throw error;
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
