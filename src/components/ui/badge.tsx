import React from 'react';

type Tone = 'brand' | 'accent' | 'rose' | 'slate';

const toneClasses: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  accent: 'bg-accent-50 text-accent-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
};

// Maps common domain statuses to a visual tone so callers can pass a raw status string.
const statusTone: Record<string, Tone> = {
  PAID: 'brand',
  ACTIVE: 'brand',
  REPAID: 'brand',
  LATE: 'accent',
  MISSED: 'rose',
  DEFAULTED: 'rose',
};

export function Badge({
  children,
  tone,
  className = '',
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const resolvedTone =
    tone ?? statusTone[String(children).toUpperCase()] ?? 'slate';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[resolvedTone]} ${className}`}
    >
      {children}
    </span>
  );
}
