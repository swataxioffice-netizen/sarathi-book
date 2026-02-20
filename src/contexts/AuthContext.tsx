import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    originalUser: User | null;
    signInWithGoogle: () => Promise<void>;
    signInWithIdToken: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    impersonateUser: (userId: string) => Promise<void>;
    stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [originalUser, setOriginalUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync profile to database
    const ensureProfile = async (user: User) => {
        try {
            const metadata = user.user_metadata || {};
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                name: metadata.full_name || user.email?.split('@')[0],
                avatar_url: metadata.avatar_url || metadata.picture || metadata.avatarUrl,
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
                
                // Handle impersonation recovery on refresh
                const impersonatedId = localStorage.getItem('impersonated_user_id');
                const isAdmin = current?.email && ['swa.taxioffice@gmail.com', 'customercare@swataxioffice.com'].includes(current.email);

                if (impersonatedId && isAdmin) {
                    console.log('Auth: Recovering impersonation for user:', impersonatedId);
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', impersonatedId).single();
                    if (profile) {
                        const impersonated: User = {
                            id: profile.id,
                            aud: 'authenticated',
                            role: 'authenticated',
                            email: profile.email,
                            email_confirmed_at: new Date().toISOString(),
                            phone: profile.phone,
                            confirmation_sent_at: '',
                            confirmed_at: new Date().toISOString(),
                            last_sign_in_at: new Date().toISOString(),
                            app_metadata: { provider: 'email' },
                            user_metadata: {
                                full_name: profile.name,
                                avatar_url: profile.avatar_url,
                                ...profile
                            },
                            created_at: profile.created_at || new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            is_anonymous: false
                        };
                        setOriginalUser(current);
                        setUser(impersonated);
                    } else {
                        localStorage.removeItem('impersonated_user_id');
                        setUser(current);
                    }
                } else {
                    setUser(current);
                }

                if (current) ensureProfile(current);
            } catch (err) {
                console.error('Auth: Critical init failure:', err);
            } finally {
                setLoading(false);
            }
        };

        // Safety timeout: Ensure loading is never true for more than 10 seconds
        const timeout = setTimeout(() => {
            setLoading(current => {
                if (current) console.warn('Auth: Loading stuck for 10s, forcing false');
                return false;
            });
        }, 10000);

        initAuth();

        // Auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth: State Change Event ->', event);
            
            // If we sign out the TRUE user, clear impersonation
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('impersonated_user_id');
                setOriginalUser(null);
                setUser(null);
                setLoading(false);
                return;
            }

            // Ignore auth state changes if we are currently impersonating
            if (localStorage.getItem('impersonated_user_id')) return;

            const current = session?.user ?? null;

            if (event === 'SIGNED_IN') {
                console.log('Auth: User signed in:', current?.email);
                setUser(current);
                if (current) ensureProfile(current); 
            } else if (event === 'USER_UPDATED') {
                console.log('Auth: User metadata updated');
                setUser(current);
                if (current) ensureProfile(current);
            }

            setLoading(false);
        });

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
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
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Auth: Google Sign-In failed:', err);
            // Check for common redirect errors
            if (error.message?.includes('redirect_uri')) {
                alert(`Auth Error: This URL (${window.location.origin}) might not be whitelisted in your Supabase Auth settings.`);
            } else {
                alert('Google Sign-In failed: ' + (error.message || 'Unknown error'));
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
        if (originalUser || localStorage.getItem('impersonated_user_id')) {
            // If impersonating, just stop impersonating
            stopImpersonation();
            return;
        }
        setUser(null);
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
        window.location.href = '/';
    };

    const refreshProfile = async () => {
        try {
            console.log('Auth: Refreshing profile...');
            const { data: { session }, error } = await supabase.auth.refreshSession();
            if (error) throw error;
            
            if (session?.user) {
                console.log('Auth: Profile metadata refreshed');
                await ensureProfile(session.user);
                setUser(session.user);
            }
        } catch (err) {
            console.error('Auth: Refresh session failed:', err);
            throw err;
        }
    };

    const impersonateUser = async (userId: string) => {
        // Security check: Must assume current actual user is admin
        const currentUser = originalUser || user;
        const currentIsAdmin = !!(currentUser?.email && ['swa.taxioffice@gmail.com', 'customercare@swataxioffice.com'].includes(currentUser.email));

        if (!currentIsAdmin) {
            console.error("Unauthorized impersonation attempt");
            return;
        }

        try {
            // Fetch target profile
            const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

            if (error) throw error;
            if (!profile) throw new Error("User profile not found");

            // Store original user if not already stored
            if (!originalUser) {
                setOriginalUser(user);
            }
            
            // Persist impersonation
            localStorage.setItem('impersonated_user_id', userId);

            // Construct valid User object
            const impersonated: User = {
                id: profile.id,
                aud: 'authenticated',
                role: 'authenticated',
                email: profile.email,
                email_confirmed_at: new Date().toISOString(),
                phone: profile.phone,
                confirmation_sent_at: '',
                confirmed_at: new Date().toISOString(),
                last_sign_in_at: new Date().toISOString(),
                app_metadata: { provider: 'email' },
                user_metadata: {
                    full_name: profile.name,
                    avatar_url: profile.avatar_url || profile.picture || profile.avatarUrl,
                    ...profile // Access to other profile fields if needed
                },
                created_at: profile.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_anonymous: false
            };

            setUser(impersonated);
            console.log(`Impersonating user: ${profile.email}`);
            // Force reload to refresh data
            window.location.href = '/dashboard';

        } catch (err: unknown) {
            const error = err as Error;
            console.error("Impersonation failed:", err);
            alert("Failed to impersonate user: " + error.message);
        }
    };

    const stopImpersonation = () => {
        localStorage.removeItem('impersonated_user_id');
        if (originalUser) {
            console.log("Stopping impersonation, reverting to:", originalUser.email);
            setUser(originalUser);
            setOriginalUser(null);
            window.location.href = '/admin';
        } else {
            // Fallback if originalUser was lost from state but localStorage was present
            window.location.href = '/admin';
        }
    };

    // Admin check looks at ORIGINAL user if impersonating
    const checkUser = originalUser || user;
    const isAdmin = !!(checkUser?.email && ['swa.taxioffice@gmail.com', 'customercare@swataxioffice.com'].includes(checkUser.email));

    const value = {
        user,
        loading,
        isAdmin,
        originalUser,
        signInWithGoogle,
        signInWithIdToken,
        signOut,
        refreshProfile,
        impersonateUser,
        stopImpersonation
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
