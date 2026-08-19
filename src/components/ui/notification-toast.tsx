'use client';

import React from 'react';
import { useNotification } from '@/components/providers/notification-provider';

const toneStyles = {
  success: { icon: '✓', classes: 'bg-brand-600' },
  error: { icon: '✕', classes: 'bg-rose-600' },
  warning: { icon: '!', classes: 'bg-accent-500' },
  info: { icon: 'i', classes: 'bg-slate-700' },
} as const;

export function NotificationToast() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4">
      {notifications.map((notification) => {
        const tone = toneStyles[notification.type];
        return (
          <div
            key={notification.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-white shadow-lg animate-in fade-in slide-in-from-top-2 sm:slide-in-from-right-full ${tone.classes}`}
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {tone.icon}
            </span>
            <p className="flex-1 text-sm leading-snug">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/70 transition hover:text-white"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
