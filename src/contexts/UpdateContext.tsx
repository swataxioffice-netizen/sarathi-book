import React, { createContext, useContext } from 'react';


interface UpdateContextType {
    needRefresh: boolean;
    setNeedRefresh: (val: boolean) => void;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    offlineReady: boolean;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <UpdateContext.Provider
            value={{
                needRefresh: false,
                setNeedRefresh: () => { },
                updateServiceWorker: async () => { },
                offlineReady: false,
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
