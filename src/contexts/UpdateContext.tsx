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
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
        offlineReady: [offlineReady],
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    return (
        <UpdateContext.Provider
            value={{
                needRefresh,
                setNeedRefresh,
                updateServiceWorker,
                offlineReady,
            }}
        >
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
