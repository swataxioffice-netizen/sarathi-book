import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const FREE_USAGE_LIMIT = 3;

export const useAdProtection = () => {
    const { settings } = useSettings();
    const [showAd, setShowAd] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const triggerAction = (action: () => void) => {
        // 1. If Pro User, always skip ad
        if (settings.isPremium) {
            action();
            return;
        }

        // 2. Check Free Usage Count
        const currentCount = Number(localStorage.getItem('ad_free_usage_count') || 0);

        if (currentCount < FREE_USAGE_LIMIT) {
            // Increment count and allow action
            localStorage.setItem('ad_free_usage_count', (currentCount + 1).toString());
            action();
        } else {
            // 3. Limit Reached: Show Ad
            setPendingAction(() => action);
            setShowAd(true);
        }
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
