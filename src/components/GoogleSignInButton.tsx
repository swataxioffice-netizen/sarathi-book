import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
    className?: string;
    text?: string;
    variant?: 'full' | 'compact' | 'minimal';
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    className = '',
    text = "Sign in with Google",
    variant = 'full'
}) => {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            console.error('Sign-in error:', error);
            // Error handling UI could go here
            setIsLoading(false);
        }
    };

    // Premium common styles
    const baseStyles = "relative flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group";

    if (variant === 'compact') {
        return (
            <button
                onClick={handleSignIn}
                disabled={isLoading}
                className={`${baseStyles} px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 ${className}`}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                    <GoogleIcon />
                )}
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                        {isLoading ? 'Verifying...' : 'Login'}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Google</span>
                </div>
            </button>
        );
    }

    if (variant === 'minimal') {
        return (
            <button
                onClick={handleSignIn}
                disabled={isLoading}
                className={`${baseStyles} w-12 h-12 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-lg hover:border-blue-500 transition-all ${className}`}
                title={text}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                    <GoogleIcon className="w-6 h-6" />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            disabled={isLoading}
            className={`${baseStyles} w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 hover:shadow-blue-500/10 hover:border-blue-500 hover:-translate-y-0.5 ${className}`}
        >
            {/* Visual background flair */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                    <GoogleIcon className="w-5 h-5" />
                )}
                <span className="text-sm font-black tracking-tight uppercase">
                    {isLoading ? 'Connecting Securely...' : text}
                </span>
            </div>

            {/* Gloss shine effect */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shine" />
        </button>
    );
};

const GoogleIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

export default GoogleSignInButton;
