import React from 'react';
import Link from 'next/link';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 disabled:bg-slate-300',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus-visible:outline-slate-400 disabled:text-slate-400',
  accent:
    'bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline-accent-500 disabled:bg-slate-300',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 disabled:bg-slate-300',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
};

const base =
  'inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-150 outline-offset-2 disabled:cursor-not-allowed';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = CommonProps &
  React.ComponentProps<typeof Link> & { href: string };

export function Button({
  variant = 'primary',
  size = 'md',
  pill = false,
  fullWidth = false,
  icon,
  className = '',
  children,
  href,
  ...props
}: ButtonProps | LinkProps) {
  const classes = [
    base,
    variantClasses[variant],
    sizeClasses[size],
    pill ? 'rounded-full' : '',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {children}
      {icon}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(props as Omit<React.ComponentProps<typeof Link>, 'href'>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}
