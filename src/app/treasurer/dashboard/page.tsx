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

interface TreasurerStats {
  totalCollectedThisCycle: number;
  membersOutstanding: number;
  pendingLoans: number;
  defaultRate: number;
}

export default function TreasurerDashboard() {
  return (
    <ProtectedRoute requiredRole="TREASURER">
      <TreasurerDashboardContent />
    </ProtectedRoute>
  );
}

function TreasurerDashboardContent() {
  const { token } = useAuth();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState<TreasurerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [remindersLoading, setRemindersLoading] = useState(false);

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
            totalCollectedThisCycle: data.data.savings.totalPaid,
            membersOutstanding:
              data.data.savings.contributionSummary.missed +
              data.data.savings.contributionSummary.late,
            pendingLoans: data.data.loans.byStatus.ACTIVE,
            defaultRate: data.data.loans.defaultRate,
          });
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

  const handleRunReminders = async () => {
    setRemindersLoading(true);
    try {
      const response = await fetch('/api/reminders/check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        addNotification(`${data.data.remindersSent} reminder(s) sent`, 'success');
      } else {
        addNotification(data.error || 'Failed to send reminders', 'error');
      }
    } catch (error) {
      console.error('Reminder error:', error);
      addNotification('Error sending reminders', 'error');
    } finally {
      setRemindersLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <PageHeader title="Treasurer Dashboard" />
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
      <PageHeader title="Treasurer Dashboard" subtitle="Manage contributions, loans, and send reminders" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:mb-8 sm:grid-cols-4">
        <StatCard
          label="Collected this cycle"
          value={`${(stats?.totalCollectedThisCycle || 0).toLocaleString()} RWF`}
          icon="💰"
          tone="brand"
        />
        <StatCard
          label="Members outstanding"
          value={stats?.membersOutstanding || 0}
          icon="⚠️"
          tone="rose"
        />
        <StatCard label="Active loans" value={stats?.pendingLoans || 0} icon="🏦" tone="accent" />
        <StatCard label="Default rate" value={`${stats?.defaultRate || 0}%`} icon="📉" tone="rose" />
      </div>

      <div className="mb-6 grid gap-6 sm:mb-8 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">📋 Data entry</h2>
          <div className="space-y-3">
            <Button href="/contributions" fullWidth>
              Record individual contribution
            </Button>
            <Button href="/contributions?mode=bulk" fullWidth>
              Bulk entry (this meeting)
            </Button>
            <Button href="/loans" fullWidth variant="accent">
              Record loan repayment
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">🔔 Notifications</h2>
          <Button onClick={handleRunReminders} disabled={remindersLoading} fullWidth size="lg">
            {remindersLoading ? 'Sending…' : '✉️ Run reminder check'}
          </Button>
          <p className="mt-3 text-xs text-slate-500">
            Sends simulated SMS reminders to members with overdue payments.
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Recent activity</h2>
        <p className="text-sm text-slate-500">Contribution and repayment history coming soon…</p>
      </Card>
    </DashboardShell>
  );
}
