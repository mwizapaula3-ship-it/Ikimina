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

interface MemberStats {
  totalSavings: number;
  totalLoans: number;
  nextPaymentDue?: Date;
  complianceRate: number;
}

export default function MemberDashboard() {
  return (
    <ProtectedRoute requiredRole="MEMBER">
      <MemberDashboardContent />
    </ProtectedRoute>
  );
}

function MemberDashboardContent() {
  const { user, token } = useAuth();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/members/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          setStats({
            totalSavings: data.data.statistics.totalSavings,
            totalLoans: data.data.statistics.totalOutstandingLoan,
            complianceRate: data.data.statistics.complianceRate,
          });
        } else {
          addNotification('Failed to load dashboard', 'error');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        addNotification('Error loading dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, user, addNotification]);

  if (loading) {
    return (
      <DashboardShell maxWidth="4xl">
        <PageHeader title="My Dashboard" />
        <div className="animate-pulse space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200" />
            ))}
          </div>
          <div className="h-40 rounded-2xl bg-slate-200" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell maxWidth="4xl">
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]}!`} subtitle="Here's your financial summary" />

      <div className="mb-6 grid gap-4 sm:mb-8 sm:grid-cols-3">
        <StatCard
          label="Total savings"
          value={`${(stats?.totalSavings || 0).toLocaleString()} RWF`}
          helper="All contributions recorded"
          icon="💰"
          tone="brand"
        />
        <StatCard
          label="Outstanding loans"
          value={`${(stats?.totalLoans || 0).toLocaleString()} RWF`}
          helper="Amount still to repay"
          icon="🏦"
          tone="accent"
        />
        <StatCard
          label="Compliance rate"
          value={`${stats?.complianceRate || 0}%`}
          helper="On-time contributions"
          icon="✅"
          tone="brand"
        />
      </div>

      <Card className="mb-6 p-6 sm:mb-8">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="secondary">View contribution history</Button>
          <Button variant="secondary">View loan details</Button>
          <Button variant="secondary">Ask the assistant</Button>
        </div>
      </Card>

      <div className="flex gap-3 rounded-2xl bg-brand-50 p-4">
        <span className="text-lg">💡</span>
        <p className="text-sm text-brand-900">
          <strong>Tip:</strong> Keep contributing regularly to maintain your eligibility for loans.
          Our chatbot assistant can answer questions about your savings and finances.
        </p>
      </div>
    </DashboardShell>
  );
}
