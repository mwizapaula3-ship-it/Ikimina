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
import { inputClasses, Label } from '@/components/ui/field';

interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  contribution_frequency: string;
  interest_rate: number;
  cycle_start_date: string;
  cycle_end_date: string | null;
  _count: { users: number };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function SuperAdminDashboard() {
  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <SuperAdminDashboardContent />
    </ProtectedRoute>
  );
}

function SuperAdminDashboardContent() {
  const { token } = useAuth();
  const { addNotification } = useNotification();

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionFrequency, setContributionFrequency] = useState('monthly');
  const [interestRate, setInterestRate] = useState('');
  const [cycleStartDate, setCycleStartDate] = useState(todayStr());
  const [cycleEndDate, setCycleEndDate] = useState('');

  const loadGroups = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setGroups(data.data);
      } else {
        addNotification('Failed to load groups', 'error');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      addNotification('Error loading groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setContributionAmount('');
    setContributionFrequency('monthly');
    setInterestRate('');
    setCycleStartDate(todayStr());
    setCycleEndDate('');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contributionAmount || !interestRate) {
      addNotification('Fill in name, contribution amount, and interest rate', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          contributionAmount: Number(contributionAmount),
          contributionFrequency,
          interestRate: Number(interestRate),
          cycleStartDate,
          cycleEndDate: cycleEndDate || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        addNotification('Group created', 'success');
        resetForm();
        setShowForm(false);
        loadGroups();
      } else {
        addNotification(data.error || 'Failed to create group', 'error');
      }
    } catch (error) {
      console.error('Create group error:', error);
      addNotification('Error creating group', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalMembers = groups.reduce((sum, g) => sum + g._count.users, 0);
  const avgInterestRate =
    groups.length > 0 ? groups.reduce((sum, g) => sum + g.interest_rate, 0) / groups.length : 0;

  if (loading) {
    return (
      <DashboardShell>
        <PageHeader title="Super Admin Dashboard" />
        <div className="grid animate-pulse grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Overview of every VSLA group on the platform"
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ New group'}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-4 sm:mb-8">
        <StatCard label="Total groups" value={groups.length} icon="🏘️" tone="slate" />
        <StatCard label="Total members" value={totalMembers} icon="👥" tone="brand" />
        <StatCard label="Avg. interest rate" value={`${avgInterestRate.toFixed(1)}%`} icon="📈" tone="accent" />
      </div>

      {showForm && (
        <Card className="mb-8 p-6">
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Create a new group</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Group name</Label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label>Contribution amount (RWF)</Label>
                <input
                  type="number"
                  min={0}
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <Label>Contribution frequency</Label>
                <select
                  value={contributionFrequency}
                  onChange={(e) => setContributionFrequency(e.target.value)}
                  className={inputClasses}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <Label>Interest rate (%)</Label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <Label>Cycle start date</Label>
                <input
                  type="date"
                  value={cycleStartDate}
                  onChange={(e) => setCycleStartDate(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <Label>Cycle end date (optional)</Label>
                <input
                  type="date"
                  value={cycleEndDate}
                  onChange={(e) => setCycleEndDate(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create group'}
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">All groups</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">No groups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 text-left font-medium">Group</th>
                  <th className="p-3 text-left font-medium">Members</th>
                  <th className="p-3 text-left font-medium">Contribution</th>
                  <th className="p-3 text-left font-medium">Frequency</th>
                  <th className="p-3 text-left font-medium">Interest</th>
                  <th className="p-3 text-left font-medium">Cycle</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-t border-slate-100">
                    <td className="p-3">
                      <p className="font-medium text-slate-900">{g.name}</p>
                      {g.description && <p className="text-xs text-slate-500">{g.description}</p>}
                    </td>
                    <td className="p-3 text-slate-700">{g._count.users}</td>
                    <td className="p-3 text-slate-700">{g.contribution_amount.toLocaleString()} RWF</td>
                    <td className="p-3 text-slate-500">{g.contribution_frequency}</td>
                    <td className="p-3 text-slate-700">{g.interest_rate}%</td>
                    <td className="p-3 text-slate-500">
                      {new Date(g.cycle_start_date).toLocaleDateString()}
                      {g.cycle_end_date ? ` – ${new Date(g.cycle_end_date).toLocaleDateString()}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
