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
                setUser(currentUser);
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

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const redirectTo = window.location.origin;
        console.log('Initiating Google Sign-in with redirect:', redirectTo);

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
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
