'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useNotification } from '@/components/providers/notification-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/ui/dashboard-shell';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminStats {
  totalMembers: number;
  totalSavings: number;
  totalLoans: number;
  complianceRate: number;
  defaultRate: number;
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="GROUP_ADMIN">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { token } = useAuth();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          setStats({
            totalMembers: data.data.group.totalMembers,
            totalSavings: data.data.savings.totalSavings,
            totalLoans: data.data.loans.totalOutstanding,
            complianceRate: data.data.savings.complianceRate,
            defaultRate: data.data.loans.defaultRate,
          });
        }
      } catch (error) {
        console.error('Fetch error:', error);
        addNotification('Error loading dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, addNotification]);

  if (loading) {
    return (
      <DashboardShell>
        <PageHeader title="Admin Dashboard" />
        <div className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader title="Admin Dashboard" subtitle="Manage your VSLA group" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:mb-8 sm:grid-cols-5">
        <StatCard label="Total members" value={stats?.totalMembers || 0} icon="👥" tone="slate" compact />
        <StatCard
          label="Total savings"
          value={`${((stats?.totalSavings || 0) / 1000).toFixed(0)}K RWF`}
          icon="💰"
          tone="brand"
          compact
        />
        <StatCard
          label="Outstanding loans"
          value={`${((stats?.totalLoans || 0) / 1000).toFixed(0)}K RWF`}
          icon="🏦"
          tone="accent"
          compact
        />
        <StatCard
          label="Compliance rate"
          value={`${stats?.complianceRate || 0}%`}
          icon="✅"
          tone="brand"
          compact
        />
        <StatCard
          label="Default rate"
          value={`${stats?.defaultRate || 0}%`}
          icon="📉"
          tone="rose"
          compact
        />
      </div>

      <div className="mb-6 grid gap-6 sm:mb-8 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="mb-4 text-base font-bold text-slate-900">👥 Member management</h2>
          <div className="space-y-3">
            <Button fullWidth size="sm">View all members</Button>
            <Button fullWidth size="sm" variant="accent">Add new member</Button>
            <Button fullWidth size="sm" variant="secondary">Manage roles</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-bold text-slate-900">📊 Analytics &amp; reports</h2>
          <div className="space-y-3">
            <Button href="/analytics" fullWidth size="sm">View full analytics</Button>
            <Button fullWidth size="sm" variant="secondary">Export report (Excel)</Button>
            <Button fullWidth size="sm" variant="secondary">Export report (PDF)</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-bold text-slate-900">⚙️ Group settings</h2>
          <div className="space-y-3">
            <Button fullWidth size="sm" variant="secondary">Edit group info</Button>
            <Button fullWidth size="sm" variant="secondary">Contribution rules</Button>
            <Button fullWidth size="sm" variant="secondary">Reminder templates</Button>
          </div>
        </Card>
      </div>

      <div className="flex gap-3 rounded-2xl bg-brand-50 p-4">
        <span className="text-lg">📈</span>
        <p className="text-sm text-brand-900">
          <strong>Dashboard update:</strong> All statistics are updated in real-time as
          contributions and loans are recorded.
        </p>
      </div>
    </DashboardShell>
  );
}
