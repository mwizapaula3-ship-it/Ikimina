'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useNotification } from '@/components/providers/notification-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/ui/dashboard-shell';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';

interface SecretaryStats {
  groupName: string;
  totalMembers: number;
  totalSavings: number;
  totalOutstanding: number;
  complianceRate: number;
  defaultRate: number;
  contributionSummary: { paid: number; late: number; missed: number };
}

export default function SecretaryDashboard() {
  return (
    <ProtectedRoute requiredRole="SECRETARY">
      <SecretaryDashboardContent />
    </ProtectedRoute>
  );
}

function SecretaryDashboardContent() {
  const { token } = useAuth();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState<SecretaryStats | null>(null);
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
            groupName: data.data.group.name,
            totalMembers: data.data.group.totalMembers,
            totalSavings: data.data.savings.totalSavings,
            totalOutstanding: data.data.loans.totalOutstanding,
            complianceRate: data.data.savings.complianceRate,
            defaultRate: data.data.loans.defaultRate,
            contributionSummary: data.data.savings.contributionSummary,
          });
        } else {
          addNotification('Failed to load analytics', 'error');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        addNotification('Error loading analytics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, addNotification]);

  if (loading) {
    return (
      <DashboardShell>
        <PageHeader title="Secretary Dashboard" />
        <div className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Secretary Dashboard"
        subtitle={stats ? `Read-only overview of ${stats.groupName}` : 'Read-only group overview'}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:mb-8 sm:grid-cols-4">
        <StatCard label="Total members" value={stats?.totalMembers || 0} icon="👥" tone="slate" />
        <StatCard
          label="Total savings"
          value={`${(stats?.totalSavings || 0).toLocaleString()} RWF`}
          icon="💰"
          tone="brand"
        />
        <StatCard
          label="Outstanding loans"
          value={`${(stats?.totalOutstanding || 0).toLocaleString()} RWF`}
          icon="🏦"
          tone="accent"
        />
        <StatCard label="Compliance rate" value={`${stats?.complianceRate || 0}%`} icon="✅" tone="brand" />
      </div>

      <div className="mb-6 grid gap-6 sm:mb-8 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Contribution status</h2>
          <div className="space-y-3">
            {[
              { label: 'Paid', value: stats?.contributionSummary.paid || 0, tone: 'bg-brand-500' },
              { label: 'Late', value: stats?.contributionSummary.late || 0, tone: 'bg-accent-500' },
              { label: 'Missed', value: stats?.contributionSummary.missed || 0, tone: 'bg-rose-500' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.tone}`} />
                  <span className="text-slate-600">{row.label}</span>
                </div>
                <span className="font-semibold text-slate-900">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Loan health</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Default rate</span>
            <span className="font-semibold text-slate-900">{stats?.defaultRate || 0}%</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Report exports (Excel/PDF) are on the roadmap — not available yet.
          </p>
        </Card>
      </div>

      <div className="flex gap-3 rounded-2xl bg-brand-50 p-4">
        <span className="text-lg">📋</span>
        <p className="text-sm text-brand-900">
          <strong>Secretary access:</strong> You have read-only visibility into this group&rsquo;s
          savings and loan performance.
        </p>
      </div>
    </DashboardShell>
  );
}
