import { useState } from 'react';

/**
 * Hook to manage ad protection.
 * MODIFIED: Advertisement logic removed as per user request to ensure 
 * reliability of "Save & Share" operations.
 */
export const useAdProtection = () => {
    // We keep state variables to avoid breaking existing component imports
    // but they will always remain at their default "off" values.
    const [showAd, setShowAd] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const triggerAction = (action: () => void) => {
        // execute action immediately
        action();
    };

    const onAdComplete = () => {
        setShowAd(false);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    return {
        showAd,
        setShowAd,
        triggerAction,
        onAdComplete
    };
};
