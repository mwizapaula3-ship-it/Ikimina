import React from 'react';

export function DashboardShell({
  children,
  maxWidth = '6xl',
}: {
  children: React.ReactNode;
  maxWidth?: '4xl' | '6xl';
}) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className={`mx-auto w-full ${maxWidth === '4xl' ? 'max-w-4xl' : 'max-w-6xl'}`}>
        {children}
      </div>
    </div>
  );
}
