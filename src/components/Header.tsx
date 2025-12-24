import React from 'react';
import { Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b-2 border-slate-100 px-5 py-3 flex-none sticky top-0 z-40">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#0047AB] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                        <Briefcase size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">
                            SARATHI BOOK
                        </h1>
                        <p className="text-[10px] font-black text-[#0047AB] uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#0047AB] animate-pulse"></span>
                            {user?.user_metadata?.full_name?.toUpperCase() || 'OFFICIAL SYSTEM'}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
