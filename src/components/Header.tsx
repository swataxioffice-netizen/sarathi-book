import React from 'react';
import Notifications from './Notifications';

const Header: React.FC = () => {

    return (
        <header className="bg-white border-b-2 border-slate-100 px-5 py-3 flex-none sticky top-0 z-40">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="Sarathi Book"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl font-black text-[#0047AB] leading-none mb-0.5" style={{ fontFamily: 'Korkai', letterSpacing: '-0.02em' }}>
                            SARATHI BOOK
                        </h1>
                        <p className="text-[10px] font-semibold text-slate-500 leading-none tracking-wide" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                            Your digital office on car
                        </p>
                    </div>
                </div>
                <Notifications />
            </div>
        </header>
    );
};

export default Header;
