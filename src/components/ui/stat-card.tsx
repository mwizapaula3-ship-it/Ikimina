import React from 'react';
import { Card } from './card';

type Tone = 'brand' | 'accent' | 'rose' | 'slate';

const toneClasses: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  accent: 'bg-accent-50 text-accent-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  compact?: boolean;
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  tone = 'slate',
  compact = false,
}: StatCardProps) {
  return (
    <Card className={compact ? 'p-4' : 'p-5 sm:p-6'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p
            className={`mt-1.5 font-bold text-slate-900 ${
              compact ? 'text-xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {value}
          </p>
          {helper && <p className="mt-1.5 text-xs text-slate-500">{helper}</p>}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${toneClasses[tone]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
