import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    if (variant === 'compact') {
        return (
            <button
                onClick={handleSignIn}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 bg-[#F8FAFF] border border-blue-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all active:scale-95 group ${loading ? 'opacity-70 cursor-wait' : ''} ${className}`}
                title="Sign in with Google"
            >
                <div className="shrink-0 flex items-center justify-center w-5 h-5">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                    )}
                </div>
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">{loading ? 'Logging in...' : 'Login'}</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">with Google</span>
                </div>
            </button>
        );
    }

    if (variant === 'minimal') {
        return (
            <button
                onClick={handleSignIn}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all active:scale-95 ${loading ? 'opacity-70 cursor-wait' : ''} ${className}`}
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">{loading ? 'Please Wait...' : text}</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            disabled={loading}
            className={`
                flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-200
                hover:bg-slate-50 hover:border-blue-400 hover:shadow-md transition-all active:scale-[0.98]
                rounded-xl px-5 py-3 shadow-sm
                ${loading ? 'opacity-70 cursor-wait' : ''}
                ${className}
            `}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
            )}
            <span className="text-sm font-bold tracking-tight">{loading ? 'Signing in...' : text}</span>
        </button>
    );
};

export default GoogleSignInButton;

