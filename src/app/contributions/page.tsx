'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useNotification } from '@/components/providers/notification-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { formatCurrency } from '@/lib/utils';
import { DashboardShell } from '@/components/ui/dashboard-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { inputClasses, Label } from '@/components/ui/field';

interface Member {
  id: string;
  name: string;
  phone: string | null;
  role: string;
}

interface Group {
  id: string;
  contribution_amount: number;
}

interface ContributionRow {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'PAID' | 'LATE' | 'MISSED';
  payment_method: string | null;
  member: { id: string; name: string };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ContributionsPage() {
  return (
    <ProtectedRoute requiredRole={['GROUP_ADMIN', 'TREASURER']}>
      <ContributionsContent />
    </ProtectedRoute>
  );
}

function ContributionsContent() {
  const { token } = useAuth();
  const { addNotification } = useNotification();

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [members, setMembers] = useState<Member[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [contributions, setContributions] = useState<ContributionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Single entry form state
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayStr());
  const [paidDate, setPaidDate] = useState(todayStr());
  const [status, setStatus] = useState<'PAID' | 'LATE' | 'MISSED'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Bulk entry form state
  const [bulkDueDate, setBulkDueDate] = useState(todayStr());
  const [bulkMethod, setBulkMethod] = useState('cash');
  const [bulkChecked, setBulkChecked] = useState<Record<string, boolean>>({});
  const [bulkAmounts, setBulkAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=bulk')) {
      setMode('bulk');
    }
  }, []);

  const loadData = async () => {
    if (!token) return;
    try {
      const [membersRes, groupsRes, contributionsRes] = await Promise.all([
        fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/contributions', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const membersData = await membersRes.json();
      const groupsData = await groupsRes.json();
      const contributionsData = await contributionsRes.json();

      if (membersData.success) {
        const memberList: Member[] = membersData.data.filter((m: Member) => m.role === 'MEMBER');
        setMembers(memberList);

        const defaultAmount = groupsData.success ? groupsData.data[0]?.contribution_amount : undefined;
        const initialAmounts: Record<string, string> = {};
        memberList.forEach((m) => {
          initialAmounts[m.id] = defaultAmount ? String(defaultAmount) : '';
        });
        setBulkAmounts(initialAmounts);
      }

      if (groupsData.success && groupsData.data[0]) {
        setGroup(groupsData.data[0]);
        setAmount(String(groupsData.data[0].contribution_amount));
      }

      if (contributionsData.success) {
        setContributions(contributionsData.data.slice(0, 25));
      }
    } catch (error) {
      console.error('Load error:', error);
      addNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetSingleForm = () => {
    setMemberId('');
    setAmount(group ? String(group.contribution_amount) : '');
    setDueDate(todayStr());
    setPaidDate(todayStr());
    setStatus('PAID');
    setPaymentMethod('cash');
    setNotes('');
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !amount) {
      addNotification('Select a member and enter an amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId,
          amount: Number(amount),
          dueDate,
          paidDate: status === 'MISSED' ? null : paidDate,
          status,
          paymentMethod: status === 'MISSED' ? null : paymentMethod,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        addNotification('Contribution recorded', 'success');
        resetSingleForm();
        loadData();
      } else {
        addNotification(data.error || 'Failed to record contribution', 'error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      addNotification('Error recording contribution', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = members.filter((m) => bulkChecked[m.id]);
    if (selected.length === 0) {
      addNotification('Select at least one member', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const results = await Promise.all(
        selected.map((m) =>
          fetch('/api/contributions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: m.id,
              amount: Number(bulkAmounts[m.id] || 0),
              dueDate: bulkDueDate,
              paidDate: bulkDueDate,
              status: 'PAID',
              paymentMethod: bulkMethod,
            }),
          }).then((r) => r.json())
        )
      );

      const failed = results.filter((r) => !r.success).length;
      const succeeded = results.length - failed;

      if (succeeded > 0) {
        addNotification(`Recorded ${succeeded} contribution(s)`, 'success');
      }
      if (failed > 0) {
        addNotification(`${failed} contribution(s) failed to record`, 'error');
      }

      setBulkChecked({});
      loadData();
    } catch (error) {
      console.error('Bulk submit error:', error);
      addNotification('Error recording bulk contributions', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell maxWidth="4xl">
        <PageHeader title="Contributions" />
        <div className="animate-pulse space-y-4">
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell maxWidth="4xl">
      <PageHeader title="Contributions" subtitle="Record member contributions for this cycle" />

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setMode('single')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === 'single'
              ? 'bg-brand-600 text-white'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Single entry
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === 'bulk'
              ? 'bg-brand-600 text-white'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Bulk entry (this meeting)
        </button>
      </div>

      {mode === 'single' ? (
        <Card className="mb-8 p-6">
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Record individual contribution</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Member</Label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className={inputClasses}
                  required
                >
                  <option value="">Select a member…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.phone ? `(${m.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Amount (RWF)</Label>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <Label>Due date</Label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'PAID' | 'LATE' | 'MISSED')}
                  className={inputClasses}
                >
                  <option value="PAID">Paid</option>
                  <option value="LATE">Late</option>
                  <option value="MISSED">Missed</option>
                </select>
              </div>

              {status !== 'MISSED' && (
                <>
                  <div>
                    <Label>Paid date</Label>
                    <input
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <Label>Payment method</Label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClasses}
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Record contribution'}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="mb-8 p-6">
          <form onSubmit={handleBulkSubmit}>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Bulk entry (this meeting)</h2>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <Label>Meeting / due date</Label>
                <input
                  type="date"
                  value={bulkDueDate}
                  onChange={(e) => setBulkDueDate(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <Label>Payment method</Label>
                <select
                  value={bulkMethod}
                  onChange={(e) => setBulkMethod(e.target.value)}
                  className={inputClasses}
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
            </div>

            <div className="mb-4 overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3 text-left font-medium">Paid</th>
                    <th className="p-3 text-left font-medium">Member</th>
                    <th className="p-3 text-left font-medium">Amount (RWF)</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={!!bulkChecked[m.id]}
                          onChange={(e) =>
                            setBulkChecked((prev) => ({ ...prev, [m.id]: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-3 text-slate-700">{m.name}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          value={bulkAmounts[m.id] ?? ''}
                          onChange={(e) =>
                            setBulkAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          className="w-32 rounded-lg border border-slate-200 px-2 py-1 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Record selected contributions'}
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Recent contributions</h2>
        {contributions.length === 0 ? (
          <p className="text-sm text-slate-500">No contributions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 text-left font-medium">Member</th>
                  <th className="p-3 text-left font-medium">Amount</th>
                  <th className="p-3 text-left font-medium">Due date</th>
                  <th className="p-3 text-left font-medium">Paid date</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="p-3 text-slate-700">{c.member.name}</td>
                    <td className="p-3 text-slate-700">{formatCurrency(c.amount)}</td>
                    <td className="p-3 text-slate-500">{new Date(c.due_date).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-500">
                      {c.paid_date ? new Date(c.paid_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3">
                      <Badge>{c.status}</Badge>
                    </td>
                    <td className="p-3 text-slate-500">{c.payment_method || '—'}</td>
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
