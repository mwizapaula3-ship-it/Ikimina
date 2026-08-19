'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

const dashboardLinks: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  GROUP_ADMIN: '/admin/dashboard',
  TREASURER: '/treasurer/dashboard',
  SECRETARY: '/secretary/dashboard',
  MEMBER: '/member/dashboard',
};

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const dashboardLink = dashboardLinks[user?.role || ''] || '/login';

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl">
        🔒
      </span>
      <h1 className="mt-5 text-2xl font-bold text-slate-900">You don&rsquo;t have access to this page</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {user
          ? `Your account (${user.role.replaceAll('_', ' ').toLowerCase()}) doesn't have permission to view this.`
          : "You need to sign in to view this page."}
      </p>
      <div className="mt-6 flex gap-3">
        <Button href={user ? dashboardLink : '/login'}>
          {user ? 'Back to my dashboard' : 'Sign in'}
        </Button>
        {user && (
          <button
            onClick={logout}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Logout
          </button>
        )}
      </div>
      <Link href="/" className="mt-6 text-xs text-slate-400 hover:underline">
        Return home
      </Link>
    </div>
  );
}
