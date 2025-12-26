import React, { useEffect, useRef } from 'react';
import { useUpdate } from '../contexts/UpdateContext';
import { useNotifications } from '../contexts/NotificationContext';

const UpdateWatcher: React.FC = () => {
    const { needRefresh } = useUpdate();
    const { addNotification } = useNotifications();
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (needRefresh && !notifiedRef.current) {
            addNotification(
                'New Update Available!',
                'A new version of Sarathi Book is available. Click the blinking refresh button in the header to get the latest features.',
                'warning'
            );
            notifiedRef.current = true;
        } else if (!needRefresh) {
            notifiedRef.current = false;
        }
    }, [needRefresh, addNotification]);

    return null;
};

export default UpdateWatcher;
