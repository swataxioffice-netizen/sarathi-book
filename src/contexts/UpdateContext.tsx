import React, { createContext, useContext } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface UpdateContextType {
    needRefresh: boolean;
    setNeedRefresh: (val: boolean) => void;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    offlineReady: boolean;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        offlineReady: [offlineReady, _setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // Check for updates every 10 minutes (aggressive for drivers)
            r && setInterval(() => {
                r.update();
            }, 10 * 60 * 1000);
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    return (
        <UpdateContext.Provider value={{ needRefresh, setNeedRefresh, updateServiceWorker, offlineReady }}>
            {children}
        </UpdateContext.Provider>
    );
};

export const useUpdate = () => {
    const context = useContext(UpdateContext);
    if (context === undefined) {
        throw new Error('useUpdate must be used within an UpdateProvider');
    }
    return context;
};
