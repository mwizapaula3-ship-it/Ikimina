'use client';

import React, { ReactNode, useState, useCallback, createContext, useContext } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning', duration = 5000) => {
      const id = Date.now().toString();
      const notification = { id, type, message, duration };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => removeNotification(id), duration);
      }
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
