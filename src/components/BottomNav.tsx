import React from 'react';
import { IndianRupee, FileText, Calculator, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    const { isAdmin } = useAuth();

    const tabs = [
        { id: 'dashboard', icon: <IndianRupee size={22} />, label: 'FINANCE' },
        { id: 'trips', icon: <FileText size={22} />, label: 'INVOICE' },
        { id: 'taxi-fare-calculator', icon: <Calculator size={22} />, label: 'ESTIMATE' },
        ...(isAdmin ? [{ id: 'admin', icon: <ShieldCheck size={22} />, label: 'ADMIN' }] : []),
        { id: 'profile', icon: <User size={22} />, label: 'PROFILE' },
    ];

    const isTabActive = (tabId: string) => {
        if (tabId === 'taxi-fare-calculator') {
            return activeTab === 'taxi-fare-calculator' || activeTab === 'calculator' || activeTab === 'fare-calculator';
        }
        return activeTab === tabId;
    };

    return (
        <nav
            aria-label="Bottom navigation"
            style={{
                position: 'fixed',
                bottom: '0px',
                left: '0px',
                right: '0px',
                zIndex: 9999,
                height: '68px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                boxShadow: '0 -5px 20px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
            }}
        >
            {tabs.map((item) => {
                const active = isTabActive(item.id);
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: active ? '#0047AB' : '#64748b',
                            padding: '8px 4px',
                        }}
                    >
                        <span style={{ transform: active ? 'scale(1.1)' : 'scale(1)', display: 'block' }}>
                            {item.icon}
                        </span>
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            marginTop: '3px',
                            letterSpacing: '0.06em',
                        }}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
