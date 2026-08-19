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
  interest_rate: number;
}

interface LoanRow {
  id: string;
  principal: number;
  interest_rate: number;
  total_interest: number | null;
  issue_date: string;
  due_date: string;
  status: 'ACTIVE' | 'REPAID' | 'DEFAULTED';
  totalRepaid: number;
  remainingBalance: number;
  member: { id: string; name: string };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function LoansPage() {
  return (
    <ProtectedRoute requiredRole={['GROUP_ADMIN', 'TREASURER']}>
      <LoansContent />
    </ProtectedRoute>
  );
}

function LoansContent() {
  const { user, token } = useAuth();
  const { addNotification } = useNotification();

  const [members, setMembers] = useState<Member[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Issue loan form
  const [memberId, setMemberId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Repayment form
  const [repayLoanId, setRepayLoanId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(todayStr());
  const [repayNotes, setRepayNotes] = useState('');

  const canIssueLoan = user?.role === 'GROUP_ADMIN';

  const loadData = async () => {
    if (!token) return;
    try {
      const [membersRes, groupsRes, loansRes] = await Promise.all([
        fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/loans', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const membersData = await membersRes.json();
      const groupsData = await groupsRes.json();
      const loansData = await loansRes.json();

      if (membersData.success) {
        setMembers(membersData.data.filter((m: Member) => m.role === 'MEMBER'));
      }

      if (groupsData.success && groupsData.data[0]) {
        setGroup(groupsData.data[0]);
        setInterestRate(String(groupsData.data[0].interest_rate));
      }

      if (loansData.success) {
        setLoans(loansData.data);
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

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !principal || !interestRate || !dueDate) {
      addNotification('Fill in all loan fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId,
          principal: Number(principal),
          interestRate: Number(interestRate),
          dueDate,
        }),
      });

      const data = await response.json();
      if (data.success) {
        addNotification('Loan issued', 'success');
        setMemberId('');
        setPrincipal('');
        setInterestRate(group ? String(group.interest_rate) : '');
        setDueDate('');
        loadData();
      } else {
        addNotification(data.error || 'Failed to issue loan', 'error');
      }
    } catch (error) {
      console.error('Issue loan error:', error);
      addNotification('Error issuing loan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoanId || !repayAmount) {
      addNotification('Select a loan and enter an amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/loans/${repayLoanId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(repayAmount),
          paidDate: repayDate,
          notes: repayNotes || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        addNotification(
          data.data.isFullyRepaid ? 'Repayment recorded — loan fully repaid' : 'Repayment recorded',
          'success'
        );
        setRepayLoanId('');
        setRepayAmount('');
        setRepayDate(todayStr());
        setRepayNotes('');
        loadData();
      } else {
        addNotification(data.error || 'Failed to record repayment', 'error');
      }
    } catch (error) {
      console.error('Repay error:', error);
      addNotification('Error recording repayment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');

  if (loading) {
    return (
      <DashboardShell maxWidth="4xl">
        <PageHeader title="Loans" />
        <div className="animate-pulse space-y-4">
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell maxWidth="4xl">
      <PageHeader title="Loans" subtitle="Issue loans and record repayments" />

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {canIssueLoan ? (
          <Card className="p-6">
            <form onSubmit={handleIssueLoan} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Issue loan</h2>

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
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Principal (RWF)</Label>
                <input
                  type="number"
                  min={0}
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className={inputClasses}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Max loan-to-savings ratio is 3x — the API will reject amounts above that.
                </p>
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
                <Label>Due date</Label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Issue loan'}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-6 text-sm text-slate-500">
            Only the Group Admin can issue new loans.
          </Card>
        )}

        <Card className="p-6">
          <form onSubmit={handleRepay} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Record repayment</h2>

            <div>
              <Label>Active loan</Label>
              <select
                value={repayLoanId}
                onChange={(e) => setRepayLoanId(e.target.value)}
                className={inputClasses}
                required
              >
                <option value="">Select a loan…</option>
                {activeLoans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.member.name} — {formatCurrency(l.remainingBalance)} remaining
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Amount (RWF)</Label>
              <input
                type="number"
                min={1}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className={inputClasses}
                required
              />
            </div>

            <div>
              <Label>Paid date</Label>
              <input
                type="date"
                value={repayDate}
                onChange={(e) => setRepayDate(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <input
                type="text"
                value={repayNotes}
                onChange={(e) => setRepayNotes(e.target.value)}
                className={inputClasses}
              />
            </div>

            <Button type="submit" variant="accent" disabled={submitting || activeLoans.length === 0}>
              {submitting ? 'Saving…' : 'Record repayment'}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">All loans</h2>
        {loans.length === 0 ? (
          <p className="text-sm text-slate-500">No loans issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 text-left font-medium">Member</th>
                  <th className="p-3 text-left font-medium">Principal</th>
                  <th className="p-3 text-left font-medium">Interest</th>
                  <th className="p-3 text-left font-medium">Repaid</th>
                  <th className="p-3 text-left font-medium">Remaining</th>
                  <th className="p-3 text-left font-medium">Due date</th>
                  <th className="p-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="p-3 text-slate-700">{l.member.name}</td>
                    <td className="p-3 text-slate-700">{formatCurrency(l.principal)}</td>
                    <td className="p-3 text-slate-700">{formatCurrency(l.total_interest || 0)}</td>
                    <td className="p-3 text-slate-700">{formatCurrency(l.totalRepaid)}</td>
                    <td className="p-3 text-slate-700">{formatCurrency(l.remainingBalance)}</td>
                    <td className="p-3 text-slate-500">{new Date(l.due_date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Badge>{l.status}</Badge>
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
