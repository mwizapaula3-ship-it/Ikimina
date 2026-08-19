import React from 'react';

export function Card({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
