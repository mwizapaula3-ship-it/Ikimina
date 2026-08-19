'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  GROUP_ADMIN: 'Group Admin',
  TREASURER: 'Treasurer',
  SECRETARY: 'Secretary',
  MEMBER: 'Member',
};

const dashboardLinks: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  GROUP_ADMIN: '/admin/dashboard',
  TREASURER: '/treasurer/dashboard',
  SECRETARY: '/secretary/dashboard',
  MEMBER: '/member/dashboard',
};

function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-lg font-bold text-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        🌱
      </span>
      Ikimina
    </Link>
  );
}

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo href="/" />
          <Link
            href="/login"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Login
          </Link>
        </div>
      </nav>
    );
  }

  const dashboardLink = dashboardLinks[user?.role || 'MEMBER'] || '/member/dashboard';

  const links = [{ href: dashboardLink, label: 'Dashboard' }];
  if (['GROUP_ADMIN', 'TREASURER'].includes(user?.role || '')) {
    links.push({ href: '/contributions', label: 'Contributions' }, { href: '/loans', label: 'Loans' });
  }
  if (['GROUP_ADMIN', 'SECRETARY'].includes(user?.role || '')) {
    links.push({ href: '/analytics', label: 'Analytics' });
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo href={dashboardLink} />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{roleLabels[user?.role || ''] || user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            Logout
          </button>
        </div>

        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-2 md:hidden">
          <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{roleLabels[user?.role || ''] || user?.role}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="mt-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
