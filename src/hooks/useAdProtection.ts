import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const FREE_USAGE_LIMIT = 3;

export const useAdProtection = () => {
    const { settings } = useSettings();
    const [showAd, setShowAd] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const triggerAction = (action: () => void, forceBypass: boolean = false) => {
        // 1. If Pro User or forced bypass, always skip ad
        if (settings.isPremium || forceBypass) {
            action();
            return;
        }

        // 2. Check Cooldown (Don't show ad if one was shown in last 60 seconds)
        const lastAdTime = Number(localStorage.getItem('last_ad_shown_at') || 0);
        const cooldownActive = Date.now() - lastAdTime < 60000; // 60s cooldown

        if (cooldownActive) {
            action();
            return;
        }

        // 3. Check Free Usage Count
        const currentCount = Number(localStorage.getItem('ad_free_usage_count') || 0);

        if (currentCount < FREE_USAGE_LIMIT) {
            // Increment count and allow action
            localStorage.setItem('ad_free_usage_count', (currentCount + 1).toString());
            action();
        } else {
            // 4. Limit Reached: Show Ad
            setPendingAction(() => action);
            setShowAd(true);
        }
    };

    const onAdComplete = () => {
        setShowAd(false);
        // Set last ad time to trigger cooldown
        localStorage.setItem('last_ad_shown_at', Date.now().toString());
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
