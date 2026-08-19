import React from 'react';

export const inputClasses =
  'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-slate-700">{children}</label>;
}
