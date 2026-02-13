import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { generateId } from '../utils/uuid';

import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (title: string, message: string, type?: Notification['type']) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user } = useAuth();

    const addNotification = useCallback((title: string, message: string, type: Notification['type'] = 'info') => {
        const id = generateId();

        const newNotification: Notification = {
            id,
            title,
            message,
            type,
            timestamp: Date.now(),
            read: false,
        };
        setNotifications((prev) => [newNotification, ...prev]);

        // Trigger native browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new window.Notification(title, {
                body: message,
                icon: '/logo.png'
            });
        }
    }, []);

    // Subscribe to real-time notifications from Supabase
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotif = payload.new as any;
                    addNotification(newNotif.title, newNotif.message, newNotif.type);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: 'user_id=is.null',
                },
                (payload) => {
                    const newNotif = payload.new as any;
                    addNotification(newNotif.title, newNotif.message, newNotif.type);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, addNotification]);

    useEffect(() => {
        // Request notification permission on first load
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
                removeNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
