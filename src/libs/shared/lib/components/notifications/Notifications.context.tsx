import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useProfileContext } from "~/libs/core";
import { dismiss, wasDismissed } from "./localstorage.utils";

export type NotificationType = "success" | "error" | "info" | "warning" | "banner";

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number; // in ms
}

type NotifyPayload = string | (Partial<Notification> & { message: string })

interface NotificationContextType {
    notifications: Notification[];
    notify: (message: NotifyPayload, type?: NotificationType, duration?: number) => Notification | void;
    showBannerNotification: (message: NotifyPayload) => Notification | void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotification must be used within a NotificationProvider");
    return context;
};

export const NotificationProvider: React.FC<{
    children: ReactNode,
}> = ({ children }) => {
    const profileCtx = useProfileContext()
    const uuid = profileCtx.profile?.userId ?? 'annon';
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string, persist?: boolean) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (persist) {
            dismiss(id);
        }
    }, []);

    const notify = useCallback(
        (message: NotifyPayload, type: NotificationType = "info", duration = 3000) => {
            const id = `${uuid}[${typeof message === 'string' ? message : message.id}]`;
            const newNotification: Notification = typeof message === 'string' ? { id, message, type, duration } : { type, duration, ...message, id };

            if (wasDismissed(id)) {
                return;
            }

            setNotifications(prev => [...prev, newNotification]);

            if (duration > 0) {
                setTimeout(() => removeNotification(id), duration);
            }

            return newNotification;
        },
        [uuid]
    );

    const showBannerNotification = useCallback((
        message: NotifyPayload,
    ) => notify(message, 'banner', 0), [notify]);

    return (
        <NotificationContext.Provider value={{ notifications, notify, showBannerNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};
