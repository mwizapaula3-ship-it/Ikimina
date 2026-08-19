'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useNotification } from '@/components/providers/notification-provider';
import { Button } from '@/components/ui/button';

const demoAccounts = [
  { label: 'Group Admin', value: 'president@group.local / President@2024' },
  { label: 'Treasurer', value: '+250788234567 / Treasurer@2024' },
  { label: 'Secretary', value: '+250788345678 / Secretary@2024' },
  { label: 'Super Admin', value: 'admin@ikimina.local / Admin@2024' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { addNotification } = useNotification();

  const [loading, setLoading] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setFormError(data.error || 'Login failed. Check your details and try again.');
        return;
      }

      const { token, user } = data.data;
      login(token, user);
      addNotification('Login successful', 'success');

      const roleRedirects: { [key: string]: string } = {
        SUPER_ADMIN: '/super-admin/dashboard',
        GROUP_ADMIN: '/admin/dashboard',
        TREASURER: '/treasurer/dashboard',
        SECRETARY: '/secretary/dashboard',
        MEMBER: '/member/dashboard',
      };

      router.push(roleRedirects[user.role] || '/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setFormError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-xl text-white">
            🌱
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your VSLA group</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError && (
              <div
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="emailOrPhone" className="mb-1 block text-sm font-medium text-slate-700">
                Email or phone number
              </label>
              <input
                id="emailOrPhone"
                type="text"
                autoFocus
                autoComplete="username"
                placeholder="user@example.com or +250788123456"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600">
                Remember me
              </label>
            </div>

            <Button type="submit" disabled={loading} fullWidth size="lg">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <details className="mt-6 border-t border-slate-100 pt-4">
            <summary className="cursor-pointer text-center text-xs font-medium text-slate-500 hover:text-slate-700">
              View demo credentials
            </summary>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
              {demoAccounts.map((account) => (
                <li key={account.label} className="flex justify-between gap-2">
                  <span className="font-medium text-slate-600">{account.label}</span>
                  <span className="text-right">{account.value}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
